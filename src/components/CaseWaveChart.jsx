import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { parseNodeDate, findDateIndex, formatDateFull, formatNumber } from "./CaseMap";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SHORT_MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatTick(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${SHORT_MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function abbreviateNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * Area chart showing weekly new US COVID cases.
 * Progressive reveal — only shows data up to the current scroll date.
 * Dynamic Y axis so future peaks aren't spoiled.
 *
 * @param {Object} props
 * @param {Object} props.data - Case wave data with weeks array
 * @param {string} props.currentDate - Current timeline node date string
 */
export default function CaseWaveChart({ data, currentDate }) {
  const dates = useMemo(() => {
    if (!data?.weeks?.length) return [];
    return data.weeks.map((w) => w.date);
  }, [data]);

  // Find cursor position in the data
  const cursorIndex = useMemo(() => {
    if (!currentDate || !dates.length) return 0;
    const targetTs = parseNodeDate(currentDate);
    if (!targetTs) return 0;
    return findDateIndex(dates, targetTs);
  }, [currentDate, dates]);

  // Progressive reveal + dynamic Y axis
  const { chartData, yMax } = useMemo(() => {
    if (!data?.weeks?.length) return { chartData: [], yMax: 500000 };

    const revealed = [];
    let maxVal = 0;
    for (let i = 0; i <= cursorIndex && i < data.weeks.length; i++) {
      revealed.push(data.weeks[i]);
      if (data.weeks[i].cases > maxVal) maxVal = data.weeks[i].cases;
    }

    // Round up to a nice number with headroom
    const headroom = Math.max(
      500000,
      Math.ceil((maxVal * 1.15) / 500000) * 500000
    );

    return { chartData: revealed, yMax: headroom };
  }, [data, cursorIndex]);

  // Current date + cases for annotation
  const cursorDate = dates[cursorIndex] || null;
  const currentWeek = data?.weeks?.[cursorIndex] || null;

  if (!chartData.length) return null;

  return (
    <div className="relative flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Chart label */}
      <div className="px-3 pt-1.5 pb-0.5">
        <span className="text-[9px] uppercase tracking-widest font-mono text-stone-500">
          Weekly New US Cases
        </span>
      </div>

      {/* Chart area */}
      <div className="px-1" style={{ height: "120px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 0, left: -4 }}
          >
            <defs>
              <linearGradient id="gradCaseWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
              </linearGradient>
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
              domain={[0, yMax]}
              tickFormatter={abbreviateNumber}
              tick={{ fill: "#64748b", fontSize: 8, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />

            <Area
              type="monotone"
              dataKey="cases"
              stroke="#38bdf8"
              strokeWidth={1.5}
              fill="url(#gradCaseWave)"
              dot={false}
              isAnimationActive={false}
              name="Cases"
            />

            {/* Scroll cursor */}
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
        className="flex items-center justify-center gap-3 py-1 text-[10px] font-mono"
        style={{ backgroundColor: "#12121f" }}
      >
        {currentWeek ? (
          <>
            <span className="text-stone-500">
              {formatDateFull(currentWeek.date)}
            </span>
            <span className="text-stone-700">|</span>
            <span className="text-sky-400/80 font-medium">
              {formatNumber(currentWeek.cases)} new cases
            </span>
          </>
        ) : (
          <span className="text-stone-600 text-[9px] uppercase tracking-widest">
            US Case Tracker
          </span>
        )}
      </div>
    </div>
  );
}
