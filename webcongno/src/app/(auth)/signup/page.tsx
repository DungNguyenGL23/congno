import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "./signup-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignupPage() {
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
        <h1 className="text-3xl font-semibold">Tạo tài khoản mới</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tổ chức chi tiêu nhóm, theo dõi số tiền bạn đã trả hộ và người cần hoàn
          trả.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SignupForm />
      </div>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        Đã có tài khoản?{" "}
        <Link
          className="font-medium text-sky-600 hover:text-sky-500"
          href="/signin"
        >
          Đăng nhập
        </Link>
      </p>
    </main>
  );
}
