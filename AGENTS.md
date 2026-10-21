# Diretrizes Críticas: PROIBIÇÃO ABSOLUTA DE DADOS HARDCODED / MOCK

## 1. Proibição de Hardcode e Dados Simulados
- **É TERMINANTEMENTE PROIBIDO** inserir dados falsos, mockados, estáticos ou fictícios em qualquer parte do sistema (Frontend ou Backend).
- Não criar constantes com dados "chumbados" (ex: `INITIAL_PHARMACIES`, mocks de participantes, dados de gráficos fictícios gerados arbitrariamente).
- Todas as entidades exibidas na aplicação devem ter sua origem e existência verificada no banco de dados relacional PostgreSQL.

## 2. Persistência Obrigatória no PostgreSQL via Prisma
- Toda e qualquer entidade cadastrada ou modificada pelo usuário (Farmácias, Campanhas, Participantes, Triagens Clínicas, Histórico de Presenças e Configurações) **DEVE SER OBRIGATORIAMENTE PERSISTIDA** no banco de dados PostgreSQL através dos endpoints HTTP da API Backend e Prisma ORM.
- Nenhuma criação pode ser gravada apenas em `localStorage` ou memória volátil sem o envio e confirmação do salvamento na API.

## 3. Empty States Reais e Limpos
- Quando o banco de dados estiver vazio para uma entidade (0 farmácias, 0 campanhas, 0 participantes), a interface deve apresentar um **estado vazio legítimo (Empty State)** informando que nenhum registro foi cadastrado e convidando o usuário a realizar o cadastro.
- Jamais preencher a tela com dados falsos para "parecer cheio".
