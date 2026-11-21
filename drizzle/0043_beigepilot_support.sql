-- BeigePilot Sales Assistant: support tickets get a consented chat summary and a customer-email status. Run ONE statement at a time in D1 Studio.
ALTER TABLE beigepilot_leads ADD COLUMN summary TEXT NOT NULL DEFAULT '';
ALTER TABLE beigepilot_leads ADD COLUMN customer_email TEXT NOT NULL DEFAULT 'pending';
