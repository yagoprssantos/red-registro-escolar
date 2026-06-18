/\*

- RED — Registro Escolar Digital
- Especificação Completa de Telas por Perfil de Usuário
- Design: Editorial Moderno — "Clareza Pedagógica"
- Paleta: #8b1120 vermelho · #1f3a5f azul · #f9f6f2 off-white
- Tipografia: Playfair Display (h1-h3) · Raleway (h4-h6) · Inter (corpo) · Barlow Condensed (dados)
- Abordagem: Mobile-first — maior parte dos usuários acessa pelo celular
- Perfis: Aluno · Professor · Escola (Gestor) · Responsável
- Base estrutural: src/app/routes/pages/dashboard/{student,teacher,school,guardian}/
  \*/

---

# RED — Especificação de Telas por Perfil

## Índice

1. [Fundamentos Compartilhados](#1-fundamentos-compartilhados)
2. [Perfil: Aluno](#2-perfil-aluno--portal-do-estudante)
3. [Perfil: Professor](#3-perfil-professor--portal-docente)
4. [Perfil: Escola / Núcleo Gestor](#4-perfil-escola--portal-de-gestão)
5. [Perfil: Responsável](#5-perfil-responsável--portal-da-família)
6. [Tabela Comparativa por Perfil](#6-tabela-comparativa-entre-perfis)
7. [Decisões Mobile-First](#7-decisões-mobile-first)

---

## 1. Fundamentos Compartilhados

### 1.1 DashboardShell — Wrapper de todas as telas autenticadas

**Arquivo:** `src/app/routes/pages/dashboard/DashboardShell.tsx`

**Layout desktop (≥ 768px):**

```
┌──────────┬────────────────────────────────────┐
│ SIDEBAR  │  TOPBAR (breadcrumb + perfil + sino)│
│ 240px    ├────────────────────────────────────┤
│ azul     │                                    │
│ #1f3a5f  │   <Outlet /> — conteúdo da rota   │
│          │                                    │
│          │                                    │
│ [perfil  │                                    │
│  + nome] │                                    │
└──────────┴────────────────────────────────────┘
```

**Layout mobile (< 768px):**

```
┌──────────────────────────────────────────────┐
│  TOPBAR: Logo RED  ·  sino 🔔  ·  avatar     │
├──────────────────────────────────────────────┤
│                                              │
│    <Outlet /> — conteúdo da rota             │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│ BOTTOM NAV: ícones das seções principais     │
└──────────────────────────────────────────────┘
```

**Sidebar (desktop) — design detalhado:**

- Fundo: `bg-blue-brand` (#1f3a5f)
- Largura: 240px fixo, `h-full`, `overflow-y-auto`
- Logo no topo: "RED" em `font-display` (Playfair Display) tamanho 22px, cor branca + linha vermelha `section-divider` de 40px abaixo
- Itens de navegação: `text-sm font-heading` (Raleway), cor `text-white/80`, ícone Lucide 18px à esquerda
- Item ativo: fundo `bg-blue-brand-dark`, borda esquerda `border-l-2 border-red-brand`, texto branco opaco total
- Hover: `bg-blue-brand-light/40`, transição 220ms
- Avatar + nome do usuário no rodapé da sidebar, separados por linha `border-t border-blue-brand-dark`
- Badge de perfil (ALUNO / PROFESSOR / ESCOLA / RESPONSÁVEL) em pill pequeno abaixo do nome

**Topbar (mobile):**

- Fundo: `bg-background` com `border-b border-border`, `sticky top-0 z-40`
- Esquerda: ícone hamburguer (abre drawer lateral) + logo "RED" pequeno
- Direita: sino 🔔 com badge vermelho (contagem de notificações não lidas) + avatar circular

**Bottom Navigation (mobile):**

- Fundo: `bg-background border-t border-border`, `sticky bottom-0`
- 4–5 ícones centralizados dependendo do perfil
- Ativo: ícone e label em `text-red-brand`, ícone preenchido
- Inativo: `text-muted-foreground`, ícone outline
- Altura: 56px, tap targets mínimos de 44px

---

### 1.2 Sistema de Design — Tokens Aplicados por Contexto

| Elemento                   | Token / Classe                                                 | Valor                 |
| -------------------------- | -------------------------------------------------------------- | --------------------- |
| Título de seção (h1)       | `font-display text-2xl md:text-3xl`                            | Playfair Display Bold |
| Subtítulo de card (h4)     | `font-heading text-base font-semibold`                         | Raleway SemiBold      |
| Corpo de texto             | `font-body text-sm text-muted-foreground`                      | Inter Regular         |
| Números e dados            | `font-condensed text-2xl font-bold`                            | Barlow Condensed Bold |
| Cor de destaque            | `text-red-brand` ou `bg-red-brand`                             | #8b1120               |
| Cor de informação          | `text-blue-brand` ou `bg-blue-brand`                           | #1f3a5f               |
| Fundo de seção alternada   | `bg-off-white`                                                 | #f9f6f2               |
| Borda de destaque esquerda | `accent-left`                                                  | 4px solid #8b1120     |
| Linha divisória de seção   | `section-divider`                                              | 60px × 3px #8b1120    |
| Animação de entrada        | `animate-fade-in-up`                                           | fadeInUp 0.6s ease    |
| Alerta crítico             | `bg-red-brand/10 border border-red-brand text-red-brand`       |                       |
| Alerta de aviso            | `bg-amber-50 border border-amber-300 text-amber-800`           |                       |
| Alerta informativo         | `bg-blue-brand/10 border border-blue-brand/30 text-blue-brand` |                       |

---

### 1.3 Componentes de UI Reutilizáveis

- **StatCard** — card com número grande (Barlow Condensed), label pequeno, ícone colorido, borda accent-left opcional
- **AlertBanner** — faixa de alerta com ícone, texto e CTA, variantes: critical / warning / info / success
- **SectionHeader** — título h2 (Playfair) + linha `section-divider` vermelha + subtítulo opcional
- **DataTable** — tabela responsiva que vira lista de cards em mobile
- **EmptyState** — ilustração + texto + CTA quando não há dados
- **NotificationBadge** — badge circular sobre ícone do sino
- **ProfileChip** — pill com nome do perfil ativo
- **BottomNav** — navegação inferior mobile, específica por perfil

---

## 2. Perfil: Aluno — Portal do Estudante

**Rota base:** `/dashboard/student`
**Arquivo shell:** `src/app/routes/pages/dashboard/student/`

**Sidebar / Bottom Nav do aluno:**

| Ícone | Label       | Rota                             |
| ----- | ----------- | -------------------------------- |
| 🏠    | Início      | `/dashboard/student`             |
| 👤    | Meu Perfil  | `/dashboard/student/profile`     |
| 🏫    | Minha Turma | `/dashboard/student/class`       |
| 🗓️    | Horário     | `/dashboard/student/schedule`    |
| 📅    | Calendário  | `/dashboard/student/calendar`    |
| 📋    | Boletim     | `/dashboard/student/grades`      |
| ✅    | Frequência  | `/dashboard/student/attendance`  |
| 📝    | Avaliações  | `/dashboard/student/assessments` |
| 🔗    | Plataformas | `/dashboard/student/links`       |
| 💬    | Comentários | `/dashboard/student/comments`    |

> Mobile: bottom nav mostra apenas Início, Frequência, Boletim, Comentários e "Mais" (abre drawer com o restante).

---

### 2.1 Dashboard — Início do Aluno

**Saudação personalizada:**

- `"Olá, [Nome Curto] 👋"` — `font-display text-2xl text-foreground`
- Linha abaixo: `"[Ano]º ano · [Curso] · Turma [X]"` — `font-body text-sm text-muted-foreground`
- Exemplo: _"2º ano · Enfermagem · Turma 2A"_

**Bloco de alerta Pé de Meia (condicional — aparece se frequência ≤ 85%):**

```
╔══════════════════════════════════════════════╗
║  ⚠️  ATENÇÃO — Pé de Meia em risco          ║
║  Sua frequência está em 82%. O mínimo        ║
║  para não bloquear é 80%. Você pode          ║
║  faltar mais 2 vezes neste período.          ║
║  [Ver detalhes →]                            ║
╚══════════════════════════════════════════════╝
```

- Fundo: `bg-amber-50 border border-amber-300`
- Se < 80%: fundo vermelho `bg-red-brand/10 border border-red-brand`, texto: _"Pé de Meia BLOQUEADO"_

**Cards de métricas rápidas (grid 2×2 em mobile, 4×1 em desktop):**

| Card          | Dado exibido                 | Design                                                        |
| ------------- | ---------------------------- | ------------------------------------------------------------- |
| Frequência    | `87%` + barra de progresso   | Número em Barlow Condensed, verde se ≥ 80%, vermelho se < 80% |
| Média Geral   | `7.4` + seta de tendência ↑↓ | Número em Barlow Condensed Bold                               |
| Próxima Prova | `"Mat — 20/06"`              | Texto pequeno, ícone calendário, destaque vermelho            |
| Avisos        | `3 não lidos`                | Badge numérico vermelho, ícone sino                           |

**Seção "Próximos Eventos" (lista vertical em mobile):**

- Máximo 3 eventos
- Cada item: ícone de tipo (📝 prova / 🎉 evento / 🚪 saída) + data + título
- CTA: _"Ver calendário completo →"_

**Seção "Últimos Comentários" (carrossel horizontal em mobile):**

- Máximo 2–3 cards
- Card: categoria (⭐ elogio / 🔄 melhoria) + trecho do texto + data
- **SEM nome do professor** (anonimizado)
- CTA: _"Ver todos →"_

**Links rápidos de plataformas parceiras (grid 2×3 em mobile):**

- Cada link: ícone/logo da plataforma + nome
- Plataformas: Google Classroom, SISEDU, SIC, Enem na Rede, Conexão Educação
- Abre em nova aba

---

### 2.2 Dados Pessoais / Ficha Biográfica

> **Nota:** Essas duas telas são agrupadas em uma só com abas internas.

**Layout:**

- Header: `"Meus Dados"` com `section-divider` vermelho
- Aba 1: **Dados Pessoais** — Nome completo, CPF (parcialmente mascarado), data de nascimento, endereço, e-mail, telefone
- Aba 2: **Ficha Biográfica** — dados de filiação, naturalidade, etnia (autodeclaração), necessidades especiais (PNE), responsável vinculado

**Design de cada campo:**

- Label: `font-heading text-xs text-muted-foreground uppercase tracking-wide`
- Valor: `font-body text-sm text-foreground`
- Fundo do card: `bg-card rounded-lg border border-border p-4`
- Campos sensíveis (CPF): botão olho para revelar/ocultar

**Diferença vs outros perfis:**

- Aluno: apenas leitura, sem edição
- Escola: edição completa com validação
- Professor e Responsável: não veem esta tela do aluno

---

### 2.3 Minha Turma

**Informações da turma:**

- Título: _"[Ano]º ano [Turno] — [Curso]"_ — ex: _"2º ano Matutino — Enfermagem"_
- Turno, número de alunos, sala
- Coordenador responsável (nome)

**Lista de professores da turma (cards):**

```
┌────────────────────────────────────┐
│  [Avatar]  Prof. Ana Costa         │
│            Matemática              │
│            📅 Seg / Qua / Sex      │
└────────────────────────────────────┘
```

- Avatar circular placeholder com inicial do nome
- Disciplina em `text-blue-brand font-heading`
- Horário dos dias de aula

**Estrutura de turmas do RED (para contexto):**

- 1º, 2º ou 3º ano
- Por ano: 4 cursos técnicos — Administração, Enfermagem, Eventos, Redes de Computadores
- Turmas nomeadas: 1A/1B (Administração), 1C (Enfermagem), 1D (Eventos), 1E (Redes), etc.

**Diferença vs outros perfis:**

- Professor: vê a turma completa com lista de alunos e dados de frequência/desempenho
- Escola: vê todas as turmas com gestão de matrículas
- Responsável: não tem esta tela (acessa dados do filho diretamente)

---

### 2.4 Horário de Aulas

**Desktop:** grade semanal (seg-sáb × horários do dia)

```
         | Seg  | Ter  | Qua  | Qui  | Sex  |
07:00–08h| Mat  | Port | Bio  | Mat  | Quim |
08:00–09h| Mat  | Port | Bio  | Mat  | Quim |
  ...
```

**Mobile:** seletor de dia (tabs horizontais rolável) → lista de aulas do dia selecionado

```
[Seg] [Ter] [Qua] [Qui] [Sex]
─────────────────────────────
07:00 – 08:40  Matemática
               Prof. Ana Costa
───────────────────────────
08:40 – 10:20  Português
               Prof. Marcos Lima
```

**Design:**

- Cada slot de aula: card com borda esquerda na cor da disciplina (mapeamento de cores por matéria)
- Aula atual destacada com fundo `bg-red-brand/5 border-l-4 border-red-brand`
- Dia atual destacado na tab com `text-red-brand font-semibold`

**Diferença vs outros perfis:**

- Professor: vê seu próprio horário + as turmas de cada slot
- Escola: vê e edita os horários de todas as turmas
- Responsável: não tem acesso ao horário detalhado

---

### 2.5 Calendário Letivo

**Visualização mensal (padrão):**

- Grade de calendário com eventos marcados
- Badge colorido por tipo de evento:
  - 📝 Vermelho (`#8b1120`): provas e avaliações
  - 🎉 Azul (`#1f3a5f`): eventos culturais/comemorações
  - 🚪 Âmbar: saídas antecipadas
  - 📅 Cinza: feriados

**Ao clicar em um dia com evento:**

- Bottom sheet (mobile) / modal (desktop) com lista dos eventos do dia
- Cada evento: título, descrição, horário, tipo

**Filtros disponíveis:**

- Tipo de evento (provas / feriados / eventos / saídas)
- Mês / bimestre

**Diferença vs outros perfis:**

- Escola: adiciona/edita eventos; define público-alvo (turma específica, série, escola)
- Professor: vê e tem atalho para criar provas associadas ao calendário
- Responsável: vê apenas eventos das turmas do filho + recebe notificações

---

### 2.6 Boletim

**Seletor de bimestre/período:**

- Tabs horizontais: 1º Bim · 2º Bim · 3º Bim · 4º Bim · Anual
- Em mobile: scroll horizontal de tabs

**Por disciplina (card por matéria):**

```
┌────────────────────────────────────────────┐
│ Matemática                                 │
│ ─────────────────────────────────────────  │
│  Nota 1: 7,5    Nota 2: 8,0               │
│  Nota 3: 6,5    Nota 4: 9,0               │
│                                            │
│  Média do bimestre: ██████████░░ 7,75     │
│  Status: ✅ Aprovado                       │
└────────────────────────────────────────────┘
```

- Média em `font-condensed text-2xl text-red-brand`
- Barra de progresso visual: verde ≥ 6, âmbar 4–5,9, vermelho < 4
- Status: ✅ Aprovado / ⚠️ Em recuperação / ❌ Reprovado

**Card de média geral (topo da página):**

- Número grande em Barlow Condensed Bold
- Situação geral do período
- Mês de referência

**O que o aluno NÃO vê:**

- Média da turma (apenas referência própria)
- Comparativo com outros alunos
- Comentários do professor sobre as notas (somente na seção de Comentários)

**Diferença vs outros perfis:**

- Responsável: vê o mesmo boletim + identifica de qual professor veio cada nota + vê comparativo da turma (média geral sem identificação individual)
- Professor: planilha de notas da turma inteira, editável
- Escola: relatórios de desempenho por turma, curso, disciplina

---

### 2.7 Frequência — tela mais importante para o aluno

**Topo da tela — bloco Pé de Meia:**

```
┌─────────────────────────────────────────────────┐
│  💰 Pé de Meia                                  │
│                                                 │
│  Frequência atual: 83%    Meta: ≥ 80%           │
│  ████████████████░░░░ 83%                       │
│                                                 │
│  Status: ✅ EM DIA                              │
│  Você pode faltar mais 4 vezes este bimestre    │
│  sem prejudicar seu Pé de Meia.                 │
└─────────────────────────────────────────────────┘
```

**Variantes do bloco Pé de Meia:**

- ≥ 85%: fundo `bg-green-50`, texto verde, badge "Seguro"
- 80–84%: fundo `bg-amber-50`, alerta amarelo, contagem de faltas restantes com destaque
- < 80%: fundo `bg-red-brand/10`, borda vermelha, badge "PÉ DE MEIA BLOQUEADO" em destaque total

**Resumo geral (abaixo do bloco Pé de Meia):**

- Total de faltas no período: número em Barlow Condensed
- % de presença geral: barra de progresso + percentual
- Faltas justificadas vs não justificadas: divisão visual

**Por disciplina (tabela → cards em mobile):**

```
Disciplina    | Aulas | Faltas | Presenças | %    | Status
Matemática    |  40   |   5    |    35     | 87,5%| ✅
Português     |  40   |   3    |    37     | 92,5%| ✅
Biologia      |  20   |   6    |    14     | 70%  | ❌
```

- Em mobile: um card por disciplina com a mesma informação
- Barra de progresso colorida dentro de cada card
- Linha ou card em vermelho quando disciplina está abaixo do limite

**O que o aluno NÃO vê:**

- Nome do professor que registrou a falta
- Possibilidade de justificar (isso é função do responsável)
- Dados de frequência de outros alunos

**Diferença vs outros perfis:**

- Responsável: vê os mesmos dados + nome do professor que registrou + botão "Justificar" + comparativo com média da turma + alerta de 3 faltas consecutivas
- Professor: vê frequência de toda a turma, aluno por aluno, por sessão
- Escola: relatórios de frequência por turma, disciplina, professor, período

---

### 2.8 Avaliações Online

**Finalidade:** acesso a avaliações digitais e provas do ENEM/plataformas externas.

**Layout:**

- Seção "Próximas Avaliações" — lista com data, disciplina, tipo (online/presencial)
- Seção "Avaliações Realizadas" — histórico com nota obtida
- Seção "Plataformas de Avaliação" — links externos

**Card de avaliação:**

```
┌────────────────────────────────────────┐
│ 📝 Prova de Matemática — 1º Bimestre  │
│    Data: 15/04 às 08:00               │
│    Tipo: Presencial                   │
│    Status: Agendada                   │
│    [Adicionar ao calendário]          │
└────────────────────────────────────────┘
```

**Integrações listadas:**

- Google Classroom → abre app/web
- SISEDU → sistema estadual
- SIC → sistema de controle
- Enem na Rede → simulados ENEM
- Conexão Educação → materiais pedagógicos

---

### 2.9 Comentários (Visão do Aluno)

**Layout:**

- Filtro por categoria: Todos / ⭐ Elogios / 🔄 Pontos de Melhoria
- Filtro por período: bimestre ou mês

**Card de comentário:**

```
┌────────────────────────────────────────┐
│ ⭐ Elogio                  12/06/2025  │
│ ──────────────────────────────────────│
│ "Excelente participação nas aulas e   │
│  ótimo desempenho nas apresentações." │
│                                       │
│ [Professor não identificado]          │
└────────────────────────────────────────┘
```

- **O campo de autor é SEMPRE omitido** — o aluno nunca sabe quem escreveu
- Ícone e cor mudam por categoria: ⭐ dourado para elogio, 🔄 azul para melhoria
- Data visível

**Diferença crítica vs responsável:**

- Responsável: campo `"Prof. Ana Costa — Matemática"` aparece no lugar de `[Professor não identificado]`
- Responsável: vê comentários com `visibility = 'guardian'` que o aluno não vê
- Escola: vê todos os comentários, incluindo `visibility = 'school_only'`

---

## 3. Perfil: Professor — Portal Docente

**Rota base:** `/dashboard/teacher`
**Arquivo shell:** `src/app/routes/pages/dashboard/teacher/`

**Sidebar / Bottom Nav do professor:**

| Ícone | Label         | Rota                                |
| ----- | ------------- | ----------------------------------- |
| 🏠    | Início        | `/dashboard/teacher`                |
| 👥    | Minhas Turmas | `/dashboard/teacher/classes`        |
| ✅    | Chamada       | `/dashboard/teacher/attendance`     |
| 📝    | Avaliações    | `/dashboard/teacher/assessments`    |
| 💬    | Comentários   | `/dashboard/teacher/comments`       |
| 📢    | Comunicados   | `/dashboard/teacher/communications` |

> Mobile: bottom nav mostra Início, Chamada, Avaliações, Comentários, Mais.

---

### 3.1 Dashboard — Início do Professor

**Saudação:**

- `"Bom dia, Prof. [Sobrenome]"` com data atual
- Badge das disciplinas: `"Matemática · Física"`

**Bloco de ação rápida — "Chamadas pendentes hoje":**

```
╔══════════════════════════════════════════════╗
║  ⏰ Você tem 2 turmas sem chamada hoje       ║
║                                              ║
║  2A — Matemática · 07:00                    ║
║  3B — Matemática · 09:00                    ║
║                                              ║
║  [Lançar Chamada Agora →]                   ║
╚══════════════════════════════════════════════╝
```

- Este bloco some após todas as chamadas do dia serem lançadas
- Fundo: `bg-red-brand/5 border border-red-brand/20`

**Cards de métricas:**

| Card                | Dado                  | Design                        |
| ------------------- | --------------------- | ----------------------------- |
| Minhas Turmas       | 4 turmas / 120 alunos | Número em Barlow Condensed    |
| Alunos em alerta    | 7 alunos < 80% freq.  | Fundo âmbar, clicável → lista |
| Chamadas hoje       | 2/4 lançadas          | Barra de progresso            |
| Comentários criados | 15 este mês           | Número com tendência          |

**Seção "Alunos em alerta de frequência":**

- Lista de até 5 alunos com frequência crítica
- Nome do aluno + turma + % de presença
- CTA: _"Ver todos →"_

---

### 3.2 Minhas Turmas

**Grid de cards de turmas (2 colunas em mobile, 3–4 em desktop):**

```
┌─────────────────────┐  ┌─────────────────────┐
│ 2A — Matemática     │  │ 3B — Matemática     │
│ 28 alunos           │  │ 25 alunos           │
│ ████████░░ 87%      │  │ ██████████ 92%      │
│ presença média      │  │ presença média      │
│ [Abrir Turma →]     │  │ [Abrir Turma →]     │
└─────────────────────┘  └─────────────────────┘
```

**Ao abrir uma turma — lista de alunos:**

- Tabela (desktop) / lista de cards (mobile)
- Por aluno: foto placeholder + nome + % de presença + média de notas
- Cor de frequência: verde ≥ 80%, âmbar 75–79%, vermelho < 75%
- Ação rápida por aluno: 👁️ Ver perfil · 💬 Comentar

**Perfil resumido do aluno (modal):**

- Nome, matrícula, turma
- Frequência apenas desta disciplina
- Notas nesta disciplina
- Botão "Criar comentário sobre este aluno"
- **NÃO exibe** dados de outras disciplinas

**Diferença crítica vs escola:**

- Professor: só vê alunos das próprias turmas, só na própria disciplina
- Escola: vê todos os alunos, todas as turmas, todas as disciplinas

---

### 3.3 Chamada — Tela mais usada pelo professor

**Design principle:** Velocidade máxima. Um toque por aluno. Fechar em menos de 60 segundos para uma turma de 30.

**Step 1 — Selecionar turma:**

- Cards grandes e tocáveis das turmas do professor
- Clique direto, sem dropdown
- Indica se já há chamada lançada hoje (badge verde ✓)

**Step 2 — Confirmar data e disciplina:**

- Data: default = hoje, selecionável (não pode ser futura)
- Disciplina: pré-selecionada (se professor só tem uma por turma)
- Botão "Iniciar Chamada"

**Step 3 — Lista de alunos com toggle:**

```
┌─────────────────────────────────────────────┐
│  2A — Matemática · 12/06/2025              │
│  28 alunos · 10:00                         │
├─────────────────────────────────────────────┤
│  ✅ Ana Beatriz Costa                       │
│  ✅ Bruno Silva Ferreira                    │
│  ❌ Carlos Eduardo Lima         [ausente]   │
│  ✅ Daniela Santos Oliveira                 │
│  ...                                        │
├─────────────────────────────────────────────┤
│  Presentes: 25 · Faltas: 3                 │
│  [Salvar Chamada]                           │
└─────────────────────────────────────────────┘
```

- Padrão: todos presentes (✅ verde) — professor só muda os ausentes
- Toque no nome → alterna entre ✅ presente e ❌ ausente
- Nome em `font-body text-base`, altura de linha 52px (mobile tap target)
- Contador atualiza em tempo real no rodapé
- Ao salvar: feedback de sucesso + notificações disparadas aos responsáveis dos ausentes

**Histórico de chamadas (aba):**

- Lista de sessões passadas: data + turma + presentes/faltas
- Chamada do mesmo dia: editável até meia-noite
- Chamadas de outros dias: somente leitura

**Diferença vs escola:**

- Professor: registra chamada, vê histórico das próprias chamadas
- Escola: vê todas as chamadas de todos os professores, pode rever e gerar relatórios

---

### 3.4 Avaliações — Lançamento de Notas

**Layout em duas partes:**

1. Lista de avaliações criadas (por turma)
2. Planilha de notas ao abrir uma avaliação

**Criar nova avaliação:**

```
┌─────────────────────────────────────────────┐
│  Nova Avaliação                             │
│  ──────────────────────────────────────     │
│  Título: [Prova 1 — 1º Bimestre       ]     │
│  Turma:  [2A — Matemática      ▾]           │
│  Nota máxima: [10,0]                        │
│  Data: [12/06/2025]                         │
│  Tipo: ○ Prova  ○ Trabalho  ○ Participação  │
│                                             │
│  [Criar Avaliação]                          │
└─────────────────────────────────────────────┘
```

**Planilha de notas (após criar avaliação):**

```
Aluno               | Nota (máx 10,0)
Ana Beatriz Costa   | [7,5 ]
Bruno Silva         | [8,0 ]
Carlos Eduardo      | [6,0 ]
...
                    | Média: 7,2
```

- Campo de nota: input numérico com validação `0 ≤ nota ≤ maxScore`
- Em mobile: lista vertical de alunos com campo de nota por linha
- Salva automaticamente (upsert) a cada alteração
- Média da turma calculada em tempo real

**Diferença vs escola:**

- Professor: lança e edita notas das próprias turmas
- Escola: relatório consolidado, sem poder editar individual

---

### 3.5 Comentários — Criação e Histórico

**Criar novo comentário:**

- Campo de busca de aluno (autocomplete, restrito à própria turma)
- Texto livre (máx. 500 caracteres, contador regressivo)
- Categoria:
  - ⭐ Elogio — texto positivo, reconhecimento
  - 🔄 Ponto de Melhoria — orientação construtiva
- Visibilidade (select ou botões de rádio):
  - 👦 Aluno — o aluno vê, sem nome do professor
  - 👨‍👩‍👧 Responsável — só responsável vê, com nome do professor
  - 👥 Todos — aluno (sem autor) + responsável (com autor)
  - 🏫 Apenas Escola — só o núcleo gestor vê

**Preview dinâmico abaixo do formulário:**

- Caixa mostrando: _"Este comentário será visto por: Aluno (sem identificação) e Responsável (com seu nome)"_

**Histórico de comentários criados:**

- Filtro: por aluno / por turma / por categoria / por período
- Card por comentário: aluno, categoria, trecho, data, visibilidade escolhida
- Ação: excluir (soft-delete, com confirmação)

**Diferença vs escola:**

- Professor: cria e vê os próprios comentários
- Escola: vê TODOS os comentários de TODOS os professores, incluindo `school_only`
- Responsável: vê comentários com `visibility = 'guardian'` ou `'all'`, com nome do professor
- Aluno: vê comentários com `visibility = 'student'` ou `'all'`, sem nome

---

### 3.6 Comunicados (Visão do Professor)

- Feed cronológico de comunicados publicados pela escola
- Status de leitura: badge "Não lido" em vermelho, "Lido" em cinza
- Ao abrir: conteúdo completo + botão "Marcar como lido"
- Sem opção de publicar (professor recebe, não envia)

**Diferença vs escola:**

- Escola: publica e vê quem leu
- Professor: só recebe e lê

---

## 4. Perfil: Escola — Portal de Gestão

**Rota base:** `/dashboard/school`
**Arquivo shell:** `src/app/routes/pages/dashboard/school/`

**Sidebar / Bottom Nav da escola:**

| Ícone | Label         | Rota                               |
| ----- | ------------- | ---------------------------------- |
| 🏠    | Dashboard     | `/dashboard/school`                |
| 👥    | Alunos        | `/dashboard/school/students`       |
| 🏛️    | Turmas        | `/dashboard/school/classes`        |
| 👩‍🏫    | Professores   | `/dashboard/school/teachers`       |
| 👨‍👩‍👧    | Responsáveis  | `/dashboard/school/guardians`      |
| 📊    | Relatórios    | `/dashboard/school/reports`        |
| 📢    | Comunicados   | `/dashboard/school/communications` |
| 📅    | Eventos       | `/dashboard/school/events`         |
| ⚙️    | Configurações | `/dashboard/school/settings`       |

> Mobile: bottom nav principal mostra Dashboard, Alunos, Comunicados, Relatórios, Mais.

---

### 4.1 Dashboard — Início da Escola

**Header:**

- `"Painel Geral — [Nome da Escola]"` em `font-display`
- Data e dia da semana em `text-muted-foreground`

**Bloco de métricas do dia (grid 2×2 mobile, 4×1 desktop):**

| Card               | Dado                   | Cor                                                |
| ------------------ | ---------------------- | -------------------------------------------------- |
| Presença hoje      | 87% dos alunos         | Verde se > 85%, âmbar se 75–85%, vermelho se < 75% |
| Alunos em alerta   | 12 com freq. crítica   | Âmbar, clicável                                    |
| Chamadas pendentes | 3 turmas sem registro  | Vermelho se > 0                                    |
| Justificativas     | 5 pendentes de revisão | Azul                                               |

**Painel "Alunos em Alerta" (seção expandível):**

- Lista dos alunos com frequência < 80%
- Por aluno: nome + turma + % + faltas consecutivas
- Ação rápida: [Ver aluno] [Notificar responsável]

**Seção "Chamadas Não Lançadas Hoje":**

- Quais turmas/professores ainda não registraram
- Pode servir como cobrador interno
- Em verde quando 100% lançadas

**Feed "Atividade Recente":**

- Últimas ações: "Prof. Ana lançou chamada — 2A" | "5 novas justificativas" | "Comunicado lido por 68/120"

**Próximos eventos (mini-agenda):**

- 3 próximos eventos da escola

---

### 4.2 Alunos — CRUD completo

**Lista de alunos:**

- Tabela (desktop): foto + nome + matrícula + turma + freq. + status
- Lista de cards (mobile): foto + nome + turma + % frequência
- Barra de busca: por nome, matrícula, CPF
- Filtros: ano, turma, curso, status (ativo/inativo)
- Botão "Novo Aluno" — prominence alta, cor `bg-red-brand`

**Wizard "Novo Aluno" (4 passos):**

```
Passo 1/4 — Dados Pessoais
  Nome completo *
  Data de nascimento *
  CPF
  Foto (upload)
  Endereço

Passo 2/4 — Vínculo Escolar
  Ano letivo ativo (auto-preenchido)
  Turma * (select: 1A · 1B · 2A · 2B · 3A · etc.)
  Turno * (Matutino / Vespertino)
  Curso * (Administração / Enfermagem / Eventos / Redes)

Passo 3/4 — Responsável
  Buscar responsável existente (por CPF/nome)
  OU cadastrar novo:
    Nome, e-mail, telefone, relação (pai/mãe/tutor)

Passo 4/4 — Confirmação
  Resumo dos dados
  Matrícula gerada automaticamente (ex: 2025001)
  [Confirmar Cadastro] → cria conta de acesso do aluno
```

**Ficha do aluno (ao clicar no aluno da lista):**

- Aba "Dados" — dados pessoais completos (editáveis pela escola)
- Aba "Frequência" — histórico completo de todas as disciplinas
- Aba "Notas" — boletim completo com todas as disciplinas
- Aba "Comentários" — todos os comentários, incluindo `school_only`
- Aba "Histórico" — matrículas, transferências, ocorrências

---

### 4.3 Turmas — Gestão de Classes

**Lista de turmas:**

- Filtro por: ano letivo, série (1º/2º/3º), curso, turno
- Card por turma: nome (ex: 2A — Enfermagem), nº de alunos, % presença média, professores vinculados
- Botão "Nova Turma"

**Criar Turma:**

- Série (1º/2º/3º ano)
- Curso (Administração / Enfermagem / Eventos / Redes)
- Turno (Matutino / Vespertino)
- Número de identificação da turma (ex: 2A)
- Ano letivo (validação: deve existir ano letivo ativo)

**Dentro de uma turma — abas:**

- **Alunos:** lista dos matriculados + botão "Matricular aluno" (busca por nome/matrícula)
- **Professores:** lista de vínculos professor↔disciplina + botão "Vincular professor"
- **Frequência:** presença média por período + gráfico
- **Notas:** médias por disciplina da turma

---

### 4.4 Comunicados — Publicação com rastreio

**Lista de comunicados publicados:**

- Tabela: título + destinatários + data + leituras (ex: "68/120 leram")
- Filtro: por data, por público-alvo, por status (lido/não lido)
- Botão "Novo Comunicado"

**Formulário "Novo Comunicado":**

```
Título: [                              ]
Corpo:  [editor de texto simples       ]
        [com opção de anexo PDF/imagem ]

Destinatários:
  ○ Toda a escola
  ○ Por série:     [1º ano] [2º ano] [3º ano]
  ○ Por turma:     [2A] [2B] [2C] ...
  ○ Só responsáveis
  ○ Só professores

Publicação:
  ○ Agora
  ○ Agendar para: [data e hora]

Preview: "Este comunicado será enviado para 120 pessoas"
[Publicar]
```

**Após publicar:**

- Contador de leituras em tempo real na listagem
- Clique no contador: lista de quem leu vs quem não leu

---

### 4.5 Eventos / Calendário Letivo

**Visualização:**

- Calendário mensal clicável
- Badges por tipo de evento (mesmas cores do aluno)
- Botão "Novo Evento" sempre visível

**Criar Evento:**

- Título, descrição
- Data (início e fim opcionais)
- Tipo: 📝 Prova · 🎉 Evento Cultural · 🚪 Saída Antecipada · 📅 Feriado · 🎓 Formatura · 🤝 Reunião
- Público-alvo: toda a escola / série específica / turma específica
- Ao publicar → notificação enviada aos usuários do público-alvo

---

### 4.6 Relatórios

**Relatório de Frequência:**

- Filtros: turma / disciplina / professor / período (bimestre ou intervalo de datas)
- Tabela resultante com % de presença por aluno
- Lista de alunos em risco (< 80%)
- Exportar: botão "Baixar CSV" e "Baixar PDF"

**Relatório de Desempenho:**

- Filtros: turma / disciplina / bimestre
- Médias por turma
- Distribuição de notas (histograma visual)
- Alunos abaixo da média

**Relatório de Comentários:**

- Todos os comentários do período
- Inclui `school_only` (visível só aqui)
- Filtro por professor, aluno, categoria, visibilidade

**Justificativas Pendentes:**

- Fila de justificativas aguardando revisão
- Por justificativa: aluno + falta + data + responsável + motivo + anexo
- Ações: ✅ Aprovar · ❌ Rejeitar (com campo de observação)

---

### 4.7 Configurações

- **Ano Letivo:** criar novo ano / encerrar ano (soft-archive dos dados)
- **Perfil da Escola:** nome, logo, endereço, dados de contato
- **Usuários:** listar todos, ativar/desativar, redefinir senha
- **Notificações:** configurar quais tipos de alerta são enviados (e-mail vs in-app vs ambos)
- **LGPD:** exportação de dados do aluno (Art. 18), log de acessos

---

## 5. Perfil: Responsável — Portal da Família

**Rota base:** `/dashboard/guardian`
**Arquivo shell:** `src/app/routes/pages/dashboard/guardian/`

**Sidebar / Bottom Nav do responsável:**

| Ícone | Label        | Rota                                 |
| ----- | ------------ | ------------------------------------ |
| 🏠    | Início       | `/dashboard/guardian`                |
| ✅    | Frequência   | `/dashboard/guardian/attendance`     |
| 📋    | Desempenho   | `/dashboard/guardian/grades`         |
| 💬    | Comentários  | `/dashboard/guardian/comments`       |
| 📢    | Notícias     | `/dashboard/guardian/communications` |
| 🔔    | Notificações | `/dashboard/guardian/notifications`  |

> Mobile: bottom nav principal com todos os 5 itens principais (sem "Mais").

**Seletor de filho (se responsável tiver múltiplos filhos):**

- Dropdown ou pills no topo de TODAS as telas
- `"Vendo dados de: [Nome do Filho] ▾"`
- Troca instantânea entre filhos sem recarregar

---

### 5.1 Dashboard — Início do Responsável

**O design do dashboard do responsável prioriza ALERTAS e AÇÃO RÁPIDA.**

**Saudação:**

- `"Olá, [Nome]"` + `"Acompanhando: [Nome do Filho] — [Turma]"`

**Alerta máxima prioridade — 3 faltas consecutivas (aparece se aplicável):**

```
╔════════════════════════════════════════════════╗
║  🚨 ATENÇÃO                                    ║
║  [Nome do Filho] faltou 3 dias seguidos.       ║
║  Última falta: 12/06 — Matemática              ║
║  Prof. Ana Costa                               ║
║                                               ║
║  [Ver detalhes]  [Justificar faltas]          ║
╚════════════════════════════════════════════════╝
```

- Fundo: `bg-red-brand/10 border-2 border-red-brand`
- Notificação push enviada automaticamente ao atingir 3 faltas consecutivas

**Alerta Pé de Meia (condicional):**

- Mesmo bloco do aluno, mas com call-to-action: _"Entre em contato com a escola"_

**Cards de métricas:**

| Card           | Dado                     | Diferença vs Aluno                        |
| -------------- | ------------------------ | ----------------------------------------- |
| Frequência     | 87% + barra de progresso | Inclui comparativo: "Média da turma: 84%" |
| Média Geral    | 7.4 ↑                    | Inclui comparativo: "Média da turma: 7.1" |
| Comunicados    | 2 não lidos              | Igual ao aluno                            |
| Próximo Evento | "Reunião 20/06"          | Igual ao aluno                            |

**Últimas notificações (mini-feed no dashboard):**

- Máximo 3 itens mais recentes
- CTA: "Ver todas →"

---

### 5.2 Frequência — Visão com Detalhamento Total

**Diferenças fundamentais vs tela do aluno:**

| Elemento                        | Aluno vê         | Responsável vê                           |
| ------------------------------- | ---------------- | ---------------------------------------- |
| Nome do professor               | ❌ Não           | ✅ Sim (em cada falta)                   |
| Botão "Justificar"              | ❌ Não           | ✅ Sim (em faltas sem justificativa)     |
| Status da justificativa         | ❌ Não           | ✅ Sim (pendente / aprovada / rejeitada) |
| Comparativo com turma           | ❌ Não           | ✅ Sim (% da turma ao lado)              |
| Alerta de 3 faltas consecutivas | ⚠️ Aviso simples | 🚨 Alerta destacado + notificação push   |

**Card de falta expandida (ao clicar numa falta):**

```
┌────────────────────────────────────────────┐
│  ❌ Ausente — 10/06/2025                  │
│  Disciplina: Matemática                   │
│  Professor: Ana Costa                     │
│  Aula: 07:00 – 08:40                     │
│                                            │
│  Justificativa: Não enviada               │
│  [Enviar Justificativa]                   │
└────────────────────────────────────────────┘
```

**Formulário de justificativa (bottom sheet mobile / modal desktop):**

- Falta selecionada (read-only)
- Campo texto: Motivo (ex: consulta médica)
- Upload: documento/atestado (PDF ou imagem)
- Após envio: status muda para "Aguardando análise"
- Responsável recebe notificação quando escola aprova ou rejeita

---

### 5.3 Desempenho — Notas com Contexto

**Layout idêntico ao boletim do aluno, com dois adicionais:**

1. **Comparativo da turma:**
   - Cada card de disciplina mostra: "Média da turma: 7.1" em `text-blue-brand`
   - Barra visual dupla: nota do filho vs média da turma

2. **Identificação do professor por disciplina:**
   - Abaixo do nome da matéria: `"Prof. Ana Costa"` em `text-muted-foreground text-xs`

**Seção de comentários embutida (link rápido):**

- Mini-feed dos últimos 2 comentários dos professores
- COM nome do professor: `"Prof. Carlos Lima — Português: ⭐ Ótima evolução"`
- CTA: "Ver todos os comentários →"

---

### 5.4 Comentários — COM Autoria Completa

**Diferença fundamental vs aluno:**

| Elemento                               | Aluno vê       | Responsável vê                |
| -------------------------------------- | -------------- | ----------------------------- |
| Nome do professor                      | ❌             | ✅ Nome + Disciplina          |
| Comentários `visibility='student'`     | ✅             | ❌ (não são para responsável) |
| Comentários `visibility='guardian'`    | ❌             | ✅                            |
| Comentários `visibility='all'`         | ✅ (sem autor) | ✅ (com autor)                |
| Comentários `visibility='school_only'` | ❌             | ❌                            |

**Card de comentário (responsável):**

```
┌────────────────────────────────────────────┐
│ ⭐ Elogio                     12/06/2025  │
│ ──────────────────────────────────────────│
│ "Excelente participação nas aulas e       │
│  ótimo desempenho nas apresentações."     │
│                                            │
│ 👩‍🏫 Prof. Ana Costa — Matemática          │
└────────────────────────────────────────────┘
```

- Nome do professor em `text-blue-brand font-heading text-sm`
- Disciplina em `text-muted-foreground text-xs`

---

### 5.5 Canal de Notícias / Comunicados

**Layout:** feed vertical de comunicados, do mais recente ao mais antigo.

**Card de comunicado não lido:**

```
┌────────────────────────────────────────────┐
│ 🔴 NÃO LIDO                    08/06/2025 │
│ ──────────────────────────────────────────│
│  Reunião de Pais — 2º Bimestre            │
│  "Prezados responsáveis, informamos que   │
│   a reunião acontecerá dia 20/06..."      │
│                                            │
│  [Ler comunicado completo]                │
└────────────────────────────────────────────┘
```

**Ao abrir o comunicado completo:**

- Conteúdo completo + anexos clicáveis
- Botão "Marcar como lido" (desaparece após leitura)
- Receio salvo: `readAt` timestamp enviado ao backend

**Tipos de comunicados que chegam:**

- Eventos escolares (provas, feriados, saídas antecipadas, comemorações)
- Reuniões de pais
- Avisos gerais (suspensão de aula, mudança de horário)

---

### 5.6 Notificações — Central de Alertas

**Tipos de notificações automáticas:**

| Trigger                 | Mensagem                                                    | Urgência             |
| ----------------------- | ----------------------------------------------------------- | -------------------- |
| Falta registrada        | "[Filho] faltou Matemática hoje (Prof. Ana Costa)"          | Normal               |
| 3 faltas consecutivas   | "ATENÇÃO: [Filho] faltou 3 dias seguidos"                   | Alta (push + in-app) |
| Frequência < 80%        | "Pé de Meia em risco — frequência de [Filho] caiu para 79%" | Alta                 |
| Nova nota lançada       | "[Filho] recebeu nota 8,5 em Matemática"                    | Normal               |
| Novo comentário         | "Prof. Ana Costa comentou sobre [Filho]"                    | Normal               |
| Comunicado publicado    | "Nova mensagem da escola: Reunião 20/06"                    | Normal               |
| Evento criado           | "Novo evento: Saída antecipada na sexta-feira"              | Normal               |
| Justificativa aprovada  | "Sua justificativa foi aprovada pela escola"                | Normal               |
| Justificativa rejeitada | "Sua justificativa foi rejeitada — veja o motivo"           | Normal               |

**Design da central de notificações:**

- Lista cronológica com ícone por tipo, texto e data
- Não lidas: fundo levemente colorido (`bg-blue-brand/5`), ponto azul à esquerda
- Lidas: fundo normal, sem ponto
- Ação de swipe (mobile): deslizar para marcar como lida / deletar
- "Marcar todas como lidas" no topo

---

## 6. Tabela Comparativa entre Perfis

### 6.1 Acesso por Funcionalidade

| Funcionalidade                   |    Aluno    |  Professor   |    Responsável    |   Escola   |
| -------------------------------- | :---------: | :----------: | :---------------: | :--------: |
| Ver própria frequência           |     ✅      |      —       |         —         |     —      |
| Ver frequência do filho          |      —      |      —       |    ✅ c/ autor    |     —      |
| Ver frequência de qualquer aluno |     ❌      |  ✅ (turma)  |        ❌         | ✅ (todos) |
| Registrar frequência             |     ❌      |  ✅ (turma)  |        ❌         |     ❌     |
| Justificar falta                 |     ❌      |      ❌      |        ✅         |     —      |
| Aprovar justificativa            |     ❌      |  ✅ parcial  |        ❌         |     ✅     |
| Ver notas próprias               |     ✅      |      —       |         —         |     —      |
| Ver notas do filho               |      —      |      —       | ✅ c/ comparativo |     —      |
| Lançar notas                     |     ❌      |  ✅ (turma)  |        ❌         |     ❌     |
| Ver comentários (sem autor)      | ✅ filtrado |      —       |         —         |     —      |
| Ver comentários (com autor)      |     ❌      |      —       |    ✅ filtrado    |  ✅ todos  |
| Criar comentários                |     ❌      |      ✅      |        ❌         |     ❌     |
| Publicar comunicado              |     ❌      |      ❌      |        ❌         |     ✅     |
| Receber comunicado               |     ✅      |      ✅      |        ✅         |     —      |
| Publicar evento                  |     ❌      |      ❌      |        ❌         |     ✅     |
| Ver calendário de eventos        |     ✅      |      ✅      |        ✅         | ✅ (edita) |
| Cadastrar alunos/turmas          |     ❌      |      ❌      |        ❌         |     ✅     |
| Acessar relatórios               |     ❌      |      ❌      |        ❌         |     ✅     |
| Alerta Pé de Meia                |     ✅      |      —       |        ✅         |     —      |
| Horário de aulas                 |     ✅      | ✅ (próprio) |        ❌         | ✅ (todos) |
| Links plataformas parceiras      |     ✅      |      —       |         —         |     —      |

### 6.2 Dados de Frequência — O que cada um vê

| Dado                         | Aluno         | Professor     | Responsável    | Escola           |
| ---------------------------- | ------------- | ------------- | -------------- | ---------------- |
| % de presença                | Própria       | Por turma     | Do filho       | Por turma/escola |
| Nome do professor na falta   | ❌            | N/A           | ✅             | ✅               |
| Data e disciplina da falta   | ✅            | ✅            | ✅             | ✅               |
| Comparativo com turma        | ❌            | ✅ (é o dono) | ✅             | ✅               |
| Contagem faltas consecutivas | Aviso simples | ✅            | 🚨 Alerta push | ✅               |
| Status Pé de Meia            | ✅ com visual | —             | ✅ com alerta  | —                |
| Justificativa anexada        | ❌            | ❌ criar      | ✅ cria        | ✅ aprova        |

### 6.3 Dados de Comentários — O que cada um vê

| Dado                      | Aluno        | Professor      | Responsável  | Escola       |
| ------------------------- | ------------ | -------------- | ------------ | ------------ |
| Comentários `student`     | ✅ sem autor | ✅ próprios    | ❌           | ✅ com autor |
| Comentários `guardian`    | ❌           | ✅ próprios    | ✅ com autor | ✅ com autor |
| Comentários `all`         | ✅ sem autor | ✅ próprios    | ✅ com autor | ✅ com autor |
| Comentários `school_only` | ❌           | ✅ próprios    | ❌           | ✅ todos     |
| Nome do autor visível     | ❌ nunca     | N/A (próprios) | ✅ sempre    | ✅ sempre    |

---

## 7. Decisões Mobile-First

### 7.1 Por que mobile-first no RED

> "Maior quantidade de pessoas usarão no celular" — professores registrarão chamada durante a aula via smartphone; responsáveis receberão notificações e checarão frequência do celular.

### 7.2 Adaptações por tela

| Tela                | Desktop                     | Mobile                                            |
| ------------------- | --------------------------- | ------------------------------------------------- |
| Dashboard           | Grid 4 cards horizontal     | Grid 2×2 vertical                                 |
| Sidebar             | Fixa 240px à esquerda       | Drawer lateral + bottom nav                       |
| Chamada (professor) | Tabela com toggle por linha | Lista de alunos full-width, toggle 52px de altura |
| Horário             | Grade semanal               | Tabs por dia + lista vertical                     |
| Boletim             | Tabela de notas             | Cards por disciplina                              |
| Frequência          | Tabela detalhada            | Cards por disciplina + resumo                     |
| Comunicados         | Lista com preview           | Cards compactos                                   |
| Calendário          | Grade mensal                | Mini-calendário + lista do dia selecionado        |
| Novo Comentário     | Modal centralizado          | Bottom sheet full-width                           |
| Novo Comunicado     | Form lateral/modal          | Página dedicada em steps                          |

### 7.3 Regras gerais mobile

- Todo elemento tocável: `min-height: 44px` (Apple HIG standard)
- Inputs de texto: `font-size: 16px` para evitar zoom automático do iOS
- Gestos: swipe para marcar notificação como lida / arquivar comunicado
- Carregamento: skeleton loading em cards enquanto dados chegam
- Pull to refresh: disponível em feeds e listas
- Bottom sheet: substitui modais em mobile para formulários de ação rápida
- Tabs de navegação: rolagem horizontal quando há muitas abas

### 7.4 Prioridade do Bottom Nav por perfil

**Aluno (5 ícones):**
`[Início] [Frequência] [Boletim] [Comentários] [Mais▾]`

**Professor (5 ícones):**
`[Início] [Chamada] [Turmas] [Avaliações] [Mais▾]`

**Escola (5 ícones):**
`[Dashboard] [Alunos] [Comunicados] [Relatórios] [Mais▾]`

**Responsável (5 ícones — sem "Mais" pois são menos seções):**
`[Início] [Frequência] [Desempenho] [Comentários] [Notícias]`

---

## Apêndice — Mapeamento de Arquivos para Telas

```
src/app/routes/pages/dashboard/
│
├── DashboardShell.tsx          ← wrapper de layout (sidebar + topbar + bottom nav)
│
├── student/
│   ├── index.tsx               ← info do aluno (2.1)
│   ├── dashboard.tsx           ← dashboard do aluno e suas informações resumidas em gráficos e cards
│   ├── profile.tsx             ← Dados Pessoais + Ficha Biográfica (2.2)
│   ├── class.tsx               ← Minha Turma (2.3)
│   ├── schedule.tsx            ← Horário (2.4)
│   ├── calendar.tsx            ← Calendário Letivo (2.5)
│   ├── grades.tsx              ← Boletim (2.6)
│   ├── attendance.tsx          ← Frequência + Pé de Meia (2.7)
│   ├── assessments.tsx         ← Avaliações Online (2.8)
│   ├── comments.tsx            ← Comentários anonimizados (2.9)
│   └── links.tsx               ← Plataformas parceiras
│
├── teacher/
│   ├── index.tsx               ← Dashboard do professor (3.1)
│   ├── classes.tsx             ← Minhas Turmas + perfil do aluno (3.2)
│   ├── attendance.tsx          ← Chamada step-by-step (3.3)
│   ├── assessments.tsx         ← Lançamento de notas (3.4)
│   ├── comments.tsx            ← Criação + histórico de comentários (3.5)
│   └── communications.tsx      ← Comunicados recebidos (3.6)
│
├── school/
│   ├── index.tsx               ← Dashboard de gestão (4.1)
│   ├── students.tsx            ← CRUD de alunos + wizard (4.2)
│   ├── classes.tsx             ← Gestão de turmas (4.3)
│   ├── teachers.tsx            ← Professores e vínculos
│   ├── guardians.tsx           ← Responsáveis e vínculos
│   ├── communications.tsx      ← Publicar comunicados (4.4)
│   ├── events.tsx              ← Calendário + criar eventos (4.5)
│   ├── reports.tsx             ← Relatórios + justificativas (4.6)
│   └── settings.tsx            ← Configurações + ano letivo (4.7)
│
├── guardian/
│   ├── index.tsx               ← Dashboard do responsável (5.1)
│   ├── attendance.tsx          ← Frequência c/ autoria + justificativa (5.2)
│   ├── grades.tsx              ← Desempenho c/ comparativo (5.3)
│   ├── comments.tsx            ← Comentários c/ autoria (5.4)
│   ├── communications.tsx      ← Canal de notícias (5.5)
│   └── notifications.tsx       ← Central de notificações (5.6)
│
├── features/
│   ├── attendance/             ← Lógica de frequência compartilhada
│   ├── comments/               ← Componentes de comentário reutilizáveis
│   └── notifications/          ← Sistema de notificações in-app
│
└── shared/
    ├── StatCard.tsx
    ├── AlertBanner.tsx
    ├── SectionHeader.tsx
    ├── DataTable.tsx
    ├── EmptyState.tsx
    ├── BottomNav.tsx
    └── PeDeMetaWidget.tsx      ← Widget específico do Pé de Meia
```

---

_Documento gerado para o projeto RED — Registro Escolar Digital_
_Design: Editorial Moderno "Clareza Pedagógica" | Paleta: #8b1120 · #1f3a5f · #f9f6f2_
_Stack: React + TypeScript + TailwindCSS + tRPC + shadcn/ui_
