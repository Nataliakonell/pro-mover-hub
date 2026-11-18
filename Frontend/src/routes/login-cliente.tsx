import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  HeartPulse,
  Fingerprint,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { formatCPF } from "@/lib/participants";

export const Route = createFileRoute("/login-cliente")({
  head: () => ({
    meta: [
      { title: "Acesso do Participante | Conecta Saúde" },
      { name: "description", content: "Portal de acesso do participante às suas triagens clínicas via CPF." },
    ],
  }),
  component: LoginClientePage,
});

function LoginClientePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isClient, login, logout } = useAuth();

  const [cpfInput, setCpfInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpfInput(formatted);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCpf = cpfInput.replace(/\D/g, "");
    if (!cleanCpf || cleanCpf.length !== 11) {
      setErrorMessage("Por favor, digite um CPF válido com 11 dígitos.");
      return;
    }

    setLoading(true);

    try {
      // Login do cliente passando o CPF
      const loggedUser = await login(cleanCpf, cleanCpf);
      setSuccessMessage(`Bem-vindo(a), ${loggedUser.name}!`);

      setTimeout(() => {
        navigate({ to: "/cliente" });
      }, 600);
    } catch (err: any) {
      setErrorMessage(
        err.message || "CPF não encontrado no sistema. Verifique se o seu cadastro já foi realizado pela farmácia."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCpfInput("");
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f8fc] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-[#061e38] text-cyan-400 shadow-md mb-2 p-3">
            <img
              src="/conecta_saude-no-bg.svg"
              alt="Logo Conecta Saúde"
              className="size-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display flex items-center justify-center">
            <span>Portal do</span>
            <span className="text-[#0284c7] ml-1.5">Participante</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
            Consulte seus exames, sinais vitais e histórico de triagens clínicas
          </p>
        </div>

        {/* Card Principal */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-md">
          {isAuthenticated && isClient && user ? (
            /* Estado quando já está autenticado como cliente */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Você já está conectado!</h3>
                <p className="text-xs text-muted-foreground">
                  Conectado como <strong className="text-foreground">{user.name}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">CPF: {user.username || "—"}</p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => navigate({ to: "/cliente" })}
                  className="w-full font-semibold gap-2 text-xs"
                >
                  Ver Minhas Triagens
                  <ArrowRight className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-xs"
                >
                  <LogOut className="size-4" />
                  Sair desta Conta
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário exclusivo por CPF */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 mb-4">
                <h2 className="text-lg font-bold text-foreground">Acesse com seu CPF</h2>
                <p className="text-xs text-muted-foreground">
                  Digite o CPF cadastrado na farmácia para visualizar seus dados de saúde
                </p>
              </div>

              {/* Alerta de Erro */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Alerta de Sucesso */}
              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Campo CPF */}
              <div className="space-y-1.5">
                <Label htmlFor="cpf" className="text-xs font-semibold">
                  Número do seu CPF
                </Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={handleCpfChange}
                    maxLength={14}
                    className="pl-9 font-mono text-sm tracking-wide"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Acesso rápido e seguro. Não é necessário digitar senha.
                </span>
              </div>

              {/* Botão de Entrar */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-semibold gap-2 text-xs sm:text-sm mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Consultando cadastro...
                  </>
                ) : (
                  <>
                    Acessar Minhas Triagens
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Rodapé e Link para login de equipe/farmácia */}
        <div className="text-center space-y-2">
          <Link
            to="/login"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors block"
          >
            É farmacêutico ou administrador? Clique aqui para o Login da Equipe →
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors block"
          >
            ← Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
