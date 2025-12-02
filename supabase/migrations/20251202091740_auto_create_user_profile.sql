-- ===========================================
-- Auto-create public.users profile on auth.users insert
-- ===========================================
-- This trigger automatically creates a user profile in public.users
-- when a new user signs up via Supabase Auth (phone OTP).
-- This ensures the user profile exists before they access protected routes.

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Ensure phone has + prefix for consistent formatting
    CASE
      WHEN NEW.phone IS NULL OR NEW.phone = '' THEN ''
      WHEN LEFT(NEW.phone, 1) = '+' THEN NEW.phone
      ELSE '+' || NEW.phone
    END,
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

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for updates (when user metadata changes)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if full_name changed in metadata
  IF NEW.raw_user_meta_data->>'full_name' IS DISTINCT FROM OLD.raw_user_meta_data->>'full_name' THEN
    UPDATE public.users
    SET
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
