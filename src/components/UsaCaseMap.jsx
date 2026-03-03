import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "@vnedyalk0v/react19-simple-maps";
import topology from "us-atlas/states-10m.json";
import { parseNodeDate, findDateIndex } from "./CaseMap";

// ─── Bubble sizing (smaller than world map — states are closer together) ─────

const MAX_RADIUS = 14;
const MIN_RADIUS = 1.5;

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * USA state-level map with red case bubbles.
 * Always renders in "embedded" mode (no sticky wrapper or annotation bar).
 *
 * @param {Object} props
 * @param {Object} props.data - US map data with dates, usTotal, states arrays
 * @param {string} props.currentDate - Current timeline node date string
 */
export default function UsaCaseMap({ data, currentDate }) {
  // Find the date index closest to the current scroll position
  const dateIndex = useMemo(() => {
    if (!currentDate || !data?.dates?.length) return 0;
    const targetTs = parseNodeDate(currentDate);
    return findDateIndex(data.dates, targetTs);
  }, [currentDate, data]);

  // Compute bubbles for the current date
  const bubbles = useMemo(() => {
    if (!data?.states?.length) return [];

    const active = data.states
      .map((s) => ({ ...s, value: s.cases[dateIndex] || 0 }))
      .filter((s) => s.value > 0);

    if (!active.length) return [];

    const maxVal = Math.max(...active.map((s) => s.value));
    const scale = MAX_RADIUS / Math.sqrt(maxVal || 1);

    return active
      .map((s) => ({
        id: s.id,
        name: s.name,
        coordinates: [s.lng, s.lat],
        radius: Math.max(MIN_RADIUS, Math.sqrt(s.value) * scale),
        cases: s.value,
      }))
      // Sort smallest first so large bubbles render on top
      .sort((a, b) => a.cases - b.cases);
  }, [data, dateIndex]);

  if (!data?.dates?.length) return null;

  return (
    <div className="relative" style={{ backgroundColor: "#1a1a2e" }}>
      <ComposableMap
        projection="geoAlbersUsa"
        width={800}
        height={500}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "170px",
          display: "block",
        }}
      >
        {/* State outlines */}
        <Geographies geography={topology}>
          {({ geographies }) =>
            geographies.map((geo, i) => (
              <Geography
                key={geo.rsmKey || geo.id || i}
                geography={geo}
                fill="#2a2a4a"
                stroke="#3a3a5a"
                strokeWidth={0.3}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Red bubbles at state centroids */}
        {bubbles.map((b) => (
          <Marker key={b.id} coordinates={b.coordinates}>
            <circle
              r={b.radius}
              fill="rgba(220, 38, 38, 0.6)"
              stroke="rgba(239, 68, 68, 0.85)"
              strokeWidth={0.5}
            />
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
