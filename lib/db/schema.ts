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
    /** Partner discount (migration 0033). totalUsdCents is always the amount the buyer pays; subtotal is the list price. */
    discountCode: text("discount_code"),
    discountPercent: integer("discount_percent"),
    subtotalCents: integer("subtotal_cents"),
    /** Total discount in cents (migration 0034): partner or promotion. Set only when a discount applied. */
    discountCents: integer("discount_cents"),
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

// Contact page inquiries (migration 0020). The older contact_messages table is kept read-only for history.
export const contactInquiries = sqliteTable(
  "contact_inquiries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    inquiryType: text("inquiry_type").notNull(),
    orderNumber: text("order_number"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    /** email + type + subject + start of message. Unique, so double clicks and retries never create a second row or email. */
    dedupeKey: text("dedupe_key").notNull(),
    status: text("status", { enum: ["new", "in_progress", "resolved", "closed"] }).notNull().default("new"),
    /** Internal only; never shown to the customer. */
    internalNote: text("internal_note"),
    /** Real result of handing the confirmation email to Resend. */
    emailStatus: text("email_status", { enum: ["pending", "sent", "failed", "not_configured"] }).notNull().default("pending"),
    emailError: text("email_error"),
    attempts: integer("attempts").notNull().default(0),
    /** Whether the owner alert was accepted (sent), failed, or switched off / no address (skipped). */
    ownerNotify: text("owner_notify", { enum: ["pending", "sent", "failed", "skipped"] }).notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at"),
  },
  (t) => [uniqueIndex("contact_inquiries_dedupe_uq").on(t.dedupeKey), uniqueIndex("contact_inquiries_reference_uq").on(t.reference)],
);

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
    kind: text("kind").notNull().default("blog"),
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
    /** "blog" or "guide" (migration 0026). Guides use the same CMS but have their own public section. */
    kind: text("kind").notNull().default("blog"),
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

/** Global SEO defaults edited in /admin/seo/settings (migration 0014). Key/value so new settings need no migration. */
export const seoSettings = sqliteTable("seo_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedBy: text("updated_by").notNull().default(""),
});

/** Redirects managed in /admin/seo/redirects (migration 0015). The Worker reads a KV copy, never this table. */
export const seoRedirects = sqliteTable(
  "seo_redirects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    status: integer("status").notNull().default(301),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedBy: text("updated_by").notNull().default(""),
  },
  (t) => [uniqueIndex("seo_redirects_from_uq").on(t.fromPath)],
);

/** Paths removed from sitemap.xml by the admin (migration 0015). */
export const seoSitemapExclusions = sqliteTable("seo_sitemap_exclusions", {
  path: text("path").primaryKey(),
  createdAt: createdAt(),
  createdBy: text("created_by").notNull().default(""),
});

/** Typed admin-editable settings (migration 0016). One row per key; definitions live in lib/settings/registry.ts. No secrets ever. */
export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedBy: text("updated_by").notNull().default(""),
});

/** Append-only history of settings changes. The app has no update or delete path for it. */
export const settingsAuditLog = sqliteTable("settings_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor: text("actor").notNull(),
  category: text("category").notNull(),
  settingKey: text("setting_key").notNull(),
  oldValue: text("old_value").notNull().default(""),
  newValue: text("new_value").notNull().default(""),
  result: text("result").notNull().default("saved"),
  createdAt: createdAt(),
});

