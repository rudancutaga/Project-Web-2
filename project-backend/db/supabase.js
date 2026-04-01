const { createClient } = require('@supabase/supabase-js');

let adminClient = null;
const PLACEHOLDER_VALUES = new Set([
  '...',
  '<...>',
  'changeme',
  'change-me',
  'replace-me',
  'replace_this',
  'your-key-here',
  'your-anon-key',
  'your-service-role-key',
  'your-publishable-key',
  'your-project-url',
  'your-supabase-url',
]);

function sanitizeEnvValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  if (PLACEHOLDER_VALUES.has(normalized)) {
    return null;
  }

  if (/^\.+$/.test(trimmed) || /^<[^>]+>$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function getProjectRefFromDatabaseConfig() {
  const host = sanitizeEnvValue(process.env.DB_HOST) || '';
  const hostMatch = host.match(/^db\.([^.]+)\.supabase\.co$/i);
  if (hostMatch) {
    return hostMatch[1];
  }

  const user = sanitizeEnvValue(process.env.DB_USER) || '';
  const userMatch = user.match(/^postgres\.([^.]+)$/i);
  if (userMatch) {
    return userMatch[1];
  }

  return null;
}

function getSupabaseUrl() {
  const configuredUrl = sanitizeEnvValue(process.env.SUPABASE_URL);
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const projectRef = getProjectRefFromDatabaseConfig();
  if (!projectRef) {
    return null;
  }

  return `https://${projectRef}.supabase.co`;
}

function getSupabasePublishableKey() {
  return (
    sanitizeEnvValue(process.env.SUPABASE_PUBLISHABLE_KEY) ||
    sanitizeEnvValue(process.env.SUPABASE_ANON_KEY) ||
    null
  );
}

function isSupabaseAuthConfigured() {
  return Boolean(
    getSupabaseUrl() &&
    getSupabasePublishableKey() &&
    sanitizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function getSupabaseAdmin() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = sanitizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL (or a Supabase DB host) and SUPABASE_SERVICE_ROLE_KEY must be set to use the Supabase admin client.'
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

function getSupabaseAuthClient() {
  const supabaseUrl = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      'SUPABASE_URL (or a Supabase DB host) and SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY must be set to use the Supabase auth client.'
    );
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

module.exports = {
  getSupabaseAdmin,
  getSupabaseAuthClient,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
};
