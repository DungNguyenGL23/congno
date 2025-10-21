'use client';

import { useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const missingEnvMessage =
  "Supabase environment variables are not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.";

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(missingEnvMessage);
    }
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

/**
 * React hook that returns a browser-ready Supabase client instance.
 * The client is memoised so it is created only once per component tree.
 */
export function useSupabaseBrowserClient(): SupabaseClient | null {
  return useMemo(createSupabaseBrowserClient, []);
}
