import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import {
  ArrowLeftIcon,
  PencilIcon,
  LinkIcon,
  ShieldExclamationIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import ClassFormModal from '@/components/ClassDetails/ClassFormModal';
import SessionLinksModal from '@/components/ClassDetails/SessionLinksModal';
import ExemptionListModal from '@/components/ClassDetails/ExemptionListModal';
import StudentImportModal from '@/components/Students/StudentImportModal';
import TagManagementModal from '@/components/Students/TagManagementModal';
import StudentNotesModal from '@/components/Students/StudentNotesModal';
import StudentMergeModal from '@/components/Students/StudentMergeModal';
import StudentRosterToolbar from '@/components/Students/StudentRosterToolbar';
import StudentTableRow from '@/components/Students/StudentTableRow';
import StudentBulkActionsBar from '@/components/Students/StudentBulkActionsBar';

const ClassDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showExemptionsModal, setShowExemptionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  
  // Data states
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('last_name');

  // Queries
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesAPI.getById(id),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', id, searchTerm, sortBy],
    queryFn: () => classesAPI.getStudents(id, { 
      search: searchTerm,
      sortBy,
      sortOrder: 'ASC'
    }),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags', id],
    queryFn: () => classesAPI.getTags(id),
  });

  const classInfo = classData?.data;
  const students = studentsData?.data || [];
  const tags = tagsData?.data || [];

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

  const bulkAssignTagMutation = useMutation({
    mutationFn: (tagId) => classesAPI.bulkAssignTag(id, tagId, selectedStudents),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', id]);
      setSelectedStudents([]);
    }
  });

  // Handlers
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

  const handleBulkTag = (tagId) => {
    bulkAssignTagMutation.mutate(tagId);
  };

  const handleViewNotes = (student) => {
    setSelectedStudent(student);
    setShowNotesModal(true);
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
            <h2 className="text-xl font-bold">Students ({students.length})</h2>
          </div>
        </div>

        <StudentRosterToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onImport={() => setShowImportModal(true)}
          onExport={handleExportCSV}
          onManageTags={() => setShowTagsModal(true)}
          onMerge={() => setShowMergeModal(true)}
          studentCount={students.length}
        />

        {studentsLoading ? (
          <div className="p-12 text-center text-gray-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No students found' : 'No students yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Try adjusting your search or filters'
                : 'Import students from CSV or add them manually'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
              >
                Import Students
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length && students.length > 0}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    isSelected={selectedStudents.includes(student.id)}
                    onToggleSelect={toggleStudentSelection}
                    onDelete={handleDeleteStudent}
                    onViewNotes={handleViewNotes}
                    onEdit={(s) => console.log('Edit', s)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <StudentBulkActionsBar
        selectedCount={selectedStudents.length}
        onClearSelection={() => setSelectedStudents([])}
        onBulkDelete={handleBulkDelete}
        onBulkTag={handleBulkTag}
        tags={tags}
      />

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

      <TagManagementModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        classId={id}
      />

      <StudentNotesModal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedStudent(null);
        }}
        classId={id}
        student={selectedStudent}
      />

      <StudentMergeModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        classId={id}
        students={students}
      />
    </div>
  );
};

export default ClassDetailsPage;
