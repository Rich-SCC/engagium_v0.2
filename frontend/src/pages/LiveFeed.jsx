import React from 'react';
import LiveEventFeed from '@/components/LiveEventFeed';
import ActiveSessionCard from '@/components/ActiveSessionCard';

const LiveFeed = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Live Feed</h1>
      
      {/* Active Session Overview */}
      <ActiveSessionCard />
      
      {/* Live Event Feed */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <LiveEventFeed />
      </div>
    </div>
  );
};

export default LiveFeed;
