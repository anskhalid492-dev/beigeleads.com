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
- **Decisions made in Phase 1:** Next.js 16 `cacheComponents` and `partialPrefetching` are OFF (OpenNext support unverified). Fonts are self-hosted via `@fontsource-variable` (Bricolage Grotesque only: condensed heavy for headlines, normal width for body) instead of `next/font/google`, so builds need no Google access and no visitor data goes to Google. `images.unoptimized` is true. `cloudflare-env.d.ts` is committed, full runtime types, ESLint-ignored (regenerate with `npm run cf-typegen`). Secrets/vars are declared in `env.d.ts`. Placeholder seed data lives in `drizzle/seed.sql`; see `TODO-BEFORE-LAUNCH.md`.

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
- Typography: Bricolage Grotesque (variable, self-hosted) for everything. Headlines use the condensed heavy voice (`.display`), body uses normal width.
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
- **OWNER DECISION (Nov 2026): every coin uses ONE fixed receiving address (entered by the admin in `/admin/wallets`) + a UNIQUE AMOUNT per order.** Customers pay straight into the owner's wallet; no per-order addresses, no xpub. BTC unique amount = base + 1..999 satoshis; USDT = base + 0.0001..0.0999. An incoming transfer belongs to the order whose amount it equals EXACTLY (and that happened after the quote was created). Transfers matching no order are emailed to the owner for manual review. (The earlier xpub/per-order design in section 20 is superseded; `lib/payments/derive.ts` is kept but unused.)

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

> **SUPERSEDED (Nov 2026, owner decision, see section 33):** no R2 files and no download page. The buyer is emailed an external https link the owner sets per product in `/admin/delivery`. The R2/token rules below are not built; `/download/[token]` is not used.

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

- [x] Data sourcing method (owner described it, see section 21)
- [ ] Lawful basis per region
- [ ] First launch categories (suggest 3-5)
- [ ] Pricing per tier
- [ ] Final brand fonts and logo
- [ ] Which regions are blocked or restricted at launch
- [ ] Lawyer for legal review
- [x] Email verification: in-house SMTP checks by our team, all data re-verified every 60 days

---

## 17. Phase 3 decisions

