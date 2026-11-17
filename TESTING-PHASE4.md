# Phase 4 testing guide (payments + delivery)

Rule: never set `MAINNET_ENABLED` until Stage 6 is done. Test networks use fake coins, so mistakes cost nothing.
Do ONE stage at a time. Write down every result (pass/fail) so we can fix failures.

## Stage 0: Prepare (do this first, wallets need 24 hours)
1. In the repo folder on your Mac: `npx wrangler login` (once).
2. Check the database: `npx wrangler d1 execute beigeleads --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"`
   - You need `deliveries`, `delivery_links`, `payment_claims`, `order_audit_log`, `payment_attempts`, `wallets`.
   - Missing? Run in order, only the ones not yet applied: `npx wrangler d1 execute beigeleads --remote --file=drizzle/0002_checkout_orders.sql`, then `0003_delivery.sql`, then `0004_claims_audit.sql`.
   - Check 0002 first: `PRAGMA table_info(order_items)` must show `product_slug`.
3. Make two test wallets with PUBLIC addresses only (never share seed phrases):
   - Bitcoin TESTNET wallet (for example Sparrow or Electrum in testnet mode): address starts with `tb1`.
   - Ethereum wallet (MetaMask): address starts with `0x`. Switch it to the Sepolia test network.
   - TRON wallet (TronLink): switch it to the Nile test network.
4. `/admin/wallets`: add each address as TEST network, then Enable. They go live 24 hours later. Wait.
5. Cloudflare dashboard > Worker > Settings > Variables: add `CHECKOUT_ENABLED=true` and `CHECKOUT_ALLOW_PLACEHOLDER=true`. Do NOT add `MAINNET_ENABLED`.
6. Worker > Settings > Triggers: you must see two cron triggers (`* * * * *` and `*/15 * * * *`).
7. `/admin/delivery`: for "Dentist Email List" paste any test https link (any file you host) under "All packages".
8. Use a second email address of yours as the buyer email.

## Stage 1: Bitcoin testnet (after the wallet is live)
Open `https://beigeleads.com/checkout/new?product=dentists-us&package=Starter` (the Buy button on product pages stays disabled on purpose).
- Test 1, exact payment: pay the exact amount shown from a testnet faucet balance. Expected: page turns "paid" after 2 confirmations (about 10-30 min), buyer email arrives with your link, you get "Payment confirmed" and "List delivered" emails, `/admin/delivery` shows Delivered.
- Test 2, nobody pays: create an order, wait 30 minutes. Expected: status expired (within about 15 min after).
- Test 3, late payment: create an order, wait for the countdown to end, then pay. Expected: owner email "LATE payment", order in `/admin/orders` under Partial and late. Press "Mark paid and deliver" after ticking the box: buyer gets the link.
- Test 4, wrong amount: pay a slightly different amount. Expected: owner email "Payment matches no order". Then use the "Already paid" form on the checkout page with the tx id, and approve it in `/admin/orders` (explorer link opens the transaction).
- Test 5, duplicate: after Test 1, press "Send again" once, and wait 3 minutes. Expected: no extra automatic emails.
- Test 6, reject: submit a claim with a fake hash, press Reject. Expected: order unchanged.

## Stage 2: Ethereum Sepolia (ETH)
Same tests as Stage 1 using option "Ether (ETH)" (needs 12 confirmations, about 3 minutes). This also checks the Blockscout reader for the first time: if payments are never detected, tell me, the parsing needs fixing.

## Stage 3: TRON Nile (USDT)
Get Nile test USDT from the Nile faucet (nileex.io). Add its token contract address as variable `TRON_NILE_USDT` (copy it from the faucet or Nile Tronscan page, do not guess). Repeat Test 1 and Test 4.

## Stage 4: ERC20 on Sepolia (optional)
Needs test USDT/USDC contracts on Sepolia as variables `EVM_TEST_USDT` and `EVM_TEST_USDC`. If this is too fiddly, skip it and cover USDT/USDC ERC20 with the small mainnet tests in Stage 6.

## Stage 5: Gate check
`/admin/orders` > Testnet gate: need 20+ test orders. Note: payments are matched by EXACT amount, so underpaid or overpaid payments appear as "matches no order" emails plus claims (Test 4), not as partial/overpaid counters. Those two counters will stay near 0; count Test 4 runs yourself.

## Stage 6: Mainnet (only after Stages 1-5 pass)
Add mainnet wallets (24 hours delay), then real $1-$5 payments per coin. The cheapest package is $99 today, so ask for a temporary small test price before this stage. Only then set `MAINNET_ENABLED=true`.

## What to send me if something fails
The step name, what you saw on the page, and the email subject (never passwords, keys or seed phrases).
