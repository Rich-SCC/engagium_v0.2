import React, { useState } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';

const StudentNotesModal = ({ isOpen, onClose, classId, student }) => {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  const { data: notesData } = useQuery({
    queryKey: ['studentNotes', classId, student?.id],
    queryFn: () => classesAPI.getStudentNotes(classId, student.id),
    enabled: isOpen && !!student
  });

  const notes = notesData?.data || [];

  const createMutation = useMutation({
    mutationFn: (text) => classesAPI.createNote(classId, student.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentNotes', classId, student.id]);
      queryClient.invalidateQueries(['students', classId]);
      queryClient.refetchQueries(['studentNotes', classId, student.id]); // Force immediate refetch
      setNoteText('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, text }) => classesAPI.updateNote(classId, student.id, noteId, text),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentNotes', classId, student.id]);
      queryClient.refetchQueries(['studentNotes', classId, student.id]); // Force immediate refetch
      setEditingNote(null);
      setNoteText('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) => classesAPI.deleteNote(classId, student.id, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentNotes', classId, student.id]);
      queryClient.invalidateQueries(['students', classId]);
      queryClient.refetchQueries(['studentNotes', classId, student.id]); // Force immediate refetch
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    if (editingNote) {
      updateMutation.mutate({ noteId: editingNote.id, text: noteText });
    } else {
      createMutation.mutate(noteText);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setNoteText(note.note_text);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteText('');
  };

  const handleDelete = (noteId) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(noteId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold">Student Notes</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {student.full_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add/Edit Note Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editingNote ? 'Edit Note' : 'Add New Note'}
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 resize-none"
              required
            />
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {editingNote ? 'Update Note' : 'Add Note'}
              </button>
              {editingNote && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Notes List */}
          <div>
            <h3 className="font-semibold mb-3">Notes History ({notes.length})</h3>
            {notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                No notes yet. Add your first note above.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {note.creator_first_name} {note.creator_last_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(note)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition"
                          title="Edit note"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Delete note"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
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

export default StudentNotesModal;
