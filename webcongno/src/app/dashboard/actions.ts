'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/signin");
  }

  await supabase.auth.signOut();
  redirect("/signin");
}

export async function createExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Supabase chưa được cấu hình. Cập nhật biến môi trường để tiếp tục.",
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { status: "error", message: userError.message };
  }

  const user = userData?.user;

  if (!user) {
    redirect("/signin");
  }

  const title = formData.get("title")?.toString().trim();
  const amountValue = formData.get("amount")?.toString().trim();
  const paidAt = formData.get("paid_at")?.toString().trim();
  const note = formData.get("note")?.toString().trim();
  const debtorIds = formData
    .getAll("debtors")
    .map((entry) => entry?.toString().trim())
    .filter((value): value is string => Boolean(value) && value !== user.id);

  const uniqueDebtorIds = Array.from(new Set(debtorIds));

  if (!title || !amountValue) {
    return { status: "error", message: "Vui lòng nhập tên chi tiêu và số tiền." };
  }

  const amount = Number.parseFloat(amountValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: "error", message: "Số tiền không hợp lệ." };
  }

  if (uniqueDebtorIds.length === 0) {
    return {
      status: "error",
      message: "Vui lòng chọn ít nhất một thành viên cần hoàn tiền.",
    };
  }

  let debtorProfiles;
  try {
    debtorProfiles = await prisma.profile.findMany({
      where: {
        id: {
          in: uniqueDebtorIds,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });
  } catch (error: unknown) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin thành viên.",
    };
  }

  if (debtorProfiles.length === 0) {
    return {
      status: "error",
      message: "Không tìm thấy thông tin các thành viên vừa chọn.",
    };
  }

  if (debtorProfiles.length !== uniqueDebtorIds.length) {
    return {
      status: "error",
      message:
        "Một số thành viên đã chọn không còn tồn tại hoặc chưa hoàn tất hồ sơ.",
    };
  }

  try {
    await prisma.expense.create({
      data: {
        title,
        amount: new Prisma.Decimal(amount).toDecimalPlaces(2),
        note: note || null,
        paidAt: paidAt ? new Date(paidAt) : null,
        createdById: user.id,
        debtors: {
          create: debtorProfiles.map((profile) => {
            if (!profile.email) {
              throw new Error(
                "Một số thành viên chưa có email trong hồ sơ. Hãy cập nhật trước khi phân chia khoản nợ."
              );
            }

            return {
              debtorId: profile.id,
              debtorEmail: profile.email,
              debtorName: profile.fullName ?? profile.email,
              owedAmount: new Prisma.Decimal(amount).toDecimalPlaces(2),
            };
          }),
        },
      },
    });
  } catch (error: unknown) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Không thể tạo chi tiêu mới.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Đã tạo chi tiêu mới." };
}

export async function setDebtPaidStatus(
  debtId: string,
  payload: { isPaid: boolean; note?: string }
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error(
      "Supabase chưa được cấu hình. Hãy kiểm tra lại biến môi trường."
    );
  }

  const { data: userData, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  const user = userData?.user;

  if (!user) {
    throw new Error("Bạn cần đăng nhập để cập nhật trạng thái khoản nợ.");
  }

  const debt = await prisma.expenseDebtor.findUnique({
    where: { id: debtId },
    select: {
      debtorId: true,
    },
  });

  if (!debt) {
    throw new Error("Khoản nợ không tồn tại hoặc đã bị xóa.");
  }

  if (debt.debtorId !== user.id) {
    throw new Error("Bạn không có quyền cập nhật khoản nợ này.");
  }

  const sanitizedNote = payload.note?.toString().trim() ?? "";
  const limitedNote =
    sanitizedNote.length > 280
      ? sanitizedNote.slice(0, 280)
      : sanitizedNote;

  await prisma.expenseDebtor.update({
    where: { id: debtId },
    data: {
      isPaid: payload.isPaid,
      paidAt: payload.isPaid ? new Date() : null,
      paymentNote: payload.isPaid ? (limitedNote || null) : null,
    },
  });

  revalidatePath("/dashboard");
}
