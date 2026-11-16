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
