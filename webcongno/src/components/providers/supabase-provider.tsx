'use client';

import { createContext, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

const SupabaseContext = createContext<SupabaseClient | null>(null);

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const supabase = useSupabaseBrowserClient();

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseClient(): SupabaseClient | null {
  return useContext(SupabaseContext);
}
