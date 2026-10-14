# PRO-MOVER Hub

Projeto desenvolvido para a disciplina de **Desenvolvimento de Aplicações Corporativas (DAC)** - 6º Semestre.

## Estrutura do Projeto

O repositório está organizado como um monorepo para abrigar tanto o frontend quanto o backend da aplicação:

```text
pro-mover-hub/
├── Frontend/          # Aplicação Front-end (React, Vite, TanStack Router/Start, Tailwind CSS, shadcn/ui)
│   ├── src/
│   ├── public/
│   ├── .env.example   # Modelo de variáveis de ambiente
│   ├── .env           # Variáveis locais (ignorado no git)
│   └── package.json
└── Backend/           # API e serviços de Back-end (a ser implementado)
```

---

## Como executar o Frontend localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- npm

### 2. Acessar a pasta do Frontend
```powershell
cd Frontend
```

### 3. Instalar as dependências
```powershell
npm install
```
*(No Windows PowerShell, caso encontre restrição na execução de scripts, utilize `npm.cmd install`)*

### 4. Configurar Variáveis de Ambiente
Verifique ou crie o arquivo `.env` na pasta `Frontend` a partir do modelo:
```powershell
Copy-Item .env.example .env
```
Variáveis principais:
- `PORT=8080`: Porta local onde o servidor executa.
- `VITE_API_BASE_URL`: URL base para futuras chamadas à API do backend.

### 5. Iniciar o Servidor de Desenvolvimento
```powershell
npm run dev
```
*(ou `npm.cmd run dev` no Windows)*

Abra o navegador em:
**[http://localhost:8080](http://localhost:8080)**

### 6. Compilar para Produção
```powershell
npm run build
```
