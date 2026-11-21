// Copy for /ai-assistant. Every capability described here is implemented (CLAUDE.md sections 105-116). If one is switched off or changes, change this file.
export const AI_TITLE = "BeigePilot AI Assistant | Find Business Databases with AI | BeigeLeads";
export const AI_DESC = "Meet BeigePilot, the BeigeLeads AI assistant. Find business databases, shop by budget, add products to your cart, and contact support.";

export const AI_STEPS = [
  { icon: "message", title: "Tell BeigePilot What You Need", text: "Describe your ideal prospects, industry, country, contact quantity, or budget in your own words.", example: "“I need healthcare contacts in the USA.”" },
  { icon: "search", title: "Explore Matching Databases", text: "BeigePilot searches the available BeigeLeads catalog and presents relevant database options with actual product details." },
  { icon: "cart", title: "Add to Cart and Checkout", text: "Choose an available package, add it to your cart, and complete your purchase through the normal BeigeLeads checkout." },
] as const;

export const AI_SEARCHES = [
  ["Find USA dentists email databases.", "Find USA dentists email databases."],
  ["Do you have business contacts in Germany?", "Do you have business contacts in Germany?"],
  ["Show me healthcare databases in the UK.", "Show me healthcare databases in the UK."],
  ["Find cryptocurrency-related databases.", "Find cryptocurrency-related databases."],
  ["I need 100,000 business contacts in France.", "I need 100,000 business contacts in France."],
] as const;
export const AI_SEARCH_BY = ["Country", "Industry", "Business category", "Available contact quantity", "Database type"];

export const AI_CART_STEPS = ["Ask BeigePilot to find a database.", "Review matching products.", "Select an available package.", "Click Add to Cart.", "Continue to the existing checkout."];
export const AI_BUDGET_PROMPTS = ["What databases can I buy for $100?", "Find Germany business databases under $200.", "My budget is $300 for European business contacts.", "Show me the largest available package under $150."];
export const AI_SUPPORT_STEPS = ["Ask BeigePilot to connect you with support.", "Enter your name, email, and question.", "Submit the support request.", "Receive a confirmation email.", "The BeigeLeads support team can follow up by email."];

export const AI_PROMPTS = [
  ["Find a database", "I need USA business email databases."],
  ["Search by industry", "Show me healthcare databases in Germany."],
  ["Shop by budget", "What can I buy for under $200?"],
  ["Find a package", "Do you have a 1 million contacts package?"],
  ["Add to cart", "Help me add a database to my cart."],
  ["Get human help", "I want to speak with your support team."],
] as const;

export const AI_BENEFITS = [
  { icon: "search", title: "Less Searching", text: "Describe what you need instead of manually exploring every category." },
  { icon: "target", title: "Relevant Recommendations", text: "Discover products that match your requested industry, country, and budget." },
  { icon: "cart", title: "Easier Purchasing", text: "Choose packages and add databases to your cart directly from the assistant." },
  { icon: "life", title: "Support When You Need It", text: "Reach the BeigeLeads support team when your question needs human attention." },
] as const;

export const AI_LIMITS = [
  "BeigePilot searches the available BeigeLeads catalog.",
  "Product prices and packages come from actual product information.",
  "Recommendations depend on currently available products.",
  "You confirm every cart action yourself.",
  "Purchases are completed through the existing secure checkout.",
  "BeigePilot cannot guarantee email deliverability or campaign results.",
  "BeigePilot does not invent unavailable databases.",
  "Complex issues can be sent to human support.",
];

export const AI_FAQS: readonly (readonly [string, string])[] = [
  ["What is BeigePilot?", "BeigePilot is the BeigeLeads AI shopping assistant that helps customers discover databases, explore packages, and get purchasing support."],
  ["Is BeigePilot free to use?", "BeigePilot is available to help you browse and explore BeigeLeads products. Database purchases are charged separately."],
  ["Do I need an account?", "No account is required to start using BeigePilot."],
  ["Can BeigePilot find databases for specific countries?", "Yes. You can describe the country and industry you're targeting, and BeigePilot will search for relevant products in the available catalog."],
  ["Can BeigePilot recommend databases within my budget?", "Yes. Tell BeigePilot your budget, and it can help identify available options within that amount."],
  ["Can I add databases to my cart through BeigePilot?", "Yes. You can choose a package and add it to your existing cart. You press the Add to Cart button yourself."],
  ["Can BeigePilot complete payment for me?", "No. Customers complete purchases themselves through the BeigeLeads checkout."],
  ["Can I speak to a human?", "Yes. You can send a request to the BeigeLeads support team through the assistant. It is an email handoff, not a live chat, and we follow up by email."],
  ["Does BeigePilot guarantee database accuracy?", "No. BeigePilot helps customers find and understand available products. Database coverage and quality information should be checked on the relevant product pages."],
  ["What if BeigePilot can't find my database?", "It can suggest relevant alternatives where available or help you contact the support team. You can also send a custom list request."],
];

