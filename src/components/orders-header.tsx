import { LogOut, Package } from "lucide-react";
import { useState } from "react";
import { useAccount } from "./account-provider";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

export function OrdersHeader({ canSignOut = true }: { canSignOut?: boolean }) {
  const { user } = useAccount();
  const [error, setError] = useState(false);
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    setError(Boolean(error));
  }
  return <header className="app-topbar">
    <div className="page-container flex h-full items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2"><div className="brand-mark"><Package className="size-5" strokeWidth={1.6} /></div><span className="text-sm font-semibold">Importações<span className="ml-3 border-l pl-3 font-normal text-muted-foreground">China</span></span></div>
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        {error && <span role="alert" className="text-destructive">Não foi possível sair.</span>}
        {user && <><span className="hidden max-w-48 truncate sm:inline">{user.email}</span><Button variant="ghost" size="icon" title="Sair da conta" aria-label="Sair da conta" disabled={!canSignOut} onClick={() => void signOut()}><LogOut /></Button></>}
      </div>
    </div>
  </header>;
}