'use client';

import { useActionState, useEffect } from "react";
import { createExpenseAction } from "./actions";

export type ExpenseMemberOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type ExpenseFormProps = {
  members: ExpenseMemberOption[];
};

export function ExpenseForm({ members }: ExpenseFormProps) {
  const initialState = { status: "idle" as const };
  const [state, formAction, isPending] = useActionState(createExpenseAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      (document.getElementById("expense-form") as HTMLFormElement | null)
        ?.reset();
    }
  }, [state.status]);

  return (
    <form
      id="expense-form"
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Thêm chi tiêu mới</h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Ghi lại khoản tiền bạn đã thanh toán giúp nhóm và danh sách người cần
          hoàn trả.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Tên chi tiêu
          </label>
          <input
            type="text"
            name="title"
            placeholder="Ví dụ: Tiền đặt cọc homestay"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Số tiền (VND)
          </label>
          <input
            type="number"
            min={0}
            step="1000"
            name="amount"
            placeholder="1.000.000"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Ngày thanh toán
          </label>
          <input
            type="date"
            name="paid_at"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Ghi chú
        </label>
        <textarea
          name="note"
          rows={3}
          placeholder="Thông tin bổ sung (tùy chọn)"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Người nợ
        </label>
        {members.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            Chưa có thành viên nào khác trong hệ thống. Khi đồng đội đăng ký và
            hoàn tất onboarding, họ sẽ xuất hiện tại đây để bạn phân chia khoản
            nợ.
          </p>
        ) : (
          <fieldset className="mt-3 space-y-2">
            {members.map((member) => {
              const displayName =
                member.full_name?.trim() || member.email || "Thành viên";

              return (
                <label
                  key={member.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-sky-400 dark:border-slate-700 dark:bg-slate-950"
                >
                  <input
                    type="checkbox"
                    name="debtors"
                    value={member.id}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {displayName}
                    </span>
                    {member.email && member.email !== displayName ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {member.email}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Mỗi người được chọn sẽ phải hoàn lại toàn bộ số tiền bạn nhập ở trên.
        </p>
      </div>

      {state.status === "error" && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-200">
          {state.message ?? "Không thể tạo chi tiêu. Hãy thử lại."}
        </p>
      )}

      {state.status === "success" && (
        <p className="rounded-lg border border-emerald-400/40 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {state.message ?? "Đã lưu chi tiêu mới."}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || members.length === 0}
        className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-400"
      >
        {members.length === 0
          ? "Chờ thêm thành viên"
          : isPending
          ? "Đang lưu..."
          : "Lưu chi tiêu"}
      </button>
    </form>
  );
}
