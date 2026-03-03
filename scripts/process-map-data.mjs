/**
 * One-time script: Extract per-country COVID-19 case data from OWID CSV
 * for the bubble map visualization.
 *
 * Usage:  node scripts/process-map-data.mjs
 * Input:  scripts/owid-covid-data.csv
 * Output: src/data/map-data.json
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "owid-covid-data.csv");
const outPath = join(__dirname, "..", "src", "data", "map-data.json");

// Date range covering Chapters 1-4 with buffer
const START = "2019-12-01";
const END = "2020-06-05";

// ─── Target countries with centroid coordinates ──────────────────────────────

const COUNTRIES = [
  { iso: "CHN", name: "China",          lat: 35.86,  lng: 104.19 },
  { iso: "USA", name: "United States",  lat: 37.09,  lng: -95.71 },
  { iso: "BRA", name: "Brazil",         lat: -14.24, lng: -51.93 },
  { iso: "RUS", name: "Russia",         lat: 61.52,  lng: 105.32 },
  { iso: "ESP", name: "Spain",          lat: 40.46,  lng: -3.75  },
  { iso: "ITA", name: "Italy",          lat: 41.87,  lng: 12.57  },
  { iso: "GBR", name: "United Kingdom", lat: 55.38,  lng: -3.44  },
  { iso: "DEU", name: "Germany",        lat: 51.17,  lng: 10.45  },
  { iso: "FRA", name: "France",         lat: 46.23,  lng: 2.21   },
  { iso: "TUR", name: "Turkey",         lat: 38.96,  lng: 35.24  },
  { iso: "IRN", name: "Iran",           lat: 32.43,  lng: 53.69  },
  { iso: "IND", name: "India",          lat: 20.59,  lng: 78.96  },
  { iso: "MEX", name: "Mexico",         lat: 23.63,  lng: -102.55 },
  { iso: "PER", name: "Peru",           lat: -9.19,  lng: -75.02 },
  { iso: "CHL", name: "Chile",          lat: -35.68, lng: -71.54 },
  { iso: "CAN", name: "Canada",         lat: 56.13,  lng: -106.35 },
  { iso: "BEL", name: "Belgium",        lat: 50.50,  lng: 4.47   },
  { iso: "NLD", name: "Netherlands",    lat: 52.13,  lng: 5.29   },
  { iso: "CHE", name: "Switzerland",    lat: 46.82,  lng: 8.23   },
  { iso: "PRT", name: "Portugal",       lat: 39.40,  lng: -8.22  },
  { iso: "SWE", name: "Sweden",         lat: 60.13,  lng: 18.64  },
  { iso: "POL", name: "Poland",         lat: 51.92,  lng: 19.15  },
  { iso: "AUT", name: "Austria",        lat: 47.52,  lng: 14.55  },
  { iso: "ISR", name: "Israel",         lat: 31.05,  lng: 34.85  },
  { iso: "JPN", name: "Japan",          lat: 36.20,  lng: 138.25 },
  { iso: "KOR", name: "South Korea",    lat: 35.91,  lng: 127.77 },
  { iso: "SGP", name: "Singapore",      lat: 1.35,   lng: 103.82 },
  { iso: "AUS", name: "Australia",      lat: -25.27, lng: 133.78 },
  { iso: "ECU", name: "Ecuador",        lat: -1.83,  lng: -78.18 },
  { iso: "PAK", name: "Pakistan",       lat: 30.38,  lng: 69.35  },
  { iso: "SAU", name: "Saudi Arabia",   lat: 23.89,  lng: 45.08  },
  { iso: "QAT", name: "Qatar",          lat: 25.35,  lng: 51.18  },
  { iso: "BGD", name: "Bangladesh",     lat: 23.68,  lng: 90.36  },
  { iso: "IDN", name: "Indonesia",      lat: -0.79,  lng: 113.92 },
  { iso: "ZAF", name: "South Africa",   lat: -30.56, lng: 22.94  },
];

const TARGET_ISOS = new Set(COUNTRIES.map((c) => c.iso));

// ─── Parse CSV ───────────────────────────────────────────────────────────────

console.log("Reading CSV...");
const csv = readFileSync(csvPath, "utf-8");
const lines = csv.split("\n");
const headers = lines[0].split(",");

const iIso = headers.indexOf("iso_code");
const iDate = headers.indexOf("date");
const iTotal = headers.indexOf("total_cases");

if (iIso < 0 || iDate < 0 || iTotal < 0) {
  console.error("Missing expected columns");
  process.exit(1);
}

// Collect all dates in range + per-country data
const dateSet = new Set();
const countryData = {}; // iso -> { date -> totalCases }
const globalData = {};  // date -> totalCases

for (const c of COUNTRIES) {
  countryData[c.iso] = {};
}

console.log("Processing rows...");
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(",");
  const iso = cols[iIso];
  const date = cols[iDate];
  const total = parseInt(cols[iTotal]);

  if (date < START || date > END) continue;

  dateSet.add(date);

  // World total
  if (iso === "OWID_WRL") {
    globalData[date] = isNaN(total) ? 0 : total;
    continue;
  }

  // Target countries
  if (TARGET_ISOS.has(iso)) {
    countryData[iso][date] = isNaN(total) ? 0 : total;
  }
}

// Sort dates
const dates = [...dateSet].sort();
console.log(`Found ${dates.length} dates: ${dates[0]} → ${dates[dates.length - 1]}`);

// Build aligned arrays with forward-fill
const globalArray = [];
let lastGlobal = 0;
for (const d of dates) {
  if (globalData[d] != null) lastGlobal = globalData[d];
  globalArray.push(lastGlobal);
}

const countriesArray = COUNTRIES.map((c) => {
  const casesArr = [];
  let lastVal = 0;
  for (const d of dates) {
    const val = countryData[c.iso][d];
    if (val != null && val > 0) lastVal = val;
    casesArr.push(lastVal);
  }
  return {
    id: c.iso,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    cases: casesArr,
  };
});

// ─── Write output ────────────────────────────────────────────────────────────

const result = {
  dates,
  global: globalArray,
  countries: countriesArray,
};

const json = JSON.stringify(result);
writeFileSync(outPath, json, "utf-8");

console.log(`\n✓ Wrote ${outPath}`);
console.log(`  ${dates.length} dates, ${countriesArray.length} countries`);
console.log(`  File size: ${(json.length / 1024).toFixed(1)} KB`);

// Sample output
console.log("\nSample — Global total cases:");
const sampleDates = ["2020-01-22", "2020-02-15", "2020-03-15", "2020-04-15", "2020-05-15"];
for (const sd of sampleDates) {
  const idx = dates.indexOf(sd);
  if (idx >= 0) {
    console.log(`  ${sd}: ${globalArray[idx].toLocaleString()}`);
  }
}

console.log("\nSample — Top 5 countries at 2020-04-15:");
const aprIdx = dates.indexOf("2020-04-15");
if (aprIdx >= 0) {
  const ranked = countriesArray
    .map((c) => ({ name: c.name, cases: c.cases[aprIdx] }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 5);
  for (const r of ranked) {
    console.log(`  ${r.name}: ${r.cases.toLocaleString()}`);
  }
}
