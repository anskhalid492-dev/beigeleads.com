import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    parentId: integer("parent_id"),
    description: text("description"),
    icon: text("icon"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug)],
);

export const countries = sqliteTable("countries", {
  code: text("code").primaryKey(), // ISO 3166-1 alpha-2
  name: text("name").notNull(),
});

export const cities = sqliteTable(
  "cities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    countryCode: text("country_code").notNull().references(() => countries.code),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("cities_country_slug_uq").on(t.countryCode, t.slug)],
);

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    countryCode: text("country_code").references(() => countries.code),
    cityId: integer("city_id").references(() => cities.id),
    title: text("title").notNull(),
    recordCount: integer("record_count").notNull().default(0),
    fieldsJson: text("fields_json").notNull().default("[]"),
    lastVerifiedAt: integer("last_verified_at", { mode: "timestamp" }),
    // draft rows are placeholders and must never be sold or indexed
    status: text("status", { enum: ["draft", "live", "retired"] }).notNull().default("draft"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("products_slug_uq").on(t.slug), index("products_category_idx").on(t.categoryId)],
);

export const priceTiers = sqliteTable("price_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  recordLimit: integer("record_limit").notNull(),
  priceUsdCents: integer("price_usd_cents").notNull(),
});

export const productSamples = sqliteTable("product_samples", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  maskedRowsJson: text("masked_rows_json").notNull(),
});

export const listFiles = sqliteTable("list_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  r2Key: text("r2_key").notNull(),
  rowCount: integer("row_count").notNull(),
  checksum: text("checksum").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: createdAt(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(), // random, unguessable (nanoid/uuid)
    email: text("email").notNull(),
    status: text("status", {
      enum: ["pending", "paid", "expired", "partial", "late_payment", "refunded"],
    })
      .notNull()
      .default("pending"),
    totalUsdCents: integer("total_usd_cents").notNull(),
    createdAt: createdAt(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
  },
  (t) => [index("orders_status_idx").on(t.status)],
);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id),
  // The catalog is static code (lib/catalog.ts), so orders reference products by slug and package name.
  productSlug: text("product_slug").notNull(),
  packageName: text("package_name").notNull(),
  records: integer("records").notNull(),
  priceUsdCents: integer("price_usd_cents").notNull(),
});

export const paymentAttempts = sqliteTable(
  "payment_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id").notNull().references(() => orders.id),
    coin: text("coin").notNull(),
    network: text("network").notNull(),
    address: text("address").notNull(),
    walletId: integer("wallet_id").references(() => wallets.id),
    derivationIndex: integer("derivation_index"), // BTC: index derived from the wallet zpub
    expectedAmount: text("expected_amount").notNull(), // decimal string, never float
    lockedRate: text("locked_rate").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: ["open", "paid", "expired", "partial", "late"] })
      .notNull()
      .default("open"),
    overpaidAmount: text("overpaid_amount"), // decimal string, set when the buyer sent more than asked (refund/credit needed)
  },
  (t) => [index("payment_attempts_status_idx").on(t.status)],
);

export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attemptId: integer("attempt_id").notNull().references(() => paymentAttempts.id),
    txHash: text("tx_hash").notNull(),
    amount: text("amount").notNull(),
    confirmations: integer("confirmations").notNull().default(0),
    rawJson: text("raw_json"),
    seenAt: integer("seen_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex("payment_events_tx_uq").on(t.txHash)],
);

// PUBLIC addresses / xpubs only. Never private keys or seed phrases.
export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coin: text("coin").notNull(),
  network: text("network").notNull(),
  addressOrXpub: text("address_or_xpub").notNull(),
  nextIndex: integer("next_index").notNull().default(0),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  activatesAt: integer("activates_at", { mode: "timestamp" }).notNull(), // 24h delay after change
  minConfirmations: integer("min_confirmations").notNull().default(1),
});

export const walletAuditLog = sqliteTable("wallet_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  walletId: integer("wallet_id").references(() => wallets.id),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: createdAt(),
});

export const downloadTokens = sqliteTable(
  "download_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderItemId: integer("order_item_id").notNull().references(() => orderItems.id),
    tokenHash: text("token_hash").notNull(), // store hash only
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    maxDownloads: integer("max_downloads").notNull().default(5),
    downloadCount: integer("download_count").notNull().default(0),
  },
  (t) => [uniqueIndex("download_tokens_hash_uq").on(t.tokenHash)],
);

export const downloadLogs = sqliteTable("download_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenId: integer("token_id").notNull().references(() => downloadTokens.id),
  ipHash: text("ip_hash").notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
});

