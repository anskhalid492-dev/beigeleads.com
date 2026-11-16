// Secrets and plain vars are set in the Cloudflare dashboard (Settings > Variables and Secrets),
// not in wrangler.jsonc. They are optional here so the code degrades safely when one is missing.
interface CloudflareEnv {
  TURNSTILE_SECRET_KEY?: string; // secret
  RESEND_API_KEY?: string; // secret
  HASH_SALT?: string; // secret: salt for hashing emails in suppressions. Pipeline must use the same.
  TURNSTILE_VERIFY_URL?: string; // tests only: leave unset in production
  NOTIFY_EMAIL?: string; // var: where owner notifications go
  ACCESS_TEAM_DOMAIN?: string; // var: e.g. myteam.cloudflareaccess.com
  ACCESS_AUD?: string; // var: Access application AUD tag for /admin
  ADMIN_EMAILS?: string; // var (optional): comma-separated extra allow-list
  EMAIL_FROM?: string; // var: e.g. BeigeLeads <noreply@mail.beigeleads.com>
}
