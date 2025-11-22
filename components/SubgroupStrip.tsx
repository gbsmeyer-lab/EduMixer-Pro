
import React from 'react';
import { SubgroupState } from '../types';
import { Fader } from './Fader';

interface SubgroupStripProps {
  group: SubgroupState;
  updateGroup: (id: number, updates: Partial<SubgroupState>) => void;
  meterLevel: number;
}

export const SubgroupStrip: React.FC<SubgroupStripProps> = ({ group, updateGroup, meterLevel }) => {
  const toggleRouting = (key: keyof SubgroupState['routing']) => {
    updateGroup(group.id, {
      routing: { ...group.routing, [key]: !group.routing[key] },
    });
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 border-r border-gray-800 p-2 w-24 shrink-0 relative">
      {/* Note: Removed top spacer and h-full to allow parent container to control vertical positioning */}
      
      {/* Routing */}
      <div className="flex flex-col gap-1 mb-4 w-full px-1">
        <button
          onClick={() => toggleRouting('mainL')}
          className={`text-[9px] font-bold py-1 rounded border transition-colors ${
            group.routing.mainL
              ? 'bg-green-600 text-white border-green-500'
              : 'bg-gray-800 text-gray-500 border-gray-600'
          }`}
        >
          MAIN L
        </button>
        <button
          onClick={() => toggleRouting('mainR')}
          className={`text-[9px] font-bold py-1 rounded border transition-colors ${
            group.routing.mainR
              ? 'bg-green-600 text-white border-green-500'
              : 'bg-gray-800 text-gray-500 border-gray-600'
          }`}
        >
          MAIN R
        </button>
      </div>

      {/* Fader */}
      <div className="flex justify-center w-full pb-2">
        <Fader
          value={group.fader}
          onChange={(val) => updateGroup(group.id, { fader: val })}
          meterLevel={meterLevel}
          color="#10b981" // Emerald Green for subs
          height={220}
        />
      </div>
      
       <div className="text-xs text-white font-bold font-mono mt-6">SUB {group.id}</div>
    </div>
  );
};
