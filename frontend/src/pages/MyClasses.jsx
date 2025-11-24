import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import { 
  PlusIcon, 
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  LinkIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ClassFormModal from '@/components/ClassFormModal';
import SessionLinksModal from '@/components/SessionLinksModal';
import ExemptionListModal from '@/components/ExemptionListModal';

const MyClasses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showExemptionsModal, setShowExemptionsModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', showArchived],
    queryFn: () => classesAPI.getAll(showArchived),
  });

  const classes = classesData?.data || [];

  const createClassMutation = useMutation({
    mutationFn: (classData) => classesAPI.create(classData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setShowCreateModal(false);
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => classesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setEditingClass(null);
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => classesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => classesAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
    }
  });

  const handleCreateClass = (classData) => {
    createClassMutation.mutate(classData);
  };

  const handleUpdateClass = (classData) => {
    updateClassMutation.mutate({ id: editingClass.id, data: classData });
  };

  const handleArchiveClass = (classItem) => {
    const newStatus = classItem.status === 'active' ? 'archived' : 'active';
    updateStatusMutation.mutate({ id: classItem.id, status: newStatus });
    setOpenMenuId(null);
  };

  const handleDeleteClass = (classItem) => {
    if (confirm(`Delete "${classItem.name}"? This cannot be undone.`)) {
      deleteClassMutation.mutate(classItem.id);
      setOpenMenuId(null);
    }
  };

  const handleManageLinks = (classItem) => {
    setSelectedClassId(classItem.id);
    setShowLinksModal(true);
    setOpenMenuId(null);
  };

  const handleManageExemptions = (classItem) => {
    setSelectedClassId(classItem.id);
    setShowExemptionsModal(true);
    setOpenMenuId(null);
  };

  const handleViewClass = (classItem) => {
    navigate(`/app/classes/${classItem.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            My Classes <span className="ml-2">📚</span>
          </h1>
          <p className="text-gray-600 mt-1">
            {classes.length} {showArchived ? 'archived' : 'active'} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center"
          >
            <ArchiveBoxIcon className="w-5 h-5 mr-2" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Class
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {showArchived ? 'No archived classes' : 'No classes yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {showArchived 
                ? 'Archived classes will appear here' 
                : 'Create your first class to get started'}
            </p>
            {!showArchived && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
              >
                Create Your First Class
              </button>
            )}
          </div>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer relative ${
                cls.status === 'archived' ? 'opacity-75' : ''
              }`}
              onClick={() => handleViewClass(cls)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{cls.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {cls.subject && <span>{cls.subject}</span>}
                    {cls.section && <span>• Section {cls.section}</span>}
                  </div>
                  {cls.status === 'archived' && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      Archived
                    </span>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === cls.id ? null : cls.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <EllipsisVerticalIcon className="w-6 h-6" />
                  </button>

                  {openMenuId === cls.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(cls);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit Class
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageLinks(cls);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Session Links
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageExemptions(cls);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm"
                      >
                        <ShieldExclamationIcon className="w-4 h-4 mr-2" />
                        Exemptions
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveClass(cls);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm"
                      >
                        <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                        {cls.status === 'active' ? 'Archive' : 'Unarchive'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-red-600 border-t"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {cls.description || 'No description'}
              </p>

              {/* Schedule */}
              {cls.schedule && cls.schedule.days && cls.schedule.days.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {cls.schedule.days.map(day => (
                      <span
                        key={day}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {day.substring(0, 3)}
                      </span>
                    ))}
                  </div>
                  {cls.schedule.time && (
                    <p className="text-xs text-gray-600 mt-1">{cls.schedule.time}</p>
                  )}
                </div>
              )}

              {/* Student Count */}
              <div className="flex items-center text-sm text-gray-600 pt-3 border-t">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                {cls.student_count || 0} student{cls.student_count !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <ClassFormModal
        isOpen={showCreateModal || editingClass !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClass(null);
        }}
        onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
        initialData={editingClass}
        isLoading={createClassMutation.isPending || updateClassMutation.isPending}
      />

      <SessionLinksModal
        isOpen={showLinksModal}
        onClose={() => {
          setShowLinksModal(false);
          setSelectedClassId(null);
        }}
        classId={selectedClassId}
      />

      <ExemptionListModal
        isOpen={showExemptionsModal}
        onClose={() => {
          setShowExemptionsModal(false);
          setSelectedClassId(null);
        }}
        classId={selectedClassId}
      />
    </div>
  );
};

export default MyClasses;