export const sampleRequests = sqliteTable(
  "sample_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    productId: integer("product_id").references(() => products.id),
    // Fulfilment status (set by the owner). "sent"/"failed" are legacy values from before migration 0009.
    status: text("status", { enum: ["queued", "in_progress", "fulfilled", "closed", "sent", "failed"] }).notNull().default("queued"),
    createdAt: createdAt(),
    // Added in migration 0009.
    productSlug: text("product_slug"),
    customRequest: text("custom_request"),
    /** email|product:<slug> or email|custom:<text> or email|general. Unique, so repeats never create rows. */
    dedupeKey: text("dedupe_key"),
    /** Result of handing the confirmation email to Resend. */
    emailStatus: text("email_status", { enum: ["pending", "sent", "failed", "not_configured"] }).notNull().default("pending"),
    emailError: text("email_error"),
    attempts: integer("attempts").notNull().default(0),
    updatedAt: integer("updated_at"),
    adminNote: text("admin_note"),
  },
  (t) => [
    uniqueIndex("sample_requests_email_product_uq").on(t.email, t.productId),
    uniqueIndex("sample_requests_dedupe_uq").on(t.dedupeKey),
  ],
);

export const suppressions = sqliteTable(
  "suppressions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    emailHash: text("email_hash"),
    domain: text("domain"),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("suppressions_hash_idx").on(t.emailHash), index("suppressions_domain_idx").on(t.domain)],
);

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

export const categoryRequests = sqliteTable("category_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  requestedCategory: text("requested_category").notNull(),
  details: text("details"),
  createdAt: createdAt(),
});

// Custom list requests from /custom-list. Free text is stored as the buyer typed it; nothing
// here is a promise that the list can be built or what it would cost.
export const customListRequests = sqliteTable("custom_list_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  category: text("category").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  quantity: integer("quantity"),
  jobTitles: text("job_titles"),
  fieldsJson: text("fields_json").notNull(),
  notes: text("notes"),
  originalQuery: text("original_query"),
  createdAt: createdAt(),
  // Builder 2.0 (migration 0011). Null on older rows.
  reference: text("reference"),
  name: text("name"),
  company: text("company"),
  audience: text("audience"),
  detailJson: text("detail_json"),
  dedupeKey: text("dedupe_key"),
  ownerNotify: text("owner_notify").notNull().default("pending"),
  customerEmailStatus: text("customer_email_status").notNull().default("pending"),
});

// Product-specific FAQs, editable from the future admin panel. Until then the page falls back to
// templates in lib/catalog.ts (getProductFaqs).
export const productFaqs = sqliteTable(
  "product_faqs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull().references(() => products.id),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [index("product_faqs_product_idx").on(t.productId, t.sortOrder)],
);

/**
 * Owner decision (Nov 2026): lists are NOT delivered from R2 or by a download page. For every product (optionally per
 * package) the owner pastes an external https link in /admin/delivery; the buyer is emailed that link once paid.
 * package_name '' = default link for every package of that product.
 */
export const deliveryLinks = sqliteTable(
  "delivery_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productSlug: text("product_slug").notNull(),
    packageName: text("package_name").notNull().default(""),
    url: text("url").notNull(),
    updatedBy: text("updated_by").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex("delivery_links_uq").on(t.productSlug, t.packageName)],
);

/** One row per order: the link that was emailed (snapshot) and whether the email went out. */
export const deliveries = sqliteTable(
  "deliveries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id").notNull().references(() => orders.id),
    url: text("url").notNull(),
    status: text("status", { enum: ["sending", "sent", "failed"] }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    sentAt: integer("sent_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("deliveries_order_uq").on(t.orderId)],
);

/** "I already paid" claims from buyers. Never trusted: the owner checks the chain, then approves or rejects. */
export const paymentClaims = sqliteTable(
  "payment_claims",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id").notNull().references(() => orders.id),
    txHash: text("tx_hash").notNull(),
    note: text("note"),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("payment_claims_uq").on(t.orderId, t.txHash)],
);

/** Every manual decision on an order (mark paid, mark refunded, claim approved/rejected). */
export const orderAuditLog = sqliteTable("order_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: text("detail"),
  createdAt: createdAt(),
});