- Public forms (sample, category request, contact, opt-out) go through `lib/forms/handle.ts`: honeypot, Zod validation, Turnstile, KV rate limit (5/hour/IP per route), then the handler. Responses never reveal whether an email already exists.
- Emails are sent with `waitUntil` + Resend (`lib/forms/email.ts`), not a Queue yet. Queue (retries) is deferred; add a consumer when retries matter.
- Opt-outs store only `sha256(HASH_SALT:email)`. The data pipeline MUST hash the same way to apply suppressions.
- Config lives in the Cloudflare dashboard (Settings > Variables and Secrets): secrets `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `HASH_SALT`; vars `NOTIFY_EMAIL`, `EMAIL_FROM`; build variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. `TURNSTILE_VERIFY_URL` is for local tests only; never set it in production.
- `/verification` is a real page (Nov 2026, owner facts only: SMTP checks, 60-day re-verification, no accuracy claims). `/data-sources` is now a real page (see section 21); `/legal/*` are DRAFTS (section 21). Do not invent facts beyond what the owner stated.

---

## 18. Footer / CTA decisions

- The global CTA "See a sample before you spend a cent." lives in `components/layout/footer.tsx` (no per-page CtaBand anymore). Footer is a 6-column link footer with all 10 comparison links (`lib/compare.ts`). New token `--forest-300` for footer headings.
- `/compare/beigeleads-vs-<slug>` are noindex stubs until Phase 5 content.

## 19. Deploy config

- `wrangler.jsonc` sets `keep_vars: true` so plain-text vars (`NOTIFY_EMAIL`, `EMAIL_FROM`) set in the Cloudflare dashboard are not wiped by each Workers Builds deploy (the repo config has no `vars`). Secrets are never wiped.

## 20. Phase 4a decisions (payment core)

- `lib/payments/*`: BigInt atomic-unit math (no floats), quote lock 30 min, rates from >=2 agreeing sources (median, 1.5% max spread, 2% stablecoin depeg block), unique TRC20 amount (0.0001-0.0999 offset), payment classification (1% tolerance), order state machine, confirmations.
- BTC receiving addresses derive from a native SegWit **zpub** (BIP84; vpub for testnet) only. Private keys (xprv/zprv...) are rejected in code. Legacy `xpub` is rejected so the address type is never ambiguous.
- TRC20 matching is by exact unique amount, so the 1% underpay tolerance applies to BTC only; a TRC20 amount that matches no open attempt goes to admin review.
- Tests: `npm test` (Vitest, `tests/`). `tsconfig` target is ES2020 (BigInt).

## 21. Data sources and legal drafts

- Owner's sourcing statement (Nov 2026): team collects raw data from Google Maps/business listings, company websites, public government registries, directories, licensed providers, public professional profiles/social handles, surveys, own research ("200+ sources"); then appends/enriches, finds missing owners/tech stack/emails (published emails, pattern inference, waterfall enrichment), verifies with in-house SMTP checks, organizes, sells. All data re-verified every 60 days.
- `/data-sources` (`app/data-sources`, `components/data-sources/*`) states exactly that. Do not add numbers or claims beyond it. Illustrations use a fictional record and say so.
- `/legal/*` render from `lib/legal/docs.ts`. They are drafts with a visible "under legal review" banner and highlighted `[TO CONFIRM: ...]` markers; noindex until a lawyer signs off. Do not remove markers without a real decision.

## 22. Product page template (redesign, Nov 2026)

- `app/product/[slug]/page.tsx` + `components/product/*` is ONE reusable template; nothing is hardcoded per product. Section order: hero (facts + masked database window), stats, sample table, fields, pricing packages, who uses it, how it works, data quality, FAQs, related, final CTA. This replaces the order listed in section 4.
- Palette stays on the section 4 tokens (owner chose to keep them, not the #1F3D2B/#E8DCC4/#885CF6 values from the redesign brief).
- Heading for FAQs is generated: `FAQs About the {product.name}`. FAQ text comes from `getProductFaqs` (templates); table `product_faqs` exists (migration 0001) for the future admin panel.
- Catalog fields added: product `name`, `description`, `accuracyPct`, `packages`, `placeholderData`; category `singular`, `reachLabel`, `useCases`. Stats and sections render only what exists in the data.
- PLACEHOLDER values (owner-approved for dev): 100,000 records, accuracy 95%, last verified 2026-09-18, Starter $99. Pro $249 / Complete $399 and the 10k/50k/100k sizes are my extrapolations. The page says "placeholders" while `placeholderData` is true.

## 23. Solutions section and footer (Nov 2026)

- `/solutions` (landing) + `/solutions/[slug]` (12 pages) replace the planned `/use-cases` hub; `/use-cases` 308-redirects to `/solutions`. All copy lives in `lib/solutions.ts`; one template in `components/solutions/*`. Add a solution by adding one entry there (footer, landing, sitemap follow automatically).
- Solution copy only claims what exists: 3 real products (dentists/restaurants/ski shops, US) and the 7 real fields. Real estate, creators and recruitment pages say plainly that no such lists exist yet.
- Footer = exactly six columns: Company, Lists, Solutions, Compare, Resources, Legal (Trust merged into Legal with three groups). Header nav has a Solutions link.
- Pages inherit the site-wide noindex until launch (see TODO-BEFORE-LAUNCH.md). Copy lives in `lib/solution-copy.ts` (pain points per audience) and `lib/solution-faqs.ts`. The global footer CTA band is hidden on /solutions (`components/layout/footer-cta.tsx`).

## 24. Solutions redesign, FAQs, database icons (Nov 2026)

- Solutions pages (recreated Nov 2026): centered animated hero (`HeroShell` in `components/solutions/sections.tsx`: rising words, pipeline nodes light in turn, travelling dot, floating chips; all CSS, disabled under reduced motion), 1200px container, compact sections. Exactly 7 FAQs per solution live in `lib/solution-faqs.ts`.
- Database visual identity: `components/shared/db-icon.tsx` (`DbBadge`, `Flag`, `IndustryIcon`). Flags are inline SVG (US, GB, DE, FR, CA, AU, CH); industry icons are chosen by category slug (tooth is custom-drawn). Add a category/country by adding one map entry. Brand logos (Instagram, YouTube, ...) are NOT bundled yet because no creator/platform lists exist.
- Footer Legal column is one flat list of 13 links; the Cryptocurrency Payments link was removed from the footer .

## 25. Legal pages published without lawyer review (Nov 2026)

- Owner decision: legal pages and /verification are published with dates (`LEGAL_UPDATED` in `lib/legal/docs.ts`); the "under legal review" banner and all `[TO CONFIRM]` markers were removed. Open details were filled by the assistant on the owner's instruction: company BeigeLeads LLC (215 W Pershing Rd, Kansas City, MO 64108), Missouri law, retention 7 years / 12 months, 30-day claim window, 3 working days response, 30-day rights response, US-only data (no EU/UK/Canada sales yet).
- Policy "Refund & Returns" (`/legal/refund-replacement`): bounce rate above 5% -> replace bounced emails until the list is back at 95% verified / 95% accurate; otherwise proportional refund in crypto.
- These texts are NOT lawyer-reviewed. Before selling to EU/UK/Canada, revisit GDPR/CASL pages. Site-wide noindex is still on.

## 26. /verification redesign (Nov 2026)

- `/verification` is a full methodology page (hero with animated source network, philosophy, sources, 8-stage timeline, quality checks, email verification flow, freshness, fields, compliance links, guarantees, database cards, exactly 10 FAQs, CTA). Components in `components/verification/*`; content only from the owner's sourcing statement, site policies and the 5%/95% refund promise. The "200+ sources" figure is intentionally NOT repeated here (only on /data-sources).
- Motion is CSS only: scroll-driven `.reveal` / `.parallax-*` (progressive, visible without `animation-timeline` support) and looping visuals; all disabled under reduced motion. Full-page screenshots show reveal sections blank because nothing has scrolled; check by scrolling.
- Footer CTA band is also hidden on /verification (`footer-cta.tsx`).

## 27. Solutions pages follow the Openmart-style section structure (Nov 2026)

- `app/solutions/[slug]/page.tsx` = `SolutionHero` + sand page with white `rounded-[2rem]` panels from `components/solutions/blocks.tsx`: preview table (primary product's masked sample, filtered to its fields), fields grid (+ "Need other fields?"), why-cards (`helps`), 4 connected steps, databases + city chips, applications, `PainTabs` (client, all panels in DOM), other solutions, resources, 7 FAQs, CTA panel. Headings are centered with a purple accent phrase.
- Labels come from `lib/solution-focus.ts` (`audience`, `focus`). Everything shown comes from the catalog and solution copy; placeholder sample rows say so on the page. `/solutions` landing still uses the older sections.

## 28. Phase 4b: admin wallets (Nov 2026)

- `/admin/wallets` (noindex, `force-dynamic`) fails closed: every page and server action calls `requireAdmin()` (`lib/admin/require-admin.ts`), which verifies the Cloudflare Access JWT (`cf-access-jwt-assertion`, RS256 via Web Crypto, `lib/admin/access.ts`) against vars `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` (optional `ADMIN_EMAILS` allow-list). Missing config or bad token = 404.
- `lib/wallets/*`: public-key validation (BTC zpub/vpub only, TRON base58check address; private keys rejected), 24h activation delay on add/enable (disable is instant), audit rows in `wallet_audit_log`, owner email via `notifyOwner`. "Re-authentication" is enforced with a short Access session duration on the `/admin/wallets` Access app (dashboard setting).
- **Admin login (added Nov 2026, owner chose "Access + app login")**: two layers. Layer 1 Cloudflare Access (JWT verified in Worker). Layer 2 `/admin/login`: password (PBKDF2 hash) + TOTP code, signed HttpOnly `__Host-` session cookie, 15 min, bound to the Access email, KV rate limit (8/15 min). Secrets `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET` are generated locally by `scripts/admin-setup.mjs` and set in the Cloudflare dashboard only. `requireAdmin()` = both layers; `requireAccess()` = layer 1 only (login page).

## 29. Phase 4c: price quote and BTC checkout (Nov 2026)

- Orders reference products by `product_slug` + `package_name` + `records` (migration `0002_checkout_orders.sql`; the catalog is static code, not D1). `payment_attempts` gained `wallet_id` and `derivation_index`.
- `lib/checkout/create.ts`: gates (`CHECKOUT_ENABLED=true`; draft/placeholder products need `CHECKOUT_ALLOW_PLACEHOLDER=true`; BTC **mainnet** wallets are used only when `MAINNET_ENABLED=true`, otherwise testnet vpub only = enforces the testing gate in code), KV-cached rate (>=2 agreeing sources), 30 min lock, atomic `next_index` bump (`UPDATE ... RETURNING`), zpub/vpub address derivation, order + item + attempt in one D1 batch. BTC only; TRC20 comes in 4e.
- Routes: `POST /api/checkout` (Zod, Turnstile, KV rate limit 10/h), `GET /api/checkout/[orderId]/status` (read-only), pages `/checkout/new?product=&package=` (email form) and `/checkout/[orderId]` (QR via `qrcode/lib/browser.js` pure-JS build, exact amount, testnet banner, countdown, 12s poll). All noindex. Product-page "Buy" stays disabled while products are drafts.
- Not built yet: watcher cron (4d), TRC20 (4e), delivery + emails (4f), edge cases + testnet gate (4g).

## 30. Phase 4d: payment watcher (Nov 2026)

- Cron Triggers need a custom Worker entry: `wrangler.jsonc` `main` is `custom-worker.ts` (re-exports OpenNext's `fetch`, adds `scheduled`; per the OpenNext "custom worker" how-to). Crons: `* * * * *` = payment watcher, `*/15 * * * *` = expiry sweep. Cron code has no request context, so it uses `getDbFromEnv(env)`, never `getCloudflareContext()`.
- `lib/payments/watcher.ts` (BTC only so far): reads mempool.space (`BTC_TESTNET_API` var overrides the testnet base, e.g. testnet4), upserts `payment_events` (tx_hash UNIQUE = idempotent), then `decideAttempt` (pure, tested) -> guarded status flips (`UPDATE ... WHERE status IN (...) RETURNING`) so the owner is notified at most once per transition. Paid -> order `paid`; under 99% -> `partial`; after quote expiry -> `late_payment` (never auto-delivered); overpaid -> owner email. Expired quotes are watched for 7 days to catch late payments. Delivery token + email hook is the marked spot in the `paid` branch (Phase 4f).
- Known limits: a top-up that arrives after expiry is judged by the EARLIEST transaction's seen time; overpayment is only flagged by email (no DB column yet); amounts in D1 are decimal strings, parsed with `parseAtomic` (no floats).


## 31. Phase 4e: fixed-address checkout, BTC + USDT TRC20 (Nov 2026)

- Owner decision (see section 7): fixed address per coin + unique amount. Wallet admin now accepts PUBLIC ADDRESSES only (BTC bc1/1/3 or tb1/m/n/2 testnet, TRON T... with checksum); keys, xpubs and seed phrases are rejected (`lib/wallets/validate.ts`). Admin kinds: BTC mainnet/testnet, USDT TRC20 mainnet / TRON Nile testnet.
- `lib/checkout/create.ts`: coins `BTC` | `USDT`; mainnet only when `MAINNET_ENABLED=true` (otherwise BTC testnet + USDT Nile, Nile needs var `TRON_NILE_USDT`). Amounts reserved for 7 days per address; a race for the same amount is detected after insert and retried.
- `lib/payments/watcher.ts`: one chain read per (coin, network, address) -> `match.ts` (exact amount, after quote creation, 7-day window) -> `decideAttempt`. BTC via mempool.space; USDT via TronGrid `only_confirmed` (`tron-chain.ts`; mainnet contract TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t, set `TRONGRID_API_KEY` secret if rate-limited). Event `seenAt` uses the transfer's block time so outages do not make on-time payments look late.
- Consequences to keep honest: no 1% underpay tolerance anymore (exact match); a buyer whose exchange deducts a fee will not match (owner is emailed); the checkout page tells buyers to add fees on top. BTC unique offset costs the buyer up to 999 sats (~$0.60 at $60k) extra, shown in the exact amount.
- Not yet: ETH and USDC (waiting for the owner's network choice), delivery + emails (4f), tx-hash claim form and testnet gate (4g).

## 32. Phase 4e+: ETH, USDT-ERC20, USDC-ERC20 (Nov 2026)

- Pay options live in `lib/payments/options.ts` (BTC, USDT-TRC20, USDT-ERC20, USDC-ERC20, ETH). Checkout/API/admin/watcher all dispatch on `option.chain` (bitcoin | tron | evm). Unique-amount steps: BTC 1 sat, stablecoins 0.0001, ETH 1e10 wei. Wallet rows are per coin (one row each for ETH, USDT ERC20, USDC ERC20; the same 0x address may be used for all three).
- EVM reads use Blockscout REST v2 (`lib/payments/evm-chain.ts`; mainnet `eth.blockscout.com`, Sepolia `eth-sepolia.blockscout.com`, vars `EVM_API_BASE`/`EVM_TEST_API_BASE`, optional secret `BLOCKSCOUT_API_KEY`). Mainnet token contracts are hardcoded (USDT 0xdAC1..1ec7, USDC 0xA0b8..eB48); Sepolia token contracts come from vars `EVM_TEST_USDT` / `EVM_TEST_USDC` (test options are refused without them). 12 confirmations. Parsing is NOT yet verified against the live API: test on Sepolia first.

## 33. Phase 4f: delivery by external link (Nov 2026)

- Owner decision: the owner hosts each list elsewhere and pastes an https link per product (optionally per package) in `/admin/delivery`. When an order becomes `paid`, the buyer is emailed that link. No web download, no R2, no tokens.
- Tables (migration `0003_delivery.sql`): `delivery_links` (product_slug, package_name '' = all packages; package link wins) and `deliveries` (one row per order, unique order_id, status sending|sent|failed, attempts, snapshot of the url).
- `lib/delivery/deliver.ts`: `deliverOrder` claims the row before sending (idempotent, at most one automatic email), retries failures up to 5 times, tells the owner when a paid order has no link or delivery keeps failing. `deliverPendingOrders` runs at the end of every minute cron, so setting a link later delivers waiting orders automatically. Admin can "Send again" (force).
- Only https links are accepted; every link change emails the owner. The email carries order, link, permitted use, lawful-use, replacement and opt-out links.
- Consequence to keep honest: anyone who gets the link can open it. Use a host with unguessable/private links. Suppression-list application to files is now the owner's manual step because files are not generated by the site.

## 34. Phase 4g: edge cases, claims, testnet gate (Nov 2026)

- Migration `0004_claims_audit.sql`: `payment_claims`, `order_audit_log`, `payment_attempts.overpaid_amount` (overpayments are now persisted, not only emailed).
- Buyer "I already paid" form on `/checkout/[orderId]` -> `POST /api/checkout/claim` (Turnstile, rate limit, Zod). It only stores a claim and emails the owner; it never changes an order.
- `/admin/orders` (Access + app login): pending claims with explorer link (`lib/payments/explorer.ts`), partial/late orders, overpaid list, testnet-gate counters, decision log. Actions (`lib/orders/manual.ts`) require a ticked confirmation, follow the state machine (expired -> late_payment -> paid), are guarded against double runs, logged in `order_audit_log`, emailed to the owner, and "mark paid" triggers delivery. "Mark refunded" only records a refund done outside the site.
- The testnet gate is still a human decision: the page counts test-network outcomes (exact/under/over/late/expired); duplicate handling relies on UNIQUE tx_hash + unit tests. `MAINNET_ENABLED` stays unset until 20+ test orders and $1-$5 mainnet tests per coin are done.
- Bitcoin test network is **testnet4** (default API `mempool.space/testnet4/api`, explorer links `/testnet4/tx`); testnet3 faucets are mostly gone. `BTC_TESTNET_API` can still override. Test wallet app: Sparrow > Tools > Restart In Testnet4.

## 35. Phase 5a: comparison pages (Nov 2026)

- `/compare` hub + `/compare/beigeleads-vs-<slug>` (10 pages) render from ONE data file `lib/compare-data.ts` through `components/compare/compare-page.tsx`. Add or edit a competitor by editing that file only (hub, sitemap, footer follow).
- Honesty rules: every competitor fact comes from the vendor's OWN pages, listed as `sources` and dated `CHECKED` (17 Nov 2026). Unknowns are written "not stated". No accuracy or "better than" claims. The page says plainly that we are a competitor. BeigeLeads claims use only `US` in that file (owner facts and our policies). No BeigeLeads price appears (prices are placeholders).
- Re-read every source page before launch and whenever a vendor changes plans; update `CHECKED`. RocketReach and ZoomInfo have thin facts (their pricing pages were not readable), so those pages avoid prices.
- Phase 5 still to do: use cases (done as /solutions), case-study template (real content only), blog (MDX), bundles, custom list builder, creators. The attached "master redesign prompt" was a REFERENCE only; follow this file's plan.

## 36. Phase 5b: custom list builder + catalog search (Nov 2026)

- `/custom-list` (`/custom-list-builder` 308-redirects to it): client form `components/custom-list/builder.tsx` (category, country, state/city, quantity, progressive "job titles / fields / notes", live summary, Turnstile, honeypot). Prefills from query string (`q, category, categoryText, quantity, country, region`). Success is shown only after `POST /api/custom-list` (`handleForm`) saved the row in `custom_list_requests` (migration `0005_custom_list_requests.sql`) and the owner email was queued. The page states it is a request, not an order, with no price promised.
- `lib/search.ts`: structured parser (`parseQuery`) + `searchCatalog` (exact vs close, never invented counts/prices) + `customListHref(query)` for the "Build My Custom List" link. Tests in `tests/search.test.ts`. The AI co-pilot hero, header mega menu and homepage redesign from the owner's reference prompt are NOT built yet; they will use these functions. Any AI step must sit in front of this lookup, not replace it.
- Page is noindex like the rest of the site until launch.

## 37. Comparison pages redesign (Nov 2026) — supersedes the visible-disclaimer rules in section 35

- Owner decision: comparison pages are conversion landing pages. Visible research notes are REMOVED (no "we are a competitor" box, no source dates, no "not stated", no "honest take"). `lib/compare-view.ts` drops sentences containing "not stated" and hides rows left empty; `lib/compare-data.ts` keeps `sources` and `CHECKED` internally for re-verification before launch (not rendered).
- Page = `components/compare/compare-page.tsx`: logo VS hero, "Meet BeigeLeads", at-a-glance, table (BeigeLeads column highlighted), why-choose cards, who-should-choose, final CTA, 8 generated FAQs (`compareFaqs`, customised from each competitor's data). Claims about BeigeLeads still come only from `US` (no price, no accuracy claim). Do not add claims about a competitor that are not in its `sources`.
- Competitor logos were tried and REMOVED (owner, Nov 2026): pages use text names only. Layout follows the owner's Openmart reference: hero, intro + at-a-glance card, why different, data-source trust section (owner's sourcing statement, no numbers), when to use each, feature table, pricing band, CTA, 8 FAQs. No testimonials (none exist).
- Owner rule (Nov 2026): NEVER state how many lists BeigeLeads has (no "three lists", no list of the live niches) anywhere on the site. Point to /lists instead.

## 38. Lead discovery co-pilot on the home page (Nov 2026)

- `components/home/copilot.tsx` (top of `app/page.tsx`, owns the page H1 "Find the right leads. Own the list."): combobox search with suggestions, keyboard navigation, popular chips, rotating example placeholder (off under reduced motion). It is a STRUCTURED search (`lib/search.ts`), not an AI model, and says "Searches our real catalog". Exact matches and close alternatives are shown separately; no match shows "We couldn't find an exact match..." plus a "Build my custom list" link prefilled via `customListHref`. Placeholder product data is never shown as counts/prices in results (links to the list page instead).
- Not built yet: header redesign + Solutions mega menu, the rest of the 13-section homepage. A real AI step, if ever added, must sit in front of `searchCatalog`.

## 39. Homepage and header redesign (Nov 2026)

- Header (`components/layout/header.tsx`): floating pill, compacts on scroll, hover-intent menus with 180ms grace (no flicker), click/keyboard/Escape support, mobile menu. Nav: Lists, Solutions (mega menu built from `lib/solutions.ts`: By use case / By audience / By industry + co-pilot card), How it works, Compare, FAQ; CTAs Free sample + Find leads (`/#find-leads`). Pricing is removed from the main nav (individual list pricing); `/pricing` still exists in the footer.
- Home (`app/page.tsx`) sections: hero + co-pilot (id `find-leads`), value cards, available lists (placeholder figures labelled), how it works, why BeigeLeads, data preview (demonstration rows), browse by industry/location, ready-made vs custom, who it is for, trust and transparency, one-purchase-vs-subscription table, 8 FAQs, final CTA. The global footer CTA band is hidden on `/`. Motion is CSS only (`hero-in`, `drift`, `flow-line`, `mega-in`) and off under reduced motion.
- Footer trimmed: Solutions shows 6 + "All Solutions", Compare shows 5 + "All Comparisons"; legal links unchanged.
- Not done: search loading skeletons (search is instant and local, so a fake delay was not added), URL-based search state, product-card filters (no meaningful filter with the current catalog), testimonials/social proof (none exist). Verified in a headless browser: desktop hero, mega menu, search results, no-match state, 375px width without horizontal scroll. Not verified: keyboard-only walkthrough, screen reader, Lighthouse.

