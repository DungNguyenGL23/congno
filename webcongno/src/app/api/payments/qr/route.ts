import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VIETQR_ENDPOINT = "https://api.vietqr.io/v2/generate";
const clientId = process.env.VIETQR_CLIENT_ID;
const apiKey = process.env.VIETQR_API_KEY;

type RequestBody = {
  debtorId?: string;
};

type VietQrResponse = {
  code?: string;
  desc?: string;
  data?: {
    qrDataURL?: string;
    qrCode?: string;
    message?: string;
  };
};

const VIETNAMESE_DIACRITIC_REGEX = /[\u0300-\u036f]/g;
const SPECIAL_CHAR_REGEX = /[^0-9A-Za-z\s]/g;

function normalizeBankAccountName(name: string): string {
  const noAccents = name
    .normalize("NFD")
    .replace(VIETNAMESE_DIACRITIC_REGEX, "")
    .replace(SPECIAL_CHAR_REGEX, "");

  return noAccents.toUpperCase().trim();
}

function normalizeTransferMemo(memo: string): string {
  const sanitized = memo
    .normalize("NFD")
    .replace(VIETNAMESE_DIACRITIC_REGEX, "")
    .replace(SPECIAL_CHAR_REGEX, "")
    .trim();

  return sanitized.slice(0, 25);
}

export async function POST(request: Request) {
  if (!clientId || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Thiếu thông tin cấu hình VietQR. Vui lòng bổ sung VIETQR_CLIENT_ID và VIETQR_API_KEY.",
      },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Không thể khởi tạo Supabase client trên máy chủ. Kiểm tra lại biến môi trường.",
      },
      { status: 500 }
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const debtorId = body.debtorId;

  if (!debtorId) {
    return NextResponse.json(
      { error: "Thiếu mã khoản nợ (debtorId)." },
      { status: 400 }
    );
  }

  const debt = await prisma.expenseDebtor.findUnique({
    where: { id: debtorId },
    include: {
      expense: {
        include: {
          createdBy: true,
        },
      },
    },
  });

  if (!debt) {
    return NextResponse.json(
      { error: "Không tìm thấy khoản nợ." },
      { status: 404 }
    );
  }

  if (debt.debtorId !== user.id) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập khoản nợ này." },
      { status: 403 }
    );
  }

  const ownerProfile = debt.expense.createdBy;

  if (!ownerProfile) {
    return NextResponse.json(
      { error: "Khoản chi chưa được cấu hình thông tin ngân hàng đầy đủ." },
      { status: 400 }
    );
  }

  if (
    !ownerProfile.bankAccount ||
    !ownerProfile.bankCode ||
    !ownerProfile.bankOwner
  ) {
    return NextResponse.json(
      {
        error:
          "Người tạo khoản chi chưa cập nhật đủ thông tin ngân hàng để tạo QR.",
      },
      { status: 400 }
    );
  }

  const amountNumber = Number(debt.owedAmount ?? 0);

  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return NextResponse.json(
      {
        error:
          "Số tiền cần thanh toán không hợp lệ. Vui lòng liên hệ người tạo khoản chi.",
      },
      { status: 400 }
    );
  }

  const accountNo = ownerProfile.bankAccount.replace(/\s+/g, "");
  if (!/^\d{6,19}$/.test(accountNo)) {
    return NextResponse.json(
      {
        error:
          "Số tài khoản nhận không hợp lệ. Hãy cập nhật lại thông tin ngân hàng.",
      },
      { status: 400 }
    );
  }

  const accountName = normalizeBankAccountName(ownerProfile.bankOwner);
  const createdAtLabel = new Date(
    debt.expense.createdAt ?? debt.createdAt
  ).toLocaleDateString("vi-VN");
  const debtorLabel = (
    user.user_metadata?.full_name ?? user.email ?? "User"
  ).trim();
  const memoRaw = `${debtorLabel} ${debt.expense.title ?? "Thanh toan"} ${createdAtLabel}`;
  const memo = normalizeTransferMemo(memoRaw);
  const acqId = ownerProfile.bankCode;

  if (!/^\d{6}$/.test(acqId ?? "")) {
    return NextResponse.json(
      {
        error:
          "Mã ngân hàng (BIN) không hợp lệ. Hãy chọn lại ngân hàng của người thụ hưởng.",
      },
      { status: 400 }
    );
  }

  const payload = {
    accountNo,
    accountName,
    acqId,
    amount: Math.round(amountNumber),
    addInfo: memo || "Thanh toan",
    template: "compact",
  };

  const response = await fetch(VIETQR_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      {
        error: "Không thể tạo mã QR từ VietQR.",
        details: text,
      },
      { status: 502 }
    );
  }

  const result = (await response.json()) as VietQrResponse;

  if (result.code && result.code !== "00") {
    return NextResponse.json(
      {
        error: result.desc ?? "VietQR trả về lỗi.",
        code: result.code,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    data: {
      qrDataURL: result.data?.qrDataURL ?? null,
      qrCode: result.data?.qrCode ?? null,
      accountName,
      accountNo,
      acqId,
      amount: payload.amount,
      addInfo: payload.addInfo,
    },
  });
}
