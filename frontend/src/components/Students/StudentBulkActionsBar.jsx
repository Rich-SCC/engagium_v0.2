import React, { useState } from 'react';
import {
  XMarkIcon,
  TrashIcon,
  TagIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const StudentBulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkTag,
  tags
}) => {
  const [showTagMenu, setShowTagMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 z-40 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <CheckIcon className="w-5 h-5" />
        <span className="font-medium">{selectedCount} selected</span>
      </div>

      <div className="h-6 w-px bg-gray-600" />

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowTagMenu(!showTagMenu)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
          >
            <TagIcon className="w-4 h-4" />
            Apply Tag
          </button>

          {showTagMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowTagMenu(false)}
              />
              <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-900 rounded-lg shadow-xl border min-w-[200px] z-20">
                <div className="p-2 max-h-64 overflow-y-auto">
                  {tags.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No tags available
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          onBulkTag(tag.id);
                          setShowTagMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: tag.tag_color }}
                        />
                        {tag.tag_name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onBulkDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2"
        >
          <TrashIcon className="w-4 h-4" />
          Delete
        </button>
      </div>

      <div className="h-6 w-px bg-gray-600" />

      <button
        onClick={onClearSelection}
        className="p-2 hover:bg-gray-800 rounded-lg transition"
        title="Clear selection"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default StudentBulkActionsBar;