## 40. Admin dashboard redesign (Nov 2026)

- Admin has its own shell (`components/admin/shell.tsx`): collapsible sidebar (Overview, Products, Delivery Links, Orders, Payments & Wallets, Custom Requests, Settings), mobile drawer, header with page title + Sign out, toasts (`components/admin/toast.tsx`), shared UI in `components/admin/ui.tsx`. Public header/footer are hidden on `/admin/*` (`components/layout/public-chrome.tsx`). `/admin/login` renders without the shell. Login now redirects to `/admin`. Every page still calls `requireAdmin()` itself (the layout only reads the email for display).
- `/admin/delivery`: searchable, filterable, sortable, paginated product table (client side over the static catalog) + "Manage" side drawer: default link and one link per package, copy/open, https validation, confirm before replacing or removing, success toast only after the server saved. Package link still wins over the default. Saving a link never emails a buyer by itself, but paid orders already waiting for a link are still delivered by the minute cron (section 33, unchanged).
- `/admin/orders`: all-orders table (search, payment-status filter, pagination, separate payment and delivery badges); the old decision tools live under `?view=review` (`app/admin/orders/review.tsx`).
- `/admin/products` is READ-ONLY: the catalog is static code (section 22/29), so editing products from the admin would need a D1 catalog migration. Not built; ask before doing it.
- `/admin/custom-requests`: list + full details + status. Status lives in new table `custom_request_status` (migration `0006`, must be run in D1). Until it is applied the page shows everything as New and a notice.
- Overview shows real counts only; revenue counts real-money (mainnet) paid orders, test-network orders are excluded and shown as a note. Settings is read-only (on/off flags, never values).
- Not built: global search, notifications, bulk actions, delivery-link audit table (owner email per change remains).

