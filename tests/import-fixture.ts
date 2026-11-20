// Small WooCommerce-style export used by the import tests (fictional products, example.com links).
const H = ["ID", "Type", "Name", "Published", "Short description", "Description", "Regular price", "Sale price", "Categories", "Tags", "Images", "Parent", "Download 1 URL", "Attribute 1 value(s)"];
const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
const row = (o: Record<string, string>) => H.map((h) => q(o[h] ?? "")).join(",");
const LONG = "<p>" + "Plenty of text about this list. ".repeat(8) + "</p>";
export const FIXTURE = [H.map(q).join(","),
  row({ ID: "10", Type: "variable", Name: "Dentists Email List - Texas", Published: "1", Description: LONG, Categories: "Targeted Email Lists > Dentists", Tags: "dentists", Images: "https://example.com/a.jpg", "Attribute 1 value(s)": "1000, 5000, 20000, 50000" }),
  row({ ID: "11", Type: "variation", Name: "Dentists Email List - Texas - 1000", "Regular price": "50", "Sale price": "29", Parent: "id:10", "Download 1 URL": "https://mega.example.com/11", "Attribute 1 value(s)": "1000 Contacts" }),
  row({ ID: "12", Type: "variation", Name: "Dentists Email List - Texas - 5000", "Regular price": "90", "Sale price": "59", Parent: "id:10", "Download 1 URL": "https://mega.example.com/12", "Attribute 1 value(s)": "5000 Contacts" }),
  row({ ID: "13", Type: "variation", Name: "Dentists Email List - Texas - 20000", "Regular price": "190", Parent: "id:10", "Download 1 URL": "https://mega.example.com/13", "Attribute 1 value(s)": "20000 Contacts" }),
  row({ ID: "14", Type: "variation", Name: "Dentists Email List - Texas - 50000", "Regular price": "290", "Sale price": "199", Parent: "id:10", "Download 1 URL": "https://mega.example.com/14", "Attribute 1 value(s)": "50000 Contacts" }),
  row({ ID: "20", Type: "simple", Name: "Germany Business Email Database - 100,000 Contacts", Published: "1", Description: LONG, "Regular price": "299", "Sale price": "99", Categories: "Business Email Database > Germany Business Email Database", "Download 1 URL": "https://mega.example.com/20" }),
  row({ ID: "30", Type: "simple", Name: "UK Consumer Email Database - 2 Million Contacts", Published: "1", Description: "short", "Regular price": "199", Categories: "Consumer Email Database > UK Consumers Email Database" }),
  row({ ID: "40", Type: "simple", Name: "Dentists Email List - Texas", Published: "1", Description: LONG, "Regular price": "49", Categories: "Targeted Email Lists > Dentists", "Download 1 URL": "https://mega.example.com/40" }),
].join("\n");
