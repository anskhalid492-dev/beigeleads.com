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
