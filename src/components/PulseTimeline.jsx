import { useEffect, useState, useRef } from "react";

const VIBE_COLORS = {
  "Normalcy / Low-Alert": { bg: "#dbeafe", ring: "#3b82f6", text: "#1e40af" },
  "High-Alert / Acceleration": {
    bg: "#fef3c7",
    ring: "#f59e0b",
    text: "#92400e",
  },
  "Chaos / Urgency": { bg: "#fee2e2", ring: "#ef4444", text: "#991b1b" },
  "Isolation / Grief": { bg: "#e0e7ff", ring: "#6366f1", text: "#3730a3" },
  "Hope / Attrition": { bg: "#d1fae5", ring: "#10b981", text: "#065f46" },
  "Hope / Joy": { bg: "#fef9c3", ring: "#eab308", text: "#713f12" },
  "Conflict / Vindication": {
    bg: "#fce7f3",
    ring: "#ec4899",
    text: "#9d174d",
  },
};

function formatAnchorDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PulseTimeline({ chapters, activeChapter }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) {
      const activeEl = timelineRef.current.querySelector(
        `[data-chapter="${activeChapter}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeChapter]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200 flex items-center justify-center"
        aria-label="Toggle timeline"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
        >
          <circle cx="9" cy="3" r="2" fill="#dc2626" />
          <circle cx="9" cy="9" r="2" fill="#dc2626" />
          <circle cx="9" cy="15" r="2" fill="#dc2626" />
          <line
            x1="9"
            y1="5"
            x2="9"
            y2="7"
            stroke="#e7e5e4"
            strokeWidth="1.5"
          />
          <line
            x1="9"
            y1="11"
            x2="9"
            y2="13"
            stroke="#e7e5e4"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Timeline sidebar */}
      <nav
        ref={timelineRef}
        className={`fixed top-0 left-0 z-40 h-screen bg-white/95 backdrop-blur-sm border-r border-stone-200
          flex flex-col items-center py-8 transition-all duration-300 overflow-y-auto
          ${isExpanded ? "w-56 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0 lg:w-20"}
        `}
      >
        {/* Title */}
        <div
          className={`mb-6 text-center px-2 ${isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            Pulse
          </p>
          <p className="text-[9px] text-stone-300 mt-0.5">Timeline</p>
        </div>

        {/* Chapter dots */}
        <div className="flex flex-col items-center flex-1 justify-center gap-1">
          {chapters.map((ch, i) => {
            const isActive = activeChapter === ch.chapter_number;
            const vibeColor =
              VIBE_COLORS[ch.vibe] || VIBE_COLORS["Normalcy / Low-Alert"];
            const progress =
              ((ch.chapter_number - 1) / (chapters.length - 1)) * 100;

            return (
              <div key={ch.chapter_number} className="flex flex-col items-center">
                {/* Connector line */}
                {i > 0 && (
                  <div
                    className="w-0.5 transition-all duration-500"
                    style={{
                      height: "24px",
                      backgroundColor:
                        ch.chapter_number <= activeChapter
                          ? vibeColor.ring
                          : "#e7e5e4",
                    }}
                  />
                )}

                {/* Dot + label */}
                <a
                  href={`#chapter-${ch.chapter_number}`}
                  data-chapter={ch.chapter_number}
                  className="group flex items-center gap-3 relative"
                  onClick={() => setIsExpanded(false)}
                >
                  {/* The dot */}
                  <div className="relative flex items-center justify-center">
                    {/* Pulse ring for active */}
                    {isActive && (
                      <span
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: vibeColor.ring,
                          animation: "pulse-ring 2s ease-out infinite",
                        }}
                      />
                    )}
                    <div
                      className="relative w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center"
                      style={{
                        borderColor: vibeColor.ring,
                        backgroundColor: isActive ? vibeColor.ring : "white",
                        transform: isActive ? "scale(1.3)" : "scale(1)",
                      }}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Label (visible when expanded or on lg) */}
                  <div
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isExpanded
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2 lg:opacity-0 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 lg:absolute lg:left-8 lg:bg-white lg:shadow-lg lg:rounded-lg lg:px-3 lg:py-2 lg:border lg:border-stone-200"
                    }`}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: vibeColor.text }}
                    >
                      Ch. {ch.chapter_number}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {formatAnchorDate(ch.anchor_date)}
                    </p>
                    <p className="text-[10px] text-stone-400 max-w-[120px] truncate">
                      {ch.title}
                    </p>
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div
          className={`mt-6 px-3 text-center ${isExpanded ? "opacity-100" : "opacity-0 lg:opacity-100"}`}
        >
          <div className="w-8 h-1 bg-stone-200 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{
                width: `${((activeChapter - 1) / (chapters.length - 1)) * 100}%`,
              }}
            />
          </div>
          <p className="text-[9px] text-stone-400 mt-1">
            {activeChapter}/{chapters.length}
          </p>
        </div>
      </nav>
    </>
  );
}
