import React, { useState } from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';
import api from '../../../services/api';

const DisputeForm = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidence: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const disputeReasons = [
    'Item not as described',
    'Item damaged or defective',
    'Item not received',
    'Late delivery',
    'Seller unresponsive',
    'Quality issues',
    'Safety concerns',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/dispute_management.php', {
        action: 'file_dispute',
        booking_id: booking.id,
        ...formData
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">File a Dispute</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason *</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Select a reason</option>
                {disputeReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="5"
                required
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg">
                {loading ? 'Filing...' : 'File Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DisputeForm;
