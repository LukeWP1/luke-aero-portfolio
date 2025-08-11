"use client";
import React from "react";

export default function Backdrop() {
  return (
    // never capture clicks
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* soft neutral base */}
      <div className="absolute inset-0 bg-[#f6f7f9]" />
      {/* subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 31px),
            repeating-linear-gradient(to bottom, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 31px)
          `,
          backgroundSize: "32px 32px"
        }}
      />
      {/* very light vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/6" />
    </div>
  );
}
