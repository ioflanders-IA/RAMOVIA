import React from 'react';
import { SquadWorkersRegistry } from '../calendar/SquadWorkersRegistry';

export const WorkersView: React.FC = () => {
  return (
    <div className="space-y-[3px]">
      <SquadWorkersRegistry />
    </div>
  );
};

export default WorkersView;