## 41. Help Center (Nov 2026)

- `/help-center` is the Help Center home (moved from `/faq` Nov 2026; `/faq` 308-redirects, `/help` redirects). 9 categories, 54 articles at `/help/<category>/<slug>`, category pages at `/help/<category>`. Content lives in code: `lib/help/articles-{a,b,c}.ts` (+ `categories.ts`, `index.ts`); one article template (`app/help/[category]/[article]`), sticky TOC on desktop, "On this page" on mobile, related articles, contextual CTA (hidden on privacy/troubleshooting), contact box. `HELP_UPDATED` is the real review date; change it (or an article's `updated`) when an answer changes.
- Search (`lib/help/search.ts`, `components/help/search.tsx`): client-side over title/keywords/description/body, typo tolerance (edit distance), category filter chips, highlighting, keyboard navigation, popular searches, "Couldn't find what you're looking for?" empty state. No fake loading state (it is instant). Tests in `tests/help-search.test.ts`.
- Answers come ONLY from our published policies and implemented behaviour. NOT stated in articles on purpose: download-link expiry/count, 1% underpay tolerance, delivery timelines, prices, list counts, supported coins beyond "checkout shows what is open". Sitemap includes /help-center and all help URLs. "Helpful starting points" is an editorial pick (no popularity data exists).
- Not built: admin knowledge-base editor (articles are code, like the catalog; a D1-backed editor needs a migration and a rendering decision, ask first). Positioning in copy: "B2B data provider", never "marketplace".
- The earlier legal/delivery mismatch was resolved in section 42.

## 42. Owner decisions, 17 Nov 2026 (delivery facts, formats, crypto page)

- Delivery facts (owner): delivery is mostly instant, in some cases up to 12 hours at most; downloads are unlimited. Stated in the help articles, `/legal/delivery` (72h/5-download text and "within 15 minutes" removed), product FAQ and solution FAQs. Section 8's 72h / 5-download defaults are not used.
- File formats (owner): "CSV, Excel or TXT" everywhere on the site (product pages, solutions, help, legal delivery). Do not write "CSV file" alone. Competitor facts in `lib/compare-data.ts` are unchanged.
- `/legal/crypto-payments` was REMOVED (the doc entry is gone, the page now 404s, help links to it removed). Crypto rules are now stated only on checkout and in the help articles. Its 1% underpay tolerance text no longer exists anywhere.
- `/legal/dpa` Security text and the privacy policy were corrected 18 Nov 2026 (no link expiry/hash/private-storage claims, no download-log claims, since links are external and nothing is logged). `LEGAL_UPDATED` is 2026-11-18.

## 43. Blog CMS (Nov 2026)

- Blog is no longer MDX. Owner decision: article bodies and images live in **R2** (existing binding `LISTS`, prefix `blog/`; no new bucket, no new env vars), settings/status/SEO in **D1** (migration `0007_blog_cms.sql`, MUST be run in D1 before the blog works; until then admin pages show a notice and `/blog` shows "not available").
- Body = TipTap/ProseMirror JSON (`blog/posts/<id>/body.json`), revisions `blog/posts/<id>/rev/*.json`, images `blog/media/<year>/<uuid>.<ext>` served by `app/media/[...path]` (public URL `/media/...`). `lib/blog/doc.ts` `cleanDoc` rebuilds every document from an allow-list on EVERY save and read; the public page renders it as React elements (`components/blog/render.tsx`), never `dangerouslySetInnerHTML`. Embeds: YouTube (nocookie) and Vimeo only. Images: JPEG/PNG/WebP/GIF by magic bytes, 5 MB, SVG refused.
- Admin (all behind `requireAdmin`/`guardAdmin`): `/admin/blog` (stats, filters, sort, pagination, bulk publish/archive/delete with confirm), `/admin/blog/[id]/edit` (TipTap editor, Publish/Details/SEO tabs, autosave 3 s + local backup + recovery banner, optimistic version check = a stale tab cannot overwrite newer edits), `/admin/blog/[id]/revisions` (restore = new version; autosave revisions at most every 10 min, 50 kept), `/admin/blog/[id]/preview`, `/admin/blog/taxonomy`, `/admin/media`. Sidebar has Blog + Media.
- Workflow draft -> scheduled -> published -> archived. Scheduling uses the browser time zone (shown) and is stored UTC. The every-minute cron calls `publishDue`; public queries also treat due scheduled posts as live, so a late cron never hides an article.
- Public: `/blog` (featured, search, category chips, pagination), `/blog/[slug]` (breadcrumbs, TOC, reading progress, share, related, CTAs, Article + Breadcrumb JSON-LD, canonical/OG/noindex), `/blog/category/[slug]`; `sitemap.ts` is now async/dynamic and lists live, indexable articles. All pages are dynamic (D1 + R2 reads); the Workers Free 10 ms CPU limit may bite, see the Paid-plan decision.
- NOT built / not verified: server-side image optimization (no free option on Workers; see 44), browser verification of the editor behind Access (schema compatibility and the data layer are tested; drag handle, table UI and autosave timing are not exercised in a browser).

## 44. Blog follow-ups (Nov 2026)

- **Images:** `lib/blog/upload-client.ts` shrinks JPEG/PNG/WebP to max 2000 px wide (quality 0.85, large PNG -> WebP, GIF untouched, replace keeps type) in the browser before upload. Pasted/dropped image files and `data:` images from Word/Docs are uploaded to the media library and the address swapped (`allowBase64` is on in the EDITOR only; `cleanDoc` still rejects any `data:` image). `blob:` images from other apps are not recoverable: the editor tells the user to upload them. No server-side resizing/CDN (would need Cloudflare Images = paid; not added).
- **Roles:** `lib/admin/roles.ts`. Var `BLOG_EDITOR_EMAILS` (comma list). Editors authenticate with Cloudflare Access ONLY (no shared admin password), see only Blog + Media, can create/edit DRAFTS, upload and duplicate; they cannot publish/schedule/unpublish/archive/delete, change taxonomy, replace/delete media, or edit non-draft articles, and `requireAdmin()` rejects them everywhere else (least privilege: an editor listed in `ADMIN_EMAILS` is still only an editor). Enforced server-side in `app/admin/blog/actions.ts` and the media API. The editor's Access policy must include their emails in the Cloudflare dashboard. There is no "submit for review" state: an admin publishes drafts.
- **Newsletter:** migration `0008_newsletter.sql`, `lib/newsletter.ts`. Signup form shows only when var `NEWSLETTER_ENABLED=true`. Double opt-in via a transactional Resend confirmation email; confirm/unsubscribe happen on a button press (POST), not on page load. The site does NOT send newsletters (Resend is transactional only, section 12): `/admin/newsletter` exports confirmed addresses as CSV (with per-person unsubscribe links) for the owner's own email tool. Turn the flag on only when the owner will really send. The privacy policy does not mention newsletter signups yet (needs the owner's text).
- **Cache:** `custom-worker.ts` keeps anonymous GET `/blog`, `/blog/*` responses in the Cloudflare edge cache for 60 s (not search `?q=`, not requests with cookies or RSC). A publish/unpublish/edit can therefore take up to 60 s to appear. This reduces CPU per visit; the Workers Paid plan decision stays with the owner.
- **Tests:** `tests/blog-e2e.test.ts` runs the real blog code against a local D1 + R2 (wrangler emulator): save, stale-save conflict, revisions/restore, scheduling, the cron job `publishDue` (idempotent), unpublish, newsletter flow. It found and fixed a real bug (SQLite OFFSET without LIMIT broke revision cleanup on every save). The Cron Trigger itself (Cloudflare firing the schedule) is not simulated.

