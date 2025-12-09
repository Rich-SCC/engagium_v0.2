import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClassFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    section: '',
    description: '',
    schedule: [] // Array of schedule objects
  });

  useEffect(() => {
    if (initialData) {
      // Handle backward compatibility: convert old schedule format to new schedule array
      let schedule = [];
      if (initialData.schedule && Array.isArray(initialData.schedule)) {
        schedule = initialData.schedule;
      } else if (initialData.schedule && (initialData.schedule.days?.length > 0 || initialData.schedule.time)) {
        // Convert old single schedule object to new array format
        const oldSchedule = initialData.schedule;
        schedule = [{
          days: oldSchedule.days || [],
          startTime: '',
          endTime: '',
          // Try to parse old time format if it exists
          ...(oldSchedule.time && parseLegacyTime(oldSchedule.time))
        }];
      }

      setFormData({
        name: initialData.name || '',
        subject: initialData.subject || '',
        section: initialData.section || '',
        description: initialData.description || '',
        schedule: schedule
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        section: '',
        description: '',
        schedule: []
      });
    }
  }, [initialData, isOpen]);

  // Helper function to parse legacy time format like "10:00 AM - 11:30 AM"
  const parseLegacyTime = (timeString) => {
    try {
      const parts = timeString.split('-').map(t => t.trim());
      if (parts.length === 2) {
        const startTime = convertTo24Hour(parts[0]);
        const endTime = convertTo24Hour(parts[1]);
        return { startTime, endTime };
      }
    } catch (e) {
      console.error('Error parsing legacy time:', e);
    }
    return {};
  };

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier?.toUpperCase() === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          days: [],
          startTime: '',
          endTime: ''
        }
      ]
    }));
  };

  const removeSchedule = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const updateSchedule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((sched, i) => 
        i === index ? { ...sched, [field]: value } : sched
      )
    }));
  };

  const toggleDay = (scheduleIndex, day) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((sched, i) => {
        if (i === scheduleIndex) {
          const days = sched.days.includes(day)
            ? sched.days.filter(d => d !== day)
            : [...sched.days, day];
          return { ...sched, days };
        }
        return sched;
      })
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {initialData ? 'Edit Class' : 'Create New Class'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Section and Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., A, B, CS101"
              />
              <p className="text-xs text-gray-500 mt-1">Section identifier</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., Computer Science"
              />
              <p className="text-xs text-gray-500 mt-1">Subject area</p>
            </div>
          </div>

          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Data Structures and Algorithms"
            />
            <p className="text-xs text-gray-500 mt-1">Specific course title</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Brief description of the class..."
            />
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Class Schedules
              </label>
              <button
                type="button"
                onClick={addSchedule}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent-500 text-white text-sm rounded-lg hover:bg-accent-600 transition"
              >
                <PlusIcon className="w-4 h-4" />
                Add Schedule
              </button>
            </div>

            {formData.schedule.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 text-sm mb-2">No schedules added yet</p>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="text-accent-500 hover:text-accent-600 text-sm font-medium"
                >
                  Add your first schedule
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.schedule.map((schedule, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Schedule {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Days of Week */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2">Select days:</p>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(index, day)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                              schedule.days.includes(day)
                                ? 'bg-accent-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">End Time</label>
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassFormModal;
