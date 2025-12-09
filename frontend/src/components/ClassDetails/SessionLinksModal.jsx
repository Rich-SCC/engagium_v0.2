import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';
import { formatMeetingLinkForDisplay, normalizeMeetingUrl } from '@/utils/urlUtils';

const LINK_TYPES = ['meet', 'zoom'];

const SessionLinksModal = ({ isOpen, onClose, classId }) => {
  const queryClient = useQueryClient();
  const [newLink, setNewLink] = useState({
    link_url: '',
    link_type: 'meet',
    label: '',
    zoom_meeting_id: '',
    zoom_passcode: ''
  });

  const { data: linksData, isLoading } = useQuery({
    queryKey: ['classLinks', classId],
    queryFn: () => classesAPI.getLinks(classId),
    enabled: isOpen && !!classId
  });

  const links = linksData?.data || [];

  const addLinkMutation = useMutation({
    mutationFn: (linkData) => classesAPI.addLink(classId, linkData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classLinks', classId]);
      queryClient.refetchQueries(['classLinks', classId]); // Force immediate refetch
      setNewLink({
        link_url: '',
        link_type: 'meet',
        label: '',
        zoom_meeting_id: '',
        zoom_passcode: ''
      });
    }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId) => classesAPI.deleteLink(classId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries(['classLinks', classId]);
      queryClient.refetchQueries(['classLinks', classId]); // Force immediate refetch
    }
  });

  const updateLinkMutation = useMutation({
    mutationFn: ({ linkId, linkData }) => classesAPI.updateLink(classId, linkId, linkData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classLinks', classId]);
      queryClient.refetchQueries(['classLinks', classId]); // Force immediate refetch
    }
  });

  const handleAddLink = (e) => {
    e.preventDefault();
    if (newLink.link_url) {
      // Normalize the URL by removing protocol before saving
      const normalizedUrl = normalizeMeetingUrl(newLink.link_url);
      addLinkMutation.mutate({
        ...newLink,
        link_url: normalizedUrl
      });
    }
  };

  const handleDelete = (linkId) => {
    if (confirm('Delete this link?')) {
      deleteLinkMutation.mutate(linkId);
    }
  };

  const handleSetPrimary = (linkId) => {
    const link = links.find(l => l.id === linkId);
    if (link) {
      updateLinkMutation.mutate({
        linkId,
        linkData: { ...link, is_primary: true }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Session Links</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Link Form */}
          <form onSubmit={handleAddLink} className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Add New Link</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLink.link_url}
                    onChange={(e) => setNewLink({ ...newLink, link_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    placeholder="meet.google.com/abc-defg-hij or zoom.us/j/123456789"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Protocol (https://) is optional
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newLink.link_type}
                    onChange={(e) => setNewLink({ ...newLink, link_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  >
                    {LINK_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="e.g., Main Class Link"
                />
              </div>

              {newLink.link_type === 'zoom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={newLink.zoom_meeting_id}
                      onChange={(e) => setNewLink({ ...newLink, zoom_meeting_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="123 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passcode
                    </label>
                    <input
                      type="text"
                      value={newLink.zoom_passcode}
                      onChange={(e) => setNewLink({ ...newLink, zoom_passcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="abc123"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={addLinkMutation.isPending}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {addLinkMutation.isPending ? 'Adding...' : 'Add Link'}
              </button>
            </div>
          </form>

          {/* Links List */}
          <div>
            <h3 className="font-semibold mb-3">Saved Links ({links.length})</h3>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                No links added yet
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => handleSetPrimary(link.id)}
                            className="text-yellow-500 hover:text-yellow-600"
                            title={link.is_primary ? 'Primary link' : 'Set as primary'}
                          >
                            {link.is_primary ? (
                              <StarIconSolid className="w-5 h-5" />
                            ) : (
                              <StarIcon className="w-5 h-5" />
                            )}
                          </button>
                          <span className="font-medium">
                            {link.label || 'Unnamed Link'}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {link.link_type}
                          </span>
                        </div>
                        <a
                          href={formatMeetingLinkForDisplay(link.link_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {link.link_url}
                        </a>
                        {link.link_type === 'zoom' && (link.zoom_meeting_id || link.zoom_passcode) && (
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {link.zoom_meeting_id && (
                              <div>Meeting ID: <span className="font-mono">{link.zoom_meeting_id}</span></div>
                            )}
                            {link.zoom_passcode && (
                              <div>Passcode: <span className="font-mono">{link.zoom_passcode}</span></div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deleteLinkMutation.isPending}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionLinksModal;
