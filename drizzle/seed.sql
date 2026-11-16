-- PLACEHOLDER SEED DATA for local development only.
-- No real businesses, no real counts. Products are 'draft' with record_count 0,
-- so nothing here can be sold or indexed. Replace with real pipeline output later.
-- Sample rows use example.com and are clearly marked as placeholders.

INSERT OR IGNORE INTO categories (slug, name, description, icon, is_active) VALUES
  ('dentists',    'Dentists',    'Placeholder: dental practices.',          'stethoscope',   1),
  ('restaurants', 'Restaurants', 'Placeholder: restaurants and eateries.',  'utensils',      1),
  ('ski-shops',   'Ski shops',   'Placeholder: ski and snowboard retailers.', 'mountain-snow', 1);

INSERT OR IGNORE INTO countries (code, name) VALUES
  ('US', 'United States'), ('GB', 'United Kingdom'), ('CA', 'Canada');

INSERT OR IGNORE INTO cities (country_code, name, slug) VALUES
  ('US', 'Denver', 'denver'), ('US', 'Chicago', 'chicago'), ('GB', 'London', 'london');

INSERT OR IGNORE INTO products (slug, category_id, country_code, title, record_count, fields_json, status) VALUES
  ('dentists-us',    (SELECT id FROM categories WHERE slug='dentists'),    'US', 'Dentists in the United States (placeholder)',    0, '["business_name","address","phone","email","website"]', 'draft'),
  ('restaurants-us', (SELECT id FROM categories WHERE slug='restaurants'), 'US', 'Restaurants in the United States (placeholder)', 0, '["business_name","address","phone","email","website"]', 'draft'),
  ('ski-shops-us',   (SELECT id FROM categories WHERE slug='ski-shops'),   'US', 'Ski shops in the United States (placeholder)',   0, '["business_name","address","phone","email","website"]', 'draft');

INSERT INTO product_samples (product_id, masked_rows_json)
SELECT id, '[{"business_name":"PLACEHOLDER Business 1","email":"j***@example.com","phone":"+1 ***-***-0101","website":"example.com"},{"business_name":"PLACEHOLDER Business 2","email":"i***@example.com","phone":"+1 ***-***-0102","website":"example.com"}]'
FROM products WHERE slug IN ('dentists-us','restaurants-us','ski-shops-us')
  AND id NOT IN (SELECT product_id FROM product_samples);
