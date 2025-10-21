import { redirect } from "next/navigation";
import { ExpenseForm, type ExpenseMemberOption } from "./expense-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { prisma } from "@/lib/prisma";
import { DebtPaymentActions } from "@/components/dashboard/debt-payment-actions";
import { getBankDirectory, findBankByCode } from "@/lib/bank-directory";

type Expense = {
  id: string;
  title: string;
  amount: number;
  note: string | null;
  paid_at: string | null;
  created_at: string;
  expense_debtors: Array<{
    debtor_id: string | null;
    debtor_email: string | null;
    debtor_name: string | null;
    owed_amount: number | null;
  }>;
};

type DebtForUser = {
  id: string;
  expense_id: string;
  title: string;
  amount: number;
  created_at: string;
  owner_name: string;
  owner_bank_account: string | null;
  owner_bank_code: string | null;
  owner_bank_name: string | null;
  owner_bank_logo: string | null;
  memo: string;
  is_paid: boolean;
  paid_at: string | null;
  payment_note: string | null;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "0";
  }

  const numeric = value;

  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return numeric.toLocaleString("vi-VN");
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      "/?error=missing-supabase&message=Thiếu cấu hình Supabase. Hãy cập nhật biến môi trường."
    );
  }

  const { data: userData, error: sessionError } = await supabase.auth.getUser();

  if (sessionError) {
    redirect(`/signin?error=${encodeURIComponent(sessionError.message)}`);
  }

  const user = userData?.user;

  if (!user) {
    redirect("/signin");
  }

  const [profile, expensesData, members, debtsData, bankDirectory] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
    }),
    prisma.expense.findMany({
      where: { createdById: user.id },
      include: {
        debtors: {
          include: {
            debtor: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profile.findMany({
      where: {
        id: { not: user.id },
        email: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: [
        { fullName: "asc" },
        { email: "asc" },
      ],
    }),
    prisma.expenseDebtor.findMany({
      where: {
        debtorId: user.id,
      },
      include: {
        expense: {
          include: {
            createdBy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getBankDirectory(),
  ]);

  const bankInfo = {
    bank_code: profile?.bankCode ?? null,
    bank_account: profile?.bankAccount ?? null,
    bank_owner: profile?.bankOwner ?? null,
  };

  if (!profile) {
    redirect("/onboarding/bank");
  }

  if (
    !bankInfo.bank_code ||
    !bankInfo.bank_account ||
    !bankInfo.bank_owner
  ) {
    redirect("/onboarding/bank");
  }

  const expenses: Expense[] = expensesData.map((expense) => ({
    id: expense.id,
    title: expense.title,
    amount: expense.amount.toNumber(),
    note: expense.note,
    paid_at: expense.paidAt ? expense.paidAt.toISOString() : null,
    created_at: expense.createdAt.toISOString(),
    expense_debtors: expense.debtors.map((debtor) => ({
      debtor_id: debtor.debtorId,
      debtor_email: debtor.debtorEmail,
      debtor_name: debtor.debtorName ?? debtor.debtor?.fullName ?? debtor.debtor?.email ?? null,
      owed_amount: debtor.owedAmount?.toNumber() ?? null,
    })),
  }));

  const teamMembers: ExpenseMemberOption[] = members.map((member) => ({
    id: member.id,
    full_name: member.fullName,
    email: member.email,
  }));

  const debtorDisplayName =
    user.user_metadata?.full_name ?? user.email ?? "Nguoi dung";

  const myDebts: DebtForUser[] = debtsData.map((debt) => {
    const bankEntry = findBankByCode(
      bankDirectory,
      debt.expense.createdBy?.bankCode ?? null
    );
    const createdAtIso = debt.createdAt.toISOString();
    const createdAtLabel = new Date(debt.expense.createdAt ?? debt.createdAt).toLocaleDateString(
      "vi-VN"
    );
    const memoLabel = `${debtorDisplayName} ${debt.expense.title ?? "Thanh toan"} ${createdAtLabel}`;

    return {
      id: debt.id,
      expense_id: debt.expenseId,
      title: debt.expense.title,
      amount: debt.owedAmount?.toNumber() ?? 0,
      created_at: createdAtIso,
      owner_name:
        debt.expense.createdBy?.fullName ??
        debt.expense.createdBy?.email ??
        "Không rõ",
      owner_bank_account: debt.expense.createdBy?.bankAccount ?? null,
      owner_bank_code: debt.expense.createdBy?.bankCode ?? null,
      owner_bank_name: bankEntry?.shortName ?? bankEntry?.name ?? null,
      owner_bank_logo: bankEntry?.logo ?? null,
      memo: memoLabel,
      is_paid: debt.isPaid,
      paid_at: debt.paidAt ? debt.paidAt.toISOString() : null,
      payment_note: debt.paymentNote ?? null,
    };
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-500">
            Bảng điều khiển
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Xin chào, {user.user_metadata?.full_name ?? user.email}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Theo dõi các khoản chi bạn đã ứng và những người cần hoàn tiền.
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:w-auto"
          >
            Đăng xuất
          </button>
        </form>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Thông tin nhận tiền</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium">Tên chủ tài khoản</dt>
              <dd className="text-right font-semibold">
                {bankInfo.bank_owner}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium">Số tài khoản</dt>
              <dd className="text-right font-semibold tracking-wide">
                {bankInfo.bank_account}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium">Mã ngân hàng</dt>
              <dd className="text-right font-semibold">
                {bankInfo.bank_code}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Muốn thay đổi thông tin ngân hàng? Cập nhật lại tại trang{" "}
            <a
              className="font-medium text-sky-600 hover:text-sky-500"
              href="/onboarding/bank"
            >
              hồ sơ thanh toán
            </a>
            .
          </p>
        </div>

        <ExpenseForm members={teamMembers} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Chi tiêu gần đây</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {expenses.length} khoản
          </span>
        </div>

        {expenses.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Chưa có khoản chi nào. Bắt đầu bằng cách điền biểu mẫu “Thêm chi tiêu
            mới”.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {expense.title}
                    </p>
                    {expense.note ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {expense.note}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-base font-semibold text-sky-600">
                    {formatCurrency(expense.amount)}đ
                  </p>
                </div>

                <dl className="mt-4 grid gap-3 text-xs text-slate-500 dark:text-slate-400 md:grid-cols-3">
                  <div>
                    <dt className="font-medium uppercase tracking-[0.15em]">
                      Thanh toán
                    </dt>
                    <dd>
                      {expense.paid_at
                        ? new Date(expense.paid_at).toLocaleDateString("vi-VN")
                        : "Chưa rõ"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase tracking-[0.15em]">
                      Tạo lúc
                    </dt>
                    <dd>
                      {new Date(expense.created_at).toLocaleString("vi-VN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase tracking-[0.15em]">
                      Người nợ
                    </dt>
                    <dd>{expense.expense_debtors.length} người</dd>
                  </div>
                </dl>

                {expense.expense_debtors.length > 0 && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Danh sách cần hoàn tiền
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {expense.expense_debtors.map((debtor, index) => (
                        <li
                          key={`${expense.id}-${debtor.debtor_email ?? index}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>
                            {debtor.debtor_name ?? debtor.debtor_email}
                            {debtor.debtor_name && debtor.debtor_email
                              ? ` (${debtor.debtor_email})`
                              : null}
                          </span>
                          {debtor.owed_amount !== null ? (
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {formatCurrency(debtor.owed_amount)}đ
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Khoản nợ của tôi</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {myDebts.length} khoản
          </span>
        </div>

        {myDebts.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Bạn chưa có khoản nợ nào. Khi được phân chia chi tiêu, danh sách sẽ
            hiển thị tại đây để bạn thanh toán nhanh bằng VietQR.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {myDebts.map((debt) => (
              <li
                key={debt.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {debt.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chủ nợ: {debt.owner_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ngày tạo: {new Date(debt.created_at).toLocaleString("vi-VN")}
                    </p>
                    {debt.payment_note && debt.is_paid && (
                      <p className="rounded-lg border border-emerald-400/40 bg-emerald-50 p-2 text-xs text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                        Ghi chú: {debt.payment_note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-base font-semibold text-emerald-600">
                      {formatCurrency(debt.amount)}đ
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        debt.is_paid
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {debt.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {debt.owner_bank_account && debt.owner_bank_code ? (
                    <DebtPaymentActions
                      key={`${debt.id}-${debt.is_paid}-${debt.payment_note ?? ""}`}
                      debtId={debt.id}
                      amount={debt.amount}
                      ownerName={debt.owner_name}
                      bankAccount={debt.owner_bank_account}
                      bankBin={debt.owner_bank_code}
                      bankName={debt.owner_bank_name}
                      bankLogo={debt.owner_bank_logo}
                      memo={debt.memo}
                      isPaid={debt.is_paid}
                      paidAt={debt.paid_at}
                      paymentNote={debt.payment_note}
                    />
                  ) : (
                    <p className="rounded-lg border border-amber-400/40 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-200">
                      Người nhận chưa cấu hình đầy đủ thông tin ngân hàng. Vui
                      lòng thông báo để họ cập nhật.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