/** Admin SEO overrides for code-built pages (migration 0017). Applied at the edge from a KV copy; never touches robots/noindex. */
export const seoPageOverrides = sqliteTable("seo_page_overrides", {
  path: text("path").primaryKey(),
  seoTitle: text("seo_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  ogTitle: text("og_title").notNull().default(""),
  ogDescription: text("og_description").notNull().default(""),
  ogImage: text("og_image").notNull().default(""),
  canonicalUrl: text("canonical_url").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedBy: text("updated_by").notNull().default(""),
});

/** Media Kit page text: a draft and a published value per field (migration 0018). NULL draft = no pending change. */
export const mediaKitContent = sqliteTable("media_kit_content", {
  key: text("key").primaryKey(),
  draft: text("draft"),
  published: text("published"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedBy: text("updated_by").notNull().default(""),
});

/** Extra downloads added by the admin (files live in R2 under media-kit/). Official logo files are NOT here: they are generated in the repo. */
export const mediaKitFiles = sqliteTable("media_kit_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  r2Key: text("r2_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  bytes: integer("bytes").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedBy: text("updated_by").notNull().default(""),
});

/** Anonymous "Was this helpful?" votes on Help Center articles (migration 0019). No IP, email or cookie is stored. */
export const helpFeedback = sqliteTable("help_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: text("article_id").notNull(),
  helpful: integer("helpful", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Help Center CMS (migration 0021). Articles are stored as JSON blocks; see lib/help/types.ts.
export const helpCategories = sqliteTable("help_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("book"),
  description: text("description").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  status: text("status", { enum: ["published", "hidden"] }).notNull().default("published"),
  createdAt: createdAt(),
  updatedAt: integer("updated_at"),
});

export const helpArticles = sqliteTable(
  "help_articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    keywords: text("keywords").notNull().default("[]"),
    body: text("body").notNull().default("[]"),
    related: text("related").notNull().default("[]"),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    group: text("grp").notNull().default(""),
    sort: integer("sort").notNull().default(0),
    /** 0 = not shown in "Getting started"; otherwise the position. */
    featured: integer("featured").notNull().default(0),
    /** 0 = not shown in "Common questions"; otherwise the position. */
    common: integer("common").notNull().default(0),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    noindex: integer("noindex").notNull().default(0),
    /** Date shown as "Last updated" (YYYY-MM-DD). */
    updated: text("updated"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at").notNull().default(0),
  },
  (t) => [uniqueIndex("help_articles_cat_slug_uq").on(t.category, t.slug)],
);

/** Anonymous search words (no IP, no account, no cookie). Rows older than 90 days are deleted by the cron sweep. */
export const helpSearchLog = sqliteTable("help_search_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  q: text("q").notNull(),
  results: integer("results").notNull().default(0),
  createdAt: createdAt(),
});

export const helpViews = sqliteTable("help_views", {
  articleId: text("article_id").notNull(),
  day: text("day").notNull(),
  views: integer("views").notNull().default(0),
});

/** System Emails (migration 0022). Code holds the built-in templates; a row exists only after an admin edits one. */
export const emailTemplates = sqliteTable("email_templates", {
  key: text("key").primaryKey(),
  draftJson: text("draft_json"),
  publishedJson: text("published_json"),
  publishedVersion: integer("published_version").notNull().default(0),
  updatedAt: integer("updated_at"),
  updatedBy: text("updated_by").notNull().default(""),
  /** Migration 0023: set only for duplicated (custom) templates. */
  name: text("name").notNull().default(""),
  baseKey: text("base_key").notNull().default(""),
});

/** Shared email branding (migration 0023): one JSON row under key "main". */
export const emailBranding = sqliteTable("email_branding", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at"),
  updatedBy: text("updated_by").notNull().default(""),
});

export const emailTemplateVersions = sqliteTable("email_template_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateKey: text("template_key").notNull(),
  version: integer("version").notNull(),
  contentJson: text("content_json").notNull(),
  note: text("note").notNull().default(""),
  actor: text("actor").notNull().default(""),
  createdAt: createdAt(),
});

/** One row per transactional send that went through a template. Recipient is stored masked. No bodies, no links. */
export const emailDeliveryLogs = sqliteTable("email_delivery_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateKey: text("template_key").notNull(),
  source: text("source").notNull().default("live"),
  recipient: text("recipient").notNull().default(""),
  subject: text("subject").notNull().default(""),
  reference: text("reference").notNull().default(""),
  status: text("status").notNull(),
  providerId: text("provider_id").notNull().default(""),
  error: text("error").notNull().default(""),
  deliveryStatus: text("delivery_status").notNull().default(""),
  deliveryDetail: text("delivery_detail").notNull().default(""),
  statusAt: integer("status_at"),
  createdAt: createdAt(),
});

export const emailWebhookEvents = sqliteTable("email_webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  providerId: text("provider_id").notNull().default(""),
  matched: integer("matched").notNull().default(0),
  createdAt: createdAt(),
});

export const popupCampaigns = sqliteTable("popup_campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  stage: text("stage").notNull(),
  status: text("status").notNull().default("draft"),
  priority: integer("priority").notNull().default(50),
  contentJson: text("content_json").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: createdAt(),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const popupEvents = sqliteTable("popup_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: text("campaign_id").notNull(),
  event: text("event").notNull(),
  pageType: text("page_type").notNull().default(""),
  createdAt: createdAt(),
});

// Anonymous cart funnel counters (migration 0027): event name and item count only.
export const cartEvents = sqliteTable("cart_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  items: integer("items").notNull().default(0),
  createdAt: createdAt(),
});

// Geography catalog (migration 0028). A page for a place is a VIEW of an existing product, never a copy of it.
export const geoAreas = sqliteTable("geo_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  countrySlug: text("country_slug").notNull(),
  parentId: integer("parent_id"),
  /** parent id, or 0 for none: lets one unique index cover "slug is unique among siblings". */
  parentKey: integer("parent_key").notNull().default(0),
  level: text("level", { enum: ["region", "city"] }).notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  indexable: integer("indexable").notNull().default(1),
  createdAt: createdAt(),
});

