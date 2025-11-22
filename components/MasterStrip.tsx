
import React from 'react';
import { MasterState } from '../types';
import { Fader } from './Fader';

interface MasterStripProps {
  master: MasterState;
  onChange: (val: number) => void;
  meterLevelL: number;
  meterLevelR: number;
  isAudioActive: boolean;
  toggleAudio: () => void;
  auxPrePost: boolean[];
  toggleAuxPrePost: (index: number) => void;
}

export const MasterStrip: React.FC<MasterStripProps> = ({ 
  master, 
  onChange, 
  meterLevelL, 
  meterLevelR,
  isAudioActive,
  toggleAudio,
  auxPrePost,
  toggleAuxPrePost
}) => {
  return (
    <div className="flex flex-col items-center bg-gray-950 border-l-2 border-gray-700 p-2 w-24 shrink-0 h-full">
      {/* Power Button */}
      <button
        onClick={toggleAudio}
        className={`text-xs font-bold px-2 py-2 rounded w-full text-center mt-2 border transition-all duration-300 ${
            isAudioActive 
            ? 'bg-green-600 border-green-400 text-white shadow-[0_0_12px_rgba(34,197,94,0.8)]' 
            : 'bg-red-950 border-red-900 text-red-700 hover:bg-red-900 hover:text-red-500 hover:border-red-700'
        }`}
        title={isAudioActive ? "System Active (Click to Mute)" : "Click to Power On"}
      >
        POWER
      </button>

      {/* Spacer to Align with Channel Gain Section */}
      <div className="h-[70px] w-full flex items-end justify-center pb-2">
          <div className="text-[9px] text-gray-600 font-mono tracking-widest uppercase text-center">AUX CFG</div>
      </div>

      {/* Aux Pre/Post Toggles - Aligned with Channel Aux Knobs */}
      <div className="flex flex-col gap-2 mb-4 w-full">
        {auxPrePost.map((isPre, idx) => (
            <div key={idx} className="h-[58px] flex items-center justify-center">
                 <button
                    onClick={() => toggleAuxPrePost(idx)}
                    className={`w-14 py-1 rounded text-[10px] font-bold border transition-colors flex flex-col items-center justify-center gap-1 ${
                        isPre 
                        ? 'bg-amber-900/40 text-amber-500 border-amber-700 hover:bg-amber-900/60' 
                        : 'bg-blue-900/40 text-blue-400 border-blue-700 hover:bg-blue-900/60'
                    }`}
                    title={`Aux ${idx+1}: Click to toggle Pre/Post Fader`}
                 >
                    <span>AUX {idx + 1}</span>
                    <span className={`text-[9px] px-1 rounded ${isPre ? 'bg-amber-500 text-black' : 'bg-blue-500 text-black'}`}>
                        {isPre ? 'PRE' : 'POST'}
                    </span>
                 </button>
            </div>
        ))}
      </div>

      {/* Fader Section - Flex-1 to fill remaining vertical space */}
      <div className="flex-1 w-full flex justify-center pb-2 min-h-0 mt-2">
        <Fader
          value={master.fader}
          onChange={onChange}
          meterLevel={meterLevelL}
          meterLevelR={meterLevelR}
          isStereo
          color="#ec4899" // Pink/Red for master meter
          height="100%" // Fill available space
          capColor="#dc2626" // Red-600 for Master Cap
        />
      </div>
      
      <div className="text-xs text-white font-bold font-mono mb-2">MASTER</div>
    </div>
  );
};