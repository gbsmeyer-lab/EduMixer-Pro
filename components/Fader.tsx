import React, { useState, useCallback, useEffect, useRef } from 'react';

interface FaderProps {
  value: number;
  onChange: (val: number) => void;
  meterLevel: number; // 0-1
  color: string;
  height?: number;
  isStereo?: boolean;
  meterLevelR?: number; // For stereo master
}

export const Fader: React.FC<FaderProps> = ({
  value,
  onChange,
  meterLevel,
  color,
  height = 200,
  isStereo = false,
  meterLevelR = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientY);
    document.body.style.cursor = 'ns-resize';
  };

  const handleMove = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    // Calculate normalized position (0 at bottom, 1 at top)
    let newValue = 1 - (clientY - rect.top) / rect.height;
    newValue = Math.max(0, Math.min(1, newValue));
    onChange(newValue);
  }, [onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientY);
    }
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Fader Cap Position
  const capPosition = (1 - value) * 100; 

  return (
    <div className="flex gap-2 h-full items-end" style={{ height: `${height}px` }}>
        {/* Fader Track */}
      <div 
        ref={trackRef}
        className="relative w-8 h-full bg-gray-800 rounded-md cursor-ns-resize border border-gray-700"
        onMouseDown={handleMouseDown}
      >
        {/* Center Line */}
        <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-gray-900 -translate-x-1/2"></div>
        
        {/* Unity Gain Marker (approx 75%) */}
        <div className="absolute left-0 right-0 top-[25%] h-0.5 bg-gray-600"></div>

        {/* Fader Cap */}
        <div 
            className="absolute left-0 right-0 h-8 bg-gradient-to-b from-gray-500 to-gray-700 rounded shadow-lg border-t border-gray-400 flex items-center justify-center z-10"
            style={{ top: `calc(${capPosition}% - 16px)` }} // -16px is half cap height
        >
            <div className="w-full h-0.5 bg-black/50"></div>
        </div>
      </div>

      {/* Meters */}
      <div className="flex gap-1 h-full py-1">
          <MeterBar level={meterLevel} color={color} />
          {isStereo && <MeterBar level={meterLevelR} color={color} />}
      </div>
    </div>
  );
};

const MeterBar: React.FC<{ level: number; color: string }> = ({ level, color }) => {
    // Clamp
    const safeLevel = Math.max(0, Math.min(1, level));
    const percentage = safeLevel * 100;

    return (
        <div className="w-3 h-full bg-black rounded-sm overflow-hidden relative border border-gray-800">
            {/* Meter Background Grid */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="w-full h-px bg-gray-500"></div>
                ))}
            </div>
            
            {/* Active Signal */}
            <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-75 ease-out"
                style={{ 
                    height: `${percentage}%`, 
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`
                }}
            />
        </div>
    )
}
