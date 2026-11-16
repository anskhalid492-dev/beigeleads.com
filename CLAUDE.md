# CLAUDE.md: BeigeLeads (beigeleads.com)

This file is the project brain. Read it fully before every task. If a task conflicts with this file, stop and ask.

---

## 1. What we are building

**BeigeLeads** is a **one-time-purchase** marketplace for B2B / local-business contact lists and email databases.

- **Not SaaS.** No subscriptions, no logins required to buy. A buyer picks a ready-made list (or builds a custom one), pays once in crypto, and receives a downloadable file.
- **Markets:** all countries. **Niches:** all kinds of businesses (300+ categories over time, launched incrementally).
- **Reference sites for structure only** (never copy text, images, or branding): openmart.com (category index, product page layout, data preview table, FAQ, CTA band) and leadsmunch.com (list-store model).
- **Core positioning:** "Pay once. Own the list." Verified, compliant, delivered fast.
- **Domain:** beigeleads.com

### Non-negotiable product rules
1. Every list has a **dedicated product page** with an inline **masked sample** and a **Request free sample** button.
2. Every category has subpages by **country, city, and sub-niche**.
3. Payment is **crypto only at launch** (see section 7). Card payments are a possible later addition.
4. No account needed to buy. Email only.

---

## 2. Marketing psychology: honest persuasion only

The site should be strongly persuasive at every step, using **legitimate** techniques. These are in scope:

| Technique | How we apply it |
|---|---|
| Reciprocity | Free 50-row masked sample, no payment details |
| Specificity | Real counts and real verification dates: "12,480 verified ski shops, verified Nov 2026" |
| Authority | Methodology page, verification pipeline diagram, compliance pages |
| Anchoring | 3-tier pricing (Starter / Pro highlighted / Complete) |
| Risk reversal | Replacement policy for bounced contacts. **Only promise what the refund/replacement policy actually honors.** |
| Commitment ladder | Sample, then small list, then bundle |
| Social proof | **Only real** reviews, real order counts, real logos with permission |
| Honest scarcity | Only when true (e.g. "price changes after the next data refresh on <real date>") |
| Clarity / low friction | Few steps, no account, clear delivery promise |

### Forbidden (never build, even if asked)
- Fake countdown timers, fake "N people viewing", fake "only X left"
- Invented testimonials, fake case studies, fake logos, fake review counts
- Fake awards or certifications, fake "as seen on"
- Hidden fees, pre-checked add-ons, misleading comparison claims
- Any claim we cannot back with data

Reasons: illegal in many jurisdictions (FTC, UK CMA, EU consumer law), and crypto payments are irreversible, so buyer trust is the whole business. If a case study or number does not exist yet, use a clearly labeled placeholder in development and **block launch** until it is real.

---

## 3. Tech stack (fixed)

| Layer | Choice |
|---|---|
| Framework | **Next.js (App Router)**, TypeScript strict |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| Hosting | **Cloudflare Workers** via **`@opennextjs/cloudflare`** (OpenNext adapter) |
| Database | **Cloudflare D1** + **Drizzle ORM** (migrations in `/drizzle`) |
| File storage and delivery | **Cloudflare R2** + expiring signed download links |
| Cache / rate limits | **Cloudflare KV** (+ WAF rate-limit rules) |
| Background jobs | **Cloudflare Queues** + **Cron Triggers** |
| Spam protection | **Cloudflare Turnstile** |
| Transactional email | **Resend** (never for marketing or cold email) |
| Content | **MDX** (blog, case studies, comparisons, use cases) |
| Admin protection | **Cloudflare Access** + 2FA |
| Analytics | Cloudflare Web Analytics (cookie-free) |
| Domain / DNS | Cloudflare |

**Rule: prefer free and open-source options first.** Do not add paid services without asking.

