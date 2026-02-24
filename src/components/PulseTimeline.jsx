import { useEffect, useState, useRef, useCallback } from "react";

const VIBE_COLORS = {
  "Normalcy / Low-Alert":       { bg: "#dbeafe", ring: "#3b82f6", text: "#1e40af", badge: "#eff6ff" },
  "High-Alert / Acceleration":  { bg: "#fef3c7", ring: "#f59e0b", text: "#92400e", badge: "#fffbeb" },
  "Chaos / Urgency":            { bg: "#fee2e2", ring: "#ef4444", text: "#991b1b", badge: "#fef2f2" },
  "Isolation / Grief":          { bg: "#e0e7ff", ring: "#6366f1", text: "#3730a3", badge: "#eef2ff" },
  "Hope / Attrition":           { bg: "#d1fae5", ring: "#10b981", text: "#065f46", badge: "#ecfdf5" },
  "Hope / Joy":                 { bg: "#fef9c3", ring: "#eab308", text: "#713f12", badge: "#fefce8" },
  "Conflict / Vindication":     { bg: "#fce7f3", ring: "#ec4899", text: "#9d174d", badge: "#fdf4ff" },
};

function formatAnchorDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PulseTimeline({ chapters, activeChapter }) {
  const [isExpanded, setIsExpanded]     = useState(false);
  const [tooltip, setTooltip]           = useState(null); // { chapter, y }
  const timelineRef                     = useRef(null);
  const hideTimer                       = useRef(null);

  // Scroll active dot into view
  useEffect(() => {
    if (timelineRef.current) {
      const activeEl = timelineRef.current.querySelector(`[data-chapter="${activeChapter}"]`);
      if (activeEl) activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeChapter]);

  const showTooltip = useCallback((ch, dotEl) => {
    clearTimeout(hideTimer.current);
    const rect = dotEl.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    setTooltip({ chapter: ch, y });
  }, []);

  const hideTooltip = useCallback(() => {
    hideTimer.current = setTimeout(() => setTooltip(null), 120);
  }, []);

  const keepTooltip = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  return (
    <>
      {/* ── Mobile toggle ──────────────────────────────────────────── */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200 flex items-center justify-center"
        aria-label="Toggle timeline"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
          className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}>
          <circle cx="9" cy="3"  r="2" fill="#dc2626" />
          <circle cx="9" cy="9"  r="2" fill="#dc2626" />
          <circle cx="9" cy="15" r="2" fill="#dc2626" />
          <line x1="9" y1="5"  x2="9" y2="7"  stroke="#e7e5e4" strokeWidth="1.5" />
          <line x1="9" y1="11" x2="9" y2="13" stroke="#e7e5e4" strokeWidth="1.5" />
        </svg>
      </button>

      {/* ── Mobile backdrop ─────────────────────────────────────────── */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsExpanded(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <nav
        ref={timelineRef}
        className={`fixed top-0 left-0 z-40 h-screen bg-white/95 backdrop-blur-sm border-r border-stone-200
          flex flex-col items-center py-8 transition-all duration-300 overflow-y-auto overflow-x-visible
          ${isExpanded ? "w-56 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0 lg:w-20"}`}
      >
        {/* Title */}
        <div className={`mb-6 text-center px-2 ${isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Pulse</p>
          <p className="text-[9px] text-stone-300 mt-0.5">Timeline</p>
        </div>

        {/* Chapter dots */}
        <div className="flex flex-col items-center flex-1 justify-center gap-1">
          {chapters.map((ch, i) => {
            const isActive   = activeChapter === ch.chapter_number;
            const vibeColor  = VIBE_COLORS[ch.vibe] || VIBE_COLORS["Normalcy / Low-Alert"];

            return (
              <div key={ch.chapter_number} className="flex flex-col items-center">
                {/* Connector line */}
                {i > 0 && (
                  <div className="w-0.5 transition-all duration-500" style={{
                    height: "24px",
                    backgroundColor: ch.chapter_number <= activeChapter ? vibeColor.ring : "#e7e5e4",
                  }} />
                )}

                {/* Dot */}
                <a
                  href={`#chapter-${ch.chapter_number}`}
                  data-chapter={ch.chapter_number}
                  className="group flex items-center gap-3 relative"
                  onClick={() => setIsExpanded(false)}
                  onMouseEnter={(e) => showTooltip(ch, e.currentTarget)}
                  onMouseLeave={hideTooltip}
                >
                  <div className="relative flex items-center justify-center">
                    {isActive && (
                      <span className="absolute w-4 h-4 rounded-full" style={{
                        backgroundColor: vibeColor.ring,
                        animation: "pulse-ring 2s ease-out infinite",
                      }} />
                    )}
                    <div
                      className="relative w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center"
                      style={{
                        borderColor: vibeColor.ring,
                        backgroundColor: isActive ? vibeColor.ring : "white",
                        transform: isActive ? "scale(1.3)" : "scale(1)",
                      }}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Expanded sidebar label (mobile drawer) */}
                  {isExpanded && (
                    <div className="whitespace-nowrap">
                      <p className="text-xs font-semibold" style={{ color: vibeColor.text }}>
                        Ch. {ch.chapter_number}
                      </p>
                      <p className="text-[10px] text-stone-400 max-w-[130px] truncate">{ch.title}</p>
                    </div>
                  )}
                </a>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className={`mt-6 px-3 text-center ${isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"}`}>
          <div className="w-8 h-1 bg-stone-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${((activeChapter - 1) / (chapters.length - 1)) * 100}%` }} />
          </div>
          <p className="text-[9px] text-stone-400 mt-1">{activeChapter}/{chapters.length}</p>
        </div>
      </nav>

      {/* ── Hover tooltip (fixed, escapes sidebar overflow) ─────────── */}
      {tooltip && !isExpanded && (
        <TooltipCard
          chapter={tooltip.chapter}
          anchorY={tooltip.y}
          onMouseEnter={keepTooltip}
          onMouseLeave={hideTooltip}
        />
      )}
    </>
  );
}

function TooltipCard({ chapter, anchorY, onMouseEnter, onMouseLeave }) {
  const vibeColor = VIBE_COLORS[chapter.vibe] || VIBE_COLORS["Normalcy / Low-Alert"];
  const TOOLTIP_H = 110; // approx height — keeps it on screen
  const SIDEBAR_W = 80;
  const ARROW_W   = 8;

  // Clamp so it doesn't bleed off top/bottom
  const rawTop  = anchorY - TOOLTIP_H / 2;
  const top     = Math.max(12, Math.min(rawTop, window.innerHeight - TOOLTIP_H - 12));
  // Vertical offset for the arrow relative to the card
  const arrowTop = Math.max(16, Math.min(anchorY - top - 6, TOOLTIP_H - 20));

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{ left: SIDEBAR_W + ARROW_W, top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Arrow pointing left */}
      <div
        className="absolute"
        style={{
          left: -ARROW_W,
          top: arrowTop,
          width: 0,
          height: 0,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          borderRight: `${ARROW_W}px solid`,
          borderRightColor: vibeColor.ring,
        }}
      />

      {/* Card */}
      <div
        className="w-56 rounded-xl shadow-xl border overflow-hidden"
        style={{ borderColor: vibeColor.ring + "55" }}
      >
        {/* Colored header strip */}
        <div className="px-4 py-2.5" style={{ backgroundColor: vibeColor.ring }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-white/80 uppercase tracking-widest">
              Chapter {chapter.chapter_number}
            </span>
            <span className="text-[10px] font-mono text-white/70">
              {formatAnchorDate(chapter.anchor_date)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3" style={{ backgroundColor: vibeColor.badge }}>
          <p className="text-sm font-bold text-stone-800 leading-tight mb-1">
            {chapter.title}
          </p>
          <p className="text-[11px] text-stone-500 italic leading-snug mb-2.5">
            {chapter.subtitle}
          </p>
          {/* Vibe pill */}
          <span
            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: vibeColor.ring + "20", color: vibeColor.text }}
          >
            {chapter.vibe}
          </span>
        </div>
      </div>
    </div>
  );
}
