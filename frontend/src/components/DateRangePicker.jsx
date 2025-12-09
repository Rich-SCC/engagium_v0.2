import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onQuickSelect }) => {
  const quickFilters = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Semester', days: 120 },
    { label: 'All Time', days: null },
  ];

  const handleQuickFilter = (days) => {
    const end = new Date();
    let start;
    
    if (days === null) {
      // All time - set to a very old date
      start = new Date('2020-01-01');
    } else {
      start = new Date();
      start.setDate(start.getDate() - days);
    }

    onQuickSelect(start, end);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Quick Filter Buttons */}
        {quickFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => handleQuickFilter(filter.days)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 
                     hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          >
            {filter.label}
          </button>
        ))}

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>

        {/* Custom Date Range */}
        <div className="flex items-center gap-2">
          <label htmlFor="start-date" className="text-sm text-gray-600 font-medium whitespace-nowrap">
            From:
          </label>
          <input
            id="start-date"
            type="date"
            value={formatDateForInput(startDate)}
            onChange={(e) => onStartDateChange(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none 
                     focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm text-gray-600 font-medium whitespace-nowrap">
            To:
          </label>
          <input
            id="end-date"
            type="date"
            value={formatDateForInput(endDate)}
            onChange={(e) => onEndDateChange(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none 
                     focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
      </div>

      {/* Selected Range Display */}
      <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
        Showing data from <span className="font-semibold text-gray-700">{startDate?.toLocaleDateString()}</span> to{' '}
        <span className="font-semibold text-gray-700">{endDate?.toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default DateRangePicker;
