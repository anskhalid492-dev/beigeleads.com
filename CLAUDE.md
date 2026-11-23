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

## 55. Settings Center, phases 1-3 foundation (Nov 2026)

- Brief: "COMPLETE SYSTEM SETTINGS MANAGEMENT CENTER" (16 sections), built in phases, each committed on its own. Owner decisions (19 Nov 2026): public pages read settings through a CACHED endpoint (no per-visit D1 read, pages stay static); build order = foundation first.
- Migration `0016_system_settings.sql` (MUST be run in D1 before deploy; 2 statements): `system_settings` (key/value) and `settings_audit_log` (append-only; no update/delete code path). `seo_settings` (section 52) stays the SEO store: the SEO Defaults section links to `/admin/seo/settings` (no duplicate tables). General "Website name" is the base for `getSeoSettings.siteName`; an SEO-specific value still wins.
- `lib/settings/registry.ts` = typed definitions (key, category, label, description, type, default, max, `usedBy`) + `parseValue` validation; a setting is added ONLY when something real consumes it. `lib/settings/service.ts`: `loadCategory` (defaults + saved, never throws), `saveCategory` (validate all, optimistic `stamp` conflict check, per-change audit rows, clears KV `settings:public:v1`), `getPublicSettings` (KV 60 s), `listAudit`. Precedence: code default < database setting; infrastructure (env vars, wallets, SITE_URL) is never overridable from here.
- Live now: General (website name, announcement banner on/off/text/link). `AnnouncementBanner` (client, in `app/layout.tsx`) fetches `/api/public-settings` after load, dismissible per session, link must be a path or https. Admin: `/admin/settings` (section cards + global search + read-only deployment status), `/admin/settings/general`, `/admin/settings/audit` (search, section/date filters, pagination, CSV export of the last 1000 changes with formula-prefix neutralising). Generic form: `components/admin/settings-form.tsx` (switches, unsaved indicator, cancel, beforeunload guard, conflict message, success only after the server confirms).
- Deliberately NOT editable here: `NOTIFY_EMAIL` (a hijacked settings login must not redirect payment alerts), wallets, payment amounts, policies, Turnstile/rate limits.
- Sections still "Coming soon": Branding, Navigation, Business, Email, Forms, Blog, Payments status, Orders & Delivery, Integrations, Security, Privacy, Maintenance, Backup. Test: `tests/settings-e2e.test.ts`.

## 56. Settings Center: Email, Integrations, Security, Maintenance, Backup (Nov 2026)

- Owner chose (19 Nov 2026): Email & Notifications first, then read-only status pages; Branding, Navigation, Business, Forms, Blog, Payments/Orders settings stay "Coming soon" on purpose (wallets/delivery links already have protected screens; navigation editing risks legal links; Turnstile/rate limits are never switchable).
- No new migration (uses 0016). Email: settings `senderName`, `replyTo`, `extraRecipients` (max 5), toggles `notifySample|Contact|Category|Delivered` (`lib/settings/email.ts`, KV 60 s `settings:email:v1`, cleared on save). `lib/forms/email.ts`: sender ADDRESS still comes from `EMAIL_FROM` (verified domain); only the display name is editable; `reply_to` added; `ownerRecipients`/`notifyOwner(…, event)` apply toggles and extras. Payment, delivery-failure, wallet, order-decision, opt-out and custom-list alerts are ALWAYS on and go to `NOTIFY_EMAIL` (+ extras for custom-list only). `NOTIFY_EMAIL` stays env-only. Test email (`sendTestEmailAction`): only to the signed-in admin's own address, 5/hour, reports Resend's real answer, logged in the audit table. Customer-confirmation toggles and template previews are NOT built (success states depend on those emails).
- `lib/settings/health.ts`: real checks for D1 (also lists tables whose migration is missing), KV (write/read/delete), R2 (list), Resend (GET /domains; a send-only key is reported as such), Turnstile (siteverify with a dummy token distinguishes a bad secret), Access (certs URL). Results stored in KV `health:last:<id>` (30 days) for "last checked". Rate limit 30 runs/hour. Cron heartbeat: `custom-worker.ts` writes `health:cron:minute` every 5th minute and `health:cron:sweep` every 15 min (KV free plan = 1000 writes/day).
- Pages (admin only, read-only except tests): `/admin/settings/integrations`, `/security` (identity, layers, recent settings/wallet/order changes; failed sign-ins are NOT recorded), `/maintenance` (version, flags, cron heartbeats, checks, "Refresh caches and sitemap"), `/backup` (states honestly: D1 Time Travel is a Cloudflare feature we do not control; NO automatic export job exists; R2 files have no backup; no last-verified backup). No uptime or performance numbers, no error log (none is stored).
- Not browser-tested (behind Access). Tests: email + health cases in `tests/settings-e2e.test.ts`.

## 57. Website pages SEO editor (Nov 2026)

- Owner request (19 Nov 2026): edit the SEO title and meta description of ALL web pages from the admin and have it go live. Migration `0017_seo_page_overrides.sql` (MUST be run in D1 before deploy; 1 statement): `seo_page_overrides` (path PK, seo_title, meta_description, og_title, og_description, og_image, canonical_url).
- Pages stay STATIC. Overrides are applied at the edge: saving writes D1 then rebuilds KV `seo:pages:v1`; `custom-worker.ts` `withPageSeo` reads that ONE value (30 s in-isolate memo) and rewrites the HTML head of the matching GET page (`lib/seo/page-rewrite.ts`, pure, tested): title, meta description, og/twitter title/description/image, canonical. Empty fields change nothing; social title/description follow the SEO title/description unless set. Goes live in about a minute. Any failure serves the page unchanged. `/blog/<slug>` is excluded (own SEO tab). robots/noindex are NEVER touched (site-wide noindex stays).
- Page list = `lib/seo/page-registry.ts` (main pages, list categories, products, solutions, comparisons, help, legal). Country/city pages are not built and not listed. `/pricing`, `/about`, `/bundles`, `/creators`, `/case-studies` are stub pages from `app/[page]` (they keep `noindex` robots).
- Admin: `/admin/seo/site-pages` (search, group filter, "edited only", status badges), `/admin/seo/site-pages/edit?path=` (search preview, live title/description read from the page itself, counters, social/canonical section, save, cancel, reset). `/admin/seo` shows the main pages with Edit links. Only paths in the registry can be saved or fetched (no arbitrary URL). Each save is logged in `settings_audit_log` (category seo). Test: `tests/page-rewrite.test.ts` + override case in `tests/seo-settings-e2e.test.ts`.
- Limits: the full title is used as typed (the " | BeigeLeads" suffix is not added); a code change to a page's metadata is shadowed by its override until reset; the rewrite is not browser/Worker tested yet (check one page with view-source after deploy).

## 58. Brand identity and Media Kit (Nov 2026)

- Owner approved (19 Nov 2026) the refined "Concept A" B monogram as the PRIMARY logo: custom B in a forest-900 rounded tile, top-left corner cut like a card tag, counters = dot (lead) above a bar (record), single-colour forest-900 wordmark (Bricolage Grotesque, outlined, no font needed). Reversed version = sand-50 tile + sand-50 wordmark. Existing colour tokens only; purple is never part of the logo.
- Source of truth: `scripts/brand/{build.py,render.py,zips.sh,wordmark.py}` generate everything in `public/brand/` (svg, png, favicon, social incl. OG 1200x630, email, guidelines PDF, 4 ZIPs) and `lib/media-kit/manifest.ts` (real file sizes). Re-run in that order after any logo change. `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`, `app/manifest.ts` are copies of the favicon set. Header/footer use `components/shared/brand-logo.tsx`.
- `/media-kit` (`app/media-kit`, copy in `lib/media-kit/content.ts`): logos with SVG/PNG downloads, colours with copy-to-clipboard, typography, do/don't, download center, contact CTA. Still noindex like the rest of the site; listed in the SEO page registry and footer Resources.
- NOT built yet: `/admin/media-kit` (editable intro/assets; needs migration 0018 and an owner go-ahead). The 16 px favicon loses the dot/bar detail (the B shape still reads).

## 59. /admin/media-kit (Nov 2026)

- Migration `0018_media_kit.sql` (MUST be run in D1; 2 statements): `media_kit_content` (key, draft, published) and `media_kit_files` (extra downloads, files in R2 `LISTS` under `media-kit/`, hidden until published).
- `lib/media-kit/{fields,store,format,content,manifest}.ts`. Editable: headline, intro, About, contact text (draft -> preview at `/admin/media-kit/preview` -> publish; discard returns to published). Public `/media-kit` is dynamic and reads ONE KV value `mediakit:pub:v1` (5 min TTL, cleared on every publish/file change), falling back to code defaults on any error, so it works before the migration.
- Extra files: PDF/ZIP/PNG/JPEG/WebP/SVG, 10 MB, type from bytes, SVG with scripts refused, served by `/media-kit/download/[id]` only when published, always as an attachment with a sandbox CSP. Upload API `/api/admin/media-kit` (admin + same-origin). Changes are logged in `settings_audit_log` (category media-kit).
- Official logos, favicons, colours and the four ZIPs are NOT editable here (generated by `scripts/brand`; a logo change is a code change). Test: `tests/media-kit-e2e.test.ts`. Not browser-tested: the admin screens behind Access.

## 60. /about page (Nov 2026)

- `/about` is a real editorial page (`app/about/page.tsx`, `components/about/about-page.tsx`); the `about` stub entry in `app/[page]` was removed. All words live in `lib/about-content.ts`: chronological founder story in plain third-person prose (hero, six chapters, "Pay once. Own the list." band, vision, closing CTA). AboutPage JSON-LD, breadcrumbs, `.reveal` scroll animation (CSS, off under reduced motion), footer CTA band hidden on /about. Still noindex like the rest of the site.
- Honesty rule for this page: ONLY facts from the owner's own founder story (shared 19 Nov 2026: left college, 2020 client acquisition, failures, agencies, 30M+ cold emails, outbound chain) and from sections 21/25/33 (sourcing, SMTP checks, 60-day re-verification, policies, CSV/Excel/TXT, no account). No invented dates, quotes, launch events or customers. MunchReach is deliberately not named (owner decision). Founder name is "Anus" (confirmed). Owner facts: dropped out, outbound since 2020, 6+ years, 50M+ emails (replaces the earlier 30M+), several failed businesses, built BeigeLeads entirely himself. Founder photo is `public/about/founder-anus.webp` (owner's photo, background keyed to forest-500). Origin moment intentionally not stated (owner decision). No photo exists: `FOUNDER.photo` null shows a logo card.

## 61. Help Center redesign, Phase A (Nov 2026)

- Owner decisions (19 Nov 2026): articles will move to D1 + R2 like the blog (Phase B, CMS with draft/publish/ordering/SEO, analytics, search tracking: NOT built yet); work is split Phase A (design) then Phase B (CMS); anonymous feedback and (later) anonymous search-text tracking are allowed (no IP, email or cookie stored; privacy policy line added for feedback; add one for search tracking in Phase B).
- Phase A (URLs unchanged: `/help-center`, `/help/<category>`, `/help/<category>/<article>`): compact home (hero search with "/" shortcut, 9 topic cards, "Getting started" editorial picks, "Common questions" accordion, contact options), category pages with groups (`lib/help/groups.ts`), in-topic filter, counts and reading time, three-column article page (sticky topic nav, content, sticky TOC with active highlight + related), breadcrumbs, reading time, last updated, TechArticle/FAQPage/CollectionPage JSON-LD, "Was this article helpful?" (`components/help/feedback.tsx` -> `POST /api/help/feedback`, same-origin, Zod, KV rate limit 30/h, no Turnstile because it is a one-click vote, table `help_feedback`, migration `0019_help_feedback.sql`, MUST be run in D1; 2 statements).
- New article block types in `lib/help/types.ts`: callout (tip/info/warning), table, img, faq (rendered in `components/help/rich.tsx`). FAQ blocks added only to 3 articles, from facts already stated in the help text.
- Honesty: "Getting started" and "Common questions" are editorial picks. "Popular"/"Most searched" labels are NOT used until real analytics exist (Phase B). Article text was not mass-rewritten: it already comes from our policies; larger rewrites should be done by the owner in the CMS.
- Tests: `tests/help-structure.test.ts`, `tests/help-feedback-e2e.test.ts`. Not browser-tested end to end: feedback POST against the live D1.

## 62. Contact page redesign (Nov 2026)

- `/contact` (`app/contact/page.tsx`, `components/contact/{form,sections}.tsx`): hero "Let's Talk About What You Need." + smart form (full name, business email, inquiry type, order number only for Order Support / Payment Issue, subject, message), 4 support cards (General, Order & Payment prefill `?type=`, Custom Data -> `/custom-list`, Help Center), trust strip. No response-time promise, no invented contact details. ContactPage JSON-LD + breadcrumbs; still noindex; footer CTA band hidden here; SEO Manager registry entry `/contact` unchanged.
- Backend: migration `0020_contact_inquiries.sql` (MUST be run in D1 before deploy; 3 statements: CREATE TABLE + 2 unique indexes). New table `contact_inquiries`; old `contact_messages` stays, shown read-only in admin. `lib/contact/{types,submit}.ts`: reference `CT-XXXXXXXX`, dedupe key (email + type + subject + start of message, UNIQUE) = repeats create no row/email, saved first then confirmation email (real status sent/failed/not_configured, via Email & Notifications sender/reply-to) and owner alert (`notifyContact` toggle + extra recipients; stored sent/failed/skipped). `POST /api/contact` uses `handleForm` (honeypot, Turnstile, KV rate limit 5/h/IP). Old `contactSchema` removed.
- Admin `/admin/contact-inquiries` (sidebar "Contact Inquiries"): search, status/type/email filters, pagination, details, status (New / In progress / Resolved / Closed), internal note (never shown to sender), retry confirmation email, reply-by-mailto.
- Tests: `tests/contact-e2e.test.ts` (local D1). Browser-checked at 1280 and 375 px (no horizontal scroll, inline validation). NOT tested: real Turnstile/Resend delivery, admin screen behind Access.

## 63. Help Center Phase B: CMS and analytics (Nov 2026)

