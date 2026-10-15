# PRO-MOVER Hub 🏥

Plataforma de gestão e triagem de saúde comunitária desenvolvida para a disciplina de **Desenvolvimento de Aplicações Corporativas (DAC)** - 6º Semestre.

---

## 📁 Estrutura do Repositório

O projeto é estruturado no formato **monorepo**, centralizando frontend e backend em um único repositório:

```text
pro-mover-hub/
├── Frontend/           # Aplicação Web (React, Vite, TanStack Router, Tailwind CSS, shadcn/ui)
│   ├── src/            # Componentes, páginas, rotas e regras de negócio
│   ├── public/         # Recursos estáticos (ícones, logos, etc.)
│   ├── .env.example    # Modelo de variáveis de ambiente
│   ├── .env            # Configurações locais individuais (ignorado pelo git)
│   └── package.json    # Dependências e scripts do Frontend
│
├── Backend/            # API e regras de negócio do servidor (a ser integrado)
│
├── .gitignore          # Arquivos e pastas ignorados no versionamento
└── README.md           # Guia de início rápido e documentação do projeto
```

---

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter instalado no seu computador:

1. **[Git](https://git-scm.com/)** (para clonar e sincronizar o código)
2. **[Node.js](https://nodejs.org/)** versão 18 ou superior (recomendado LTS)
3. **npm** (já vem instalado com o Node.js)
4. Um editor de código (recomendado: [VS Code](https://code.visualstudio.com/))

---

## 🚀 Guia do Git para o Time

### 1. Clonar o repositório (apenas na primeira vez)
Abra o terminal (Git Bash, PowerShell ou Prompt de Comando) na pasta onde você guarda seus projetos da faculdade e execute:

```bash
git clone https://github.com/Nataliakonell/pro-mover-hub.git
cd pro-mover-hub
```

### 2. Manter seu projeto sempre atualizado (`git pull`)
Antes de começar a trabalhar ou criar novas telas, sempre puxe as últimas alterações enviadas pelos colegas:

```bash
git pull origin main
```
> **Dica:** Se alguém adicionou uma nova biblioteca no projeto, lembre-se de entrar em `Frontend` e rodar `npm install` novamente após o pull.

### 3. Enviar suas alterações para o repositório
Após fazer suas alterações e testar localmente:

```bash
# 1. Veja o que foi alterado
git status

# 2. Adicione os arquivos que você alterou
git add .

# 3. Crie um commit com uma mensagem clara do que foi feito
git commit -m "feat: adiciona componente de triagem de pacientes"

# 4. Envie para o GitHub
git push origin main
```

---

## 💻 Como Executar o Frontend em Localhost

Siga estes passos para rodar o frontend no seu computador:

### Passo 1: Acessar a pasta do Frontend
A partir da raiz do repositório (`pro-mover-hub`), entre na pasta `Frontend`:

```bash
cd Frontend
```

### Passo 2: Instalar as dependências
Execute o comando abaixo para baixar as bibliotecas necessárias:

```bash
npm install
```
*(No Windows PowerShell, caso ocorra erro de política de scripts, use: `npm.cmd install`)*

### Passo 3: Configurar as Variáveis de Ambiente (`.env`)
O projeto utiliza um arquivo `.env` para configurações locais (como porta e URLs de API).

Crie o seu arquivo `.env` a partir do modelo `.env.example`:

- **No Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **No Linux / macOS / Git Bash:**
  ```bash
  cp .env.example .env
  ```

> ⚠️ **Atenção:** O arquivo `.env` **nunca** vai para o GitHub (está no `.gitignore`) para não vazar configurações locais de cada máquina. Se precisar adicionar uma nova variável de ambiente no projeto, adicione também no `.env.example`.

### Passo 4: Iniciar o servidor de desenvolvimento
Execute:

```bash
npm run dev
```
*(No Windows, se necessário: `npm.cmd run dev`)*

Pronto! A aplicação estará rodando. Acesse pelo navegador em:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 📜 Scripts Disponíveis (dentro da pasta `Frontend`)

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento local com hot-reload (porta 8080) |
| `npm run build` | Compila o projeto e valida os tipos TypeScript para produção |
| `npm run preview` | Pré-visualiza localmente a versão compilada em modo de produção |
| `npm run lint` | Analisa o código em busca de erros de sintaxe e padrões |

---

## ❓ Resolução de Problemas Frequentes (FAQ)

### 1. Erro no Windows: `O arquivo npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada...`
Isso acontece por uma política de segurança padrão do PowerShell no Windows. Há duas formas simples de resolver:
- **Opção A (Mais fácil):** Use `npm.cmd` em vez de `npm` (ex: `npm.cmd install`, `npm.cmd run dev`).
- **Opção B:** No PowerShell, execute o comando abaixo para permitir a execução na sessão atual:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

### 2. A porta `8080` já está ocupada por outro programa:
Abra o seu arquivo `Frontend/.env` e troque o número da porta para outra livre, por exemplo:
```env
PORT=3000
VITE_PORT=3000
```
E acesse em seguida em `http://localhost:3000`.

### 3. Erro de módulo ou biblioteca não encontrada após dar `git pull`:
Se outro colega adicionou uma dependência nova e você acabou de dar `git pull`, execute dentro de `Frontend`:
```bash
npm install
```

---

## 🧭 Mapa de Rotas e Telas do Sistema

| Rota | Tela | Papel Principal e Funcionalidades |
| :--- | :--- | :--- |
| **`/`** | **Dashboard** | Painel principal com saudação personalizada, seletor dinâmico de evento comunitário ativo, banner informativo, 6 indicadores-chave de saúde, 6 gráficos estatísticos (incluindo distribuição etária em tempo real) e tabela das triagens mais recentes (com visualização diferenciada por perfil clínico vs. recepção). |
| **`/participantes`** | **Participantes** | Diretório da comunidade e gestão cadastral. Cadastro com cálculo automático de idade e alocação de faixa etária, máscaras de CPF e WhatsApp (com botão de conversa direta `wa.me`), histórico de presenças em eventos e atalho direto para o prontuário. |
| **`/prontuarios`** | **Prontuários** | Registro clínico com sinais vitais (PA, Glicemia, SpO₂, FC), evolução detalhada do profissional de saúde, notas de conduta e encaminhamentos médicos. Suporta filtro direto via URL (ex: `?search=Nome`). |
| **`/sessoes-cortesia`** | **Sessões Cortesia** | Painel de controle do benefício de fisioterapia e reabilitação (regra: até 4 sessões por triagem). Tabela de participantes com saldo atualizado em tempo real, status ativo/esgotado, histórico de concessões/utilizações e diálogo de agendamento que debita do saldo quando marcado como "Realizado". |
| **`/configuracao`** | **Configurações** | **Acesso restrito ao perfil Administrador** (outros perfis são redirecionados ao Dashboard). Permite configurar a data e o local do evento padrão, definir os parâmetros demonstrativos de alertas clínicos da triagem (PA sistólica/diastólica, Glicemia, SpO₂ e FC) e consultar o painel informativo dos perfis de acesso. |

---

## 👥 Perfis de Acesso e Permissões

No topo do sistema (barra superior), você pode alternar livremente entre os 4 perfis para testar o comportamento da interface:

1. **Administrador (`admin`)**: Acesso total a todas as telas, incluindo a página de Configurações do sistema.
2. **Fisioterapeuta (`fisioterapeuta`)**: Acesso clínico com registro de triagens, acompanhamento de sessões cortesia e prontuários.
3. **Avaliador / Voluntário (`avaliador`)**: Perfil clínico de apoio para acolhimento comunitário e aferições em ações de saúde.
4. **Recepção (`recepcao`)**: Perfil focado em agendamentos, acolhimento e participantes; não visualiza botões clínicos restritos de triagem nem tabelas médicas confidenciais.

