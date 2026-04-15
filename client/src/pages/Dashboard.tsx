/*
 * Dashboard — RED Registro Escolar Digital
 * Página protegida para escolas gerenciarem seus dados
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { LogOut, School, Mail, Phone, MapPin, Users, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);

  const mySchoolsQuery = trpc.schools.mySchools.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  const schoolContactsQuery = trpc.schools.contacts.useQuery(
    { schoolId: selectedSchool || 0 },
    { enabled: !!selectedSchool }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      navigate("/");
    },
    onError: () => {
      toast.error("Erro ao fazer logout");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (mySchoolsQuery.data && mySchoolsQuery.data.length > 0 && !selectedSchool) {
      setSelectedSchool(mySchoolsQuery.data[0].schoolId);
    }
  }, [mySchoolsQuery.data, selectedSchool]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-brand rounded-lg flex items-center justify-center">
              <span className="font-display text-xl font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">RED</h1>
              <p className="font-body text-xs text-gray-500">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-body text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="font-body text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-body text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <School size={18} className="text-red-brand" />
                Minhas Escolas
              </h2>

              {mySchoolsQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : mySchoolsQuery.data && mySchoolsQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {mySchoolsQuery.data.map(userSchool => (
                    <button
                      key={userSchool.schoolId}
                      onClick={() => setSelectedSchool(userSchool.schoolId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors font-body text-sm ${
                        selectedSchool === userSchool.schoolId
                          ? "bg-red-brand text-white"
                          : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <p className="font-medium">{userSchool.school.name}</p>
                      <p className={`text-xs ${selectedSchool === userSchool.schoolId ? "text-white/80" : "text-gray-500"}`}>
                        {userSchool.role}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="font-body text-sm text-gray-500">Nenhuma escola associada</p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {selectedSchool ? (
              <>
                {/* School Info */}
                {mySchoolsQuery.data && (
                  (() => {
                    const school = mySchoolsQuery.data.find(us => us.schoolId === selectedSchool)?.school;
                    return school ? (
                      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">{school.name}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { icon: Mail, label: "E-mail", value: school.email },
                            { icon: Phone, label: "Telefone", value: school.phone || "—" },
                            { icon: MapPin, label: "Endereço", value: school.address || "—" },
                            { icon: Users, label: "Alunos", value: school.studentCount ? school.studentCount.toString() : "—" },
                          ].map(item => {
                            const Icon = item.icon;
                            return (
                              <div key={item.label} className="flex items-start gap-3">
                                <Icon size={18} className="text-red-brand mt-1 flex-shrink-0" />
                                <div>
                                  <p className="font-body text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
                                  <p className="font-body text-sm font-medium text-gray-900">{item.value}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()
                )}

                {/* Contacts */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail size={18} className="text-red-brand" />
                    Contatos Recebidos
                  </h3>

                  {schoolContactsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : schoolContactsQuery.data && schoolContactsQuery.data.length > 0 ? (
                    <div className="space-y-3">
                      {schoolContactsQuery.data.map(contact => (
                        <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:border-red-brand transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-heading font-semibold text-gray-900">{contact.name}</p>
                              <p className="font-body text-sm text-gray-600">{contact.email}</p>
                            </div>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              contact.status === "novo"
                                ? "bg-blue-100 text-blue-700"
                                : contact.status === "respondido"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {contact.status === "novo" ? "Novo" : contact.status === "respondido" ? "Respondido" : "Descartado"}
                            </span>
                          </div>
                          <div className="mb-2">
                            <p className="font-body text-xs text-gray-500">
                              <strong>Escola:</strong> {contact.school} • <strong>Cargo:</strong> {contact.role}
                              {contact.students && ` • ${contact.students} alunos`}
                            </p>
                          </div>
                          {contact.message && (
                            <p className="font-body text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              "{contact.message}"
                            </p>
                          )}
                          <p className="font-body text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Mail size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="font-body text-gray-600">Nenhum contato recebido ainda</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <School size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="font-body text-gray-600">Selecione uma escola para visualizar detalhes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
