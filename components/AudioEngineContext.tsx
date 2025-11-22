
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ChannelState, SubgroupState, MasterState, AudioMeterLevels } from '../types';
import { calculateAudioLevels } from '../services/audioEngine';

// Expanded Audio Generator Class for 4 Channels
class PolySynth {
  ctx: AudioContext;
  channels: Array<{ osc: OscillatorNode | null; gain: GainNode }>;
  masterGain: GainNode;

  constructor() {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0;

    // Initialize 4 channels
    this.channels = [0, 1, 2, 3].map(() => {
        const gain = this.ctx.createGain();
        gain.connect(this.masterGain);
        gain.gain.value = 0;
        return { osc: null, gain };
    });
  }

  start() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Frequencies: C Major 7th chord layout approx (C3, E3, G3, B3) to distinguish them
    const freqs = [130.81, 164.81, 196.00, 246.94]; 
    const types: OscillatorType[] = ['sine', 'triangle', 'sine', 'triangle'];

    this.channels.forEach((ch, idx) => {
        if (!ch.osc) {
            ch.osc = this.ctx.createOscillator();
            ch.osc.type = types[idx];
            ch.osc.frequency.setValueAtTime(freqs[idx], this.ctx.currentTime);
            ch.osc.connect(ch.gain);
            ch.osc.start();
        }
    });
  }

  updateVolumes(volumes: number[], masterVol: number) {
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(masterVol, now, 0.05);

    volumes.forEach((vol, idx) => {
        if (this.channels[idx]) {
             // Scale down individual signals to prevent clipping when summed
            this.channels[idx].gain.gain.setTargetAtTime(vol * 0.15, now, 0.05);
        }
    });
  }
}

// Constant for zeroed meters
const ZERO_LEVELS: AudioMeterLevels = {
  channels: {}, 
  subgroups: {}, 
  master: { l:0, r:0 }, 
  auxOutputs: {}, 
  headphones: { 
    hp1: { l: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, r: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 } }, 
    hp2: { l: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, r: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 } }
  }
};

interface AudioContextType {
  meterLevels: AudioMeterLevels;
  toggleAudio: () => void;
  isAudioActive: boolean;
}

const AudioEngineContext = createContext<AudioContextType | null>(null);

export const AudioEngineProvider: React.FC<{ 
  children: React.ReactNode; 
  channels: ChannelState[];
  subgroups: SubgroupState[];
  master: MasterState;
  auxPrePost: boolean[];
}> = ({ children, channels, subgroups, master, auxPrePost }) => {
  const [meterLevels, setMeterLevels] = useState<AudioMeterLevels>(ZERO_LEVELS);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const synthRef = useRef<PolySynth | null>(null);
  const requestRef = useRef<number | null>(null);

  const toggleAudio = () => {
    if (isAudioActive) {
        // Suspend (Pause)
        if (synthRef.current) {
            synthRef.current.ctx.suspend();
        }
        setIsAudioActive(false);
    } else {
        // Start or Resume
        if (!synthRef.current) {
            synthRef.current = new PolySynth();
        }
        synthRef.current.start();
        setIsAudioActive(true);
    }
  };

  // Simulation Loop
  const animate = () => {
    // If audio is inactive, zero out meters and stop processing logic
    if (!isAudioActive) {
        setMeterLevels(ZERO_LEVELS);
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    // 1. Calculate Meter/Logic Levels
    const levels = calculateAudioLevels(channels, subgroups, master, auxPrePost);
    setMeterLevels(levels);

    // 2. Update Real Audio Engine (Volume mapping)
    if (synthRef.current) {
        
        // Simplified Routing Check for Audio Engine
        const isChRoutedToMain = (ch: ChannelState) => {
            if (ch.routing.main) return true;
            if (ch.routing.sub12) {
               // Check if Sub 1 or 2 goes to Main
               if (subgroups[0].routing.mainL || subgroups[0].routing.mainR) return true;
               if (subgroups[1].routing.mainL || subgroups[1].routing.mainR) return true;
            }
            if (ch.routing.sub34) {
               if (subgroups[2].routing.mainL || subgroups[2].routing.mainR) return true;
               if (subgroups[3].routing.mainL || subgroups[3].routing.mainR) return true;
            }
            return false;
        };

        // Calculate volume for each channel based on Fader, Gain, and Main Routing presence
        const volumes = channels.map(ch => {
             if (isChRoutedToMain(ch)) {
                 return ch.gain * ch.fader;
             }
             return 0;
        });

        // Pad volumes if fewer than 4 channels exist (though we have 4 now)
        while(volumes.length < 4) volumes.push(0);

        synthRef.current.updateVolumes(volumes, master.fader);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [channels, subgroups, master, auxPrePost, isAudioActive]);

  return (
    <AudioEngineContext.Provider value={{ meterLevels, toggleAudio, isAudioActive }}>
      {children}
    </AudioEngineContext.Provider>
  );
};

export const useAudioEngine = () => {
    const context = useContext(AudioEngineContext);
    if (!context) throw new Error("useAudioEngine must be used within AudioEngineProvider");
    return context;
}
