
import React from 'react';
import { MasterState } from '../types';
import { Fader } from './Fader';

interface MasterStripProps {
  master: MasterState;
  onChange: (val: number) => void;
  meterLevelL: number;
  meterLevelR: number;
  isAudioActive: boolean;
  startAudio: () => void;
  auxPrePost: boolean[];
  toggleAuxPrePost: (index: number) => void;
}

export const MasterStrip: React.FC<MasterStripProps> = ({ 
  master, 
  onChange, 
  meterLevelL, 
  meterLevelR,
  isAudioActive,
  startAudio,
  auxPrePost,
  toggleAuxPrePost
}) => {
  return (
    <div className="flex flex-col items-center bg-gray-950 border-l-2 border-gray-700 p-2 w-24 shrink-0 h-full">
      {/* Power Button */}
      <button
        onClick={!isAudioActive ? startAudio : undefined}
        className={`text-xs font-bold px-2 py-2 rounded w-full text-center mt-2 border transition-all duration-300 ${
            isAudioActive 
            ? 'bg-green-600 border-green-400 text-white shadow-[0_0_12px_rgba(34,197,94,0.8)] cursor-default' 
            : 'bg-red-950 border-red-900 text-red-700 hover:bg-red-900 hover:text-red-500 hover:border-red-700 cursor-pointer'
        }`}
        title={isAudioActive ? "System Active" : "Click to Power On"}
      >
        POWER
      </button>

      {/* Spacer to Align with Channel Gain Section */}
      {/* Gain Section Height approx: 4(pad) + 40(knob) + 4(gap) + 15(txt) + 4(pad) + 16(mb) = ~83px? 
          Actually aligning to start of Aux 1. 
          Channel: [Title ~32px] + [Gain Block ~67px + 16px mb = 83px] -> Total offset ~115px.
          Master: [Power ~42px (mt-2 + h)]. Gap needed ~73px.
          We use a flexible spacer or fixed height to match the visual rhythm.
      */}
      <div className="h-[70px] w-full flex items-end justify-center pb-2">
          <div className="text-[9px] text-gray-600 font-mono tracking-widest uppercase text-center">AUX CFG</div>
      </div>

      {/* Aux Pre/Post Toggles - Aligned with Channel Aux Knobs */}
      {/* Channel Auxes use gap-2. Each Knob is approx 59px high. 
          We match this rhythm here. */}
      <div className="flex flex-col gap-2 mb-4 w-full">
        {auxPrePost.map((isPre, idx) => (
            <div key={idx} className="h-[58px] flex items-center justify-center">
                 <button
                    onClick={() => toggleAuxPrePost(idx)}
                    className={`w-full py-2 px-1 rounded text-[10px] font-bold border transition-colors flex flex-col items-center justify-center gap-1 ${
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

      {/* Spacer to push Fader to bottom */}
      <div className="flex-1"></div>

      <div className="h-[220px] flex justify-center w-full pb-2 mb-6">
        <Fader
          value={master.fader}
          onChange={onChange}
          meterLevel={meterLevelL}
          meterLevelR={meterLevelR}
          isStereo
          color="#ec4899" // Pink/Red for master
          height={220}
        />
      </div>
      
      <div className="text-xs text-white font-bold font-mono mb-2">MASTER</div>
    </div>
  );
};