### Next.js on Workers: rules
- `wrangler.jsonc` must set `compatibility_flags: ["nodejs_compat"]` and a current `compatibility_date`.
- Access bindings via `getCloudflareContext()`. Never read secrets from the client.
- Keep the Worker bundle small. Avoid heavy libraries. Check bundle size on every dependency add.
- **Programmatic pages (category x country x city) must NOT all be built at build time.** Statically generate the top pages only; render the rest on demand with caching (ISR / R2 / KV cache).
- Use plain static images or Cloudflare Images. Do not rely on the default Next image optimizer.
- Before using any Next.js or OpenNext feature, check the current OpenNext Cloudflare docs for support. If a feature is unsupported, tell me instead of working around it silently.
- Fallback if OpenNext becomes a blocker: migrate to Astro (ask first).
- **Decisions made in Phase 1:** Next.js 16 `cacheComponents` and `partialPrefetching` are OFF (OpenNext support unverified). Fonts are self-hosted via `@fontsource-variable` (Inter + Fraunces) instead of `next/font/google`, so builds need no Google access and no visitor data goes to Google. `images.unoptimized` is true. `cloudflare-env.d.ts` is committed (regenerate with `npm run cf-typegen`). Placeholder seed data lives in `drizzle/seed.sql`; see `TODO-BEFORE-LAUNCH.md`.

---

## 4. Design system

Reference layout: Openmart (structure only). Our look is our own.

### Palette (forest green + sand beige + electric purple)
The final palette image was not available; these are the working tokens. Keep them in one place (`tailwind.config` / CSS variables) so they can be adjusted globally.

| Token | Hex | Use |
|---|---|---|
| `--sand-50` | `#FBF8F1` | page background |
| `--sand-100` | `#F4EEDF` | section background, cards |
| `--sand-200` | `#E8DEC6` | borders, dividers |
| `--sand-300` | `#D8C9A3` | muted accents |
| `--forest-900` | `#0F2A1D` | headings, nav, footer |
| `--forest-700` | `#1B4332` | body text, primary dark |
| `--forest-500` | `#2D6A4F` | secondary accents, icons |
| `--forest-100` | `#D8EADF` | success / verified badges |
| `--purple-600` | `#7C3AED` | **primary CTA only** |
| `--purple-700` | `#6D28D9` | CTA hover |
| `--purple-100` | `#EDE4FD` | highlight chips |

Rules:
- Background: sand. Text: forest. **Electric purple is reserved for primary actions and key highlights** so it always pops.
- Contrast must meet WCAG AA. Verify text/background pairs.
- Support light mode first. Dark mode is optional later.
- Rounded cards (`rounded-2xl`), generous whitespace, soft shadows, 1px sand borders.
- Typography: one display font (distinctive serif or geometric sans via `next/font`) + Inter for body.
- Mobile-first. Every template must work at 375px.

### Page templates (reuse, do not reinvent)
1. **Home:** hero with live stats + inline sample preview, trust strip, category grid, how it works (4 steps), pricing tiers, FAQ accordion, CTA band
2. **Category index:** alphabetical A-Z jump bar, category cards with record counts, search box, "can't find your category?" CTA
3. **Product page** (one per list), in this order:
   - Hero: title, record count, last-verified date, "Request free sample" + "Buy now"
   - **Sample preview table** (5-10 masked rows)
   - Fields included grid (name, address, phone, email, website, size, etc.)
   - How to use / use cases
   - City / country breakdown with counts
   - 3-tier pricing
   - FAQ (short, product-specific)
   - Related lists
   - CTA band
4. **City / country subpage:** same template scoped to geography
5. **Comparison page:** feature table, pricing model comparison, honest verdict, CTA
6. **Use case page, case study page, blog post** (MDX layouts)
7. **Legal page** (clean long-form layout)
8. **Checkout** (see section 7)

---

## 5. Sitemap

