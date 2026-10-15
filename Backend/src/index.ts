import dotenv from "dotenv";
dotenv.config();

import app from "./Infrastructure/Server/ExpressApp";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    app.listen(PORT, () => {
      console.log(`[PRO-MOVER Server] Rodando com sucesso em http://localhost:${PORT}`);
      console.log(`[Database] Conectado ao PostgreSQL (pro_mover_db)`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor backend:", error);
    process.exit(1);
  }
}

start();
