import Link from "next/link";

/**
 * "New to crypto?" guide. Plain facts about how paying works here; no exchange or wallet is recommended or named
 * (BeigeLeads has no partnership with any), and no fee amounts are quoted because they vary. Native <details>: works without JavaScript.
 */
export function CryptoGuide({ className = "" }: { className?: string }) {
  return (
    <details className={`group rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-forest-900 ${className}`}>
      <summary className="cursor-pointer list-none font-bold marker:hidden [&::-webkit-details-marker]:hidden">
        New to crypto? How to get what you need <span className="font-normal text-forest-500 group-open:hidden">(show)</span><span className="hidden font-normal text-forest-500 group-open:inline">(hide)</span>
      </summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li><strong>Pick the coin that is easiest for you.</strong> USDT is a coin that stays near one US dollar, so the amount does not swing while you shop. Bitcoin (BTC) works too but its price moves.</li>
        <li><strong>Buy it first, then come back to pay.</strong> Open an account with a reputable exchange that serves your country, or use a wallet app that sells crypto. First-time accounts often ask for ID checks, which can take time. Our price quote is locked for 30 minutes once you reach the payment page, so have the coins ready before you continue.</li>
        <li><strong>Send on the network the page shows.</strong> USDT exists on several networks (for example TRON/TRC20 or Ethereum/ERC20). The payment page names the one we watch. A payment sent on a different network is not matched to your order and may be lost.</li>
        <li><strong>Send the exact amount, in one payment.</strong> Exchanges often take a withdrawal fee out of what you send. Add that fee on top so the amount we <em>receive</em> matches the page to the last digit.</li>
        <li><strong>Payments cannot be reversed.</strong> Check the address and the network before you press send. Your list is emailed once the payment is confirmed on the network.</li>
      </ol>
      <p className="mt-3 text-forest-700">Stuck? Ask Pilo in the corner, read the <Link href="/help-center" className="font-semibold underline">Help Center</Link>, or <Link href="/contact" className="font-semibold underline">contact us</Link>. We do not recommend or earn anything from any exchange or wallet.</p>
    </details>
  );
}
