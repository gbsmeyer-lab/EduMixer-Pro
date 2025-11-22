
import React, { useMemo } from 'react';
import { SourceLevels } from '../types';
import { CHANNEL_COLORS } from '../constants';

interface HeadphoneProps {
  id: number;
  leftSources: SourceLevels;
  rightSources: SourceLevels;
}

// Helper component for the Helix visualization
const HelixMeter: React.FC<{
  levels: [number, number, number, number]; // 0-1 for ch1-ch4
  colors: [string, string, string, string];
  className?: string;
}> = ({ levels, colors, className }) => {
  const uniqueId = React.useId();
  
  // SVG Geometry Constants
  const width = 40;
  const height = 200;
  const cycles = 2.5;     // Number of twists
  const amplitude = 12;   // Width of the twist
  const points = 60;      // Resolution of the curve
  const strokeWidth = 4;  // Slightly thinner to accommodate 4 strands

  // Generate path data for 4 intertwined strands
  // We use 0, 90, 180, 270 degree phase shifts
  const paths = useMemo(() => {
    let p1 = `M ${width/2} ${height}`;
    let p2 = `M ${width/2} ${height}`;
    let p3 = `M ${width/2} ${height}`;
    let p4 = `M ${width/2} ${height}`;
    
    for (let i = 0; i <= points; i++) {
        const y = height - (i / points) * height;
        const t = (i / points) * Math.PI * 2 * cycles;
        
        // Strand 1 (Phase 0) - sin(t)
        const x1 = (width/2) + amplitude * Math.sin(t);
        p1 += ` L ${x1.toFixed(1)} ${y.toFixed(1)}`;
        
        // Strand 2 (Phase 180) - sin(t + PI)
        const x2 = (width/2) + amplitude * Math.sin(t + Math.PI);
        p2 += ` L ${x2.toFixed(1)} ${y.toFixed(1)}`;

        // Strand 3 (Phase 90) - cos(t)
        const x3 = (width/2) + amplitude * Math.cos(t);
        p3 += ` L ${x3.toFixed(1)} ${y.toFixed(1)}`;

        // Strand 4 (Phase 270) - cos(t + PI)
        const x4 = (width/2) + amplitude * Math.cos(t + Math.PI);
        p4 += ` L ${x4.toFixed(1)} ${y.toFixed(1)}`;
    }
    return [p1, p2, p3, p4];
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-md" preserveAspectRatio="none">
            <defs>
                {/* Generate Clip Paths for each channel */}
                {levels.map((lvl, idx) => {
                    const l = Math.max(0, Math.min(1, lvl));
                    return (
                        <clipPath id={`clip-${idx}-${uniqueId}`} key={idx}>
                             <rect x="0" y={height * (1 - l)} width={width} height={height * l} />
                        </clipPath>
                    );
                })}
            </defs>

            {/* Background Tracks (Dark/Inactive) */}
            {paths.map((d, idx) => (
                <path key={`bg-${idx}`} d={d} stroke="#1f2937" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
            ))}

            {/* Active Signal Tracks (Colored & Clipped) */}
            <g style={{ mixBlendMode: 'screen' }}>
                {paths.map((d, idx) => (
                    <path 
                        key={`active-${idx}`}
                        d={d} 
                        stroke={colors[idx]} 
                        strokeWidth={strokeWidth} 
                        fill="none" 
                        strokeLinecap="round" 
                        clipPath={`url(#clip-${idx}-${uniqueId})`} 
                        className="transition-all duration-75 ease-linear"
                    />
                ))}
            </g>
        </svg>
    </div>
  );
}

export const HeadphoneMonitor: React.FC<HeadphoneProps> = ({ id, leftSources, rightSources }) => {
  
  const allColors: [string, string, string, string] = [
      CHANNEL_COLORS.CH1,
      CHANNEL_COLORS.CH2,
      CHANNEL_COLORS.CH3,
      CHANNEL_COLORS.CH4
  ];

  return (
    <div className="flex flex-col items-center bg-gray-800 rounded-xl p-3 shadow-xl border border-gray-700 w-[96%] flex-1 justify-center min-h-0 relative overflow-hidden group">
      <h4 className="text-gray-400 font-bold mb-2 text-sm tracking-widest z-10">HEADPHONES {id}</h4>
      
      {/* Headband Background - Absolute */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-32 border-t-8 border-gray-600 rounded-t-[120px] opacity-60 pointer-events-none"></div>

      <div className="flex gap-6 items-center mt-1 z-10 w-full justify-center">
        
        {/* Left Side Assembly */}
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-3">
               {/* L Indicator (Outside) */}
               <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] select-none">L</span>

               {/* Earcup with Meter Inside */}
               <div className="relative w-20 h-28 bg-gray-900 rounded-3xl border-4 border-gray-600 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden p-2">
                   <div className="w-full h-full opacity-90">
                       <HelixMeter 
                         levels={[leftSources.ch1, leftSources.ch2, leftSources.ch3, leftSources.ch4]}
                         colors={allColors}
                       />
                   </div>
               </div>
           </div>
           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AUX {id === 1 ? '1' : '3'}</div>
        </div>

        {/* Right Side Assembly */}
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-3">
               {/* Earcup with Meter Inside */}
               <div className="relative w-20 h-28 bg-gray-900 rounded-3xl border-4 border-gray-600 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-hidden p-2">
                   <div className="w-full h-full opacity-90">
                       <HelixMeter 
                         levels={[rightSources.ch1, rightSources.ch2, rightSources.ch3, rightSources.ch4]}
                         colors={allColors}
                       />
                   </div>
               </div>

               {/* R Indicator (Outside) */}
               <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] select-none">R</span>
           </div>
           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AUX {id === 1 ? '2' : '4'}</div>
        </div>

      </div>
      
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
};
