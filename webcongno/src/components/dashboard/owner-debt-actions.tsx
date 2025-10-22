'use client';

import { useState, useTransition } from "react";
import { reviewDebtPayment } from "@/app/dashboard/actions";

const NOTE_MAX_LENGTH = 280;

const statusLabel: Record<string, { label: string; tone: 'default' | 'success' | 'alert' }> = {
  pending: { label: "Chờ xác nhận", tone: "default" },
  confirmed: { label: "Đã xác nhận", tone: "success" },
  disputed: { label: "Chưa nhận được", tone: "alert" },
};

type OwnerDebtActionsProps = {
  debtId: string;
  isPaid: boolean;
  ownerStatus: "pending" | "confirmed" | "disputed";
  ownerNote: string | null;
  ownerUpdatedAt: string | null;
};

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function OwnerDebtActions({
  debtId,
  isPaid,
  ownerStatus,
  ownerNote,
  ownerUpdatedAt,
}: OwnerDebtActionsProps) {
  const [note, setNote] = useState(ownerNote ?? "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = (status: "confirmed" | "disputed" | "pending") => {
    const trimmed = note.trim().slice(0, NOTE_MAX_LENGTH);
    setStatusMessage(null);

    startTransition(async () => {
      try {
        await reviewDebtPayment(debtId, { status, note: trimmed });
        if (status === "confirmed") {
          setStatusMessage("Đã xác nhận người nợ đã thanh toán.");
        } else if (status === "disputed") {
          setStatusMessage("Đã gửi khiếu nại: Chưa nhận được thanh toán.");
        } else {
          setStatusMessage("Đã đặt lại trạng thái chờ xác nhận.");
        }
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái."
        );
      }
    });
  };

  const badge = statusLabel[ownerStatus];
  const badgeClass =
    badge?.tone === "success"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
      : badge?.tone === "alert"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          Trạng thái xác nhận
        </span>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${badgeClass}`}>
          {badge?.label ?? "Trạng thái"}
        </span>
      </div>

      {ownerUpdatedAt && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cập nhật lần cuối: {timeFormatter.format(new Date(ownerUpdatedAt))}
        </p>
      )}

      {ownerNote && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          Ghi chú trước đó: {ownerNote}
        </p>
      )}

      {statusMessage && (
        <p className="rounded-lg border border-sky-400/40 bg-sky-50 p-2 text-xs text-sky-700 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-200">
          {statusMessage}
        </p>
      )}

      {isPaid ? (
        <>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
            Ghi chú (tùy chọn, tối đa {NOTE_MAX_LENGTH} ký tự)
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
            rows={3}
            placeholder="Ví dụ: Đã nhận lúc 10h qua MB Bank"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleAction("confirmed")}
              disabled={isPending || ownerStatus === "confirmed"}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              Xác nhận đã nhận
            </button>
            <button
              type="button"
              onClick={() => handleAction("disputed")}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              Chưa nhận được
            </button>
            {ownerStatus !== "pending" && (
              <button
                type="button"
                onClick={() => handleAction("pending")}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Đặt lại chờ xác nhận
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          Người nợ chưa (hoặc không còn) đánh dấu đã thanh toán. Chờ họ thực hiện lại để xác nhận.
        </p>
      )}
    </div>
  );
}
