## Next.js + Supabase Expense Manager

Ứng dụng được tạo từ `create-next-app` và cấu hình sẵn để kết nối
[Supabase](https://supabase.com) bằng `@supabase/ssr`. Dự án cung cấp bộ màn
hình đăng ký/đăng nhập, quy trình yêu cầu thông tin tài khoản ngân hàng, và
dashboard quản lý chi tiêu nhóm.

### Tính năng chính

- ✅ Next.js 14 App Router, TypeScript, Tailwind CSS
- ✅ Supabase server/browser helpers và provider chia sẻ phiên auth
- ✅ Đăng ký, đăng nhập, đăng xuất với Supabase Auth
- ✅ Onboarding bắt buộc nhập tài khoản ngân hàng (lấy danh sách từ
  `https://api.vietqr.io/v2/banks`)
- ✅ Dashboard tạo chi tiêu và phân bổ người nợ từ danh sách user nội bộ
- ✅ Người nợ tạo mã VietQR để thanh toán nhanh các khoản phải trả
- ✅ Quy trình đánh dấu khoản nợ đã thanh toán kèm ghi chú và thời gian
- ✅ Prisma ORM để quản lý schema, migration và sinh client
- ✅ Server Actions để lưu thông tin ngân hàng và chi tiêu

## Bắt đầu

1. **Cài đặt phụ thuộc**

   ```bash
   npm install
   ```

2. **Thiết lập biến môi trường**

   ```bash
   cp .env.example .env.local
   # Điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Có thể bổ sung SUPABASE_SERVICE_ROLE_KEY cho Server Actions bảo mật hơn
   # Thêm VIETQR_CLIENT_ID và VIETQR_API_KEY nếu muốn tạo QR thanh toán
   ```

   Sau khi sửa `.env.local`, khởi động lại dev server để biến môi trường được áp dụng.

3. **Áp dụng schema và sinh Prisma Client**

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

   Nếu cơ sở dữ liệu đã có bảng `profiles/expenses/expense_debtors`, đảm bảo
   schema phù hợp rồi chạy lại hai lệnh trên (chúng idempotent).

4. **Chạy dự án**

   ```bash
   npm run dev
   ```

   Truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

## Quản lý schema với Prisma

- Mã nguồn Prisma nằm tại `prisma/schema.prisma`.
- Migration đầu tiên được ghi trong `prisma/migrations/0001_init/migration.sql`.
- Triển khai schema lên Supabase:

  ```bash
  npm run prisma:migrate
  ```

  Lệnh này có thể chạy nhiều lần; nếu cơ sở dữ liệu đã tồn tại các bảng cũ,
  hãy đảm bảo cột `profiles.email`, `expense_debtors.debtor_id` và khóa ngoại
  `expenses.created_by -> profiles(id)` đã được đồng bộ.

- Sinh Prisma Client (tự động khi chạy `npm run prisma:generate`):

  ```bash
  import { prisma } from "@/lib/prisma";
  ```

Các bảng chính mà Prisma quản lý:

```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  bank_code text,
  bank_account text,
  bank_owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_key
  on public.profiles(email)
  where email is not null;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  amount numeric(16, 2) not null,
  note text,
  paid_at date,
  created_at timestamptz not null default now()
);

create index expenses_created_by_idx on public.expenses(created_by);

create table public.expense_debtors (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  debtor_id uuid references public.profiles(id) on delete set null,
  debtor_email text not null,
  debtor_name text,
  owed_amount numeric(16, 2),
  created_at timestamptz not null default now()
);

create index expense_debtors_expense_id_idx on public.expense_debtors(expense_id);
create index expense_debtors_debtor_id_idx on public.expense_debtors(debtor_id);
```

RLS policies quan trọng (được áp trong migration):

```sql
create policy "Profiles are readable"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users insert their profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users update their profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Owners manage expenses"
  on public.expenses for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "Expense owners manage debtor list"
  on public.expense_debtors for all using (
    exists (select 1 from public.expenses e where e.id = expense_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from public.expenses e where e.id = expense_id and e.created_by = auth.uid())
  );
```

## Mở rộng thêm

- Bổ sung trạng thái thanh toán cho mỗi người nợ, cho phép đánh dấu đã trả.
- Gợi ý danh sách người nợ dựa trên bảng `profiles` hoặc danh bạ riêng.
- Gửi email/thông báo khi có khoản chi mới hoặc khi ai đó hoàn tiền.
- Bổ sung migration mới với Prisma (ví dụ bảng nhóm chuyến đi, lịch sử thanh toán).

## Tài liệu tham khảo

- [Supabase documentation](https://supabase.com/docs)
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Next.js App Router docs](https://nextjs.org/docs/app)
