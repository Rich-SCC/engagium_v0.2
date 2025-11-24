import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import { PlusIcon } from '@heroicons/react/24/outline';

const MyClasses = () => {
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
  });

  const classes = classesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          My Classes <span className="ml-2">📚</span>
        </h1>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Create
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes yet</h3>
            <p className="text-gray-500 mb-6">Create your first class to get started</p>
            <button className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
              Create Your First Class
            </button>
          </div>
        ) : (
          classes.slice(0, 3).map((cls, idx) => (
            <div key={cls.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Class {idx + 1}</h3>
                  <p className="text-sm text-gray-600">Class Name</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">•••</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Class Description</p>
            </div>
          ))
        )}
      </div>

      {/* Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Class 1</h2>
            <p className="text-gray-600">Description</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Overall Average */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Average</h3>
              <div className="text-6xl font-bold text-center py-8">77%</div>
            </div>

            {/* Summary Report */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary Report</h3>
              <div className="border rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">No</th>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Timestamp</th>
                      <th className="px-2 py-1 text-left">Activity Type</th>
                      <th className="px-2 py-1 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td colSpan="5" className="px-2 py-8 text-center text-gray-400">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <button className="text-sm bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Schedule</h3>
            <Link to="/app/sessions" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Today, Nov 17</span>
              <button className="text-blue-600 hover:text-blue-800">◀ ▶</button>
            </div>
            <button className="text-2xl">+</button>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sm">Class Schedule - CS101 D</h4>
                <button className="text-gray-400 hover:text-gray-600">•••</button>
              </div>
              <p className="text-xs text-gray-600">07:00 - 9:00 AM</p>
              <p className="text-xs text-gray-500">nrs-oxnj-njd</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClasses;
