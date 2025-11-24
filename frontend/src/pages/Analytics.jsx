import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionsAPI, classesAPI } from '@/services/api';

const Analytics = () => {
  const [selectedMonth, setSelectedMonth] = useState('Month');

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll(),
  });

  const classes = classesData?.data || [];
  const sessions = sessionsData?.data || [];

  // Mock data for charts
  const lineChartData = [
    { label: 'Item 1', microphone: 0, reactions: 15, chats: 20 },
    { label: 'Item 2', microphone: 12, reactions: 30, chats: 5 },
    { label: 'Item 3', microphone: 38, reactions: 35, chats: 22 },
    { label: 'Item 4', microphone: 35, reactions: 22, chats: 32 },
    { label: 'Item 5', microphone: 32, reactions: 50, chats: 18 },
  ];

  const performanceData = [
    { class: 'CS101 - D', value: 30 },
    { class: 'CS501 - B', value: 60 },
    { class: 'CS101 - A', value: 75 },
    { class: 'CS105 - C', value: 95 },
  ];

  const pieData = [
    { label: 'Item 1', value: 62.5, color: '#1f2937' },
    { label: 'Item 2', value: 25, color: '#9ca3af' },
    { label: 'Item 3', value: 12.5, color: '#d1d5db' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center">
        Analytics <span className="ml-2">📊</span>
      </h1>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-300 rounded-lg shadow p-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Classes</h3>
          <p className="text-6xl font-bold text-gray-900">{classes.length || 17}</p>
        </div>
        <div className="bg-gray-300 rounded-lg shadow p-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Total Sessions</h3>
          <p className="text-6xl font-bold text-gray-900">{sessions.length || 90}</p>
        </div>
        <div className="bg-gray-300 rounded-lg shadow p-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Average</h3>
          <p className="text-6xl font-bold text-gray-900">77%</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-6 mb-6">
          <label className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-black"></span>
            <span className="text-sm">Microphone</span>
          </label>
          <label className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-sm">Reactions</span>
          </label>
          <label className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-gray-300"></span>
            <span className="text-sm">Chats</span>
          </label>
        </div>

        {/* Simple Line Chart Representation */}
        <div className="relative h-64 border-l border-b border-gray-300">
          <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end h-full pb-8">
            {lineChartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                <div className="relative w-full flex justify-center items-end h-full">
                  {/* Microphone */}
                  <div
                    className="w-2 bg-black mx-1"
                    style={{ height: `${item.microphone}%` }}
                  ></div>
                  {/* Reactions */}
                  <div
                    className="w-2 bg-gray-400 mx-1"
                    style={{ height: `${item.reactions}%` }}
                  ></div>
                  {/* Chats */}
                  <div
                    className="w-2 bg-gray-300 mx-1"
                    style={{ height: `${item.chats}%` }}
                  ></div>
                </div>
                <span className="text-xs mt-2 text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 -ml-8">
            <span>50</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Weekly & Monthly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Weekly Progress</h3>
          <div className="flex items-center justify-center space-x-6 mb-4">
            <label className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-gray-700"></span>
              <span className="text-sm">Series 1</span>
            </label>
            <label className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span className="text-sm">Series 2</span>
            </label>
          </div>
          <div className="relative h-48 bg-gray-50 rounded">
            {/* Area chart placeholder */}
            <svg viewBox="0 0 400 150" className="w-full h-full">
              <path
                d="M 0,100 Q 50,80 100,85 T 200,75 T 300,80 T 400,90 L 400,150 L 0,150 Z"
                fill="#9ca3af"
                opacity="0.6"
              />
              <path
                d="M 0,120 Q 50,100 100,105 T 200,110 T 300,100 T 400,105 L 400,150 L 0,150 Z"
                fill="#374151"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Monthly Progress</h3>
            <select
              className="text-sm border border-gray-300 rounded px-3 py-1"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option>Month</option>
              <option>January</option>
              <option>February</option>
              <option>March</option>
            </select>
          </div>
          <div className="flex items-center justify-center h-48">
            {/* Donut chart */}
            <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="#1f2937"
                strokeWidth="20"
                strokeDasharray="141 188"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="20"
                strokeDasharray="47 188"
                strokeDashoffset="-141"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Performance Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-6">Performance Statistics</h3>
        <div className="space-y-4">
          {performanceData.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="text-sm font-medium w-24">{item.class}</span>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-8">
                  <div
                    className={`h-8 rounded-full ${
                      index === 0
                        ? 'bg-gray-300'
                        : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                        ? 'bg-gray-600'
                        : 'bg-black'
                    }`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{item.value}%</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center space-x-4 text-xs">
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-6 text-center">Distribution</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Item 1 - 62.5% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1f2937"
                strokeWidth="20"
                strokeDasharray="157 251"
              />
              {/* Item 2 - 25% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="20"
                strokeDasharray="63 251"
                strokeDashoffset="-157"
              />
              {/* Item 3 - 12.5% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="20"
                strokeDasharray="31 251"
                strokeDashoffset="-220"
              />
            </svg>
            {/* Labels */}
            <div className="absolute top-4 right-0 text-xs">
              <div className="text-right">
                <p className="font-semibold">Item 3</p>
                <p className="text-gray-600">12.5%</p>
              </div>
            </div>
            <div className="absolute bottom-12 left-0 text-xs">
              <div>
                <p className="font-semibold">Item 2</p>
                <p className="text-gray-600">25%</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-0 text-xs">
              <div className="text-right">
                <p className="font-semibold">Item 1</p>
                <p className="text-gray-600">62.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
