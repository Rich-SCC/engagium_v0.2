import React, { useState } from 'react';
import { XMarkIcon, ArrowsRightLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';

const StudentMergeModal = ({ isOpen, onClose, classId, students }) => {
  const queryClient = useQueryClient();
  const [keepStudentId, setKeepStudentId] = useState('');
  const [mergeStudentId, setMergeStudentId] = useState('');

  const mergeMutation = useMutation({
    mutationFn: () => classesAPI.mergeStudents(classId, keepStudentId, mergeStudentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', classId]);
      onClose();
      setKeepStudentId('');
      setMergeStudentId('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keepStudentId || !mergeStudentId) return;
    if (keepStudentId === mergeStudentId) {
      alert('Cannot merge a student with itself');
      return;
    }

    if (confirm('Are you sure? This action cannot be undone. All participation logs, notes, and tags from the merged student will be transferred to the kept student.')) {
      mergeMutation.mutate();
    }
  };

  const handleClose = () => {
    setKeepStudentId('');
    setMergeStudentId('');
    onClose();
  };

  if (!isOpen) return null;

  const keepStudent = students.find(s => s.id === keepStudentId);
  const mergeStudent = students.find(s => s.id === mergeStudentId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="w-6 h-6" />
            <h2 className="text-xl font-bold">Merge Duplicate Students</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900">Warning: This action cannot be undone</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Merging will transfer all participation logs, notes, and tags from the merged student to the kept student, then delete the merged student record.
              </p>
            </div>
          </div>

          {/* Student Selection */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keep This Student <span className="text-green-600">(Primary)</span>
              </label>
              <select
                value={keepStudentId}
                onChange={(e) => setKeepStudentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select student to keep...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                    {student.student_id && ` (${student.student_id})`}
                  </option>
                ))}
              </select>
              {keepStudent && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <p><strong>Name:</strong> {keepStudent.full_name}</p>
                  {keepStudent.student_id && <p><strong>ID:</strong> {keepStudent.student_id}</p>}
                  <p className="text-green-700 mt-2">✓ This record will be kept</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merge This Student <span className="text-red-600">(Will be deleted)</span>
              </label>
              <select
                value={mergeStudentId}
                onChange={(e) => setMergeStudentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select student to merge...</option>
                {students.map((student) => (
                  <option 
                    key={student.id} 
                    value={student.id}
                    disabled={student.id === keepStudentId}
                  >
                    {student.full_name}
                    {student.student_id && ` (${student.student_id})`}
                  </option>
                ))}
              </select>
              {mergeStudent && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <p><strong>Name:</strong> {mergeStudent.full_name}</p>
                  {mergeStudent.student_id && <p><strong>ID:</strong> {mergeStudent.student_id}</p>}
                  <p className="text-red-700 mt-2">✗ This record will be deleted</p>
                </div>
              )}
            </div>
          </div>

          {/* What happens */}
          {keepStudent && mergeStudent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What will happen:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All participation logs from {mergeStudent.full_name} will be transferred to {keepStudent.full_name}</li>
                <li>• All notes about {mergeStudent.full_name} will be transferred to {keepStudent.full_name}</li>
                <li>• All tags assigned to {mergeStudent.full_name} will be merged with {keepStudent.full_name}'s tags</li>
                <li>• The record for {mergeStudent.full_name} will be permanently deleted</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!keepStudentId || !mergeStudentId || keepStudentId === mergeStudentId || mergeMutation.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mergeMutation.isPending ? 'Merging...' : 'Merge Students'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentMergeModal;
