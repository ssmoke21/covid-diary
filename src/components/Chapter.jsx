import { Fragment } from "react";
import NodeCard from "./NodeCard";

const VIBE_GRADIENTS = {
  "Normalcy / Low-Alert": "from-blue-50 to-transparent",
  "High-Alert / Acceleration": "from-amber-50 to-transparent",
  "Chaos / Urgency": "from-red-50 to-transparent",
  "Isolation / Grief": "from-indigo-50 to-transparent",
  "Hope / Attrition": "from-emerald-50 to-transparent",
  "Hope / Joy": "from-yellow-50 to-transparent",
  "Conflict / Vindication": "from-pink-50 to-transparent",
};

const VIBE_ICONS = {
  "Normalcy / Low-Alert": "🌤",
  "High-Alert / Acceleration": "⚡",
  "Chaos / Urgency": "🔥",
  "Isolation / Grief": "🌑",
  "Hope / Attrition": "🛡️",
  "Hope / Joy": "💉",
  "Conflict / Vindication": "⚖️",
};

// Fuzzy date parser — handles ISO dates, "Early January 2020",
// "Circa April 2020", "Summer 2020", "Late December 2020", etc.
function parseNodeDate(dateStr) {
  if (!dateStr) return 0;

  // Try direct ISO parse first (YYYY-MM-DD)
  const iso = new Date(dateStr + "T00:00:00");
  if (!isNaN(iso)) return iso.getTime();

  const lower = dateStr.toLowerCase();

  const MONTHS = {
    january: 0, february: 1, march: 2, april: 3,
    may: 4, june: 5, july: 6, august: 7,
    september: 8, october: 9, november: 10, december: 11,
  };

  // Season → approximate mid-month
  if (lower.includes("summer")) {
    const y = dateStr.match(/\d{4}/)?.[0];
    return y ? new Date(+y, 6, 1).getTime() : 0;
  }
  if (lower.includes("spring")) {
    const y = dateStr.match(/\d{4}/)?.[0];
    return y ? new Date(+y, 3, 1).getTime() : 0;
  }
  if (lower.includes("winter")) {
    const y = dateStr.match(/\d{4}/)?.[0];
    return y ? new Date(+y, 0, 1).getTime() : 0;
  }
  if (lower.includes("fall") || lower.includes("autumn")) {
    const y = dateStr.match(/\d{4}/)?.[0];
    return y ? new Date(+y, 9, 1).getTime() : 0;
  }

  // "Month Year" with optional qualifier (Early / Mid / Late / Circa / ~)
  for (const [name, idx] of Object.entries(MONTHS)) {
    if (lower.includes(name)) {
      const y = dateStr.match(/\d{4}/)?.[0];
      if (!y) continue;
      let day = 15; // default mid-month
      if (lower.includes("early")) day = 5;
      else if (lower.includes("mid")) day = 15;
      else if (lower.includes("late")) day = 25;
      else if (lower.includes("circa") || lower.includes("~")) day = 15;
      return new Date(+y, idx, day).getTime();
    }
  }

  // Bare year
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) return new Date(+yearOnly[1], 6, 1).getTime();

  return 0;
}

// Build chronologically-ordered rows for the split layout.
// Each row has { clinical, personal } — either may be null.
// Nodes with identical date strings share a row; otherwise one column is empty.
function buildChronologicalRows(clinicalNodes, personalNodes) {
  const clinical = clinicalNodes.map((n) => ({
    ...n, type: "clinical", ts: parseNodeDate(n.date),
  }));
  const personal = personalNodes.map((n) => ({
    ...n, type: "personal", ts: parseNodeDate(n.date),
  }));

  // Sort each column by timestamp (stable — preserve original order for ties)
  clinical.sort((a, b) => a.ts - b.ts);
  personal.sort((a, b) => a.ts - b.ts);

  const rows = [];
  let ci = 0;
  let pi = 0;

  while (ci < clinical.length || pi < personal.length) {
    const c = clinical[ci];
    const p = personal[pi];

    if (!c) {
      rows.push({ clinical: null, personal: p });
      pi++;
    } else if (!p) {
      rows.push({ clinical: c, personal: null });
      ci++;
    } else if (c.ts === p.ts) {
      // Same timestamp — place side by side
      rows.push({ clinical: c, personal: p });
      ci++;
      pi++;
    } else if (c.ts < p.ts) {
      rows.push({ clinical: c, personal: null });
      ci++;
    } else {
      rows.push({ clinical: null, personal: p });
      pi++;
    }
  }

  return rows;
}

