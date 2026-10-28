import React from 'react';
import { MapView } from './MapView';
import { MapPin } from 'lucide-react';

export const MapTabScreen: React.FC = () => {
  return (
    <div className="pb-16 md:pb-0 h-[calc(100vh-140px)] min-h-[520px] flex flex-col">
      <MapView />
    </div>
  );
};
