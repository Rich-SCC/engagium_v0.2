import React from 'react';

const Notifications = () => {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          Notification <span className="ml-2 text-red-600">🔔</span>
        </h1>
        <div className="mt-8 text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">No notifications at this time</p>
          <p className="text-gray-400 text-sm mt-2">
            You'll see notifications here when there's activity in your classes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
