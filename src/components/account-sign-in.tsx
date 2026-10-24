import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import "@lovable.dev/cloud-auth-js/styles.css";

export function AccountSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(provider: "google" | "lovable") {
    setBusy(true);
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) setError("Não foi possível entrar. Tente novamente.");
    } catch { setError("Não foi possível entrar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <section className="account-access" aria-label="Acesso à conta">
    <h2 className="text-lg font-semibold">Entrar na sua conta</h2>
    <p className="mt-2 text-sm text-muted-foreground">Acesse seus pedidos de importação.</p>
    <div className="mt-6 flex flex-col gap-3">
      <Button className="h-11 shadow-none" disabled={busy} onClick={() => void signIn("google")}>
        {busy ? <LoaderCircle className="animate-spin" /> : <LogIn />}Continuar com Google
      </Button>
      <Button className="auth-button w-full" disabled={busy} onClick={() => void signIn("lovable")}>Entrar</Button>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  </section>;
}