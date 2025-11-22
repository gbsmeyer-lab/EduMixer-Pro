
import React, { useState, useRef } from 'react';
import { ChannelStrip } from './components/ChannelStrip';
import { SubgroupStrip } from './components/SubgroupStrip';
import { MasterStrip } from './components/MasterStrip';
import { HeadphoneMonitor } from './components/Headphones';
import { INITIAL_CHANNELS, INITIAL_SUBGROUPS } from './constants';
import { ChannelState, SubgroupState, MasterState } from './types';
import { AudioEngineProvider, useAudioEngine } from './components/AudioEngineContext';

// Inner component to consume context
const MixerInterface: React.FC<{
  channels: ChannelState[];
  setChannels: React.Dispatch<React.SetStateAction<ChannelState[]>>;
  subgroups: SubgroupState[];
  setSubgroups: React.Dispatch<React.SetStateAction<SubgroupState[]>>;
  master: MasterState;
  setMaster: React.Dispatch<React.SetStateAction<MasterState>>;
  auxPrePost: boolean[];
  setAuxPrePost: React.Dispatch<React.SetStateAction<boolean[]>>;
}> = ({ channels, setChannels, subgroups, setSubgroups, master, setMaster, auxPrePost, setAuxPrePost }) => {
  const { meterLevels, toggleAudio, isAudioActive } = useAudioEngine();

  const updateChannel = (id: number, updates: Partial<ChannelState>) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
  };

  const updateGroup = (id: number, updates: Partial<SubgroupState>) => {
    setSubgroups(prev => prev.map(grp => grp.id === id ? { ...grp, ...updates } : grp));
  };

  const toggleAuxPrePost = (index: number) => {
      setAuxPrePost(prev => {
          const next = [...prev];
          next[index] = !next[index];
          return next;
      });
  };

  const handleReset = () => {
    // Deep copy initial states to avoid reference issues
    setChannels(INITIAL_CHANNELS.map(ch => ({
        ...ch,
        aux: [...ch.aux],
        routing: { ...ch.routing }
    })));
    
    setSubgroups(INITIAL_SUBGROUPS.map(sg => ({
        ...sg,
        routing: { ...sg.routing }
    })));

    setMaster({ fader: 0 });
    setAuxPrePost([true, true, true, true]);
  };

  return (
    /* Mixer Body */
    <div className="flex bg-black/50 p-4 rounded-xl border border-gray-800 shadow-2xl relative overflow-hidden">
         
         {/* 1. Input Channels */}
         <div className="flex h-full">
            {channels.map(ch => (
                <ChannelStrip 
                    key={ch.id} 
                    channel={ch} 
                    updateChannel={updateChannel}
                    meterLevel={meterLevels.channels[ch.id] || 0}
                />
            ))}
         </div>

         {/* Spacer/Divider */}
         <div className="w-1 bg-gray-900 border-r border-gray-800 mx-1"></div>

         {/* 2. Subgroup Section (Contains Logo, Headphones, Subgroups) */}
         {/* Width: 4 subgroups * w-24 (6rem/96px) = 384px approx */}
         <div className="flex flex-col bg-gray-900/30">
            
            {/* Top Area: Logo & Monitors */}
            <div className="flex-1 flex flex-col items-center pt-3 pb-3 border-b border-gray-800 border-r min-h-0">
                {/* Logo */}
                <h1 className="text-2xl font-bold text-gray-200 tracking-wider mb-2 shrink-0">
                  EDUMIXER <span className="text-blue-500 text-xs align-top">PRO</span>
                </h1>

                {/* Headphone Monitors - Vertically Stacked */}
                <div className="flex flex-col gap-2 justify-center items-center flex-1 w-full px-2 min-h-0 overflow-hidden">
                    <HeadphoneMonitor 
                        id={1} 
                        leftSources={meterLevels.headphones.hp1.l} 
                        rightSources={meterLevels.headphones.hp1.r} 
                    />
                    <HeadphoneMonitor 
                        id={2} 
                        leftSources={meterLevels.headphones.hp2.l} 
                        rightSources={meterLevels.headphones.hp2.r} 
                    />
                </div>
            </div>

            {/* Bottom Area: Subgroup Strips */}
            <div className="flex shrink-0">
                {subgroups.map(grp => (
                    <SubgroupStrip 
                        key={grp.id} 
                        group={grp} 
                        updateGroup={updateGroup} 
                        meterLevel={meterLevels.subgroups[grp.id] || 0}
                    />
                ))}
            </div>
         </div>

         {/* Spacer/Divider */}
         <div className="w-1 bg-gray-900 border-r border-gray-800 mx-1"></div>

         {/* 3. Master Section */}
         <div className="flex h-full">
            <MasterStrip 
                master={master} 
                onChange={(val) => setMaster({ ...master, fader: val })}
                meterLevelL={meterLevels.master.l}
                meterLevelR={meterLevels.master.r}
                toggleAudio={toggleAudio}
                isAudioActive={isAudioActive}
                auxPrePost={auxPrePost}
                toggleAuxPrePost={toggleAuxPrePost}
                onReset={handleReset}
            />
         </div>
    </div>
  );
};

export default function App() {
  const [channels, setChannels] = useState<ChannelState[]>(INITIAL_CHANNELS);
  const [subgroups, setSubgroups] = useState<SubgroupState[]>(INITIAL_SUBGROUPS);
  const [master, setMaster] = useState<MasterState>({ fader: 0 });
  const [auxPrePost, setAuxPrePost] = useState<boolean[]>([true, true, true, true]);

  // Panning & Zooming state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const lastCenter = useRef({ x: 0, y: 0 });
  const initialDist = useRef(0);
  const initialScale = useRef(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      // 1. Calculate Center for Pan
      const cX = (t1.clientX + t2.clientX) / 2;
      const cY = (t1.clientY + t2.clientY) / 2;
      lastCenter.current = { x: cX, y: cY };

      // 2. Calculate Distance for Zoom
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialDist.current = dist;
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault(); // Prevent browser native pan/zoom
      e.stopPropagation();

      const t1 = e.touches[0];
      const t2 = e.touches[1];

      // 1. Handle Pan
      const cX = (t1.clientX + t2.clientX) / 2;
      const cY = (t1.clientY + t2.clientY) / 2;

      const dx = cX - lastCenter.current.x;
      const dy = cY - lastCenter.current.y;

      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastCenter.current = { x: cX, y: cY };

      // 2. Handle Zoom
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (initialDist.current > 0) {
          const ratio = dist / initialDist.current;
          // Clamp zoom between 0.4x and 3.0x
          const newScale = Math.min(Math.max(initialScale.current * ratio, 0.4), 3.0);
          setScale(newScale);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-neutral-900 overflow-hidden touch-none" 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
        <AudioEngineProvider 
            channels={channels} 
            subgroups={subgroups} 
            master={master}
            auxPrePost={auxPrePost}
        >
            <div 
                className="absolute origin-center transition-transform duration-75 ease-out will-change-transform"
                style={{ 
                    left: '50%', 
                    top: '50%', 
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${scale})`
                }}
            >
                <MixerInterface 
                    channels={channels} 
                    setChannels={setChannels}
                    subgroups={subgroups}
                    setSubgroups={setSubgroups}
                    master={master}
                    setMaster={setMaster}
                    auxPrePost={auxPrePost}
                    setAuxPrePost={setAuxPrePost}
                />
            </div>
        </AudioEngineProvider>
        
        {/* User Hint */}
        <div className="absolute bottom-4 right-4 text-neutral-600 text-xs pointer-events-none select-none">
            Use 2 fingers to pan & zoom
        </div>
    </div>
  );
}
