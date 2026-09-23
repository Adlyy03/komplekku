const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST_ACCOUNTS = [
  {
    email: 'developer@komplekku.id',
    password: 'Password123!',
    fullName: 'Developer Komplekku',
    phone: '081100000001',
    role: 'developer',
  },
  {
    email: 'rw@komplekku.id',
    password: 'Password123!',
    fullName: 'Ketua RW Bambang',
    phone: '081100000002',
    role: 'rw',
  },
  {
    email: 'rt@komplekku.id',
    password: 'Password123!',
    fullName: 'Ketua RT Hendra',
    phone: '081100000003',
    role: 'rt',
  },
  {
    email: 'warga@komplekku.id',
    password: 'Password123!',
    fullName: 'Budi Santoso',
    phone: '081234567890',
    role: 'warga',
  },
];

async function run() {
  console.log('Target Supabase:', supabaseUrl);
  if (supabaseServiceKey) {
    console.log('Service role key detected: Admin API enabled.');
  }

  // Get RW and RT units
  const { data: rws } = await client.from('rw_units').select('id, code').limit(1);
  const { data: rts } = await client.from('rt_units').select('id, code').limit(1);

  const rwId = rws?.[0]?.id || null;
  const rtId = rts?.[0]?.id || null;

  for (const acc of TEST_ACCOUNTS) {
    console.log(`\n========================================`);
    console.log(`Setting up: ${acc.email} (${acc.role})`);
    console.log(`========================================`);

    let userId = null;

    if (supabaseServiceKey) {
      const { data: adminUser, error: adminErr } = await client.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName },
      });

      if (adminErr) {
        if (adminErr.message.includes('already registered') || adminErr.message.includes('already exists')) {
          console.log(`User ${acc.email} already exists. Fetching user ID...`);
          const { data: usersList } = await client.auth.admin.listUsers();
          const existing = usersList?.users?.find((u) => u.email === acc.email);
          userId = existing?.id;
        } else {
          console.error(`Admin createUser error:`, adminErr.message);
        }
      } else {
        userId = adminUser.user?.id;
        console.log(`Created user via Admin API: ${userId}`);
      }
    } else {
      const { data: signInData } = await client.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });

      if (signInData?.user?.id) {
        userId = signInData.user.id;
        console.log(`User signed in: ${userId}`);
      } else {
        const { data: signUpData, error: signUpErr } = await client.auth.signUp({
          email: acc.email,
          password: acc.password,
          options: { data: { full_name: acc.fullName } },
        });

        if (signUpErr) {
          console.error(`Sign-up error:`, signUpErr.message);
        } else {
          userId = signUpData?.user?.id;
          console.log(`Signed up: ${userId}`);
        }
      }
    }

    if (!userId) {
      console.warn(`Could not obtain User ID for ${acc.email}. Skipping profile/roles.`);
      continue;
    }

    // Upsert profile
    const { error: profErr } = await client.from('profiles').upsert({
      id: userId,
      full_name: acc.fullName,
      phone: acc.phone,
      resident_status: 'active',
      verification_status: 'verified',
    });
    if (profErr) console.warn('Profile upsert note:', profErr.message);
    else console.log('✓ Profile saved');

    // Setup role in user_roles
    let targetRw = null;
    let targetRt = null;

    if (acc.role === 'rw') {
      targetRw = rwId;
    } else if (acc.role === 'rt') {
      targetRt = rtId;
    }

    const { error: roleErr } = await client.from('user_roles').upsert(
      {
        user_id: userId,
        role: acc.role,
        rw_id: targetRw,
        rt_id: targetRt,
        status: 'active',
      },
      { onConflict: 'user_id,role,rw_id,rt_id' }
    );

    if (roleErr) console.warn('Role assignment note:', roleErr.message);
    else console.log(`✓ Role assigned: ${acc.role}`);
  }

  console.log('\n=============================================');
  console.log('DAFTAR AKUN TEST KOMPLEKKU (SCHEMA V2):');
  console.log('=============================================');
  for (const acc of TEST_ACCOUNTS) {
    console.log(`Peran: ${acc.role.toUpperCase()}`);
    console.log(`Nama : ${acc.fullName}`);
    console.log(`Email: ${acc.email}`);
    console.log(`Pass : ${acc.password}\n`);
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
