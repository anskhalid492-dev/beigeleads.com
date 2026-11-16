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