## 45. Free sample page redesign (Nov 2026)

- `/sample` rebuilt (`app/sample/page.tsx`, `components/sample/*`): hero + interactive preview (tabs per category, rows are labelled FICTIONAL examples from `lib/sample-data.ts`, masked email/phone) + form column, 3-step section, trust section linking Help Center articles. Footer CTA band hidden on /sample. Still noindex with the rest of the site; canonical `/sample`.
- Form: email + searchable list combobox (real catalog) + optional "Can't find your list?" text (mutually exclusive with a chosen list). Preselect from `?product=<slug>` or `?category=<slug>` (one product -> preselect, else prefill custom text). Turnstile, honeypot and rate limit unchanged (`handleForm`, which can now return extra JSON keys).
- Backend `lib/sample/requests.ts`: migration `0009_sample_requests.sql` (product_slug, custom_request, dedupe_key UNIQUE, email_status, email_error, attempts, updated_at, admin_note). Dedupe key = email + product/custom text, so repeated requests (including custom ones) create no row and no second email, and the response does not reveal it. The confirmation email is awaited; `email_status` = sent ONLY when Resend accepted it (failed / not_configured otherwise). API returns `{ok, delivery, label}`; the success state says "sent" only for `sent`. Samples themselves are fulfilled manually by the owner (the email says so); no delivery time is promised.
- Admin `/admin/sample-requests`: list with search/filters, details, fulfilment status (New/In progress/Fulfilled/Closed) + note, "Retry confirmation email". Test: `tests/sample-e2e.test.ts` (local D1).