```
/                              Home
/lists                         All categories (A-Z index)
/lists/[category]              Category page
/lists/[category]/[country]    Country page
/lists/[category]/[country]/[city]   City page
/product/[slug]                Individual list product page
/bundles                       Bundles (e.g. "all dentists in the US")
/custom-list                   Custom list builder (niche + geo + fields -> live price)
/creators                      Creators / influencers vertical
/sample                        Request a sample (global)
/pricing
/how-it-works
/data-sources                  Methodology: where data comes from
/verification                  How emails are verified, replacement promise
/compare                       Comparison hub
/compare/beigeleads-vs-leadsmunch
/compare/beigeleads-vs-cognism
/compare/beigeleads-vs-zoominfo
/compare/beigeleads-vs-apollo
/compare/beigeleads-vs-lusha
/compare/beigeleads-vs-seamless-ai
/compare/beigeleads-vs-rocketreach
/compare/beigeleads-vs-uplead
/compare/beigeleads-vs-hunter
/compare/beigeleads-vs-subscription-tools
/use-cases                     Hub
/use-cases/[slug]              cold email, agencies, SDR teams, recruiters, local SEO, ...
/case-studies                  Hub (real ones only)
/case-studies/[slug]
/faq
/blog
/blog/[slug]
/about
/contact
/request-category              "Can't find your category?"
/checkout/[orderId]            Crypto checkout (QR, countdown, status)
/download/[token]              Secure download
/legal/privacy
/legal/terms
/legal/refund-replacement
/legal/delivery
/legal/cookies
/legal/gdpr
/legal/ccpa
/legal/can-spam
/legal/casl
/legal/lawful-use              Acceptable / lawful use policy
/legal/dpa
/legal/crypto-payments
/opt-out                       Opt-out / suppression request (must actually work)
/admin/*                       Protected by Cloudflare Access (noindex)
```

SEO rules: server-rendered, one H1 per page, unique title and meta, canonical URLs, `sitemap.xml` (split by section when large), `robots.txt`, JSON-LD (Organization, Product, FAQPage, BreadcrumbList), no thin duplicate pages (every programmatic page needs real, unique data such as counts and sample rows, or it is `noindex`).

---

## 6. Data model (D1 + Drizzle)

Tables (initial):
- `categories` (id, slug, name, parent_id, description, icon, is_active)
- `countries` (code, name), `cities` (id, country_code, name, slug)
- `products` (id, slug, category_id, country_code, city_id nullable, title, record_count, fields_json, last_verified_at, status)
- `price_tiers` (id, product_id, name, record_limit, price_usd_cents)
- `product_samples` (id, product_id, masked_rows_json)
- `list_files` (id, product_id, r2_key, row_count, checksum, version, created_at)
- `orders` (id, email, status[pending|paid|expired|partial|late_payment|refunded], total_usd_cents, created_at, paid_at)
- `order_items` (id, order_id, product_id, tier_id, price_usd_cents)
- `payment_attempts` (id, order_id, coin, network, address, expected_amount, locked_rate, expires_at, status)
- `payment_events` (id, attempt_id, tx_hash UNIQUE, amount, confirmations, raw_json, seen_at)
- `wallets` (id, coin, network, address_or_xpub, next_index, enabled, activates_at, min_confirmations)
- `wallet_audit_log` (id, wallet_id, actor, action, old_value, new_value, created_at)
- `download_tokens` (id, order_item_id, token_hash, expires_at, max_downloads, download_count)
- `download_logs` (id, token_id, ip_hash, user_agent, created_at)
- `sample_requests` (id, email, product_id, status, created_at)
- `suppressions` (id, email_hash, domain, reason, created_at)
- `contact_messages`, `category_requests`

Rules: money in integer cents; hash emails in suppression/logs where possible; never store seed phrases or private keys anywhere.

---

## 7. Payments (custom crypto checkout, Cloudflare-native, free APIs)

**Coins at launch:** BTC and USDT (TRC20). Add USDC (Base or Polygon) and ETH after the first two are proven on mainnet.

### Flow
1. Buyer picks a coin on checkout.
2. Worker fetches USD price from free public APIs (Binance public ticker primary; Kraken or Coinbase as second source; CoinGecko as backup). Cache in KV for 60s. If sources disagree beyond a threshold, block checkout.
3. Rate is **locked for 30 minutes**. Stablecoins are treated as $1 but checkout is blocked if depeg exceeds 2%.
4. Worker assigns the payment destination (see matching below) and shows **QR, address, exact amount, network warning, countdown**. QR generated with the free `qrcode` library.
5. Checkout page polls order status every 10-15s.
6. Cron Trigger (every minute) checks pending attempts via free APIs: mempool.space (BTC), TronGrid (TRC20), Alchemy/Infura free tier or public RPC (EVM).
7. On enough confirmations: order -> `paid` (idempotent), create download token, queue delivery email via Resend.

