"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink,
  Linkedin,
  FileDown,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/* =========================
   GLOBAL KNOBS (defaults)
   ========================= */
const CAROUSEL_VISIBLE = 3; // how many media cards at once
const CARD_ASPECT = 4 / 3;  // 4:3 media
const CARD_GAP_PX = 14;     // space between cards
const CAPTION_TEXT_PX = 12; // default caption font
const BODY_TEXT_PX = 16;    // default body font
const BODY_MAX_CH = 88;     // default max line length (ch)

/* ---------- Media slide with caption ---------- */
function MediaSlide({ src, alt, poster, caption, captionsSrc, captionPx }) {
  const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
  return (
    <div className="overflow-hidden rounded-xl border border-blue-200 bg-neutral-100 shadow-sm">
      <div style={{ aspectRatio: `${CARD_ASPECT}` }}>
        {isVideo ? (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          >
            {captionsSrc && (
              <track
                src={captionsSrc}
                kind="captions"
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>
        ) : (
          <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {caption && (
        <div
          className="px-3 py-2 text-neutral-600"
          style={{ fontSize: captionPx ?? CAPTION_TEXT_PX, lineHeight: 1.25 }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

/* ---------- Simple media grid (used when ≤ 3 items) ---------- */
function MediaGrid({ items, gap = CARD_GAP_PX, captionPx }) {
  const cols = Math.min(items.length, 3);
  return (
    <div
      className="mx-auto grid max-w-5xl"
      style={{ gap, gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {items.map((m, i) => (
        <MediaSlide key={i} {...m} captionPx={captionPx} />
      ))}
    </div>
  );
}

/* ---------- 3-up, infinite carousel (no deps) ---------- */
function Carousel3Up({
  items,
  visible = CAROUSEL_VISIBLE,
  gap = CARD_GAP_PX,
  startIndex = 0,
  onIndexChange,
  captionPx,
}) {
  const [index, setIndex] = useState(startIndex);
  const n = items?.length ?? 0;

  useEffect(() => setIndex(startIndex), [startIndex]);
  useEffect(() => {
    if (onIndexChange) onIndexChange(index);
  }, [index, onIndexChange]);

  if (!n) return null;

  const prev = () => setIndex((i) => (i - 1 + n) % n);
  const next = () => setIndex((i) => (i + 1) % n);

  const windowItems = Array.from(
    { length: Math.min(visible, n) },
    (_, k) => items[(index + k) % n]
  );
  const cardWidth = `calc((100% - ${(visible - 1) * gap}px) / ${visible})`;

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Arrows OUTSIDE with strong styling */}
      <button
        aria-label="Previous"
        onClick={prev}
        className="group absolute left-[-44px] top-1/2 z-10 -translate-y-1/2"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full border border-blue-200 bg-white/90 shadow-lg ring-1 ring-blue-200/60 backdrop-blur transition hover:bg-white hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <ChevronLeft className="h-5 w-5 text-blue-700" />
        </span>
      </button>
      <button
        aria-label="Next"
        onClick={next}
        className="group absolute right-[-44px] top-1/2 z-10 -translate-y-1/2"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full border border-blue-200 bg-white/90 shadow-lg ring-1 ring-blue-200/60 backdrop-blur transition hover:bg-white hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <ChevronRight className="h-5 w-5 text-blue-700" />
        </span>
      </button>

      <div className="flex" style={{ gap }}>
        {windowItems.map((m, i) => (
          <div key={i} style={{ width: cardWidth }}>
            <MediaSlide {...m} captionPx={captionPx} />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1">
        {Array.from({ length: Math.min(n, 8) }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i === index % Math.min(n, 8) ? "bg-blue-600" : "bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ open, onClose, title, summary, media = [], rich, ui = {} }) {
  const [mounted, setMounted] = React.useState(false);

  const {
    visible = CAROUSEL_VISIBLE,
    gap = CARD_GAP_PX,
    captionPx = CAPTION_TEXT_PX,
    bodyPx = BODY_TEXT_PX,
    bodyMaxCh = BODY_MAX_CH,
    stats = [],
  } = ui || {};

  // Normalize to media + paragraphs + extended blocks
  const { mediaItems, blocks } = React.useMemo(() => {
    const raw = Array.isArray(rich) && rich.length ? rich : [];
    const medias = [];
    const others = [];

    if (raw.length) {
      for (const b of raw) {
        if (b?.src) {
          medias.push(b);
        } else if (b?.type) {
          others.push(b);
        }
      }
    } else {
      // Fallback to summary if no rich content provided
      if (typeof summary === "string" && summary.trim()) {
        summary
          .split(/\n{2,}/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((text) => others.push({ type: "p", text }));
      }
      for (const m of Array.isArray(media) ? media : []) medias.push(m);
    }
    return { mediaItems: medias, blocks: others };
  }, [rich, summary, media]);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!mounted || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, mounted, onClose]);

  if (!open || !mounted) return null;

  const showCarousel = mediaItems.length > 3;

  // Block renderer for headings, lists, callouts, details, paragraphs
  const renderBlock = (b, i) => {
    if (!b || !b.type) return null;

    if (b.type === "h") {
      return (
        <h4 key={`h-${i}`} className="mt-6 mb-2 text-lg font-semibold text-neutral-900">
          {b.text}
        </h4>
      );
    }

    if (b.type === "p") {
      if (b.html) {
        return (
          <p
            key={`p-${i}`}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: b.html }}
          />
        );
      }
      return (
        <p key={`p-${i}`} className="mb-4">
          {b.text}
        </p>
      );
    }

    if (b.type === "ul" && Array.isArray(b.items)) {
      return (
        <ul key={`ul-${i}`} className="mb-4 list-disc pl-6 text-neutral-800">
          {b.items.map((it, ix) => (
            <li
              key={ix}
              className="mb-1.5"
              dangerouslySetInnerHTML={{ __html: it }}
            />
          ))}
        </ul>
      );
    }

    if (b.type === "callout") {
      return (
        <div
          key={`callout-${i}`}
          className="my-5 rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-[15px] text-neutral-800"
          dangerouslySetInnerHTML={{ __html: b.html || "" }}
        />
      );
    }

    if (b.type === "details") {
      const inner = Array.isArray(b.blocks) ? b.blocks : [];
      const title = b.title || "Details";
      return (
        <details key={`details-${i}`} className="my-4 rounded-lg border border-neutral-200 p-3">
          <summary className="cursor-pointer select-none text-sm font-medium text-neutral-800">
            {title}
          </summary>
          <div className="mt-3 text-neutral-800">
            {inner.map((child, ci) => renderBlock(child, `d-${i}-${ci}`))}
          </div>
        </details>
      );
    }

    // Fallback for unknown blocks (ignore)
    return null;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="mx-auto h-[92vh] w-full max-w-6xl translate-y-[4vh] overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-blue-100 bg-white/95 px-6 py-4 backdrop-blur">
          <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-blue-300 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>

        {/* body */}
        <div className="h-[calc(92vh-57px)] overflow-y-auto px-6 pb-8">
          {/* Optional stats row */}
          {Array.isArray(stats) && stats.length > 0 && (
            <div className="mx-auto mt-4 grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                    {s.label}
                  </div>
                  <div className="text-sm font-medium text-neutral-900">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Media */}
          {mediaItems.length > 0 && (
            <div className="pt-4">
              {showCarousel ? (
                <Carousel3Up
                  items={mediaItems}
                  visible={visible}
                  gap={gap}
                  captionPx={captionPx}
                />
              ) : (
                <MediaGrid items={mediaItems} gap={gap} captionPx={captionPx} />
              )}
            </div>
          )}

          {/* Content */}
          <div
            className="mx-auto pt-6 text-neutral-800"
            style={{ maxWidth: `${bodyMaxCh}ch`, fontSize: bodyPx, lineHeight: 1.85 }}
          >
            {blocks.map((b, i) => renderBlock(b, i))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Scroll hints (always visible) ---------- */
function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY || doc.scrollTop || 0;
      setP(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return p;
}

function ScrollProgress() {
  const p = useScrollProgress();
  const h = Math.max(8, p * 100); // keep a tiny nub even at top
  return (
    <div
      aria-hidden
      className="fixed right-3 top-1/2 z-50 hidden -translate-y-1/2 md:block"
    >
      <div className="h-40 w-1.5 overflow-hidden rounded-full bg-neutral-200/70 backdrop-blur">
        <div
          className="w-full bg-blue-600 transition-[height]"
          style={{ height: `${h}%` }}
        />
      </div>
    </div>
  );
}

function ScrollNudge() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3500);
    const onScroll = () => {
      if (window.scrollY > 40) setShow(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm text-neutral-700 shadow ring-1 ring-blue-200 md:flex">
      <span>More projects</span>
      <ChevronDown className="h-4 w-4 animate-bounce" />
    </div>
  );
}

/* ---------- Page ---------- */
export default function Page() {
  const projects = useMemo(
    () => [
      /* =========================
         1) HYBRID ENGINE (JSC)
         ========================= */
      {
        id: "hybrid",
        title: "JSC Hybrid Rocket Engine",
        tags: ["Propulsion", "Test Ops"],
        bullets: [
          "330 lbf peak thrust",
          "~150 s specific impulse (est.)",
          "960 psig chamber pressure",
        ],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 92,
          stats: [
            { label: "Thrust", value: "330 lbf" },
            { label: "Isp (est.)", value: "≈150 s" },
            { label: "Pressure @ Chamber", value: "≈960 psig" },
            { label: "Propellants", value: "N₂O / ABS" },
          ],
        },
        rich: [
          { type: "media", src: "/media/Hotfire.mp4", caption: "First JSC hybrid hot fire — ~330 lbf thrust, ~150 s specific impulse." },
          { type: "media", src: "/media/FluidSystemWide.jpg", caption: "Oxidizer run tank and nitrogen pressurization plumbing with purge/relief lines." },
          { type: "media", src: "/media/JSCHydroTest.jpg", caption: "AeroTech RMS-98/10240 motor casing during hydrostatic proof test to 1500 psig." },
          { type: "media", src: "/media/JSCIgnitionTest.mp4", caption: "Bench ignition test across ABS grain confirming spark gap and arc reliability." },
          { type: "media", src: "/media/InplaceIgntionTest.mp4", caption: "In-place ignition test with integrated plumbing and instrumentation." },

          { type: "h", text: "Objective" },
          { type: "p", html: "Provide a simple, storable engine for <strong>LEO deorbit</strong>. We prioritized <strong>safety and handling</strong> near crew over raw performance, so we chose a <strong>nitrous oxide / ABS hybrid</strong>." },

          { type: "h", text: "Pressurization & Operations" },
          { type: "p", html: "A 20-lb nitrous tank sits around ~800 psig. We <strong>boost with nitrogen to ~960 psig</strong> so pressure stays steady while flowing propellant—no boil-off dips mid-run." },

          { type: "h", text: "How It Lights & Runs" },
          { type: "ul", items: [
            "Showerhead injector with <strong>nine</strong> small holes spreads oxidizer evenly.",
            "Ignition uses two copper leads <strong>¼ in apart at ~500 V</strong> to arc and start the ABS burning.",
            "Graphite nozzle with <strong>dual O-rings</strong>; phenolic liners protect the case.",
          ]},

          { type: "h", text: "Proof & Performance" },
          { type: "p", html: "The motor case and forward bulkhead were <strong>proof-tested to 1500 psig</strong> (5 min). Hot-fire delivered ~<strong>330 lbf</strong> peak thrust and ~<strong>150 s</strong> estimated Isp with stable chamber pressure." },

          { type: "callout", html: "Built for <strong>reliable, crew-safe handling</strong> with enough performance to deorbit a small vehicle." },

          { type: "h", text: "What I’d Improve Next" },
          { type: "ul", items: [
            "<strong>Regeneratively cooled nozzle</strong> for longer burns and thermal margin.",
            "<strong>Injector study</strong> to tighten mixture distribution and stability.",
            "<strong>Ignition-timing</strong> study to reduce start transients.",
          ]},

          { type: "details", blocks: [
            { type: "p", html: "ABS grain ~2.3 lb with a center port for predictable burn-back. Helicoil-reinforced fasteners on the injector flange. Dual pressure sensors (chamber & pre-injection) and a thermocouple live in the forward bulkhead." },
          ]},
        ],
      },

      /* =========================
         2) 1000 LBF TEST STAND & CAL
         ========================= */
      {
        id: "stand",
        title: "1000 lbf Test Stand & In-Place Calibration",
        tags: ["Structures", "Test Ops", "Calibration"],
        bullets: [
          "Withstood 330 lbf thrust (FOS ≥ 3.0)",
          "Inline 1000 lbf load cell with T-feed plumbing",
          "Compact screw-jack calibration rig",
        ],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 88,
          stats: [
            { label: "Capacity", value: "1000 lbf" },
            { label: "FOS", value: "≥ 3.0" },
            { label: "Calibration", value: "In-place" },
            { label: "Load Cell Deflection", value: "≈0.1 in @ 1 klbf" },

          ],
        },
        rich: [
          { type: "media", src: "/media/JSCTestStandV1.jpg", caption: "Early rail-guided design allowed axial motion; rails proved hard to keep perfectly aligned." },
          { type: "media", src: "/media/JSCTestStandFinal.jpg", caption: "Final design: clamp-guided, low-friction slide in the thrust direction only." },
          { type: "media", src: "/media/JSCRocketLookdown.jpg", caption: "Aft thermocouple holders to capture exhaust temperature safely." },
          { type: "media", src: "/media/JSCCalibrationTest.jpg", caption: "Bench checkout of the screw-jack load calibration assembly." },
          { type: "media", src: "/media/JSCInitialmockup.jpg", caption: "Whiteboard mock-up to size the calibration frame inside a ≤6 in envelope." },
          { type: "media", src: "/media/CalibrationCad.jpg", caption: "CAD of the jack + high-k spring + secondary load cell stack." },

          { type: "h", text: "What It Had To Do" },
          { type: "p", html: "Hold ~<strong>330 lbf</strong> thrust with <strong>FOS ≥ 3</strong> and let the engine slide straight forward while locking every other direction." },

          { type: "h", text: "Iterations That Mattered" },
          { type: "ul", items: [
            "Rails + wheels looked good on paper but tiny straightness errors caused binding.",
            "We switched to <strong>custom 3D-printed clamps</strong>—simple, repeatable, and robust.",
            "Stand <strong>anchored with six concrete bolts</strong> to spread loads.",
          ]},

          { type: "h", text: "Why In-Place Calibration" },
          { type: "p", html: "The T-feed plumbing preloads the system when pressurized, which skews thrust readings. Our compact jack system applies a known force so we can <strong>measure and subtract that bias</strong> before hot-fire." },

          { type: "callout", html: "Result: <strong>repeatable thrust numbers</strong> that line up with expectations, without hauling the setup to a separate calibration lab." },

          { type: "details", blocks: [
            { type: "p", html: "Jack is ½-20 (0.05 in/rev). The primary load cell only deflects ~0.1 in at full load, so a high-k spring in series expands useful travel for fine steps." },
          ]},
        ],
      },

      /* =========================
         3) UVA SOUNDING ROCKET
         ========================= */
      {
        id: "uva-rocket",
        title: "UVA Sounding Rocket — Propulsion Integration",
        tags: ["Propulsion", "Structures", "Test Ops"],
        bullets: ["First successful solid-motor launch at UVA", "~4,000 ft field limit", "Laser-cut birch rings, FEA-checked"],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 88,
          stats: [
            { label: "Apogee", value: "~4,000 ft" },
            { label: "Motor", value: "J-class" },
            { label: "FOS", value: "> 9 (FEA)" },
            { label: "Rings", value: "3 × birch, 0.5 in thick each ring" },


          ],
        },
        rich: [
          { type: "media", src: "/media/SolidRocketCad.jpg", caption: "Propulsion stack with adapter and centering rings." },
          { type: "media", src: "/media/SolidRocketEjection.mp4", caption: "Ejection-charge test sequence on the ground." },
          { type: "media", src: "/media/SolidRocketHotfire.mp4", caption: "Liftoff — slow-motion." },

          { type: "h", text: "What We Achieved" },
          { type: "p", html: "First successful solid-motor launch for UVA’s program, with clean recovery inside the <strong>4,000 ft</strong> field limit." },

          { type: "h", text: "Integration Basics" },
          { type: "ul", items: [
            "COTS <strong>J-class</strong> motor; used a 38→54 mm adapter to fit the mount.",
            "<strong>Birch centering rings</strong> (two ¼-in laminates) tie the engine and fins into the body tube.",
            "Laser-cut tolerances keep everything aligned; epoxy fillets spread the loads.",
          ]},

          { type: "callout", html: "FEA checks gave high margin for the parachute eye-bolts and thrust transfer. OpenRocket predicted 2.7–3.5k ft; flight stayed within range." },
          { type: "p", html: '<strong>Full technical report:</strong> <a href="/Technical_Report.pdf" target="_blank" rel="noopener">Technical_Report.pdf</a>.' },
        ],
      },

      /* =========================
         4) LANGLEY STRATFORD / MCV
         ========================= */
      {
        id: "stratford",
        title: "Langley: Stratford Nozzles & MCV Calibration",
        tags: ["Fluids", "Calibration"],
        bullets: [
          "On-site calibration for multi-critical venturis (MCVs)",
          "~$50k/yr avoided vendor costs",
          "Stable choked-flow reference with Stratford nozzles",
        ],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 90,
          stats: [
            { label: "Facility", value: "NTF" },
            { label: "Test Mach", value: "≈0.8–1.2" },
            { label: "Savings", value: "~$50k/yr" },
            { label: "Ref. Flow", value: "Choked (Stratford)" },

          ],
        },
        rich: [
          { type: "media", src: "/media/LangleyModel.jpg", caption: "Model disassembly: pressure plumbing and instrumentation checks." },
          { type: "media", src: "/media/LangleyParts.jpg", caption: "Hardware prep for the static calibration cart. Involved disassembly and inspections before reassembly." },
          { type: "media", src: "/media/LangleyTestStand.jpg", caption: "Cart anchored to the concrete floor for stability during runs." },
          { type: "media", src: "/media/StratfordNozzles.jpg", caption: "Stratford nozzles: smooth internal contours for low boundary layer and reliable critical flow." },

          { type: "h", text: "Why Build It" },
          { type: "p", html: "Our mass-flow meters (MCVs) needed annual calibration and weighed ~1000 lb each. Shipping them out cost money and time. We wanted <strong>in-house calibration</strong> that was repeatable." },

          { type: "h", text: "How It Works" },
          { type: "ul", items: [
            "Use <strong>Stratford nozzles</strong> as a stable reference at choked flow.",
            "Measure pressure and temperature, compute mass flow, and compare to the MCV reading.",
            "Rigidly mount both cart and MCVs to remove any flex that could affect data.",
          ]},

          { type: "callout", html: "Outcome: reliable calibrations on our schedule and <strong>~$50k/year</strong> in avoided vendor costs." },

          { type: "details", blocks: [
            { type: "p", html: "At NTF I also worked model proof-loads, pump-down, GN₂ cold-flow ops, and test campaigns with dense pressure rakes." },
          ]},
        ],
      },

      /* =========================
         5) MODAL PROPELLANT GAUGING
         ========================= */
      {
        id: "mpg",
        title: "Modal Propellant Gauging (Data Collection)",
        tags: ["Sensors", "Test Ops"],
        bullets: [
          "Vibrate tank, read its “signature,” infer fill level",
          "FFT feature tracking on hot-fire datasets",
          "Practical limits & mitigation notes",
        ],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 84,
          stats: [
            { label: "Post-burn Error", value: "≈2–3%" },
            { label: "Method", value: "FFT mode tracking" },
            { label: "Sensors", value: "Piezo excite/receive" },
            { label: "Environment", value: "Hot-fire" },
          ],
        },
        rich: [
          { type: "media", src: "/media/IntutiveMachines.jpg", caption: "Hot-fire campaign site where MPG data were collected." },
          { type: "media", src: "/media/MPGTest.jpg", caption: "Bench MPG setup at JSC for method checks." },
          { type: "media", src: "/media/MPG.jpg", caption: "Piezo patches along the tank height to sense the mode shape." },

          { type: "h", text: "What It Is" },
          { type: "p", html: "Excite the tank, read the resulting vibration pattern (“mode shape”), and map that to <strong>remaining propellant</strong>. It’s lightweight and non-intrusive." },

          { type: "h", text: "What I Did" },
          { type: "ul", items: [
            "Led hot-fire data collection and processing.",
            "Used FFTs to track the features that correlate with fill level.",
          ]},

          { type: "callout", html: "Key finding: during firing the acoustic field can mask the signal, but <strong>right after cutoff</strong> the features return and level estimates line up again." },

          { type: "details", blocks: [
            { type: "p", html: "Mitigations: time-gating around cutoff, smarter sensor placement, and lock-in/synchronous techniques." },
          ]},
        ],
      },

      /* =========================
         6) BIER — SOFT ROBOTIC LEECH
         ========================= */
      {
        id: "leech",
        title: "BIER Lab: Soft Robotic Leech",
        tags: ["Robotics"],
        bullets: ["Tendon-driven motion", "Clear traveling wave up to 2 Hz", "Arduino control"],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 88,
          stats: [
            { label: "Wave Rate", value: "≤ 2 Hz" },
            { label: "Segments", value: "4" },
            { label: "Actuators", value: "4 × servos" },
            { label: "Body", value: "ABS + silicone skin" },
          ],
        },
        rich: [
          { type: "media", src: "/media/LeechMochups.jpg", caption: "Early concept mockups informed by biology." },
          { type: "media", src: "/media/LeechInitialPrototypes.jpg", caption: "First prints to prove tendon routing and sealing." },
          { type: "media", src: "/media/LeechMoving.mp4", caption: "Traveling-wave actuation producing forward thrust in water." },

          { type: "h", text: "Goal" },
          { type: "p", html: "Build a small underwater robot that moves like a leech so we can test ideas quickly and compare to biology." },

          { type: "h", text: "How It Works" },
          { type: "ul", items: [
            "Four servos pull steel tendons through <strong>Bowden cables</strong> into a segmented ABS spine.",
            "Software sets the phase offsets so the body “ripples” forward.",
            "Electronics live in a waterproof head; a <strong>silicone skin</strong> covers the body.",
          ]},

          { type: "callout", html: "Result: clean, repeatable waves in water at up to <strong>2 Hz</strong>. Paper in prep for Fall." },
        ],
      },

      /* =========================
         7) BIER — 1/25th WATER CHANNEL MODEL
         ========================= */
      {
        id: "water-model",
        title: "BIER Lab: 1/25th-Scale Water Channel Model",
        tags: ["Structures", "CFD"],
        bullets: ["Display + teaching model", "First-pass loads & safety", "Power at 2 m/s flow"],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 88,
          stats: [
            { label: "Scale", value: "1/25" },
            { label: "Test Section Flow", value: "2 m/s" },
            { label: "Focus", value: "Loads & safety" },
            { label: "Use", value: "Display/teaching" },

          ],
        },
        rich: [
          { type: "media", src: "/media/UVAModelCad.jpg", caption: "CAD of the full-scale water channel." },
          { type: "media", src: "/media/UVAModel.jpg", caption: "1/25-scale model — front view." },
          { type: "media", src: "/media/UVAModel2.jpg", caption: "1/25-scale model — rear view." },
          { type: "media", src: "/media/UVAModelOnDisplay.jpg", caption: "Final model on public display." },

          { type: "h", text: "Why Build It" },
          { type: "p", html: "Give students and visitors a tangible view of a new water tunnel and sanity-check early design ideas." },

          { type: "h", text: "What I Did" },
          { type: "ul", items: [
            "Built a <strong>durable scale model</strong> that mirrors key structure.",
            "Ran quick load checks and <strong>what-if safety scenarios</strong> for failures.",
            "Estimated <strong>power draw</strong> for 2 m/s test-section flow.",
          ]},

          { type: "callout", html: "Outcome: a useful show-and-tell piece that also informed early engineering conversations." },
        ],
      },

      /* =========================
         8) BIER — SCHOOLING TUNA & ORCA CFD
         ========================= */
      {
        id: "cfd",
        title: "BIER Lab: Schooling Tuna & Orca CFD",
        tags: ["CFD"],
        bullets: ["Schooling efficiency deltas", "Orca fin sweep effects", "AMR, in-house solver"],
        ui: {
          visible: 3,
          gap: 16,
          captionPx: 12,
          bodyPx: 16,
          bodyMaxCh: 90,
          stats: [
            { label: "Efficiency Gain", value: "~10%" },
            { label: "Spacing", value: "0.1–0.2 BL" },
            { label: "Mesh", value: "AMR near body/wake" },
            { label: "Solver", value: "In-house (transient)" },

          ],
        },
        rich: [
          { type: "media", src: "/media/orca-ortho.mp4", caption: "Vortices forming and shedding through the stroke." },
          { type: "media", src: "/media/orca-bot.mp4", caption: "Orca bottom view: wake structure and coherence." },
          { type: "media", src: "/media/TunaTop.gif", caption: "Tuna schooling — top view." },
          { type: "media", src: "/media/TunaSide.gif", caption: "Tuna schooling — side view." },

          { type: "h", text: "What We Asked" },
          { type: "p", html: "Do fish save energy by swimming together, and what fin geometry matters for maneuvering?" },

          { type: "h", text: "How We Studied It" },
          { type: "ul", items: [
            "Create geometry and motion from footage; smooth and triangulate.",
            "Run an in-house Navier–Stokes solver; refine the mesh near the body and wake (<strong>AMR</strong>).",
          ]},

          { type: "callout", html: "Findings: a loose <strong>diamond phalanx</strong> can improve efficiency by ~<strong>10%</strong>; tighter packs boost group power output by a similar amount. For orca, <strong>pectoral sweep angle</strong> changes lift/drag and wake coherence." },
        ],
      },
    ],
    []
  );

  const [filter, setFilter] = useState(null);
  const [modal, setModal] = useState({ open: false });

  // Consolidated tag set for the filter bar
  const tags = useMemo(
    () => ["Propulsion", "Test Ops", "Sensors", "Calibration", "Structures", "CFD", "Robotics", "Fluids"],
    []
  );

  const [utc, setUtc] = useState("");
  useEffect(() => {
    const tick = () => setUtc(new Date().toUTCString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative min-h-screen bg-transparent text-neutral-900">
      {/* Scroll hints */}
      <ScrollProgress />
      <ScrollNudge />

      {/* Fixed Header */}
      <header
        id="home"
        className="fixed top-0 left-0 right-0 z-40 border-b border-blue-100 bg-white/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl items-end justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide">Luke Pritchard</h1>
            <p className="text-xs text-neutral-500">Propulsion and Test Engineering</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:lukewpritchard@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
            >
              <Mail size={16} />
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/lukewpritchard/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
            <a
              href="/Luke_Pritchard_SpaceX.pdf"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FileDown size={16} />
              Resume
            </a>
            <span className="hidden text-xs text-neutral-500 md:inline">{utc}</span>
          </div>
        </div>
      </header>

      {/* Spacer equal to header height */}
      <div className="h-16" />

      {/* Projects + filter */}
      <section id="projects" className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <h2 className="text-xl font-semibold">Projects</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter((f) => (f === t ? null : t))}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filter === t
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-blue-200 text-neutral-800 hover:border-blue-300"
              }`}
            >
              {t}
            </button>
          ))}
          {filter && (
            <button
              onClick={() => setFilter(null)}
              className="rounded-full border border-blue-200 px-3 py-1 text-xs text-neutral-800 hover:border-blue-300"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {projects
            .filter((p) => !filter || p.tags.includes(filter))
            .map((p) => (
              <div
                key={p.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setModal({ open: true, ...p });
                }}
                onClick={() => setModal({ open: true, ...p })}
                className="cursor-pointer rounded-2xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-medium">{p.title}</h3>
                  <ExternalLink size={16} className="text-neutral-400" />
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
                  {p.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-blue-200 px-2 py-0.5 text-[10px] text-neutral-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Modal to body */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.title}
        summary={modal.summary}
        media={modal.media}
        rich={modal.rich}
        ui={modal.ui}
      />
    </main>
  );
}
