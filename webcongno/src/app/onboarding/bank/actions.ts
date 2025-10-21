'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type ActionState = {
  status: "idle" | "error";
  message?: string;
};

export async function updateBankInfo(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Supabase chưa được cấu hình. Hãy cập nhật biến môi trường và khởi động lại máy chủ.",
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

  const bankCode = formData.get("bank_code")?.toString().trim();
  const bankAccount = formData.get("bank_account")?.toString().trim();
  const bankOwner = formData.get("bank_owner")?.toString().trim();

  if (!bankCode || !bankAccount || !bankOwner) {
    return {
      status: "error",
      message: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng.",
    };
  }

  if (!user.email) {
    return {
      status: "error",
      message: "Tài khoản Supabase chưa có email hợp lệ.",
    };
  }

  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        bankCode,
        bankAccount,
        bankOwner,
        fullName: user.user_metadata?.full_name ?? user.email ?? null,
        email: user.email,
      },
      create: {
        id: user.id,
        bankCode,
        bankAccount,
        bankOwner,
        fullName: user.user_metadata?.full_name ?? user.email ?? null,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Không thể lưu thông tin tài khoản ngân hàng.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