## 46. /how-it-works page (Nov 2026)

- `/how-it-works` was a ComingSoon stub; it is now `app/how-it-works/page.tsx` + `components/how-it-works/*` (the `[page]` stub entry was removed). Sections: hero with animated 5-node workflow (CSS only), sticky step nav (IntersectionObserver, plain anchors), 5 journey steps (mini catalog search using `lib/search.ts`, masked example table, package picker, checkout illustration, fictional delivery email), ready-made vs custom, data explorer (product tabs, column highlight), 6-stage verification pipeline, benefits, purchase-model table (generic "subscription tools (typical)", no competitor claims), trust links to Help Center/legal, exactly 8 FAQs (FAQPage JSON-LD), final CTA. HowTo + WebPage + Breadcrumb JSON-LD. Footer CTA band hidden here. Still noindex.
- Honesty: the package picker shows record sizes and prices ONLY when `product.placeholderData` is false; while placeholders, it shows names, the Recommended flag from the catalog and the included fields. Example rows are fictional and labelled. No counts, accuracy numbers or reviews.
- Search fix: `parseQuery` now treats "in the US" like "in US" (it used to read "the" as a city). Test added.

## 47. Blog author profiles (Nov 2026)

- Migration `0010_blog_authors.sql` (MUST be run in D1): table `blog_authors` (slug unique, private `email`, short/full bio, expertise + links JSON, photo, SEO fields, status draft|published) and `blog_posts.author_id`. The old text column `blog_posts.author` stays: it holds the display name for cards and for legacy posts with no profile (nothing was migrated or lost).
- Backend `lib/blog/authors.ts` (Zod `authorSchema`, CRUD, `cleanUrl` = http(s) only, public queries WITHOUT email, reassign + delete). Rules: deleting an author used by any article needs a replacement author (articles move, bylines update); a profile with published articles cannot be switched back to draft; renaming updates the byline text of their posts; `savePost` links `authorId` and stores the profile's current name. New posts no longer default the byline to the editor's email, and any byline containing "@" is hidden publicly.
- Admin (admins only, `can.manageAuthors`): `/admin/blog/authors` (search, sort, pagination, delete dialog with reassignment), `/new`, `/[id]/edit` (basic info, photo, links, SEO). Photo: browser crop (drag, zoom, arrow keys, square + circle preview) to a 640 px WebP/JPEG, uploaded through the existing `/api/admin/media` (server checks the file by its bytes). No server-side resizing or srcset (no free option on Workers). Default avatar = initials, never a stock face.
- Article editor: searchable author picker; admins can add a DRAFT author (name + title) without leaving the article. Editors can choose authors but not create them. A draft profile shows its plain name on the article until the profile is published.
- Public: `/blog/author/[slug]` (published profiles only; ProfilePage + Person JSON-LD; noindex when the profile is noindex or has no published article; listed in the sitemap only with at least one published article), article byline "Written by", "About the author" card, `BlogPosting` JSON-LD with the author linked by `@id`.
- Tests: `tests/authors-e2e.test.ts` (local D1 + R2). Browser-checked at 1280 and 375 px with sample data. NOT browser-tested: the admin screens behind Access (form, crop dialog, editor picker); they are type-checked and the data layer is tested.

