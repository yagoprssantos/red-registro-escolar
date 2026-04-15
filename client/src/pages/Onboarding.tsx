/*
 * Onboarding — RED Registro Escolar Digital
 * Wizard de múltiplos passos para preenchimento de dados pós-login
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type OnboardingStep = "personal" | "school" | "professional" | "confirmation";

interface PersonalData {
  name: string;
  email: string;
  phone: string;
}

interface SchoolData {
  schoolId?: number;
  schoolName?: string;
  schoolCity?: string;
  isNewSchool: boolean;
}

interface ProfessionalData {
  subject?: string;
  position: "teacher" | "admin" | "guardian";
  grade?: string;
}

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("personal");
  const [personalData, setPersonalData] = useState<PersonalData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
  });
  const [schoolData, setSchoolData] = useState<SchoolData>({
    isNewSchool: false,
  });
  const [professionalData, setProfessionalData] = useState<ProfessionalData>({
    position: "teacher",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar escolas disponíveis
  const { data: schools = [] } = trpc.schools.list.useQuery();

  // Mutation para salvar dados de onboarding
  const saveOnboardingMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("Onboarding concluído com sucesso!");
      navigate("/profile-selector");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar dados");
    },
  });

  const validatePersonalData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!personalData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    if (!personalData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!personalData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSchoolData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (schoolData.isNewSchool) {
      if (!schoolData.schoolName?.trim()) {
        newErrors.schoolName = "Nome da escola é obrigatório";
      }
      if (!schoolData.schoolCity?.trim()) {
        newErrors.schoolCity = "Cidade é obrigatória";
      }
    } else if (!schoolData.schoolId) {
      newErrors.schoolId = "Selecione uma escola";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProfessionalData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (professionalData.position === "teacher" && !professionalData.subject?.trim()) {
      newErrors.subject = "Disciplina é obrigatória";
    }
    if (professionalData.position === "guardian" && !professionalData.grade?.trim()) {
      newErrors.grade = "Série do aluno é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case "personal":
        if (validatePersonalData()) {
          setCurrentStep("school");
          setErrors({});
        }
        break;
      case "school":
        if (validateSchoolData()) {
          setCurrentStep("professional");
          setErrors({});
        }
        break;
      case "professional":
        if (validateProfessionalData()) {
          setCurrentStep("confirmation");
          setErrors({});
        }
        break;
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "school") setCurrentStep("personal");
    else if (currentStep === "professional") setCurrentStep("school");
    else if (currentStep === "confirmation") setCurrentStep("professional");
  };

  const handleComplete = () => {
    saveOnboardingMutation.mutate({
      personalData,
      schoolData,
      professionalData,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-brand/5 to-blue-dark/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-brand/5 to-blue-dark/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-brand rounded-lg mb-4">
            <span className="font-display text-xl font-bold text-white">R</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao RED!
          </h1>
          <p className="font-body text-gray-600">
            Vamos configurar sua conta em alguns passos simples
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {["personal", "school", "professional", "confirmation"].map((step, idx) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-semibold text-sm transition-all ${
                    step === currentStep
                      ? "bg-red-brand text-white scale-110"
                      : ["personal", "school", "professional", "confirmation"].indexOf(step) <
                        ["personal", "school", "professional", "confirmation"].indexOf(currentStep)
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {["personal", "school", "professional", "confirmation"].indexOf(step) <
                  ["personal", "school", "professional", "confirmation"].indexOf(currentStep) ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded-full transition-all ${
                      ["personal", "school", "professional", "confirmation"].indexOf(step) <
                      ["personal", "school", "professional", "confirmation"].indexOf(currentStep)
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Personal Data */}
          {currentStep === "personal" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
                  Dados Pessoais
                </h2>
                <p className="font-body text-gray-600">
                  Confirme e atualize suas informações pessoais
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-body font-medium text-gray-900">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={personalData.name}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, name: e.target.value })
                    }
                    className={errors.name ? "border-red-500" : ""}
                    placeholder="Seu nome completo"
                  />
                  {errors.name && (
                    <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="font-body font-medium text-gray-900">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalData.email}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, email: e.target.value })
                    }
                    className={errors.email ? "border-red-500" : ""}
                    placeholder="seu.email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="font-body font-medium text-gray-900">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={personalData.phone}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, phone: e.target.value })
                    }
                    className={errors.phone ? "border-red-500" : ""}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && (
                    <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: School Selection */}
          {currentStep === "school" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
                  Vinculação à Escola
                </h2>
                <p className="font-body text-gray-600">
                  Selecione sua escola ou crie uma nova
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setSchoolData({ ...schoolData, isNewSchool: false })}
                    className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                      !schoolData.isNewSchool
                        ? "border-red-brand bg-red-brand/5"
                        : "border-gray-200 hover:border-red-brand"
                    }`}
                  >
                    <p className="font-heading font-semibold text-gray-900">
                      Escola Existente
                    </p>
                    <p className="font-body text-xs text-gray-600">
                      Selecione de nossas escolas parceiras
                    </p>
                  </button>

                  <button
                    onClick={() => setSchoolData({ ...schoolData, isNewSchool: true })}
                    className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                      schoolData.isNewSchool
                        ? "border-red-brand bg-red-brand/5"
                        : "border-gray-200 hover:border-red-brand"
                    }`}
                  >
                    <p className="font-heading font-semibold text-gray-900">
                      Criar Nova Escola
                    </p>
                    <p className="font-body text-xs text-gray-600">
                      Registre sua instituição
                    </p>
                  </button>
                </div>

                {!schoolData.isNewSchool ? (
                  <div>
                    <Label className="font-body font-medium text-gray-900">
                      Selecione uma Escola
                    </Label>
                    <select
                      value={schoolData.schoolId || ""}
                      onChange={(e) =>
                        setSchoolData({
                          ...schoolData,
                          schoolId: parseInt(e.target.value),
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg font-body ${
                        errors.schoolId ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">-- Selecione uma escola --</option>
                      {schools.map((school: any) => (
                        <option key={school.id} value={school.id}>
                          {school.name} {school.city ? `- ${school.city}` : ""}
                        </option>
                      ))}
                    </select>
                    {errors.schoolId && (
                      <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.schoolId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="schoolName" className="font-body font-medium text-gray-900">
                        Nome da Escola
                      </Label>
                      <Input
                        id="schoolName"
                        type="text"
                        value={schoolData.schoolName || ""}
                        onChange={(e) =>
                          setSchoolData({
                            ...schoolData,
                            schoolName: e.target.value,
                          })
                        }
                        className={errors.schoolName ? "border-red-500" : ""}
                        placeholder="Nome da instituição"
                      />
                      {errors.schoolName && (
                        <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.schoolName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="schoolCity" className="font-body font-medium text-gray-900">
                        Cidade
                      </Label>
                      <Input
                        id="schoolCity"
                        type="text"
                        value={schoolData.schoolCity || ""}
                        onChange={(e) =>
                          setSchoolData({
                            ...schoolData,
                            schoolCity: e.target.value,
                          })
                        }
                        className={errors.schoolCity ? "border-red-500" : ""}
                        placeholder="Cidade da escola"
                      />
                      {errors.schoolCity && (
                        <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.schoolCity}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Professional Data */}
          {currentStep === "professional" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
                  Dados Profissionais
                </h2>
                <p className="font-body text-gray-600">
                  Informações sobre sua atuação na escola
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="font-body font-medium text-gray-900">
                    Qual é seu papel?
                  </Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { value: "teacher", label: "Professor" },
                      { value: "admin", label: "Administrador" },
                      { value: "guardian", label: "Responsável" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setProfessionalData({
                            ...professionalData,
                            position: option.value as any,
                          })
                        }
                        className={`p-3 border-2 rounded-lg transition-all ${
                          professionalData.position === option.value
                            ? "border-red-brand bg-red-brand/5"
                            : "border-gray-200 hover:border-red-brand"
                        }`}
                      >
                        <p className="font-body font-medium text-sm text-gray-900">
                          {option.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {professionalData.position === "teacher" && (
                  <div>
                    <Label htmlFor="subject" className="font-body font-medium text-gray-900">
                      Disciplina
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      value={professionalData.subject || ""}
                      onChange={(e) =>
                        setProfessionalData({
                          ...professionalData,
                          subject: e.target.value,
                        })
                      }
                      className={errors.subject ? "border-red-500" : ""}
                      placeholder="Ex: Matemática, Português, etc"
                    />
                    {errors.subject && (
                      <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.subject}
                      </p>
                    )}
                  </div>
                )}

                {professionalData.position === "guardian" && (
                  <div>
                    <Label htmlFor="grade" className="font-body font-medium text-gray-900">
                      Série do Aluno
                    </Label>
                    <Input
                      id="grade"
                      type="text"
                      value={professionalData.grade || ""}
                      onChange={(e) =>
                        setProfessionalData({
                          ...professionalData,
                          grade: e.target.value,
                        })
                      }
                      className={errors.grade ? "border-red-500" : ""}
                      placeholder="Ex: 6º ano, 8º ano, etc"
                    />
                    {errors.grade && (
                      <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.grade}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === "confirmation" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">
                  Confirme seus Dados
                </h2>
                <p className="font-body text-gray-600">
                  Verifique as informações antes de finalizar
                </p>
              </div>

              <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                <div className="border-b border-gray-200 pb-4">
                  <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Dados Pessoais
                  </p>
                  <p className="font-heading font-semibold text-gray-900">
                    {personalData.name}
                  </p>
                  <p className="font-body text-sm text-gray-600">{personalData.email}</p>
                  <p className="font-body text-sm text-gray-600">{personalData.phone}</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Escola
                  </p>
                  <p className="font-heading font-semibold text-gray-900">
                    {schoolData.isNewSchool
                      ? schoolData.schoolName
                      : schools.find((s: any) => s.id === schoolData.schoolId)?.name}
                  </p>
                  <p className="font-body text-sm text-gray-600">
                    {schoolData.isNewSchool
                      ? schoolData.schoolCity
                      : (schools.find((s: any) => s.id === schoolData.schoolId) as any)?.city}
                  </p>
                </div>

                <div>
                  <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Papel
                  </p>
                  <p className="font-heading font-semibold text-gray-900">
                    {professionalData.position === "teacher"
                      ? `Professor de ${professionalData.subject}`
                      : professionalData.position === "admin"
                      ? "Administrador"
                      : `Responsável - ${professionalData.grade}`}
                  </p>
                </div>
              </div>

              <div className="bg-blue-dark/5 border border-blue-dark/20 rounded-lg p-4">
                <p className="font-body text-sm text-blue-dark">
                  ✓ Seus dados serão salvos de forma segura e você poderá editá-los a qualquer momento em suas configurações.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            <Button
              onClick={handlePreviousStep}
              disabled={currentStep === "personal"}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Voltar
            </Button>

            {currentStep !== "confirmation" ? (
              <Button
                onClick={handleNextStep}
                className="ml-auto flex items-center gap-2 bg-red-brand hover:bg-[#6b0d19]"
              >
                Próximo
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saveOnboardingMutation.isPending}
                className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {saveOnboardingMutation.isPending ? "Finalizando..." : "Finalizar Onboarding"}
                <CheckCircle2 size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
