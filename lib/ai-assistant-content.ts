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
