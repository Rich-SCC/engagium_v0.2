import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import { formatClassDisplay, getClassHierarchy } from '@/utils/classFormatter';
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
import StudentFormModal from '@/components/Students/StudentFormModal';
import StudentRosterToolbar from '@/components/Students/StudentRosterToolbar';
import StudentTableRow from '@/components/Students/StudentTableRow';
import StudentBulkActionsBar from '@/components/Students/StudentBulkActionsBar';
import { formatMeetingLinkForDisplay } from '@/utils/urlUtils';

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
  const [showStudentFormModal, setShowStudentFormModal] = useState(false);
  
  // Data states
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('full_name');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Queries
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => classesAPI.getById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes for class data
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', id, debouncedSearchTerm, sortBy],
    queryFn: () => classesAPI.getStudents(id, { 
      search: debouncedSearchTerm,
      sortBy,
      sortOrder: 'ASC'
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes for student lists
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags', id],
    queryFn: () => classesAPI.getTags(id),
    staleTime: 10 * 60 * 1000, // 10 minutes for tags
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
      queryClient.refetchQueries(['students', id]); // Force immediate refetch
      queryClient.invalidateQueries(['class', id]); // Update class details
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete student';
      alert(message);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (studentIds) => classesAPI.bulkDeleteStudents(id, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', id]);
      queryClient.refetchQueries(['students', id]); // Force immediate refetch
      queryClient.invalidateQueries(['class', id]); // Update class details
      setSelectedStudents([]);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete students';
      alert(message);
    }
  });

  const bulkAssignTagMutation = useMutation({
    mutationFn: (tagId) => classesAPI.bulkAssignTag(id, tagId, selectedStudents),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', id]);
      queryClient.refetchQueries(['students', id]); // Force immediate refetch
      setSelectedStudents([]);
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ studentId, data }) => classesAPI.updateStudent(id, studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', id]);
      queryClient.refetchQueries(['students', id]); // Force immediate refetch
      setShowStudentFormModal(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update student';
      alert(message);
    }
  });

  // Handlers
  const handleExportCSV = async () => {
    try {
      const blob = await classesAPI.exportStudents(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // Create a safe filename from the formatted class display
      const safeFileName = formatClassDisplay(classInfo).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeFileName}_students.csv`;
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

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentFormModal(true);
  };

  const handleUpdateStudent = (data) => {
    updateStudentMutation.mutate({ studentId: selectedStudent.id, data });
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
            <h1 className="text-3xl font-bold text-gray-900">{formatClassDisplay(classInfo)}</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
              {classInfo.section && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Section: {classInfo.section}</span>}
              {classInfo.subject && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Subject: {classInfo.subject}</span>}
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
            
            {/* Meeting Links */}
            {classInfo.links && classInfo.links.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Meeting Links</h3>
                <div className="space-y-2">
                  {classInfo.links.map((link) => (
                    <a
                      key={link.id}
                      href={formatMeetingLinkForDisplay(link.link_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-accent-600 hover:text-accent-700 hover:underline"
                    >
                      <LinkIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {link.label || (link.link_type === 'zoom' ? 'Zoom Meeting' : 'Google Meet')}
                        {link.is_primary && <span className="ml-2 text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded">Primary</span>}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {classInfo.schedule && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">
                Schedule{(Array.isArray(classInfo.schedule) && classInfo.schedule.length > 1) ? 's' : ''}
              </h3>
              <div className="space-y-4">
                {/* New format: schedule is an array */}
                {Array.isArray(classInfo.schedule) && classInfo.schedule.length > 0 ? (
                  classInfo.schedule.map((schedule, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gradient-to-r from-accent-50 to-transparent border-l-4 border-accent-500 rounded-r-lg p-3 shadow-sm"
                    >
                      {classInfo.schedule.length > 1 && (
                        <div className="text-xs font-semibold text-accent-700 mb-2">
                          Schedule {idx + 1}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {schedule.days && schedule.days.map(day => (
                          <span
                            key={day}
                            className="px-3 py-1 bg-white text-accent-700 rounded-full text-sm font-medium shadow-sm border border-accent-200"
                          >
                            {day.substring(0, 3)}
                          </span>
                        ))}
                      </div>
                      {(schedule.startTime || schedule.endTime) && (
                        <p className="text-gray-800 font-semibold text-sm">
                          {schedule.startTime && new Date(`1970-01-01T${schedule.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          {schedule.startTime && schedule.endTime && ' - '}
                          {schedule.endTime && new Date(`1970-01-01T${schedule.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  /* Old format: schedule is an object - for backward compatibility */
                  classInfo.schedule.days?.length > 0 && (
                    <div className="bg-gradient-to-r from-accent-50 to-transparent border-l-4 border-accent-500 rounded-r-lg p-3 shadow-sm">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {classInfo.schedule.days.map(day => (
                          <span
                            key={day}
                            className="px-3 py-1 bg-white text-accent-700 rounded-full text-sm font-medium shadow-sm border border-accent-200"
                          >
                            {day.substring(0, 3)}
                          </span>
                        ))}
                      </div>
                      {classInfo.schedule.time && (
                        <p className="text-gray-800 font-semibold text-sm">{classInfo.schedule.time}</p>
                      )}
                    </div>
                  )
                )}
              </div>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participation
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
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
                    onEdit={handleEditStudent}
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

      <StudentFormModal
        isOpen={showStudentFormModal}
        onClose={() => {
          setShowStudentFormModal(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleUpdateStudent}
        initialData={selectedStudent}
        isLoading={updateStudentMutation.isPending}
      />
    </div>
  );
};

export default ClassDetailsPage;
