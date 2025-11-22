import React from 'react';
import { ChannelState } from '../types';
import { Knob } from './Knob';
import { Fader } from './Fader';

interface ChannelStripProps {
  channel: ChannelState;
  updateChannel: (id: number, updates: Partial<ChannelState>) => void;
  meterLevel: number;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({ channel, updateChannel, meterLevel }) => {
  const toggleRouting = (key: keyof ChannelState['routing']) => {
    updateChannel(channel.id, {
      routing: { ...channel.routing, [key]: !channel.routing[key] },
    });
  };

  const updateAux = (index: number, val: number) => {
    const newAux = [...channel.aux] as [number, number, number, number];
    newAux[index] = val;
    updateChannel(channel.id, { aux: newAux });
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 border-r border-gray-800 p-2 w-24 shrink-0 h-full">
      <h3 className="text-sm font-bold mb-2 px-2 py-0.5 rounded" style={{ backgroundColor: channel.color, color: '#fff' }}>
        {channel.name}
      </h3>

      {/* Gain */}
      <div className="mb-4 bg-gray-800/50 p-1 rounded">
        <Knob
          value={channel.gain}
          onChange={(val) => updateChannel(channel.id, { gain: val })}
          label="Gain"
          color="#ef4444" // Red for gain
        />
      </div>

      {/* Aux Sends */}
      <div className="flex flex-col gap-2 mb-4">
        {channel.aux.map((val, idx) => (
          <Knob
            key={idx}
            value={val}
            onChange={(v) => updateAux(idx, v)}
            label={`Aux ${idx + 1}`}
            color="#fbbf24" // Amber for Aux
          />
        ))}
      </div>

      {/* Routing Buttons */}
      <div className="flex flex-col gap-1 mb-4 w-full px-1">
        <RoutingButton 
          label="L-R" 
          active={channel.routing.main} 
          onClick={() => toggleRouting('main')} 
        />
        <RoutingButton 
          label="1-2" 
          active={channel.routing.sub12} 
          onClick={() => toggleRouting('sub12')} 
        />
        <RoutingButton 
          label="3-4" 
          active={channel.routing.sub34} 
          onClick={() => toggleRouting('sub34')} 
        />
      </div>

      {/* Pan */}
      <div className="mb-4">
        <Knob
          value={channel.pan}
          onChange={(val) => updateChannel(channel.id, { pan: val })}
          label="Pan"
          min={-1}
          max={1}
          bipolar
          color="#38bdf8" // Light blue
        />
      </div>

      {/* Fader Section */}
      <div className="flex-1 flex justify-center w-full pb-2">
        <Fader
          value={channel.fader}
          onChange={(val) => updateChannel(channel.id, { fader: val })}
          meterLevel={meterLevel}
          color={channel.color}
          height={220}
        />
      </div>
      
      <div className="text-xs text-white font-bold font-mono mt-1">CH {channel.id}</div>
    </div>
  );
};

const RoutingButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`text-[10px] font-bold py-1 rounded border transition-colors ${
      active
        ? 'bg-gray-300 text-black border-gray-300'
        : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-500'
    }`}
  >
    {label}
  </button>
);