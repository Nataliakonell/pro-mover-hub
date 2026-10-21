# PRO-MOVER Hub 🏥

Plataforma de gestão e triagem de saúde comunitária desenvolvida para a disciplina de **Desenvolvimento de Aplicações Corporativas (DAC)** - 6º Semestre.

---

## 📁 Estrutura do Repositório (Monorepo)

O projeto é estruturado no formato **monorepo com Clean Architecture**, centralizando frontend, backend e banco de dados em um único repositório (idêntico à arquitetura de referência):

```text
pro-mover-hub/
├── docker-compose.yml     # Orquestração do banco de dados PostgreSQL (porta 5432)
├── package.json           # Scripts unificados do monorepo (concurrently)
├── README.md              # Documentação e guia completo
│
├── Frontend/              # Aplicação Web (React, Vite, TanStack Router, Tailwind CSS, shadcn/ui)
│   ├── src/
│   │   ├── components/    # Layout e componentes reutilizáveis
│   │   ├── lib/           # Cliente de API HTTP, autenticação, participantes e settings
│   │   └── routes/        # Rotas da aplicação (/, /participantes, /prontuarios, /sessoes-cortesia, /configuracao)
│   ├── .env.example       # Modelo de variáveis de ambiente
│   ├── .env               # Configurações locais (ignorado pelo Git)
│   └── package.json       # Dependências e scripts do Frontend (porta 8080)
│
└── Backend/               # API REST em Clean Architecture (Node.js, Express, TypeScript, Prisma ORM)
    ├── prisma/
    │   └── schema.prisma  # Modelos de dados relacionais para PostgreSQL
    ├── src/
    │   ├── Domain/        # Entidades e interfaces de repositórios (IParticipantRepository, etc.)
    │   ├── UseCases/      # Regras de negócio desacopladas (Casos de uso)
    │   ├── Adapters/      # Controllers HTTP e Middlewares de autenticação
    │   └── Infrastructure/# Banco de dados (PrismaClient, Seed) e Servidor Express (porta 5000)
    ├── .env.example       # Modelo de variáveis de ambiente do Backend
    ├── .env               # String de conexão do PostgreSQL (ignorado pelo Git)
    └── package.json       # Dependências e scripts do Backend
```

---

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **[Git](https://git-scm.com/)**
2. **[Node.js](https://nodejs.org/)** versão 18 ou superior (LTS)
3. **[PostgreSQL](https://www.postgresql.org/)** instalado localmente na porta `5432` **OU** **[Docker Desktop](https://www.docker.com/)** (para rodar via `docker compose up -d`)

---

## 🚀 Guia Rápido de Execução

### 1. Iniciar o Banco de Dados (PostgreSQL)

- **Se você usa Docker:**
  Na raiz do projeto (`pro-mover-hub`), execute:
  ```bash
  docker compose up -d
  ```
- **Se você usa PostgreSQL instalado localmente:**
  O banco de dados `pro_mover_db` será utilizado na URL padrão:
  `postgresql://postgres:password@localhost:5432/pro_mover_db`

---

### 2. Configurar e Inicializar o Backend

Abra um terminal na pasta `Backend`:

```bash
cd Backend
npm install
```

Copie as variáveis de ambiente:
```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Gere o cliente do Prisma e sincronize as tabelas no PostgreSQL:
```bash
npx prisma db push
```

Popule o banco com os dados iniciais de demonstração (seed):
```bash
npm run seed
```

Inicie o servidor backend (rodando na porta **`5000`**):
```bash
npm run dev
```

---

### 3. Configurar e Inicializar o Frontend

Abra outro terminal na pasta `Frontend`:

```bash
cd Frontend
npm install
```

Copie as variáveis de ambiente:
```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Inicie o frontend (rodando na porta **`8080`**):
```bash
npm run dev
```

Acesse no navegador:
👉 **[http://localhost:8080](http://localhost:8080)**

---

### 4. Execução Unificada (Na Raiz do Monorepo)

Você também pode rodar ambos os serviços juntos a partir da raiz:

```bash
# Na raiz de pro-mover-hub:
npm install
npm run dev
```
*(O comando `npm run dev` utiliza `concurrently` para disparar o Backend na porta 5000 e o Frontend na porta 8080 simultaneamente!)*

---

## 🧭 Mapa de Rotas e Telas do Sistema

| Rota | Tela | Papel Principal e Funcionalidades |
| :--- | :--- | :--- |
| **`/`** | **Dashboard** | Painel principal com saudação personalizada, seletor dinâmico de evento comunitário ativo, banner informativo, 6 indicadores-chave de saúde, 6 gráficos estatísticos (incluindo distribuição etária em tempo real conectada ao PostgreSQL) e tabela das triagens mais recentes (com visualização diferenciada por perfil clínico vs. recepção). |
| **`/participantes`** | **Participantes** | Diretório da comunidade e gestão cadastral conectado ao banco PostgreSQL. Cadastro com cálculo automático de idade e alocação de faixa etária, máscaras de CPF e WhatsApp (com botão de conversa direta `wa.me`), histórico de presenças em eventos e atalho direto para o prontuário. |
| **`/prontuarios`** | **Prontuários** | Registro clínico com sinais vitais (PA, SpO₂, FC), evolução detalhada do profissional de saúde, notas de conduta e encaminhamentos médicos. Suporta filtro direto via URL (ex: `?search=Nome`). |
| **`/sessoes-cortesia`** | **Sessões Cortesia** | Painel de controle do benefício de fisioterapia e reabilitação (regra: até 4 sessões por triagem). Tabela de participantes com saldo atualizado em tempo real, status ativo/esgotado, histórico de concessões/utilizações e diálogo de agendamento que debita do saldo quando marcado como "Realizado". |
| **`/login`** | **Autenticação** | **Tela de Login do Sistema**. Autenticação com e-mail e senha cadastrados no PostgreSQL via hash bcrypt e emissão de token JWT. Redireciona administradores diretamente para `/administrador` e usuários para `/`. |
| **`/administrador`** | ** ** | **Visão Geral e Gestão Administrativa Centralizada**. Visualização e cadastro de todas as farmácias parceiras vinculadas (CNPJ, farmacêutico responsável, contatos e endereço), todas as campanhas criadas pelas farmácias (com atalho para o Dashboard), lista nominal de todos os participantes vinculados ao sistema (com busca, CPF e WhatsApp direto) e gerenciamento dos parâmetros clínicos e limites de IMC. |
| **`/configuracao`** | **Configurações** | **Acesso restrito ao perfil Administrador** (outros perfis são redirecionados ao Dashboard). Permite configurar a data e o local do evento padrão, definir os parâmetros demonstrativos de alertas clínicos da triagem (PA sistólica/diastólica, SpO₂ e FC) com persistência no banco de dados. |

---

## 🚀 Guia do Git para o Time

```bash
# 1. Puxe as atualizações antes de iniciar o trabalho
git pull origin main

# 2. Ao terminar suas implementações
git status
git add .
git commit -m "feat: descricao da sua alteracao"
git push origin main
```
