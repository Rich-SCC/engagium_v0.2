import React, { useState } from 'react';
import { XMarkIcon, TagIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';

const TagManagementModal = ({ isOpen, onClose, classId }) => {
  const queryClient = useQueryClient();
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');

  const { data: tagsData } = useQuery({
    queryKey: ['tags', classId],
    queryFn: () => classesAPI.getTags(classId),
    enabled: isOpen
  });

  const tags = tagsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => classesAPI.createTag(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags', classId]);
      queryClient.invalidateQueries(['students', classId]);
      setTagName('');
      setTagColor('#3B82F6');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ tagId, data }) => classesAPI.updateTag(classId, tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags', classId]);
      queryClient.invalidateQueries(['students', classId]);
      setEditingTag(null);
      setTagName('');
      setTagColor('#3B82F6');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId) => classesAPI.deleteTag(classId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags', classId]);
      queryClient.invalidateQueries(['students', classId]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    if (editingTag) {
      updateMutation.mutate({
        tagId: editingTag.id,
        data: { tag_name: tagName, tag_color: tagColor }
      });
    } else {
      createMutation.mutate({ tag_name: tagName, tag_color: tagColor });
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setTagName(tag.tag_name);
    setTagColor(tag.tag_color);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor('#3B82F6');
  };

  const handleDelete = (tagId) => {
    if (confirm('Are you sure? This will remove this tag from all students.')) {
      deleteMutation.mutate(tagId);
    }
  };

  if (!isOpen) return null;

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-6 h-6" />
            <h2 className="text-xl font-bold">Manage Tags</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g., Group A, Needs Support"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setTagColor(color.value)}
                      className={`w-10 h-10 rounded-lg transition ${
                        tagColor === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </button>
                {editingTag && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Tags List */}
          <div>
            <h3 className="font-semibold mb-3">Existing Tags ({tags.length})</h3>
            {tags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tags created yet. Create your first tag above.
              </div>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.tag_color }}
                      />
                      <span className="font-medium">{tag.tag_name}</span>
                      <span className="text-sm text-gray-500">
                        ({tag.student_count || 0} student{tag.student_count !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Edit tag"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete tag"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagementModal;
