import { redirect } from "next/navigation";
import { BankOnboardingForm } from "./bank-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getBankDirectory } from "@/lib/bank-directory";

export default async function BankOnboardingPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      "/?error=missing-supabase&message=Thiếu cấu hình Supabase. Hãy cập nhật biến môi trường."
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    redirect("/signin");
  }

  const [banks, profile] = await Promise.all([
    getBankDirectory(),
    prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        bankCode: true,
        bankAccount: true,
        bankOwner: true,
      },
    }),
  ]);

  const availableBanks = banks ?? [];

  const profileDefaults = {
    bank_code: profile?.bankCode ?? "",
    bank_account: profile?.bankAccount ?? "",
    bank_owner: profile?.bankOwner ?? "",
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-500">
          Hoàn thiện hồ sơ
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Cập nhật thông tin tài khoản nhận tiền
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sau khi đăng ký, bạn cần cung cấp thông tin chuyển khoản để các thành
          viên khác có thể thanh toán cho bạn. Bạn có thể thay đổi thông tin này
          bất cứ lúc nào trong phần cài đặt.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {availableBanks.length === 0 ? (
          <p className="rounded-lg border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-200">
            Không thể tải danh sách ngân hàng từ VietQR. Hãy kiểm tra kết nối
            mạng và thử lại sau.
          </p>
        ) : (
          <BankOnboardingForm
            banks={availableBanks}
            defaultValues={profileDefaults}
          />
        )}
      </section>
    </main>
  );
}
