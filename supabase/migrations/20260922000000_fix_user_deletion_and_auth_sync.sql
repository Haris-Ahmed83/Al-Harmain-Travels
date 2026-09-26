-- ==============================================================================
-- Migration: Fix User Deletion, Cascade Cleanup, and Auth Synchronization
-- Project: Al Harmain Travels
-- Description:
--   1. Deleting a profile cascades to delete the auth.users record.
--   2. Deleting an auth user cascades to clean up profiles, drivers, saved places,
--      emergency contacts, and safely nullifies audit logs / bookings foreign keys.
--   3. Provides SECURITY DEFINER RPCs:
--        - admin_delete_user(target_user_id UUID): Cleans up all data and deletes auth.users.
--        - admin_check_user(lookup_email TEXT): Checks if email exists in auth.users and/or profiles.
--        - admin_cleanup_orphaned_user(lookup_email TEXT): Purges auth.users row with no profile.
-- ==============================================================================

-- 1. Function to cascade profile deletion to auth.users
CREATE OR REPLACE FUNCTION public.handle_profile_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If the profile being deleted has a matching auth.users row, delete it.
  -- This triggers Supabase auth cascades and prevents orphaned auth records.
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deleted();

-- 2. Function to cascade auth.users deletion to public tables
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Nullify historical references where NO ACTION/RESTRICT would prevent deletion
  UPDATE public.bookings 
    SET created_by = NULL 
    WHERE created_by = OLD.id;

  UPDATE public.bookings 
    SET cancelled_by = NULL 
    WHERE cancelled_by = OLD.id;

  UPDATE public.booking_status_history 
    SET changed_by = NULL 
    WHERE changed_by = OLD.id;

  UPDATE public.additional_charges 
    SET added_by = NULL 
    WHERE added_by = OLD.id;

  UPDATE public.payments 
    SET collected_by = NULL 
    WHERE collected_by = OLD.id;

  UPDATE public.payments 
    SET customer_id = NULL 
    WHERE customer_id = OLD.id;

  UPDATE public.audit_logs 
    SET user_id = NULL 
    WHERE user_id = OLD.id;

  DELETE FROM public.ratings_feedback 
    WHERE customer_id = OLD.id;

  -- Delete associated emergency contacts, saved places, recent locations
  DELETE FROM public.emergency_contacts 
    WHERE user_id = OLD.id;

  DELETE FROM public.saved_places 
    WHERE user_id = OLD.id;

  DELETE FROM public.recent_locations 
    WHERE user_id = OLD.id;

  -- Delete from customers and drivers tables
  DELETE FROM public.customers 
    WHERE profile_id = OLD.id;

  DELETE FROM public.drivers 
    WHERE profile_id = OLD.id;

  -- Delete from profiles (if not already deleted)
  DELETE FROM public.profiles 
    WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();

-- 3. Comprehensive admin deletion RPC callable via Supabase client
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_exists_auth BOOLEAN;
  v_exists_profile BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO v_exists_auth;
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO v_exists_profile;

  IF NOT v_exists_auth AND NOT v_exists_profile THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users or profiles'
    );
  END IF;

  -- Clean historical foreign keys
  UPDATE public.bookings SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE public.bookings SET cancelled_by = NULL WHERE cancelled_by = target_user_id;
  UPDATE public.booking_status_history SET changed_by = NULL WHERE changed_by = target_user_id;
  UPDATE public.additional_charges SET added_by = NULL WHERE added_by = target_user_id;
  UPDATE public.payments SET collected_by = NULL WHERE collected_by = target_user_id;
  UPDATE public.payments SET customer_id = NULL WHERE customer_id = target_user_id;
  UPDATE public.audit_logs SET user_id = NULL WHERE user_id = target_user_id;
  DELETE FROM public.ratings_feedback WHERE customer_id = target_user_id;

  -- Delete dependent children
  DELETE FROM public.emergency_contacts WHERE user_id = target_user_id;
  DELETE FROM public.saved_places WHERE user_id = target_user_id;
  DELETE FROM public.recent_locations WHERE user_id = target_user_id;
  DELETE FROM public.customers WHERE profile_id = target_user_id;
  DELETE FROM public.drivers WHERE profile_id = target_user_id;

  -- Delete from public.profiles
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete from auth.users (cascades to identities, sessions, refresh_tokens)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', target_user_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- 4. Check user status in both auth.users and profiles
CREATE OR REPLACE FUNCTION public.admin_check_user(lookup_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_record RECORD;
  v_profile_record RECORD;
BEGIN
  SELECT id, email, email_confirmed_at 
  INTO v_auth_record 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(TRIM(lookup_email))
  LIMIT 1;

  SELECT id, email_verified, role, status
  INTO v_profile_record
  FROM public.profiles
  WHERE LOWER(email) = LOWER(TRIM(lookup_email))
  LIMIT 1;

  RETURN jsonb_build_object(
    'exists_in_auth', v_auth_record.id IS NOT NULL,
    'auth_id', v_auth_record.id,
    'email_confirmed', v_auth_record.email_confirmed_at IS NOT NULL,
    'exists_in_profiles', v_profile_record.id IS NOT NULL,
    'profile_id', v_profile_record.id,
    'profile_verified', v_profile_record.email_verified,
    'profile_role', v_profile_record.role,
    'profile_status', v_profile_record.status
  );
END;
$$;

-- 5. Cleanup orphaned auth user
CREATE OR REPLACE FUNCTION public.admin_cleanup_orphaned_user(lookup_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_id UUID;
  v_has_profile BOOLEAN;
BEGIN
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(lookup_email))
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found in auth.users');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_auth_id) INTO v_has_profile;

  IF v_has_profile THEN
    RETURN jsonb_build_object('success', false, 'error', 'User has a valid profile record; not orphaned');
  END IF;

  DELETE FROM auth.users WHERE id = v_auth_id;

  RETURN jsonb_build_object('success', true, 'cleaned_auth_id', v_auth_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_check_user(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_cleanup_orphaned_user(TEXT) TO anon, authenticated, service_role;