export const geoCoverage = sqliteTable("geo_coverage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categorySlug: text("category_slug").notNull(),
  areaId: integer("area_id").notNull(),
  /** REAL number of records in that place, entered by the owner. Never an estimate. */
  recordCount: integer("record_count").notNull(),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

// Keyword-to-content workflow and per-page copy for geography pages (migration 0029).
export const seoKeywords = sqliteTable("seo_keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keyword: text("keyword").notNull(),
  intent: text("intent", { enum: ["informational", "commercial", "transactional", "navigational"] }).notNull().default("commercial"),
  targetType: text("target_type", { enum: ["none", "page", "guide", "article"] }).notNull().default("none"),
  targetPath: text("target_path").notNull().default(""),
  categorySlug: text("category_slug").notNull().default(""),
  countrySlug: text("country_slug").notNull().default(""),
  place: text("place").notNull().default(""),
  status: text("status", { enum: ["idea", "briefed", "writing", "published"] }).notNull().default("idea"),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const geoPageContent = sqliteTable("geo_page_content", {
  path: text("path").primaryKey(),
  seoTitle: text("seo_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  intro: text("intro").notNull().default(""),
  primaryKeyword: text("primary_keyword").notNull().default(""),
  secondaryKeywords: text("secondary_keywords").notNull().default(""),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const catalogCountries = sqliteTable("catalog_countries", {
  slug: text("slug").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  enabled: integer("enabled").notNull().default(1),
  createdAt: createdAt(),
});

export const catalogSubindustries = sqliteTable("catalog_subindustries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categorySlug: text("category_slug").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  enabled: integer("enabled").notNull().default(1),
  createdAt: createdAt(),
});

export const catalogConsumerCategories = sqliteTable("catalog_consumer_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  enabled: integer("enabled").notNull().default(0),
  createdAt: createdAt(),
});

export const taxonomyNodes = sqliteTable("taxonomy_nodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentSlug: text("parent_slug").notNull().default(""),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  menuName: text("menu_name").notNull().default(""),
  icon: text("icon").notNull().default("mail"),
  short: text("short").notNull().default(""),
  blurb: text("blurb").notNull().default(""),
  status: text("status").notNull().default("upcoming"),
  compliance: text("compliance").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: integer("featured").notNull().default(0),
  menuVisible: integer("menu_visible").notNull().default(1),
  published: integer("published").notNull().default(1),
  seoTitle: text("seo_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  content: text("content").notNull().default(""),
  productSlugs: text("product_slugs").notNull().default("[]"),
  updatedAt: integer("updated_at").notNull().default(0),
});

// Glossary Library (migration 0032). Related lists are stored as text (separated by ";").
export const glossaryTerms = sqliteTable("glossary_terms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  term: text("term").notNull(),
  categorySlug: text("category_slug").notNull().default(""),
  shortDefinition: text("short_definition").notNull().default(""),
  content: text("content").notNull().default(""),
  whyItMatters: text("why_it_matters").notNull().default(""),
  example: text("example").notNull().default(""),
  relatedTerms: text("related_terms").notNull().default(""),
  relatedGuides: text("related_guides").notNull().default(""),
  relatedProducts: text("related_products").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  keywords: text("keywords").notNull().default(""),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  featured: integer("featured").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  publishedAt: integer("published_at"),
});
export const glossaryCategories = sqliteTable("glossary_categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Data Reseller Partners (migration 0033).
export const partnerApplications = sqliteTable(
  "partner_applications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reference: text("reference").notNull(),
    fullName: text("full_name").notNull(),
    businessName: text("business_name").notNull(),
    email: text("email").notNull(),
    website: text("website").notNull(),
    country: text("country").notNull(),
    businessType: text("business_type").notNull(),
    resalePlan: text("resale_plan").notNull(),
    monthlyVolume: text("monthly_volume"),
    notes: text("notes"),
    termsAcceptedAt: integer("terms_accepted_at").notNull(),
    /** One open application per email. Unique, so double clicks and retries never create a second row or email. */
    dedupeKey: text("dedupe_key").notNull(),
    status: text("status", { enum: ["pending", "under_review", "approved", "declined"] }).notNull().default("pending"),
    internalNote: text("internal_note"),
    emailStatus: text("email_status", { enum: ["pending", "sent", "failed", "skipped"] }).notNull().default("pending"),
    decisionEmail: text("decision_email", { enum: ["sent", "failed", "skipped"] }),
    ownerNotify: text("owner_notify", { enum: ["pending", "sent", "failed", "skipped"] }).notNull().default("pending"),
    decidedAt: integer("decided_at"),
    decidedBy: text("decided_by"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at"),
  },
  (t) => [uniqueIndex("partner_applications_dedupe_uq").on(t.dedupeKey), uniqueIndex("partner_applications_reference_uq").on(t.reference)],
);

export const partnerDiscounts = sqliteTable(
  "partner_discounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    applicationId: integer("application_id").notNull(),
    code: text("code").notNull(),
    /** The approved partner's email. The code works only for an order placed with this address. */
    email: text("email").notNull(),
    percent: integer("percent").notNull().default(50),
    active: integer("active").notNull().default(1),
    uses: integer("uses").notNull().default(0),
    createdAt: createdAt(),
    deactivatedAt: integer("deactivated_at"),
  },
  (t) => [uniqueIndex("partner_discounts_code_uq").on(t.code), uniqueIndex("partner_discounts_application_uq").on(t.applicationId)],
);

/** Promotions created in the admin (migration 0034). Lists are JSON text; empty list = no restriction. */
export const promotions = sqliteTable(
  "promotions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    title: text("title").notNull(),
    code: text("code"),
    description: text("description"),
    kind: text("kind", { enum: ["percent", "fixed"] }).notNull().default("percent"),
    value: integer("value").notNull(),
    productSlugs: text("product_slugs").notNull().default("[]"),
    categorySlugs: text("category_slugs").notNull().default("[]"),
    packageNames: text("package_names").notNull().default("[]"),
    minCartCents: integer("min_cart_cents").notNull().default(0),
    maxDiscountCents: integer("max_discount_cents"),
    startsAt: integer("starts_at"),
    endsAt: integer("ends_at"),
    timezone: text("timezone").notNull().default("UTC"),
    usageLimit: integer("usage_limit"),
    perCustomerLimit: integer("per_customer_limit"),
    firstPurchaseOnly: integer("first_purchase_only").notNull().default(0),
    partnerOnly: integer("partner_only").notNull().default(0),
    automatic: integer("automatic").notNull().default(0),
    combinable: integer("combinable").notNull().default(0),
    status: text("status", { enum: ["draft", "active", "paused"] }).notNull().default("draft"),
    bannerPlaces: text("banner_places").notNull().default("[]"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at"),
  },
  (t) => [uniqueIndex("promotions_code_uq").on(t.code)],
);

/** One row per (order, promotion). reserved = order created, redeemed = paid, released = order expired unpaid. */
export const promotionRedemptions = sqliteTable(
  "promotion_redemptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    promotionId: integer("promotion_id").notNull(),
    orderId: text("order_id").notNull(),
    email: text("email").notNull(),
    code: text("code"),
    discountCents: integer("discount_cents").notNull(),
    orderTotalCents: integer("order_total_cents").notNull().default(0),
    status: text("status", { enum: ["reserved", "redeemed", "released"] }).notNull().default("reserved"),
    createdAt: createdAt(),
    redeemedAt: integer("redeemed_at"),
  },
  (t) => [uniqueIndex("promotion_redemptions_order_uq").on(t.orderId, t.promotionId), index("promotion_redemptions_promo_idx").on(t.promotionId, t.status)],
);

// ---- Imported catalog (WooCommerce import, section 91) ----
export const catalogImports = sqliteTable("catalog_imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull().default("woocommerce"),
  filename: text("filename"),
  status: text("status").notNull().default("running"),
  total: integer("total").notNull().default(0),
  created: integer("created").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  note: text("note"),
  createdAt: createdAt(),
  finishedAt: integer("finished_at"),
  rolledBackAt: integer("rolled_back_at"),
});