export default function Chapter({ chapter, isVisible }) {
  const isSplit = chapter.layout === "split";
  const gradient =
    VIBE_GRADIENTS[chapter.vibe] || "from-stone-50 to-transparent";
  const icon = VIBE_ICONS[chapter.vibe] || "📖";

  return (
    <section
      id={`chapter-${chapter.chapter_number}`}
      className="relative scroll-mt-8"
    >
      {/* Chapter gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gradient} pointer-events-none -z-10 rounded-3xl`}
      />

      {/* Chapter Header */}
      <header className="pt-16 pb-10 px-4 md:px-8 text-center max-w-3xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-stone-200 text-xs font-mono text-stone-500 mb-4"
          style={{
            animation: isVisible ? "fade-in-up 0.5s ease-out both" : "none",
          }}
        >
          <span className="text-base">{icon}</span>
          <span>Chapter {chapter.chapter_number}</span>
          <span className="text-stone-300">|</span>
          <span>{chapter.date_range}</span>
        </div>

        <h2
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-2"
          style={{
            animation: isVisible ? "fade-in-up 0.5s ease-out 0.1s both" : "none",
          }}
        >
          {chapter.title}
        </h2>

        <p
          className="font-serif text-lg md:text-xl text-stone-500 italic mb-6"
          style={{
            animation: isVisible ? "fade-in-up 0.5s ease-out 0.2s both" : "none",
          }}
        >
          {chapter.subtitle}
        </p>

        {/* Vibe tag */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 border border-stone-200"
          style={{
            animation: isVisible ? "fade-in-up 0.5s ease-out 0.3s both" : "none",
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Vibe
          </span>
          <span className="text-xs text-stone-600 font-medium">
            {chapter.vibe}
          </span>
        </div>

        <p
          className="mt-4 text-sm text-stone-500 max-w-xl mx-auto leading-relaxed"
          style={{
            animation: isVisible ? "fade-in-up 0.5s ease-out 0.4s both" : "none",
          }}
        >
          {chapter.vibe_description}
        </p>
      </header>

      {/* Content area */}
      <div className="px-4 md:px-8 pb-16">
        {isSplit ? (
          <SplitLayout chapter={chapter} isVisible={isVisible} />
        ) : (
          <FullLayout chapter={chapter} isVisible={isVisible} />
        )}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
    </section>
  );
}

function SplitLayout({ chapter, isVisible }) {
  const rows = buildChronologicalRows(
    chapter.clinical_nodes,
    chapter.personal_nodes
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Column headers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-clinical)]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-clinical)]">
            Clinical Timeline
          </h3>
          <div className="flex-1 h-px bg-[var(--color-clinical-border)]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-personal)]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-personal)]">
            Personal Timeline
          </h3>
          <div className="flex-1 h-px bg-[var(--color-personal-border)]" />
        </div>
      </div>

      {/* Chronological two-column grid.
          Each row renders a paired (clinical, personal) slot.
          Empty cells collapse to 0 height on mobile, leaving visible
          white space on desktop to convey the time gap. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-4">
        {rows.map((row, i) => (
          <Fragment key={i}>
            {/* Clinical cell */}
            <div>
              {row.clinical && (
                <NodeCard node={row.clinical} type="clinical" index={i} />
              )}
            </div>
            {/* Personal cell */}
            <div>
              {row.personal && (
                <NodeCard node={row.personal} type="personal" index={i} />
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function FullLayout({ chapter, isVisible }) {
  const allNodes = [
    ...chapter.clinical_nodes.map((n) => ({ ...n, type: "clinical" })),
    ...chapter.personal_nodes.map((n) => ({ ...n, type: "personal" })),
  ].sort((a, b) => parseNodeDate(a.date) - parseNodeDate(b.date));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-clinical)]" />
          <span className="text-xs font-medium text-stone-500">Clinical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-personal)]" />
          <span className="text-xs font-medium text-stone-500">Personal</span>
        </div>
      </div>

      {/* Unified timeline */}
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-stone-300 via-stone-200 to-transparent" />

        <div className="flex flex-col gap-6">
          {allNodes.map((node, i) => (
            <div key={i} className="relative pl-14">
              {/* Timeline dot */}
              <div
                className={`absolute left-[18px] top-5 w-3 h-3 rounded-full border-2 bg-white ${
                  node.type === "clinical"
                    ? "border-[var(--color-clinical-accent)]"
                    : "border-[var(--color-personal-accent)]"
                }`}
              />
              <NodeCard node={node} type={node.type} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
