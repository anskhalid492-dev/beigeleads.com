// PLACEHOLDER rows to show layout only. Not real businesses, not real data.
// Replace with real masked samples from the pipeline (see TODO-BEFORE-LAUNCH.md).
export type SampleRow = readonly [business: string, location: string, email: string, phone: string];

export const sampleColumns = ["Business", "Location", "Email", "Phone"] as const;

export const sampleSheets: Record<string, { label: string; rows: readonly SampleRow[] }> = {
  dentists: {
    label: "Dentists",
    rows: [
      ["Sample Dental Studio", "Denver, US", "o***@example.com", "+1 303 ••• ••01"],
      ["Placeholder Family Dentistry", "Chicago, US", "i***@example.com", "+1 312 ••• ••02"],
      ["Example Smile Clinic", "London, GB", "h***@example.com", "+44 20 •••• ••03"],
      ["Demo Orthodontics", "Toronto, CA", "c***@example.com", "+1 416 ••• ••04"],
    ],
  },
  restaurants: {
    label: "Restaurants",
    rows: [
      ["Sample Noodle House", "Chicago, US", "m***@example.com", "+1 312 ••• ••11"],
      ["Placeholder Bistro", "London, GB", "r***@example.com", "+44 20 •••• ••12"],
      ["Example Grill & Bar", "Denver, US", "g***@example.com", "+1 303 ••• ••13"],
      ["Demo Bakery Café", "Toronto, CA", "b***@example.com", "+1 416 ••• ••14"],
    ],
  },
  "ski-shops": {
    label: "Ski shops",
    rows: [
      ["Sample Alpine Outfitters", "Denver, US", "s***@example.com", "+1 303 ••• ••21"],
      ["Placeholder Snow & Board", "Vancouver, CA", "w***@example.com", "+1 604 ••• ••22"],
      ["Example Ski Rental", "Chamonix, FR", "l***@example.com", "+33 4 •• •• ••23"],
      ["Demo Powder Supply", "Salt Lake City, US", "p***@example.com", "+1 801 ••• ••24"],
    ],
  },
};

// PLACEHOLDER rows for the product-page database preview. Fictional businesses on reserved example
// domains; contact details are masked the same way real samples will be.
export type ProductSampleRow = {
  business: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
};

const r = (business: string, address: string, city: string, phone: string, email: string, website: string): ProductSampleRow => ({
  business, address, city, phone, email, website,
});

export const productSamples: Record<string, readonly ProductSampleRow[]> = {
  dentists: [
    r("Sample Dental Studio", "12 ••••• St", "Denver", "+1 303 ••• ••01", "o***@example.com", "sample-dental.example"),
    r("Placeholder Family Dentistry", "840 ••••• Ave", "Chicago", "+1 312 ••• ••02", "i***@example.com", "placeholder-family.example"),
    r("Example Smile Clinic", "7 ••••• Blvd", "Austin", "+1 512 ••• ••03", "h***@example.com", "example-smile.example"),
    r("Demo Orthodontics", "301 ••••• Rd", "Seattle", "+1 206 ••• ••04", "c***@example.com", "demo-ortho.example"),
    r("Sample Pediatric Dental", "55 ••••• Ln", "Boston", "+1 617 ••• ••05", "p***@example.com", "sample-pediatric.example"),
    r("Placeholder Implant Center", "2 ••••• Way", "Phoenix", "+1 602 ••• ••06", "m***@example.com", "placeholder-implant.example"),
  ],
  restaurants: [
    r("Sample Noodle House", "18 ••••• St", "Chicago", "+1 312 ••• ••11", "m***@example.com", "sample-noodle.example"),
    r("Placeholder Bistro", "402 ••••• Ave", "Denver", "+1 303 ••• ••12", "r***@example.com", "placeholder-bistro.example"),
    r("Example Grill & Bar", "9 ••••• Blvd", "Austin", "+1 512 ••• ••13", "g***@example.com", "example-grill.example"),
    r("Demo Bakery Café", "77 ••••• Rd", "Seattle", "+1 206 ••• ••14", "b***@example.com", "demo-bakery.example"),
    r("Sample Taqueria", "31 ••••• Ln", "Phoenix", "+1 602 ••• ••15", "t***@example.com", "sample-taqueria.example"),
    r("Placeholder Pizzeria", "5 ••••• Way", "Boston", "+1 617 ••• ••16", "z***@example.com", "placeholder-pizza.example"),
  ],
  "ski-shops": [
    r("Sample Alpine Outfitters", "14 ••••• St", "Denver", "+1 303 ••• ••21", "s***@example.com", "sample-alpine.example"),
    r("Placeholder Snow & Board", "260 ••••• Ave", "Seattle", "+1 206 ••• ••22", "w***@example.com", "placeholder-snow.example"),
    r("Example Ski Rental", "3 ••••• Blvd", "Salt Lake City", "+1 801 ••• ••23", "l***@example.com", "example-skirental.example"),
    r("Demo Powder Supply", "88 ••••• Rd", "Boston", "+1 617 ••• ••24", "p***@example.com", "demo-powder.example"),
    r("Sample Tune & Wax", "20 ••••• Ln", "Chicago", "+1 312 ••• ••25", "t***@example.com", "sample-tune.example"),
    r("Placeholder Mountain Gear", "6 ••••• Way", "Phoenix", "+1 602 ••• ••26", "g***@example.com", "placeholder-mtn.example"),
  ],
};
