'use client';

import Image from "next/image";
import { useState } from "react";

type DebtPaymentButtonProps = {
  debtorId: string;
  amount: number;
  ownerName: string;
  bankAccount: string | null;
  bankBin: string | null;
  bankName: string | null;
  bankLogo: string | null;
  memo: string;
};

type ApiResponse = {
  data?: {
    qrDataURL?: string | null;
    qrCode?: string | null;
    accountName: string;
    accountNo: string;
    acqId: string;
    amount: number;
    addInfo: string;
  };
  error?: string;
  details?: string;
};

export function DebtPaymentButton({
  debtorId,
  amount,
  ownerName,
  bankAccount,
  bankBin,
  bankName,
  bankLogo,
  memo,
}: DebtPaymentButtonProps) {
  const displayBankName = bankName ?? (bankBin ? `Ngân hàng BIN ${bankBin}` : "Ngân hàng chưa rõ");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | {
        status: "success";
        qrDataURL: string | null | undefined;
        qrCode: string | null | undefined;
        accountName: string;
        accountNo: string;
        acqId: string;
        addInfo: string;
      }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function handleGenerate() {
    try {
      setState({ status: "loading" });
      const response = await fetch("/api/payments/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ debtorId }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể tạo mã QR.");
      }

      if (!payload.data?.qrDataURL && !payload.data?.qrCode) {
        throw new Error("VietQR không trả về dữ liệu hình ảnh.");
      }

      setState({
        status: "success",
        qrDataURL: payload.data.qrDataURL,
        qrCode: payload.data.qrCode,
        accountName: payload.data.accountName,
        accountNo: payload.data.accountNo,
        acqId: payload.data.acqId,
        addInfo: payload.data.addInfo,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo mã QR. Vui lòng thử lại.",
      });
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={state.status === "loading"}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {state.status === "loading" ? "Đang tạo QR..." : "Tạo mã QR thanh toán"}
      </button>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        {bankLogo ? (
          <Image
            src={bankLogo}
            alt={bankName ?? "Ngân hàng"}
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 rounded-full border border-slate-200 bg-white object-contain dark:border-slate-700"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-600 dark:text-slate-300">
            {(bankName ?? ownerName ?? "NB")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {displayBankName}
          </span>
          <span>
            Số tài khoản:{" "}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {bankAccount ?? "Chưa cập nhật"}
            </span>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <p className="font-medium text-slate-700 dark:text-slate-200">
          Nội dung gợi ý:
        </p>
        <p className="mt-1 text-slate-900 dark:text-slate-100">{memo}</p>
      </div>

      {state.status === "error" && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-200">
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            Quét mã VietQR để thanh toán {amount.toLocaleString("vi-VN")}đ cho{" "}
            <span className="text-slate-900 dark:text-slate-100">{ownerName}</span>.
          </p>
          <dl className="grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
            <div>
              <dt className="font-semibold uppercase tracking-[0.2em]">
                Số tài khoản
              </dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {state.accountNo}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.2em]">
                Nội dung
              </dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {state.addInfo}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col items-center justify-center space-y-2">
            {state.qrDataURL ? (
              <Image
                src={state.qrDataURL}
                alt={`QR thanh toán ${ownerName}`}
                width={192}
                height={192}
                unoptimized
                className="h-48 w-48 rounded-xl border border-slate-200 bg-white object-contain p-2 dark:border-slate-700"
              />
            ) : state.qrCode ? (
              <pre className="max-w-full overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {state.qrCode}
              </pre>
            ) : null}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quét mã bằng ứng dụng ngân hàng để thanh toán nhanh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
