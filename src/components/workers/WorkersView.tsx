import React from 'react';
import { SquadWorkersRegistry } from '../calendar/SquadWorkersRegistry';
import { TeamManagementView } from '../admin/TeamManagementView';

interface WorkersViewProps {
  defaultSection?: 'presenze' | 'team';
}

export const WorkersView: React.FC<WorkersViewProps> = ({ defaultSection = 'presenze' }) => {
  if (defaultSection === 'team') {
    return <TeamManagementView />;
  }

  return <SquadWorkersRegistry />;
};

export default WorkersView;
