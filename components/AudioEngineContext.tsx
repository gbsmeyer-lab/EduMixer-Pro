
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ChannelState, SubgroupState, MasterState, AudioMeterLevels } from '../types';
import { calculateAudioLevels } from '../services/audioEngine';

// Expanded Audio Generator Class with Stereo Panning
class PolySynth {
  ctx: AudioContext;
  channels: Array<{ osc: OscillatorNode | null; gain: GainNode; panner: StereoPannerNode }>;
  masterGain: GainNode;

  constructor() {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0;

    // Initialize 4 channels with Gain AND Panner
    this.channels = [0, 1, 2, 3].map(() => {
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();
        
        // Chain: Gain -> Panner -> Master
        gain.connect(panner);
        panner.connect(this.masterGain);
        
        gain.gain.value = 0;
        panner.pan.value = 0;
        
        return { osc: null, gain, panner };
    });
  }

  start() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Frequencies: C Major 7th chord layout (C3, E3, G3, B3)
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

  updateState(volumes: number[], pans: number[], masterVol: number) {
    const now = this.ctx.currentTime;
    
    // Update Master Fader
    // Using setTargetAtTime for smooth organic volume changes
    this.masterGain.gain.setTargetAtTime(masterVol, now, 0.05);

    volumes.forEach((vol, idx) => {
        if (this.channels[idx]) {
             // Scale down individual signals to prevent clipping when summed
            this.channels[idx].gain.gain.setTargetAtTime(vol * 0.15, now, 0.05);
            
            // Update Stereo Pan
            this.channels[idx].panner.pan.setTargetAtTime(pans[idx], now, 0.05);
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

  // We need refs to state for the animation loop to avoid dependency tearing
  const stateRef = useRef({ channels, subgroups, master, auxPrePost });
  useEffect(() => {
      stateRef.current = { channels, subgroups, master, auxPrePost };
  }, [channels, subgroups, master, auxPrePost]);

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

    const { channels, subgroups, master, auxPrePost } = stateRef.current;

    // 1. Calculate Meter/Logic Levels (Visuals)
    const levels = calculateAudioLevels(channels, subgroups, master, auxPrePost);
    setMeterLevels(levels);

    // 2. Update Real Audio Engine (Acoustics)
    if (synthRef.current) {
        
        const channelConfigs = channels.map(ch => {
            // Calculate effective audio contribution to the Master Bus
            // This logic must replicate the mixing path: Ch -> [Main OR Subs] -> Master

            const postFaderLevel = ch.inputLevel * ch.gain * ch.fader;
            
            // Channel Pan Laws (Constant Power approx)
            const panRad = (ch.pan + 1) * (Math.PI / 4); 
            const panL = Math.cos(panRad);
            const panR = Math.sin(panRad);

            let masterL = 0;
            let masterR = 0;

            // --- Path A: Direct to Main ---
            if (ch.routing.main) {
                masterL += postFaderLevel * panL;
                masterR += postFaderLevel * panR;
            }

            // --- Path B: Via Sub 1-2 ---
            // Convention: Odd Sub = Left Side of Pan, Even Sub = Right Side of Pan
            if (ch.routing.sub12) {
                // Signal arriving at Subgroup 1 (Left)
                const signalAtSub1 = postFaderLevel * panL;
                // Signal leaving Subgroup 1 (attenuated by Sub Fader)
                const outSub1 = signalAtSub1 * subgroups[0].fader;
                
                if (subgroups[0].routing.mainL) masterL += outSub1;
                if (subgroups[0].routing.mainR) masterR += outSub1;

                // Signal arriving at Subgroup 2 (Right)
                const signalAtSub2 = postFaderLevel * panR;
                const outSub2 = signalAtSub2 * subgroups[1].fader;

                if (subgroups[1].routing.mainL) masterL += outSub2;
                if (subgroups[1].routing.mainR) masterR += outSub2;
            }

            // --- Path C: Via Sub 3-4 ---
            if (ch.routing.sub34) {
                const signalAtSub3 = postFaderLevel * panL;
                const outSub3 = signalAtSub3 * subgroups[2].fader;
                
                if (subgroups[2].routing.mainL) masterL += outSub3;
                if (subgroups[2].routing.mainR) masterR += outSub3;

                const signalAtSub4 = postFaderLevel * panR;
                const outSub4 = signalAtSub4 * subgroups[3].fader;

                if (subgroups[3].routing.mainL) masterL += outSub4;
                if (subgroups[3].routing.mainR) masterR += outSub4;
            }

            // --- Recombine for Synth ---
            // The synth expects a mono volume and a pan position (-1 to 1).
            // We approximate this from the calculated Left and Right energy.
            
            const totalEnergy = masterL + masterR;
            
            // Avoid divide by zero
            let effectivePan = 0;
            if (totalEnergy > 0.0001) {
                // Simple balance calc: (R - L) / (R + L)
                effectivePan = (masterR - masterL) / totalEnergy;
            }
            // Clamp
            effectivePan = Math.max(-1, Math.min(1, effectivePan));

            return { vol: totalEnergy, pan: effectivePan };
        });

        const volumes = channelConfigs.map(c => c.vol);
        const pans = channelConfigs.map(c => c.pan);

        // Pad arrays if needed (though we fixed channels at 4)
        while(volumes.length < 4) { volumes.push(0); pans.push(0); }

        synthRef.current.updateState(volumes, pans, master.fader);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isAudioActive]); // Only restart loop if active state changes, otherwise use refs

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