export const catalogProducts = sqliteTable(
  "catalog_products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    importId: integer("import_id"),
    sourceId: text("source_id"),
    slug: text("slug").notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
    name: text("name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    originalDescription: text("original_description"),
    categorySlug: text("category_slug").notNull(),
    categoryName: text("category_name").notNull(),
    channel: text("channel").notNull(),
    grp: text("grp").notNull().default("general"),
    jobTitle: text("job_title"),
    countrySlug: text("country_slug").notNull(),
    countryCode: text("country_code").notNull(),
    countryName: text("country_name").notNull(),
    region: text("region"),
    city: text("city"),
    restrictedJson: text("restricted_json").notNull().default("[]"),
    flagsJson: text("flags_json").notNull().default("[]"),
    recordCount: integer("record_count"),
    packagesJson: text("packages_json").notNull().default("[]"),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    imageUrl: text("image_url"),
    tagsJson: text("tags_json").notNull().default("[]"),
    sourceJson: text("source_json").notNull().default("{}"),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at"),
  },
  (t) => [uniqueIndex("catalog_products_slug_uq").on(t.slug), uniqueIndex("catalog_products_source_uq").on(t.sourceId), index("catalog_products_import_idx").on(t.importId, t.status)],
);

export const catalogImportErrors = sqliteTable("catalog_import_errors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  importId: integer("import_id").notNull(),
  sourceId: text("source_id"),
  message: text("message").notNull(),
  createdAt: createdAt(),
});
