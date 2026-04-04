import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
import ClassAnalytics from '@/components/ClassAnalytics';
import { BookOpenIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const Analytics = () => {
  const [selectedClassId, setSelectedClassId] = useState(null);

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
  });

  const classes = classesData?.data || [];
  const selectedClass = classes.find((classItem) => classItem.id === selectedClassId);

  if (selectedClassId) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => setSelectedClassId(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back to classes
            </button>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">{formatClassDisplay(selectedClass)}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Attendance grouped by schedule bundles so the page stays focused on presence and consistency.
            </p>
          </div>
        </div>

        <ClassAnalytics classId={selectedClassId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-500">
          Start with attendance. Choose a class to see average presence and consistency by schedule bundle.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent-50 p-3">
            <BookOpenIcon className="h-6 w-6 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select a class</h2>
            <p className="text-sm text-gray-500">This view only shows the attendance metrics we are starting with.</p>
          </div>
        </div>

        {classesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-gray-900">No classes yet</p>
            <p className="mt-2 text-sm text-gray-500">Create a class first, then come back here to review attendance.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => setSelectedClassId(classItem.id)}
                className="group rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-accent-300 hover:bg-accent-50"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-accent-700">
                  {formatClassDisplay(classItem)}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {classItem.section && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {classItem.section}
                    </span>
                  )}
                  {classItem.subject && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {classItem.subject}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-500">Open bundle-level attendance analytics</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
