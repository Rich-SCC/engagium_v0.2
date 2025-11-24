import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import {
  ArrowLeftIcon,
  PencilIcon,
  LinkIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ClassFormModal from '@/components/ClassFormModal';
import SessionLinksModal from '@/components/SessionLinksModal';
import ExemptionListModal from '@/components/ExemptionListModal';
import StudentImportModal from '@/components/StudentImportModal';

const ClassDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showExemptionsModal, setShowExemptionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesAPI.getById(id),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', id],
    queryFn: () => classesAPI.getStudents(id),
  });

  const classInfo = classData?.data;
  const students = studentsData?.data || [];

  const updateClassMutation = useMutation({
    mutationFn: (data) => classesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['class', id]);
      queryClient.invalidateQueries(['classes']);
      setShowEditModal(false);
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (studentId) => classesAPI.removeStudent(id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', id]);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (studentIds) => classesAPI.bulkDeleteStudents(id, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', id]);
      setSelectedStudents([]);
    }
  });

  const handleExportCSV = async () => {
    try {
      const blob = await classesAPI.exportStudents(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${classInfo?.name || 'class'}_students.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export students');
    }
  };

  const handleDeleteStudent = (studentId) => {
    if (confirm('Delete this student?')) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedStudents.length} selected students?`)) {
      bulkDeleteMutation.mutate(selectedStudents);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  if (classLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!classInfo) {
    return <div className="text-center py-12">Class not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/classes')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classInfo.name}</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              {classInfo.subject && <span>{classInfo.subject}</span>}
              {classInfo.section && <span>• Section {classInfo.section}</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit
          </button>
          <button
            onClick={() => setShowLinksModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <LinkIcon className="w-5 h-5 mr-2" />
            Links
          </button>
          <button
            onClick={() => setShowExemptionsModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <ShieldExclamationIcon className="w-5 h-5 mr-2" />
            Exemptions
          </button>
        </div>
      </div>

      {/* Class Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{classInfo.description || 'No description'}</p>
          </div>
          {classInfo.schedule && classInfo.schedule.days && classInfo.schedule.days.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Schedule</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {classInfo.schedule.days.map(day => (
                  <span
                    key={day}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {day}
                  </span>
                ))}
              </div>
              {classInfo.schedule.time && (
                <p className="text-gray-600">{classInfo.schedule.time}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-bold">
              Students ({students.length})
            </h2>
          </div>
          <div className="flex gap-2">
            {selectedStudents.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete ({selectedStudents.length})
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center"
            >
              <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
              Import CSV
            </button>
          </div>
        </div>

        {studentsLoading ? (
          <div className="p-12 text-center text-gray-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-500 mb-6">Import students from CSV or add them manually</p>
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Import Students
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.student_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        disabled={deleteStudentMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClassFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={(data) => updateClassMutation.mutate(data)}
        initialData={classInfo}
        isLoading={updateClassMutation.isPending}
      />

      <SessionLinksModal
        isOpen={showLinksModal}
        onClose={() => setShowLinksModal(false)}
        classId={id}
      />

      <ExemptionListModal
        isOpen={showExemptionsModal}
        onClose={() => setShowExemptionsModal(false)}
        classId={id}
      />

      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        classId={id}
      />
    </div>
  );
};

export default ClassDetailsPage;
