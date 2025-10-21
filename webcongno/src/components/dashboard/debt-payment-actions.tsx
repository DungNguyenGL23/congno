'use client';

import { useEffect, useState, useTransition } from "react";
import { DebtPaymentButton } from "./debt-payment-button";
import { setDebtPaidStatus } from "@/app/dashboard/actions";

const NOTE_MAX_LENGTH = 280;

type DebtPaymentActionsProps = {
  debtId: string;
  amount: number;
  ownerName: string;
  bankAccount: string | null;
  bankBin: string | null;
  bankName: string | null;
  bankLogo: string | null;
  memo: string;
  isPaid: boolean;
  paidAt: string | null;
  paymentNote: string | null;
};

type StatusMessage = {
  type: "success" | "error";
  text: string;
};

export function DebtPaymentActions(props: DebtPaymentActionsProps) {
  const {
    debtId,
    amount,
    ownerName,
    bankAccount,
    bankBin,
    bankName,
    bankLogo,
    memo,
    isPaid,
    paidAt,
    paymentNote,
  } = props;

  const [note, setNote] = useState(paymentNote ?? "");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setNote(paymentNote ?? "");
  }, [paymentNote, isPaid]);

  const handleUpdate = (nextStatus: boolean) => {
    const trimmedNote = note.trim().slice(0, NOTE_MAX_LENGTH);
    setStatus(null);
    startTransition(async () => {
      try {
        await setDebtPaidStatus(debtId, {
          isPaid: nextStatus,
          note: nextStatus ? trimmedNote : undefined,
        });
        setStatus({
          type: "success",
          text: nextStatus
            ? "Đã đánh dấu khoản nợ là đã thanh toán."
            : "Khoản nợ đã được chuyển về trạng thái chưa thanh toán.",
        });
      } catch (error) {
        setStatus({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Không thể cập nhật trạng thái khoản nợ.",
        });
      }
    });
  };

  const paidAtLabel = paidAt
    ? new Date(paidAt).toLocaleString("vi-VN")
    : null;

  return (
    <div className="space-y-4">
      <DebtPaymentButton
        debtorId={debtId}
        amount={amount}
        ownerName={ownerName}
        bankAccount={bankAccount}
        bankBin={bankBin}
        bankName={bankName}
        bankLogo={bankLogo}
        memo={memo}
      />

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Trạng thái khoản nợ
          </p>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium uppercase tracking-[0.2em] ${
              isPaid
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
          </span>
        </div>

        {paidAtLabel && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đánh dấu lần cuối: {paidAtLabel}
          </p>
        )}

        <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
          Ghi chú thanh toán (tùy chọn, tối đa {NOTE_MAX_LENGTH} ký tự)
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
          rows={3}
          placeholder="Ví dụ: Chuyển khoản ngày 12/12"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />

        {status && (
          <p
            className={`rounded-lg border p-3 text-xs ${
              status.type === "success"
                ? "border-emerald-400/60 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-rose-500/60 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-200"
            }`}
          >
            {status.text}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleUpdate(true)}
            disabled={isPending || isPaid}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isPaid ? "Đã thanh toán" : "Đánh dấu đã thanh toán"}
          </button>
          <button
            type="button"
            onClick={() => handleUpdate(false)}
            disabled={isPending || !isPaid}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Đánh dấu chưa thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