### Matching strategy
- **BTC and EVM:** per-order address derived from an **xpub** stored in the `wallets` table (public key only). Increment `next_index` atomically.
- **USDT TRC20 at launch:** one address + **unique decimal amount per order** (e.g. 49.0137 USDT). Guarantee no two open orders share an amount.

### Admin wallet management (highest-risk feature)
- Located at `/admin/wallets`, behind Cloudflare Access + 2FA.
- Admin adds coin / network / address or xpub, enabled toggle, min confirmations.
- **New or changed wallet activates after a 24h delay.**
- Every change writes `wallet_audit_log` and **instantly alerts the owner** (email, optionally Telegram).
- Re-authentication required to change wallets.
- **NEVER store private keys, seed phrases, or mnemonics in code, DB, env, logs, or chat.** Public addresses and xpubs only.

### Edge cases (must be implemented and tested)
- Underpaid within 1% tolerance -> accept; beyond -> `partial`, show remaining amount
- Overpaid -> flag for refund/credit
- Paid after expiry -> `late_payment`, admin alert, manual decision
- Wrong network -> prominent warnings on checkout; document in policy
- Buyer claims payment -> "submit TX hash" form, verified by admin tool
- Duplicate checks / webhooks -> idempotent; delivery email sent at most once automatically
- Tx confirmations: BTC 1-2 (3 for large), TRC20 chain finality, EVM 6-12 (fewer on L2)

### Testing gate
Do not enable mainnet until: 20+ testnet orders covering exact / under / over / late / duplicate cases pass, then real $1-$5 mainnet tests per coin.

---

## 8. Delivery

- List files live in a **private R2 bucket**. Never public.
- Delivery via a Worker route that validates a hashed token, then streams from R2 (or issues a short-lived presigned URL).
- Defaults: 72h expiry, max 5 downloads, per-IP rate limit. Admin can re-issue.
- Log every download (hashed IP, time) for disputes.
- Each delivery email includes: invoice, license note (permitted use), replacement-policy link, opt-out link.
- Sample files contain **only masked data** (e.g. `j***@example.com`), never real working contacts.
- Before generating a delivery file, **apply the suppression list** (opt-outs removed).

---

## 9. Backend jobs

**Request-time API routes:** sample request, checkout create, price quote, payment status, secure download, opt-out, contact, category request, custom-list price.

**Queues:** sample email, order confirmation, delivery email, email retry with backoff, admin notifications.

**Cron Triggers:**
- every minute: payment watcher
- every 15 min: expire stale attempts
- daily: token cleanup, D1 backup export to R2, sitemap refresh
- weekly: refresh counts and `last_verified_at`, re-apply suppressions

**Data pipeline (separate from the website, runs locally or on a private server in `/pipeline`, Python):** ingest -> clean and dedupe -> email verification -> apply suppressions -> tag (category, geo, size, role) -> generate CSV -> generate masked sample -> upload to R2 -> update D1 counts. Workers are not used for heavy file processing.

---

## 10. Compliance and legal

Compliance is a real selling point. Pages must describe **how we actually operate**, not boilerplate for show.

- All legal pages listed in the sitemap must exist at launch, flagged **"needs lawyer review"** in code comments until reviewed.
- Decide and document per region (EU/UK GDPR, CCPA/CPRA, CAN-SPAM, CASL, others) what we sell and to whom. If a region cannot be served lawfully for a data type, block or restrict it in checkout and say so.
- `/opt-out` must really remove people: write to `suppressions`, honor within the stated time, apply to every future file.
- Lawful-use policy: buyers agree not to use data for spam, fraud, harassment, or unlawful processing.
- Do not sell data we cannot lawfully source. The data-sources page must be accurate.
- Do not publish personal data about private individuals on public pages (samples are masked).
- Cookie banner only if non-essential cookies exist (Cloudflare Web Analytics is cookie-free).
- Check the acceptable-use policies of Cloudflare and Resend regarding this business model before launch. Resend is for **transactional emails only**.

---

## 11. Security

