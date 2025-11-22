
import { ChannelState, SubgroupState } from './types';

export const CHANNEL_COLORS = {
  CH1: '#f97316', // Orange-500
  CH2: '#3b82f6', // Blue-500
  CH3: '#eab308', // Yellow-500
  CH4: '#a855f7', // Purple-500
};

export const INITIAL_CHANNELS: ChannelState[] = [
  {
    id: 1,
    name: 'CH 1',
    color: CHANNEL_COLORS.CH1,
    gain: 0,
    aux: [0, 0, 0, 0],
    pan: 0,
    fader: 0.75, // Unity approx
    routing: { main: true, sub12: false, sub34: false },
    inputLevel: 1.0, // Constant signal presence
  },
  {
    id: 2,
    name: 'CH 2',
    color: CHANNEL_COLORS.CH2,
    gain: 0,
    aux: [0, 0, 0, 0],
    pan: 0,
    fader: 0.75,
    routing: { main: true, sub12: false, sub34: false },
    inputLevel: 1.0,
  },
  {
    id: 3,
    name: 'CH 3',
    color: CHANNEL_COLORS.CH3,
    gain: 0,
    aux: [0, 0, 0, 0],
    pan: 0,
    fader: 0.75,
    routing: { main: true, sub12: false, sub34: false },
    inputLevel: 1.0,
  },
  {
    id: 4,
    name: 'CH 4',
    color: CHANNEL_COLORS.CH4,
    gain: 0,
    aux: [0, 0, 0, 0],
    pan: 0,
    fader: 0.75,
    routing: { main: true, sub12: false, sub34: false },
    inputLevel: 1.0,
  },
];

export const INITIAL_SUBGROUPS: SubgroupState[] = [
  { id: 1, name: 'SUB 1', fader: 0.75, routing: { mainL: true, mainR: false } },
  { id: 2, name: 'SUB 2', fader: 0.75, routing: { mainL: false, mainR: true } },
  { id: 3, name: 'SUB 3', fader: 0.75, routing: { mainL: true, mainR: false } },
  { id: 4, name: 'SUB 4', fader: 0.75, routing: { mainL: false, mainR: true } },
];

// Logic mapping for HP routing
// HP1 L <- AUX 1
// HP1 R <- AUX 2
// HP2 L <- AUX 3
// HP2 R <- AUX 4
