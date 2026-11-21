// Local Businesses Database (section 111). Pure and deterministic: decides, from a product's OWN name and fields, whether an
// existing list targets local establishments / location-based service businesses. Never creates anything; it only classifies.
//   move   = clearly a local-business list
//   review = might be, but the audience is ambiguous (owners/executives of a local trade, medical professionals, etc.): left alone, flagged
//   keep   = broad B2B, executive, job-title, technology, consumer or general industry data: left alone
import { subjectOf } from "@/lib/import/seo-text";

export const LOCAL_SLUG = "local-businesses-database";
export const LOCAL_NAME = "Local Businesses Database";

export type LocalInput = { name: string; categoryName: string; channel: string; grp?: string; countryName: string; region?: string | null };
export type LocalVerdict = { decision: "move" | "review" | "keep"; industry: string; reason: string };

// Each rule: pattern over the audience words, and the industry label used on the category page.
const LOCAL: [RegExp, string][] = [
  [/\b(restaurants?|cafes?|caf[eé]s?|coffee shops?|bakery|bakeries|bars?|pubs?|bistros?|pizzer\w+|diners?|catering|food trucks?|breweries|brewery|bubble tea|ice cream)\b/i, "Restaurants, cafes and bars"],
  [/\b(hotels?|motels?|hostels?|resorts?|inns?|bed and breakfast|lodging|guest ?houses?|vacation rentals?)\b/i, "Hotels and hospitality"],
  [/\b(beauty|hair|salons?|barber\w*|nail|spas?|day spas?|cosmetic|tattoo|massage|lash|waxing|skin ?care clinics?)\b/i, "Salons, barbers and spas"],
  [/\b(gyms?|fitness|yoga|pilates|crossfit|martial arts|dance studios?|personal trainers?|health clubs?)\b/i, "Gyms and fitness studios"],
  [/\b(dentists?|dental|orthodontists?|chiropract\w+|veterinar\w+|vets?|animal hospitals?|pet (?:groomers?|stores?|shops?)|optometr\w+|opticians?|pharmac(?:y|ies|ists?)|physiotherap\w+|physical therap\w+)\b/i, "Dentists, chiropractors, vets and pharmacies"],
  [/\b(plumb\w+|electricians?|hvac|heating|air conditioning|roof\w*|handymen|handyman|locksmiths?|garage doors?|painters? and decorators?|flooring|carpet|windows? installers?|pool (?:services?|cleaning|contractors?))\b/i, "Home services and trades"],
  [/\b(cleaning|cleaners|janitorial|maids?|landscap\w+|lawn|gardeners?|tree services?|pest control|exterminators?|pressure washing|moving companies|movers)\b/i, "Cleaning, landscaping and pest control"],
  [/\b(auto repair|auto shops?|mechanics?|car washes?|car wash|car dealers?|car dealerships?|dealerships?|tire shops?|tyre|body shops?|auto parts|used cars?|towing|garages?)\b/i, "Auto repair, car washes and dealerships"],
  [/\b(grocery|groceries|supermarkets?|convenience stores?|boutiques?|florists?|bookstores?|gift shops?|jewel\w+ stores?|furniture stores?|clothing stores?|liquor stores?|retail stores?|local retail|shops?|stores?)\b/i, "Local retail stores"],
  [/\b(real estate (?:agents?|agencies|agency|brokers?|brokerages?|offices?|companies)|realtors?|property managers?|property management|estate agents?|letting agents?)\b/i, "Real estate agencies and property managers"],
  [/\b(accountants?|accounting|cpas?|bookkeep\w+|tax (?:preparers?|services?)|lawyers?|attorneys?|law firms?|solicitors?|notar\w+|insurance (?:agents?|agencies|agency|brokers?|offices?)|financial advisors?|mortgage brokers?)\b/i, "Local accounting, legal and insurance offices"],
  [/\b(child ?care|daycares?|preschools?|driving schools?|tutor\w*|music (?:schools?|lessons)|funeral homes?|laundr\w+|dry cleaners?|photograph\w+|printing shops?|print shops?|travel agen\w+|storage)\b/i, "Other local service businesses"],
];

