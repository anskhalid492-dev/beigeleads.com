// Small built-in lists for the builder's suggestions. They are suggestions only, never a claim that a list exists.
export const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Spain", "Italy", "Netherlands", "Ireland", "Sweden", "Norway", "Denmark", "Finland", "Switzerland", "Austria", "Belgium", "Portugal", "Poland", "New Zealand",
  "Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Singapore", "Malaysia", "Indonesia", "Philippines", "Thailand", "Vietnam", "Japan", "South Korea", "China", "Hong Kong", "Taiwan",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Israel", "Turkey", "Egypt", "South Africa", "Nigeria", "Kenya", "Morocco", "Ghana",
  "Czech Republic", "Hungary", "Romania", "Bulgaria", "Greece", "Croatia", "Serbia", "Ukraine", "Estonia", "Latvia", "Lithuania", "Luxembourg", "Iceland", "Malta", "Cyprus", "Slovakia", "Slovenia",
  "Costa Rica", "Panama", "Dominican Republic", "Jamaica", "Puerto Rico", "Uruguay", "Ecuador", "Bolivia", "Paraguay", "Venezuela",
  "Kazakhstan", "Uzbekistan", "Nepal", "Cambodia", "Jordan", "Lebanon", "Oman", "Bahrain", "Tunisia", "Algeria", "Ethiopia", "Tanzania", "Uganda", "Zimbabwe", "Zambia",
] as const;

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
] as const;

export const CA_PROVINCES = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"] as const;

export const REGIONS: Record<string, readonly string[]> = { "United States": US_STATES, Canada: CA_PROVINCES };

// Examples only. Not a statement of what BeigeLeads has in stock.
export const INDUSTRY_EXAMPLES = ["Dentists", "Restaurants", "Real estate agencies", "Marketing agencies", "Medical spas", "Accounting firms", "Construction companies", "Law firms", "Gyms and fitness studios", "Auto repair shops", "Hotels", "Veterinary clinics", "Insurance agencies", "Roofing contractors", "Schools and tutoring centers"] as const;

export const JOB_TITLE_EXAMPLES = ["CEO", "Founder", "Owner", "Marketing Director", "Sales Manager", "Practice Owner", "Operations Manager", "General Manager", "Office Manager", "Practice Manager", "Head of Procurement", "HR Manager"] as const;

export const COMPANY_SIZES = ["", "1-10 employees", "11-50 employees", "51-200 employees", "201-1,000 employees", "1,000+ employees"] as const;
export const REVENUE_RANGES = ["", "Under $1M", "$1M-$10M", "$10M-$50M", "$50M-$250M", "$250M+"] as const;
