
import React, { useState } from 'react';
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

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-neutral-900 p-4 overflow-hidden">
      
      {/* Main Mixer Board Container */}
      <div className="flex flex-col items-center gap-4 h-full max-h-full justify-center">
        
        {/* Mixer Body */}
        <div className="flex bg-black/50 p-4 rounded-xl border border-gray-800 shadow-2xl relative shrink-0 max-h-full overflow-hidden">
             
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
                />
             </div>
        </div>

        {/* Footer Instructions */}
        <div className="mt-4 text-gray-500 text-xs max-w-4xl flex gap-8 bg-gray-800/50 p-3 rounded-lg border border-gray-800 shrink-0">
            <div className="font-bold text-gray-400 whitespace-nowrap">QUICK GUIDE:</div>
            <ul className="flex gap-6 list-disc list-inside">
                <li>Click POWER on the Master strip</li>
                <li>Adjust Gains to set levels</li>
                <li>Route Channels to Subs/Main</li>
                <li>Route Subs to Main</li>
                <li>Raise Faders</li>
                <li>Use Aux knobs for Headphones</li>
            </ul>
        </div>

      </div>
    </div>
  );
};

export default function App() {
  const [channels, setChannels] = useState<ChannelState[]>(INITIAL_CHANNELS);
  const [subgroups, setSubgroups] = useState<SubgroupState[]>(INITIAL_SUBGROUPS);
  const [master, setMaster] = useState<MasterState>({ fader: 0.8 });
  // Default to Pre-Fader (true)
  const [auxPrePost, setAuxPrePost] = useState<boolean[]>([true, true, true, true]);

  return (
    <AudioEngineProvider 
        channels={channels} 
        subgroups={subgroups} 
        master={master}
        auxPrePost={auxPrePost}
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
    </AudioEngineProvider>
  );
}
