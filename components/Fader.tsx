import React, { useState, useCallback, useEffect, useRef } from 'react';

interface FaderProps {
  value: number;
  onChange: (val: number) => void;
  meterLevel: number; // 0-1
  color: string;
  height?: number | string;
  isStereo?: boolean;
  meterLevelR?: number; // For stereo master
  capColor?: string; // Custom color for fader cap
  className?: string; // To allow flex control from parent
}

export const Fader: React.FC<FaderProps> = ({
  value,
  onChange,
  meterLevel,
  color,
  height = 200,
  isStereo = false,
  meterLevelR = 0,
  capColor,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientY);
    document.body.style.cursor = 'ns-resize';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // We do NOT call preventDefault here to allow click events to propagate if needed,
    // but generally for a fader we want immediate control.
    setIsDragging(true);
    // Move fader cap immediately to touch point
    handleMove(e.touches[0].clientY);
  };

  const handleMove = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.height === 0) return; // Prevent division by zero if hidden/collapsed

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

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      // Allow 2-finger gestures (like pan/zoom) to pass through without affecting the fader
      if (e.touches.length > 1) return;

      // Prevent scrolling while moving fader
      if (e.cancelable) e.preventDefault();
      handleMove(e.touches[0].clientY);
    }
  }, [isDragging, handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  // Fader Cap Position
  // Value 1 (Top) -> 0% top
  // Value 0 (Bottom) -> 100% top
  const capPosition = (1 - value) * 100; 
  
  // Determine Cap Styling
  const capBaseClasses = "absolute left-0 right-0 h-8 rounded shadow-lg border-t flex items-center justify-center z-10";
  const capDefaultClasses = "bg-gradient-to-b from-gray-500 to-gray-700 border-gray-400";
  
  // If capColor is present, we use inline styles to override background. 
  const capStyle: React.CSSProperties = {
    top: `calc(${capPosition}% - 16px)`,
    ...(capColor ? {
        background: `linear-gradient(to bottom, ${capColor}, #450a0a)`, // Gradient to very dark version of color
        borderColor: '#fca5a5' // lighter top border for highlight
    } : {})
  };

  // Style object for container height
  const containerStyle: React.CSSProperties = typeof height === 'number' 
    ? { height: `${height}px` } 
    : { height };

  return (
    <div 
        className={`flex gap-2 items-end relative ${typeof height === 'string' ? 'h-full' : ''} ${className}`} 
        style={containerStyle}
    >
        {/* Fader Track */}
      <div 
        ref={trackRef}
        className="relative w-8 h-full bg-gray-800 rounded-md cursor-ns-resize border border-gray-700 touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Center Line */}
        <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-gray-900 -translate-x-1/2"></div>
        
        {/* Unity Gain Marker (approx 75%) */}
        <div className="absolute left-0 right-0 top-[25%] h-0.5 bg-gray-600"></div>

        {/* Fader Cap */}
        <div 
            className={`${capBaseClasses} ${!capColor ? capDefaultClasses : ''}`}
            style={capStyle}
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
                className="absolute bottom-0 left-0 right-0 transition-all duration-75 ease-linear"
                style={{ 
                    height: `${percentage}%`, 
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`
                }}
            />
        </div>
    )
}