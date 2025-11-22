
import { ChannelState, SubgroupState, MasterState, AudioMeterLevels } from '../types';

export function calculateAudioLevels(
  channels: ChannelState[],
  subgroups: SubgroupState[],
  master: MasterState,
  auxPrePost: boolean[] = [true, true, true, true] // true = Pre, false = Post
): AudioMeterLevels {
  
  const levels: AudioMeterLevels = {
    channels: {},
    subgroups: {},
    master: { l: 0, r: 0 },
    auxOutputs: {},
    headphones: {
      hp1: { l: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, r: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 } },
      hp2: { l: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, r: { ch1: 0, ch2: 0, ch3: 0, ch4: 0 } }
    }
  };

  // Intermediate summing buses
  const busMainL: number[] = [];
  const busMainR: number[] = [];
  const busSub1: number[] = [];
  const busSub2: number[] = [];
  const busSub3: number[] = [];
  const busSub4: number[] = [];
  
  // Aux Buses: Store separated levels for Ch1-Ch4 for each Aux (1-4)
  const auxLevels = [
    { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, // Aux 1
    { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, // Aux 2
    { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }, // Aux 3
    { ch1: 0, ch2: 0, ch3: 0, ch4: 0 }  // Aux 4
  ];

  // 1. Process Channels
  channels.forEach(ch => {
    // Signal logic: Input * Gain * Fader
    const preFaderLevel = ch.inputLevel * ch.gain;
    const postFaderLevel = preFaderLevel * ch.fader;
    
    levels.channels[ch.id] = postFaderLevel;

    // Pan Laws (Constant Power approximation)
    const panRad = (ch.pan + 1) * (Math.PI / 4); // 0 to PI/2
    const panL = Math.cos(panRad);
    const panR = Math.sin(panRad);

    const leftOut = postFaderLevel * panL;
    const rightOut = postFaderLevel * panR;

    // Routing
    if (ch.routing.main) {
      busMainL.push(leftOut);
      busMainR.push(rightOut);
    }
    if (ch.routing.sub12) {
      busSub1.push(leftOut); // Odd = Left usually
      busSub2.push(rightOut); // Even = Right usually
    }
    if (ch.routing.sub34) {
      busSub3.push(leftOut);
      busSub4.push(rightOut);
    }

    // Aux Sends
    ch.aux.forEach((knobVal, idx) => {
       // Determine source based on Pre/Post setting
       const sourceSignal = auxPrePost[idx] ? preFaderLevel : postFaderLevel;
       const auxSignal = sourceSignal * knobVal;
       
       if (auxSignal > 0) {
         // Accumulate based on channel ID
         if (ch.id === 1) auxLevels[idx].ch1 += auxSignal;
         else if (ch.id === 2) auxLevels[idx].ch2 += auxSignal;
         else if (ch.id === 3) auxLevels[idx].ch3 += auxSignal;
         else if (ch.id === 4) auxLevels[idx].ch4 += auxSignal;
       }
    });
  });

  // 2. Process Subgroups
  const processSub = (id: number, inputs: number[], routing: SubgroupState['routing']) => {
    // Sum inputs
    const sum = inputs.reduce((a, b) => a + b, 0);
    const group = subgroups.find(g => g.id === id);
    if (!group) return 0;

    const postFader = sum * group.fader;
    levels.subgroups[id] = postFader;

    if (routing.mainL) busMainL.push(postFader);
    if (routing.mainR) busMainR.push(postFader);
    
    return postFader;
  };

  processSub(1, busSub1, subgroups[0].routing);
  processSub(2, busSub2, subgroups[1].routing);
  processSub(3, busSub3, subgroups[2].routing);
  processSub(4, busSub4, subgroups[3].routing);

  // 3. Process Master
  const mainSumL = busMainL.reduce((a, b) => a + b, 0);
  const mainSumR = busMainR.reduce((a, b) => a + b, 0);

  levels.master.l = mainSumL * master.fader;
  levels.master.r = mainSumR * master.fader;

  // 4. Process Headphones (Aux mapping)
  // Aux 1 -> HP1 L
  // Aux 2 -> HP1 R
  // Aux 3 -> HP2 L
  // Aux 4 -> HP2 R
  
  levels.headphones.hp1 = {
    l: auxLevels[0],
    r: auxLevels[1]
  };

  levels.headphones.hp2 = {
    l: auxLevels[2],
    r: auxLevels[3]
  };

  return levels;
}
