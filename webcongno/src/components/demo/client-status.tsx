'use client';

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/components/providers/supabase-provider";

type Status = "checking" | "ready" | "missing" | "error";

export function ClientStatus() {
  const supabase = useSupabaseClient();
  const [status, setStatus] = useState<Status>("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      if (!supabase) {
        if (isMounted) {
          setStatus("missing");
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setStatus("ready");
      setUserEmail(data.session?.user.email ?? null);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const statusStyles: Record<Status, string> = {
    checking:
      "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
    ready:
      "border-emerald-400/60 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/50 dark:text-emerald-200",
    missing:
      "border-amber-400/60 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/50 dark:text-amber-200",
    error:
      "border-rose-400/60 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-950/50 dark:text-rose-200",
  };

  const labelMap: Record<Status, string> = {
    checking: "Checking client session…",
    ready: "Client ready",
    missing: "Missing configuration",
    error: "Client error",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm transition-colors ${statusStyles[status]}`}
    >
      <p className="font-medium">{labelMap[status]}</p>
      {userEmail && (
        <p className="mt-1 text-xs opacity-80">Signed in as {userEmail}</p>
      )}
      {status === "missing" && (
        <p className="mt-1 text-xs opacity-80">
          Provide Supabase credentials to initialise the browser client.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="mt-1 text-xs opacity-80">{errorMessage}</p>
      )}
      {status === "checking" && (
        <p className="mt-1 text-xs opacity-80">
          We ask Supabase for the current session to verify connectivity.
        </p>
      )}
    </div>
  );
}
