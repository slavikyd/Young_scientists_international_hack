import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from './Icons';
import { Participant } from '../types';

interface ParticipantUploadProps {
  participants: Participant[];
  onParticipantsUploaded: (data: Participant[]) => void;
}

export function ParticipantUpload({ participants, onParticipantsUploaded }: ParticipantUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateParticipant = (row: any): Participant | null => {
    const fullName = row['Full name'] || row['full_name'] || row['fullName'] || row['name'];
    const email = row['email'] || row['Email'];
    const role = (row['role'] || row['Role'])?.toLowerCase();
    const place = row['place'] || row['Place'] || '';

    if (!fullName || !email || !role) {
      return null;
    }

    const validRoles = ['participant', 'speaker', 'winner', 'prize-winner'];
    if (!validRoles.includes(role)) {
      return null;
    }

    return {
      fullName: fullName.trim(),
      email: email.trim(),
      role: role as Participant['role'],
      place: place ? String(place) as Participant['place'] : '',
    };
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('CSV file is empty or has no data rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        const validParticipants: Participant[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          const participant = validateParticipant(row);
          if (participant) {
            validParticipants.push(participant);
          }
        }

        if (validParticipants.length === 0) {
          setError('No valid participants found. Please check your CSV format.');
          return;
        }

        onParticipantsUploaded(validParticipants);
        setSuccess(true);
        setError(null);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(`CSV parsing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const parseXLSX = async (file: File) => {
    setError('XLSX format support: Please convert your file to CSV format for upload. Most spreadsheet applications (Excel, Google Sheets) have "Save as CSV" or "Export as CSV" options.');
  };

  const handleFile = (file: File) => {
    setError(null);
    setSuccess(false);

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      parseXLSX(file);
    } else {
      setError('Please upload a CSV or XLSX file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">Upload Participants</h2>
      
      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-teal-500 bg-teal-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-2">
          Drag and drop your file here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-teal-600 hover:text-teal-700 underline"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">Supported format: CSV (for XLSX, please export as CSV first)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800">Successfully uploaded {participants.length} participants!</p>
        </div>
      )}

      {/* Format Guide */}
      <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
        <h3 className="mb-2">Required CSV/XLSX Format:</h3>
        <div className="bg-white p-3 rounded border border-teal-100 overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1">Full name</th>
                <th className="text-left px-2 py-1">email</th>
                <th className="text-left px-2 py-1">role</th>
                <th className="text-left px-2 py-1">place</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1">John Doe</td>
                <td className="px-2 py-1">john@example.com</td>
                <td className="px-2 py-1">winner</td>
                <td className="px-2 py-1">1</td>
              </tr>
              <tr>
                <td className="px-2 py-1">Jane Smith</td>
                <td className="px-2 py-1">jane@example.com</td>
                <td className="px-2 py-1">speaker</td>
                <td className="px-2 py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Valid roles: participant, speaker, winner, prize-winner<br />
          Place field (optional): 1, 2, or 3
        </p>
      </div>

      {/* Participants Table */}
      {participants.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3">Uploaded Participants ({participants.length})</h3>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 border-b">Full Name</th>
                    <th className="text-left px-4 py-3 border-b">Email</th>
                    <th className="text-left px-4 py-3 border-b">Role</th>
                    <th className="text-left px-4 py-3 border-b">Place</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{participant.fullName}</td>
                      <td className="px-4 py-3">{participant.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          participant.role === 'winner' ? 'bg-yellow-100 text-yellow-800' :
                          participant.role === 'prize-winner' ? 'bg-orange-100 text-orange-800' :
                          participant.role === 'speaker' ? 'bg-purple-100 text-purple-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {participant.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {participant.place && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                            {participant.place}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