## 48. Blog redesign and first SEO article (Nov 2026)

- `/blog` is "The BeigeLeads Journal" (hero, category chips with counts, search, featured slot, Latest articles grid, pagination). There is NO editor-selected "featured" flag in the CMS, so the featured slot is the newest published article; "popular" and "featured guides" sections are NOT built (no popularity data / no flag). `PublicCard` now carries the published author profile's photo, slug and current name (one join in `lib/blog/posts.ts` `cardSelect`); bylines that look like emails are never shown.
- Article page (`components/blog/article-view.tsx`): breadcrumbs, category, H1, excerpt, byline with photo, featured image, 3 columns on desktop (share rail, 44rem text, sticky "In this article" TOC with active-section highlight), collapsible TOC on mobile, reading progress, ONE inline CTA chosen from category/tags/title (`components/blog/inline-cta.tsx`), About-the-author card, "Continue reading". The big dark CTA band was removed. Image captions are not supported by the CMS (not added).
- Starter articles: `lib/blog/starters.ts` (Markdown source in code, converted by `lib/blog/markdown.ts`) + `/admin/blog/starters` (admin only) create a DRAFT through the normal CMS save path (category, tags, SEO, optional author). Nothing is published automatically; the owner adds the featured image, checks, and publishes. First article: `how-to-build-a-b2b-email-list` (about 2,300 words). External facts were checked on official pages on 18 Nov 2026: FTC CAN-SPAM guide (10 business days, up to $53,088 per email, no B2B exception) and Google sender guidelines (5,000+/day, SPF/DKIM/DMARC, one-click unsubscribe, spam rate under 0.30%, aim below 0.10%). Re-check before reuse.
- Tests: `tests/starter-e2e.test.ts` (word count, SEO lengths, heading outline, internal links resolve, create draft, publish, public route).

## 49. Custom List Builder 2.0 (Nov 2026) — supersedes the form described in section 36

- `/custom-list` is a 4-step wizard (Audience, Location, Data, Review) in `components/custom-list/*` (`builder.tsx` shell, `steps.tsx`, `chip-input.tsx` ARIA combobox, `summary.tsx` live "Your Custom List" sidebar / mobile collapsible panel, `state.ts` validation + completion, `prefill.ts` Co-Pilot prefill). Page = hero + builder + "How Custom List Requests Work" + 8 FAQs; still noindex, canonical `/custom-list`.
- No price or record-count estimate anywhere; presets are requested volumes; every filter/field is "subject to sourcing". Suggestions (`lib/custom-list/data.ts`) are ideas, not inventory. Co-Pilot links add `countryText`; only reliable parts are prefilled and the banner says what happened. Local draft (`bl-custom-list-draft-v1`) never contains name, email, company or message.
- Backend: `lib/custom-list/{schema,submit}.ts`, `POST /api/custom-list` via `handleForm`. Saves FIRST (migration `0011_custom_list_v2.sql`, MUST be run in D1 before deploy: reference, name, company, audience, detail_json, dedupe_key, owner_notify, customer_email_status, status note), then emails the owner and the customer; results stored, a failed email never discards the request. Reference `CL-XXXXXXXX`. Identical re-submits (same email + requirement) return the same reference with no second row or email. Legacy flat columns are still filled; old rows (no reference) still show in admin.
- Admin `/admin/custom-requests`: structured details, email delivery status, status labels New / Reviewing (stored `in_progress`) / Quoted / Completed (stored `done`) / Declined, internal note (never shown to customers).
- Tests: `tests/custom-list-e2e.test.ts` (local D1). Other e2e tests apply migrations up to 0010 only. Browser-checked at 1280 and 375 px; NOT tested: real Turnstile and Resend delivery, admin screens behind Access.

## 50. SEO Manager + featured image system, Phase 2 (Nov 2026)

