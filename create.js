/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * create-admin.js
 *
 * Creates a Supabase Auth user + a matching row in public.admins.
 * Run locally / on your own machine — NEVER in a browser or client bundle,
 * since it needs the service_role key (full DB access, bypasses RLS).
 *
 * Setup:
 *   npm install @supabase/supabase-js
 *
 * Run (all values passed as env vars, nothing hardcoded):
 *   SUPABASE_URL="https://YOUR-PROJECT.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
 *   ADMIN_EMAIL="admin@example.com" \
 *   ADMIN_PASSWORD="a-strong-password" \
 *   ADMIN_NAME="Site Admin" \
 *   node create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Site Admin';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'admin';

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function main() {
  if (!SUPABASE_URL) fail('Missing SUPABASE_URL env var.');
  if (!SERVICE_ROLE_KEY) fail('Missing SUPABASE_SERVICE_ROLE_KEY env var.');
  if (!ADMIN_EMAIL) fail('Missing ADMIN_EMAIL env var.');
  if (!ADMIN_PASSWORD) fail('Missing ADMIN_PASSWORD env var.');
  if (ADMIN_PASSWORD.length < 10) {
    fail('ADMIN_PASSWORD is too short/weak. Use at least 10+ characters, ideally random. Aborting.');
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Creating auth user: ${ADMIN_EMAIL}`);
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (userError) fail(`Auth user creation failed: ${userError.message}`);

  const userId = userData.user.id;
  console.log(`Auth user created. id = ${userId}`);

  console.log('Inserting row into public.admins ...');
  const { error: adminRowError } = await supabase.from('admins').insert({
    id: userId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: ADMIN_ROLE,
    is_active: true,
  });

  if (adminRowError) {
    fail(
      `Auth user was created (id: ${userId}) but public.admins insert failed: ${adminRowError.message}\n` +
      `You can insert this row manually using that id.`
    );
  }

  console.log('\nDone. Admin account ready:');
  console.log(`  email: ${ADMIN_EMAIL}`);
  console.log(`  id:    ${userId}`);
  console.log('Sign in through your app\'s normal Supabase Auth login flow.');
}

main().catch((err) => fail(`Unexpected error: ${err.message || err}`));
