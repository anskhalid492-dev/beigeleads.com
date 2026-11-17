# TODO before launch

Placeholders that must be replaced with real content/data (CLAUDE.md section 15, rule 3).

- [ ] `wrangler.jsonc`: replace `REPLACE_WITH_D1_DATABASE_ID` and `REPLACE_WITH_KV_NAMESPACE_ID` with real IDs from the Cloudflare dashboard, then run `npm run cf-typegen`
- [ ] `drizzle/seed.sql`: placeholder categories/products/samples (draft, zero counts). Local dev only. Never apply to production as real data
- [ ] Home page: sample preview table is a PLACEHOLDER; no real stats shown yet
- [ ] Header/footer links point to pages that do not exist yet (Phase 2-3)
- [ ] All legal pages need lawyer review
- [ ] Real data sourcing method and lawful basis (CLAUDE.md section 16)
- [ ] Real pricing, brand logo, final palette confirmation
- [ ] Secrets via `wrangler secret put`: RESEND_API_KEY, TURNSTILE_SECRET_KEY, TRONGRID_API_KEY
- [ ] **Remove noindex**: delete `robots: { index: false, follow: false }` in `app/layout.tsx` and switch `app/robots.ts` to the launch rules (site is live on beigeleads.com with placeholder content)
- [ ] `lib/catalog.ts` and `lib/sample-data.ts` serve static placeholder data. Re-implement catalog functions with D1 (`getDb()`) and real masked samples; apply migrations to remote D1 first (`npm run db:migrate:remote`, needs `wrangler login`)
- [ ] Product pages: record counts, last-verified dates and pricing tiers are intentionally empty ("Not counted yet"). Fill from real data. Remove the "placeholder page" banner when a product is `live`
- [ ] Country and city pages are `noindex` (thin). Remove `robots` override once they have real counts and sample rows
- [ ] `app/[page]/page.tsx` and `app/legal/[doc]/page.tsx` are coming-soon stubs. Replace each with the real page (phases 3 and 5); legal text needs lawyer review
- [ ] sitemap.ts lists only indexable pages; add new indexable routes as they ship
- [ ] Production setup for forms (Cloudflare dashboard): apply `drizzle/0000_*.sql` to the remote D1 (D1 > beigeleads > Console, or `npm run db:migrate:remote`); set secrets `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `HASH_SALT`; set vars `NOTIFY_EMAIL`, `EMAIL_FROM`; set build variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Workers Builds > Settings > Build > Variables)
- [ ] Add the Turnstile hostname `beigeleads.com` (done at widget creation) and test the real widget on the live site
- [ ] Sample requests only send a confirmation. Real masked sample delivery needs real data
- [ ] Opt-out: pipeline must apply `suppressions` using the same hash (see CLAUDE.md section 17); add domain-level opt-out handling
- [ ] Add a Cloudflare WAF rate-limit rule for `/api/*` (KV limiter is only a speed bump)
- [ ] Email queue/retries (currently `waitUntil`, no retry)
- [ ] `/data-sources`: back "200+ sources" with an internal source register; confirm "re-verified every 60 days" is actually done; confirm the SMTP-check description; lawyer must approve the wording about public professional profiles/social handles and automated collection (platform terms and GDPR/CCPA risk)
- [ ] `/legal/*` (`lib/legal/docs.ts`): resolve every `[TO CONFIRM: ...]` (entity and address, retention, licence limits, replacement window and remedy, refund coin, regions served, data broker registration, DPA, sub-processors), then lawyer review; remove noindex
- [ ] `/verification` still a stub; write it from the same facts as the data-sources page once the replacement policy is decided
- [ ] Audit live cookies/local storage (Turnstile) before finalising the cookie policy
- [ ] **Product pages (lib/catalog.ts)**: replace placeholder record counts (100,000), accuracy (95%), last verified (2026-09-18), package sizes and prices ($99/$249/$399) with real data; set `placeholderData: false`. Do NOT publish an accuracy figure until a measurement method exists
- [ ] Product-page "Buy" buttons are disabled until Phase 4 checkout; wire them to checkout
- [ ] Apply `drizzle/0001_*.sql` (product_faqs) to the remote D1 and build the admin editor; page currently uses templated FAQs
- [ ] Add Product JSON-LD with real offers once a product is live (omitted while draft)

## Solutions pages
- [ ] Remove site-wide noindex at launch so /solutions/* become indexable (they are in sitemap.xml already).
- [ ] Lawyer review of compliance wording in solutions copy (cold email, recruitment, healthcare, influencer).
- [ ] Update recommended databases when real estate, creator and recruitment lists exist.

## /verification
- [ ] Lawyer review. Page states only: in-house SMTP checks, 60-day re-verification, no accuracy/delivery promise. Add replacement details only after the refund policy is final.

## Legal dates
- Dates come from `LEGAL_UPDATED` in `lib/legal/docs.ts` (16 Nov 2026). Update it whenever any legal text or /verification changes.
- Page-level noindex was removed from /legal/* and /verification (owner decision). The site-wide noindex and robots.txt disallow still apply until launch. Banner and [TO CONFIRM] markers remain and still block launch.

## Solutions copy
- Solution pages now use audience-specific copy from `lib/solution-copy.ts` (pain points, applications, closing line). Lawyer review the compliance wording (cold email, healthcare, recruitment, expansion).

## Refund & Returns (owner decision, Nov 2026)
- Policy: bounce rate above 5% -> we replace bounced emails until the list is back to 95% verified / 95% accurate. URL stays /legal/refund-replacement; title is "Refund & Returns".
- Company on legal pages: BeigeLeads LLC, 215 W Pershing Rd, Kansas City, MO 64108. Governing law, liability and the other [TO CONFIRM] markers still need the owner/lawyer.
- Claim window (30 days) and response time (3 working days) were set by the assistant on the owner's instruction. Confirm them.
- Still open in that policy: what happens if we cannot reach 95% (credit or refund).
- We must be able to measure verified/accurate rates before we promise 95% in practice.

## Legal pages status (updated Nov 2026)
- All [TO CONFIRM] markers resolved by the assistant on the owner's instruction; pages are NOT lawyer-reviewed. Re-read terms (liability, Missouri law, Jackson County venue), privacy (retention periods) and refund policy before launch.
- Before selling EU/UK/Canada data: revisit GDPR/CASL/DPA pages (they currently say US only).

## Phase 4b
- [ ] Create Cloudflare Access app for `beigeleads.com/admin*` (+ 2FA, short session on /admin/wallets); set vars `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` (and optionally `ADMIN_EMAILS`); then regenerate `npm run cf-typegen`
- [ ] Test add/enable/disable on testnet vpub before any mainnet zpub
- [ ] Run `node scripts/admin-setup.mjs` locally, set secrets ADMIN_PASSWORD_HASH, ADMIN_TOTP_SECRET, ADMIN_SESSION_SECRET in the dashboard, add the TOTP secret to an authenticator app

## Phase 4c
- [ ] Apply `drizzle/0002_checkout_orders.sql` to the remote D1 (order_items rebuilt, payment_attempts +2 columns)
- [ ] Checkout stays closed until vars are set: `CHECKOUT_ENABLED=true` (+ `CHECKOUT_ALLOW_PLACEHOLDER=true` for testnet testing only). Never set `MAINNET_ENABLED=true` before the testnet gate (CLAUDE.md section 7)
- [ ] Product-page "Buy" buttons: wire to `/checkout/new?product=&package=` only when a product is live with real prices

## Phase 4d
- [ ] Confirm which testnet the testing wallet uses (testnet3 or testnet4); set `BTC_TESTNET_API` accordingly (default is mempool.space testnet3)
- [ ] After deploy, check the Worker shows 2 cron triggers (Workers > beigeleads-com > Settings > Triggers) and Logs show the minute run
- [ ] Persist an "overpaid" flag (currently email only)

## Phase 4e
- [ ] Owner to decide ETH and USDC networks (suggested: ETH on Ethereum mainnet, USDC on Base) before they are built
- [ ] Testnet testing: add a BTC testnet address and a TRON Nile address in /admin/wallets; set `TRON_NILE_USDT` (Nile USDT contract) and `BTC_TESTNET_API` vars; enable them (24h delay)
- [ ] Optional secret `TRONGRID_API_KEY` if TronGrid rate-limits
- [ ] Decide handling for "amount does not match any order" payments (currently owner email only)

- [ ] Verify Blockscout parsing live on Sepolia (ETH, USDT, USDC) before enabling ERC20/ETH mainnet; confirm mainnet contract addresses on etherscan.
- [ ] Set `EVM_TEST_USDT` / `EVM_TEST_USDC` vars for Sepolia testing.

- [ ] Apply migration `drizzle/0003_delivery.sql` to remote D1; set a delivery link per product in /admin/delivery (no link = paid orders wait and the owner is emailed).
- [ ] Make sure the Cloudflare Access app covers `/admin/*` (not only /admin/wallets) so /admin/delivery works.
- [ ] Apply the suppression list to each hosted file yourself before upload (the site no longer generates files).

- [ ] Apply migration `drizzle/0004_claims_audit.sql` to remote D1.
- [ ] Run the testnet gate: 20+ test orders (exact/under/over/late), then $1-$5 per coin on mainnet, before setting MAINNET_ENABLED.
- [ ] Settle the Refund policy wording for overpayments (credit or refund) and for fee-deducted payments.

- [ ] Compare pages: re-read every source in `lib/compare-data.ts` before launch and update `CHECKED`; replace thin RocketReach/ZoomInfo rows if their pricing pages become readable.

- [ ] Apply migration `drizzle/0005_custom_list_requests.sql` to remote D1 (custom list requests fail until then).
- [ ] Apply migration `drizzle/0006_custom_request_status.sql` to remote D1 (admin custom-request status tracking is off until then).
- [ ] Decide how custom list requests are answered/priced (owner process); add an admin view if volume grows.


## Blog CMS
- [ ] Run `drizzle/0007_blog_cms.sql` in D1 (one statement at a time in D1 Studio).
- [ ] Click through the editor on the live admin: create, autosave, image upload, table, embed, schedule, publish, restore revision.
- [ ] Confirm a scheduled article goes live (cron every minute).
- [ ] Decide the Workers Paid plan (dynamic blog pages vs the free 10 ms CPU limit).
- [ ] Write real articles; the blog stays noindex site-wide until launch.
- [ ] Run `drizzle/0008_newsletter.sql` in D1. Set `NEWSLETTER_ENABLED=true` only when you will really send emails; add newsletter signups to the privacy policy.
- [ ] Editors: set `BLOG_EDITOR_EMAILS` and add those emails to the Cloudflare Access policy for /admin.
- [ ] After 60 s caching: check Workers CPU/errors in the Cloudflare dashboard; decide on the Paid plan.
- /sample: run drizzle/0009_sample_requests.sql in D1; samples are sent manually from /admin/sample-requests; example rows are fictional placeholders.
