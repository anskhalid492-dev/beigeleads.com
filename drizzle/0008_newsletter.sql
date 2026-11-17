-- Blog newsletter signups (double opt-in). Run in D1 Studio, one statement at a time.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  confirmed_at INTEGER,
  unsubscribed_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_email_uq ON newsletter_subscribers (email);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_token_uq ON newsletter_subscribers (token);
