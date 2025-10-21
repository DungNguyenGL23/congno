import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientStatus } from "@/components/demo/client-status";
import Link from "next/link";

type Todo = {
  id: number;
  title: string;
  is_complete?: boolean | null;
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  let todos: Todo[] = [];
  let supabaseError: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from<Todo>("todos")
      .select("id, title, is_complete")
      .limit(5);

    if (error) {
      supabaseError = error.message;
    } else if (data) {
      todos = data;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-6 py-16">
      <header className="space-y-4 text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-500">
          Next.js + Supabase
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Your Supabase-backed starter is ready.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Configure your Supabase credentials, run migrations, and start
          building full-stack features with server actions, route handlers, or
          client components.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
        >
          Bắt đầu miễn phí
        </Link>
        <Link
          href="/signin"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Tôi đã có tài khoản
        </Link>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold">1. Configure environment</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Copy <code>.env.example</code> to <code>.env.local</code> and fill in
          your Supabase project credentials. Restart the dev server afterwards.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">2. Sample query</h2>
          <Link
            href="https://supabase.com/docs/guides"
            className="text-sm font-medium text-sky-600 hover:text-sky-500"
          >
            Supabase docs →
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This section reads the first five rows from a <code>todos</code> table
          using a server-side Supabase client. Create the table or change the
          query to match your schema.
        </p>

        {!supabase && (
          <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-200">
            Supabase is not configured yet. Update your environment variables to
            enable data access.
          </p>
        )}

        {supabaseError && (
          <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-200">
            Supabase responded with: {supabaseError}
          </p>
        )}

        {!supabaseError && supabase && (
          <ul className="mt-6 space-y-3">
            {todos.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                No rows returned yet. Insert data into the <code>todos</code>{" "}
                table or adjust the query in <code>src/app/page.tsx</code>.
              </li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    {todo.title}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {todo.is_complete ? "Done" : "Pending"}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">3. Client helper</h2>
          <Link
            href="https://supabase.com/docs/guides/auth/quickstarts/nextjs"
            className="text-sm font-medium text-sky-600 hover:text-sky-500"
          >
            Auth quickstart →
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          The shared Supabase provider gives client components access to auth
          state and the browser SDK. Try signing in with Supabase Auth to see
          the session populate.
        </p>
        <div className="mt-4">
          <ClientStatus />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Server actions"
          description="Call Supabase inside a server action for trusted operations such as inserts or updates."
          href="https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs#using-server-actions"
        />
        <Card
          title="Route handlers"
          description="Create typed REST endpoints with the App Router using Supabase inside your API routes."
          href="https://nextjs.org/docs/app/building-your-application/routing/router-handlers"
        />
        <Card
          title="Realtime + auth"
          description="Subscribe to changes and manage auth with Supabase's realtime channels and Auth helpers."
          href="https://supabase.com/docs/guides/auth/quickstarts/nextjs"
        />
      </section>
    </main>
  );
}

type CardProps = {
  title: string;
  description: string;
  href: string;
};

function Card({ title, description, href }: CardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
    >
      <h3 className="text-base font-semibold group-hover:text-sky-500">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 group-hover:text-sky-500">
        Learn more →
      </span>
    </Link>
  );
}
