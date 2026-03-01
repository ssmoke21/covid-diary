import { useEffect, useRef } from "react";

export default function NodeOverlay({ node, onClose }) {
  const tweetRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Load tweet embed
  useEffect(() => {
    if (!node?.embed || node.embed.type !== "tweet") return;
    const tweetId = node.embed.url.match(/status\/(\d+)/)?.[1];
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
      // Script already loading — wait for it
      window.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [node]);

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${node.embed?.type === "iframe" ? "max-w-3xl" : "max-w-md"}`}>
        {/* Header */}
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

        <p className="px-6 pb-5 text-sm text-stone-600 leading-relaxed">{node.content}</p>

        {/* Embed section — tweet */}
        {node.embed?.type === "tweet" && (
          <div className="border-t border-stone-100 px-6 py-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3 font-semibold">
              Primary Source
            </p>
            <div ref={tweetRef} className="flex justify-center min-h-[120px] items-center">
              <span className="text-sm text-stone-300">Loading post…</span>
            </div>
          </div>
        )}

        {/* Embed section — iframe */}
        {node.embed?.type === "iframe" && (
          <div className="border-t border-stone-100">
            <div className="flex items-center justify-between px-6 py-3">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                Primary Source
              </p>
              <a
                href={node.embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
              >
                {node.embed.label}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <iframe
              src={node.embed.url}
              title={node.label}
              className="w-full border-0"
              style={{ height: "520px" }}
              loading="lazy"
            />
          </div>
        )}

        {/* Embed section — external link */}
        {node.embed?.type === "link" && (
          <div className="border-t border-stone-100 px-6 py-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3 font-semibold">
              Primary Source
            </p>
            <a
              href={node.embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 transition-all duration-200 group"
            >
              <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">
                {node.embed.label}
              </span>
              <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