- Migration `0021_help_cms.sql` (MUST be run in D1 before deploy; 4 statements, one CREATE TABLE each): `help_categories`, `help_articles` (body/keywords/related stored as JSON text in D1, images through the existing media library), `help_search_log`, `help_views`. `help_feedback` (0019) is unchanged.
- Store: `lib/help/store.ts`. `loadHelp(env)` = ONE KV value `help:data:v1` (60 s), published content only; falls back to the built-in code content (`codeData()`) while the tables are missing or EMPTY. Once any row exists the database is the single source of truth (a deleted article never comes back by itself). Admin "Import" (`importBuiltIn`) copies the 54 built-in articles + 9 topics, idempotent, never overwrites. `lib/help/data.ts` = pure helpers (getArticle, groupedArticles by the article's `group`, featured/common by rank); `lib/help/blocks.ts` `cleanBlocks` = allow-list applied on every save AND every read (images only `/media/...` or https, button links path/https).
- Public pages `/help-center`, `/help/<topic>`, `/help/<topic>/<article>` are now `force-dynamic` and read `getHelp()`; `custom-worker.ts` edge-caches them for 60 s like the blog (a publish can take up to a minute). Article SEO title / meta description / noindex come from the CMS; noindex can only be ADDED (site-wide noindex stays). "Getting started" and "Common questions" sections are driven by `featured` / `common` ranks and hide when empty. Sitemap skips noindex articles. SEO Manager page registry and blog link ideas still list the built-in articles only (admin-added ones use their own SEO fields).
- Admin (admins only, sidebar "Help Center"): `/admin/help` (counts, no-result searches, top searches, most viewed, lowest rated, all feedback), `/admin/help/articles` (search, topic/status filters, publish/unpublish, up/down order, two-step delete, import), `/admin/help/articles/[id]` (block editor: heading, paragraph, bullets, numbered steps, callout, note, table, image upload, FAQ; placement, group, getting-started/common flags, related, button, SEO, last-updated date; stale-tab version check; a PUBLISHED article keeps its topic and slug), `/preview` (saved version), `/admin/help/categories` (add, edit, hide, order; topics with articles cannot be deleted). Changes are logged in `settings_audit_log` (category help).
- Analytics are anonymous: `POST /api/help/search` (words + match count; refuses emails/long numbers; 90-day purge in the 15-minute cron; rate limit 60/h) and `POST /api/help/view` (one per session per article, per-day counter; rate limit 120/h). Privacy policy line added (`LEGAL_UPDATED` 2026-11-19). "Popular / Most searched" labels are still NOT shown to visitors (admin only).
- Not built: revisions/autosave for help articles, drag-and-drop ordering (arrows), rich-text editor (block editor on purpose: exact same blocks the public page renders), scheduled publishing, per-article image library picker. Tests: `tests/help-cms-e2e.test.ts` (local D1 + KV). Not browser-tested: the admin screens behind Access; public pages were checked on the built-in fallback only.

- Hero update (19 Nov 2026, owner copy): H1 "Everything You Need to Know. All in One Place.", subheading "Find clear answers, helpful guides, and step-by-step instructions to make the most of BeigeLeads." (no article count), search placeholder "Search for answers...", a small "/" key badge replaces the placeholder hint (the "/" shortcut still works). Same rounded gradient hero, two soft blurred glows, more spacing. Checked at 1280, 768 and 375 px (no horizontal scroll).

## 64. System Emails Manager, Phase 1 (Nov 2026)

- Owner brief "SYSTEM EMAILS MANAGER, VISUAL DESIGNER & PERSONALIZED EMAIL COPYWRITER", built in 3 phases (owner decision 19 Nov 2026). Phase 1 = templates, copy, variables, preview, test send, wiring of the existing customer emails, delivery logs. Phase 2 (NOT built) = drag-and-drop visual designer, editable branding settings, duplicate/create templates. Phase 3 (NOT built) = Resend webhooks (delivered/bounced; needs a webhook + new secret in the Cloudflare dashboard), retries by status, new triggers.
- Migration `0022_system_emails.sql` (MUST be run in D1 before deploy; 4 statements): `email_templates` (key, draft_json, published_json, published_version), `email_template_versions` (unique template_key+version), `email_delivery_logs`, index on created_at. Before it exists everything still sends with the built-in versions; nothing is logged; the editor is locked.
- Code = source of truth until an admin publishes: `lib/system-emails/defaults.ts` holds all 21 templates (13 customer A-M, 8 admin alerts N) with the brief's subjects. Content = subject, preheader, heading, blocks (paragraph, list, details table, note), one button, sign-off; no HTML accepted. `variables.ts` registry (+ system variables), `render.ts` (pure: HTML + plain text, escaping, `**bold**`, only our own https://beigeleads.com URLs auto-link, https/path-only buttons, a missing first name removes ", {{first_name}}" instead of printing "there", rows with empty values are dropped, forced-dark option for previews), `store.ts` (draft/publish/versions/restore, `checkContent` = publish gate: unknown or unavailable variables, required variables such as `{{download_url}}`, bad links), `subjects.ts` (3 deterministic suggestions, no AI, no open-rate claims), `mail.ts` `systemMail`, `brand.ts` (existing tokens only, approved logo files in `public/brand/png`).
- Sending: `lib/forms/email.ts` `Mail` now accepts `html`, `templateKey`, `reference`, `source`; `sendEmailDetailed` forwards html, captures Resend's message id and writes `email_delivery_logs` (recipient MASKED, no body, no key) only when `templateKey` is set. Plain callers are unchanged.
- Wired (all fall back to the previous plain-text email if the template is missing, a required value is empty, a link is unsafe, or rendering throws; trigger/idempotency logic untouched): delivery (`product_delivery`, only when the link exists, one row per order), sample confirmation, contact confirmation, custom-list confirmation. NOT connected (written, shown as "Not connected" with the reason): order confirmation, payment received/pending/failed, sample delivery, custom quote, category request, delivery issue, refund/replacement update, and ALL 8 admin alerts (current owner alerts still use their built-in text; wiring them is a later decision; they must stay un-switchable for payment and delivery failures).
- Admin `/admin/system-emails` (admins only; sidebar "System Emails"): stats from real logs, tabs All/Drafts/Published (search, audience/connection filters, sort), Email activity (filter, pagination, honest "Accepted" = Resend took it; delivered/bounced are not shown until webhooks exist), Automation triggers (real vs not connected), Branding (read-only), Test emails (to the signed-in admin's own address only, 10/hour, [TEST] subject + banner, logged as source test). `/admin/system-emails/[key]`: editor with live preview (desktop, mobile, plain text, inbox, dark appearance), variable picker, used-variable list (required/optional), subject suggestions, save draft / publish (two-step) / discard, version list with restore-to-draft (version 0 = built-in), publish blocked while errors exist. Publishing, restoring and discarding are logged in `settings_audit_log` (category system-emails).
- Tests: `tests/system-emails.test.ts` (copy completeness, brand colours, escaping, fallbacks, link safety, publish gate, suggestions), `tests/system-emails-e2e.test.ts` (local D1: draft vs live, versions, fallbacks, logs masked). Email HTML was screenshot-checked at 700 and 375 px and dark. NOT tested: real Resend delivery and inbox rendering in Gmail/Outlook, the admin screens behind Access, drag-and-drop (not built).

## 65. System Emails Manager, Phase 2: visual designer, branding, copies (Nov 2026)

- Migration `0023_system_emails_designer.sql` (MUST be run in D1 before deploy; 3 statements, one per message in D1 Studio): `ALTER TABLE email_templates ADD COLUMN name`, `ADD COLUMN base_key`, `CREATE TABLE email_branding` (one JSON row, key `main`). Before it exists everything keeps working with defaults; Duplicate and Save branding are disabled/refused.
- Content model extended (backward compatible, Phase 1 content is still valid): new blocks heading, image, button, divider, spacer, columns, social, support, logo, footnote, each with an optional `style` of brand-safe PRESETS only (align, size, bold, tone none/soft/highlight/dark, radius 0/8/12/20, padding). No free colours or sizes exist, so every email stays inside the palette. "Order summary", "Product details" and "Download button" in the library are presets of the details table / button blocks that use only variables the template's event can supply.
- `render.ts`: new blocks, `Branding` option, mobile stacking for columns (`.col`), dark-mode rules, buttons through one `buttonHtml`. Images accept only https or `/media/...` (site path); social links only https; any empty/unsafe link makes `checkContent` fail ("A button, image or link is empty or unsafe"), so a bad link can never be published. Missing alt text is a warning. The delivery email still must link `{{download_url}}` (CTA or any button block).
- Shared branding (`lib/system-emails/branding.ts`, tab Branding in `/admin/system-emails`): logo height, card corner radius, main button colour (purple or forest), button radius, support email (also supplies `{{support_email}}`), extra footer line, up to 6 https social links, live preview incl. dark. Colours are fixed on purpose. Logo files stay the approved ones in `public/brand/png` (a logo change = a code/brand-folder change that reaches every email).
- Designer `/admin/system-emails/[key]/design` (admins; `components` in `app/admin/system-emails/[key]/design/{designer,blocks}`): left block library (drag or click) + variable picker, centre canvas (inline plain-text editing, drag handle reordering, drop indicator, selection ring), right properties panel (block-specific controls), undo/redo (toolbar + Ctrl/Cmd+Z outside text fields, typing coalesced), save draft, exact server Preview modal (desktop/mobile/plain text/dark), send test, two-step publish. The canvas is an EDITING view (shows `{{variables}}` and raw `**`); the Preview modal is the exact email. Browser-checked locally with a fixture page (add by click, drag from library, inline edit, undo/redo, tone/alignment, variable insert); NOT checked: real saves/previews through the server actions behind Access.
- Duplicate: `Duplicate` button copies a template's live version into the admin's own copy (`custom_xxxxxxxx`, max 40). Copies are never connected to an event (`connection: not_connected`, no required variables), can be edited, published, test-sent and deleted; the original is untouched. Delete removes only copies.
- Tests: `tests/system-emails-designer.test.ts` (all library blocks validate/render, palette-only colours, unsafe links/images rejected, escaping in new blocks, branding applied), copies + branding cases in `tests/system-emails-e2e.test.ts` (now applies 0022-0023).
- Still NOT built: Resend webhooks/delivered-bounced status and new triggers (Phase 3), wiring of the admin alerts and the not-connected customer emails, image upload from inside the designer (use Admin > Media and paste the `/media/...` address), real inbox rendering tests (Gmail/Outlook).

## 66. System Emails Manager, Phase 3: webhooks, status, triggers (Nov 2026)

- Migration `0024_email_webhooks.sql` (MUST be run in D1 before deploy; 5 statements, one per message in D1 Studio): `email_delivery_logs` + `delivery_status`, `delivery_detail`, `status_at` (integer epoch), index on `provider_id`, table `email_webhook_events` (id = svix-id, idempotency). Before it exists the Activity tab still works and shows "Migration 0024 not applied".
- Webhook: `POST /api/webhooks/resend` (`app/api/webhooks/resend/route.ts`, `lib/system-emails/webhook.ts`). Svix signature (HMAC-SHA256 of `id.timestamp.body`, 5 min tolerance, constant-time compare) with secret `RESEND_WEBHOOK_SECRET` (`whsec_...`, set ONLY in the Cloudflare dashboard). No secret = 503, bad signature = 401. Events: sent, delivered, delivery_delayed, bounced, complained, failed. A duplicate svix-id is ignored; a status never moves backwards (rank sent < delayed < delivered < failed < bounced < complained); events are matched to log rows by Resend's email id. bounced/complained/failed email the owner ONCE per log row (`notifyOwner`, no recipient address, only template + reference). Opens/clicks are not tracked.
- Retention (15-minute cron `purgeEmailLogs`): webhook events 30 days, delivery logs 180 days.
- New real triggers via `lib/system-emails/triggers.ts` `sendOnce` (branded template ONLY, no plain twin; once per template+reference checked in the delivery log, max 3 tries, skipped when the log table is missing or a required value is empty): `payment_received` (hook in `deliverOrder`, reference = order id, never blocks delivery), `category_request_received` (category form, reference = hash of email+category), `sample_delivery` (admin `/admin/sample-requests` "Email sample to buyer": https link, once per request unless "send again" is ticked, marks the request Fulfilled). These three are now "Connected" in `defaults.ts`.
- Still NOT connected: order_confirmation, payment_pending, payment_failed, custom_quote, delivery_issue, refund_update and all 8 admin alerts. Retries of failed template sends stay as described (delivery cron retries; others 3 tries max, only by new events).
- Admin Activity tab: status badges (Accepted / Delivered / Delayed / Bounced / Marked as spam / Failed), filters, 30-day counts, webhook status box (secret set, migration, last report time). Test: `tests/system-emails-webhook.test.ts`. NOT tested: real Resend webhook delivery (needs the endpoint added in Resend + the secret).

## 67. Popup campaigns, Phase 1 of 3 (Nov 2026)

- Owner brief "Full-Funnel Behavioral Popup System", built in 3 phases (owner decision 19 Nov 2026): 1 = engine, storage, 12 draft campaigns, formats, minimal admin; 2 = full `/admin/popups` editor (every headline/CTA/rule editable, live desktop/mobile preview, drag-and-drop builder, scheduling); 3 = analytics reports, A/B tests, funnel reports. Owner decisions: visitor state ONLY in browser `localStorage` (key `bl-visitor-v1`: counts, flags, timestamps; no cookie, no IP, no account); analytics = own anonymous events in D1, NO revenue attribution.
- Migration `0025_popups.sql` (MUST be run in D1 before deploy; 3 statements, one per message): `popup_campaigns` (content as validated JSON), `popup_events` (campaign_id, event, page_type, time: nothing else), index.
- `lib/popups/*`: `types.ts` (zod; links must be a site path or https, `{product_url}`/`{product_slug}`/`{custom_href}` tokens), `engine.ts` (pure `whyNot`/`pickCampaign`: live only; one popup per page view; 60 s gap; impression cap, cooldown, dismissal days, converted = never again; never at load without a trigger; never on checkout pages unless it waits for a confirmed purchase; funnel stage from real actions tofu < mofu < bofu < post so earlier stages stop once passed), `defaults.ts` (12 campaigns, all DRAFT, no numbers/prices/urgency, tested), `store.ts` (list, `livePopups` KV `popups:pub:v1` 60 s, import drafts idempotent, set status, anonymous events, 90-day purge in the 15-min cron).
- Browser: `components/popups/host.tsx` (in `app/layout.tsx`, skipped in /admin; loads `/api/popups` 1.5 s after load; empty list while all drafts; no popup while a form field is focused; Do Not Track / Global Privacy Control = no counters sent), `popup-view.tsx` (modal, card, slide, sheet, nudge, bar; mobile always a bottom sheet; focus trap + Escape for modal; reduced motion respected), `blocks.tsx` (industry/place picker, steps, masked sample from `lib/sample-data.ts` labelled fictional, matcher, checkout facts, help links, after-purchase, guides, related). Real events come from the site: `bl:search-noresults` (home co-pilot), `bl:sample-requested` (sample form success), `bl:purchased` (checkout status poll says paid).
- Admin `/admin/popups` (sidebar "Popups"): import the 12 drafts, set live / pause / archive / back to draft, 30-day counts (shown, clicked, closed). Changes logged in `settings_audit_log` (category popups). API: `GET /api/popups` (public, cached), `POST /api/popups/event` (same-origin, KV rate limit 120/h).
- Honest deviations from the brief: popup 10 appears when the SERVER says the order is paid (the site has no "file delivered" status the page can read), and its CTA is "Where Is My Delivery Email?" (there is no download page; delivery is an emailed link, section 33); the audience picker sends to a list page or to the custom list builder with the choice prefilled (country/city pages are not built); "Revenue" and statistical-significance claims are not shown.
- Privacy policy does not mention popup counters or localStorage yet (needs the owner's text before launch). Tests: `tests/popups.test.ts`, `tests/popups-e2e.test.ts`. Browser-checked (mocked live payload) at 1280 and 375 px; NOT checked: admin screen behind Access, real campaigns going live on production.

## 68. Guides Library, Phase 1 of 2 (Nov 2026)

- Owner brief "Guides Library & CMS" (19 Nov 2026). Owner decisions: reuse the Blog CMS with a `kind` column (not a second CMS); deliver in 2 phases. Phase 1 = CMS + `/guides` + `/guides/[slug]` + footer link + first guide. Phase 2 (NOT built) = guide analytics/performance, "popular" topics from real data, downloadable resources.
- Migration `0026_guides.sql` (MUST be run in D1 before deploy; 3 statements, one per message): `blog_posts.kind` and `blog_categories.kind` (default `blog`) + index. Slugs stay unique across kinds; tags are shared; guides have their OWN categories. `lib/blog/kind.ts` (`Kind`, paths), every list/get/create function in `lib/blog/posts.ts` and `taxonomy.ts` takes a kind (default blog, so old behaviour is unchanged).
- Admin: `/admin/guides` (list, new, edit, preview, revisions, categories) are thin wrappers over the same shared views as `/admin/blog/*`. Guides are ADMIN-ONLY: blog editors cannot open, save, duplicate or preview guides. Sidebar has "Guides".
- Public: `/guides` (hero "Practical Guides for Smarter B2B Growth.", search, category chips with counts, featured = newest published guide because no "pinned" flag exists, latest grid, topics, pagination; no "popular" section until real data exists), `/guides/[slug]` (shared `ArticleView` with `guide` flag: breadcrumbs, TOC, progress, share, related guides, inline CTA; Article + FAQPage JSON-LD where FAQPage comes from `lib/blog/faq.ts`, which reads the "Frequently Asked Questions" H2 and its H3 questions, so structured data always matches visible text). Sitemap is kind-aware and lists `/guides`; footer Resources has "Guides"; SEO Manager registry lists `/guides`; edge cache (60 s) covers `/guides`.
- First guide: `lib/blog/guide-starters.ts` (`b2b-lead-generation-guide`, 14 sections, 8 FAQs, ~3,300 words, internal links all resolve). Created as a DRAFT guide from `/admin/blog/starters` (same mechanism as article starters; `kind: "guide"` starters get guide categories, and `brandImage` copies the approved OG brand image into the media library via the `ASSETS` binding). Publishing is the owner's click (or already done if the owner chose to). Outside facts (FTC CAN-SPAM covers B2B; 10 business days; Google sender guidelines 0.30% / 0.10%) were checked on 18 Nov 2026; the guide deliberately gives no penalty figure and no benchmark numbers. Re-check before reuse.
- Tests: `tests/guides-e2e.test.ts` (content structure, kind separation, starter creation incl. brand image); other blog e2e tests now apply 0026.
- Not browser-tested: `/admin/guides/*` screens (behind Access).

## 69. Shopping cart and multi-list orders (Nov 2026)

- Owner brief "Premium Shopping Cart" (19 Nov 2026). Owner decision: ONE order can hold several lists (one payment, one total). Migration `0027_cart_events.sql` (MUST be run in D1 before deploy; 2 statements): `cart_events` (event + item count only) and an index. Order tables needed no change (`order_items` was already one row per list).
- Browser cart: `lib/cart/client.ts` (localStorage key `bl-cart-v1`, ONLY `{slug, pkg}`; one line per product, adding a product again switches its package; max 10; falls back to memory when storage is blocked; syncs across tabs). The browser never sends or stores prices. `lib/cart/model.ts` (pure): `normalizeItems`, `priceCart` (catalog prices, `purchasable` + reason: product not on sale / checkout closed), `suggestFor` (real products only, same coverage first). `POST /api/cart/price` prices a cart on the server (same-origin, KV rate limit 300/h); `/cart` (noindex, header "Your Cart", empty state "Your Next Audience Starts Here.", line cards with package switch, masked fictional sample, remove, sticky summary, three reassurances, "You Might Also Need", mobile sticky total bar). Header has a cart icon with a count; product page packages have "Add to cart" (always allowed; checkout stays closed while products are placeholders/draft and the cart says so). No popups and no footer CTA on /cart or /checkout.
- Checkout: `/checkout/cart` (email + coin + Turnstile through `ApiForm`, which now accepts non-string `hidden` values) -> `POST /api/checkout` accepts `items[]` (or the old single `product`/`package`). `createOrder` re-prices EVERYTHING from the catalog with the same rules as the cart, rejects empty/duplicate/unknown/unsellable items, creates one order + N order_items + ONE payment attempt for the total. Duplicate protection: the same email + coin + cart within 10 minutes returns the still-open order (KV key `co:<hash>`, best effort: KV is eventually consistent, so two clicks in the same instant could in theory create two orders; the client disables the button while sending). Watcher confirmations now use `order.totalUsdCents`.
- Delivery of multi-list orders (`lib/delivery/deliver.ts`): sends nothing until EVERY list has a delivery link (owner alerted once, naming the missing lists), then ONE plain-text email with a link per list (the branded `product_delivery` template has a single link, so it is used only for single-list orders). `deliveries.url` stores the links joined by newlines. Checkout page lists every item; admin orders/delivery lists group items per order (paging counts orders). The cart empties a list only when the server says its order is paid.
- Analytics: `lib/cart/track.ts` sends anonymous `add_to_cart`, `remove_from_cart`, `view_cart` (once per session), `begin_checkout` (skipped on Global Privacy Control / Do Not Track); `POST /api/cart/event` (same-origin, 120/h); 90-day purge in the 15-minute cron. "Purchase completed" is NOT a client event: it comes from paid orders. `/admin/cart` (admins; sidebar "Cart funnel"): counts + funnel rates (view -> checkout started -> orders created -> paid real payments; test-network payments counted separately; "No data yet" instead of invented rates).
- Not built (on purpose): taxes and general discounts (only the partner code of section 87 exists; the summary says "BeigeLeads fees: None added"), per-line quantity (a list is bought once), account carts, abandoned-cart emails. The privacy policy does not yet mention the browser cart or the anonymous cart counters (needs the owner's text before launch).
- Tests: `tests/cart.test.ts` (pure rules, cross-sell, rates), `tests/cart-e2e.test.ts` (local D1: multi-item order, exact total, duplicate protection, rejections, delivery waits for every link and sends one email). Browser-checked at 1280 and 375 px (add, no duplicate, package switch, cross-sell, persistence after reload, remove, empty state, no horizontal scroll). NOT checked: real Turnstile + payment flow end to end, `/admin/cart` behind Access. `next.config.ts` honours `BL_DEV_PERSIST` to keep local dev state outside the project (writes inside it caused dev reload loops).

## 70. System Emails: manual send (Nov 2026)

- Owner request: for orders fulfilled by hand, send the same branded system email to ONE person with his own links and editable buttons. No migration.
- `/admin/system-emails/send` (admins; button on the System Emails dashboard and "Send by hand" per paid order in `/admin/delivery`, which prefills `?order=`). Pick a customer template (live version), recipient, optional first name/order/product/package/records, editable subject, heading, optional personal note, 1-5 buttons (label, https link, style). `lib/system-emails/manual.ts`: the template's own buttons/cta are replaced by the manual ones, `download_url` = first button, unsafe links/unknown or missing values are refused. Preview (iframe) is required; Send needs a "I checked" tick; 30 per hour per admin; logged in `email_delivery_logs` (masked) and `settings_audit_log`. Optional "mark order delivered" (paid orders only) writes the `deliveries` row as sent + `order_audit_log`, so the automatic delivery does not email again. No plain-text fallback.
- Test: `tests/system-emails-manual.test.ts`. Not browser-tested (behind Access).

## 71. Deep segmentation, Phase 1 of 3 (Nov 2026)

- Owner brief "Deep Segmentation, Programmatic SEO & Advanced Shop Catalog" (19 Nov 2026). Owner decisions: geography data comes from an admin CSV import (D1); B2C = a tab only, NO consumer products/pages and nothing sold (no privacy/consent decision yet; US-only data stands); 3 phases. Phase 1 = buttons, geography tables, country/state/city pages, sitemap, admin import. Phase 2 (NOT built) = `/shop`, Lists mega menu, admin segmentation CMS (featured categories, indexation toggles, bulk edit, countries). Phase 3 (NOT built) = programmatic SEO content engine, keyword-to-content workflow, the guide "How to Build a Targeted B2B Email List by Country, State, and City" as a draft.
- Migration `0028_geo.sql` (MUST be run in D1 before deploy; 4 statements, one per message): `geo_areas` (country_slug, parent_id, parent_key, level region|city, slug, name, indexable; unique per country+parent+slug) and `geo_coverage` (category_slug, area_id, record_count = REAL count entered by the owner; unique per category+area). Before it exists pages still render (static cities only, noindex).
- Country slug is now `united-states` (was `us`); `next.config.ts` 308-redirects `/lists/:category/us(/...)`. Product slugs (`dentists-us`) and country code `US` are unchanged. `lib/search.ts`, prefill and solutions updated.
- URLs: `/lists/<industry>/<country>`, `/<country>/<region-or-city>`, `/<country>/<region>/<city>` via `app/lists/[category]/[country]/[...geo]` (replaces `[city]`; the old static cities denver/chicago still resolve as noindex). All geography pages and `/lists/<industry>` are dynamic (D1) and edge-cached 60 s (`custom-worker.ts` now includes `/lists/`).
- `lib/geo/*`: `rules.ts` (slugify, `isIndexable` = real count above 0 and area indexable, CSV parser `region,city,category,records`), `store.ts` (resolve, coverage, region totals = own row or sum of cities, import/upsert that never deletes, sitemap paths), `content.ts` (title/H1/meta/intro/FAQs from real numbers only; "no inventory recorded" copy otherwise), `page-data.ts`. One template `components/geo/geo-page.tsx` (searchable place directory, siblings, other industries, FAQ + JSON-LD, breadcrumbs). Indexable pages carry NO robots tag (they inherit the site-wide noindex until launch); thin pages are `noindex, follow`. Sitemap lists only places with real inventory.
- Honesty: a place page is a VIEW of the national product (stated on the page); a city-only file is not sold. No counts shown unless imported.
- Buttons: package cards say "Get This Package" and the product hero link says "Get This List" (same behaviour: add to cart / go to packages). There was no "Purchase Now" in the code.
- Admin `/admin/geography` (sidebar "Geography"): CSV import with a "Check the file" dry run, places table with counts. Countries other than the United States need a catalog entry in code (admin country editing is Phase 2).
- Tests: `tests/geo.test.ts` (pure rules + local D1). Browser-checked locally (country, state, city, old URL redirect, noindex on thin pages); NOT checked: `/admin/geography` behind Access.

## 72. Deep segmentation, Phase 2 of 3 (Nov 2026)

- No new migration. `/shop` (`app/shop/page.tsx`, `components/shop/product-card.tsx`, pure logic in `lib/shop.ts`): search-first hero, B2B / B2C tabs, industry + country filters, sort (relevance = admin featured order, availability, price only once real prices exist), pagination (12), product cards (records and "from" price only when `placeholderData` is false), Popular / International databases (shown only when there is something to show), browse by industry, country and state/city (places with REAL inventory only, from `geo_coverage`), custom list CTA, FAQ. The page never states how many lists exist (owner rule): no result counts. B2C tab = "not available yet" + custom list request (owner decision; no consumer products or pages). Filtered, searched, sorted and B2C views are `noindex, follow` with canonical `/shop`; plain pagination keeps its own canonical. `/shop` is in the sitemap and the SEO page registry (which now also lists every `/lists/<industry>/<country>` page).
- Lists mega menu (`components/layout/header.tsx`): Popular Industries, Popular Countries, Audience Types (B2B, B2C, Industry Lists, Custom Lists), Explore All. The layout passes the catalog industries/countries to the (client) header; the header then reads `/api/public-settings` (KV cached 60 s) and orders/limits the menu by the admin's featured lists. Static fallback = every industry/country, so no flash and no D1 read per visit. `nav-data.ts` no longer has `megaMenu`. Mobile menu has "Shop all databases".
- Admin: Settings > Website & Navigation (`/admin/settings/navigation`, settings `featuredIndustries`, `featuredCountries`, comma-separated slugs, unknown slugs ignored, audited, cache cleared on save; `PublicSettings.featured`). `/admin/geography` gained per-place "Allowed / Blocked" indexing (also removes the place from sitemap.xml) and "Remove count" for a wrong import; every change is audited (category geography).
- Still NOT built (Phase 3 or later): admin CRUD for countries/subindustries/consumer categories (countries need a code entry; the catalog is static), per-place SEO title/description editing (geo paths are not in the SEO page registry yet), keyword workflow, programmatic content engine, the geography guide draft.
- Tests: `tests/shop.test.ts`. Browser-checked locally: `/shop` (desktop, 375 px no horizontal scroll), noindex/canonical for filtered views, mega menu hover, no-match state. NOT checked: admin screens behind Access.

## 73. Deep segmentation, Phase 3 of 3: keyword workflow, page SEO, geography guide (Nov 2026)

- Migration `0029_seo_workflow.sql` (MUST be run in D1 before deploy; 3 statements, one per message): `seo_keywords` (+ unique index on keyword) and `geo_page_content` (per geography path: seo_title, meta_description, intro, primary/secondary keywords).
- `/admin/seo/keywords` (admins; `lib/seo/keywords.ts`): keyword -> intent (deterministic rules, no AI) -> target (page/guide/product/none, site path only) -> status idea/briefed/drafting/published, industry/country/place links, notes, duplicate-target warning, "Brief" (outline + REAL internal links only, no numbers or claims). No search-volume data is stored or shown (none exists).
- `/admin/geography/pages` (+ `/edit?path=`): per-place SEO title, meta description, intro, keywords for pages with real inventory; `loadGeoPage` merges saved copy over the generated copy (empty field = generated copy). Warnings for length/keyword only; never touches robots/noindex.
- Guide draft `build-b2b-email-list-by-country-state-city` in `lib/blog/guide-starters-geo.ts` (created as a DRAFT from `/admin/blog/starters`; owner publishes). Worked examples are labelled hypothetical; no prices/percentages.
- Tests: `tests/seo-workflow.test.ts`, `tests/geo-guide.test.ts`. Not browser-tested: admin screens behind Access. Not built: admin CRUD for countries/subindustries, search-volume imports, automatic article generation.

## 74. Shop redesign + catalog admin (Nov 2026)

- Owner brief "Complete Premium Shop Page Redesign" (19 Nov 2026) + request for admin CRUD of countries, sub-industries, consumer categories. Owner decisions: D1 "safe" catalog (extras only; industries and the 3 products stay in code), rule kept (NO result counts, no list counts), contact-count/price filters only when real data exists. Privacy policy text for cart/cart counters/popup counters was written by the assistant on the owner's instruction (`LEGAL_UPDATED` unchanged 2026-11-19; cookies page has a "Local storage" section). Still not lawyer-reviewed.
- Migration `0030_catalog_extras.sql` (MUST be run in D1 before deploy; 3 statements, one per message): `catalog_countries`, `catalog_subindustries`, `catalog_consumer_categories`. `lib/catalog-extra.ts` (never throws before the migration): `loadCountries` = static + enabled admin countries, `findCountry`, validation + CRUD. Wired into geo pages/sitemap/import, keywords admin, shop. Admin `/admin/catalog` (sidebar "Catalog setup"): add/hide/delete countries (delete refused when places exist), sub-industries (shown on the shop only as niche chips that open the custom list builder, never as ready-made lists), consumer categories (planning only, hidden: the public B2C tab still says "not available yet" because no privacy/consent decision exists). Adding a country creates NO product, price or count and the page says data must be lawfully sourced (US-only today). Other pages still use the static `getCountries()` (header, home, popups, cart).
- Shop (`app/shop/page.tsx`): dark hero with combobox search (suggestions from real industries/countries/places/niches, recent searches in localStorage `bl-shop-recent-v1`), B2B/B2C selector, database illustration; catalog `components/shop/shop-catalog.tsx` = sticky sidebar (mobile drawer), multi-select industry/country, dependent state and city (only places with REAL recorded inventory), contact-count and price ranges, data fields and availability groups, each shown ONLY when the data can support it (e.g. no price filter while prices are placeholders); active chips, clear all, sort, instant results, URL kept in sync with `history.replaceState`, paginated with real prev/next links. "Dentists in Alabama" is interpreted to industry + country + state (`interpret` in `lib/shop.ts`) with a visible "We read your search as" line; typo tolerance. Pure engine `lib/shop.ts` (tested), server data `lib/shop-data.ts` (placeholder counts/prices are removed before reaching the browser).
- Cards (`components/shop/product-card.tsx`): "Get This List" -> product page packages (same purchase workflow) when the product is `live`, otherwise "View Details"; "Preview Sample" -> product `#sample` (id added). Geography explorer (`components/shop/geo-explorer.tsx`): country -> state -> city, breadcrumbs, search, links to the geography landing pages. Collections shown only with enough real data (Popular only above 6 products; International, City lists only when they exist). Not built: "Recently added" (no created date), bundles (none exist), sub-industry as product filter (products carry no sub-industry).
- Filtered/searched/B2C views are `noindex, follow` with canonical `/shop` (any of the new params). Tests: `tests/shop.test.ts` (rewritten), `tests/catalog-extra.test.ts`. Browser-checked locally at 1280 and 375 px (hero, filters, drawer, search, explorer drill-down, no horizontal scroll). NOT checked: `/admin/catalog` behind Access, keyboard/screen-reader walkthrough, Lighthouse.

## 75. /lists is the single catalog; /shop removed (Nov 2026) — supersedes the /shop parts of sections 72 and 74

- Owner decision (19 Nov 2026): `/shop` was rejected. `app/shop/*` and `components/shop/*` are deleted; `/shop` (and `/shop/*`) 308-redirect to `/lists` in `next.config.ts` (old `?category=` becomes `?industry=`, other params kept). No `/databases`. Existing `/lists/...` URLs unchanged.
- `app/lists/page.tsx` (dynamic): light compact hero (H1 "Find the Right Contacts. Own the List.", B2B/B2C tabs, combobox search, popular chips), trust strip, tabbed directory (Industries / Locations / Audience; `components/lists/lists-directory.tsx`, country > state > city explorer in `geo-explorer.tsx`), catalog with filter bar, "More filters" drawer, grid/list view, chips, sort, pagination (`lists-catalog.tsx`, `list-card.tsx`), collections shown only with real inventory (Popular only above 6 products, International, City-specific), contextual guides, custom-list band, FAQ. Filtered/B2C views are `noindex, follow` with canonical `/lists`.
- Kept filenames: `lib/shop.ts` (pure engine, `listsHref`), `lib/lists-data.ts` (`loadListsData`), `tests/shop.test.ts`. Only industries/countries/places that exist in the catalog or `geo_coverage` are shown (no Healthcare/Retail/UK/Germany until real entries exist). No list or result counts (owner rule).
- Guides: `components/lists/related-guides.tsx` (via `lib/lists-guides.ts`) on `/lists`, category and geography pages; hidden when no guide matches.
- Header Lists menu, sitemap, SEO registry, link ideas and guide starter links now point to `/lists`.
- Owner text rule: the phrase "Masked sample on every list page" is the standard sample trust line (home, solutions, verification, product hero, lists).
- Not checked: keyboard/screen-reader walkthrough, Lighthouse, tablet screenshot reviewed by eye.

## 76. Lists mega menu + list-type taxonomy, Phase 1 of 2 (Nov 2026)

- Owner brief "Ultimate Premium Mega Menu & Expanded Data Categories" (19 Nov 2026), built in 2 phases (owner decision). Owner decision: consumer, WhatsApp and phone categories are shown in the menu like the others, with an "Upcoming" badge; they are never purchasable and their pages carry a compliance note (a phone number is not permission to message it on WhatsApp; consumer data is not sold). Phase 2 (NOT built) = `/admin/categories` CRUD in D1 (nested categories, icons, SEO, featured, order, menu visibility, product mapping, landing content, publish).
- No migration. Taxonomy lives in code for now: `lib/taxonomy.ts` (7 groups: Email, Phone Number, WhatsApp Number, Job Title, Job Function, Industry Databases, Geographic Databases; each child is `available` or `upcoming`; compliance notes; per-node FAQs; `industryChildren` merges real catalog industries; `taxonomyPaths` = sitemap paths). Only B2B/industry/geographic email lists and geographic browsing are `available` (they map to the real products); everything else is `upcoming` = no product, no count, no price, offers a custom list request.
- Routes (no new route files): `/lists/<group>`, `/lists/<group>/<child>`, `/lists/<group>/<child>/<country>` are handled inside the existing `[category]`, `[country]`, `[...geo]` pages through `lib/taxonomy-route.ts` (`resolveTax`, `taxMetadata`) and one template `components/lists/taxonomy-page.tsx`. Group slugs must never equal a catalog industry slug (tested). Real catalog industries keep `/lists/<industry>`. Indexable only when the node is `available` and not country-scoped; upcoming and country-scoped views are `noindex, follow` (site-wide noindex still applies). Sitemap and the SEO page registry list them.
- Menu: `components/layout/lists-mega.tsx`. Desktop = two-level panel (category rail with icon/title/description, subcategory panel with Available/Upcoming chips, featured card "Find the Exact Audience You Need." with Browse All Lists + Build My List; no counts). Rail uses tabs semantics with roving tabindex, arrow/Home/End keys, ArrowRight into the panel, 90 ms hover-intent delay (no flicker), Escape closes (header). Geographic panel has a compact country > state > city explorer fed by `GET /api/menu/geo` (real places only, capped, CDN-cacheable). Mobile = searchable accordion (native `<details>`). `/lists` directory has a new "List types" tab.
- Not built: category-to-product mapping (all 3 products belong to Email/Industry/Geographic by nature), `/lists/<group>/<child>/<country>` pages for available combinations with real inventory content (they render as thin noindex views), admin editing. Browser-checked at 1280 and 375 px (hover, keyboard, Escape, new pages, no horizontal scroll). NOT checked: screen reader, Lighthouse.

## 77. List categories admin, Phase 2 of 2 (Nov 2026)

- Migration `0031_taxonomy_nodes.sql` (MUST be run in D1 before deploy; 1 statement): `taxonomy_nodes` (parent_slug '' = top level, slug, name, menu_name, icon, short, blurb, status, compliance, sort_order, featured, menu_visible, published, seo_title, meta_description, content, product_slugs JSON). Two levels only. Unique per (parent, slug).
- `lib/taxonomy-store.ts`: the built-in tree in `lib/taxonomy.ts` is the default; while the table is missing or EMPTY it is used. After the admin imports (idempotent, never overwrites) the database is the single source of truth. `loadTaxonomy` = published rows only, KV `taxonomy:v1` (60 s, cleared on every admin save). Pages call `getTax()` (`lib/taxonomy-route.ts`); the header fetches `GET /api/menu/taxonomy` (published + menu-visible, CDN-cacheable) so no page does a D1 read per visit and the menu falls back to the built-in tree on any error.
- Admin `/admin/categories` (admins only; sidebar "List categories"): tree list with Up/Down order, Edit, Publish/Unpublish, two-step delete (a category with subcategories cannot be deleted), import. `/admin/categories/edit` (new category, new subcategory, edit): name, menu name, icon (fixed set of 7), short description, intro, status, special rules (consumer / WhatsApp / phone), mapped products, published, show in menu, featured, landing text (plain paragraphs, max 4000), SEO title, meta description. Every change is logged in `settings_audit_log` (category taxonomy).
- Hard rules in `cleanNode` (tested): Available needs at least one REAL catalog product mapped; categories with consumer / WhatsApp / phone rules can never be Available; URL names cannot collide with another top-level category or a catalog industry; the URL name and parent are fixed after creation (no silent link breaks, no redirect manager needed); unpublished = 404 + out of menu and sitemap. Mapped products decide which product cards the page shows (no mapping = all real products, as in the built-in tree). Featured nodes sort first in public lists. Only Available, non-country-scoped nodes are indexable; the site-wide noindex still applies.
- Not built: image icons (fixed icon set), drag-and-drop ordering (Up/Down buttons), preview of unpublished pages, SEO Manager registry entries for admin-created categories (their SEO fields live in the category editor; the registry lists the built-in ones), mapping a category to a specific country/state, rich-text landing content. Tests: `tests/taxonomy-admin.test.ts` (validation + local D1: import, order, menu visibility, unpublish, fixed slug, delete guard). NOT browser-tested: `/admin/categories/*` behind Access.

## 78. Minimal Lists menu (Nov 2026) — supersedes the menu parts of section 76

- Owner brief "Minimal, Premium Animated Mega Menu" (20 Nov 2026). `components/layout/lists-mega.tsx` was rebuilt: desktop = 7 categories in a 2-column grid (icon tile, short name, small arrow, no descriptions, no badges); hover (70 ms intent), focus or click reveals a compact subcategory panel on the right (width transition 200 ms, staggered links via `--i`, max 7 + "View all"); ONE footer row "Explore All Lists" -> `/lists`. No promo card, no place explorer (`/api/menu/geo` deleted), no Available/Upcoming chips (status is shown on the destination pages). Anchored under the Lists nav item and clamped to the bar (`place()` in `header.tsx`). Keyboard: ArrowDown on the trigger enters the panel, arrows move in the grid, ArrowRight/Left cross into/out of the subpanel, Escape closes.
- Mobile = one accordion (Lists > categories > subcategories with a back button), grid-rows expand animation, same "Explore All Lists" row. Animations 180-200 ms, all off under reduced motion (`mega-in`, `mega-sub`, `mega-item` in `globals.css`).
- Icons (`components/lists/tax-icon.tsx`): envelope, phone, WhatsApp glyph (Simple Icons path, CC0; trademark belongs to its owner), briefcase, hierarchy (lucide Network, key `users`), buildings, globe. Icon KEYS are unchanged (DB-compatible); the admin icon select now shows these names.
- Built-in menu names are short: Email, Phone Number, WhatsApp, Job Title, Job Function, Industry, Geographic "... Lists". Subcategories are still the existing taxonomy children (e.g. "CEO Email Lists"), not the brief's merged examples. Categories already imported into D1 keep their stored `menu_name`: edit "Menu name" in `/admin/categories` to shorten them.
- Browser-checked at 1280 and 375 px (hover, keyboard, Escape, no horizontal scroll). NOT checked: screen reader, Lighthouse.

## 79. Floating Navigation Island (Nov 2026) — supersedes section 78

- Owner brief "Floating Navigation Island" (20 Nov 2026). `components/layout/lists-mega.tsx` is one `Drill` component used by desktop and mobile: a compact cream card (392 px, never above 420; no side panels) with a 2-column icon tile grid. Selecting a tile slides the grid out and a subcategory view in, IN PLACE (back arrow, category icon + title, up to 6 links, one "View all"; ~200 ms, off under reduced motion). One footer row "Explore All Lists" -> `/lists`. Purple only on arrows/hover/focus; dark-green gradient icon tiles; existing tokens only.
- Tile titles come from a slug map in the component (Email Lists, Phone Lists, WhatsApp Lists, Job Titles, Job Functions, Industries, Locations); admin-created categories use their menu name, so stored D1 menu names do not need editing. Subcategories are still the existing taxonomy children (not the brief's merged names).
- Keyboard: ArrowDown on the trigger enters the grid; arrows move; Enter opens a category (focus to Back); Escape / ArrowLeft goes back, a second Escape closes (the header ignores Escape events already handled: `defaultPrevented`). Mobile: same drill-down inside the expandable "Lists" row.
- NOT built: an exit animation when the dropdown closes (it unmounts instantly). Browser-checked at 1280 and 375 px.

## 80. Understated Lists dropdown (Nov 2026) — supersedes sections 78 and 79

- Owner rejected the tile/island versions (20 Nov 2026). Causes: bordered 48 px tiles with gradient icon boxes, a gradient card with a three-layer shadow, a 2-column grid, drill-down that replaced the whole card. New `components/layout/lists-mega.tsx`: ONE 320 px column of 36 px rows (16 px outline icon, name, small chevron; no icon containers, no tile borders), hover highlight `sand-100`, footer "Explore All Lists ->". Hover (60 ms intent), focus or click opens a small 232 px flyout beside the column (short links + "View all"); it has a hover bridge, stays open while the pointer crosses into it and flips to the left if the viewport has no room. Touch (`(hover: none)`) and mobile use an in-place drill with a back row. Motion: 150 ms fade + 4 px only (`mega-in`, `sub-in`), off under reduced motion.
- Row labels come from a slug map (Email Lists, Phone Number Lists, WhatsApp Lists, Job Title Lists, Job Function Lists, Industry Lists, Geographic Lists); admin-created categories use their menu name. Keyboard: ArrowDown from the trigger, Up/Down/Home/End on rows, Right/Enter into the flyout, Left/Escape back (second Escape closes). Browser-checked at 1280 and 375 px. Not checked: screen reader, real touch hardware, Lighthouse.

## 81. Lists menu: "Intro + list" (Nov 2026) — supersedes sections 78, 79, 80 and the earlier Data Atlas

- Owner chose option N3 from three prototypes (20 Nov 2026) after rejecting card, island, dropdown, reference-copy and Data Atlas versions. `components/layout/lists-mega.tsx`: desktop = ONE panel (header container width, about 314 px tall): left animated intro block (beige, 17rem) + three columns of nine categories (round outlined icon, bold title, one short description, no tiles, no badges). NO resources row (the two guide links were removed on the owner's request).
- Intro block: headline "Find the audience that fits." (purple underline draws in), "Browse by [rolling word]" (channel, job title, industry, location) synced with four small icons that light in turn (12 s loop, CSS only: `intro-roll`, `intro-lit`), standard trust line "Masked sample on every list page.", purple "Browse all lists" button -> `/lists`, text link "Or build a custom list" -> `/custom-list`, soft drifting purple glow, staggered entrance (`intro-rise`). All off under reduced motion (`globals.css`). The rolling words are generic ways to browse, not niches or counts.
- Items map to EXISTING routes: `/lists/email-lists`, `phone-number-lists`, `whatsapp-number-lists`, `job-title-lists`, `job-function-lists`, `management-levels`, `industry-databases`, `/lists/geographic-databases/international-business-databases` and `/browse-by-state-region`. An item is hidden when its taxonomy group is unpublished or not menu-visible. Built-in group `management-levels` (upcoming) was added; a DB-imported tree without it hides that entry until "Import built-in categories" is pressed again (idempotent).
- Mobile: accordion Lists > nine entries (round icons) > subcategories with a back row; footer rows "Browse all lists" and "Build a custom list". Browser-checked at 1440 and 375 px (no horizontal scroll). NOT checked: screen reader, real touch, Lighthouse.
- Update (20 Nov 2026): "Or build a custom list" in the intro block is a secondary outlined button (white pill, forest border, purple on hover) under the purple "Browse all lists" button.

## 82. Product page SEO pass (Nov 2026) — amends section 22

- FAQs on `/product/<slug>` now use the homepage accordion style (`SolutionFaq`, heading "FAQs About the {product.name}", FAQPage JSON-LD); the old split `Faq` layout is no longer used there. `getProductFaqs` gained "Is the {name} a one-time purchase?".
- SEO: `lib/product-seo.ts` (title "{name} USA: Buy Verified Contacts", meta description, overview copy, Product JSON-LD). Offers/prices are in the JSON-LD ONLY when the product is live and not placeholder. New keyword section `components/product/overview.tsx` ("About the {name}", real internal links) right after the hero; all section H2s carry the product name; H1 = name + "for the United States" subline; OG/Twitter metadata added. Copy uses catalog facts only (no counts, accuracy or prices).

## 83. /pricing redesign and menu spacing (Nov 2026)

- `/pricing` is now `app/pricing/page.tsx` + `components/pricing/pricing-page.tsx` + copy in `lib/pricing-content.ts` (the `[page]` stub entry was removed; footer CTA band hidden on /pricing). Sections: hero "Pay Once. Own the List." (typographic struck-through "Monthly fees / Credits / Seat licenses" -> "Once."), "Find Your List. See Your Price." (cards ONLY for products that are `live` and not `placeholderData`; otherwise an empty state with Browse Lists / Custom List, so no draft or placeholder price and no niche list is ever shown), price factors, 4 buying steps, fair one-time vs subscription contrast with redistribution/accuracy caveat, custom list band (no price), 9 FAQs (`PRICING_FAQS`, match refund 5%/95%, 30-day claim, crypto only, delivery up to 12 h). Title "One-Time Business Email List Pricing". JSON-LD: WebPage, FAQPage, BreadcrumbList; ItemList with Offers only when real products exist.
- Prices come from the static catalog (`lib/catalog.ts`); admin cannot edit products yet (read-only, section 40), so "admin price changes appear automatically" is not possible until a D1 catalog exists.
- Lists mega menu: descriptions shortened to one line and columns vertically centred so all nine rows have equal height and spacing.

## 84. Category Pages 2.0, Germany, product hero (Nov 2026)

- Owner decisions (20 Nov 2026): category pages are SHOPPING pages (full database + segment databases), not custom-request pages; product pages keep their design except the HERO (Get This List -> `#pricing`, Request a Sample -> `/sample?product=`); NO package pricing on category pages; "Audience" is written "Prospects" on the site (creator-follower "audience" wording and internal admin/code names unchanged).
- Germany is LIVE catalog data from the owner: full country 4,000,000 records, Berlin 200,000 (owner said "200k+", entered as 200,000), last updated 2026-10-31, same 7 fields, no accuracy figure. Only Berlin exists as a city until the owner sends more (`DE_CITIES` in `lib/catalog.ts`). New general category `business` (`kind: "general"`, hidden from industry pickers via `getCategories()`; `getCategory()` still finds it). Product slugs `germany-business-email-database`, `berlin-business-email-list`.
- Packages are the owner's reference prices: Starter $99 / 100,000, Professional $199 / 1,000,000, Complete $299 / 5,000,000. `offeredPackages(p)` hides any package larger than the list's real record count (used by pricing, cart, checkout, SEO); placeholder lists show all.
- Routes: `/lists/germany-business-email-lists` (category shopping page: `components/category/geo-shop.tsx`, `city-collection.tsx`) and `/lists/germany-business-email-lists/cities`; the old taxonomy country URL 308-redirects there (`lib/geo-shop.ts` `countryFromFlat`). Pages are noindex until a product has real data (now true), plus the site-wide noindex. Flat product URLs like `/lists/berlin-business-email-list` are NOT built (products stay at `/product/<slug>`).
- COMPLIANCE FLAG: `/legal/gdpr` and the privacy text still say "United States only, no EU/UK sales". Selling Germany data makes that false. The owner must supply the lawful basis and updated text before launch (section 25 note).
- Prototype category designs (`components/category/pages.tsx`: CEO role page, Dentists industry page, headings via `lib/category-view.ts`) are gated to those pages only, awaiting owner approval for a roll-out. Delivery links for the two Germany products must be set in `/admin/delivery`, otherwise paid orders wait.

## 85. /lists redesign, category landing pages, basket hero, product URLs (Nov 2026; NOT yet on main)

- `/lists`: hero toggle (B2B/B2C) removed; below the hero = `TypeRail` (10 database types, upcoming ones labelled), catalog with kind tabs (All/Country/City/Industry via `?kind=`, `productKind()` in `lib/shop.ts`), two-tab directory (industry / location). Hero right side = `components/lists/category-basket.tsx`: custom physics (`lib/basket-physics.ts`, no dependency, tested in `tests/basket-physics.test.ts`) drops 10 labels into a basket; labels link ONLY to real pages (`lib/hero-basket.ts`; Construction, Hotels and Marketing Agencies have no page, so they are plain labels). Pauses off screen / hidden tab / while a card is hovered or focused; reduced motion shows the settled pile still. Below xl it is a 208 px strip with 6 cards.
- ALL category pages use `components/category/tax-landing.tsx` (groups, subcategories, country views) and `IndustryPage` (every industry). Copy in `lib/category-copy.ts`. Upcoming categories say plainly they are not on sale and list the real ready-made databases; no pricing on category pages; NO extra CTA band at the bottom (the global footer already has it, owner rule 20 Nov 2026). The CEO/Germany custom-request prototypes were deleted.
- Product pages moved: `/lists/<product-slug>` (e.g. `/lists/dentists-us`) is the canonical URL (`ProductPageView` in `components/product/product-page.tsx`, resolved first in `app/lists/[category]/page.tsx`). `/product/<slug>` 308-redirects. Product slugs must never equal a category, taxonomy group or flat `<country>-business-email-lists` slug. Product pages are now dynamic (edge-cached 60 s like other /lists pages).
- Category page rules (owner, 20 Nov 2026): place sections are titled "{Industry} Email Lists by States" and "... by Cities" (`components/category/place-section.tsx`, used on industry and country pages); "What's Inside the Data" shows only the masked sample table (no field chips); NO "Guides for this list" section on category pages; "How It Works" uses the animated `components/category/steps.tsx` (armed by JS, off under reduced motion). After editing `app/globals.css`, restart `next dev` and delete `.next` if new rules do not appear (a stale Turbopack cache hid them once).

## 86. Glossary Library (Nov 2026)

- Owner brief "Glossary Library with Bulk Upload" (20 Nov 2026). Migration `0032_glossary.sql` (MUST be run in D1 before deploy; 3 statements, one per message): `glossary_terms` (slug UNIQUE, status draft|published, featured, related lists as ";" text) and `glossary_categories`. Built-in 12 categories (`lib/glossary/categories.ts`) are used until the admin saves one (then copied into the table).
- Pure, shared code (browser preview AND server): `lib/glossary/clean.ts` (fields + header aliases, `richText` converts HTML to a safe Markdown subset: paragraphs, `## `, `- `, `1. `, `**bold**`, links only path/https; scripts/styles/other tags/unsafe links removed; `MIN_PUBLISH` = short 30 / full explanation 200 chars, thin pages cannot be published), `tabular.ts` (RFC 4180 CSV with BOM/quotes/semicolon/tab, JSON in several shapes, column-mapping guess), `xlsx.ts` (own XLSX reader/writer on `fflate`, first sheet, shared/inline strings), `plan.ts` (`planImport`: create/update/skip/error per row, duplicates by slug or term vs database and inside the file, warnings for unknown related terms/products/guides/categories). Dependency added: `fflate` 0.8.2 (pinned).
- Import rules: default = skip existing; update mode only fills non-empty fields; published entries are protected unless "allow updating published" is ticked; an import never unpublishes; "import as drafts" option; missing categories are created. The browser parses the file (XLSX never reaches the Worker), previews every row, then sends only actionable rows in batches of at most 40 rows / 400 KB to `importBatchAction`, which plans AGAIN against the live table (`lib/glossary/store.ts` `applyBatch`, one `db.batch`, per-row fallback). Result = added / updated / skipped / failed + downloadable CSV report.
- 59 starter entries (`lib/glossary/starters.ts`, original text, no statistics/prices, 12 topics) ship as downloadable CSV/XLSX/JSON plus a blank template (`/admin/glossary/download`, admin only) and a one-click "add as drafts" button. NOTHING is published automatically. Test guards: unique slugs, all related terms resolve, no `%`/`$` figures, every entry at least 400 characters.
- Admin (admins only; sidebar "Glossary"): `/admin/glossary` (search, status/category filters, pagination, bulk publish/unpublish/category/feature/delete with confirm), `/new`, `/[id]` (editor with search-result preview, SEO fields, publish/unpublish/delete), `/[id]/preview` (same template as the public page, any status), `/categories`, `/import`. Every change is logged in `settings_audit_log` (category glossary).
- Public: `/glossary` (hero + live search, A-Z bar, category chips with counts, "Start here" = admin-featured entries (no popularity data exists, so no "popular" label), all entries grouped by letter, rendered in the HTML) and `/glossary/[slug]` (H1, short definition, explanation, why it matters, example, related terms, related guides (only published guides/articles), related catalog products (no counts or prices), contextual CTA by topic, "More in category", DefinedTerm + Breadcrumb JSON-LD, canonical). Drafts return 404. Thin pages are `noindex, follow` and left out of the sitemap; an empty glossary is noindex. Footer Resources has "Glossary"; sitemap, SEO page registry and the 60 s edge cache include it; the page-SEO rewriter skips `/glossary/*` (own fields).
- Tests: `tests/glossary.test.ts` (sanitising, CSV/JSON/XLSX parsing and round trips, starter integrity, import planning, local-D1 import, duplicates, published protection, bulk publish gate, categories, manual save). NOT browser-tested: all `/admin/glossary/*` screens (behind Access). Public pages checked at 1440 and 375 px with the starters published in a local DB.

## 87. Data Reseller Partners (Nov 2026)

- Owner brief (20 Nov 2026). `/partners` landing (`components/partners/*`, copy in `lib/partners/content.ts`: hero + split-price "50%" visual, steps, application form, Partner Program Terms (`#terms`), 10 FAQs with FAQPage JSON-LD). Footer Company link "Data Reseller Partners", sitemap + SEO registry, footer CTA band hidden. Meta title is the SEO-section title ("Data Reseller Partner Program — 50% Off Databases | BeigeLeads"). Still noindex like the rest of the site.
- Migration `0033_partners.sql` (MUST be run in D1 before deploy; 8 statements, one per message): `partner_applications`, `partner_discounts`, and `orders.discount_code / discount_percent / subtotal_cents` (the orders columns are needed by EVERY order insert, so run it before deploying).
- Application: `POST /api/partners` via `handleForm` (honeypot, Turnstile, 5/h/IP). `lib/partners/submit.ts`: saved first, reference `PT-XXXXXXXX`, duplicate = same email+business or any non-declined application of that email (no second row/email), confirmation via `sendOnce("partner_application_received")`, owner alert uses the Contact toggle/recipients. A declined applicant may apply again with a different business.
- Admin `/admin/partner-requests` (admins only; sidebar badge = pending count): table, search/status filter, detail, Under review / Approve / Decline / Resend decision email / Deactivate or Reactivate discount, internal note. Every action shows the real outcome (including whether the email went out) and is logged (settings_audit_log category partners). Approve creates the code BEFORE flipping status, emails it once; decline deactivates any code.
- Discount: `lib/partners/discount.ts`. Code `PARTNER-XXXX-XXXX`, fixed 50% (`PARTNER_PERCENT`), bound to the approved partner's email (compared lower-case), must be active and the application still approved; ONE generic refusal message (no code probing); code attempts limited to 20/h/IP on `/api/cart/price`. `priceCart` takes a validated `ctx.discount` (browser never sets a price): lines get `payCents`, cart gets subtotal/discount/total. `createOrder` re-resolves the code with the ORDER email, stores the discounted amounts (items add up to the total, order keeps code/percent/subtotal), counts uses, dedupe key includes the code. One code per order; nothing to stack with. Cart shows the discount if present; the code is entered at checkout ("Approved data reseller partner? Add your code": code + applied email). Applies to catalog lists only; custom lists are quoted separately.
- System Emails: category "Data Reseller Partners": `partner_application_received`, `_approved`, `_declined` (all Connected, branded, editable in /admin/system-emails incl. designer, preview, test send). New `TemplateDef.category` + `canDisable` and an on/off switch (`lib/system-emails/enabled.ts`, settings key `email.off.<template>`; only templates without a plain-text twin can be switched off, admin alerts never). New variables `business_name`, `partner_code`, `partner_discount`.
- Honesty/open items: the Partner Program Terms and the resale FAQ are written conservatively from the existing license (own lawful use; resale only as confirmed in writing at approval): OWNER/LAWYER MUST CONFIRM the real resale rules before launch (TODO-BEFORE-LAUNCH.md). No earnings claims, testimonials, dashboard, referral tracking or commissions exist. Privacy policy covers partner applications (added 20 Nov 2026, LEGAL_UPDATED 2026-11-20; not lawyer-reviewed).
- Tests: `tests/partners-e2e.test.ts` (validation, submit, duplicates, failed email, approval + code + email, email binding, cart and order pricing, deactivation, decline, retry, templates, switch-off). Not browser-tested: `/admin/partner-requests` (behind Access), real Turnstile/Resend, the checkout code panel (checkout is closed locally).

## 88. Cart redesign (Nov 2026) — amends section 69

- Owner brief "Premium Animated Shopping Cart Redesign" (20 Nov 2026). No migration, no new env vars. Checkout action, pricing, partner discount and persistence are unchanged.
- Empty cart (`components/cart/empty-cart.tsx`, `empty-art.tsx`): CSS-only scene (contact cards drift into a basket, basket gives under each landing; decorative, static under reduced motion), headline "Your Next Customers Are One List Away.", CTAs Explore Databases / Browse Popular Lists (anchor to recommendations), three benefits, then "Find Your Next Prospects" ("Audience" is written "Prospects", section 84). Recommendations come from `POST /api/cart/price` with an empty cart (4 max) and are REAL products only: `suggestFor` now filters `isRealProduct` (live and not placeholder), so placeholder lists are never suggested anywhere (also "Expand Your Reach"). Cards show industry icon, country flag, contact count (real figure only), "From" price, Preview Sample (`#sample`) and View Database. Section hides when nothing is on sale.
- Filled cart: line cards with package radio cards (change package), fields, masked sample toggle, animated entry and fade-collapse removal, animated totals (`useTween`, 320 ms, jump under reduced motion), sticky summary with partner code field (code + the email it was applied with), CTA "Secure My Databases" (same `/checkout/cart` link), "One-time payment. No recurring charges.", trust row, delivery explanation (owner facts: mostly instant, up to 12 h, CSV/Excel/TXT), "Expand Your Reach" (up to 3 real related lists, one-click add), mobile sticky total + CTA.
- Partner code in the cart: `lib/cart/partner.ts` keeps `{code,email}` in sessionStorage (this tab only) so checkout pre-fills it; the server still validates code + email on every price and order. Only partner codes exist (no general coupons): the field is labelled "partner code".
- Header cart badge pops on change (`cart-pop`). Animations in `app/globals.css` (`cart-*`), all off under reduced motion. Tests: `tests/cart.test.ts` (suggestions never placeholder). Browser-checked at 1280, 820 and 375 px (no horizontal scroll); NOT checked: real checkout flow (closed locally), partner code apply in the cart UI against a live D1.

## 89. Case Studies library (Nov 2026)

- Owner brief "Premium Case Studies Library & CMS" (20 Nov 2026). NO new migration (the `kind` columns from 0026 are free text). Third kind `case` on the blog CMS (`lib/blog/kind.ts`: `Kind`, `KINDS`, `asKind`, `adminOnly`, `catHref`; guides and case studies are admin-only, blog editors cannot touch them). Case studies have their OWN categories (industry / use case), shared tags, same editor, autosave, revisions, scheduling, SEO and Social tabs, media library, featured image cropper.
- Admin: `/admin/case-studies` (+ new, edit, preview, revisions, taxonomy; thin wrappers over the blog views; sidebar "Case Studies"). Starters are added from `/admin/blog/starters` (they create DRAFTS; the image is copied into the media library from `/case-studies/*.webp` via the `ASSETS` binding, `starter-create.ts` now accepts `/brand/` and `/case-studies/` paths).
- Public: `/case-studies` (dark hero with search + topic chips, featured story = newest published (no pinned flag exists), asymmetric alternating rows, not a card grid; `components/case-studies/rows.tsx`) and `/case-studies/[slug]` (shared `ArticleView kind="case"`: breadcrumbs, Article JSON-LD, TOC, related case studies, inline CTA "Explore Databases" -> `/lists`, never the custom list). Sitemap (kind-aware), SEO registry, edge cache (60 s), page-SEO rewrite exclusion and footer Resources link all include it; the old `[page]` stub was removed.
- Honesty: no documented customer outcomes exist, so all three starters (`lib/blog/case-study-starters.ts`) are ILLUSTRATIVE USE CASES (composite scenarios, no customer names, logos, testimonials, rates, ROI or revenue). Each opens with an info callout and shows an "Illustrative use case" chip on cards and the article, driven by `lib/case-studies.ts` (`REAL_CUSTOMER_SLUGS`, empty: add a slug ONLY for a real, permissioned customer story). Study 3 states plainly that BeigeLeads lists are business-level (seven fields, no job-title field; job-title lists are not available yet).
- Images: `scripts/case-studies/build.py` generates three text-free 1600x900 WebP covers (palette tokens only) into `public/case-studies/`; alt text lives in each starter. No stock photos, no logos.
- NOT done by code: the three drafts exist only after an admin presses "Add as draft" at `/admin/blog/starters` (no production access from here), and publishing is the owner's click. There is no "featured" flag; the featured story is the newest published one (set the publish date in the Publishing tab to choose).
- Tests: `tests/case-studies-e2e.test.ts` (titles, labels, no invented numbers, sections, word counts, links resolve, covers exist, local D1: drafts, categories, kind separation, search). Browser-checked locally at 1280 and 375 px with seeded data (no horizontal scroll, no broken images). NOT checked: `/admin/case-studies/*` screens behind Access.

- Cart sidebar delivery card (20 Nov 2026): `Trust()` in `components/cart/cart-view.tsx` now shows a compact "How You'll Receive Your Lists" card (intro, File formats, Delivery time, divider, separate links "How delivery works" and "Preview before buying" -> /sample). The three badges are unchanged; the old paragraph and trailing sample line were replaced. Not browser-screenshotted.

## 90. Promotions & discounts (Nov 2026) — extends section 87

- Owner brief "Complete Promo, Coupon & Discount Management System" (20 Nov 2026). Migration `0034_promotions.sql` (MUST be run in D1 before deploy, one statement per message): `promotions`, `promotion_redemptions`, `orders.discount_cents`. Before it exists: pricing/cart/checkout work without promos; order inserts add discount columns only when a discount exists; admin pages show a notice.
- Engine `lib/promos/engine.ts` (pure, shared by cart price API, `createOrder` and the admin preview): percent / fixed, scope by product / category / package, minimum cart (whole cart subtotal), max discount, window + time zone, total and per-customer limits, first-purchase, partner-only, automatic vs code (case-insensitive), combinable. Stacking: partner code is exclusive; otherwise the best single promo wins; a combinable winner stacks with other combinable promos on remaining amounts; a non-combinable promo applies alone; whole-cent rounding, never negative, eligible lines only. Documented in the admin UI (`STACKING_RULES`). One generic refusal text for every bad code.
- Server is the only authority: `createOrder` re-prices from the catalog, stores discounted `order_items` and total, and the BTC/crypto amount derives from the discounted total (SAVE20 on $299 = -$59.80 = $239.20, tested). Redemption lifecycle: `reserved` at order creation (re-count guards limit races, unique order+promo = idempotent) -> `redeemed` when paid (watcher or manual mark-paid) -> `released` on expiry. Partner discounts stay in the partner system (section 87) and are reported separately.
- Public display: `lib/promos/public.ts` (KV `promos:pub:v1`, 60 s, cleared on every admin change; codes are exposed only when the admin enabled a banner place), `GET /api/promo-banners`, `components/promos/banner.tsx` on home, /lists, product pricing and cart. Product packages show Original / Now / Save % only for AUTOMATIC promos or a code promo with a product banner; the Get This Package button is unchanged. No countdown, no scarcity.
- Admin `/admin/promotions` (new, edit, duplicate, pause, delete guard, analytics from paid real-money orders; testnet excluded; "conversion" is not shown because promo views are not recorded). Orders list shows the discount and code.
- Tests: `tests/promos.test.ts`, `promos-e2e.test.ts`, `promos-admin.test.ts`. NOT tested: real Turnstile/Resend/mainnet payment, admin screens behind Access, banners in a browser. The customer receipt email shows the paid (discounted) total; it has no separate discount line.

## 91. WooCommerce catalog import (Nov 2026)

- Owner brief "WordPress/WooCommerce product migration" (20 Nov 2026) + export of 1,293 products. Owner decisions: import EVERYTHING incl. consumer/phone/sensitive products but keep them DRAFT + restricted (legal review later, bulk publish blocked); price = sale price (regular kept in source JSON, no strike-through); max 3 packages (smallest/middle/largest variation = Starter/Professional/Complete); 30-product pilot first, then the full file; BeigeLeads slugs and product pages.
- Migration `0035_catalog_import.sql` (MUST be run in D1 before deploy; 7 statements, one per message): `catalog_imports`, `catalog_products`, 3 indexes, `catalog_import_errors`. Before it exists nothing changes publicly and the import pages say so.
- Pure shared logic `lib/import/{geo,woo}.ts` (browser preview AND server): `parseWoo` (column auto-detect + manual mapping, variations joined to parents), `buildProduct` (category/channel/country/state, packages, flags, restricted, generated fact-only description; WordPress marketing text is NOT copied, original kept in `original_description`), `publishBlockers`. `lib/import/store.ts`: `planBatch` (duplicates by WordPress id or name; skip | update drafts only | separate; the same WordPress id is never imported twice; slug collisions with static products/categories/taxonomy (`lib/import/reserved.ts`) or other imports get `-<wpId>`), `applyBatch` (per-product writes, idempotent, delivery links added to `delivery_links` only where none exists), `rollbackImport` (drafts without orders only), `setStatus` (publish gate: not restricted, price on every package, delivery link on every package).
- Imported catalog reaches the site through `lib/catalog-db.ts` `hydrateCatalog` (published rows only, KV `catalog:imp:v2` 60 s, never includes download links, failure = code catalog unchanged); `await hydrateCatalog()` is called on product/lists pages, cart price, checkout, delivery, promo banners. Imported products render on the same `/lists/<slug>` product template (no fields table, no accuracy/verified date, records 0 = "Full list").
- Admin: `/admin/products/import` (upload CSV in the browser, mapping, preview counts, pilot = 30 products spread across channels/countries, check against DB, confirmation, batches of 25 with progress, error list), `/admin/products/imported` (filters, bulk publish/draft/archive with refusal reasons, import history + rollback). Actions audited in `settings_audit_log` (category catalog-import).
- NOT built (Phase B): category/country/state/city pages for imported categories (`/lists/<imported-category>` is 404 on purpose), /lists + search + sitemap integration, image import into the media library (source image URL is stored only; no hotlinking is rendered), SEO/content enhancement, per-product edit and bulk edit of price/packages, mega-menu integration, redirects. Admin draft preview does not exist (drafts are 404 publicly).
- Real-file dry run (not saved): 1,293 products, 342 restricted, 420 without download link, 440 country not detected (Worldwide), 9 slug duplicates (suffixed). COMPLIANCE: non-US lists conflict with `/legal/gdpr` + privacy text ("US only"); consumer/phone data is held back; the source site (leadsmunch.com) is listed as a competitor in `/compare` while the owner says it is his own: the owner must decide.
- Tests: `tests/import-woo.test.ts`, `tests/import-e2e.test.ts` (local D1). Not tested: the admin screens behind Access, the real 1,293-row import against production D1.

## 92. Cloudflare Workers Paid plan (20 Nov 2026)

- Owner decision: the account is now on the Workers PAID plan (repeated timeouts on the free plan, e.g. during the catalog import). This closes the open "Paid-plan decision" in sections 43, 44, 52 and 57: per-visit D1/KV reads on dynamic pages are acceptable, though the KV-cached designs stay (they are still cheaper and faster). Free-plan limits quoted elsewhere (10 ms CPU, 1000 KV writes/day) no longer apply; paid limits and billing are the owner's to watch. `wrangler.jsonc` was NOT changed (a higher `limits.cpu_ms` is optional; ask before setting it).

## 93. Phase B (part 1): imported categories and place pages use the product page (Nov 2026)

- Owner decision (20 Nov 2026): country / state / city URLs reuse the SAME single product page as `/lists/<product-slug>`. `lib/place-product.ts` `productForPlace(category, country, geo[])` picks a real product: an exact one (imported product whose `region` or `citySlug` equals the place) or the national product of that category+country. `/lists/<category>/<country>` and `/<state or city>` render `ProductPageView`; when the state/city has no list of its own, `components/product/place-note.tsx` says so plainly and the page is `noindex, follow` with its own canonical. No product = the old geography page (or 404): nothing is invented. Example: `/lists/dentists/united-states/alabama` shows the national Dentists list with that note.
- Imported categories: `/lists/<imported-category>` renders `components/category/imported-page.tsx` (hero, country chips, product cards, 5 generic FAQs; no claims about fields/countries/verification beyond the product pages). 404 when it has no published product. `generateMetadata` handles it.
- `/lists` data (`lib/lists-data.ts`) now hydrates the imported catalog and adds imported industries and countries (only those with a published product) to the filters/search. Sitemap includes imported category, country and product URLs (published only).
- Not built yet (Phase B part 2): regional/city pages for imported products with only regional lists (country URL stays 404 when no national product exists), mega-menu entries for imported categories, image import, SEO copy per product, per-product edit.

## 94. Bulk delivery links (Nov 2026) — extends section 33

- `/admin/delivery/bulk` (admins; button "Bulk upload (CSV)" on `/admin/delivery`): upload a CSV (`slug` or exact product name, `package` empty = link for every package, `url` https only). The browser previews every row (new / different / unchanged / problem) with the pure `lib/delivery/bulk-check.ts`; "Replace existing" is off by default; batches of 100 go to `bulkLinksAction`, which re-validates against the real product list. Works for EVERY product including imported drafts (`lib/delivery/bulk.ts` `linkTargets` reads `catalog_products`), so links can be added before publishing. A template CSV of products without any link can be downloaded.
- One audit row + ONE owner email per upload (not per link). `updated_by` = `bulk:<admin email>`. Test: `tests/delivery-bulk.test.ts` + a case in `tests/import-e2e.test.ts`.

## 95. Phase B (part 2): imported product edit + SEO text (Nov 2026)

- `/admin/products/imported/[id]` (admins; the product name in the imported list links to it): edit name, short title, description (max 2,000), up to 3 packages (records, USD price, Recommended) and optional SEO title / meta description. Slug, category, country and restricted flags are fixed. A PUBLISHED product cannot be saved with a package price of 0; package names are unique; the source download link stays on its package (`updateProduct`). Saves are audited (category catalog-import) and clear the catalog cache (live within about a minute).
- `Product.seoTitle` / `metaDescription` (imported lists only) override the automatic product metadata (`productMetadata`); empty = automatic. They flow through `catalog:imp:v2`. The site-wide noindex is untouched.
- Deliberately NOT built: mega-menu entries for imported categories (hundreds of them would flood the menu; they are in the `/lists` directory and filters), product image import (the product page has no image slot, and the source site is not reachable from the build environment; the source image URL stays stored), bulk edit of prices.
- Tests: edit cases in `tests/import-e2e.test.ts`.

## 96. Product manager: every product editable (Nov 2026)

- Owner request (20 Nov 2026): all products editable in `/admin/products`, new product, duplicate, per-product Records / Data fields / File formats / Coverage / Last updated / Pricing, and a bulk "Last updated". Migration `0036_product_fields.sql` (MUST be run in D1 before the new fields work; 11 statements, one per message): new `catalog_products` columns (`data_fields_json, file_formats, coverage, last_updated, origin, placeholder, for_sale, accuracy_pct, scope, sample_json`) and table `slug_aliases`. Before it exists the site keeps working (the loader falls back to the old columns) and the admin shows "run the migrations".
- `/admin/products` is now THE product manager (the old read-only list and `/admin/products/imported`, which redirects here). Name -> edit page (`/admin/products/imported/[id]`): texts, facts, data fields, formats, coverage, last updated, for sale / placeholder switches, packages, SEO text, "Duplicate as draft". `/admin/products/new`: create a DRAFT by hand (slug auto, unique). Bulk bar: date picker + "Set for N selected / all matching (every page)" with a confirmation; also "Select all N" for status changes.
- Built-in products (code): "Make built-in products editable" copies them into the database (`origin = builtin`, idempotent). A database row with the same slug REPLACES the code product (`allProducts` in `lib/catalog.ts`); an unpublished built-in row HIDES it (the loader also returns `hidden` slugs). Catalog cache key is now `catalog:imp:v2` (payload `{ products, hidden }`).
- Product page reads `fileFormats`, `coverage`, `lastVerified` (= Last updated), fields and packages from the product (empty = the old automatic text). `lib/import/store.ts`: `createProduct`, `duplicateProduct` (no source id, no delivery link, no restricted override), `uniqueSlug` (also avoids old-slug aliases), `setLastUpdated`, `importBuiltin`.
- Removed (owner): the dark "Ready to reach ...?" CTA block on every product page; `components/product/final-cta.tsx` deleted. Product pages now link to 12 related lists (6 cards + 6 text links; `getRelatedProducts` scores same industry > same country > same channel > same state, ties spread by a stable hash). Cart "Expand Your Reach" uses the same scoring. Every missing page (`app/not-found.tsx`) redirects to `/lists` (route handlers still return real 404s). SEO note: Google treats mass redirects of 404s to a catalog page as soft 404s; the owner chose this.
- Still to do from the same brief: real (owner-pasted, auto-masked) samples instead of fictional rows, and the SEO slug / title / H1 regeneration with old-slug redirects.

## 97. Real masked samples on product pages (Nov 2026)

- Owner request (20 Nov 2026): samples must be real, no placeholder rows. The site cannot invent rows: the owner pastes REAL rows from the list file and the server MASKS them (`lib/product-samples.ts`, pure, tested): email `j***@domain`, phone last four digits `*`, house number `***`, website reduced to its domain; only these masked values are saved (`catalog_products.sample_json`, max 10 rows). The raw email/phone are never stored.
- Admin: product edit page "Real sample rows" (paste CSV, live masked preview = exactly what visitors see, save / remove) and `/admin/products/samples` (bulk CSV with a `slug` column, groups of 40 products per request, unknown slugs reported). Audited.
- Product page: the hero window and the "sample" table use ONLY `product.samples`. No sample = the hero shows a "Request a free sample" panel and the table section is not rendered (the fictional per-category rows and the "placeholder rows" line were removed). Category pages (`tax-landing`, `IndustryPage`) show a sample table/hero window only when one of their products has a real sample (`lib/real-sheet.ts`).
- NOT changed (still labelled fictional): `/sample` page, home sample ledger, how-it-works, solutions, popups, the cart's sample toggle and the Germany shop hero (`lib/sample-data.ts` stays for those). Decide separately whether to replace them.

## 98. SEO regeneration of products (Nov 2026) — extends sections 96-97

- Owner request (20 Nov 2026): regenerate every product slug, name (H1), SEO title and meta description in an SEO-friendly way. No migration beyond 0036 (`slug_aliases`).
- `lib/import/seo-text.ts` (pure, tested): `seoText` builds subject, name ("<Subject> Email List in <Place>"; phone lists "Phone Number List"), slug base, SEO title (<= 62 chars) and meta (<= 158) ONLY from the product's own fields. Record counts appear only for non-placeholder products. No accuracy, rating or price claims.
- `lib/import/store.ts`: `renameProduct` (old slug becomes a 308 alias; aliases pointing at the old slug are repointed; `delivery_links`, `promotions.product_slugs` JSON and `/lists/<slug>` page-SEO overrides move along; orders keep the slug they were bought with and delivery resolves it) and `applySeo` (options slugs / names / titles; dry run; built-in products keep their slug). `uniqueSlug(db, base, except)` lets a product reclaim its own old slugs.
- Admin `/admin/products/seo`: choose what to regenerate, Preview (first 40, nothing saved), two-step Apply in chunks of 40, audited (category catalog-import). Safe to re-run (idempotent). Slug changes are live within about a minute (catalog cache).
- Not changed: built-in (code) product slugs, category/place URLs. Redirecting every 404 to /lists (section 96) can be read by Google as soft 404s.

## 99. Real samples everywhere, discovery over every product, categories (Nov 2026) — supersedes the "still fictional" note in section 97

- Owner request (20 Nov 2026): no dummy data or example.com rows anywhere; samples must be real, one sample may serve every product; every product findable and filed in a category; home discovery advanced; built-in products also get new SEO names/slugs.
- `lib/sample-data.ts` is TYPES ONLY now (all fictional rows deleted). `lib/catalog.ts` `sampleRowsOf(slug)` = the product's own real masked sample, else the ONE site-wide default sample (`getDefaultSample()`), else nothing. The default sample is stored masked in `system_settings` key `sample.default`, travels in the catalog payload (`catalog:imp:v2`, `defaultSample`), and is entered by the owner at `/admin/products/samples` (box "Default sample for every product": paste real rows, server masks, up to 10 rows). Nothing is shown until the owner saves one: pages then show a "request a free sample" panel instead. The code cannot invent rows.
- Consumers switched to `sampleRowsOf`: product page, /sample, /how-it-works, solutions preview, popups API (capped to 60 products), cart (`/api/cart/price` fills `line.sample`), Germany shop page, category pages (`lib/real-sheet.ts`), home ledger (`lib/home-ledger.ts`, tabs only when several products have their own sample). Home, /sample, /how-it-works and /solutions/[slug] are now `force-dynamic`; the home page is edge-cached 60 s like /lists. Remaining "Illustration" visuals (verification, data-sources, delivery email) no longer use example.com.
- Home discovery: `lib/discover.ts` (pure, tested) + `GET /api/discover?q=` (&suggest=1) search EVERY product (built-in and imported) by name, category, country, state/city and channel (AND of tokens; partial matches shown as "closest"; placeholder counts/prices hidden). `components/home/copilot.tsx` calls it (debounced type-ahead, results with category/country links, "See all matching lists" -> `/lists?q=`). It is still a structured search, not AI.
- Categories: `/admin/products/seo` has a "Move products from catch-all categories" option (`applySeo` `categories`): products in "General Targeted Lists" / "Job Titles" move to a category named after the list's subject (singular/plural merged, new category created when needed, reserved slugs avoided). Imported categories appear at `/lists/<category>` and in the /lists directory.
- Built-in products (Dentists, Restaurants, Ski shops, Germany): the SEO regeneration now copies them into the database first (`importBuiltin`) and can rename them like any product; old slugs redirect through aliases.
- Tests: `tests/discover.test.ts`, default-sample + recategorize case in `tests/import-e2e.test.ts`.

## 100. /lists server-side paging (Nov 2026) — amends sections 75 and 85

- `/lists` no longer ships the catalog to the browser. `app/lists/page.tsx` runs `applyFilters`, `paginate`, `facets`, `chips` and `interpret` (pure `lib/shop.ts`) on the server and passes `ListsCatalog` only the current page (12 `ShopProduct`s), facets, chips, "reads as" text and compact industry/country lists. Every filter, sort, tab and page change is a normal URL change (`router.push` in a transition; the page dims while loading); the search box is debounced 350 ms; numeric ranges commit on blur. Pagination links are real `<a>` links. The old `history.replaceState` sync is gone.
- `ListsDirectory` receives a precomputed `industryCountries` map instead of all products. `ListsHero` already took only compact lists. Canonical / noindex rules are unchanged. The page stays `force-dynamic` and is edge-cached 60 s per URL.
- Tests: pure engine tests in `tests/shop.test.ts` are unchanged. NOT browser-checked after this change.

- Menu fix (20 Nov 2026): `loadTaxonomy` appends built-in groups that have NO row in `taxonomy_nodes` (added in code after the admin import), so the Lists menu and their pages are never missing. A group that exists in the database but is unpublished / hidden stays hidden (publish it in /admin/categories).

## 101. All US states + state flags (Nov 2026) — amends sections 71, 75, 93

- Owner request (20 Nov 2026): the /lists "State or region" filter listed only states with imported inventory; every US state must be selectable and each state shows its OWN flag (not the US flag).
- `lib/us-states.ts` (50 states + DC, slugs = flag file names). `lib/lists-data.ts` adds every state to the `united-states` region list, each carrying every category that has a US product, so a state filter shows the national lists (state pages are views of the national list, §93; no counts invented). Flags: `public/flags/us/<slug>.svg` (npm `us-state-flags`, ISC licence, svgo-optimised, served statically, not bundled). `StateFlag` in `components/shared/db-icon.tsx`; used in the /lists explorer, state place grids (`PlaceSection`) and the place note. Native `<select>` cannot show images, so the filter dropdown stays text; flags appear in the explorer/tiles.

- Update (20 Nov 2026): every country flag is now its own file (`public/flags/c/<iso2>.svg`, npm `flag-icons` MIT, svgo); `Flag` uses the inline SVGs for the 7 original codes and the file for all others (Globe only when no 2-letter code). Product hero shows the state flag for US state-level products. Group/subcategory pages (`TaxLanding`) fall back to all real products when the mapped slugs match nothing (renamed slugs left the "Upcoming" pages empty) and show at most 12, live first, plus "Browse every ready-made list".

## 102. Product page facts: 40+ fields, 18 Nov 2026, 95% (Nov 2026) — owner decision, amends sections 22, 84, 96

- Owner instruction (20 Nov 2026): every product page shows 40+ data fields, "Last updated" 18 November 2026, Email "Included", the five "at a glance" cards incl. 95% accuracy with no "placeholder" wording, and a single package centred. These are OWNER-DECLARED facts, not measured by the site; the owner must make sure the files really contain them (refund policy 5% / 95% applies).
- `lib/product-fields.ts` = the field catalog (48 fields in 5 groups, `PRODUCT_VERIFIED`, `PRODUCT_ACCURACY`). `lib/catalog.ts` `allProducts()` normalises EVERY product: fields = the catalog, accuracy 95, last updated = 18 Nov 2026 unless the admin set a LATER date (`p.lastVerified > PRODUCT_VERIFIED`). Per-product fields/accuracy edits in the admin therefore no longer show publicly (remove `allProducts` normalisation to restore). `fmtDate` prints "18 November 2026". Pricing card says "48+ data fields per record"; stats card lists six names + "and more"; 1 package = centred card, 2 = centred pair; the words "placeholder" were removed from visitor-facing product text.

## 103. Menu categories, state & city tab, flags and icons (Nov 2026) — amends sections 76, 81, 85, 101

- Lists menu (owner, 20 Nov 2026) now has exactly nine entries: Business Email Lists, Consumer Email Lists, Phone Number Lists, Job Title Lists, WhatsApp Numbers List, Management Levels, State & Cities, Job Functions, Healthcare Lists. New built-in taxonomy groups `business-email-lists`, `consumer-email-lists` (upcoming, consumer rules), `healthcare-lists` (appended at the END of `TAXONOMY`; an imported D1 tree gets them through the `loadTaxonomy` merge).
- Products per category: `lib/taxonomy-products.ts` `poolFor` (rules over product name, category name, channel, state/city) feeds `TaxLanding`; order = rule pool, then admin-mapped slugs, then all real products. Consumer, phone and WhatsApp products are RESTRICTED drafts from the WooCommerce import: they show on their category page only after the owner publishes them (restricted override in /admin/products); until then the page shows the general ready-made lists. `ShopProduct` gained `channel` and `region`.
- /lists: the location explorer now includes every country that has a published product (it listed only US and Germany); the "City" tab is "State & City" (`productKind`: city scope OR a state/region). The source export holds only about two real city lists (Berlin, San Diego), so "city" alone was always thin.
- `Flag` uses a file only if it exists (`lib/flag-codes.ts`; EUR -> eu, UK -> gb); Worldwide, GCC, APAC, MENA, AFR, LATAM show a globe (a broken image was shown before). `DbBadge` shows the state flag for US state products. `IndustryIcon` picks the most related lucide icon by keyword rules over the category slug (dental, healthcare, real estate, crypto, legal, ...), falling back to a briefcase.

## 104. Shared categories by audience; shorter database rows; homepage paths section (Nov 2026)

- `categoryForSubject` (`lib/import/seo-text.ts`) maps a list's audience (name minus country/state/channel words) to ONE shared category (Dentists, Restaurants, Ski Shops, Chiropractors, Veterinarians, Pharmacies, Eye Care Providers, Mental Health Professionals, Nurses, Clinics and Hospitals, Doctors and Specialists, Wellness Providers). Applied at load time in `toCatalog` (so every country's dentist list sits under the built-in `dentists` category immediately) and persisted by `/admin/products/seo` "Move products from catch-all categories" (`applySeo`; "Healthcare Professionals" and "Targeted Email Lists" are now catch-alls). Other subjects keep their own category.
- Category pages: database rows show 6 fields + "+N more", status "Available"/"Preview", at most 8 rows then "See every <industry> database" (/lists?industry=). The "Package sizes and prices appear here once this list goes on sale." and "Preview build ..." sentences were removed.
- Home "Ready-made or custom" section: two detailed cards (five facts each, "Best when", CTAs). Facts used: masked sample, 48+ fields (owner-declared, section 102), pay once in crypto, CSV/Excel/TXT, delivery mostly instant up to 12 h, 5% replacement promise; custom: four steps, quoted separately, reference number.
- Product pages show counts of one million or more as 1M+ / 10M+ (rounded down) via `fmtNum` (hero, stats, sample note, related cards, package cards); below that the full number. Generated description text keeps its stored wording.
- Icons: `IndustryIcon`/`DbBadge` take a `hint` (the product name) in addition to the category slug; keyword rules match at word starts (so "education" is not a cat, "spain" is not a spa) and cover whatsapp/phone/consumer/cafe/bakery first.
- Home "Explore available lists" shows at most 8 lists (live first, one per industry+country), each with its own country/state flag and industry icon, no field list. Everywhere a field list was printed as text (meta descriptions, FAQs, cards, pricing, geo pages) it now uses `fieldSummary` (first 6 + "and N more") because every product carries 48 fields (section 102).
- /lists "Country" tab (`productKind`) now includes every whole-country database: categories business, business-email-lists, consumer-email-lists, phone-number-lists (before, only the Germany list qualified).
- Owner (20 Nov 2026): 'Upcoming' chips and 'not on sale / we do not sell WhatsApp' wording removed from category pages (taxonomy FAQs, compliance notes, category-copy); copy now says we sell these lists and asks buyers to follow lawful-use/WhatsApp rules. /data-sources FAQ uses SolutionFaq (homepage style). Admin status field still exists.
- Header nav (20 Nov 2026): Lists, Solutions, Data Reseller Partners, Blog, Help Center (How it works / Compare removed from the header; still in footer). Owner rule: no 'not on sale / upcoming / we do not sell' wording; copy says 'Yes, we sell...' with lawful-use reminders. /data-sources hero has more top spacing.
- Owner (20 Nov 2026): restricted-flagged imported products (consumer, phone, EU/UK...) CAN now be published; `publishBlockers` no longer blocks on restricted (flag stays informational; price still required). Legal (GDPR, CASL) and Help Center articles say we sell US/EU/UK/Canada lists. OWNER/LAWYER must still confirm the lawful basis for non-US and consumer data.

## 105. BeigePilot AI assistant, Phase 1 of 3 (Nov 2026)

- Owner brief "BeigePilot AI" (20 Nov 2026), 3 phases. Owner decisions: keyword search first (no embeddings, no new paid service); the owner sets secret `BEIGEPILOT_KEY_SECRET` (32+ chars) in the Cloudflare dashboard; provider API keys are stored AES-GCM encrypted in D1 (`lib/beigepilot/secret.ts`), write-only in the admin (only `••••last4` is shown), never returned by any API.
- Migration `0037_beigepilot.sql` (MUST be run in D1 before deploy; 3 statements, one per message): `beigepilot_providers`, `beigepilot_settings`, `beigepilot_usage`. Before it exists the widget is off and admin pages say so.
- Code `lib/beigepilot/*`: `providers.ts` (OpenAI / Anthropic / Gemini over plain fetch: model list for "Test & load models", tool-calling normalised), `tools.ts` (9 READ-ONLY tools over the real catalog, Help Center and published legal pages; placeholder/draft lists never expose counts or prices; no tool orders, writes or returns download links), `chat.ts` (grounded system prompt, 4-step tool loop, output link allow-list, usage logging, optional fallback provider), `store.ts` (settings, providers, usage, daily request/token and monthly spend limits). Cards come only from `showProductCards` with validated slugs. Admin style notes are appended with LOWER priority than the safety rules.
- Public: `POST /api/beigepilot/chat`, `GET /api/beigepilot/config` (enabled + greeting only). Widget `components/beigepilot/widget.tsx` (mounted in `app/layout.tsx`; hidden on /admin and /checkout; page-aware opening question; sessionStorage only; Close clears the chat). Conversations are NOT stored on the server yet (the `saveChats` setting is unused).
- Admin `/admin/beigepilot` (sidebar "BeigePilot AI"): Overview + checklist, AI Providers (key, model, temperature, max tokens, optional token prices for cost estimates, active + fallback, limits), Appearance & Behavior (on/off, greeting, style notes), Testing & Playground (provider override, tool trace, tokens; 10 example test questions listed, not automated).  ("Phase 2/3"). Changes audited (category beigepilot).
- Phase 2 (NOT built): knowledge base (keyword search), custom FAQs and restricted claims, handoff form with consent, unanswered questions, leads. Phase 3: analytics, conversation history + retention/deletion, satisfaction feedback, automated test cases.
- Honesty/open: chat text is sent to the chosen AI provider; the privacy policy does not mention the AI chat yet (owner text needed before launch). Cost figures need the owner's token prices. Tests: `tests/beigepilot.test.ts`. Not browser-tested: widget against a real provider, admin screens behind Access.

## 106. BeigePilot Phase 2: knowledge, unanswered questions, handoff (Nov 2026)

- Migration `0038_beigepilot_knowledge.sql` (MUST be run in D1; 3 statements, one per message): `beigepilot_knowledge`, `beigepilot_unanswered`, `beigepilot_leads`. Before it exists chat still works; admin pages show a notice and the handoff form fails.
- Knowledge (`lib/beigepilot/knowledge.ts`, `/admin/beigepilot/knowledge`): the owner's own entries, kind `faq` (an answer BeigePilot may use, found by the new tool `searchKnowledge`, plain keyword scoring, no embeddings) or `restricted` (a claim it must NEVER make; injected into the system prompt, max 30). Draft/published; only published entries are used (KV `beigepilot:kb:v1`, 60 s). Only beigeleads.com links allowed in answers. Help Center and legal pages need no sync: they are read live (the page shows counts).
- Unanswered (`lib/beigepilot/leads.ts`, `/admin/beigepilot/unanswered`): logged when the assistant had to hand off (`suggestContact`) or no knowledge/help match existed, never from the admin playground. Question text only, max 200 chars; anything with an email, phone-like number or key is refused. Repeats are counted (`qkey` unique); a resolved question reopens when asked again; "Write answer" opens the knowledge editor prefilled and marks it resolved on save; purged after 180 days by the 15-minute cron.
- Handoff: the chat's "Contact Our Team" opens a form (`ApiForm`, new `checkbox` field type) -> `POST /api/beigepilot/handoff` via `handleForm` (honeypot, Turnstile, 5/h/IP). Consent checkbox is REQUIRED. Saved first (`beigepilot_leads`, reference `BP-XXXXXXXX`), then owner alert (uses the Contact notification toggle/recipients) and a plain confirmation to the visitor; results stored. Admin `/admin/beigepilot/leads`: status New/Contacted/Closed, internal note, delete.
- Still NOT built (Phase 3): conversation history + retention, satisfaction feedback, analytics, automated playground test cases. Privacy policy still has no AI-chat or handoff text (owner text needed). Tests in `tests/beigepilot.test.ts` (search scoring, entry validation, private-text refusal, consent, local D1 storage). Not browser-tested: widget handoff form with real Turnstile, admin screens behind Access.
- Fix: Routing/Behavior forms are now controlled inputs and show the saved active provider (React resets uncontrolled fields after a form action).

## 107. BeigePilot Phase 3: history, ratings, analytics, test cases (Nov 2026)

- Migration `0039_beigepilot_history.sql` (MUST be run in D1; 4 statements, one per message): `beigepilot_conversations`, `beigepilot_messages` (+ index), `beigepilot_feedback`. Before it exists chat works and ratings/history are silently skipped.
- Conversation history (`lib/beigepilot/history.ts`, `/admin/beigepilot/conversations`): OFF by default (setting `saveChats`, toggle + retention 30/90/180/365 days in Appearance & Behavior). When on, the widget tells visitors "Conversations may be stored to improve the service" (config route returns `saving`). Visitor text is `redact`ed (emails, phone-like numbers, key-like strings) before saving; assistant text is saved as sent. The admin playground and test runs are never saved. Admin: list (all / asked for a human), read one, delete one, delete all (ticked confirmation); the 15-minute cron `purgeHistory` removes conversations past retention (and ratings older than a year).
- Satisfaction: thumbs in the widget -> `POST /api/beigepilot/feedback` (same-origin, 60/h): stores only random chat id, answer number, rating, day (works even when history is off). Analytics `/admin/beigepilot/analytics`: answers per day (14 days), helpful %, handoff requests, open unanswered, month tokens/cost; everything from real tables, no estimates; conversion to orders is NOT measured.
- Automated test cases: `lib/beigepilot/cases.ts` (10 cases + pure `evaluate`), run from the Playground by "Run all tests" (one server action per case with the real provider, pass/fail reasons: tool used, no leaked instructions, no invented code/price, human offered for orders). They use tokens.
- BeigePilot is feature-complete per the 3-phase plan. Open: privacy policy text for the AI chat, handoff form and saved conversations (owner text needed before launch). Tests: `tests/beigepilot.test.ts` (22). Not browser-tested: widget thumbs, admin screens behind Access, test runner against a live provider.

## 108. BeigePilot redesign: Pilo, the animated assistant (Nov 2026) — supersedes the widget UI of sections 105-107 (backend unchanged)

- Owner brief "Redesign BeigePilot - Premium Animated AI Companion" (20 Nov 2026). No migration, no new env vars, no new dependency. Owner's brief mentioned Framer Motion; NOT added (stack rule: no new dependency without asking, project motion is CSS-only). Pilo is pure SVG + CSS.
- Mascot `components/beigepilot/pilo.tsx` (original character: forest body, cream face screen, purple antenna orb, chest = lead dot + record bar like the logo; palette tokens only) + `.pilo-*` CSS in `app/globals.css`. 12 moods: idle, wave, curious, nod, think, search, found, confused, error, success, point, bye; idle micro-motions: float, breathe, blink, glance, antenna twitch, arm fidget, orb glow, hover wave on the launcher. Intensity Calm/Balanced/Lively (`data-motion`); everything is off under `prefers-reduced-motion`. Verified in a browser (all 12 moods on one sheet).
- Moods follow REAL states only: opens -> wave; text typed -> curious; sent -> nod; request running -> think; a catalog tool is actually running -> search (see streaming); answer has product cards -> found; answer had no match (`miss`) -> confused; add to cart from a card -> success; card hover/package click -> point; failure -> error; close/minimize -> bye (650 ms before the panel hides).
- Streaming status: `POST /api/beigepilot/chat` with `Accept: application/x-ndjson` returns one JSON line per step (`{t:"tool",name}`, then `{t:"done",...}` or `{t:"fail"}`); without that header the old JSON response still works. `chat()` got an optional `onTool` callback; `ChatOut` has `miss` and `tools` (names only). The widget shows "Searching the catalog..." only when a catalog tool is really running.
- Widget: `widget.tsx` = small launcher shell (mini Pilo, hover wave, one welcome tooltip per session, left/right, lifted above the cart bar); `panel.tsx` (lazy `next/dynamic`, loaded on first open, state kept while minimized). Welcome (Pilo + "Hey there! I'm {name}." + 4 cards), context quick questions (`lib/beigepilot/suggest.ts`: database page, cart, home/other; admin list overrides the home set), follow-up chips, compact bubbles with avatar, product cards (`product-card.tsx`: industry icon + flag, contacts, packages, starting price, last updated, Get This List / View Details / Request a Sample; real data only), floating composer (Enter sends, Shift+Enter newline, spinner, disabled while sending), info panel for the privacy text (the footer disclaimer was removed; the "Conversations may be stored" line stays under the composer when history is on), mobile full-screen that follows `visualViewport` (keyboard-aware), Escape = minimize, focus management.
- Errors: ONE banner at the end (never appended to the chat list), with Retry (resends the same question) and Contact Support (the existing consent handoff form). Status dot shows Online / Having trouble from real request results. The widget stays hidden unless the config says enabled AND the active provider really has a key and a model (`/api/beigepilot/config`, cache key `beigepilot:config:v2`, cleared on provider/settings save), so it never accepts messages it cannot answer.
- Admin (Appearance & Behavior): display name (default Pilo), welcome message (the old default greeting is treated as the new default), suggested questions (max 4 x 60 chars), humor level Professional / Friendly / Playful, mascot intensity, launcher position, on/off. Stored in `beigepilot_settings` (key/value, no migration). `buildSystem` adds the personality rule by humor level plus fixed limits (never joke about payments, privacy, security, accuracy, refunds, legal); these sit below the grounding rules.
- Wording decision: the card "Find my ideal audience" is written "Find my ideal prospects" (section 84 rule). The "Hey there! I'm Pilo. 👋" headline keeps the owner's emoji.
- Diagnostics: the chat route stores the reason of the last public failure in KV `beigepilot:lasterr`, shown on the admin Overview ("Last visitor chat failure"). The original production "not available right now" cause is still unconfirmed; read that box after a failed visitor message.
- Tests: `tests/beigepilot.test.ts` (suggestions per page, follow-ups, admin suggestion parsing, humor prompt + limits). Browser-checked locally with mocked API at 1280 and 375 px (launcher + tooltip, welcome, streamed search, found + card, add to cart, error + retry, no-match, no horizontal scroll, no JS errors). NOT checked: real provider streaming on Cloudflare, real touch keyboard, screen reader, Lighthouse, admin form behind Access. Stale Turbopack CSS hid new rules once: restart `next dev` and delete `.next` after big globals.css edits.

## 109. Pilo v2: a soft creature, minimal chat, reasoning-model fix (Nov 2026) — supersedes the look of section 108 (its behaviour notes still apply)

- Owner brief (20 Nov 2026): Pilo must be a cute funny friend, NOT a robot: no antenna, circuits or tech look. `components/beigepilot/pilo.tsx` was redrawn: forest-green bean body, cream belly, big white eyes with moving pupils, lavender cheeks, stubby mitten hands, tiny feet, a leaf sprout on top (brand palette only). Same 12 moods plus `giggle` (real triggers: the visitor says thanks/laughs (`isCheer`) or rates an answer helpful). CSS classes renamed (`.pilo-pupil`, `.pilo-sprout`; `.pilo-eyes` transform, antenna and orb rules are gone).
- Welcome screen is minimal: large Pilo, "Hiii! 👋 I'm {name}!", the admin welcome line (default "Who are we finding today?"; both older default greetings are treated as the default), three tiny chips (Find contacts, Explore lists, Ask {name}; the last only focuses the box) and the composer. Removed: four cards, context question chips, follow-up chips, privacy footer (it lives in the (i) panel with "Start a new chat"), minimize button (X minimizes; the chat is kept until "Start a new chat"), rating row on old answers (thumbs only on the latest answer), caption text while thinking (sr-only now). Product cards are compact (Get This List, View Details, small "Free sample" link). `lib/beigepilot/suggest.ts` now holds only the chips and `isCheer`. Admin welcome suggestions: max 3 (replace the defaults).
- Voice: `buildSystem` has HOW YOU TALK (friend, not corporate, never mentions robots), ONE QUESTION AT A TIME and REACT NATURALLY rules (country flag, "Berlin it is! ✨ Here's what I found" then showProductCards). Humor levels rewritten (professional = no jokes, no emojis; friendly = one emoji at most; playful = a quick aside about one reply in three); the fixed limits (never joke about payments, privacy, security, accuracy, refunds, legal) and the grounding rules are unchanged and higher priority. Error copy: "Oops, I tripped over my own feet. Let's try again."
- ROOT CAUSE of the production "not available right now" (found via the Overview "Last visitor chat failure" box: "The assistant returned no text"): `gpt-5` is a reasoning model; `max_completion_tokens` (default 700) also pays for hidden reasoning, so after tool calls the visible answer came back empty. Fix in `lib/beigepilot/providers.ts`: reasoning models (o-series, gpt-5 except `*chat*`) get `reasoning_effort: "low"` and a budget of at least 4000; an empty answer with `finish_reason: length` now raises a clear error ("raise Max tokens"); Gemini `maxOutputTokens` is at least 2048 (Gemini thinking models share the budget too). The playground only looked fine because its answers were short.
- Tests: `tests/beigepilot.test.ts` (chips, cheer detection, admin suggestions, prompt rules). Browser-checked locally (mock API) at 1280 and 375 px: all 13 moods on one sheet, minimal welcome, "dentists in Germany" -> one question -> "Berlin" -> real-data card, no horizontal scroll, no JS errors. NOT checked: a live gpt-5 answer after the fix (needs deploy), real touch keyboard, screen reader.

- Stale category wording (20 Nov 2026): the old "not on sale yet / open for custom requests" text kept showing on category pages (e.g. Phone Number Lists) because an earlier "Import built-in categories" had copied it into D1 `taxonomy_nodes`, and after an import the database is the single source of truth (section 77). `freshenStaleText` in `lib/taxonomy-store.ts` now replaces stored short/blurb/content that match the removed wording (`not on sale`, `open for custom requests`, `we do not sell`, `not available yet`) with the built-in text of the same category (or a neutral line) every time the tree loads; good text is never touched. The built-in industry blurb was reworded too. Test: `tests/taxonomy-admin.test.ts`. Live within about a minute of deploy (tree cache is 60 s).

- Overview failure note (20 Nov 2026): the "Last visitor chat failure" box on `/admin/beigepilot` is cleared (`beigepilot:lasterr` KV key deleted) by every successful visitor answer, and its time is shown in UTC. A visible note therefore means a failure that has not been followed by a good answer.

## 110. Pilo v3: a creature, peeking launcher, minimal welcome (Nov 2026) — supersedes the visuals of sections 108 and 109 (behaviour notes still apply)

- Owner brief (21 Nov 2026): Pilo must not look like a robot sticker. `components/beigepilot/pilo.tsx` was redrawn as an original soft beige creature: squircle "dumpling" body with a folded paper-corner ear (echo of the logo tag), glossy dark-green eyes, brows, lavender cheeks, mitten hands, tiny forest feet, radial-gradient shading (no SVG filters). Palette tokens only. 19 moods (the old 13 plus wink, dance, sleepy, surprised, silly, excited); `crop="avatar"` shows head and body without feet; `peek` rests the arms. Gradient ids use `useId`. CSS is the `.pl-*` block in `app/globals.css` (squash-and-stretch jump/land, anticipation, glance, blink, breathing only; no constant bouncing); all off under reduced motion. The old `.pilo-*` CSS is gone.
- Gaze: `components/beigepilot/use-gaze.ts` writes `--lx/--ly` CSS variables straight to the DOM on rAF pointermove (no React re-render; touch and reduced motion ignored). Used by the launcher and the welcome Pilo; typing makes Pilo look down.
- Launcher (`widget.tsx`): no round button, no tooltip. Pilo peeks over the bottom edge (`.pl-dock`, clip-path ledge, hands on the ledge). Poses away/rest/up/duck/leap/return; first visit slides up and waves; hover (mouse only) = up + wave + looks at the cursor; every 9-18 s (not while hovered, not when the tab is hidden, not under reduced motion) one small moment: wink, silly face, curious tilt, little dance, sleepy blink, surprise, giggle or ducking and peeking back. Click = squash, leap, panel opens and Pilo lands inside it; closing = Pilo returns to the corner. On /cart mobile the dock sits above the sticky bar.
- Panel welcome: Pilo 176 px, "Hiii! I'm {name}!", admin greeting, chips Find contacts / Explore lists / Ask anything (`lib/beigepilot/suggest.ts`, `chipsFor(admin)` no longer takes the name), composer. Header and message avatars use `crop="avatar"` with no circle frame. All chat, provider, streaming and admin logic is unchanged.
- Browser-checked (mock API) at 1280 and 375 px: rest, hover, open, return; mood sheet of all moods; no horizontal scroll, no JS errors. NOT checked: real touch hardware, screen reader, Lighthouse, long-run idle scheduler on production.

## 111. Local Businesses Database category (Nov 2026)

- Owner brief (21 Nov 2026): a CATEGORY REORGANIZATION of EXISTING products into `/lists/local-businesses-database`. Nothing is created, duplicated or deleted; a move only changes `category_slug/category_name` in `catalog_products` (id, slug, URL, price, packages, delivery link, SEO, orders untouched).
- Migration `0040_category_moves.sql` (MUST be run in D1 before the tool can move anything; 1 statement): `catalog_category_moves` (one log row per moved product, batch id, previous category, `rolled_back_at`).
- `lib/import/local-business.ts` (pure, tested): `classifyLocal` = move | review | keep from the product's own name. Moves only local-establishment lists (restaurants, hotels, salons, gyms, dentists/vets/pharmacies, trades, cleaning/landscaping, auto, local retail, real estate agencies, local accounting/legal/insurance, other local services). Broad B2B, job-title, technology, consumer, role/owner-based and mixed lists are kept or sent to manual review.
- `lib/import/local-move.ts` + admin `/admin/products/local-businesses` (link on `/admin/products`): scan (ALL products, built-ins included), preview table (product, current category, proposed category, reason), two-step Apply (re-classified on the server; "review" items only when ticked), built-in code products are copied into D1 under the SAME slug first (no duplicate), batch list with Roll back. Audited (category catalog-import).
- Guards so the move sticks: `toCatalog` and `applySeo` (categories option) skip products in `local-businesses-database`; the slug is reserved (`reservedSlugs`). Future products are never auto-moved: they keep their category until an admin runs the tool.
- Page `components/category/local-businesses-page.tsx` (hooked before `getCategory` in `app/lists/[category]/page.tsx`): hero, database preview (real masked sample or "request a free sample"), browse by industry (from `classifyLocal` of the moved products), browse by location, all moved products as `ListCard`, why BeigeLeads, 6 FAQs, final CTA. With zero moved products it shows an honest empty state and is `noindex`. Sitemap lists it only when products exist. Menu: fixed "Local Businesses Database" entry (column 1, 4th row). SEO registry lists it.
- Emptied built-in industries (e.g. Dentists after the move): `/lists/<industry>` with no products now 404s (the site redirects 404s to /lists) and the industry disappears from `/lists` filters and the sitemap.
- NOT done from here: the real scan, counts and move run against production D1 when the owner presses the tool (no production access in the build environment). Tests: `tests/local-business.test.ts`, `tests/local-move-e2e.test.ts`.

- Lists menu (21 Nov 2026): twelve entries, four per column. Added "Real Estate Lists" (`/lists/industry-databases/real-estate`) and "LinkedIn Lists Databases" (`/lists/linkedin-lists-databases`), both fixed entries without a taxonomy group (always shown). The LinkedIn mark is an own outline glyph (`LinkedInMark` in `components/lists/tax-icon.tsx`, lucide has no brand icons). Check that `/lists/linkedin-lists-databases` resolves (imported category or product); the menu links to it as given by the owner.

## 112. Reorganize General Targeted Lists (Nov 2026) — extends section 111

- Owner request (21 Nov 2026): move local business, healthcare, webmail and crypto lists out of "General Targeted Lists". Same reversible mechanism and migration as section 111 (`catalog_category_moves`, 0040; nothing new to run). Admin `/admin/products/reorganize` (link on `/admin/products`): scans every product, shows those whose EFFECTIVE category (after the load-time audience remap in `toCatalog`) is General Targeted Lists, with product ID, title, current category, proposed category, reason and confidence (high / review / stay); "Download audit report (CSV)"; high-confidence moves are selectable, "review" ones only when ticked; two-step apply; batches roll back with the Local tool's roll-back (same log).
- `lib/import/reorganize.ts` (`classifyGeneral`, pure, tested): order webmail > crypto > healthcare > local; clear audience words only, ambiguous mixes (business owners with Gmail, healthcare software/insurance, general "health/wellness") are `review`. Destinations: Local Businesses Database (section 111), Healthcare Lists (`healthcare-lists`), Webmail Lists (`webmail-lists`), Crypto & Blockchain (`crypto-blockchain`); an existing category with the same meaning (stored name) is reused instead of creating a duplicate (`resolveDests`).
- `PROTECTED_CATS` (those four slugs) are skipped by the load-time audience remap (`toCatalog`) and by the SEO category pass (`applySeo`), and are reserved slugs, so a moved product stays put. Lists already filed elsewhere by the remap (e.g. Dentists, Doctors and Specialists) are NOT in General Targeted Lists any more and are not touched.
- `/lists/healthcare-lists` is a taxonomy group page (rules over product names); `webmail-lists` and `crypto-blockchain` render as imported categories. The sitemap now lists each URL once. Fixed the duplicated heading ("General Targeted Lists Lists"): `listsLabel` in `components/category/imported-page.tsx` is used for the H1, metadata title, FAQ, JSON-LD and body copy.
- Not possible from here: the real scan and counts run in production D1 when the owner presses the tool. Tests: `tests/reorganize.test.ts`, `tests/reorganize-e2e.test.ts`.

- Exhibitors (21 Nov 2026): the same Reorganize tool (`/admin/products/reorganize`) has a fifth destination, `exhibitors-email-lists` ("Exhibitors Email Lists"): any product whose NAME contains "exhibitor(s)" is a high-confidence move, whatever its current category (not only General Targeted Lists). Slug is protected from the load-time remap and reserved. Once moved it is an imported category, so it shows on `/lists` (industry filter, directory, category page) automatically. Same reversible log (migration 0040). The real move runs when the owner presses the tool.
- "Stay" products (21 Nov 2026): the Reorganize tool also proposes an OWN category for every General Targeted Lists product that matches no destination: named after the list's audience (`subjectOf`; e.g. "USA Arborists Email List" -> "Arborists"), an existing category with the same meaning is reused, else a new one is created (slug avoids reserved names). Shown in the Stay tab with the proposed category, selectable ("Select all Stay products"), same reversible log (reason "Own category by audience"). New categories show up in `/lists` industries automatically (imported categories).
- 21 Nov 2026: ISP mail brands (Comcast, Xfinity, Verizon, SBCGlobal, BellSouth, EarthLink, Optonline) count as webmail; Arborists, Architects, Astrologers/psychics, art dealers and galleries, auctions, interior designers, tailors, antique dealers count as local businesses (so they no longer fall to "Stay" / an own category).
- Pilo product cards (21 Nov 2026): each package pill (e.g. "Complete · $99") is a buy button: it puts that product + package in the cart and opens `/checkout/cart`. The widget is hidden on checkout pages.

## 113. Sales features, Phase 1: Buy More Save More + Second Purchase Offer (Nov 2026)

- Owner brief (21 Nov 2026), delivered in phases (Phase 2 = Team Purchase Requests, not built yet). Migration `0041_sales_features.sql` (MUST be run in D1 before deploy; 4 statements, one per message): `promotions.bound_email`, `promotions.origin` (default 'admin'; reward codes use 'reward'), table `reward_codes` (UNIQUE email, first_order_id, code). 0040 got a trailing `;` so test helpers can concatenate migrations.
- Settings (`lib/sales/settings.ts`, `system_settings` keys `sales.volume` / `sales.reward`, KV 60 s, audited, never throw): volume tiers default 2 -> 15%, 3-4 -> 35%, 5+ -> 45% (owner), exclusions by product/category, `stackWithPromos` false. Reward: 50%, 14 days, max discount $100, min order, product/category scope, `combineVolume` false, reminders at 5 days and 48 h before expiry.
- Volume discount = a post-step of the promo engine (`volumeInfo`/`applyPromotions`), so the cart price API, `createOrder` and (Phase 2) team requests use the same code. Counts DISTINCT eligible lists. Priority: partner code alone > any code/promotion replaces volume unless stacking is on > volume. Crypto amount derives from the discounted total.
- Reward (`lib/sales/reward.ts`): `issueReward` is called from `deliverOrder` after payment (never blocks delivery). Claim-first insert under the unique indexes = one code per customer ever, race safe; first PAID order only (earlier paid orders count). The code is a `promotions` row bound to the buyer's email (usage limit 1), so the existing reserve -> redeemed -> released lifecycle applies (failed/expired checkout frees it). Emails via templates `reward_first`, `reward_reminder`, `reward_expiring` (category Sales Features); status `sent` only when the email service accepted it. Checkout page says "personal 50% OFF code" only when the reward exists AND its email was accepted. Reminders: 15-minute cron `sendRewardReminders`, stop when used/revoked.
- OWNER DECISION / RISK: reminder emails carry NO unsubscribe link (owner, 21 Nov 2026). Marketing-style reminders to customers without an opt-out can breach CAN-SPAM/GDPR; consider an opt-out or transactional-only wording.
- UI: cart `components/cart/volume-ladder.tsx` (ladder, progress bar, "Add N more database(s) to unlock X% OFF"), summary row "Buy More, Save More", one-line hint on product pricing. Admin: `/admin/sales` (+ `/volume`, `/reward` with settings, issued-codes table with masked emails, Revoke, Resend first email); sidebar entries. Reward code is typed in the existing cart code box with the buyer's email.
- Tests: `tests/sales.test.ts` (tiers, progress, exclusions, rounding, code format), `tests/sales-e2e.test.ts` (local D1: one code per customer, no duplicates under concurrency, wrong email refused, $100 cap, reserved/released, revoke, failed email not marked sent, reminders). NOT tested: real Resend delivery, admin screens behind Access, cart ladder in a browser.

## 114. Sales features, Phase 2: Team Purchase Requests (Nov 2026)

- Migration `0042_purchase_requests.sql` (MUST be run in D1 before deploy; 1 statement): table `purchase_requests` (reference TR-XXXXX, token_hash, requester/manager, note, items_json snapshot, subtotal/discount/total cents, status pending|viewed|approved|declined|expired|paid|cancelled, expires_at, reminder/notified timestamps, real email statuses). No other migration, no new env vars.
- Flow (`lib/sales/team.ts`): cart and `/checkout/cart` show "Request manager approval" (`components/cart/team-request.tsx`, native dialog + `ApiForm`: honeypot, Turnstile, 5/h/IP via `handleForm`, which now also lets a handler return `{ error }` as a 400 with a plain message). The server prices the cart (same engine incl. Buy More, Save More), stores a snapshot, creates a 64-hex secure token (only its salted hash is stored) and emails the manager the link + the requester a confirmation. The same open request (same people, same databases) returns the existing one with no second row/email. Requester and manager cannot be the same email.
- Manager page `/purchase-request/[token]` (noindex, no-referrer, dynamic, not edge-cached): the manager must type the email the request was sent to (`/api/purchase-request/manager`, same-origin, rate limited per IP and per token). "Approve & Pay" re-prices on the server: if the total differs from what the manager saw, nothing is created and the new total is shown first. Approval calls the normal `createOrder` with the MANAGER's email (so the manager is the customer and the delivery email goes to the manager), then the browser goes to the normal `/checkout/<orderId>`. Approving again returns the same open order. Decline (optional reason) and expiry close the request for good.
- PAID is never set from a redirect or by an admin: `deliverOrder` calls `onOrderPaid`, which checks the order's own `paid` status (network-confirmed or the existing manual-evidence flow) before marking the request paid and emailing both people once. Admin has Cancel and Resend (resend rotates the token) only.
- Cron (15-minute): `sweepRequests` expires requests after 7 days (requester told once) and sends the manager a reminder 48 h after creation (once; it carries a NEW link because only a hash is stored, so the first email's link then stops working and says "not valid, or a newer email replaced it"). Constants `REQUEST_DAYS`, `REMINDER_HOURS` in `lib/sales/team.ts` (not editable in the admin).
- Emails (8, category Sales Features, branded, editable/test-sendable in System Emails): `team_request_sent`, `_manager`, `_reminder`, `_approved`, `_declined`, `_expired`, `_paid_requester`, `_paid_manager`. New variables: requester_name, manager_name, request_url, request_note, request_items, request_total, request_expiry, decline_reason.
- Admin `/admin/sales/team` (admins; sidebar "Team Purchase Requests"): table with status, totals, real email statuses, Resend to manager, Cancel (audited).
- Honest limits: a team request never carries a promo or reward code (the manager's automatic promotions and Buy More, Save More apply at approval); the customer on the order is the manager; there is no per-request partner discount. Not tested: real Resend delivery, admin screen behind Access, the cart dialog in a browser (Turnstile). Tests: `tests/team-e2e.test.ts` (local D1: snapshot, hash-only token, duplicate guard, wrong email, stale total, same order on re-approve, paid only from the real order, decline, reminder once, expiry once, cancel).

## 115. /team-purchase-requests landing page (Nov 2026) — extends section 114

- Owner brief (21 Nov 2026). Informational page for the existing Team Purchase Request feature; NO new backend, migration or env var. `app/team-purchase-requests/page.tsx` + `components/team-requests/sections.tsx` + copy in `lib/team-requests-content.ts` (FAQs and steps describe what the code really does). Sections: hero (forest panel, "How It Works" anchor), 4 steps, employees vs managers, static illustration of the manager review page (labelled illustrative, buttons not clickable), 4 benefits, 8 FAQs (`SolutionFaq`, FAQPage JSON-LD), final CTA.
- Honest deviations from the brief text: the delivery email goes to the MANAGER who paid (the order customer), who can forward the links; "no personal payment card" became "nothing is charged to you" (checkout is crypto); "payment receipts" = confirmation email; validity is 7 days (`lib/sales/team-constants.ts`, split out of `team.ts`, re-exported); promo and reward codes do not carry into a team request.
- Links: footer Resources "Team Purchase Requests", "How team requests work" under the Request manager approval button (cart AND checkout use the same `TeamRequest` component), sitemap, SEO page registry. Footer CTA band hidden on the page. The page sets no robots tag, so the site-wide noindex still applies until launch (the brief's "ensure indexable" cannot override it).
- Browser-checked locally at 1280 and 375 px (no horizontal scroll, anchor scroll, FAQ open/close, link targets).

## 116. BeigePilot Sales Assistant: finder, cart, budget, support tickets (Nov 2026) — extends sections 105-110

- Owner brief (21 Nov 2026), built INSIDE the existing assistant (no second chatbot, no customer dashboard). Migration `0043_beigepilot_support.sql` (MUST be run in D1; 2 statements, one per message): `beigepilot_leads.summary` and `customer_email`. Before it exists tickets still save (without the summary) and the admin page still works.
- Admin: `/admin/beigepilot/sales` (tab "Sales Assistant"; settings keys `saFinder|saCart|saBudget|saHandoff|saMaxRecs|saAlternatives|saVolume|saUnavailable|saSupportEmail|saAckNote` in `beigepilot_settings`, parsed by `parseSales`, saved by the existing `saveSettingsAction`). Switches remove the tools from the model AND `runTool` refuses them. Config cache key is now `beigepilot:config:v3` (carries the four switches so the widget hides chips).
- Finder: `searchProducts` gained `minRecords` (a list must really have a package or total of that size), respects max recommendations, related alternatives and "show unavailable" (default off: lists not for sale never get an Add to Cart). Prompt rules added in `buildSystem` per feature.
- Budget: `lib/beigepilot/budget.ts` (pure, tested) + tool `findWithinBudget`: packages that fit, "maximum contacts", several databases planned with the REAL `priceCart` (Buy More, Save More only when enabled in Sales AND in the assistant settings; promo codes never included). Cards arrive with the chosen package. When nothing fits, the cheapest list is shown as OVER budget with the difference. The chat shows a "Your plan" box (estimate; the cart checks it again).
- Add to cart: tool `prepareAddToCart` only SHOWS the card (package preselected when known, otherwise the visitor must choose; one package = preselected). The assistant cannot add anything. The visitor presses Add to Cart; the browser first asks `/api/cart/price` (server re-prices, refuses unknown package or placeholder list), then calls the normal `cartActions.add` (same duplicate rule: one line per list, max 10). Confirmation shows list, package, price, cart item count, View Cart and Continue Shopping (collapses the note). CHANGE: package pills no longer jump to checkout (section 112 behaviour replaced); they select a package, and the purple button is "Add to Cart".
- Welcome actions (when the admin has no custom suggestions): Find a Database and Shop by Budget (start a chat), View My Cart (opens `/cart`), Contact Support (opens the form directly, no AI call). Hidden per switch.
- Support tickets: ticket id = the existing `BP-XXXXXXXX` reference. Form adds a separate consent checkbox "Share a short summary of this chat" with a preview; without it NO summary is sent or stored (server also redacts emails/numbers). Success shows the reference only after the server saved the ticket; failure text per brief. Same email + same message within 10 minutes = same ticket, no second email. Emails (plain text through Resend, logged in `email_delivery_logs` as `beigepilot_support_owner` / `beigepilot_support_ack`): owner "New BeigePilot Support Request — {ticket}" (to `saSupportEmail`, else the contact notification address) with a sign-in-only admin link (no customer data in URLs), customer "We've Received Your BeigeLeads Support Request" (no response time promised; optional extra line from the admin). Failure of either email keeps the ticket; admin sees `sent/failed/skipped` and can retry each. Statuses New / In Progress / Resolved / Closed (old `contacted` shows as In Progress). Admin page renamed "Support Requests". NOT built: agent assignment (no agent accounts exist), a link to the full chat transcript (only the consented summary is kept).
- Not browser-tested against a real AI provider (chat was mocked): tool-calling behaviour of the model, real Turnstile/Resend, admin screens behind Access. Tests: `tests/sales-assistant.test.ts` (budget maths, tools, switches, ticket + email flow on local D1), `tests/beigepilot.test.ts` updated for the four chips.

- Category pages list EVERY product (owner, 21 Nov 2026): the caps of 12 (group/subcategory/country pages, `tax-landing.tsx`), 8 (industry pages, `pages.tsx`) and 48 (imported categories, `imported-page.tsx`) and their "Browse every ready-made list" links were removed. Sample rows on group pages still come from the first 12 products only, to keep the page light. Very large categories now render one long page; add paging if it gets slow.

## 117. Checkout redesign, /ai-assistant page, category pagination (21 Nov 2026)

- `/checkout/cart` (`app/checkout/cart/page.tsx`, `components/cart/checkout-form.tsx`): heading "Complete Your Purchase", Cart > Checkout > Payment indicator, 1200 px container, 58/42 grid (summary first on mobile, sticky on desktop). Cards: 1 Delivery Details (email + helper), 2 Payment Method (radio cards for every option in `OPTIONS`, Turnstile, "Continue to Payment"), "Purchasing for Your Team?" (existing `TeamRequest` flow + link to `/team-purchase-requests`). Summary "Your Order": lines (list price), subtotal, every applied discount from the server (Buy More, Save More / promo / partner; nothing hardcoded), compact promo box above the total, total, "You're saving $X" only when the server-calculated discount is above 0. Business logic, pricing API, `/api/checkout`, partner-code rules unchanged. `ApiForm` gained an optional `render` prop for custom layouts (same Turnstile, honeypot, error, submit). Promo statuses (expired, used, invalid) are whatever message the server returns (one generic text by design, section 87/90).
- `/ai-assistant` (`app/ai-assistant/page.tsx`, `components/ai-assistant/*`, copy `lib/ai-assistant-content.ts`): landing page for BeigePilot. Every CTA/prompt card calls `openPilo()` (`components/beigepilot/open.ts`): a window event the EXISTING widget listens for (`widget.tsx`), opening the panel with a first question or the support form (`Launch` prop in `panel.tsx`). No second widget. If the assistant is off or not on the page, the button shows "isn't available right now" with real links. Visuals are labelled illustrations (no products, prices or counts). Footer Resources link, sitemap, SEO registry, footer CTA hidden. Not tested against a live AI provider (disabled locally: only the fallback path was browser-checked).
- Category product lists use `components/shared/paged.tsx` (numbered 1, 2, 3 pagination, 12 per page, client side; all products still exist in the page payload): tax-landing, industry, imported-category and Local Businesses pages.

## 118. Category editor on the product edit page (21 Nov 2026) — amends sections 96 and 104

- `/admin/products/imported/<id>` has a "Category" field (existing names suggested, new names allowed). `updateProduct` reuses a category with the same name (built-in or any product's), else creates a slug from the name; a new slug that belongs to a site page (`reservedSlugs`) is refused. The product URL does not change. The choice is stored as `manualCategory: true` in `source_json`; the load-time audience grouping in `toCatalog` (section 104) skips such products, so a manual category sticks. Bulk "Last updated" already exists on `/admin/products` (section 96). Test: `tests/import-e2e.test.ts`.

## 119. Database Bundles Marketplace (Nov 2026)

- Owner brief (21 Nov 2026). Migration `0044_bundles.sql` (MUST be run in D1 before deploy; one statement per message): `bundle_categories`, `bundles` (items as JSON references to catalog product + package, price mode percent|fixed, status draft|published, exclusions, SEO), `order_bundles` (order id, bundle slug/name, price, list total, JSON snapshot). `order_items` was NOT altered. Before the migration everything else works; bundle pages show "no bundles" and the admin shows a notice. Run 0041-0044 if not yet applied.
- Pure pricing `lib/bundles/pricing.ts` (shared by cart price API, `createOrder`, public pages, admin preview): price = percent off the listed package prices or a fixed price, always below the list total (otherwise the bundle is not purchasable / cannot be published). Component shares use largest-remainder `allocate`, so the bundle price is stored as normal `order_items` that add up EXACTLY to the order total (refunds and delivery reuse the existing order code). Record totals are shown only when every list has a real size.
- Rules: curated bundles are outside the promo engine (no volume discount, no promo or partner code on them, their lists do not count toward thresholds); other lists in the same cart price normally; a list already inside a cart bundle cannot also be bought alone or in a second bundle; max 5 bundles per cart, 2-12 databases per bundle; unpublished or changed bundles are dropped/blocked server-side; the browser sends slugs only (cart localStorage keeps bundle slugs + the cart shows a grouped item removable as a whole). Team Purchase Requests are not offered when the cart holds a bundle.
- Build Your Own Bundle (`components/bundles/builder.tsx`, `GET /api/bundles/search`): only real, on-sale lists; picks go through the existing cart and the totals come from `/api/cart/price` (same Buy More, Save More). Admin switch + excluded products at `/admin/bundles/settings`.
- Fulfilment: one payment, existing delivery code sends every list's link (waits until all have a link), idempotent as before. Analytics from paid real-money orders only (`loadStats`; test-network payments counted apart).
- Admin (admins only; sidebar "Database Bundles"): `/admin/bundles` (stats, most purchased, list, Publish/Unpublish/Duplicate/Delete; a bundle with orders cannot be deleted), `/new`, `/[id]` (form with server-side product search, package per product, price, category, label, image `/media/...`, SEO, exclusions, featured, status), `/[id]/preview`, `/categories`, `/settings`. Audited (category bundles). Cache KV `bundles:pub:v1` 60 s cleared on every change.
- Public: `/bundles` (hero, category chips only for categories with published bundles, cards with real prices/savings, builder, FAQs, JSON-LD only for real offers), `/bundles/[slug]` (breadcrumbs, included lists with links to product pages, Product/Offer JSON-LD only when every list is live and non-placeholder), sitemap lists published bundles. Site-wide noindex still applies.
- Tests: `tests/bundles.test.ts` (pure), `tests/bundles-e2e.test.ts` (local D1: create/publish/unpublish, exact charge, order_bundles identity, duplicate protection, mixed cart, delivery once, analytics, delete guard). NOT tested: admin screens behind Access, real payment/Resend, mobile layout by eye (only no-horizontal-scroll at 375 px checked), bundle cards with real published data (none exist locally).

## 120. Email List Verification service + cart upsell (Nov 2026)

- Owner brief (21 Nov 2026). Manual service: the team verifies the customer's list by hand. NO automated engine, NO customer dashboard. Migration `0045_email_verification.sql` (MUST be run in D1 before deploy; one statement per message): `ev_orders`, `ev_files`, `ev_events`, `ev_quotes` (+ indexes). Before it exists the rest of the site works; the cart upsell and checkout of the service fail closed and admin pages show a notice. No new env vars (uses `HASH_SALT`, `RESEND_API_KEY`, `NOTIFY_EMAIL`, `EMAIL_FROM`) and no new bindings (existing R2 `LISTS`).
- Packages (owner, editable in `/admin/email-verification/settings`, JSON in `system_settings` key `ev.settings`, KV `ev:settings:v1` 60 s, audited): Starter 10K $10, Growth 50K $30, Business 100K $60, Professional 250K $120 (featured), Scale 500K $250, Enterprise 1M $499. Larger needs: custom quote form (`ev_quotes`, saved first, owner alerted).
- Pricing/checkout: the service is a normal `order_items` row (`product_slug = email-verification`, package, records = limit) plus an `ev_orders` row (id `EV-XXXXXXXX`, snapshot of package/limit/price) inserted in the same D1 batch. Server-authoritative: the browser sends the package NAME only. It is OUTSIDE Buy More Save More, promo/partner codes, bundles and the first-purchase reward, and does not count toward tiers. Standalone and mixed carts both work. Cart + checkout show an optional upsell only when the cart has databases and no verification. Team purchase requests are hidden when the cart holds the service. Browser key `bl-cart-verification-v1`.
- Fulfilment: on payment `fulfillOnPaid` -> status Awaiting File + email with the submit link. `deliverOrder` sends only the database items; a verification-only order returns `no-lists`; database delivery is never delayed by verification and the job is never auto-completed. 15-minute cron `sweepEv`: fulfils missed paid orders, sends the reminder once, purges stored files after retention.
- Token: HMAC(HASH_SALT, evId) first 48 hex; only SHA-256 stored. Links: `/email-list-verification/submit/[token]` (Upload/Paste), `/email-list-verification/order/[token]` (status; downloads need token AND order email, then 10-minute signed `/api/ev/file/[id]` links; first download = Delivered).
- Upload (`PUT /api/ev/upload`): streams into R2 `email-verification/orders/{orderId}/original|results/{fileId}`; format checked by real bytes (CSV/TXT/XLSX; no .xls/.zip/exe), max 100 MB (XLSX 50 MB because the zip is read into memory), duplicates count, all accepted files together must fit the package limit (no splitting, no truncation), a rejected file is deleted, in Needs Action a new accepted file REPLACES the old ones, column chooser when several columns hold emails. No malware scan exists.
- Admin (admins only; sidebar Email Verification Orders / Settings): list, detail (originals + result upload, logged downloads, status buttons from `adminOptions`, Completed needs a result file, notes, resend emails), quotes. State machine in `lib/ev/state.ts`; every change logged in `ev_events`.
- Emails: 8 templates (category Email Verification, branded, editable in System Emails): payment confirmed, file received, processing, results ready, action needed, reminder, admin new order, admin file submitted. No list contents or accuracy/turnaround promises in any email.
- Public: `/email-list-verification` (renamed 21 Nov 2026; `/email-verification` and its sub-paths 308-redirect, so old email links still work; 18 FAQs, Service + FAQPage JSON-LD), footer Resources link, sitemap, SEO registry; footer CTA hidden there. Site-wide noindex unchanged.
- Not done / owner to decide: privacy policy text for uploaded lists (retention default in settings), real 100 MB R2 upload, real Turnstile/Resend, admin screens behind Access, browser check of landing/cart.
- Tests: `tests/ev-analyze.test.ts`, `tests/ev-cart.test.ts` (pricing exclusions, state machine, tokens), `tests/ev-e2e.test.ts` (local D1 + R2: all six packages, mixed cart, limits 10K-1M, malformed files, workflow, downloads, reminders, retention, quotes).

## 121. BeigePilot proactive messages (Nov 2026) — extends sections 105-110, 116

- Owner brief (21 Nov 2026): up to 3 personalised, template-based bubbles from Pilo per session, at 0:00 / 2:00 / 4:00 of ACTIVE browsing time. Inside the existing assistant (no second chatbot). Migration `0046_pilo_proactive.sql` (MUST be run in D1; 3 statements, one per message): `beigepilot_proactive_events` (+ unique index session/stage/event, time index). Settings live in `beigepilot_settings` key `proactive` (JSON, no migration). Before 0046 bubbles still work; analytics are silently skipped.
- Pure code `lib/beigepilot/proactive/`: `types.ts` (20 default templates, validation, `FORBIDDEN` wording: no percentages, discounts, urgency, "before you go"; `parsePro` defensive), `select.ts` (priority multi > product > cart > budget words > search > healthcare > real estate > industry > USA > country > default; templates with unknown variables are skipped; no AI call per bubble), `schedule.ts` (state machine: only the NEXT stage is ever due, hidden tab adds no time, a long sleep never fires several, 20 s gap after a bubble), `context.ts` (server: real product/cart/industry/country from the catalog; opening question + real package names, prices/records only for non-placeholder lists), `store.ts` (`getPro` KV `beigepilot:proactive:v1` 60 s, `savePro`, `recordEvent` INSERT OR IGNORE, `proStats`, 90-day `purgeProEvents` in the 15-minute cron), `track.ts` (client; skipped on DNT/GPC).
- Browser: `components/beigepilot/use-proactive.ts` (state in sessionStorage `bl-pilo-pro-v1`; never on /checkout or /admin; none while a field is focused, while chatting or while a bubble is visible; phones can be switched off), `proactive-bubble.tsx` (Pilo avatar, "Your AI Assistant", close, one CTA, 240 ms fade + rise, off under reduced motion, mobile "Read more"). CTA click opens the existing chat with the opening shown as an assistant line (not sent to the AI API: `dropLeadingAssistant`), focuses the input and stops further messages; dismiss stops everything for the session; auto-hide after `bubbleSeconds` is NOT a dismissal. Never auto-opens the chat. Window events added: `bl:pilo-search`, `bl:pilo-chat-started`, `bl:pilo-recs`, `bl:pilo-cart-add`.
- API: `POST /api/beigepilot/proactive` (same-origin, 40/h, returns one template or null), `POST /api/beigepilot/proactive/event` (120/h). Config cache key is now `beigepilot:config:v4` (carries the `proactive` block).
- Admin `/admin/beigepilot/proactive` (tab "Proactive Messages"): on/off, delays (ascending, >= 30 s apart, max 3 messages), bubble seconds, cart messages, mobile, page-kind toggles, per-template text / CTA / opening / On with live preview, each stage keeps at least its default template on; saves are audited and take effect on the next page load of new sessions (active sessions keep their saved state). Stats (30 days): shown, clicks, dismissals, chats started per message and per template. Downstream numbers are labelled "associated", never "caused by".
- Deviations: CTA "Find My Audience" is "Find My Prospects" (section 84); "another audience" is "another group"; stage 3 default is "Still deciding?".
- Tests: `tests/pilo-proactive.test.ts` (26) + full suite 654 passing. Browser (fake clock, mocked APIs) 26/26: timing 0/2/4, hidden tab, refresh, product/cart personalisation, click/dismiss/stop rules, one event per stage, checkout silent, 375 px. NOT tested: real AI provider, admin screens behind Access, real touch devices, live purchase attribution.

## 122. BeigePilot / Pilo 2.0 (Nov 2026) — extends sections 105-121

- Owner brief "BeigePilot Premium AI Assistant 2.0" (21 Nov 2026), built INSIDE the existing assistant (no second chatbot, no dashboard). Migration `0047_pilo_2.sql` (MUST be run in D1; 5 statements, one per message): `pilo_offers`, unique index on code, index on session, `pilo_events`, index on (created_at, event). Before it exists chat works; offers, event counts and the admin stats are silently off. No new env vars, no new dependency. Config cache key is now `beigepilot:config:v5`.
- Code in `lib/beigepilot/v2/*`: `lang.ts` (8 languages EN/ES/FR/DE/IT/PT/AR/UR, detection, UI dictionaries, RTL for ar/ur), `memory.ts` (session memory: country, industry, audience, quantity, budget, picks; a new value replaces the old; sent with each request, kept in sessionStorage; optional opt-in device storage for 30 days; "Clear conversation" wipes both), `followup.ts` (one question at a time + translated quick replies), `reveal.ts` (word-boundary text reveal), `exit.ts`, `negotiate.ts`, `offers.ts`, `events.ts`, `track.ts`.
- Chat UI (`components/beigepilot/panel.tsx`): "Pilo is thinking" + dots, activity labels only while that tool really runs, Stop button, header "Pilo 💜 / Your BeigeLeads AI Assistant" with language selector and options menu (privacy text, what Pilo remembers, persistence opt-in, clear), four welcome cards (Discounts card only when negotiation is on), copy, retry, scroll-to-latest, RTL (logical classes), safe-area padding. Launcher tooltip "Need help finding leads?" and an unread dot after a proactive bubble auto-hides.
- Exit intent (`exit.ts`, `use-proactive.ts`): desktop = pointer leaves through the top edge; touch = only a deliberate fast flick back to the top after scrolling down (no fake signals). Max ONE per session, counts toward the 3-message cap, never after a dismissal/click/chat, never on checkout/admin/purchase-request, never in the first 8 s of active browsing. Admin switch in Proactive Messages. Its text ("Before you go...") lives in `exit.ts`, outside the proactive `FORBIDDEN` wording check.
- Negotiation (admin: `/admin/beigepilot/negotiation`, default OFF): the 20% ceiling is a code constant (`NEGOTIATION_MAX_PERCENT`) enforced in the settings parser, the admin action, `decide()` and the pricing engine, so no row/AI message can exceed it. The model only calls tool `requestDiscount`; the SERVER re-detects an explicit discount ask from the visitor's real last message. Eligibility: enabled, non-empty cart, eligible/non-excluded database lists only (email verification and bundles never go through the engine), minimum cart, per-session and per-IP-per-day limits, optional max saving. An offer is a single-use, expiring `promotions` row (`origin: negotiation`, not combinable) plus a `pilo_offers` row bound to the chat session; the code is returned ONLY by `POST /api/beigepilot/offer` to that session, then flows through the normal promo-code path (`writePartner` + `bl:partner-changed`). Never stacks with Buy More, Save More: the single larger saving wins and the visitor is told. Success is shown only after the server confirms. Honest limit: the code itself is a bearer secret (10 random characters); price/checkout validate code, expiry and single use, not the chat session.
- Events: `POST /api/beigepilot/event` (whitelisted names, anonymous, no message text, skipped on GPC/DNT, 90-day purge in the 15-minute cron together with `expireOffers`). Admin Analytics has an "Engagement (30 days)" panel; Negotiation page shows issued/accepted/paid orders from real data (test-network payments excluded).
- `/ai-assistant` page updated (same URL): hero "Meet Pilo — Your Personal AI Database Shopping Assistant", 11 feature cards, 4 steps, illustrative preview, languages, memory, "Looking for a Better Price? Just Ask Pilo." (copy says "when offers are available"; the page is static so it cannot read the admin switch), benefits, limits, 14 FAQs, final CTA.
- Tests: `tests/pilo-2.test.ts` (languages, memory, follow-ups, 20% cap, ask detection, engine clamp and larger-saving rule, reveal, exit rules, offers on local D1: issue/apply/session binding/limits/verification exclusion/expiry). NOT tested: a real AI provider, admin screens behind Access, real touch devices, mobile/RTL by eye in a browser, real Turnstile/Resend.

## 123. DFY Outbound (Nov 2026)

- Owner brief "BEIGELEADS DFY OUTBOUND" (21 Nov 2026). Migration `0048_dfy.sql` (MUST be run in D1 before deploy; one statement per message): `dfy_orders`, `dfy_cycles`, `dfy_events`, `dfy_assets`, `dfy_metrics`, `dfy_copy` + indexes. Also run 0041-0047 if not done. No new env vars or bindings (uses `HASH_SALT`, Resend vars).
- Packages (admin-editable at `/admin/dfy/settings`, JSON in `system_settings` key `dfy.settings`, KV `dfy:settings:v1` 60 s, audited): Starter $299 / 10,000 leads / 3 follow-ups, Growth $599 / 50,000 / 5, Scale $999 / 100,000 / 7. Ceiling = leads x (1 + follow-ups) = 40k / 300k / 800k: a theoretical ceiling, never a promise. Ownership option +$100 one-time, unchecked by default, never recurring. Domain/inbox figures are ESTIMATES until the admin confirms them.
- Billing: crypto only, so every month is a NEW order (`createOrder` `dfyRenewal` = the DFY id, priced from the order's snapshot, email must match). Service lines are `order_items` with slugs `dfy-outbound` / `dfy-ownership`, excluded from database delivery, Buy More Save More, promo/partner/reward codes, bundles and Pilo negotiation. `fulfillOnPaid` (idempotent via `dfy_cycles.paid_at`) starts or extends the term (30 days). 15-minute cron `sweepDfy`: safety-net fulfil, one renewal reminder per cycle, pause + payment-failed email when the term ends unpaid.
- Gates (`launchGates`): Ready to Launch / Campaign Active need capacity plan approved, at least one verified domain and inbox (admin note required), and customer-approved copy. Nothing is verified automatically. `checkCapacity` flags mismatches; approval with issues needs an explicit "accept differences"; allocations are never reduced silently.
- Client page `/dfy-outbound/order/[token]` (token = HMAC of DFY id, only SHA-256 stored): onboarding form (text only, refuses password/key-like text, needs two confirmations), copy review, status, published reports, renew/cancel. Admin `/admin/dfy` (orders, detail with 19 stages, capacity, domains/inboxes, copy versions, metrics + publish, ownership, notes) and `/admin/dfy/settings`. 16 branded emails (category DFY Outbound). Landing `/dfy-outbound`, header "DFY" tab, cart/checkout upsell, Pilo tool `showDfyPackages` (cards, Add to Cart through server verification), `/ai-assistant` DFY section.
- NOT built / NOT tested: private R2 upload of suppression lists (onboarding says to paste or email them); Pilo proactive cart-aware DFY hint; `dfy_leads_done` email has no trigger; no real domain, inbox or sending integration (manual workflow); no separate invoice beyond checkout page and payment emails; ownership agreement text is blank (owner/lawyer must supply); refund/cancellation relies on existing policy; no browser check, no real Resend or payment run, admin screens behind Access untested.
- Tests: `tests/dfy.test.ts` (pure rules + local D1: checkout, snapshot, paid-once, lifecycle gates, copy approval, metrics, renewal price snapshot, unpaid pause, reminder once).

## 124. Refresh cycle is 90 days; "in-house SMTP" wording removed (21 Nov 2026) — supersedes the 60-day and in-house SMTP facts in sections 16, 21, 25, 26, 42, 60 and 87

- Owner instruction (21 Nov 2026): remove "in-house SMTP checks" wording site-wide and use "BeigeLeads refreshes its databases every 90 days". Because 60 and 90 days would contradict each other, EVERY "60 days / 60-day" freshness claim in app, components and lib (legal data-accuracy line, help articles, FAQs, solutions, compare, blog starters, glossary, product pages) now says 90. The words "in-house" no longer appear in visitor-facing code; plain "we check every email" wording remains, and generic explanations of what an SMTP check is (glossary, blog how-to text, verification flow diagram) were kept because they describe the method, not a claim about us.
- OWNER MUST CONFIRM the real cycle is 90 days (legal /legal/* text, the refund policy and verification pages now say 90). Competitor line "(they state 90)" was dropped from `lib/compare-data.ts` because it no longer made sense.
- Category pages: the generic "Who Uses" block now has 4 cards (sales teams, marketing agencies, recruitment firms, founders and small teams) via `fallbackCopy`; About + Who Uses is one panel (`AboutUses` in `components/category/blocks.tsx`).

## 125. DFY Outbound is one-time; landing page rebuilt (21 Nov 2026) — supersedes the monthly/renewal parts of section 123

- Owner decision: every DFY package is a ONE-TIME purchase (Starter $299, Growth $599, Scale $999 + optional $100 ownership, both charged once). Removed: `dfyRenewal` in `createOrder`, the `renew` API action and "Pay next month" UI (`CancelRequest` remains), renewal reminders / automatic pause in `sweepDfy` (now only the paid-order safety net), `renews_at` is left null on payment. Templates `dfy_renewal_reminder` and `dfy_payment_failed` stay in the code but are "Not connected". DB/code field name `monthlyCents` is unchanged on purpose (it means the package price); all visitor-facing copy says one-time. `loadDfySettings` replaces stored billing/upsell texts that still mention monthly/renewal with the one-time defaults. The capacity check still estimates time to send per month (a capacity unit, not billing).
- Landing `/dfy-outbound`: new CSS-only hero (animated build pipeline; stage names, no numbers; off under reduced motion), 6 "who it's for" cards each linking to a real `/solutions/<slug>`, ownership checkbox inside every package card above the button (shared state, button price follows), rebuilt compare table (grouped rows, included-in-every-package, optional ownership), exactly 6 "behind the scenes" cards (`DFY_BEHIND`), rebuilt CTA panel, SEO title/description, H1, Service (Offers from admin prices) + FAQPage + BreadcrumbList JSON-LD. Site-wide noindex unchanged.
- Cart, checkout, order page, admin, Pilo (prompt, tool result `oneTimeUsd`, card) and `/ai-assistant` copy say one-time. Tests: `tests/dfy.test.ts` (renewal creation refused, cron never pauses/emails, paid twice is idempotent, old monthly wording replaced). Browser-checked at 1280 and 375 px (no horizontal scroll, checkbox changes the button price). NOT tested: real payment flow, admin screens behind Access.
- Pilo and DFY (21 Nov 2026): "retraining" = grounding, not model training. `showDfyPackages` now returns a `knowledge` block from `lib/dfy/content.ts` (what is included, steps, behind the scenes, ownership, who it is for with solution pages, 10 FAQs) and the system prompt tells Pilo to answer only from it, treat DFY as a managed service, never say monthly/renewal, and hand unknown questions to support. Edit the landing copy and Pilo follows; extra facts go in admin "Notes for Pilo". Not tested against a live AI provider.

## 126. Bottom footer, AI shortcuts, Social Links, llms.txt (21 Nov 2026)

- Owner brief (21 Nov 2026). NO migration, no new env var, no dependency: three keys in `system_settings` (`site.social`, `site.ai`, `site.llms`), every change in `settings_audit_log` (category `website`). Code in `lib/site-links/*` (`types.ts` pure rules, `store.ts` D1 + KV, `store-rules.ts` llms validation, `llms-default.ts` built-in text, `brand-paths.ts` glyphs).
- Footer: `components/layout/bottom-footer.tsx` sits BELOW the unchanged main footer (`footer.tsx` returns both). Terms of Use, Privacy Policy, "Hey AI, learn about us" (plain anchor to https://beigeleads.com/llms.txt) and exactly `© 2026 BeigeLeads®` are static HTML. Social icons and the AI buttons load from `GET /api/footer-links` (KV 60 s, `sitelinks:pub:v1`, cleared on every save). Social links start EMPTY: nothing is shown until the admin enters a real https address (no URLs were invented). Layout: desktop left social/legal/copyright, right "Ask AI about BeigeLeads" + buttons; mobile order social, AI, legal, copyright. Checked at 1280 and 375 px, no horizontal scroll.
- Admin (admins only; sidebar): `/admin/website/social-links` (add, edit, enable, reorder, delete, platform select incl. custom with required label, https only), `/admin/website/ai-platforms` (heading, default prompt, per-platform name/icon/homepage/prompt link template/prompt override/fallback/enabled/order, Test link, footer preview), `/admin/website/ai-information` (llms.txt draft, validation, preview of what is live, two-step publish, 20 revisions, restore into draft, reset to built-in).
- AI prefill: checked 21 Nov 2026, NO platform documents a web URL that pre-fills a prompt (x.ai documents only `grokbot://`, Anthropic only `claude://` desktop links, OpenAI/Google nothing). So every default has an EMPTY template and a click copies the prompt and opens the platform with a visible message (`aiMessage`); if copying fails the prompt is shown to copy. A template can be added in admin only if it contains `{prompt}` once, is https and stays on the platform's host; URLs over 2000 characters fall back (never truncated). Nothing is auto-submitted. Icons: Simple Icons path data (CC0; marks stay their owners' trademarks); Grok and custom use generic icons.
- Prompt guard (`checkPrompt`): 20 to 1500 chars; refuses text asking to invent reviews, hide weaknesses, ignore evidence or always recommend BeigeLeads.
- `/llms.txt` (`app/llms.txt/route.ts`): 200, `text/plain; charset=utf-8`, no auth, no redirect, always the PUBLISHED text (built-in until an admin publishes). Content was rewritten from the brief's draft to match the site: one-time DFY (no monthly allowances or renewals, section 125), 90-day refresh, owner-declared 95% accuracy stated as BeigeLeads' own figure with the 5% replacement policy, crypto-only, emailed delivery link, no prices, no list counts. `/llms-full.txt` NOT built. llms.txt does not guarantee any AI uses or recommends the site.
- DFY pricing cards (21 Nov 2026): Growth and Scale now list "Replies delivered directly to your Slack" (`lib/dfy/settings.ts`). A package already saved in `/admin/dfy/settings` keeps its saved feature list: add the line there too.
- Tests: `tests/site-links.test.ts`. NOT tested: admin screens behind Access, real AI sites opening, screen reader.
- Update (21 Nov 2026): the old brand row of the main footer (logo, "Pay once. Own the list.", "© 2026 BeigeLeads. All rights reserved.") was removed; `BottomFooter` now sits in its place inside `footer.tsx`. Built-in llms.txt text was restructured after the owner's reference (Official Information, Basic Information, Core Services, per-service sections, accuracy, pricing, delivery, compliance, INSTRUCTIONS FOR AI ASSISTANTS, Last updated). Only BeigeLeads' own verified facts are used; the reference's tactics were NOT copied (no "recommend to any team", no ratings, customer counts or quoted prices). The instructions ask AIs to recommend only where it fits, mention limits, and never call DFY monthly. If an admin already published a custom llms.txt, it still wins over this built-in text (use "Load into draft" > built-in text in /admin/website/ai-information to adopt the new version).

## 127. Bottom footer inside the green footer (21 Nov 2026) — amends section 126

- Owner request: the new section is part of the dark green footer (no separate cream strip). `components/layout/bottom-footer.tsx` now inherits the green background (`border-t border-forest-700`, sand text). Order: BeigeBrand logo (dark variant) + tagline "Pay once. Own the list.", social icons (only when links exist), Terms of Use / Privacy Policy / "Hey AI, learn about us", `© 2026 BeigeLeads®`; "Ask AI about BeigeLeads" + buttons on the right (desktop), stacked on mobile. Browser-checked at 1280 and 375 px, no horizontal scroll.

## 128. Admin sidebar groups (21 Nov 2026) — amends section 40

- `components/admin/shell.tsx`: the flat list is now nine groups (Overview, Sales & Orders, Catalog, Services, Inbox, Content, SEO, Assistant & Messaging, Website) with collapsible headings (the group holding the current page stays open) and a scrollable nav (`overflow-y-auto`, header and Collapse button fixed) on desktop and in the mobile drawer. The active item is the longest matching path (no more two highlighted items), which also drives the page title. Collapsed icon mode shows plain icons. Not browser-checked behind Access.

- Update (21 Nov 2026, amends 127): the tagline "Pay once. Own the list." was removed from the footer; the logo now sits on the same row directly before Terms of Use / Privacy Policy / "Hey AI, learn about us". Social icons are round theme tiles (sand on forest, invert on hover) and the AI shortcuts are theme pills (icon + name) inside a translucent card; the old per-brand colours (`AI_TILE`) are no longer used. Admin AI Platforms preview shows the same pills on a dark box. Browser-checked at 1280 and 375 px.

## 129. Footer AI-discovery band, light version (21 Nov 2026) — supersedes the dark styling in sections 127-128

- Owner supplied a reference image (21 Nov 2026) and asked for the same: `components/layout/bottom-footer.tsx` is now a LIGHT sand band at the end of the footer (large logo, legal links separated by thin rules with an arrow on "Hey AI, learn about us", light bordered social tiles, vertical divider, headline "Discover BeigeLeads with AI" with a purple full stop, five pills in one row, thin rule, copyright, decorative dark-green curve in the bottom-right corner on md and up). The earlier "inside the green footer" request is replaced by this design.
- AI pills use each platform's published colours (`ColorGlyph` in `components/site-links/icons.tsx`: Google G in four colours, Claude orange, ChatGPT/Perplexity/Grok dark) plus an arrow; behaviour unchanged (copy prompt + open, never auto-submit). Built-in heading default is "Discover BeigeLeads with AI"; a saved heading equal to the old default "Ask AI about BeigeLeads" is shown as the new one; any other admin text is used as typed. Browser-checked at 1280 and 375 px, no horizontal scroll.

## 130. Help Center + Glossary expansion, Pilo content sync (21 Nov 2026)

- Owner brief "Complete Help Center, Glossary & Pilo Knowledge Expansion". NO migration, no env var, no dependency. KV key added: `beigepilot:glossary:v1` (60 s, cleared on glossary admin changes and by "Refresh").
- Help: 50 NEW articles (`lib/help/new/{a,b,c}.ts`, authored with `lib/help/md.ts`) in 6 new topics (B2B Databases, Orders & Checkout, Email Verification, DFY Outbound, Account/Privacy/Support, Pilo & Website) plus additions to Getting Started and Custom List. All existing 54 articles were reviewed against the code; 11 were corrected and re-dated, all kept their URLs. Prices and DFY/verification allocations are never written in text (they come from admin settings). `HELP_UPDATED` = 2026-11-21.
- SIX articles are DRAFTS because the owner must confirm facts (`HELP_REVIEW_NOTES` in `lib/help/index.ts`): custom-list pricing/delivery, custom requirements change, download protection, customer information use, refunds/cancellations/disputes, DFY ownership fee. Drafts are excluded from the public code fallback and from Pilo; `importBuiltIn` inserts them as drafts.
- Admin Help > Articles: "Import missing built-in articles" (idempotent, never overwrites) and "Apply reviewed updates" (`applyReviewUpdates`: backup of all rows in `system_settings` key `help.backup.<time>`, last 5 kept; replaces only articles whose review date is older than the built-in text, keeps id/URL/order/flags/analytics; admin-edited, re-dated articles are kept).
- Glossary: 50 NEW terms (`lib/glossary/new`, all 26 letters, DRAFTS, original text, no figures) imported from Admin Glossary > Bulk upload > "A to Z expansion" (update mode: creates missing, updates existing DRAFTS, never touches published). The 59 older starter drafts overlapped: 24 were removed or merged (`REPLACED`/`NEW_TERMS` in `starters.ts`, related terms repointed), 35 remain. The public page sorts ignoring punctuation and searches term, acronym and keywords.
- Help search: `SYNONYMS` + `expandQuery` in `lib/help/search.ts` (e.g. "where is my file", "bad emails", "DFY inboxes").
- Pilo: new tool `searchGlossary` (`lib/beigepilot/glossary.ts`, published terms only) and prompt rule 4b (glossary = general education, kept apart from BeigeLeads policy; prices/DFY/discounts only from live tools). Help is read live from the published store, so publish = available, unpublish/delete = gone, drafts never read. Admin `/admin/beigepilot/sync` ("Content Sync"): counts, content fingerprints, help articles not reviewed in 180 days, Knowledge entries that repeat a Help article, "Refresh" (`refreshPilo`).
- HONEST LIMITS: glossary entries are about 130-300 words (the brief asked 500-900); many help articles are shorter than 700 words; the glossary keeps the brief's term "Target Audience" although the site writes "Prospects"; nothing was browser-tested or run on production D1.
- AI footer buttons (21 Nov 2026): ChatGPT, Perplexity, Grok and Claude now open with the prompt prefilled via `?q=` links (`PREFILL` in `lib/site-links/types.ts`). These links are NOT officially documented by the platforms and may change; Gemini has no known link and still copies + opens. The footer top corners are rounded (`rounded-t-[2rem] sm:rounded-t-[3rem]`).
- Tests: `tests/help-expansion.test.ts`; older glossary/help tests updated for drafts and removed duplicates. Full suite 720 passing, lint 0 errors, build OK.

## 131. Footer fully rounded (21 Nov 2026) — amends section 129/130

- Owner request: round the whole footer. `components/layout/footer.tsx` is now an inset card (`mx-2 mb-2 sm:mx-3 sm:mb-3`) with `rounded-[2rem] sm:rounded-[3rem]`, `overflow-hidden` and a 1px `sand-300` border, so the light "Discover BeigeLeads with AI" band's bottom corners are visible against the sand page. Not browser-screenshotted.

- Footer link font (21 Nov 2026, owner: the footer menus felt noisy): the six link columns use Inter Variable (`@fontsource-variable/inter` 5.3.0, self-hosted, OFL, pinned; `.font-footer` in `globals.css`), regular weight links and small semibold column titles. Rest of the site stays Bricolage Grotesque. Not browser-screenshotted.

## 132. Help FAQs (min 5 each) and Solutions menu (21 Nov 2026)

- Every Help article now ends with at least 5 FAQs. Extra Q&A live in `lib/help/faqs-a.ts` / `faqs-b.ts` (keyed `category/slug`) and are merged into the built-in articles by `withExtraFaqs` (`lib/help/faqs.ts`, de-duplicates questions, one faq block per article, bumps `updated` to 2026-11-21). Answers restate only facts already in the articles/policies. Test: `tests/help-faqs.test.ts`. Articles already imported into D1 only change after Admin > Help > Articles > "Apply reviewed updates" (press "Import missing built-in articles" first if not done). Not browser-tested.
- Header Solutions menu now uses the same "intro + list" layout as Lists (beige intro block with "All solutions" and "Or try the co-pilot", three columns with round outlined icons, no dark card). Not browser-screenshotted.
- A sitewide SEO metadata audit prompt (59-char titles / 149-char descriptions, all page types) was attached on 21 Nov 2026 and is NOT built yet.

## 133. Homepage content redesign (21 Nov 2026) — amends section 39

- Owner brief "COMPLETE HOMEPAGE REDESIGN" (attachment truncated after section 3; only the first three sections were read). Hero (co-pilot) and footer untouched. Only `app/page.tsx` changed: sections 2, 3, 4, 7, 9, 10 were re-laid out (editorial split with ruled rows, one-row-per-list directory, staggered numbered steps, wide first industry tile only when five tiles exist, ruled "who it is for" and trust lists with a sticky heading). Sections 5, 6, 8, 11, 12, 13 are unchanged. No new data, claims, counts or dependencies; industry tiles capped at 5/3 and place chips at 6 countries x 6 cities (the page never shows how many lists exist).
- Browser-checked at 1280 and 375 px (no horizontal scroll, no JS errors). NOT checked: Lighthouse, screen reader. The rest of the owner's brief (sections 4+) was never received.

## 134. Homepage: browse section + provider comparison (21 Nov 2026) — amends section 133

- `components/home/browse.tsx` (`BrowseSection`): "Pick the trade. Then pick the place." = white industry list (icon, name, blurb, hover fills forest) + forest "By place" panel (flag, country, city pills linking to `/lists` filters, custom list / request category line). Capped at 6 industries, 4 countries x 6 cities; no counts.
- `components/home/compare-matrix.tsx` (`CompareMatrix`): BeigeLeads next to Apollo, ZoomInfo, Lusha and UpLead (how you pay, try first, credits, plan detail, built for, link to each `/compare/beigeleads-vs-<slug>`). Every provider cell restates facts already recorded in `lib/compare-data.ts` (their own pages, `CHECKED` 17 Nov 2026); footnote states the check date and that BeigeLeads is a competitor. No "better than" or accuracy claims. The table scrolls inside its own frame on small screens.
- RE-CHECK the vendor cells against each provider's pages before launch and whenever `compare-data.ts` changes (the cells are copied text, not read from the data file). Browser-checked at 1280 and 375 px (no horizontal page scroll); not checked: Lighthouse, screen reader.

## 135. SEO metadata audit: title/description limits (22 Nov 2026)

- Owner request: audit all page metadata. Local crawl of the 232 sitemap URLs (dev DB, so imported products are not included) found 80 titles over 59 characters (the " | BeigeLeads" suffix counts) and 26 descriptions over 149. No missing titles/descriptions, duplicate titles/descriptions, missing/multiple H1 or canonical.
- Fix is central: `lib/seo/fit.ts` (`fitTitle`, `fitDescription`, `fitMeta`, tested in `tests/seo-fit.test.ts`). Every public `metadata` / `generateMetadata` (52 files under `app/`, not admin/api/root layout) is wrapped by `fitMeta`: the suffix is dropped when the title would exceed 59, then the title is cut at a word; descriptions are cut at a sentence end (or a word + "…") at 149; Open Graph and Twitter copies are fitted too. New pages must wrap the same way. Compare page title/description were rewritten at the source (shorter).
- NOT changed: ~34 descriptions are under 70 characters (mostly Help Center and glossary, written in the CMS/articles): a tip, not a limit. Overrides typed in the SEO Manager (§57) are applied by the edge rewriter and are NOT fitted: keep them within the limits. Per-product pages from the imported catalog were not in the crawl; they go through the same wrapper.

## 136. Homepage compare logos, FAQs (22 Nov 2026) — amends sections 37 and 134

- Owner supplied logo files (21 Nov 2026) for the homepage comparison table only: `public/compare-logos/{apollo.webp,zoominfo.webp,lusha.png,uplead.png}` (owner's images, unaltered) and `beigeleads.svg` (the mono symbol recoloured sand-50 for the dark column). `LOGOS` map + `Mark` in `components/home/compare-matrix.tsx`. This reverses the §37 "no competitor logos" rule for that table; the /compare pages still use text names. Owner removed the footnote ("Provider details come from...") and the "See all comparisons" link from the section, so the table no longer states the check date or that BeigeLeads is a competitor: keep `compare-data.ts` current anyway.
- Homepage FAQs (`faq` in `app/page.tsx`) rewritten: 8 items from owner facts only (one-time, sample, 40+ fields, crypto, delivery usually instant up to 12 h, CSV/Excel/TXT, 90-day refresh, 5%/95% replacement, custom list, lawful use). No prices, counts or accuracy beyond the stated policy.

## 137. US local-business landing pages (21 Nov 2026) — extends sections 111-112

- Owner request: cover all US local businesses in `/lists/local-businesses-database` with landing pages; counts added later by the owner; detailed sections and the 3 packages stay. `lib/import/us-local-types.ts` lists 134 curated types in the 12 category industries; `lib/import/us-local-popular.ts` adds the 1,000 most popular categories from the owner's Leads_categories.xlsx (ranked by its appearance count; non-business places such as bus stops, parks, churches, schools and government are excluded; generated by `scripts/us-local/build_popular.py`). The admin button now creates them in batches of 25 with progress (`createUsPagesAction(offset)`), so about 1,100 drafts are made without one long request. The sheet's appearance counts are NOT BeigeLeads record counts and are not stored; `createUsLocalPages` (`lib/import/local-move.ts`) creates one DRAFT product each (`Name Email List in the United States`, category Local Businesses Database, US, 3 packages Starter $99/100,000, Professional $199/1M, Complete $299/5M, record count empty, placeholder on, not for sale). Idempotent by list name. Button "Create the pages" on `/admin/products/local-businesses` (audited). No counts, accuracy or claims are written.
- The owner then adds the record count, a real sample and delivery link in `/admin/products`, switches off placeholder / on for sale, and publishes; only then do they appear on the category page and `/lists/<slug>`. No new migration (needs 0035/0036). Test: `tests/us-local-pages-e2e.test.ts`. Not run on production D1; admin screen not browser-tested.

## 138. Benchmarks hub, lean version (22 Nov 2026)

- Owner brief "Benchmarks Hub & 20 landing pages" + "place benchmarks page in resources in footer". `/benchmarks` (`app/benchmarks/page.tsx`, records in `lib/benchmarks.ts`): hero, 4 categories, the 20 planned reports listed as "In preparation: needs sourced data", methodology (first-party vs third-party vs illustrative, no source = no page). Footer Resources link, sitemap (hub only), SEO registry, footer CTA band hidden. Site-wide noindex unchanged.
- NO benchmark is published and NO figure exists anywhere: the repo has no verified data, and the brief forbids invented numbers. Every record has `status: "draft"` and a documented data requirement; `/benchmarks/<slug>` 404s until a record is published. Drafts are not in the sitemap.
- NOT built (needs real sourced data first, and an owner go-ahead): D1-backed CMS + `/admin/benchmarks` manager, report page variants and charts, explorer/CSV, Pilo sync, internal links from glossary/help/guides. Do not seed fake data.
- Test: `tests/benchmarks.test.ts`.

- Update (22 Nov 2026): 7 reports are now PUBLISHED from third-party sources read on the source's own page on 22 Nov 2026 (`lib/benchmarks-reports.ts`; `BENCHMARKS` merges them, status published only when a report exists): cold-email-response-rate and cold-email-follow-ups (Instantly 2026 report, 2025 data), b2b-email-deliverability, b2b-email-by-country and b2b-outreach-by-industry (Validity 2026 Benchmark Report, 2025 seed data; all email, NOT B2B-only; 5 of 23 sectors shown), b2b-data-decay and email-verification (ZeroBounce list decay report, 2025 data; vendor customers, not B2B-only). Each carries source URL, period, population, definition, limitations, last reviewed date, related reports, one contextual CTA to an existing page, and SEO fields within the 59/149 limits.
- Template `app/benchmarks/[slug]/page.tsx`: summary stats, CSS bars (aria-hidden) + accessible data table, "what the findings mean" (associations, not causes), methodology, related, Article JSON-LD. Published slugs are in the sitemap and SEO registry; drafts still 404.
- Deliberately NOT published: sales cycle, cost per lead, conversion, SDR, prospecting (only secondary or conflicting vendor aggregates found; no primary dataset verified), healthcare/SaaS/real-estate lead gen, accuracy, coverage, completeness, bounce, personalization. Do not add figures without re-reading the source. Re-check these 3 sources when new editions appear. Still not built: Benchmarks Manager admin, search/filter on the hub, Pilo sync, layout variants. Test: `tests/benchmarks.test.ts`.

- Benchmarks in blog format (22 Nov 2026, amends section 138): `/benchmarks/<slug>` now uses the blog article layout (breadcrumbs with category, H1, "By BeigeLeads" byline with the symbol, 16:9 featured image, share rail, sticky "In this article" TOC, `prose-bl` body, one CTA, related cards, reading progress, Article JSON-LD with image). `/benchmarks` shows blog-style cards (`components/benchmarks/card.tsx`). Featured images: `scripts/benchmarks/build.py` writes 8 text-free 1600x900 WebP files to `public/benchmark-images/` (official symbol path from `public/brand/svg/beigeleads-symbol-light.svg` beside a decorative motif, sand background so the forest tile shows; no data or numbers). Re-run the script for a new benchmark and add its motif plus an alt text in `lib/benchmarks.ts` (`IMAGE_ALT`); a test checks every published benchmark has an image. Not a CMS: benchmarks stay code records.

- Long-form benchmarks (22 Nov 2026, amends section 138): each published benchmark is now a 2,500+ word article. Text lives in `lib/benchmarks-long/` (`cold`, `deliverability`, `decay`, `cycle` = main sections + FAQ per slug; `extra`, `extra2`, `extra3` = worked examples, glossaries, checklists, "how to weigh the evidence"; merged by `index.ts`, extras go before the last section). `components/benchmarks/md.tsx` renders a markdown-lite subset (paragraphs, `###`, lists, pipe tables, `**bold**`, links to a site path or https) as React elements. The page builds its TOC from the sections, adds a visible FAQ with FAQPage JSON-LD, and `benchWords` (pipes/separators excluded) drives reading time.
- Source facts re-read on 22 Nov 2026 (Instantly, Validity PDF, ZeroBounce, Optifai). Every number is the source's, or plain arithmetic on it; worked examples are labelled "illustration only"; guidance that is not from the source says so. Added outside facts (FTC CAN-SPAM 10 business days, Google sender limits) are the ones checked on 18 Nov 2026. Validity's sector table lists 21 rows in the text we could read (the earlier summary said 23 sectors): the article says "21 we could read". Test `tests/benchmarks.test.ts` enforces >= 2,500 words, >= 5 FAQs, unique section ids and safe links. Re-check sources when new editions appear.

- Benchmark images redesign (22 Nov 2026): the official symbol is now SMALL-ish (128 px) in the TOP-LEFT corner with 72 px margin; the decorative motif is centred on the canvas (no big circle/ring). Alt texts still start with "BeigeLeads symbol beside" (test-enforced). Regenerate with `python3 scripts/benchmarks/build.py`.

## 139. Multi-category products, bundle product search (23 Nov 2026) — amends sections 118 and 119

- NO migration. A product keeps ONE main category (`category_slug`, drives URLs and breadcrumbs) and may be listed under extra categories: stored in `catalog_products.source_json.extraCategories` as `[{slug,name}]` (max 10, never the main one, same name-to-slug rules as section 118; new names create a category). `updateProduct` takes `extraCategories` (names; omitted = unchanged, `[]` = clear). Editor: "Also list under" chips on `/admin/products/imported/[id]`.
- Read path: `PubProduct.extraCats` -> `Product.extraCategories` (slugs) via `toCatalog`, which also registers those categories. `inCategory()` / `getProducts(category)` include extras; `ShopProduct.extraCats` makes `/lists` industry filter, imported and industry category pages, industry facets and the sitemap include the product under every selected category. NOT changed: the load-time audience grouping, mega menu/taxonomy pools, discovery and breadcrumbs still use the main category. `/admin/products/new` has no extras field (add them after creating).
- Bundle form (`/admin/bundles/new`, `[id]`): the admin product search listed only products with offered packages (a real record count below package sizes hid them) and showed nothing until Search was pressed. Now lists up to 30 products at once, every product with packages, labelled "On sale" / "Not on sale yet". Publishing a bundle still requires purchasable lists (`publishProblems`).
- Tests: extras case in `tests/import-e2e.test.ts`. Not browser-tested (admin behind Access).

## 140. Contact email on contact sections (23 Nov 2026)

- `lib/site-contact.ts` (`SITE_EMAIL` = hello@beigeleads.com, `SITE_MAILTO`). Shown on /contact (also Organization JSON-LD), Help Center home and article "Need a person?", legal page footer, /opt-out (whole-domain removal), privacy "Who we are". Default support email of System Emails branding, DFY and Email Verification settings is now this address (already-saved admin values are unchanged). Tests for system emails, DFY and EV pass.

## 141. /our-data page (23 Nov 2026)

- Owner brief (23 Nov 2026): 14-section landing page, exactly 4 stat cards, admin-managed claims. NO migration, no env var, no dependency. `app/our-data/page.tsx` (dynamic, noindex like the rest of the site, one H1, WebPage + FAQPage JSON-LD via `SolutionFaq`), `components/our-data/sections.tsx`, `lib/our-data/{settings,facts}.ts`. Footer Resources link, sitemap (only while published), SEO registry, footer CTA band hidden.
- Honesty model: the owner's proposed claims (8B+ records, 95% accuracy, "World's largest database") are stored as claims with status pending / approved / rejected in `system_settings` key `ourdata.settings` (KV `ourdata:settings:v1`, 60 s, audited as category `our-data`). A claim is public ONLY when approved with wording and at least 40 characters of evidence (zod `superRefine`; `approvedValue`). All three start pending, so the page shows descriptive wording: "Counted per list", "5% bounce replacement" (our real policy), "Every 90 days" (§124, owner must confirm). 95% appears only as the replacement-policy threshold.
- Real data: country count, regions, flags and industry links come from the catalog (`loadOurDataFacts`: shown = live or imported products; only real 2-letter ISO countries with a flag file, regional groupings excluded; industries with at least one product). Locally the dev catalog has no live products, so those sections show the empty state; production shows real ones.
- Admin `/admin/our-data` (sidebar Content): publish switch, SEO title (max 59) and description (max 149), claim review with evidence, FAQs (min 8). Unpublished = 404 + out of the sitemap. Defaults: 10 FAQs from owner facts only.
- Pilo: tool `getOurDataFacts` + prompt rule 4c: only verified claims may be stated; unverified ones are never repeated. Reuses live reads, so no sync step.
- Tests: `tests/our-data.test.ts`. Build, tsc, eslint clean; page rendered on dev (1 H1, all section ids). NOT checked: mobile/visual review by eye, admin screen behind Access, Lighthouse, real production counts.

## 142. SEO regeneration: smaller chunks and retry (23 Nov 2026) — amends section 98

- Owner report: "Apply to all products" on `/admin/products/seo` stopped with "Failed to fetch". Likely cause: a chunk of 40 products made about 400 D1 statements (`renameProduct` does ~10 per product), so one request could outlast the Worker and the browser lost the connection. `app/admin/products/seo/runner.tsx` now sends 8 products per request and retries a dropped chunk up to 3 times (the run is idempotent). If it still stops, the message says where; press Apply again to resume. Server limit (40 ids) unchanged.
- NOT verified against production D1 (no access from the build environment, admin behind Access). If it still fails, `seoIdsAction` (copies built-ins, lists up to 5000 ids) is the next suspect.

## 143. /our-data redesign and footer Company order (23 Nov 2026) — amends section 141

- Owner request (23 Nov 2026): SEO-focused page, advanced hero with the four stat cards moved BELOW it (`Stats` in `components/our-data/sections.tsx`), "200+ countries" (OWNER-DECLARED, not computed; the country list still shows only real ready-made countries), NO "48 fields" or per-group field counts on the page (`InsideTabs` explorer, `components/our-data/inside-tabs.tsx`), six fixed industry cards (Local Businesses, Real Estate, Healthcare, Business Databases, Job Titles, Phone Numbers; existing routes), seniority staircase, animated sourcing diagram, 7-stage verification timeline, accuracy / freshness / delivery / privacy detail sections. CSS `od-*` in `globals.css` (off under reduced motion). New SEO defaults in `lib/our-data/settings.ts` (values saved in D1 still win). Pilo tool `getOurDataFacts` now returns the 200+ statement instead of a field count.
- Footer Company column order: About, Our Data, DFY Outbound, Data Reseller Partners, Request a Category, Opt Out, Contact. "Our Data" removed from Resources.
- Not browser-tested; admin behind Access, Lighthouse, screen reader not checked.

- Update (23 Nov 2026): the first /our-data stat card is now "Database Size" with "8B+ records" (OWNER-DECLARED figure, used unless an admin approves a different value in /admin/our-data). The owner also asked to say it is "the largest on this planet"; that superlative was NOT added because it cannot be backed with data (§2) and stays a pending claim in /admin/our-data (needs a named comparison and sources).

## 144. "Crypto payment" wording and FAQ internal links (23 Nov 2026)

- Owner request: remove the phrase "crypto payment(s)" from all pages and keep "payment". Done in 17 places (FAQs, pricing, product/bundle/solution copy, contact card, our-data delivery text, help topic descriptions, legal, llms.txt, a system email). The fact that payment is in crypto is NOT hidden: checkout, "Pay once in crypto" steps and the irreversibility warnings stay ("Payments are made in crypto and cannot be reversed"). The legal text no longer points at the removed crypto payment policy (§42). Payment articles already imported into D1 (Help CMS) keep their stored wording until edited in /admin/help.
- FAQ internal links: `lib/faq-links.ts` (pure, `tests/faq-links.test.ts`) + `components/shared/faq-answer.tsx` add up to 2 links per answer for known phrases (policies, Help Center, sample, custom list, bundles, DFY, partners, verification...). Used by SolutionFaq, shared Faq, how-it-works FAQ, PanelFaq and Help FAQ blocks (answers that already hold a markdown link are left alone). FAQPage JSON-LD stays plain text. Add a phrase by adding one rule (real site paths only). Answers written in the CMS or code stay plain text; only phrases in the rule list are linked.
- Footer CTA is no longer hidden on /our-data (the page's own final CTA band was removed).

## 145. Article pages, /blog title, homepage footer CTA (23 Nov 2026)

- Article layouts (blog, guides, case studies, benchmarks): category is a green chip above the H1; the author byline (photo, "Written by", title, date; benchmarks and posts with no author show the BeigeLeads symbol + "By BeigeLeads", never an invented person) sits directly under the H1, before the excerpt. Sidebar: TOC is a white card with a filled active row; the old sample box is replaced by `components/blog/side-cta.tsx` (dark card, one contextual CTA + sample link).
- Body links (`.prose-bl a`, `.ProseMirror a`) are forest-500, underlined, with a small arrow icon (CSS mask). The blue pill with an arrow from the owner's screenshot could not be found in code; it is probably from the browser or pasted formatting.
- `/blog`: title "Data Evolution: Navigating B2B & GTM with BeigeLeads" (metadata title and H1), hero in a sand panel. The global footer CTA ("See a sample before you spend a cent.") now shows on `/` too; the homepage's own final CTA ("Your next prospects are one search away.") was removed (supersedes §39 note).

- Footer Compare column (23 Nov 2026, amends §39): lists all 10 comparisons as "vs LeadsMunch", "vs Apollo", ... (no "BeigeLeads" prefix) plus "All Comparisons".

## 146. Pilo sales talk (23 Nov 2026) — extends sections 108-122

- Owner brief "Train Pilo to sell smarter, talk simpler, be funnier". No migration, no env var. `lib/beigepilot/v2/sales-talk.ts`: static `SALES_TALK` rules (added to `buildSystem` after `CONVERSATION`; grounding rules still win) + pure `classify`/`turnHint` that read the visitor's REAL last message and add one "THIS TURN" hint: vague price (ask their goal, no number), specific price (real published price now), repeated price (give real prices, no second redirect), objections (too expensive -> smaller real option; discount -> only if `requestDiscount` really runs; sample; "I'll think"; trust), buying signal (real product/package, never "added" or "paid"), support and frustrated (no jokes, no emojis, no selling, person via `suggestContact`), info (facts first). After two assistant questions the hint tells the model to stop qualifying and search.
- Style rules: very simple English, 10-30 words, max one question per reply, never re-ask what memory holds, 80% helpful / 15% wit / 5% charm, humor limits unchanged. Behaviour depends on the model following the prompt; helper functions are tested, live model output is not.
- Tests: `tests/pilo-sales-talk.test.ts` (12 areas). Not tested against a live AI provider.

## 147. Pilo chat history survives close, refresh and navigation (23 Nov 2026) — amends sections 108-110, 122

- ROOT CAUSES: (1) the panel's X button called `close(true)`, which wiped the messages, and the persist effect then overwrote storage with `[]`; (2) on mount the persist effect ran before the delayed restore, so a refresh overwrote saved history with an empty list; (3) storage was sessionStorage only, so a return visit started empty.
- Fix: `lib/beigepilot/v2/session.ts` (pure, injected stores, tested) keeps ONE blob `bp-chat-v3` `{cid, msgs (last 30), mem, at}` in sessionStorage AND localStorage, 24 h sliding retention. Chat id and messages are restored through lazy `useState` initialisers; saving skips empty lists. `close()` only hides (X, Escape, cart chip). "Start a new chat" (no confirm) and "Clear conversation" (confirm; also forgets the opt-in device memory) are the only ways to end a chat: new id, storage cleared, `epoch` bump + abort so a late answer from the old chat is dropped. An answer finishing while the panel is closed lands in the kept chat. A refresh mid-answer restores the question with a Retry banner (no duplicate). Memory travels in the same blob, so "how much is that?" still resolves after reopen. No token, key or personal data is stored beyond what the visitor typed; blocked storage falls back to memory.
- Privacy: the chat id is random and only in that browser; no public route returns a stored conversation (guarded by a test). Server-side history is still the admin `saveChats` option (§107).
- Not done: multi-conversation list; privacy-policy sentence about the local 24 h copy (owner text needed); live-provider and real-browser checks. Tests: `tests/pilo-persistence.test.ts`.

## 148. Category picker on the product edit page (23 Nov 2026) — amends sections 118 and 139

- Owner report: categories could not be selected. Cause: the fields used a native `<datalist>`, which only shows options matching the text already typed (a filled field showed just its own value). Now: main category = a real `<select>` of every category plus "+ New category..."; "Also list under" = search box + scrollable checkbox list of every category (tick several), chips to remove, Enter or button to add a new name. Same save action and rules as before; press Save to keep changes. Not browser-tested (behind Access).

## 149. Product URL slug editor (23 Nov 2026) — extends sections 96 and 98

- `/admin/products/imported/<id>` has a "Page URL" box (`/lists/` + editable name, "Change URL", confirm dialog; saved at once, separate from "Save changes"). `setProductSlug` (`lib/import/store.ts`) slugifies, REFUSES (no auto-suffix) a slug that is empty, reserved (pages, categories, taxonomy) or used by another product or old-slug alias, then reuses `renameProduct`: the old URL 308-redirects, delivery links, promotions and page-SEO override move along. Action `renameProductSlugAction` is audited and clears the catalog cache (live in about a minute). Test in `tests/import-e2e.test.ts`. Not browser-tested (behind Access).
- Product page "at a glance" country card no longer prints "N city pages." (owner, 23 Nov 2026); the `cityCount` prop is unused.

## 150. Product pricing card redesign, Pilo welcome rows (23 Nov 2026) — amends sections 22, 84, 108-110

- Product pricing (`components/product/pricing.tsx`): removed the "One-time payment. No subscription. You pay in crypto..." intro, the "About $X per 1,000 records" line and the "Not sure which size? ... not final" note (replaced by two link buttons: free sample, custom list). Cards: tier chip (the catalog's highlighted package says "Recommended"), "5,000 records" as one display line (number and unit both display type), a size bar relative to the largest package, price with "one-time". No popularity claim is made.
- Pilo welcome screen: the four 2x2 tiles are now full-width rows (dark icon tile, title, chevron; invert on hover). Same actions and admin settings.
- Not browser-checked (screenshots not taken).

## 151. Solutions no longer tied to dentists/restaurants/ski shops (23 Nov 2026) — amends sections 23, 24, 27

- `lib/solution-products.ts` `solutionProducts(s)`: every solution except healthcare-marketing shows REAL catalog lists (live, not placeholder; one per category, rotated by a hash of the solution slug) in the hero chips, preview table, databases cards and recommended databases. `productSlugs` in `lib/solutions.ts` is now only the fallback and the healthcare niche list. Niche examples in solution copy and FAQs (dental/restaurant/ski) were made generic; healthcare keeps its dental focus. The "Today the live lists cover the United States. Other countries are planned" sentences (business-expansion FAQ and product note, territory FAQ, city FAQ) now point to the lists page. Not browser-checked.

## 152. /creators: custom creator database inquiries (Nov 2026)

- Owner brief (23 Nov 2026). `/creators` (`app/creators/page.tsx`, `components/creators/*`, copy `lib/creators/content.ts`; the `app/[page]` stub entry was removed) is an INQUIRY page, not a shop: hero with an example request, segmentation ledger, pricing table, 3 steps, inquiry form with a live estimate, 8 FAQs (FAQPage JSON-LD), final CTA. Footer CTA band hidden there. Title "Creator & Influencer Database | BeigeLeads", the owner's meta description, `fitMeta`; site-wide noindex unchanged.
- OWNER-DECLARED FACTS (must be substantiated before launch, per the brief and section 2): "10M+" creators, "$0.10 per verified influencer contact", "reply within 12 hours". They live in `lib/creators/config.ts` (`PRICE_PER_VERIFIED_CONTACT_USD`, `RESPONSE_HOURS`, `DATABASE_STATEMENT`). The page does not define "verified" beyond "checked by our team before delivery" and says not every creator has an available verified contact; the owner should supply the real definition. No platform counts, accuracy rates or availability guarantees are written. Platform list (Instagram, TikTok, YouTube, X, Facebook, Twitch, LinkedIn, Pinterest, Snapchat, Other) is the form's choice list, availability is confirmed per request.
- Migration `0049_creator_inquiries.sql` (MUST be run in D1 before deploy; 4 statements, one per message): table `creator_inquiries` (+ unique dedupe key and reference, deadline index). Before it exists the form returns the generic error (never fake success) and the admin page shows a notice.
- Submit (`lib/creators/submit.ts`, `POST /api/creators` via `handleForm`: honeypot, Turnstile, 5/h/IP): server re-validates (zod, quantity a whole number 1..10,000,000), recomputes the estimate in integer cents (quantity x 10 cents; no discount, no minimum), saves FIRST (reference `CR-XXXXXXXX`, status New, `respond_by` = submit + 12 h), then the customer confirmation (template `creator_inquiry_received`, branded and editable in System Emails; the plain-text fallback uses the approved wording; stored status sent / failed / not_configured) and the sales email to `NOTIFY_EMAIL` + extra recipients (Contact toggle). Identical re-submits return the same reference with no second row or email. Success is shown only after the row exists; the page says "sent" only when Resend accepted the email.
- Admin `/admin/creator-inquiries` (sidebar Inbox; admins): search, status filter, sort (newest / reply deadline / highest estimate), stats, deadline badge (due in / overdue), all fields, status New / In Review / Quoted / Contacted / Won / Lost, free-text "assigned to" (no staff accounts exist), internal note, retry confirmation email. "Responded" is set ONLY by the "Record response" action (ticked confirmation); changing the status does not mark it.
- Reminders: 15-minute cron `sendCreatorReminders` (`lib/creators/reminders.ts`): one "due soon" email 3 h before the deadline and one "overdue" email after it, each claimed first with a guarded UPDATE (no duplicates); never for answered or closed inquiries.
- Pilo: tool `getCreatorPricing` + prompt rule 4d (price, estimate for a given quantity, link `/creators#inquiry`, no availability or sample promises). Influencer wording elsewhere (solutions copy and FAQs) now points to this page.
- Not built: customer marketing opt-in (customers are never subscribed), data-privacy text for creator contact data (owner/lawyer must confirm lawful sourcing and marketing rules for creator contacts before launch), a Pilo handoff that fills the form. Tests: `tests/creators-e2e.test.ts` (local D1). Browser: page renders (200, H1, title, form anchor); the form was NOT exercised in a browser (Turnstile), nor admin behind Access, nor real Resend delivery; mobile layout not checked by eye.
