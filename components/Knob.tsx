import React, { useState, useEffect, useRef, useCallback } from 'react';

interface KnobProps {
  value: number; // 0 to 1
  onChange: (val: number) => void;
  label?: string;
  color?: string;
  min?: number;
  max?: number;
  bipolar?: boolean; // If true, center is 0 (like Pan)
}

export const Knob: React.FC<KnobProps> = ({
  value,
  onChange,
  label,
  color = '#d1d5db', // gray-300
  min = 0,
  max = 1,
  bipolar = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  // Visual rotation calculation
  // Map 0-1 to -135deg to +135deg
  const rotation = (value - min) / (max - min) * 270 - 135;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
    document.body.style.cursor = 'ns-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY;
    const sensitivity = 0.005; // Value change per pixel
    const deltaValue = deltaY * sensitivity * (max - min);
    
    let newValue = startValue.current + deltaValue;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    
    onChange(newValue);
  }, [isDragging, max, min, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        className="relative w-10 h-10 cursor-ns-resize group"
        title={label}
      >
        {/* Background Ring */}
        <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none">
            <circle cx="50" cy="50" r="40" stroke="#333" strokeWidth="8" fill="#1a1a1a" />
            {/* Indicator Tick */}
             <g transform={`rotate(${rotation}, 50, 50)`}>
                <line x1="50" y1="50" x2="50" y2="15" stroke={color} strokeWidth="6" strokeLinecap="round" />
             </g>
        </svg>
        {/* Interaction Overlay */}
        <div className="absolute inset-0 rounded-full hover:bg-white/5 transition-colors" />
      </div>
      {label && <span className="text-[10px] font-mono text-gray-400 uppercase select-none">{label}</span>}
    </div>
  );
};