/** Admin-managed status of a custom list request (migration 0006). No row = "new". */
export const customRequestStatus = sqliteTable("custom_request_status", {
  requestId: integer("request_id").primaryKey(),
  status: text("status", { enum: ["new", "in_progress", "quoted", "done", "declined"] }).notNull().default("new"),
  updatedBy: text("updated_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  /** Internal note, never shown to the customer (migration 0011). */
  note: text("note").notNull().default(""),
});

// ---- Blog CMS (migration 0007). Bodies/revisions/images are in R2; see lib/blog/*. ----
export const blogCategories = sqliteTable(
  "blog_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("blog_categories_slug_uq").on(t.slug)],
);

export const blogTags = sqliteTable(
  "blog_tags",
  { id: integer("id").primaryKey({ autoIncrement: true }), slug: text("slug").notNull(), name: text("name").notNull() },
  (t) => [uniqueIndex("blog_tags_slug_uq").on(t.slug)],
);

export const blogPosts = sqliteTable(
  "blog_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    status: text("status", { enum: ["draft", "scheduled", "published", "archived"] }).notNull().default("draft"),
    categoryId: integer("category_id"),
    author: text("author").notNull().default(""),
    /** Link to blog_authors (migration 0010). `author` keeps the display name text for cards and legacy posts. */
    authorId: integer("author_id"),
    featuredImage: text("featured_image"),
    featuredAlt: text("featured_alt").notNull().default(""),
    featuredCaption: text("featured_caption").notNull().default(""),
    /** Focal point in percent (0-100), used as CSS object-position so crops keep the subject (migration 0012). */
    featuredFocalX: integer("featured_focal_x").notNull().default(50),
    featuredFocalY: integer("featured_focal_y").notNull().default(50),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    searchText: text("search_text").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    canonicalUrl: text("canonical_url").notNull().default(""),
    noindex: integer("noindex", { mode: "boolean" }).notNull().default(false),
    ogTitle: text("og_title").notNull().default(""),
    ogDescription: text("og_description").notNull().default(""),
    ogImage: text("og_image"),
    focusKeyword: text("focus_keyword").notNull().default(""),
    /** Comma-separated (migration 0013). */
    secondaryKeywords: text("secondary_keywords").notNull().default(""),
    relatedJson: text("related_json").notNull().default("[]"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    version: integer("version").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedBy: text("updated_by").notNull().default(""),
  },
  (t) => [uniqueIndex("blog_posts_slug_uq").on(t.slug), index("blog_posts_status_idx").on(t.status, t.publishedAt)],
);

export const blogPostTags = sqliteTable("blog_post_tags", { postId: integer("post_id").notNull(), tagId: integer("tag_id").notNull() }, (t) => [
  uniqueIndex("blog_post_tags_pk").on(t.postId, t.tagId),
]);

export const blogRevisions = sqliteTable(
  "blog_revisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    r2Key: text("r2_key").notNull(),
    editor: text("editor").notNull(),
    kind: text("kind").notNull().default("manual"),
    createdAt: createdAt(),
  },
  (t) => [index("blog_revisions_post_idx").on(t.postId, t.id)],
);

export const blogMedia = sqliteTable(
  "blog_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    /** Library-level metadata (migration 0012). `originalId` links a crop to the untouched original. */
    title: text("title").notNull().default(""),
    description: text("description").notNull().default(""),
    attribution: text("attribution").notNull().default(""),
    originalId: integer("original_id"),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("blog_media_key_uq").on(t.key)],
);

export const blogPostMedia = sqliteTable("blog_post_media", { postId: integer("post_id").notNull(), mediaId: integer("media_id").notNull() }, (t) => [
  uniqueIndex("blog_post_media_pk").on(t.postId, t.mediaId),
]);

export const blogAudit = sqliteTable("blog_audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id"),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: createdAt(),
});

export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    token: text("token").notNull(),
    status: text("status", { enum: ["pending", "confirmed", "unsubscribed"] }).notNull().default("pending"),
    createdAt: createdAt(),
    confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
    unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email), uniqueIndex("newsletter_token_uq").on(t.token)],
);

export const blogAuthors = sqliteTable(
  "blog_authors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    fullName: text("full_name").notNull(),
    displayName: text("display_name").notNull(),
    title: text("title").notNull().default(""),
    /** Private: never shown publicly. */
    email: text("email").notNull().default(""),
    shortBio: text("short_bio").notNull().default(""),
    fullBio: text("full_bio").notNull().default(""),
    expertiseJson: text("expertise_json").notNull().default("[]"),
    company: text("company").notNull().default(""),
    location: text("location").notNull().default(""),
    photo: text("photo"),
    linksJson: text("links_json").notNull().default("{}"),
    seoTitle: text("seo_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    ogImage: text("og_image"),
    canonicalUrl: text("canonical_url").notNull().default(""),
    noindex: integer("noindex", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedBy: text("updated_by").notNull().default(""),
  },
  (t) => [uniqueIndex("blog_authors_slug_uq").on(t.slug)],
);
