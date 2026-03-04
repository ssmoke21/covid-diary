import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { parseNodeDate, findDateIndex } from "./CaseMap";

// ─── Short month formatter ──────────────────────────────────────────────────

const SHORT_MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatTick(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * Area chart showing hospital COVID-19 census (positive + PUI).
 * Only reveals data up to the current scroll date — future is hidden.
 * Y axis scales dynamically to the revealed data so the peak isn't spoiled.
 */
export default function HospitalChart({ data, currentDate }) {
  // Find where we are in the data
  const cursorIndex = useMemo(() => {
    if (!currentDate || !data?.dates?.length) return 0;
    const targetTs = parseNodeDate(currentDate);
    if (!targetTs) return 0;
    return findDateIndex(data.dates, targetTs);
  }, [currentDate, data]);

  // Build chart data — only up to the current scroll position (progressive reveal)
  const { chartData, yMax } = useMemo(() => {
    if (!data?.dates?.length) return { chartData: [], yMax: 50 };

    // Only include data points up to and including the cursor
    const revealed = [];
    let maxVal = 0;
    for (let i = 0; i <= cursorIndex && i < data.dates.length; i++) {
      const pos = data.positive[i] ?? null;
      const pui = data.pui[i] ?? null;
      revealed.push({
        date: data.dates[i],
        positive: pos,
        pui: pui,
      });
      if (pos != null && pos > maxVal) maxVal = pos;
      if (pui != null && pui > maxVal) maxVal = pui;
    }

    // Add some headroom to the Y axis (round up to nice number)
    const headroom = Math.max(50, Math.ceil(maxVal * 1.15 / 25) * 25);

    return { chartData: revealed, yMax: headroom };
  }, [data, cursorIndex]);

  // Current date string for the reference line
  const cursorDate = data?.dates?.[cursorIndex] || null;

  // Current positive count for the legend
  const currentPositive = useMemo(() => {
    if (cursorIndex < 0 || !data?.positive) return null;
    return data.positive[cursorIndex];
  }, [cursorIndex, data]);

  if (!chartData.length) return null;

  return (
    <div className="relative flex flex-col h-full" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Chart label */}
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[9px] uppercase tracking-widest font-mono text-stone-500">
          Hospital Census
        </span>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 px-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
          >
            <defs>
              <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradPui" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
              axisLine={{ stroke: "#3a3a5a" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />

            {/* PUI area (behind positive) */}
            <Area
              type="monotone"
              dataKey="pui"
              stroke="#f59e0b"
              strokeWidth={1}
              fill="url(#gradPui)"
              dot={false}
              connectNulls
              isAnimationActive={false}
              name="PUI"
            />

            {/* Positive cases area */}
            <Area
              type="monotone"
              dataKey="positive"
              stroke="#dc2626"
              strokeWidth={1.5}
              fill="url(#gradPositive)"
              dot={false}
              connectNulls
              isAnimationActive={false}
              name="COVID+"
            />

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

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-3 pb-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#dc2626" }} />
          <span className="text-[8px] font-mono text-stone-500">
            COVID+ {currentPositive != null ? `(${currentPositive})` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
          <span className="text-[8px] font-mono text-stone-500">PUI</span>
        </div>
      </div>
    </div>
  );
}
