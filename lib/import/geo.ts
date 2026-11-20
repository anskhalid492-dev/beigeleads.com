// Country and US-state lookup used by the WooCommerce importer. Pure data, no network.
export const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"] as const;

// "Name|ISO2|alias;alias" . Aliases are matched as whole words, longest first.
const RAW = `United States|US|USA;US;U.S.;America;American;United States of America
United Kingdom|GB|UK;U.K.;Britain;British;United Kingdom (UK)
Canada|CA|Canadian
Australia|AU|Australian
Germany|DE|German
France|FR|French
Italy|IT|Italian
Spain|ES|Spanish
Portugal|PT
Netherlands|NL|Dutch;Holland
Belgium|BE
Switzerland|CH|Swiss
Austria|AT
Ireland|IE|Irish
Sweden|SE
Norway|NO
Denmark|DK
Finland|FI
Poland|PL
Czech Republic|CZ|Czech;Czechia
Slovakia|SK
Hungary|HU
Romania|RO
Bulgaria|BG
Greece|GR
Turkey|TR|Turkiye
Russia|RU
Ukraine|UA
Serbia|RS
Croatia|HR
Slovenia|SI
Lithuania|LT
Latvia|LV
Estonia|EE
Iceland|IS
Luxembourg|LU
Malta|MT
Cyprus|CY
Israel|IL
Egypt|EG
Morocco|MA
Algeria|DZ
Tunisia|TN
Nigeria|NG
Ghana|GH
Kenya|KE
Ethiopia|ET
Tanzania|TZ
Uganda|UG
Zambia|ZM
Zimbabwe|ZW
Botswana|BW
Namibia|NA
Mozambique|MZ
Angola|AO
Cameroon|CM
Senegal|SN
Togo|TG
Burkina Faso|BF
South Africa|ZA
Saudi Arabia|SA|KSA
United Arab Emirates|AE|UAE;Dubai
Qatar|QA
Kuwait|KW
Bahrain|BH
Oman|OM
Jordan|JO
Lebanon|LB
Iraq|IQ
Iran|IR
Pakistan|PK
India|IN|Indian
Bangladesh|BD
Sri Lanka|LK
Nepal|NP
China|CN|Chinese
Hong Kong|HK|Hongkong
Taiwan|TW
Japan|JP|Japanese
South Korea|KR|Korea;Korean
Singapore|SG
Malaysia|MY
Indonesia|ID
Thailand|TH
Vietnam|VN|Viet Nam
Philippines|PH
Cambodia|KH
New Zealand|NZ
Mexico|MX|Mexican
Brazil|BR|Brazilian
Argentina|AR
Chile|CL
Colombia|CO
Peru|PE
Venezuela|VE
Ecuador|EC
Uruguay|UY
Paraguay|PY
Bolivia|BO
Costa Rica|CR
Panama|PA
Guatemala|GT
Dominican Republic|DO
Jamaica|JM
Puerto Rico|PR
Kazakhstan|KZ
Azerbaijan|AZ
Georgia (country)|GE
Armenia|AM
Gulf Cooperation Council|GCC|GCC;Gulf
Europe|EUR|European
Asia Pacific|APAC|APAC;Asia-Pacific
Middle East|MENA|MiddleEast;MENA
Africa|AFR|African
Latin America|LATAM|LatAm
Worldwide|WW|Global;International;World`;

export type CountryInfo = { name: string; code: string; slug: string; aliases: string[] };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const COUNTRIES: CountryInfo[] = RAW.split("\n").map((l) => {
  const [name, code, al] = l.split("|");
  const clean = name.replace(/ \(country\)$/, "");
  return { name: clean, code, slug: slugify(clean), aliases: [clean, ...(al ? al.split(";") : [])] };
});

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COUNTRY_RES = COUNTRIES.flatMap((c) => c.aliases.map((a) => ({ c, a, re: new RegExp(`(^|[^a-z0-9])${esc(a)}(?![a-z0-9])`, "i") }))).sort((x, y) => y.a.length - x.a.length);

/** The country named at the START of a title or in a category label, or null. Ambiguous "Georgia" is a US state, not the country. */
export function countryIn(text: string, anywhere = false): CountryInfo | null {
  const t = text.trim();
  for (const x of COUNTRY_RES) {
    if (x.c.code === "GE") continue; // "Georgia" is almost always the US state in this catalog
    const m = x.re.exec(t);
    if (m && (anywhere || m.index <= 1 || /^(the )?$/i.test(t.slice(0, m.index).trim()))) return x.c;
  }
  return null;
}

const STATE_RES = [...US_STATES].sort((a, b) => b.length - a.length).map((s) => ({ s, re: new RegExp(`(^|[^a-z])${esc(s)}(?![a-z])`, "i") }));
/** A US state named in the text. "Washington" and "Virginia" are matched longest-first so West Virginia wins. */
export function stateIn(text: string): string | null {
  for (const x of STATE_RES) if (x.re.test(text)) return x.s;
  return null;
}
export { slugify };
