/**
 * One-time script: Extract per-state COVID-19 case data from NYT CSV
 * for the USA bubble map visualization.
 *
 * Usage:  node scripts/process-us-map-data.mjs
 * Input:  scripts/nyt-us-states.csv
 * Output: src/data/us-map-data.json
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "nyt-us-states.csv");
const outPath = join(__dirname, "..", "src", "data", "us-map-data.json");

// Date range covering Chapters 2-4
const START = "2020-01-21"; // First US case
const END = "2020-06-05";

// ─── State centroids (50 states + DC) ───────────────────────────────────────

const STATES = [
  { fips: "01", abbr: "AL", name: "Alabama",              lat: 32.32, lng: -86.90 },
  { fips: "02", abbr: "AK", name: "Alaska",               lat: 63.59, lng: -154.49 },
  { fips: "04", abbr: "AZ", name: "Arizona",              lat: 34.05, lng: -111.09 },
  { fips: "05", abbr: "AR", name: "Arkansas",             lat: 35.20, lng: -91.83 },
  { fips: "06", abbr: "CA", name: "California",           lat: 36.78, lng: -119.42 },
  { fips: "08", abbr: "CO", name: "Colorado",             lat: 39.55, lng: -105.78 },
  { fips: "09", abbr: "CT", name: "Connecticut",          lat: 41.60, lng: -72.76 },
  { fips: "10", abbr: "DE", name: "Delaware",             lat: 39.16, lng: -75.52 },
  { fips: "11", abbr: "DC", name: "District of Columbia", lat: 38.91, lng: -77.01 },
  { fips: "12", abbr: "FL", name: "Florida",              lat: 27.66, lng: -81.52 },
  { fips: "13", abbr: "GA", name: "Georgia",              lat: 32.16, lng: -82.90 },
  { fips: "15", abbr: "HI", name: "Hawaii",               lat: 19.90, lng: -155.58 },
  { fips: "16", abbr: "ID", name: "Idaho",                lat: 44.07, lng: -114.74 },
  { fips: "17", abbr: "IL", name: "Illinois",             lat: 40.63, lng: -89.40 },
  { fips: "18", abbr: "IN", name: "Indiana",              lat: 40.27, lng: -86.13 },
  { fips: "19", abbr: "IA", name: "Iowa",                 lat: 41.88, lng: -93.10 },
  { fips: "20", abbr: "KS", name: "Kansas",               lat: 39.01, lng: -98.48 },
  { fips: "21", abbr: "KY", name: "Kentucky",             lat: 37.67, lng: -84.67 },
  { fips: "22", abbr: "LA", name: "Louisiana",            lat: 31.17, lng: -91.87 },
  { fips: "23", abbr: "ME", name: "Maine",                lat: 45.25, lng: -69.45 },
  { fips: "24", abbr: "MD", name: "Maryland",             lat: 39.05, lng: -76.64 },
  { fips: "25", abbr: "MA", name: "Massachusetts",        lat: 42.41, lng: -71.38 },
  { fips: "26", abbr: "MI", name: "Michigan",             lat: 44.31, lng: -84.68 },
  { fips: "27", abbr: "MN", name: "Minnesota",            lat: 46.73, lng: -94.69 },
  { fips: "28", abbr: "MS", name: "Mississippi",          lat: 32.35, lng: -89.40 },
  { fips: "29", abbr: "MO", name: "Missouri",             lat: 38.46, lng: -92.29 },
  { fips: "30", abbr: "MT", name: "Montana",              lat: 46.88, lng: -110.36 },
  { fips: "31", abbr: "NE", name: "Nebraska",             lat: 41.49, lng: -99.90 },
  { fips: "32", abbr: "NV", name: "Nevada",               lat: 38.80, lng: -116.42 },
  { fips: "33", abbr: "NH", name: "New Hampshire",        lat: 43.19, lng: -71.57 },
  { fips: "34", abbr: "NJ", name: "New Jersey",           lat: 40.06, lng: -74.41 },
  { fips: "35", abbr: "NM", name: "New Mexico",           lat: 34.52, lng: -105.87 },
  { fips: "36", abbr: "NY", name: "New York",             lat: 42.17, lng: -74.95 },
  { fips: "37", abbr: "NC", name: "North Carolina",       lat: 35.76, lng: -79.02 },
  { fips: "38", abbr: "ND", name: "North Dakota",         lat: 47.55, lng: -101.00 },
  { fips: "39", abbr: "OH", name: "Ohio",                 lat: 40.42, lng: -82.91 },
  { fips: "40", abbr: "OK", name: "Oklahoma",             lat: 35.47, lng: -97.52 },
  { fips: "41", abbr: "OR", name: "Oregon",               lat: 43.80, lng: -120.55 },
  { fips: "42", abbr: "PA", name: "Pennsylvania",         lat: 41.20, lng: -77.19 },
  { fips: "44", abbr: "RI", name: "Rhode Island",         lat: 41.58, lng: -71.48 },
  { fips: "45", abbr: "SC", name: "South Carolina",       lat: 33.84, lng: -81.16 },
  { fips: "46", abbr: "SD", name: "South Dakota",         lat: 43.97, lng: -99.90 },
  { fips: "47", abbr: "TN", name: "Tennessee",            lat: 35.52, lng: -86.58 },
  { fips: "48", abbr: "TX", name: "Texas",                lat: 31.97, lng: -99.90 },
  { fips: "49", abbr: "UT", name: "Utah",                 lat: 39.32, lng: -111.09 },
  { fips: "50", abbr: "VT", name: "Vermont",              lat: 44.56, lng: -72.58 },
  { fips: "51", abbr: "VA", name: "Virginia",             lat: 37.43, lng: -78.66 },
  { fips: "53", abbr: "WA", name: "Washington",           lat: 47.75, lng: -120.74 },
  { fips: "54", abbr: "WV", name: "West Virginia",        lat: 38.60, lng: -80.45 },
  { fips: "55", abbr: "WI", name: "Wisconsin",            lat: 43.78, lng: -88.79 },
  { fips: "56", abbr: "WY", name: "Wyoming",              lat: 43.08, lng: -107.29 },
];

const FIPS_MAP = new Map(STATES.map((s) => [s.fips, s]));
const NAME_MAP = new Map(STATES.map((s) => [s.name, s]));

// ─── Parse CSV ───────────────────────────────────────────────────────────────

console.log("Reading NYT CSV...");
const csv = readFileSync(csvPath, "utf-8");
const lines = csv.split("\n");

// Header: date,state,fips,cases,deaths
const headers = lines[0].split(",");
const iDate = headers.indexOf("date");
const iState = headers.indexOf("state");
const iFips = headers.indexOf("fips");
const iCases = headers.indexOf("cases");

if (iDate < 0 || iState < 0 || iCases < 0) {
  console.error("Missing expected columns");
  process.exit(1);
}

// Collect dates + per-state data
const dateSet = new Set();
const stateData = {}; // abbr -> { date -> cases }

for (const s of STATES) {
  stateData[s.abbr] = {};
}

console.log("Processing rows...");
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(",");
  const date = cols[iDate];
  const stateName = cols[iState];
  const fips = cols[iFips];
  const cases = parseInt(cols[iCases]);

  if (date < START || date > END) continue;

  dateSet.add(date);

  // Match by FIPS first, then by name
  const state = FIPS_MAP.get(fips) || NAME_MAP.get(stateName);
  if (!state) {
    skipped++;
    continue; // Territory or unknown
  }

  stateData[state.abbr][date] = isNaN(cases) ? 0 : cases;
}

// Sort dates
const dates = [...dateSet].sort();
console.log(`Found ${dates.length} dates: ${dates[0]} -> ${dates[dates.length - 1]}`);
if (skipped > 0) console.log(`Skipped ${skipped} territory rows`);

// Build aligned arrays with forward-fill
const statesArray = STATES.map((s) => {
  const casesArr = [];
  let lastVal = 0;
  for (const d of dates) {
    const val = stateData[s.abbr][d];
    if (val != null && val > 0) lastVal = val;
    casesArr.push(lastVal);
  }
  return {
    id: s.abbr,
    fips: s.fips,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    cases: casesArr,
  };
});

// Compute US total per date (sum all states)
const usTotal = dates.map((_, di) =>
  statesArray.reduce((sum, s) => sum + (s.cases[di] || 0), 0)
);

// ─── Write output ────────────────────────────────────────────────────────────

const result = {
  dates,
  usTotal,
  states: statesArray,
};

const json = JSON.stringify(result);
writeFileSync(outPath, json, "utf-8");

console.log(`\n✓ Wrote ${outPath}`);
console.log(`  ${dates.length} dates, ${statesArray.length} states`);
console.log(`  File size: ${(json.length / 1024).toFixed(1)} KB`);

// Sample output
console.log("\nSample — US total cases:");
const sampleDates = ["2020-03-01", "2020-03-15", "2020-04-01", "2020-04-15", "2020-05-15", "2020-06-01"];
for (const sd of sampleDates) {
  const idx = dates.indexOf(sd);
  if (idx >= 0) {
    console.log(`  ${sd}: ${usTotal[idx].toLocaleString()}`);
  }
}

console.log("\nSample — Top 10 states at 2020-04-15:");
const aprIdx = dates.indexOf("2020-04-15");
if (aprIdx >= 0) {
  const ranked = statesArray
    .map((s) => ({ name: s.name, id: s.id, cases: s.cases[aprIdx] }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 10);
  for (const r of ranked) {
    console.log(`  ${r.id} (${r.name}): ${r.cases.toLocaleString()}`);
  }
}
