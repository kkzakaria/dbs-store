-- ===========================================
-- Fix user trigger to handle phone conflicts
-- ===========================================
-- The original trigger only handled conflicts on 'id'.
-- This causes issues when a user with the same phone already exists
-- but with a different id (e.g., when seed data is present).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalized_phone TEXT;
  existing_user_id UUID;
BEGIN
  -- Normalize phone format
  normalized_phone := CASE
    WHEN NEW.phone IS NULL OR NEW.phone = '' THEN NULL
    WHEN LEFT(NEW.phone, 1) = '+' THEN NEW.phone
    ELSE '+' || NEW.phone
  END;

  -- Check if a user with this phone already exists
  IF normalized_phone IS NOT NULL THEN
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE phone = normalized_phone;

    IF existing_user_id IS NOT NULL THEN
      -- User with this phone already exists
      -- Update the existing user's id to match auth.users if different
      IF existing_user_id != NEW.id THEN
        -- Update the existing public.users entry to have the new auth.users id
        UPDATE public.users
        SET
          id = NEW.id,
          full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
          updated_at = NOW()
        WHERE phone = normalized_phone;
      ELSE
        -- Same id, just update metadata if needed
        UPDATE public.users
        SET
          full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
          updated_at = NOW()
        WHERE id = NEW.id;
      END IF;

      RETURN NEW;
    END IF;
  END IF;

  -- No existing user, insert new one
  INSERT INTO public.users (id, phone, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    normalized_phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone, 'Utilisateur'),
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
