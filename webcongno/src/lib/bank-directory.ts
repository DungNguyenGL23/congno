import { cache } from "react";

export type BankDirectoryEntry = {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
};

type BanksResponse = {
  data?: BankDirectoryEntry[];
};

const BANKS_ENDPOINT = "https://api.vietqr.io/v2/banks";

export const getBankDirectory = cache(async (): Promise<BankDirectoryEntry[]> => {
  try {
    const response = await fetch(BANKS_ENDPOINT, {
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as BanksResponse;
    return payload.data ?? [];
  } catch {
    return [];
  }
});

export function findBankByCode(
  banks: BankDirectoryEntry[],
  code?: string | null
): BankDirectoryEntry | undefined {
  if (!code) return undefined;
  const normalized = code.trim();
  return banks.find(
    (bank) => bank.bin === normalized || bank.code === normalized
  );
}
