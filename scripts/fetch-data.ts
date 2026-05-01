/**
 * Fetch IMF WEO data and generate src/data.ts
 * Run: bun scripts/fetch-data.ts
 */

import { writeFileSync } from "fs";

interface ImfSeries {
  [year: string]: number;
}

interface ImfResponse {
  values: {
    [indicator: string]: {
      [countryCode: string]: ImfSeries;
    };
  };
}

// Country name mappings from IMF codes
const countryNames: Record<string, string> = {
  AFG: "Afghanistan",
  ALB: "Albania",
  DZA: "Algeria",
  AND: "Andorra",
  AGO: "Angola",
  ATG: "Antigua and Barbuda",
  ARG: "Argentina",
  ARM: "Armenia",
  ABW: "Aruba",
  AUS: "Australia",
  AUT: "Austria",
  AZE: "Azerbaijan",
  BHS: "Bahamas",
  BHR: "Bahrain",
  BGD: "Bangladesh",
  BRB: "Barbados",
  BLR: "Belarus",
  BEL: "Belgium",
  BLZ: "Belize",
  BEN: "Benin",
  BTN: "Bhutan",
  BOL: "Bolivia",
  BIH: "Bosnia and Herzegovina",
  BWA: "Botswana",
  BRA: "Brazil",
  BRN: "Brunei",
  BGR: "Bulgaria",
  BFA: "Burkina Faso",
  BDI: "Burundi",
  CPV: "Cabo Verde",
  KHM: "Cambodia",
  CMR: "Cameroon",
  CAN: "Canada",
  CAF: "Central African Republic",
  TCD: "Chad",
  CHL: "Chile",
  CHN: "China",
  COL: "Colombia",
  COM: "Comoros",
  COD: "Congo, Dem. Rep.",
  COG: "Congo, Rep.",
  CRI: "Costa Rica",
  CIV: "Cote d'Ivoire",
  HRV: "Croatia",
  CUB: "Cuba",
  CYP: "Cyprus",
  CZE: "Czech Republic",
  DNK: "Denmark",
  DJI: "Djibouti",
  DMA: "Dominica",
  DOM: "Dominican Republic",
  ECU: "Ecuador",
  EGY: "Egypt",
  SLV: "El Salvador",
  GNQ: "Equatorial Guinea",
  ERI: "Eritrea",
  EST: "Estonia",
  SWZ: "Eswatini",
  ETH: "Ethiopia",
  FJI: "Fiji",
  FIN: "Finland",
  FRA: "France",
  GAB: "Gabon",
  GMB: "Gambia",
  GEO: "Georgia",
  DEU: "Germany",
  GHA: "Ghana",
  GRC: "Greece",
  GRD: "Grenada",
  GTM: "Guatemala",
  GIN: "Guinea",
  GNB: "Guinea-Bissau",
  GUY: "Guyana",
  HTI: "Haiti",
  HND: "Honduras",
  HKG: "Hong Kong SAR",
  HUN: "Hungary",
  ISL: "Iceland",
  IND: "India",
  IDN: "Indonesia",
  IRN: "Iran",
  IRQ: "Iraq",
  IRL: "Ireland",
  ISR: "Israel",
  ITA: "Italy",
  JAM: "Jamaica",
  JPN: "Japan",
  JOR: "Jordan",
  KAZ: "Kazakhstan",
  KEN: "Kenya",
  KIR: "Kiribati",
  PRK: "Korea, Dem. People's Rep.",
  KOR: "Korea, Republic of",
  UVK: "Kosovo",
  KWT: "Kuwait",
  KGZ: "Kyrgyz Republic",
  LAO: "Laos",
  LVA: "Latvia",
  LBN: "Lebanon",
  LSO: "Lesotho",
  LBR: "Liberia",
  LBY: "Libya",
  LTU: "Lithuania",
  LUX: "Luxembourg",
  MAC: "Macao SAR",
  MDG: "Madagascar",
  MWI: "Malawi",
  MYS: "Malaysia",
  MDV: "Maldives",
  MLI: "Mali",
  MLT: "Malta",
  MHL: "Marshall Islands",
  MRT: "Mauritania",
  MUS: "Mauritius",
  MEX: "Mexico",
  FSM: "Micronesia, Fed. States of",
  MDA: "Moldova",
  MCO: "Monaco",
  MNG: "Mongolia",
  MNE: "Montenegro",
  MAR: "Morocco",
  MOZ: "Mozambique",
  MMR: "Myanmar",
  NAM: "Namibia",
  NRU: "Nauru",
  NPL: "Nepal",
  NLD: "Netherlands",
  NZL: "New Zealand",
  NIC: "Nicaragua",
  NER: "Niger",
  NGA: "Nigeria",
  MKD: "North Macedonia",
  NOR: "Norway",
  OMN: "Oman",
  PAK: "Pakistan",
  PLW: "Palau",
  PAN: "Panama",
  PNG: "Papua New Guinea",
  PRY: "Paraguay",
  PER: "Peru",
  PHL: "Philippines",
  POL: "Poland",
  PRT: "Portugal",
  QAT: "Qatar",
  ROU: "Romania",
  RUS: "Russian Federation",
  RWA: "Rwanda",
  WSM: "Samoa",
  SMR: "San Marino",
  STP: "Sao Tome and Principe",
  SAU: "Saudi Arabia",
  SEN: "Senegal",
  SRB: "Serbia",
  SYC: "Seychelles",
  SLE: "Sierra Leone",
  SGP: "Singapore",
  SVK: "Slovak Republic",
  SVN: "Slovenia",
  SLB: "Solomon Islands",
  SOM: "Somalia",
  ZAF: "South Africa",
  SSD: "South Sudan",
  ESP: "Spain",
  LKA: "Sri Lanka",
  KNA: "St. Kitts and Nevis",
  LCA: "St. Lucia",
  VCT: "St. Vincent and the Grenadines",
  SDN: "Sudan",
  SUR: "Suriname",
  SWE: "Sweden",
  CHE: "Switzerland",
  SYR: "Syria",
  TWN: "Taiwan Province of China",
  TJK: "Tajikistan",
  TZA: "Tanzania",
  THA: "Thailand",
  TLS: "Timor-Leste",
  TGO: "Togo",
  TON: "Tonga",
  TTO: "Trinidad and Tobago",
  TUN: "Tunisia",
  TUR: "Turkiye",
  TKM: "Turkmenistan",
  TUV: "Tuvalu",
  UGA: "Uganda",
  UKR: "Ukraine",
  ARE: "United Arab Emirates",
  GBR: "United Kingdom",
  USA: "United States",
  URY: "Uruguay",
  UZB: "Uzbekistan",
  VUT: "Vanuatu",
  VEN: "Venezuela",
  VNM: "Vietnam",
  YEM: "Yemen",
  ZMB: "Zambia",
  ZWE: "Zimbabwe",
};

