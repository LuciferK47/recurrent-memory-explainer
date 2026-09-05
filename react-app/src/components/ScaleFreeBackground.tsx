import React from 'react';

/**
 * ScaleFreeBackground — Static subtle background texture representing
 * the scale-free, heavy-tailed synaptic network graph described in the BDH paper.
 * Kept at 3.5%–4.5% opacity so it reads as paper grain/watermark, preserving 100% text legibility.
 */
export const ScaleFreeBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.042] select-none"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <g stroke="#171717" strokeWidth="1">
          {/* Major Hub 1 (Top Left) */}
          <line x1="220" y1="180" x2="380" y2="120" />
          <line x1="220" y1="180" x2="140" y2="310" />
          <line x1="220" y1="180" x2="310" y2="280" />
          <line x1="220" y1="180" x2="90" y2="140" />
          <line x1="220" y1="180" x2="260" y2="60" />
          <line x1="220" y1="180" x2="480" y2="220" />

          {/* Sub-cluster from Hub 1 */}
          <line x1="310" y1="280" x2="480" y2="220" />
          <line x1="140" y1="310" x2="240" y2="420" />
          <line x1="310" y1="280" x2="390" y2="390" />
          <line x1="380" y1="120" x2="520" y2="110" />

          {/* Major Hub 2 (Center-Right) */}
          <line x1="980" y1="260" x2="840" y2="190" />
          <line x1="980" y1="260" x2="1120" y2="180" />
          <line x1="980" y1="260" x2="1060" y2="380" />
          <line x1="980" y1="260" x2="890" y2="340" />
          <line x1="980" y1="260" x2="930" y2="110" />
          <line x1="980" y1="260" x2="1200" y2="290" />
          <line x1="980" y1="260" x2="780" y2="270" />

          {/* Sub-cluster from Hub 2 */}
          <line x1="840" y1="190" x2="710" y2="160" />
          <line x1="1120" y1="180" x2="1260" y2="140" />
          <line x1="1060" y1="380" x2="1180" y2="460" />
          <line x1="890" y1="340" x2="790" y2="450" />

          {/* Long-range Sparse Highway (Small-World Property) */}
          <line x1="480" y1="220" x2="710" y2="160" strokeDasharray="6 4" />
          <line x1="390" y1="390" x2="780" y2="270" strokeDasharray="6 4" />

          {/* Major Hub 3 (Bottom Center-Left) */}
          <line x1="560" y1="620" x2="440" y2="540" />
          <line x1="560" y1="620" x2="680" y2="560" />
          <line x1="560" y1="620" x2="520" y2="760" />
          <line x1="560" y1="620" x2="660" y2="720" />
          <line x1="560" y1="620" x2="390" y2="690" />
          <line x1="560" y1="620" x2="790" y2="450" />

          {/* Hub 4 (Bottom Right) */}
          <line x1="1140" y1="710" x2="1030" y2="640" />
          <line x1="1140" y1="710" x2="1280" y2="670" />
          <line x1="1140" y1="710" x2="1180" y2="820" />
          <line x1="1140" y1="710" x2="1040" y2="790" />
          <line x1="1140" y1="710" x2="1180" y2="460" />
        </g>

        {/* Nodes */}
        <g fill="#171717">
          {/* Major Hubs (Larger degree) */}
          <circle cx="220" cy="180" r="7" />
          <circle cx="980" cy="260" r="8" />
          <circle cx="560" cy="620" r="7.5" />
          <circle cx="1140" cy="710" r="7" />

          {/* Secondary Nodes */}
          <circle cx="380" cy="120" r="4.5" />
          <circle cx="140" cy="310" r="4" />
          <circle cx="310" cy="280" r="5" />
          <circle cx="480" cy="220" r="4.5" />
          <circle cx="840" cy="190" r="5" />
          <circle cx="1120" cy="180" r="4.5" />
          <circle cx="1060" cy="380" r="5" />
          <circle cx="890" cy="340" r="4.5" />
          <circle cx="710" cy="160" r="4" />
          <circle cx="780" cy="270" r="4" />
          <circle cx="680" cy="560" r="4.5" />
          <circle cx="790" cy="450" r="4" />

          {/* Peripheral / Leaf Nodes (Degree 1-2) */}
          <circle cx="90" cy="140" r="2.5" />
          <circle cx="260" cy="60" r="2.5" />
          <circle cx="520" cy="110" r="2.5" />
          <circle cx="240" cy="420" r="3" />
          <circle cx="390" cy="390" r="3" />
          <circle cx="930" cy="110" r="2.5" />
          <circle cx="1200" cy="290" r="3" />
          <circle cx="1260" cy="140" r="2.5" />
          <circle cx="1180" cy="460" r="3" />
          <circle cx="440" cy="540" r="3" />
          <circle cx="520" cy="760" r="2.5" />
          <circle cx="660" cy="720" r="3" />
          <circle cx="390" cy="690" r="2.5" />
          <circle cx="1030" cy="640" r="3" />
          <circle cx="1280" cy="670" r="2.5" />
          <circle cx="1180" cy="820" r="2.5" />
          <circle cx="1040" cy="790" r="2.5" />
        </g>
      </svg>
    </div>
  );
};
