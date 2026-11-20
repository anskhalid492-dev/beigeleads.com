-- BeigePilot AI, Phase 3: saved conversations (only when the owner turns saving on) and satisfaction ratings. Run ONE statement at a time in D1 Studio.
CREATE TABLE IF NOT EXISTS beigepilot_conversations (id TEXT PRIMARY KEY, page TEXT NOT NULL DEFAULT '', messages INTEGER NOT NULL DEFAULT 0, handoff INTEGER NOT NULL DEFAULT 0, started_at INTEGER NOT NULL DEFAULT (unixepoch()), last_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS beigepilot_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conv_id TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, tools TEXT NOT NULL DEFAULT '', provider TEXT NOT NULL DEFAULT '', tokens INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS beigepilot_messages_conv ON beigepilot_messages (conv_id);
CREATE TABLE IF NOT EXISTS beigepilot_feedback (conv_id TEXT NOT NULL, idx INTEGER NOT NULL, rating INTEGER NOT NULL, day TEXT NOT NULL, PRIMARY KEY (conv_id, idx));
