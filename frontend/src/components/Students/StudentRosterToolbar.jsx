import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

const StudentRosterToolbar = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  onImport,
  onExport,
  onManageTags,
  onMerge,
  studentCount
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: 'full_name', label: 'Name (A-Z)' },
    { value: 'student_id', label: 'Student ID' },
    { value: 'participation_count', label: 'Participation Count' },
    { value: 'notes_count', label: 'Notes Count' }
  ];

  return (
    <div className="border-b bg-gray-50 px-6 py-4 space-y-4">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search & Filters */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg hover:bg-white transition flex items-center gap-2 ${
              showFilters ? 'bg-white border-gray-900' : 'border-gray-300'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onManageTags}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition flex items-center gap-2"
            title="Manage tags"
          >
            <TagIcon className="w-5 h-5" />
            <span className="hidden md:inline">Tags</span>
          </button>

          <button
            onClick={onMerge}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition flex items-center gap-2"
            title="Merge duplicate students"
          >
            <ArrowsRightLeftIcon className="w-5 h-5" />
            <span className="hidden md:inline">Merge</span>
          </button>

          <button
            onClick={onExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            onClick={onImport}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            <span className="hidden md:inline">Import CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Tag
              </label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="">All students</option>
                {/* Tags will be populated dynamically */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Has Notes
              </label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="">All students</option>
                <option value="true">With notes</option>
                <option value="false">Without notes</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {studentCount} student{studentCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default StudentRosterToolbar;