async function fetchImf(url: string): Promise<ImfResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function escapeStr(s: string): string {
  return s.replace(/'/g, "\\'");
}

async function main() {
  console.log("Fetching debt/GDP data...");
  const debtRes = await fetchImf(
    "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP?periods=2024"
  );
  console.log("Fetching GDP data...");
  const gdpRes = await fetchImf(
    "https://www.imf.org/external/datamapper/api/v1/NGDPD?periods=2024"
  );

  const debtSeries = debtRes.values.GGXWDG_NGDP;
  const gdpSeries = gdpRes.values.NGDPD;

  const records: {
    iso3: string;
    name: string;
    debtPctGdp: number;
    gdpB: number;
    debtAbsB: number;
  }[] = [];

  for (const [code, years] of Object.entries(debtSeries)) {
    const debtPct = years["2024"];
    const gdpData = gdpSeries[code];
    const gdpB = gdpData?.["2024"];

    if (debtPct == null || gdpB == null) continue;
    if (gdpB <= 0) continue;

    const name = countryNames[code] || code;
    const debtAbsB = (debtPct / 100) * gdpB;

    records.push({
      iso3: code,
      name,
      debtPctGdp: Math.round(debtPct * 10) / 10,
      gdpB: Math.round(gdpB * 100) / 100,
      debtAbsB: Math.round(debtAbsB * 100) / 100,
    });
  }

  records.sort((a, b) => b.debtPctGdp - a.debtPctGdp);

  console.log(`Generated ${records.length} records`);

  let ts = `export interface DebtData {
  name: string;
  iso3: string;
  debtPctGdp: number;
  debtAbsB: number;
  gdpB: number;
}

export const debtData: DebtData[] = [
`;

  for (const r of records) {
    ts += `  { name: "${escapeStr(r.name)}", iso3: "${r.iso3}", debtPctGdp: ${r.debtPctGdp}, debtAbsB: ${r.debtAbsB}, gdpB: ${r.gdpB} },\n`;
  }

  ts += `];

export const debtByIso3 = new Map(debtData.map((d) => [d.iso3, d]));

export function formatBillions(v: number): string {
  if (v >= 1000) return \`$\${(v / 1000).toFixed(1)}T\`;
  if (v >= 1) return \`$\${v.toFixed(1)}B\`;
  return \`$\${(v * 1000).toFixed(0)}M\`;
}

export function formatPct(v: number): string {
  return \`\${v.toFixed(1)}%\`;
}
`;

  writeFileSync("src/data.ts", ts);
  console.log("Wrote src/data.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
