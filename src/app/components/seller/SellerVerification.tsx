import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export default function SellerVerification() {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    document_type: 'national_id',
    document_number: '',
    document_image: '',
    selfie_image: '',
    business_name: '',
    business_address: '',
    gps_latitude: null,
    gps_longitude: null
  });

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    const response = await api.getUserVerificationStatus();
    if (response.success && response.data) {
      setVerification(response.data);
    }
  };

  const handleImageUpload = (field, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude
          }));
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.submitSellerVerification(formData);
      if (response.success) {
        alert('Verification submitted successfully! We will review your documents within 24-48 hours.');
        loadVerificationStatus();
      } else {
        alert(response.message || 'Failed to submit verification');
      }
    } catch (error) {
      alert('Error submitting verification');
    } finally {
      setLoading(false);
    }
  };

  if (verification) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Seller Verification Status</h2>
        <div className={`p-4 rounded-lg mb-4 ${
          verification.status === 'approved' ? 'bg-green-100 text-green-800' :
          verification.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          <p className="font-semibold">Status: {verification.status.toUpperCase()}</p>
          {verification.status === 'pending' && (
            <p className="mt-2">Your verification is under review. We'll notify you once it's processed.</p>
          )}
          {verification.status === 'rejected' && (
            <p className="mt-2">Reason: {verification.rejection_reason}</p>
          )}
          {verification.status === 'approved' && (
            <p className="mt-2">✓ You are verified! You can now list products on the marketplace.</p>
          )}
        </div>
        {verification.status === 'rejected' && (
          <button
            onClick={() => setVerification(null)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Submit New Verification
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Become a Verified Seller</h2>
      <p className="text-gray-600 mb-6">
        To protect our marketplace, we require all sellers to verify their identity before listing products.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Document Type</label>
          <select
            value={formData.document_type}
            onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="business_license">Business License</option>
            <option value="rdb_certificate">RDB Certificate</option>
            <option value="rra_certificate">RRA Certificate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Document Number</label>
          <input
            type="text"
            value={formData.document_number}
            onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter your document number"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Document Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload('document_image', e.target.files[0])}
            className="w-full p-3 border rounded-lg"
            required
          />
          {formData.document_image && (
            <img src={formData.document_image} alt="Document" className="mt-2 h-32 object-cover rounded" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Selfie with Document</label>
          <p className="text-sm text-gray-500 mb-2">Take a selfie holding your document</p>
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => handleImageUpload('selfie_image', e.target.files[0])}
            className="w-full p-3 border rounded-lg"
            required
          />
          {formData.selfie_image && (
            <img src={formData.selfie_image} alt="Selfie" className="mt-2 h-32 object-cover rounded" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Business Name (Optional)</label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            className="w-full p-3 border rounded-lg"
            placeholder="Your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Business Address (Optional)</label>
          <textarea
            value={formData.business_address}
            onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
            className="w-full p-3 border rounded-lg"
            rows="3"
            placeholder="Your business address"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            📍 Get Current Location
          </button>
          {formData.gps_latitude && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Location captured: {formData.gps_latitude.toFixed(6)}, {formData.gps_longitude.toFixed(6)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Verification'}
        </button>
      </form>
    </div>
  );
}
