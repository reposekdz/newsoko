import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export default function AdminVerificationPanel() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.getPendingVerifications();
      if (response.success) {
        setVerifications(response.data);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId) => {
    if (!confirm('Are you sure you want to approve this seller verification?')) return;
    
    setLoading(true);
    try {
      const response = await api.approveVerification(verificationId);
      if (response.success) {
        alert('Verification approved successfully!');
        loadPendingVerifications();
        setSelectedVerification(null);
      } else {
        alert(response.message || 'Failed to approve verification');
      }
    } catch (error) {
      alert('Error approving verification');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (verificationId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const response = await api.rejectVerification(verificationId, rejectReason);
      if (response.success) {
        alert('Verification rejected');
        loadPendingVerifications();
        setSelectedVerification(null);
        setRejectReason('');
      } else {
        alert(response.message || 'Failed to reject verification');
      }
    } catch (error) {
      alert('Error rejecting verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Seller Verifications</h2>

      {loading && <p className="text-gray-600">Loading...</p>}

      {!loading && verifications.length === 0 && (
        <p className="text-gray-600">No pending verifications</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifications.map((verification) => (
          <div key={verification.id} className="bg-white border rounded-lg p-4 shadow hover:shadow-lg transition">
            <div className="flex items-center mb-3">
              <img
                src={verification.avatar || 'https://i.pravatar.cc/150'}
                alt={verification.name}
                className="w-12 h-12 rounded-full mr-3"
              />
              <div>
                <p className="font-semibold">{verification.name}</p>
                <p className="text-sm text-gray-600">{verification.email}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Document:</span> {verification.document_type.replace('_', ' ').toUpperCase()}</p>
              <p><span className="font-medium">Number:</span> {verification.document_number}</p>
              {verification.business_name && (
                <p><span className="font-medium">Business:</span> {verification.business_name}</p>
              )}
              <p className="text-xs text-gray-500">Submitted: {new Date(verification.created_at).toLocaleDateString()}</p>
            </div>

            <button
              onClick={() => setSelectedVerification(verification)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Review Details
            </button>
          </div>
        ))}
      </div>

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Verification Review</h3>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-2">Seller Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedVerification.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedVerification.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedVerification.phone}</p>
                    <p><span className="font-medium">Document Type:</span> {selectedVerification.document_type}</p>
                    <p><span className="font-medium">Document Number:</span> {selectedVerification.document_number}</p>
                    {selectedVerification.business_name && (
                      <>
                        <p><span className="font-medium">Business Name:</span> {selectedVerification.business_name}</p>
                        <p><span className="font-medium">Business Address:</span> {selectedVerification.business_address}</p>
                      </>
                    )}
                    {selectedVerification.gps_latitude && (
                      <p><span className="font-medium">GPS:</span> {selectedVerification.gps_latitude}, {selectedVerification.gps_longitude}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Document Photo</h4>
                  <img
                    src={selectedVerification.document_image}
                    alt="Document"
                    className="w-full rounded-lg border"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">Selfie with Document</h4>
                <img
                  src={selectedVerification.selfie_image}
                  alt="Selfie"
                  className="w-full max-w-md rounded-lg border"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Action</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      rows="3"
                      placeholder="Provide a reason if rejecting..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedVerification.id)}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      ✓ Approve Verification
                    </button>
                    <button
                      onClick={() => handleReject(selectedVerification.id)}
                      disabled={loading || !rejectReason.trim()}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                    >
                      ✗ Reject Verification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
