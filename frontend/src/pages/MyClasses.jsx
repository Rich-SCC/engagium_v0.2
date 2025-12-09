import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import { formatClassDisplay } from '@/utils/classFormatter';
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
import ClassFormModal from '@/components/ClassDetails/ClassFormModal';
import SessionLinksModal from '@/components/ClassDetails/SessionLinksModal';
import ExemptionListModal from '@/components/ClassDetails/ExemptionListModal';
import { formatMeetingLinkForDisplay } from '@/utils/urlUtils';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const classes = classesData?.data || [];

  const createClassMutation = useMutation({
    mutationFn: (classData) => classesAPI.create(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.refetchQueries({ queryKey: ['classes'] }); // Force immediate refetch
      setShowCreateModal(false);
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => classesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.refetchQueries({ queryKey: ['classes'] }); // Force immediate refetch
      setEditingClass(null);
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => classesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.refetchQueries({ queryKey: ['classes'] }); // Force immediate refetch
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => classesAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.refetchQueries({ queryKey: ['classes'] }); // Force immediate refetch
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
          <h1 className="text-3xl font-bold text-gray-900">
            My Classes
          </h1>
          <p className="text-gray-600 mt-2">
            {classes.length} {showArchived ? 'archived' : 'active'} class{classes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center font-medium"
          >
            <ArchiveBoxIcon className="w-5 h-5 mr-2" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent-500 text-white px-5 py-2.5 rounded-xl hover:bg-accent-600 transition flex items-center font-semibold shadow-md hover:shadow-lg"
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
          <div className="col-span-3 bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {showArchived ? 'No archived classes' : 'No classes yet'}
            </h3>
            <p className="text-gray-500 mb-8">
              {showArchived 
                ? 'Archived classes will appear here' 
                : 'Create your first class to get started'}
            </p>
            {!showArchived && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-accent-500 text-white px-8 py-3 rounded-xl hover:bg-accent-600 transition font-semibold shadow-md"
              >
                Create Your First Class
              </button>
            )}
          </div>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer relative border border-gray-100 ${
                cls.status === 'archived' ? 'opacity-75' : ''
              }`}
              onClick={() => handleViewClass(cls)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{formatClassDisplay(cls)}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {cls.description && <span className="text-gray-500">{cls.description.substring(0, 100)}{cls.description.length > 100 ? '...' : ''}</span>}
                  </div>
                  {cls.status === 'archived' && (
                    <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
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
                    className="text-gray-400 hover:text-accent-600 p-1 rounded-lg hover:bg-accent-50 transition"
                  >
                    <EllipsisVerticalIcon className="w-6 h-6" />
                  </button>

                  {openMenuId === cls.id && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(cls);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-accent-50 flex items-center text-sm font-medium rounded-t-xl"
                      >
                        <PencilIcon className="w-4 h-4 mr-3" />
                        Edit Class
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageLinks(cls);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-accent-50 flex items-center text-sm font-medium"
                      >
                        <LinkIcon className="w-4 h-4 mr-3" />
                        Session Links
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageExemptions(cls);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-accent-50 flex items-center text-sm font-medium"
                      >
                        <ShieldExclamationIcon className="w-4 h-4 mr-3" />
                        Exemptions
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveClass(cls);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-accent-50 flex items-center text-sm font-medium"
                      >
                        <ArchiveBoxIcon className="w-4 h-4 mr-3" />
                        {cls.status === 'active' ? 'Archive' : 'Unarchive'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center text-sm text-red-600 border-t font-medium rounded-b-xl"
                      >
                        <TrashIcon className="w-4 h-4 mr-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6 line-clamp-2">
                {cls.description || 'No description'}
              </p>

              {/* Schedules - with backward compatibility */}
              {cls.schedule && (
                <div className="mb-4 space-y-3">
                  {/* New format: schedule is an array */}
                  {Array.isArray(cls.schedule) && cls.schedule.length > 0 ? (
                    cls.schedule.map((schedule, idx) => (
                      <div key={idx} className="border-l-2 border-accent-500 pl-3">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {schedule.days && schedule.days.map(day => (
                            <span
                              key={day}
                              className="text-xs px-2 py-0.5 bg-accent-50 text-accent-700 rounded font-medium"
                            >
                              {day.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                        {(schedule.startTime || schedule.endTime) && (
                          <p className="text-xs text-gray-600 font-medium">
                            {schedule.startTime && new Date(`1970-01-01T${schedule.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            {schedule.startTime && schedule.endTime && ' - '}
                            {schedule.endTime && new Date(`1970-01-01T${schedule.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    /* Old format: schedule is an object - for backward compatibility */
                    cls.schedule.days?.length > 0 && (
                      <div className="border-l-2 border-accent-500 pl-3">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {cls.schedule.days.map(day => (
                            <span
                              key={day}
                              className="text-xs px-2 py-0.5 bg-accent-50 text-accent-700 rounded font-medium"
                            >
                              {day.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                        {cls.schedule.time && (
                          <p className="text-xs text-gray-600 font-medium">{cls.schedule.time}</p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Meeting Links */}
              {cls.links && cls.links.length > 0 && (
                <div className="mb-4 space-y-2">
                  {cls.links.map((link) => (
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
              )}

              {/* Student Count */}
              <div className="flex items-center text-sm text-accent-600 pt-4 border-t border-gray-100 font-medium">
                <UserGroupIcon className="w-5 h-5 mr-2" />
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
