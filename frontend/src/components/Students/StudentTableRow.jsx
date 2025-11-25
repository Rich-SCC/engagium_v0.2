import React from 'react';
import {
  ChatBubbleLeftIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const StudentTableRow = ({
  student,
  isSelected,
  onToggleSelect,
  onDelete,
  onViewNotes,
  onEdit
}) => {
  const getParticipationColor = (count) => {
    if (count === 0) return 'text-gray-400';
    if (count < 5) return 'text-yellow-600';
    if (count < 10) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(student.id)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-gray-900">
            {student.first_name} {student.last_name}
          </div>
          {/* Tags */}
          {student.tag_names && student.tag_names.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {student.tag_names.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: student.tag_colors?.[idx] + '20',
                    color: student.tag_colors?.[idx] || '#3B82F6'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {student.email || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {student.student_id || '-'}
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`font-medium ${getParticipationColor(
            student.participation_count || 0
          )}`}
        >
          {student.participation_count || 0}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewNotes(student)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition relative"
            title="View notes"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            {student.notes_count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {student.notes_count}
              </span>
            )}
          </button>
          <button
            onClick={() => onEdit(student)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition"
            title="Edit student"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(student.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
            title="Delete student"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;