// ---- Pilo 2.0 page (CLAUDE.md section 122). Only features that exist in code are listed. Offers depend on the admin switch, so the copy says "when available". ----
export const AI_V2_FEATURES = [
  ["Find Databases", "Describe your target and Pilo searches the real catalog."],
  ["Budget Shopping", "Tell Pilo your budget and see packages that fit."],
  ["Smart Follow-Ups", "One short question at a time, with quick-reply buttons."],
  ["Conversation Memory", "Pilo remembers your country, industry and budget during the chat."],
  ["8 Languages", "Chat in English, Spanish, French, German, Italian, Portuguese, Arabic or Urdu."],
  ["Package Help", "Compare the real packages of a database before you choose."],
  ["Add to Cart", "Pick a package and press Add to Cart yourself."],
  ["Special Offers", "Ask about a better price; eligible carts may get an offer of up to 20%."],
  ["Order Questions", "Answers about delivery, payment and replacements from our help articles."],
  ["Human Support", "Send a support request to the team by email from the chat."],
  ["Privacy Controls", "Clear the conversation at any time."],
] as const;

export const AI_V2_STEPS = [
  ["Tell Pilo what you need", "Write in your own words: industry, country, quantity or budget."],
  ["Compare real options", "Pilo shows matching databases and their actual packages."],
  ["Add to cart", "Choose a package and add it to your cart yourself."],
  ["Check out as usual", "Payment and delivery use the normal BeigeLeads checkout."],
] as const;

export const AI_V2_LANGS = ["English", "Español", "Français", "Deutsch", "Italiano", "Português", "العربية", "اردو"];
export const AI_V2_MEMORY = ["Country", "Industry", "Target prospects", "Quantity", "Budget", "Language", "Databases you picked"];

export const AI_V2_OFFER_RULES = [
  "Only when you ask Pilo for a better price.",
  "Up to 20%, never more.",
  "Only on database lists in your cart; it does not apply to email verification or curated bundles.",
  "If your Buy More, Save More savings are already larger, the larger saving applies. Discounts do not stack.",
  "Each offer is single-use, tied to your chat, and expires.",
  "The discount is confirmed by our server before it is applied to your cart.",
];

export const AI_V2_FAQS: readonly (readonly [string, string])[] = [
  ["What is Pilo?", "Pilo is the BeigeLeads AI shopping assistant. It helps you find databases, compare packages, add them to your cart and reach support."],
  ["Do I need an account to chat with Pilo?", "No. There are no accounts on BeigeLeads. Open the chat and start typing."],
  ["Which languages does Pilo speak?", "English, Spanish, French, German, Italian, Portuguese, Arabic and Urdu. Pilo detects your language, and you can pick one from the selector in the chat header. Arabic and Urdu display right to left."],
  ["What does Pilo remember?", "During your chat Pilo keeps the details you gave it, such as country, industry, quantity, budget and databases you picked, so it does not ask twice. You can clear it with Clear conversation."],
  ["Is my conversation saved?", "By default the memory stays in your browser tab only. You can opt in to keep it on your device for up to 30 days. Our servers store conversations only if the BeigeLeads team has switched that on, and the chat tells you when that is the case."],
  ["Can Pilo find databases within my budget?", "Yes. Give a budget and Pilo shows the available packages that fit, using current catalog prices."],
  ["Can Pilo add databases to my cart?", "Pilo shows the package and you press Add to Cart. Pilo never adds or buys anything on its own."],
  ["Can Pilo pay for me?", "No. You complete payment yourself at the normal checkout."],
  ["Can I ask Pilo for a discount?", "When offers are available, you can ask. If your cart is eligible, Pilo may offer up to 20%. It only applies when you ask, and the server decides whether the offer is valid."],
  ["Do Pilo offers stack with Buy More, Save More?", "No. Only the single larger saving applies, and Pilo tells you when your existing savings are better."],
  ["Which products can an offer apply to?", "Database lists in your cart. Email verification and curated bundles are excluded."],
  ["Does Pilo guarantee database accuracy or results?", "No. Pilo reports what is on the product pages. Check coverage and quality details there, and see our replacement policy."],
  ["What if Pilo cannot answer my question?", "Ask for support. You can send a request from the chat and the team replies by email. It is not a live chat."],
  ["Why did Pilo offer me a help message while I was browsing?", "Pilo may show a short message after you have been on the site a while, or when you move to leave on a desktop browser. It shows at most three per visit, and closing it stops them."],
];
