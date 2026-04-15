# RED — Registro Escolar Digital — TODO

## Autenticação e Área Restrita
- [x] Criar tabela de escolas (schools) no banco de dados
- [x] Criar tabela de associação entre usuários e escolas
- [x] Implementar router de autenticação com procedures protegidas
- [x] Criar página de login com redirecionamento OAuth
- [x] Criar página de dashboard para escolas
- [x] Implementar visualização de contatos recebidos
- [x] Criar componente de navegação para usuários autenticados
- [x] Implementar logout e sessão
- [x] Criar testes para autenticação e dashboard
- [x] Validar fluxo completo de login → dashboard → logout

## Múltiplos Perfis de Usuário
- [x] Criar tabelas para professores, alunos e responsáveis
- [x] Implementar seletor de perfil na página de login
- [x] Criar dashboard para professores com turmas e alunos
- [x] Criar dashboard para alunos com notas e atividades
- [x] Criar dashboard para responsáveis com acompanhamento do aluno
- [x] Implementar routers específicos para cada perfil
- [x] Criar testes para todos os perfis
- [x] Validar fluxo completo com todos os perfis

## Melhorias de UX
- [x] Criar botão de login bem aparente na landing page
- [x] Adicionar botão flutuante de login
- [x] Melhorar visibilidade do CTA de login

## Onboarding Pós-Login
- [x] Criar página de onboarding com wizard de múltiplos passos
- [x] Implementar passo 1: Dados pessoais (nome, email, telefone)
- [x] Implementar passo 2: Seleção de escola ou criação de nova escola
- [x] Implementar passo 3: Dados profissionais (disciplina, turmas, etc)
- [x] Implementar passo 4: Confirmação e finalização
- [x] Criar routers backend para salvar dados de onboarding
- [x] Adicionar validação de formulários com feedback visual
- [x] Criar testes para fluxo de onboarding
- [x] Integrar onboarding ao fluxo de autenticação
