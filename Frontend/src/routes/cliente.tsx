import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ClientTriagesView } from "@/components/client-triages-view";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Minhas Triagens | Conecta Saúde" },
      { name: "description", content: "Visualização das triagens e dados clínicos do participante." },
    ],
  }),
  component: ClientePage,
});

function ClientePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();

  useEffect(() => {
    // Se não estiver logado, redireciona para a tela exclusiva de login do cliente
    if (!isAuthenticated) {
      navigate({ to: "/login-cliente" });
    }
  }, [isAuthenticated, navigate]);

  return <ClientTriagesView />;
}