// The audience is a person or role, or is broad: never a local-establishment list on its own.
const ROLE = /\b(ceo|cfo|cto|cmo|coo|c-level|c suite|executives?|owners?|founders?|presidents?|managers?|directors?|vp|vice presidents?|decision makers?|employees?|staff|professionals?|practitioners?|job titles?|heads? of)\b/i;
const BROAD = /^(business|businesses|companies|company|small business|small businesses|smb|smbs|b2b|general|all|targeted|local business|local businesses|enterprises?|corporations?|startups?|organi[sz]ations?)$/i;
// Medical practitioners and institutions are people / large facilities, not clearly "local shops": send to manual review.
const MEDICAL = /\b(doctors?|physicians?|surgeons?|nurses?|psycholog\w+|psychiatr\w+|therapists?|counsel\w+|hospitals?|clinics?|specialists?|midwi\w+|caregivers?|urgent care|medical)\b/i;
// Never local-establishment lists.
const NOT_LOCAL = /\b(software|saas|technology|tech companies|it companies|manufactur\w+|wholesal\w+|distributors?|logistics|oil|gas|mining|pharmaceutical|biotech|banks?|banking|universities|colleges|(?<!driving |music )schools|k-12|churches|non-?profits?|government|agenc(?:y|ies) (?:marketing|advertising)|marketing agenc\w+|advertising agenc\w+|engineering|consulting|startups?|investors?|venture|crypto|blockchain|e-?commerce|shopify|wordpress|amazon|youtube|instagram|influencers?|creators?|linkedin|facebook|twitter|tiktok)\b/i;

/** Classify one product. Uses the product's own name; the stored category is only a fallback hint. */
export function classifyLocal(p: LocalInput): LocalVerdict {
  const subject = subjectOf({ name: p.name, categoryName: p.categoryName, channel: p.channel, countryName: p.countryName, region: p.region ?? "", recordCount: null, placeholder: false });
  const text = `${subject} ${p.name}`;
  if (p.channel === "consumer-email") return { decision: "keep", industry: "", reason: "Consumer list, not a business list" };
  if (p.grp === "job-title" || p.grp === "technology") return { decision: "keep", industry: "", reason: p.grp === "job-title" ? "Job-title database" : "Technology database" };
  if (BROAD.test(subject.trim())) return { decision: "keep", industry: "", reason: "Broad B2B list, not tied to local establishments" };
  if (NOT_LOCAL.test(text)) return { decision: "keep", industry: "", reason: "Industry or role list that is not a local-establishment business" };
  const hit = LOCAL.find(([re]) => re.test(subject));
  if (!hit) {
    if (MEDICAL.test(subject)) return { decision: "review", industry: "", reason: "Medical professionals or facilities: unclear whether this is a local-business list" };
    return { decision: "keep", industry: "", reason: "No local-establishment audience found in the name" };
  }
  if (ROLE.test(subject.replace(/\bproperty managers?\b/gi, " "))) return { decision: "review", industry: hit[1], reason: "Targets people or owners of a local trade (role-based), so it may be a job-title list" };
  if (MEDICAL.test(subject) && !/\b(dentists?|dental|chiropract\w+|veterinar\w+|vets?|pharmac\w+|optometr\w+|opticians?|physio\w*)\b/i.test(subject)) return { decision: "review", industry: hit[1], reason: "Mixes medical audiences with a local trade" };
  // Only whole-country or regional lists of a local trade are moved; a mixed subject ("Hotels and Software") is reviewed.
  if (LOCAL.filter(([re]) => re.test(subject)).length > 2) return { decision: "review", industry: hit[1], reason: "Several different audiences in one name" };
  return { decision: "move", industry: hit[1], reason: `Targets ${hit[1].toLowerCase()}` };
}
