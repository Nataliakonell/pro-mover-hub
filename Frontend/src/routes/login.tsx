import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  HeartPulse,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  LogOut,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | Conecta Saúde" },
      { name: "description", content: "Acesso de usuários e administradores ao Conecta Saúde via nome de usuário ou e-mail." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage("Por favor, preencha o nome de usuário (ou e-mail) e a senha.");
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login(identifier, password);
      setSuccessMessage(`Bem-vindo(a), ${loggedUser.name}!`);

      setTimeout(() => {
        if (loggedUser.role === "admin") {
          navigate({ to: "/administrador" });
        } else {
          navigate({ to: "/" });
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || "Credenciais inválidas. Verifique seu nome de usuário e senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIdentifier("");
    setPassword("");
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logotipo e Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary shadow-xs mb-2">
            <HeartPulse className="size-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Conecta Saúde
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Plataforma de gestão comunitária de saúde e triagens clínicas
          </p>
        </div>

        {/* Card Principal */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {isAuthenticated && user ? (
            /* Estado quando já está autenticado */
            <div className="text-center space-y-5">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-6" />
              </div>

              <div>
                <h2 className="text-base font-bold text-foreground">Sessão Ativa</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Você está conectado como:
                </p>
                <div className="mt-3 p-3.5 rounded-xl bg-muted/60 border border-border/80 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{user.name}</span>
                    {isAdmin ? (
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                        <ShieldCheck className="size-3 mr-1" />
                        Administrador
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Usuário</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-muted-foreground font-mono">
                    {user.username && (
                      <span className="text-foreground font-medium flex items-center gap-1">
                        <AtSign className="size-3 text-primary" />
                        {user.username}
                      </span>
                    )}
                    {user.email && <span>{user.email}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {isAdmin ? (
                  <Button
                    onClick={() => navigate({ to: "/administrador" })}
                    className="w-full font-semibold gap-2 text-xs"
                  >
                    Ir para o Painel do Administrador
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate({ to: "/" })}
                    className="w-full font-semibold gap-2 text-xs"
                  >
                    Ir para o Dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-xs"
                >
                  <LogOut className="size-4" />
                  Sair desta Conta (Logout)
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário de Login */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 mb-4">
                <h2 className="text-lg font-bold text-foreground">Acesse sua Conta</h2>
                <p className="text-xs text-muted-foreground">
                  Entre com seu nome de usuário (ex: <code className="text-primary font-semibold">primeiro.ultimo</code>) ou e-mail
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

              {/* Campo Nome de Usuário / E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-semibold">
                  Nome de Usuário ou E-mail
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="ex: natalia.toffoli ou seu.email@exemplo.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Você pode usar seu usuário formatado (ex: <strong>natalia.toffoli</strong>) ou seu e-mail.
                </span>
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Entrar */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-semibold gap-2 text-xs sm:text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Rodapé / Link para Início */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
