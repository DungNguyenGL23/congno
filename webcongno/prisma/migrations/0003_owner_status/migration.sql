DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ownerpaymentstatus') THEN
    CREATE TYPE ownerpaymentstatus AS ENUM ('pending', 'confirmed', 'disputed');
  END IF;
END $$;

ALTER TABLE public.expense_debtors
  ADD COLUMN IF NOT EXISTS owner_status ownerpaymentstatus NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS owner_note text,
  ADD COLUMN IF NOT EXISTS owner_updated_at timestamptz;
