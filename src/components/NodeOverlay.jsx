import { useEffect, useRef, useState } from "react";

// ── PhotoCarousel ─────────────────────────────────────────────────────────────
function PhotoCarousel({ embed }) {
  const [idx, setIdx] = useState(0);
  if (!embed) return null;

  const photos =
    embed.type === "gallery"
      ? embed.photos
      : [{ url: embed.url, caption: embed.caption }];
  const photo = photos[idx];
  const count = photos.length;

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg bg-stone-100">
        <img
          src={`${import.meta.env.BASE_URL}${photo.url}`}
          alt={photo.caption || ""}
          className="w-full object-cover"
          style={{ maxHeight: "260px" }}
        />
        {count > 1 && (
          <>
            <button
              onClick={() => setIdx((idx - 1 + count) % count)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white rounded-full w-7 h-7 flex items-center justify-center text-xl leading-none transition-colors"
              aria-label="Previous photo"
            >‹</button>
            <button
              onClick={() => setIdx((idx + 1) % count)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white rounded-full w-7 h-7 flex items-center justify-center text-xl leading-none transition-colors"
              aria-label="Next photo"
            >›</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === idx ? "bg-white" : "bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {photo.caption && (
        <p className="text-center text-[10px] font-mono uppercase tracking-widest text-stone-400 mt-1.5 px-1">
          {photo.caption}
        </p>
      )}
    </div>
  );
}

// ── Reusable external link button ─────────────────────────────────────────────
function LinkButton({ src }) {
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 transition-all duration-200 group"
    >
      <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">
        {src.label}
      </span>
      <svg
        className="w-4 h-4 text-stone-400 group-hover:text-stone-600 shrink-0 ml-3"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

// ── EmbedSection — used by single-node overlays ───────────────────────────────
function EmbedSection({ embedNode }) {
  const tweetRef = useRef(null);

  useEffect(() => {
    if (!embedNode?.embed || embedNode.embed.type !== "tweet") return;
    const tweetId = embedNode.embed.url.match(/status\/(\d+)/)?.[1];
    if (!tweetId || !tweetRef.current) return;

    const render = () => {
      if (!tweetRef.current) return;
      tweetRef.current.innerHTML = "";
      window.twttr.widgets.createTweet(tweetId, tweetRef.current, {
        theme: "light",
        align: "center",
        conversation: "none",
      });
    };

    if (window.twttr?.widgets) {
      render();
    } else if (document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
      window.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [embedNode]);

  if (!embedNode?.embed) return null;
  const { embed } = embedNode;

  return (
    <>
      {embed.type === "tweet" && (
        <div className="border-t border-stone-100 px-6 py-5">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3 font-semibold">
            Primary Source
          </p>
          <div ref={tweetRef} className="flex justify-center min-h-[120px] items-center">
            <span className="text-sm text-stone-300">Loading post…</span>
          </div>
        </div>
      )}

      {embed.type === "iframe" && (
        <div className="border-t border-stone-100">
          <div className="flex items-center justify-between px-6 py-3">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
              Primary Source
            </p>
            <a
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
            >
              {embed.label}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <iframe
            src={embed.url}
            title={embedNode.label}
            className="w-full border-0"
            style={{ height: "520px" }}
            loading="lazy"
          />
        </div>
      )}

      {(embed.type === "image" || embed.type === "gallery") && (
        <div className="border-t border-stone-100 px-4 py-4">
          <PhotoCarousel embed={embed} />
          {embedNode.secondary_embed && (
            <div className="mt-3">
              <LinkButton src={embedNode.secondary_embed} />
            </div>
          )}
        </div>
      )}

      {embed.type === "link" && (
        <div className="border-t border-stone-100 px-6 py-5">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3 font-semibold">
            {embedNode.secondary_embed ? "Sources" : "Primary Source"}
          </p>
          <div className="flex flex-col gap-2">
            {[embed, ...(embedNode.secondary_embed ? [embedNode.secondary_embed] : [])].map(
              (src, i) => <LinkButton key={i} src={src} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const isPhotoEmbed = (embed) =>
  embed?.type === "image" || embed?.type === "gallery";

// ── NodeOverlay ───────────────────────────────────────────────────────────────
export default function NodeOverlay({ node, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!node) return null;

  const isPaired = !!node.pairedNode;
  const clinical = isPaired ? (node.type === "clinical" ? node : node.pairedNode) : null;
  const personal = isPaired ? (node.type === "personal" ? node : node.pairedNode) : null;

  const hasIframe =
    clinical?.embed?.type === "iframe" ||
    personal?.embed?.type === "iframe" ||
    (!isPaired && node.embed?.type === "iframe");
  const hasSections = !isPaired && !!node.sections?.length;
  const hasPairedPhoto = isPaired && (isPhotoEmbed(clinical?.embed) || isPhotoEmbed(personal?.embed));
  const modalWidth =
    hasIframe ? "max-w-3xl"
    : isPaired ? "max-w-2xl"
    : (hasSections || isPhotoEmbed(node.embed)) ? "max-w-2xl"
    : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${modalWidth}`}>

        {/* ── Paired (linked) overlay ── */}
        {isPaired ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <span className="inline-block text-[10px] font-mono text-stone-400 uppercase tracking-wide">
                {clinical?.date ?? personal?.date}
              </span>
              <button
                onClick={onClose}
                className="text-stone-300 hover:text-stone-600 transition-colors ml-4 shrink-0"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Two-column body — photos live inside each column, below the text */}
            <div className="flex overflow-hidden" style={{ maxHeight: hasPairedPhoto ? "72vh" : "60vh" }}>

              {/* Clinical column (left) */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <p className="text-[9px] uppercase tracking-widest font-bold mb-1.5"
                  style={{ color: "var(--color-clinical)" }}>
                  Clinical
                </p>
                <h3 className="text-base font-bold mb-1.5" style={{ color: "var(--color-clinical)" }}>
                  {clinical?.label}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">{clinical?.content}</p>

                {isPhotoEmbed(clinical?.embed) && (
                  <div className="mt-4">
                    <PhotoCarousel embed={clinical.embed} />
                    {clinical.secondary_embed && (
                      <div className="mt-3"><LinkButton src={clinical.secondary_embed} /></div>
                    )}
                  </div>
                )}
              </div>

              {/* Vertical amber dashed divider */}
              <div className="relative w-5 shrink-0">
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 border-l border-dashed border-amber-300" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-amber-400 text-xs font-bold leading-none py-0.5">↔</div>
              </div>

              {/* Personal column (right) */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <p className="text-[9px] uppercase tracking-widest font-bold mb-1.5"
                  style={{ color: "var(--color-personal)" }}>
                  Personal
                </p>
                <h3 className="text-base font-bold mb-1.5" style={{ color: "var(--color-personal)" }}>
                  {personal?.label}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">{personal?.content}</p>

                {isPhotoEmbed(personal?.embed) && (
                  <div className="mt-4">
                    <PhotoCarousel embed={personal.embed} />
                    {personal.secondary_embed && (
                      <div className="mt-3"><LinkButton src={personal.secondary_embed} /></div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Non-photo embeds (tweets, iframes, links) at the bottom */}
            {clinical?.embed && !isPhotoEmbed(clinical.embed) && (
              <EmbedSection embedNode={clinical} />
            )}
            {personal?.embed && !isPhotoEmbed(personal.embed) && (
              <EmbedSection embedNode={personal} />
            )}
          </>

        ) : (
          <>
            {/* ── Standard single-node overlay ── */}
            <div className="flex items-start justify-between px-6 pt-6 pb-3">
              <div>
                <span className="inline-block text-[10px] font-mono text-stone-400 mb-1 uppercase tracking-wide">
                  {node.date}
                </span>
                <h3 className="text-lg font-bold text-stone-900">{node.label}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-stone-300 hover:text-stone-600 transition-colors ml-4 mt-1 shrink-0"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {hasSections ? (
              <div className="px-6 pb-5 overflow-y-auto space-y-5" style={{ maxHeight: "65vh" }}>
                {node.sections.map((section, i) => (
                  <div key={i}>
                    {section.title && (
                      <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">
                        {section.title}
                      </p>
                    )}
                    {section.text && (
                      <p className="text-sm text-stone-600 leading-relaxed">{section.text}</p>
                    )}
                    {section.image && (
                      <img
                        src={`${import.meta.env.BASE_URL}${section.image}`}
                        alt={section.title || ""}
                        className="w-full object-cover rounded-lg mt-3"
                        style={{ maxHeight: "220px" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 pb-5 text-sm text-stone-600 leading-relaxed">{node.content}</p>
            )}

            <EmbedSection embedNode={node.embed ? node : null} />
          </>
        )}
      </div>
    </div>
  );
}