- Verify all webhook / callback authenticity where used; never trust client-reported payment state.
- Validate all input with Zod on server routes.
- Turnstile on every public form; rate limit samples, downloads, quotes.
- Secrets only in Wrangler secrets / env, never committed. `.dev.vars` and `.env*` in `.gitignore`.
- Admin routes `noindex` and protected by Cloudflare Access; additionally verify the Access JWT in the Worker.
- Security headers (CSP, HSTS, X-Content-Type-Options, referrer policy), plus CSRF protection on state-changing routes.
- No PII in logs.
- Dependency hygiene: pin versions, avoid abandoned packages.

---

## 12. Email (Resend)

- Domain auth: SPF, DKIM, DMARC set in Cloudflare DNS before any sending.
- Templates: sample delivery, order confirmation, delivery link, payment received, late payment notice, refund/replacement.
- Branded with palette; plain-text fallback.
- Never send cold or bulk marketing from this account.

---

## 13. Repository conventions

```
/app                 Next.js routes (App Router)
/components          UI (shadcn/ui in /components/ui)
/content             MDX (blog, case-studies, compare, use-cases)
/lib                 db, payments, pricing, email, r2, utils
/drizzle             migrations
/pipeline            data pipeline scripts (Python, not deployed)
/scripts             one-off tooling
/public              static assets
wrangler.jsonc       Cloudflare config and bindings
open-next.config.ts  OpenNext config
```

- TypeScript strict, ESLint + Prettier, no `any` without a comment.
- Server logic in route handlers / server actions; shared logic in `/lib`.
- Small commits, descriptive messages. Never commit secrets or real data files.
- Tests (Vitest) for: pricing math, rate locking, unique-amount allocation, address derivation, payment state machine, token expiry.
- Run `lint`, `typecheck`, `test` and `build` before declaring any phase done.

---

## 14. Build phases

Work in order. Finish and verify each phase before starting the next. After each phase, summarize what was done and what is next.

**Phase 1: Foundation.** Next.js + Tailwind + shadcn/ui, OpenNext + `wrangler.jsonc`, D1 + Drizzle schema + migrations, design tokens, layout (header, footer, mega menu like Openmart's Database menu), seed data for 3 sample categories.
Done when: site runs locally with `wrangler`-compatible dev, deploys a preview to Cloudflare.

**Phase 2: Core pages.** Home, category index (A-Z), category page, product page template with masked sample table, city/country pages, SEO (metadata, sitemap, JSON-LD).

**Phase 3: Sample flow and trust.** Request-a-sample (Turnstile, D1, Queue, Resend), FAQ, contact, request-category, data-sources, verification, and all legal pages and opt-out.

**Phase 4: Checkout.** Admin wallets (Access-protected), price service, BTC then TRC20, QR checkout page, cron watcher, delivery, emails, edge cases, testnet gate.

**Phase 5: Content.** 10 comparison pages, use cases, case-study templates (real content only), blog, bundles, custom list builder, creators vertical.

**Phase 6: Hardening and launch.** WAF/rate limits, Access on admin, backups, monitoring, Lighthouse and accessibility pass, lawyer review, soft launch to 10-20 prospects.

**Post-launch:** ETH and USDC, more categories, card payments via high-risk processor if needed.

---

## 15. Working agreements for Claude Code

1. Read this file first, every session.
2. Ask before adding paid services, changing the stack, or making legal claims.
3. Never invent data, reviews, case studies, counts, or customers. Use clearly labeled placeholders and list them in `TODO-BEFORE-LAUNCH.md`.
4. Never handle, request, or store private keys or seed phrases.
5. Keep copy specific, benefit-led, and truthful (section 2).
6. Prefer simple, free, open-source solutions.
7. When a requirement is unclear or a Cloudflare/OpenNext limitation blocks the plan, stop and report options instead of guessing.
8. Keep this file updated when decisions change.

---

## 16. Open decisions (fill in as decided)

- [ ] Data sourcing method and lawful basis per region
- [ ] First launch categories (suggest 3-5)
- [ ] Pricing per tier
- [ ] Final brand fonts and logo
- [ ] Which regions are blocked or restricted at launch
- [ ] Lawyer for legal review
- [ ] Email verification provider or in-house method
