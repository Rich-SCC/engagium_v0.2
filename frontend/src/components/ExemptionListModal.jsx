import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';

const ExemptionListModal = ({ isOpen, onClose, classId }) => {
  const queryClient = useQueryClient();
  const [newExemption, setNewExemption] = useState({
    account_identifier: '',
    reason: ''
  });

  const { data: exemptionsData, isLoading } = useQuery({
    queryKey: ['classExemptions', classId],
    queryFn: () => classesAPI.getExemptions(classId),
    enabled: isOpen && !!classId
  });

  const exemptions = exemptionsData?.data || [];

  const addExemptionMutation = useMutation({
    mutationFn: (exemptionData) => classesAPI.addExemption(classId, exemptionData),
    onSuccess: () => {
      queryClient.invalidateQueries(['classExemptions', classId]);
      setNewExemption({ account_identifier: '', reason: '' });
    }
  });

  const deleteExemptionMutation = useMutation({
    mutationFn: (exemptionId) => classesAPI.deleteExemption(classId, exemptionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['classExemptions', classId]);
    }
  });

  const handleAddExemption = (e) => {
    e.preventDefault();
    if (newExemption.account_identifier) {
      addExemptionMutation.mutate(newExemption);
    }
  };

  const handleDelete = (exemptionId) => {
    if (confirm('Remove this exemption?')) {
      deleteExemptionMutation.mutate(exemptionId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Exempted Accounts</h2>
            <p className="text-sm text-gray-600">
              Accounts in this list won't be tracked during sessions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Exemption Form */}
          <form onSubmit={handleAddExemption} className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Add Exemption</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newExemption.account_identifier}
                  onChange={(e) => setNewExemption({ ...newExemption, account_identifier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="Email or name to exempt"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This can be an email address or display name that appears in sessions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={newExemption.reason}
                  onChange={(e) => setNewExemption({ ...newExemption, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="e.g., TA, Observer, Alt account"
                />
              </div>

              <button
                type="submit"
                disabled={addExemptionMutation.isPending}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {addExemptionMutation.isPending ? 'Adding...' : 'Add Exemption'}
              </button>
            </div>
          </form>

          {/* Exemptions List */}
          <div>
            <h3 className="font-semibold mb-3">Exempted Accounts ({exemptions.length})</h3>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : exemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                <p className="mb-2">No exemptions added yet</p>
                <p className="text-xs">
                  Add accounts that shouldn't be tracked (TAs, observers, etc.)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {exemptions.map((exemption) => (
                  <div
                    key={exemption.id}
                    className="flex items-center justify-between border rounded-lg p-3 hover:shadow-md transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {exemption.account_identifier}
                      </div>
                      {exemption.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded">
                            {exemption.reason}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Added {new Date(exemption.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(exemption.id)}
                      disabled={deleteExemptionMutation.isPending}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 ml-4"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">
              💡 How exemptions work
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Accounts on this list won't appear in participation tracking</li>
              <li>• Useful for TAs, co-instructors, or observers in your sessions</li>
              <li>• Can also exempt student secondary accounts if needed</li>
              <li>• Matching is case-insensitive</li>
            </ul>
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

export default ExemptionListModal;
