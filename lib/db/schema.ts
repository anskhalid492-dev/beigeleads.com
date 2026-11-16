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
  productId: integer("product_id").notNull().references(() => products.id),
  tierId: integer("tier_id").notNull().references(() => priceTiers.id),
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
    expectedAmount: text("expected_amount").notNull(), // decimal string, never float
    lockedRate: text("locked_rate").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: ["open", "paid", "expired", "partial", "late"] })
      .notNull()
      .default("open"),
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
    status: text("status", { enum: ["queued", "sent", "failed"] }).notNull().default("queued"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("sample_requests_email_product_uq").on(t.email, t.productId)],
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
