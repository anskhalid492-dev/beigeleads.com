// New Help articles, batch B: Orders and Checkout (8) and Email Verification (7).
import { art } from "../md";

export const newB = [
art("orders-checkout", "step-by-step-checkout-guide", "Step-by-Step BeigeLeads Checkout Guide",
"Walk through the cart, the checkout form and the payment screen, with what each part means.",
"checkout, cart, how to pay, secure my databases, continue to payment, crypto checkout, steps",
"orders-checkout/accepted-payment-methods-and-processing,orders-checkout/what-happens-after-you-complete-a-purchase,pricing/how-to-purchase",
["Open your cart", "/cart"],
`Checkout has three screens: the cart, the checkout form and the payment page. You never create an account.

## 1. The cart
Open [/cart](/cart). Each line shows the list, the package, the price and a masked sample toggle. You can switch the package, remove a line or add suggested lists. The summary shows the subtotal, any discount the server calculated, and the total. A cart can hold up to 10 lists.

Choose **Secure My Databases** to continue.

## 2. The checkout form
The page is titled **Complete Your Purchase** and has two parts:
1. **Delivery Details.** Enter the email address that should receive your file and your payment emails. Check it twice; a typo sends the link to the wrong place.
2. **Payment Method.** Choose a coin. The options are the coins currently open at checkout.

Complete the security check and choose **Continue to Payment**. If you have a code, enter it in the promo box in the order summary first.

!info If your cart is empty or a list is not on sale, the page tells you why and does not create an order.

## 3. The payment page
The payment page is your order page at \`/checkout/<order id>\`. It shows:
- The exact amount to send, which includes a small unique part that lets us match your payment to your order.
- The network, such as Bitcoin, TRON or Ethereum, with a warning to use that network.
- The receiving address and a QR code.
- A 30-minute countdown for the locked price.
- The order status, which refreshes by itself every few seconds.

## 4. Pay
Send the exact amount from your wallet or exchange before the countdown ends. Add network fees on top; the fee must not be deducted from the amount. See [accepted payment methods](/help/orders-checkout/accepted-payment-methods-and-processing).

## 5. Wait for confirmation
When the network confirms your payment, the status becomes paid. We then email your delivery link. See [what happens after you complete a purchase](/help/orders-checkout/what-happens-after-you-complete-a-purchase).

## Buying for a team
If a manager has to pay, use **Request manager approval** on the cart or checkout page. See [Team Purchase Requests](/team-purchase-requests).

## FAQs
? Can I come back to the payment page later? || Yes, while the quote is valid. Keep the page address from your order.
? Does the cart survive closing the tab? || Yes, in the same browser. The cart stores only the list and package, never prices.`),

art("orders-checkout", "accepted-payment-methods-and-processing", "Accepted Payment Methods and Payment Processing",
"Which cryptocurrencies checkout can accept, how the amount is calculated and how a payment is matched to your order.",
"payment methods, crypto, bitcoin, usdt, usdc, ethereum, network, exact amount, unique amount, payment processing",
"orders-checkout/what-to-do-when-a-payment-fails,payments/how-payment-confirmation-works,payments/accepted-payment-methods",
["Open your cart", "/cart"],
`BeigeLeads accepts cryptocurrency only. Card and bank payments are not available.

## Which coins
Checkout shows the options that are open at the time. They can include Bitcoin (BTC), USDT on TRON (TRC20) or Ethereum (ERC20), USDC on Ethereum (ERC20) and Ether (ETH). If a coin is not shown, it is not open. This article does not promise a coin that checkout does not offer.

## How the amount is set
1. The order total is in US dollars.
2. We read the price of your coin from public market sources and use it only when at least two sources agree closely. If they disagree too much, or a stablecoin trades too far from one dollar, checkout is blocked rather than guessed.
3. The rate is locked for 30 minutes.
4. A small unique amount is added so your payment can be recognised.

## Why the amount looks odd
The unique part is what ties the transfer to your order. Because we use one receiving address per coin, **only the exact amount** identifies your payment. Send exactly what the page shows.

## Fees
Network and exchange fees are yours to pay on top of the shown amount. If an exchange deducts the fee from what you send, the received amount will not match and the payment may need manual review.

## Choose the right network
The same coin exists on several networks. USDT on TRON is not USDT on Ethereum. Funds sent on a wrong network may be unrecoverable. Read the network line on the payment page before sending.

## How we confirm
Our system watches the blockchain for transfers to the receiving address. A transfer counts when it has enough confirmations for that network. Your order then becomes paid. We never trust a message from the browser as proof of payment.

## Refunds in crypto
Refunds are paid in the coin you used, to an address you give us. See [refunds, cancellations and disputes](/help/account-support/how-refunds-cancellations-and-disputes-are-handled).

## FAQs
? Can I pay from an exchange? || Yes, if it lets you set the exact amount and network, and you add the withdrawal fee on top.
? Can I pay in two transfers? || No. Split payments do not match an order. Contact support if it happened.`),

art("orders-checkout", "what-happens-after-you-complete-a-purchase", "What Happens After You Complete a Purchase?",
"From payment to delivery: the confirmation, the status change, the emails and what to do next.",
"after purchase, order paid, confirmation, delivery email, what happens next, status paid",
"orders-checkout/how-to-find-your-order-confirmation,orders-checkout/how-to-access-purchased-database-files,delivery/how-you-receive-your-list",
["Track your order", "/cart"],
`Once you send the payment, three things happen in order.

## 1. The payment is detected and confirmed
Our system checks the network for your transfer. The payment page keeps refreshing and shows the status. Confirmation time depends on the network; Bitcoin can take longer than some others.

## 2. The order becomes paid
When the amount matches and the confirmations are enough, the order status changes to paid. You may receive a payment-received email.

## 3. We deliver
We email the link to your file. For database lists, delivery is usually instant and can take up to 12 hours at most. If your order has several lists, we send one email with a link for each list once every list has its link ready.

## If you added other services
- **Email List Verification:** you get an email with a secure link to submit your list. Verification is processed by hand afterwards.
- **DFY Outbound:** you get an email with a link to your private order page and the onboarding form.

## What to do now
- Open the delivery email and download your file.
- Save a copy in a safe place. The link is external and is not a permanent archive.
- Check the file against the fields on the product page.
- Read the lawful-use and opt-out guidance before sending.

## If nothing arrives
Check spam and promotions folders, then see [no delivery email](/help/troubleshooting/no-delivery-email). If the payment page still says pending, see [pending payment](/help/payments/pending-payment).

## FAQs
? Do I get an invoice? || The payment page and the payment and delivery emails record your order. Keep them.
? Can I change the list after paying? || Contact support quickly with your order number. Changes depend on whether the file has been delivered.`),

art("orders-checkout", "how-to-find-your-order-confirmation", "How to Find Your Order Confirmation",
"Where your order number, payment status and confirmation emails are, given that there are no customer accounts.",
"order confirmation, order number, find my order, receipt, payment received email, order id",
"orders-checkout/what-happens-after-you-complete-a-purchase,account-support/request-help-with-an-existing-order,troubleshooting/no-delivery-email",
["Contact support", "/contact"],
`BeigeLeads has no customer accounts, so there is no order history page to log in to. Your order record lives in three places.

## 1. The payment page
When you chose **Continue to Payment**, you reached a page at \`/checkout/<order id>\`. The text after \`/checkout/\` is your order number. Bookmark the page. While the quote is valid it shows the amount, the address and the live status.

## 2. Emails to your checkout address
Look in the inbox of the address you entered for:
- A **payment received** email after confirmation.
- The **delivery email** with your file link.
- For services, a submission or order-page link.

Search your mailbox for "BeigeLeads". Check spam and promotions folders.

## 3. Your wallet or exchange
Your transaction hash and the receiving address in your wallet history prove the payment. Keep the hash. It is the most useful detail for support.

## If you lost the order number
Contact us from the email address you used at checkout and include the approximate time, the coin and the amount, and the transaction hash if you have it. We can look the order up.

## What we cannot do
We cannot show an order to someone who cannot show they own the order email or the payment. This protects your files.

## Related
- [How to request help with an existing order](/help/account-support/request-help-with-an-existing-order)
- [How to access purchased database files](/help/orders-checkout/how-to-access-purchased-database-files)

## FAQs
? Will I get a PDF invoice? || The emails and the payment page are the record. If you need a specific document for your accounting, ask support.
? Can I log in to see my orders? || No. There are no accounts.`),

art("orders-checkout", "how-to-access-purchased-database-files", "How to Access Purchased Database Files",
"How the delivery link works, what formats you receive, and how to open and keep your files.",
"access file, download database, delivery link, csv excel txt, open file, purchased files",
"delivery/how-you-receive-your-list,delivery/file-formats,orders-checkout/troubleshooting-download-problems",
["Delivery policy", "/legal/delivery"],
`Your database is delivered as a link in an email. There is no download portal and no account.

## Find the email
The email comes from BeigeLeads to the address you used at checkout. It contains the order details, a link to each list, the permitted-use note, and links to the replacement policy and opt-out page.

## Open the link
The link goes to an external file host chosen by BeigeLeads for that list. It opens in your browser. Downloads are not limited by us. Anyone who has the link can open it, so do not post or forward it.

## File formats
Files are delivered as CSV, Excel or TXT. CSV and TXT open in any text tool or spreadsheet. Excel files open in Excel and compatible programs. For large CSV files, use a spreadsheet that can handle many rows or import into a database or CRM.

## After downloading
1. Save the file in two places.
2. Open it and check the header row against the fields on the product page.
3. Convert text encoding to UTF-8 if names with accents look wrong.
4. Before sending, remove addresses of people who have opted out of your own communications.

## Several lists in one order
We send one email with all links after every list is ready. If one list has no link yet, we hold the email and the team is alerted.

## If the link will not open
See [troubleshooting download problems](/help/orders-checkout/troubleshooting-download-problems).

## Keeping access
The link is not an archive. Download and keep your copy. We can resend the email to the order address if you lose it.

## FAQs
? Is the link time limited? || We do not set a download limit. Keep your own copy anyway.
? Can I use the file in several tools? || Within the licence and lawful-use terms, yes. Do not resell or share it. See the [terms](/legal/terms).`),

art("orders-checkout", "troubleshooting-download-problems", "Troubleshooting Download Problems",
"Fixes for a delivery link that will not open, a file that will not unzip or open, or a download that stops.",
"download problem, link not working, file corrupt, cannot open file, download stuck, delivery link error",
"delivery/download-issues,troubleshooting/download-link-not-working,troubleshooting/no-delivery-email",
["Contact support", "/contact"],
`Most download problems are small and fixable. Work through these in order.

## The link does not open
1. Copy the full link into a new browser tab. Some email apps cut long links.
2. Try a different browser or a private window. Extensions and corporate filters sometimes block file hosts.
3. Try a different network, for example your phone connection instead of the office.
4. Make sure you are using the link from your delivery email and not an old message.

## The email is missing
See [no delivery email](/help/troubleshooting/no-delivery-email). Check spam first, then make sure the address on the order was right.

## The download starts and stops
- Large files need a stable connection. Retry.
- Free some disk space.
- Use a download manager if your browser keeps failing.

## The file will not open
- CSV and TXT: open with a text editor first to confirm the content is there, then import into your spreadsheet.
- Excel: update Excel or open in another spreadsheet app.
- If accents look wrong, import the CSV as UTF-8.
- If the file seems empty, check whether your spreadsheet limits the number of rows.

## It is the wrong file
Compare the file name and header row with the list you ordered. If it is wrong, see [wrong file](/help/delivery/wrong-file).

## Contact us with details
Send the order number, the email address used at checkout, what you see (the exact error text or a screenshot) and what you already tried. We can resend the email or check the link.

!tip Do not send passwords or the file itself by email. Describe the problem instead.

## FAQs
? Is there a download limit? || No. Downloads are unlimited, but keep your own copy.
? Can you send the file as an attachment? || Delivery is by link. Ask support if you have a specific need.`),

art("orders-checkout", "how-discounts-and-promotional-codes-work", "How Discounts and Promotional Codes Work",
"Which discounts exist on BeigeLeads, how they combine, and what they never apply to.",
"discount, promo code, coupon, buy more save more, volume discount, reward code, partner code, promotion",
"pilo-website/how-pilo-discounts-and-eligibility-rules-work,orders-checkout/step-by-step-checkout-guide",
["Open your cart", "/cart"],
`The server calculates every discount, and the same calculation is used in the cart and at checkout. The browser never sets a price.

## Types of discount
- **Buy More, Save More.** Adding more eligible lists to one cart can unlock a higher percentage. The cart shows the tiers, your progress and the saving. Tiers are set by BeigeLeads and shown live in your cart.
- **Promotions.** Time-limited or targeted offers that apply automatically or with a code. A banner on the site says when one is available.
- **Second purchase offer.** After a customer's first paid order, they may be sent a personal code for a later order. The percentage, expiry and limits are stated in the email.
- **Partner code.** An approved data reseller partner gets a fixed 50% code tied to the approved email. See [partners](/partners).
- **Pilo offers.** Where enabled, Pilo can request a single-use offer for an eligible cart. See [how Pilo discounts work](/help/pilo-website/how-pilo-discounts-and-eligibility-rules-work).

## How they combine
- A partner code applies on its own.
- Otherwise the cart uses the best single saving, unless the offer is marked as combinable.
- The total never goes below zero, and savings are rounded to whole cents.

## What discounts do not apply to
Email List Verification, DFY Outbound and curated bundles are outside the volume discount, codes and Pilo offers. Custom lists are quoted separately.

## Using a code
Enter the code in the promo box in the cart or checkout summary. A code can have a minimum cart value, an expiry, a usage limit or an email it is tied to. If a code does not work you see one general message, on purpose, so codes cannot be probed.

## The crypto amount
The payment amount comes from the discounted total, so what you pay matches what the summary shows.

## FAQs
? Can I use two codes? || One code per order.
? My code says invalid. || Check spelling, expiry, the email it is tied to and whether your cart qualifies. Contact support with the code if you think it should work.`),

art("orders-checkout", "what-to-do-when-a-payment-fails", "What to Do When a Payment Fails",
"A checklist for a payment that is stuck, short, late or sent on the wrong network, and how the claim form works.",
"payment failed, payment not confirmed, underpaid, wrong network, expired quote, i already paid, transaction hash",
"payments/payment-fails,payments/pending-payment,troubleshooting/payment-not-confirmed",
["Contact support", "/contact"],
`A payment can fail to match for a few reasons. Find yours below.

## It is still pending
Network confirmations take time. Keep the payment page open; it refreshes by itself. See [pending payment](/help/payments/pending-payment).

## You sent a different amount
The amount must match exactly. If you sent less because a fee was deducted, the transfer will not match any order. We are alerted to unmatched transfers and review them by hand. Contact support with your hash.

## You sent after the countdown ended
A payment that arrives after the 30-minute quote expired is held for manual review. We decide whether to accept it, re-quote or refund.

## You used the wrong network or coin
Funds on the wrong network may not be recoverable. Contact support with the hash, the coin and the address you sent from.

## You overpaid
We flag overpayments. We refund or credit the difference after review.

## You paid but the page does not change
1. Copy your transaction hash from your wallet.
2. Open your payment page and use the **Already paid but nothing happened?** form.
3. Enter the hash and submit. The claim is saved and the team is emailed. It does not change your order by itself; a person checks the transaction.

## Start again safely
If the quote expired and you did not pay, do not send to the old address. Go back to the cart and create a new checkout.

## What to include in a support message
Order number, email address, coin and network, amount sent, transaction hash and the time.

!warning Never send a seed phrase or private key to anyone, including us.

## FAQs
? Will I get a refund for a failed payment? || Funds that did not match an order are reviewed. See [refunds, cancellations and disputes](/help/account-support/how-refunds-cancellations-and-disputes-are-handled).
? Can you speed up confirmation? || No. Confirmation depends on the blockchain.`),

art("email-verification", "complete-guide-to-email-verification", "Complete Guide to BeigeLeads Email Verification",
"What the Email List Verification service is, who it is for, how an order runs from purchase to results, and its limits.",
"email verification service, verify email list, clean list, bulk verification, email list verification guide",
"email-verification/how-to-submit-an-email-list-for-verification,email-verification/understanding-email-verification-results,email-verification/how-long-does-email-verification-take",
["Email List Verification", "/email-list-verification"],
`Email List Verification is a service for lists you already own. Our team checks the addresses and returns your list sorted by result.

## Who it is for
Anyone about to send to a list that is old, bought elsewhere, collected from forms or exported from a CRM, and who wants to remove obviously bad addresses first.

## It is a manual service
There is no instant tool and no customer dashboard. Your order is processed by authorised staff. Results are not instant, and no turnaround time is promised.

## The order flow
1. **Choose a package** on the [service page](/email-list-verification). Packages are by the maximum number of addresses and their prices are shown live on that page.
2. **Pay** at checkout in crypto. It can be bought alone or added to a cart with a database.
3. **Get the submit link.** After payment we email a link to your private submission page.
4. **Upload or paste your list.** See [how to submit](/help/email-verification/how-to-submit-an-email-list-for-verification).
5. **We process it** and email you when processing starts.
6. **Download your results** from your order page. See [how to download results](/help/email-verification/how-to-download-your-verification-results).

## What you get back
Your addresses sorted by status: valid, invalid, risky, unknown, disposable and duplicate. See [understanding results](/help/email-verification/understanding-email-verification-results).

## What it cannot do
- It cannot guarantee zero bounces or inbox placement.
- It cannot confirm that a person still reads a mailbox.
- It cannot give lawful permission to email anyone.

## Privacy
Files are kept in private storage, opened only by authorised staff for your order, and deleted after the retention periods stated in the service settings. Result downloads need your order email and use short-lived links.

## Discounts
Verification is priced separately and is outside the volume discount, promo codes and Pilo offers.

## FAQs
? Do I need an account? || No.
? Can I verify more than a million emails? || Use the custom quote form on the service page.`),

art("email-verification", "how-to-submit-an-email-list-for-verification", "How to Submit an Email List for Verification",
"The submission page step by step: upload or paste, accepted formats, limits and what happens to errors.",
"submit email list, upload csv, paste emails, verification upload, file limits, column chooser",
"email-verification/complete-guide-to-email-verification,email-verification/common-email-verification-questions,email-verification/how-long-does-email-verification-take",
["Email List Verification", "/email-list-verification"],
`After you pay, we email you a private link to the submission page. The link belongs to your order only.

## Choose how to submit
- **Upload File.** Drag in a file or choose one.
- **Paste Emails.** Paste one address per line, or separate them with commas or semicolons. We save the text as a private file.

## Accepted formats
CSV, XLSX and TXT. For XLSX we read the first worksheet, and spreadsheets can be up to 50 MB. Larger lists should be saved as CSV or TXT, which can be up to 100 MB. Older .xls files, archives and executables are not accepted. We check the real content of the file, not only its name.

## Which column
For CSV and XLSX we look for the column with email addresses. If several columns look like emails, you choose the right one.

## Limits
- Your package is a maximum number of addresses. Smaller lists are fine.
- Every email entry counts, including duplicates.
- All accepted files together must stay within the package limit. Splitting a list does not raise it.
- If a file is over the limit we reject it and tell you the allowed count, how many you sent and how many remain. We never cut a list silently.

## Errors you may see
- Unsupported type or an executable.
- No email column found.
- File too large.
- Count above your limit.
A rejected file is not stored. Fix it and try again.

## Replacing a file
While the order waits for your list, a new accepted file replaces the older ones. If we asked for a different file, we email you a link and the reason. Once processing has started, contact support before changing anything.

!tip Remove obvious junk and test addresses before uploading, but do not remove anything you want checked. Duplicates are marked for you anyway.

## FAQs
? Is there a malware scan? || Files are checked for type and structure. There is no antivirus scan, so upload only files you created.
? Can I come back later? || Yes. The submission link stays tied to your order until the file is accepted.`),

art("email-verification", "understanding-email-verification-results", "Understanding Email Verification Results",
"How to read the results file: the status of each address, what to send to, what to review and what to remove.",
"verification results, result file, status column, what to keep, risky emails, clean list",
"email-verification/valid-invalid-risky-and-unknown-email-addresses,email-verification/how-to-download-your-verification-results",
["Email List Verification", "/email-list-verification"],
`Your results come back as organised files in which each address has a status. The status tells you how to treat it.

## The statuses
- **Valid:** passed our checks at the time. An estimate, not a guarantee of future delivery. Send.
- **Invalid:** wrong format, or a domain or mailbox that does not exist. Remove.
- **Risky:** may work but carries uncertainty, for example a catch-all domain. Send with care or segment.
- **Unknown:** the mail server did not give a clear answer. Decide by risk tolerance.
- **Disposable:** from a throwaway email service. Usually remove.
- **Duplicate:** appears more than once. Keep one.

More detail is in [valid, invalid, risky and unknown](/help/email-verification/valid-invalid-risky-and-unknown-email-addresses).

## How to use the file
1. Keep valid addresses as your main send list.
2. Remove invalid, disposable and duplicate rows.
3. Decide what to do with risky and unknown rows. A common approach is to send to them in a small separate batch and watch bounces.
4. Merge back into your CRM and update your suppression list.

## Reading it with care
- A valid status is a snapshot. Addresses can stop working after the check.
- Verification does not tell you whether the person wants your email.
- Results do not change the legal rules. You still need a lawful basis and an opt-out.

## Why we state no percentages
We do not publish a typical share of valid addresses. It depends entirely on your list, and any number would be invented.

## FAQs
? Can I send to risky addresses? || You can, but expect higher bounces. Send a small batch first.
? Can I ask for a re-check? || Contact support with your order number. We decide case by case.`),

art("email-verification", "valid-invalid-risky-and-unknown-email-addresses", "Valid, Invalid, Risky, and Unknown Email Addresses",
"What each verification status means technically, why a server may give no clear answer, and how to handle each group.",
"valid invalid risky unknown email, catch-all, disposable, smtp response, bounce, status explained",
"email-verification/understanding-email-verification-results,email-verification/common-email-verification-questions",
["Glossary: SMTP", "/glossary/smtp"],
`A verification check asks the receiving mail server whether it would accept an address, without sending a message. The answer sorts addresses into groups.

## Valid
The domain exists, has a working mail server and the server did not reject the mailbox. Valid is the best result, but it describes the moment of the check.

## Invalid
The address cannot work: the format is wrong, the domain does not exist or has no mail server, or the server says the mailbox does not exist. Sending to invalid addresses causes hard bounces, which harm your sender reputation.

## Risky
The address may be fine, but the check cannot be sure. Typical causes:
- **Catch-all domains.** The server accepts every address, so a real mailbox cannot be told apart from a made-up one.
- **Full mailboxes** or temporary problems.
- **Role-based addresses** such as info@ that reach a group.

## Unknown
The server did not answer clearly. It may block checks, time out or use greylisting, which delays first contact. Unknown means we cannot say either way.

## Disposable
Temporary addresses from throwaway services. They often stop working quickly and rarely belong to a buyer.

## Duplicate
The same address appears more than once in your file.

## Handling the groups
- Send to valid.
- Remove invalid, disposable and duplicates.
- Test risky and unknown in a small separate batch.
- Always include an unsubscribe link.

!info Mail servers differ and change. No verification result is a promise that a message will be delivered or read.

## FAQs
? Why do valid emails still bounce sometimes? || The mailbox may have been removed, filled or blocked since the check, or the server accepted everything at check time.
? Is a catch-all always bad? || No, but it cannot be confirmed, so treat it as risky.`),

art("email-verification", "how-long-does-email-verification-take", "How Long Does Email Verification Take?",
"Why there is no fixed turnaround, which factors change the time, and the emails you will receive on the way.",
"verification time, turnaround, how long, processing time, queue, results ready",
"email-verification/complete-guide-to-email-verification,email-verification/how-to-download-your-verification-results,troubleshooting/request-assistance",
["Contact support", "/contact"],
`Email List Verification is processed by hand, so there is no instant result and we do not promise a fixed time.

## What affects the time
- **List size.** A large list takes longer than a small one.
- **Our queue.** Orders are processed in turn.
- **File quality.** Files that need fixing or a replacement add time.
- **Mail server behaviour.** Some servers respond slowly.

## The stages and emails
1. **Payment confirmed.** You receive an email with your submit link.
2. **File received.** After you upload or paste, you get a confirmation.
3. **Processing.** We email you when work starts.
4. **Results ready.** We email a link to your order status page.
5. **Action needed.** If we need a different file, we email you a link and the reason.

Your order status page shows the current stage.

## What you can do while you wait
- Prepare your sending domain and unsubscribe process.
- Plan how to split valid, risky and unknown addresses.
- Do not resubmit the same file; it can slow the order down.

## If it seems stuck
Check spam for our emails. If your order has not moved after a reasonable wait for the size of your list, contact support with the order number (it starts with **EV-**). We can check the status.

## Reminders
If your order is waiting for a file for some time, we send one reminder email.

## FAQs
? Can I pay for faster processing? || There is no express option.
? Will I be told when it is done? || Yes, by email to the order address.`),

art("email-verification", "how-to-download-your-verification-results", "How to Download Your Verification Results",
"Where results live, why you need your order email, the short-lived download links and how long results stay available.",
"download verification results, results link, order status page, download links, results expire, EV order",
"email-verification/understanding-email-verification-results,email-verification/how-long-does-email-verification-take,account-support/how-beigeleads-protects-customer-downloads",
["Email List Verification", "/email-list-verification"],
`There is no results portal with a login. Results are available from your order status page.

## Step by step
1. Open the "results ready" email and choose the link to your order page.
2. On the page, enter the email address used for the order.
3. Choose the file you want. The page creates a short-lived download link, valid for about ten minutes.
4. Download and save the file in your own storage.

## Why we ask for the email address
The order link identifies the order, and the email proves you are the buyer. Both are needed. This stops someone who finds a link from taking your files.

## What you may find
The results are organised by status. You may receive a file per status or a combined file, depending on the order. See [understanding results](/help/email-verification/understanding-email-verification-results).

## How long results stay available
Results stay available for the number of days stated on the service page after completion. Original files and results are deleted after the retention periods shown there. Download your results promptly and keep your own copy.

## If the link expired
Open your order page again and request a new link. Each download link lasts only a short time by design.

## If the page will not load
- Check you used the latest email.
- Enter the exact order email.
- Try another browser.
- Contact support with your EV order number.

## Delivered status
Your first download marks the order as delivered. This does not remove the files.

## FAQs
? Can I share the link with a colleague? || Do not share it. Anyone with both the link and the email could download. Forward the files instead.
? Are my files stored forever? || No. They are deleted after the retention periods.`),

art("email-verification", "common-email-verification-questions", "Common Email Verification Questions and Limitations",
"Short answers about what verification can and cannot do, file handling, discounts and edge cases.",
"verification faq, limitations, catch-all, guarantee, bounce, personal data, large lists",
"email-verification/complete-guide-to-email-verification,email-verification/valid-invalid-risky-and-unknown-email-addresses,privacy-compliance/responsible-use",
["Email List Verification", "/email-list-verification"],
`## What it does
Verification checks addresses and sorts them into statuses so you can remove clearly bad ones before sending.

## Limitations
- No guarantee of zero bounces, inbox placement, replies or sales.
- Results are estimates based on the checks available at that time.
- Catch-all domains cannot be confirmed.
- Some servers block checks, which gives unknown results.
- It does not check whether a person agreed to be emailed.

## FAQs
? Can I verify a list I bought elsewhere? || Yes, as long as you are allowed to process it.
? Do duplicates count toward my package? || Yes, every entry counts.
? What if my file is over the package limit? || We reject it and tell you the counts. Choose a larger package or submit a smaller list.
? What if my file has no email column? || We tell you why it was rejected. Fix it and try again.
? Can I submit more than one file? || Yes, while the order waits for a list. Together they must fit the limit.
? Can I add verification to a database order? || Yes. An optional offer appears in the cart and is never required.
? Does a discount code apply? || No. Verification is priced separately and outside codes and volume discounts.
? How is my data treated? || Files are stored privately, opened only by authorised staff for your order and deleted after the stated retention periods.
? Is there a dashboard? || No. Everything runs through emailed links.
? Will it improve my open rate? || We make no claim about open rates. Removing invalid addresses can lower avoidable bounces.
? Which countries? || Verification is a technical check and does not depend on a country, but your sending must follow the laws that apply to you.
? Where can I read more? || The [service page](/email-list-verification) and the [glossary entry on email verification](/glossary/email-verification).`),
] as const;
