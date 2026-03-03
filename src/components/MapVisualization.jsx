import { useMemo } from "react";
import CaseMap, { parseNodeDate, findDateIndex, formatDateFull, formatNumber } from "./CaseMap";
import UsaCaseMap from "./UsaCaseMap";
import worldMapData from "../data/map-data.json";
import usMapData from "../data/us-map-data.json";

// ─── MapVisualization wrapper ────────────────────────────────────────────────
//
// Manages side-by-side layout (world + USA) and the shared annotation bar.
//
// Layout:
//   Desktop Ch1:   [  World (full width)  ]
//   Desktop Ch2-4: [ World (1/2) | USA (1/2) ]
//   Mobile Ch1:    [  World (full width)  ]
//   Mobile Ch2-4:  [  USA (full width)    ]

export default function MapVisualization({ currentDate, isVisible, chapterNumber }) {
  const showUsaMap = chapterNumber >= 2;

  // Compute annotation values from both datasets
  const annotation = useMemo(() => {
    const targetTs = parseNodeDate(currentDate);

    const worldIdx = findDateIndex(worldMapData.dates, targetTs);
    const worldDate = worldMapData.dates?.[worldIdx] || "";
    const worldTotal = worldMapData.global?.[worldIdx] || 0;

    let usDate = "";
    let usTotal = 0;
    if (showUsaMap && usMapData.dates?.length) {
      const usIdx = findDateIndex(usMapData.dates, targetTs);
      usDate = usMapData.dates?.[usIdx] || "";
      usTotal = usMapData.usTotal?.[usIdx] || 0;
    }

    return { worldDate, worldTotal, usDate, usTotal };
  }, [currentDate, showUsaMap]);

  // Use the world date for display (it covers all chapters)
  const displayDate = annotation.worldDate;

  if (!worldMapData.dates?.length) return null;

  // ── Chapter 1: World map only (same as before) ──
  if (!showUsaMap) {
    return (
      <CaseMap
        data={worldMapData}
        currentDate={currentDate}
        isVisible={isVisible}
        embedded={false}
      />
    );
  }

  // ── Chapters 2-4: Side-by-side on desktop, USA-only on mobile ──
  return (
    <div
      className="sticky top-0 z-20 overflow-hidden border-b border-stone-700/30"
      style={{
        animation: isVisible ? "fade-in-up 0.5s ease-out 0.5s both" : "none",
      }}
    >
      <div className="flex">
        {/* World map — hidden on mobile for Ch2+, half-width on desktop */}
        <div className="hidden lg:block lg:w-1/2">
          <CaseMap
            data={worldMapData}
            currentDate={currentDate}
            embedded
          />
        </div>

        {/* Divider between maps (desktop only) */}
        <div className="hidden lg:block w-px" style={{ backgroundColor: "#3a3a5a" }} />

        {/* USA map — full width on mobile, half-width on desktop */}
        <div className="w-full lg:flex-1">
          <UsaCaseMap
            data={usMapData}
            currentDate={currentDate}
          />
        </div>
      </div>

      {/* Shared annotation bar */}
      <div
        className="flex items-center justify-center gap-3 py-1.5 text-[10px] font-mono"
        style={{ backgroundColor: "#12121f" }}
      >
        {displayDate && (
          <span className="text-stone-500">{formatDateFull(displayDate)}</span>
        )}

        {/* World total — hidden on mobile for Ch2+ */}
        {displayDate && annotation.worldTotal > 0 && (
          <span className="hidden lg:inline-flex items-center gap-3">
            <span className="text-stone-700">|</span>
            <span className="text-red-400/80 font-medium">
              {formatNumber(annotation.worldTotal)} worldwide
            </span>
          </span>
        )}

        {/* US total — always shown for Ch2+ */}
        {displayDate && annotation.usTotal > 0 && (
          <>
            <span className="text-stone-700">|</span>
            <span className="text-red-400/80 font-medium">
              {formatNumber(annotation.usTotal)} US
            </span>
          </>
        )}

        {!displayDate && (
          <span className="text-stone-600 text-[9px] uppercase tracking-widest">
            Global Case Tracker
          </span>
        )}
      </div>
    </div>
  );
}
