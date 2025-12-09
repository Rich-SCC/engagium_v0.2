import React, { useState, useRef } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classesAPI } from '@/services/api';

const StudentImportModal = ({ isOpen, onClose, classId }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [csvContent, setCsvContent] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importResults, setImportResults] = useState(null);

  const importMutation = useMutation({
    mutationFn: (data) => classesAPI.importStudents(classId, data),
    onSuccess: (data) => {
      setImportResults(data);
      queryClient.invalidateQueries(['students', classId]);
      queryClient.refetchQueries(['students', classId]); // Force immediate refetch
      queryClient.invalidateQueries(['class', classId]); // Update class details
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        setCsvContent(content);
        parseCSV(content);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (content) => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      setParsedData([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    setParsedData(data);
  };

  const handleImport = () => {
    if (!csvContent) return;

    // Create FormData with CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('csvFile', blob, 'students.csv');

    importMutation.mutate(formData);
  };

  const handleReset = () => {
    setCsvContent('');
    setParsedData([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Import Students from CSV</h2>
            <p className="text-sm text-gray-600">
              Upload a CSV file with student information
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">
              📋 CSV Format Requirements
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• First row must be headers: <code className="bg-blue-100 px-1 rounded">first_name,last_name,email,student_id</code></li>
              <li>• <strong>first_name</strong> and <strong>last_name</strong> are required</li>
              <li>• email and student_id are optional but recommended</li>
              <li>• Example: <code className="bg-blue-100 px-1 rounded">John,Doe,john@email.com,12345</code></li>
            </ul>
          </div>

          {/* File Upload */}
          {!csvContent && !importResults && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
              <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition inline-block"
              >
                Choose CSV File
              </label>
              <p className="text-sm text-gray-500 mt-2">
                or drag and drop your file here
              </p>
            </div>
          )}

          {/* Preview */}
          {csvContent && !importResults && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Preview ({parsedData.length} students)
                </h3>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Choose Different File
                </button>
              </div>

              {parsedData.length === 0 ? (
                <div className="text-center py-8 text-red-500 border border-red-200 rounded-lg bg-red-50">
                  Invalid CSV format. Please check the requirements above.
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Full Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Student ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedData.map((student, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm">{student.full_name || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || '-'}</td>
                            <td className="px-4 py-2 text-sm">{student.student_id || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importMutation.isPending}
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      {importMutation.isPending ? 'Importing...' : `Import ${parsedData.length} Students`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {importResults && (
            <div>
              <h3 className="font-semibold mb-3">Import Results</h3>
              
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {importResults.summary?.total || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {importResults.summary?.successful || 0}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">
                    {importResults.summary?.failed || 0}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {/* Details */}
              {importResults.results && importResults.results.length > 0 && (
                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importResults.results.map((result, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2">
                            {result.success ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircleIcon className="w-5 h-5 text-red-500" />
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {result.data?.full_name || result.data?.name || `${result.data?.first_name || ''} ${result.data?.last_name || ''}`.trim()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {result.success ? 'Imported successfully' : result.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Import Another File
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentImportModal;
