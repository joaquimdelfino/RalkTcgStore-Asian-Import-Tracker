import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const AccountContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<{ user: User | null; loading: boolean }>({ user: null, loading: true });
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let changed = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      changed = true;
      setAccount({ user: session?.user ?? null, loading: false });
      if (event === "SIGNED_OUT") queryClient.clear();
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (active && !changed) setAccount({ user: data.user, loading: false });
    }).catch(() => { if (active && !changed) setAccount({ user: null, loading: false }); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}