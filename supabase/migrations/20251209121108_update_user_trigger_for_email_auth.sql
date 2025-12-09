-- Update handle_new_user trigger to support email-based authentication
-- This replaces the phone-based auth with email/password and OAuth support

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_phone TEXT;
  user_full_name TEXT;
  existing_user_id UUID;
BEGIN
  -- Extract email from the new auth user
  user_email := NEW.email;

  -- Extract and normalize phone (optional, for contact purposes)
  user_phone := CASE
    WHEN NEW.phone IS NULL OR NEW.phone = '' THEN NULL
    WHEN LEFT(NEW.phone, 1) = '+' THEN NEW.phone
    ELSE '+' || NEW.phone
  END;

  -- Extract full name from metadata (supports both email/password signup and OAuth)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',     -- Email signup
    NEW.raw_user_meta_data->>'name',          -- OAuth providers (Google, Facebook)
    SPLIT_PART(user_email, '@', 1),           -- Use email prefix as fallback
    'Utilisateur'
  );

  -- Check if user with this email already exists (for OAuth linking)
  IF user_email IS NOT NULL THEN
    SELECT id INTO existing_user_id FROM public.users WHERE email = user_email;
  END IF;

  -- If user exists with same email, update their auth ID to the new one
  IF existing_user_id IS NOT NULL AND existing_user_id != NEW.id THEN
    -- Update existing user's ID to match new auth user
    UPDATE public.users
    SET
      id = NEW.id,
      full_name = COALESCE(user_full_name, full_name),
      updated_at = NOW()
    WHERE id = existing_user_id;

    RETURN NEW;
  END IF;

  -- Insert or update user profile
  INSERT INTO public.users (id, email, phone, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    user_email,
    user_phone,
    user_full_name,
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on email if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
  ) THEN
    -- First, handle any duplicate emails by keeping the most recent one
    WITH duplicates AS (
      SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC, created_at DESC) as rn
      FROM public.users
      WHERE email IS NOT NULL AND email != ''
    )
    UPDATE public.users SET email = NULL
    WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

    -- Now add the unique constraint
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation in public.users table after auth signup. Supports email/password and OAuth authentication.';
