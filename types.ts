
export interface ChannelState {
  id: number;
  name: string;
  color: string; // Hex or Tailwind class fragment
  gain: number; // 0-1
  aux: [number, number, number, number]; // 0-1 for Aux 1-4
  pan: number; // -1 (Left) to 1 (Right)
  fader: number; // 0-1
  routing: {
    main: boolean;
    sub12: boolean;
    sub34: boolean;
  };
  inputLevel: number; // Simulated input signal strength (constant or LFO)
}

export interface SubgroupState {
  id: number;
  name: string;
  fader: number;
  routing: {
    mainL: boolean;
    mainR: boolean;
  };
}

export interface MasterState {
  fader: number;
}

export interface SourceLevels {
  ch1: number;
  ch2: number;
  ch3: number;
  ch4: number;
}

export interface AudioMeterLevels {
  channels: { [id: number]: number }; // Post-fader levels
  subgroups: { [id: number]: number };
  master: { l: number; r: number };
  auxOutputs: { [auxId: number]: number }; // Mixed aux levels
  headphones: {
    hp1: { l: SourceLevels; r: SourceLevels };
    hp2: { l: SourceLevels; r: SourceLevels };
  };
}
