import Link from "next/link";
import { redirect } from "next/navigation";
import { SigninForm } from "./signin-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SigninPage() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Đăng nhập</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tiếp tục quản lý chi tiêu nhóm của bạn.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SigninForm />
      </div>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        Chưa có tài khoản?{" "}
        <Link
          className="font-medium text-sky-600 hover:text-sky-500"
          href="/signup"
        >
          Tạo tài khoản
        </Link>
      </p>
    </main>
  );
}
