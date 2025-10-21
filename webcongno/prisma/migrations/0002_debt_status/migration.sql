ALTER TABLE public.expense_debtors ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.expense_debtors ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.expense_debtors ADD COLUMN IF NOT EXISTS payment_note text;