- Scope (owner brief "ADVANCED SEO MANAGER + BLOG FEATURED IMAGE SYSTEM"), built in phases, each committed on its own: 2 featured image, 3 editor tabs (Content | Featured Image | SEO | Social Preview | Publishing), 4 `/admin/seo` settings + page overrides, 5 sitemap manager / redirects / structured data, 6 audit, 7 Search Console (setup state only: no OAuth without approval, no simulated numbers), 8 QA. Site-wide noindex and `robots.ts` stay until the owner authorizes launch; no page-level setting may override them.
- Phase 2 (migration `0012_featured_image.sql`, MUST be run in D1 before deploy): `blog_media` gains title, description, attribution, original_id (a crop points to the untouched original); `blog_posts` gains featured_caption, featured_focal_x/y (percent, used as CSS `object-position`). AVIF accepted (magic bytes + `ispe` size); server rejects images under 400 px wide or over 8000 px on a side (this check had been missing on upload until the new test found it).
- Editor: `app/admin/blog/[id]/edit/featured-image.tsx` (drag-and-drop, upload with progress via XHR, library, replace, remove, focal point click, alt/caption on the article, title/description/attribution saved to the library, SEO warning when alt is empty, 3 live previews) and `cropper.tsx` (16:9 1600x900, 1.91:1 1200x628 = social image, square 1080; zoom, drag, arrow keys; output WebP/JPEG made in the BROWSER, uploaded as a new library item with `original_id`; repeat crops start from the original). No server-side resizing or srcset (still no free option on Workers).
- Public: cards, featured slot and article hero apply the focal point; article shows caption + attribution as a figcaption. No image = existing brand gradient on cards, no hero block.
- Tests: `tests/featured-image-e2e.test.ts`; other blog e2e tests now apply migration 0012 too. Not browser-tested: the editor panel and cropper behind Access.

## 51. SEO brief Phase 3: editor tabs (Nov 2026)

- Migration `0013_blog_seo.sql` (MUST be run in D1 before deploy): `blog_posts.secondary_keywords`.
- Blog editor sidebar is now five tabs: Content (excerpt, related), Featured Image, SEO (search preview, on-page score, SEO title/meta/slug with "Suggest", focus + secondary keywords, canonical, noindex, checks, internal link ideas), Social (Facebook/LinkedIn and X previews, social title/description/image, fallback to featured image), Publishing (author, category, tags, dates, schedule, status actions). Top bar Preview/Save/Publish unchanged.
- `lib/blog/seo.ts`: `onPageScore` (share of passing checks, labelled "not a ranking prediction"), deterministic `suggestSeoTitle/suggestMeta/suggestSlug`; Suggest buttons ask before replacing existing text. Changing a live slug shows a warning (redirect manager comes in Phase 5).
- Not browser-tested (behind Access).

## 52. SEO brief Phase 4: dashboard, defaults, article SEO list (Nov 2026)

- Migration `0014_seo_settings.sql` (MUST be run in D1 before deploy; 1 statement): key/value table `seo_settings`.
- Admin (admins only, sidebar "SEO"): `/admin/seo` (real counts over published blog articles: missing meta/title/focus/image/alt, length outliers, noindex; links to the filtered list), `/admin/seo/pages` (SEO fields of every article, `?missing=` filters, links to the editor), `/admin/seo/settings` (site name, default description, default social image, X handle; https/path URLs only).
- `lib/seo/settings.ts` `getSeoSettings` never throws (defaults before 0014). Defaults are applied ONLY in `app/blog/[slug]` metadata (description and social image fallback, OG site name, twitter:site). The article's own fields always win. Home/Pricing/etc. are NOT affected: editable SEO on static pages would force a D1 read per visit (Workers CPU / Paid-plan question, owner decision pending). Site-wide noindex cannot be changed from here.
- Test: `tests/seo-settings-e2e.test.ts`. Not built yet: sitemap manager, redirects, structured data manager (Phase 5), audit (6), Search Console setup (7).

## 53. SEO brief Phase 5: redirects, sitemap manager, structured data (Nov 2026)

- Migration `0015_seo_redirects_sitemap.sql` (MUST be run in D1 before deploy; 3 statements): `seo_redirects` (+ unique index on from_path), `seo_sitemap_exclusions`.
- Redirects: `/admin/seo/redirects` (add, pause, delete; 301/302; internal path or https URL). Rules in `lib/seo/redirect-rules.ts` (pure, tested): loop and chain detection, duplicate "from" refused, admin/api/_next/media/checkout/download/opt-out paths protected. Every change rewrites KV key `seo:redirects:v1` (binding `CACHE`); `custom-worker.ts` `managedRedirect` reads ONLY that KV value (30 s in-isolate memo), never D1; a KV failure means no redirects. Takes effect within ~1 minute. Query string kept for internal targets. The blog editor offers "Create a 301 redirect" (admins) when a live article's slug is changed.
- Sitemap: `/admin/seo/sitemap` shows section counts of the real `sitemap.ts` (one system, extended) and lets the admin exclude/re-include paths (`excludedSitemapPaths` filters the output; never throws before 0015).
- Structured data: `/admin/seo/structured-data` is a read-only inventory of what the code emits (Organization, BlogPosting, Person/ProfilePage, FAQPage, HowTo, BreadcrumbList, WebSite/WebPage). Editing the layout Organization block is NOT built (would add a D1 read to every page). No ratings or prices are published.
- Tests: `tests/redirect-rules.test.ts`, redirects/sitemap cases in `tests/seo-settings-e2e.test.ts`. The Worker redirect hook itself is not simulated.

## 54. SEO brief Phases 6-8: audit, Search Console setup, wrap-up (Nov 2026)

- No new migration. `/admin/seo/audit`: the browser calls `auditBatchAction(offset)` repeatedly; the server builds every URL from the site's OWN sitemap paths on the fixed origin `SITE_URL` (the client sends only a number), `redirect: "manual"`, 8 s timeout, 15 pages per batch (stays under the Workers subrequest limit). `lib/seo/audit.ts` `analyzeHtml` (pure, tested) separates VERIFIED issues (HTTP error/redirect, missing title/meta/canonical/H1, multiple H1/canonical, images without alt, invalid or duplicate JSON-LD) from TIPS (title/meta length, thin text). Results are not stored. The site-wide noindex is not reported.
- `/admin/seo/search-console`: setup steps only, status "Not connected". No OAuth, no Google API, no numbers. Connecting needs the owner's approval.
- Whole brief status: Phases 1-8 done. Migrations 0013, 0014, 0015. No new env vars. Not browser-tested: every `/admin/seo/*` screen and the editor tabs (behind Access); the Worker redirect hook and the audit's self-fetch on the live Worker. Open owner decisions: editable SEO for static pages (needs per-visit D1 reads), editable layout Organization JSON-LD, Search Console OAuth.
