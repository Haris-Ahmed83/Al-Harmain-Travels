import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/auth/check-user
 *
 * Checks whether an email exists in auth.users and public.profiles
 * using the admin_check_user SECURITY DEFINER RPC.
 *
 * Body: { email: string }
 * Response:
 *   {
 *     existsInAuth: boolean,       // Row exists in auth.users
 *     emailConfirmed: boolean,     // email_confirmed_at is set
 *     existsInProfiles: boolean,   // Row exists in public.profiles
 *     profileVerified: boolean,    // profiles.email_verified is true
 *     isOrphaned: boolean,         // In auth but NOT in profiles
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminClient = getSupabaseAdmin();

    // Use the admin_check_user SECURITY DEFINER RPC which has access to auth.users
    const { data, error } = await adminClient.rpc('admin_check_user', {
      lookup_email: cleanEmail,
    });

    if (error) {
      console.error('[check-user] RPC error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const result = data as {
      exists_in_auth: boolean;
      auth_id: string | null;
      email_confirmed: boolean;
      exists_in_profiles: boolean;
      profile_id: string | null;
      profile_verified: boolean | null;
      profile_role: string | null;
      profile_status: string | null;
    };

    return NextResponse.json({
      success: true,
      existsInAuth: result.exists_in_auth,
      authId: result.auth_id,
      emailConfirmed: result.email_confirmed,
      existsInProfiles: result.exists_in_profiles,
      profileId: result.profile_id,
      profileVerified: result.profile_verified ?? false,
      profileRole: result.profile_role,
      profileStatus: result.profile_status,
      // true if there's an orphaned auth.users row with no matching profile
      isOrphaned: result.exists_in_auth && !result.exists_in_profiles,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected server error.';
    console.error('[check-user] Unexpected error:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// Reject unrelated HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
