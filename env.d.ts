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
  ADMIN_PASSWORD_HASH?: string; // secret: output of scripts/admin-setup.mjs
  ADMIN_TOTP_SECRET?: string; // secret: base32, output of scripts/admin-setup.mjs
  ADMIN_SESSION_SECRET?: string; // secret: random 32+ chars, output of scripts/admin-setup.mjs
  CHECKOUT_ENABLED?: string; // var: "true" opens checkout. Anything else = closed.
  CHECKOUT_ALLOW_PLACEHOLDER?: string; // var: "true" lets draft/placeholder products be bought (testnet testing only)
  MAINNET_ENABLED?: string; // var: "true" allows mainnet wallets. Leave unset until the testnet gate passes (CLAUDE.md section 7)
  BTC_TESTNET_API?: string; // var (optional): mempool API base for testnet, e.g. https://mempool.space/testnet4/api
  TRON_NILE_USDT?: string; // var (testing only): USDT contract address on the TRON Nile test network
  TRON_NILE_API?: string; // var (optional): default https://nile.trongrid.io
  EVM_API_BASE?: string; // var (optional): Blockscout base for Ethereum mainnet, default https://eth.blockscout.com
  EVM_TEST_API_BASE?: string; // var (optional): Blockscout base for Sepolia, default https://eth-sepolia.blockscout.com
  EVM_TEST_USDT?: string; // var (testing only): USDT contract on Sepolia
  EVM_TEST_USDC?: string; // var (testing only): USDC contract on Sepolia
  BLOCKSCOUT_API_KEY?: string; // secret (optional)
  TRONGRID_API_KEY?: string; // secret (optional): raises TronGrid rate limits
  ADMIN_EMAILS?: string; // var (optional): comma-separated extra allow-list
  BLOG_EDITOR_EMAILS?: string; // var (optional): comma-separated emails that may write blog drafts (Access only, no publish/delete)
  NEWSLETTER_ENABLED?: string; // var: "true" shows the blog newsletter signup. Anything else = hidden.
  EMAIL_FROM?: string; // var: e.g. BeigeLeads <noreply@mail.beigeleads.com>
  BEIGEPILOT_KEY_SECRET?: string; // secret: 32+ random chars, encrypts the AI provider API keys stored in D1 (AES-GCM). Losing it means re-entering the keys.
  RESEND_WEBHOOK_SECRET?: string; // secret: Svix signing secret (whsec_...) of the Resend webhook
}
