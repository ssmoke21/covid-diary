import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { parseNodeDate, findDateIndex, formatDateFull } from "./CaseMap";

// ─── Variant rendering order (bottom → top of stack) ────────────────────────

const VARIANT_KEYS = [
  "wildtype", "alpha", "beta", "gamma", "delta",
  "ba1", "ba2", "ba2121", "ba45", "bq",
];

// ─── X-axis tick formatter ──────────────────────────────────────────────────

const SHORT_MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatTick(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${SHORT_MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * 100% stacked area chart showing SARS-CoV-2 variant proportions over time.
 * Progressive reveal — only shows data up to the current scroll date.
 * MAB EUA events shown as reference lines.
 *
 * @param {Object} props
 * @param {Object} props.data - Variant data with weeks, mab_events, variant_meta
 * @param {string} props.currentDate - Current timeline node date string
 */
export default function VariantChart({ data, currentDate }) {
  const dates = useMemo(() => {
    if (!data?.weeks?.length) return [];
    return data.weeks.map((w) => w.date);
  }, [data]);

  // Find the cursor position in the data
  const cursorIndex = useMemo(() => {
    if (!currentDate || !dates.length) return 0;
    const targetTs = parseNodeDate(currentDate);
    if (!targetTs) return 0;
    return findDateIndex(dates, targetTs);
  }, [currentDate, dates]);

  // Only reveal data up to the current scroll position
  const chartData = useMemo(() => {
    if (!data?.weeks?.length) return [];
    return data.weeks.slice(0, cursorIndex + 1);
  }, [data, cursorIndex]);

  // Current date string for the scroll cursor line
  const cursorDate = dates[cursorIndex] || null;

  // Compute annotation: dominant variant + last MAB event
  const annotation = useMemo(() => {
    if (!chartData.length || !data?.variant_meta) return null;
    const current = chartData[chartData.length - 1];

    // Find dominant variant
    let dominantKey = "wildtype";
    let dominantVal = 0;
    for (const key of VARIANT_KEYS) {
      if ((current[key] || 0) > dominantVal) {
        dominantKey = key;
        dominantVal = current[key];
      }
    }

    // Find most recent MAB event at or before the current date
    const currentTs = new Date(current.date + "T00:00:00").getTime();
    let lastEvent = null;
    if (data.mab_events) {
      for (const evt of data.mab_events) {
        const evtTs = new Date(evt.date + "T00:00:00").getTime();
        if (evtTs <= currentTs) lastEvent = evt;
      }
    }

    return {
      date: current.date,
      dominantKey,
      dominantLabel: data.variant_meta[dominantKey]?.label || dominantKey,
      dominantColor: data.variant_meta[dominantKey]?.color || "#94a3b8",
      dominantPct: Math.round(dominantVal),
      lastEvent,
    };
  }, [chartData, data]);

  // MAB events that fall within the revealed date range
  const visibleEvents = useMemo(() => {
    if (!data?.mab_events?.length || !chartData.length) return [];
    const lastRevealedTs = new Date(
      chartData[chartData.length - 1].date + "T00:00:00"
    ).getTime();
    return data.mab_events.filter((evt) => {
      const evtTs = new Date(evt.date + "T00:00:00").getTime();
      return evtTs <= lastRevealedTs;
    });
  }, [data, chartData]);

  if (!chartData.length) return null;

  return (
    <div className="relative flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Chart label */}
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[9px] uppercase tracking-widest font-mono text-stone-500">
          Variant Proportions (US)
        </span>
      </div>

      {/* Chart area */}
      <div className="px-1" style={{ height: "180px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            stackOffset="expand"
            margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
          >
            <defs>
              {VARIANT_KEYS.map((key) => {
                const color = data.variant_meta?.[key]?.color || "#94a3b8";
                return (
                  <linearGradient
                    key={key}
                    id={`grad-${key}`}
                    x1="0" y1="0" x2="0" y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.4} />
                  </linearGradient>
                );
              })}
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
              axisLine={{ stroke: "#3a3a5a" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              ticks={[0, 0.5, 1]}
              domain={[0, 1]}
              tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />

            {/* Stacked areas — render order: bottom (wildtype) to top (bq) */}
            {VARIANT_KEYS.map((key) => {
              const color = data.variant_meta?.[key]?.color || "#94a3b8";
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={color}
                  strokeWidth={0.5}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  isAnimationActive={false}
                />
              );
            })}

            {/* MAB event reference lines */}
            {visibleEvents.map((evt, i) => (
              <ReferenceLine
                key={`mab-${i}`}
                x={evt.date}
                stroke={evt.type === "grant" ? "#22c55e" : "#ef4444"}
                strokeWidth={1}
                strokeDasharray="4 2"
                strokeOpacity={0.6}
              />
            ))}

            {/* Scroll cursor at the leading edge */}
            {cursorDate && (
              <ReferenceLine
                x={cursorDate}
                stroke="#ffffff"
                strokeWidth={1}
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Annotation bar */}
      <div
        className="flex items-center justify-center gap-3 py-1.5 text-[10px] font-mono"
        style={{ backgroundColor: "#12121f" }}
      >
        {annotation && (
          <>
            <span className="text-stone-500">
              {formatDateFull(annotation.date)}
            </span>
            <span className="text-stone-700">|</span>
            <span className="font-medium" style={{ color: annotation.dominantColor }}>
              {annotation.dominantLabel} {annotation.dominantPct}%
            </span>
            {annotation.lastEvent && (
              <>
                <span className="text-stone-700">|</span>
                <span
                  className={`font-medium ${
                    annotation.lastEvent.type === "revoke"
                      ? "text-red-400/80"
                      : "text-emerald-400/80"
                  }`}
                >
                  {annotation.lastEvent.label}
                </span>
              </>
            )}
          </>
        )}
        {!annotation && (
          <span className="text-stone-600 text-[9px] uppercase tracking-widest">
            Variant Tracker
          </span>
        )}
      </div>
    </div>
  );
}
