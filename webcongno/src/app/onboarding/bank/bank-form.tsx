'use client';

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { updateBankInfo } from "./actions";
import type { BankDirectoryEntry } from "@/lib/bank-directory";

type Bank = BankDirectoryEntry;

type BankFormProps = {
  banks: Bank[];
  defaultValues?: {
    bank_code?: string | null;
    bank_account?: string | null;
    bank_owner?: string | null;
  };
};

export function BankOnboardingForm({ banks, defaultValues }: BankFormProps) {
  const initialState = { status: "idle" as const };
  const [state, formAction, isPending] = useActionState(updateBankInfo, initialState);
  const [search, setSearch] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState(
    defaultValues?.bank_code ?? ""
  );

  useEffect(() => {
    if (state.status === "error") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.status]);

  useEffect(() => {
    if (defaultValues?.bank_code) {
      setSelectedBankCode(defaultValues.bank_code);
    }
  }, [defaultValues?.bank_code]);

  const filteredBanks = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    return banks
      .slice()
      .sort((a, b) => a.shortName.localeCompare(b.shortName))
      .filter((bank) => {
        if (!normalizedQuery) return true;
        const haystack = [
          bank.shortName,
          bank.name,
          bank.code,
          bank.bin,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [banks, search]);

  const selectedBank = useMemo(() => {
    if (!selectedBankCode) return null;
    return (
      banks.find((bank) => (bank.bin || bank.code) === selectedBankCode) ?? null
    );
  }, [banks, selectedBankCode]);

  const disableSubmit = isPending || (banks.length > 0 && !selectedBankCode);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Ngân hàng
        </label>
        {banks.length > 0 && (
          <>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm ngân hàng theo tên hoặc mã"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input type="hidden" name="bank_code" value={selectedBankCode} />
          </>
        )}
        {banks.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            <p>Không thể tải danh sách ngân hàng. Nhập thủ công mã BIN bên dưới.</p>
            <input
              type="text"
              name="bank_code"
              placeholder="Ví dụ: 970415"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            {filteredBanks.length === 0 ? (
              <p className="p-2 text-sm text-slate-500 dark:text-slate-400">
                Không tìm thấy ngân hàng phù hợp với từ khóa.
              </p>
            ) : (
              filteredBanks.map((bank) => {
                const value = bank.bin || bank.code;
                const isSelected = value === selectedBankCode;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setSelectedBankCode(value)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                      isSelected
                        ? "border border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-950/40"
                        : "border border-transparent hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                    }`}
                  >
                    {bank.logo ? (
                      <Image
                        src={bank.logo}
                        alt={bank.shortName}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-full border border-slate-200 bg-white object-contain dark:border-slate-700"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs font-medium uppercase text-slate-500 dark:border-slate-600 dark:text-slate-300">
                        {bank.shortName.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {bank.shortName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {bank.name}
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                      {value}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
        {banks.length > 0 && !selectedBankCode && (
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Hãy chọn một ngân hàng trước khi lưu.
          </p>
        )}
        {selectedBank && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đã chọn: {selectedBank.shortName} – BIN {selectedBank.bin || selectedBank.code}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Số tài khoản
        </label>
        <input
          type="text"
          name="bank_account"
          defaultValue={defaultValues?.bank_account ?? ""}
          placeholder="Ví dụ: 0123456789"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Tên chủ tài khoản
        </label>
        <input
          type="text"
          name="bank_owner"
          defaultValue={defaultValues?.bank_owner ?? ""}
          placeholder="Tên in trên thẻ"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          required
        />
      </div>

      {state.status === "error" && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-200">
          {state.message ?? "Không thể lưu thông tin. Hãy thử lại."}
        </p>
      )}

      <button
        type="submit"
        disabled={disableSubmit}
        className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-400"
      >
        {isPending
          ? "Đang lưu..."
          : banks.length > 0 && !selectedBankCode
          ? "Chọn ngân hàng để tiếp tục"
          : "Lưu thông tin & tiếp tục"}
      </button>
    </form>
  );
}
