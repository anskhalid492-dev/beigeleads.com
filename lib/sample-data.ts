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
