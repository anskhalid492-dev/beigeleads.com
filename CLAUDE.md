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
- Footer Legal column is one flat list of 13 links; the Cryptocurrency Payments link was removed from the footer (page `/legal/crypto-payments` still exists).

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
