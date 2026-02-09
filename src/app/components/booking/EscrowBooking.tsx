import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export default function EscrowBooking({ product, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    product_id: product.id,
    booking_type: 'rental',
    start_date: '',
    end_date: '',
    delivery_address: '',
    delivery_method: 'pickup',
    payment_method: 'mtn_momo',
    phone_number: user?.phone || ''
  });
  const [bookingResult, setBookingResult] = useState(null);
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    loadAvailability();
  }, [product.id]);

  const loadAvailability = async () => {
    const response = await api.getProductAvailabilityCalendar(product.id);
    if (response.success) {
      setAvailability(response.data);
    }
  };

  const calculateTotal = () => {
    if (bookingData.booking_type === 'purchase') {
      return product.buy_price + (product.deposit || 0);
    }
    if (bookingData.start_date && bookingData.end_date) {
      const start = new Date(bookingData.start_date);
      const end = new Date(bookingData.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return (product.rent_price * days) + (product.deposit || 0);
    }
    return 0;
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const response = await api.createBookingWithEscrow(bookingData);
      if (response.success) {
        setBookingResult(response);
        setStep(2);
      } else {
        alert(response.message || 'Failed to create booking');
      }
    } catch (error) {
      alert('Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const transactionId = 'TXN-' + Date.now();
      const response = await api.confirmPaymentEscrow(bookingResult.payment_id, transactionId);
      if (response.success) {
        setStep(3);
      } else {
        alert(response.message || 'Failed to confirm payment');
      }
    } catch (error) {
      alert('Error confirming payment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    setLoading(true);
    try {
      const response = await api.confirmItemReceived(bookingResult.booking_id);
      if (response.success) {
        alert('Item receipt confirmed! Funds will be released to the seller.');
        onClose();
      } else {
        alert(response.message || 'Failed to confirm receipt');
      }
    } catch (error) {
      alert('Error confirming receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {step === 1 && 'Book Item'}
              {step === 2 && 'Payment Confirmation'}
              {step === 3 && 'Escrow Protection'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center mb-2`}>1</div>
              <p className="text-xs">Booking</p>
            </div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center mb-2`}>2</div>
              <p className="text-xs">Payment</p>
            </div>
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 mx-auto rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center mb-2`}>3</div>
              <p className="text-xs">Escrow</p>
            </div>
          </div>

          {/* Step 1: Booking Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Booking Type</label>
                <div className="flex gap-4">
                  {product.rent_price && (
                    <button
                      onClick={() => setBookingData(prev => ({ ...prev, booking_type: 'rental' }))}
                      className={`flex-1 p-4 border-2 rounded-lg ${bookingData.booking_type === 'rental' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <p className="font-semibold">Rent</p>
                      <p className="text-sm text-gray-600">RWF {product.rent_price}/day</p>
                    </button>
                  )}
                  {product.buy_price && (
                    <button
                      onClick={() => setBookingData(prev => ({ ...prev, booking_type: 'purchase' }))}
                      className={`flex-1 p-4 border-2 rounded-lg ${bookingData.booking_type === 'purchase' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
                    >
                      <p className="font-semibold">Buy</p>
                      <p className="text-sm text-gray-600">RWF {product.buy_price}</p>
                    </button>
                  )}
                </div>
              </div>

              {bookingData.booking_type === 'rental' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={bookingData.start_date}
                      onChange={(e) => setBookingData(prev => ({ ...prev, start_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={bookingData.end_date}
                      onChange={(e) => setBookingData(prev => ({ ...prev, end_date: e.target.value }))}
                      min={bookingData.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Method</label>
                <select
                  value={bookingData.delivery_method}
                  onChange={(e) => setBookingData(prev => ({ ...prev, delivery_method: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {bookingData.delivery_method === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Address</label>
                  <textarea
                    value={bookingData.delivery_address}
                    onChange={(e) => setBookingData(prev => ({ ...prev, delivery_address: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    rows="3"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={bookingData.payment_method}
                  onChange={(e) => setBookingData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="mtn_momo">MTN Mobile Money</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="bank_card">Bank Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={bookingData.phone_number}
                  onChange={(e) => setBookingData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  placeholder="+250788123456"
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔒 Escrow Protection</h3>
                <p className="text-sm text-gray-700">Your payment will be held securely until you confirm receiving the item in good condition.</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Item Price:</span>
                  <span className="font-semibold">RWF {calculateTotal() - (product.deposit || 0)}</span>
                </div>
                {product.deposit > 0 && (
                  <div className="flex justify-between mb-2 text-orange-600">
                    <span>Security Deposit:</span>
                    <span className="font-semibold">RWF {product.deposit}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>RWF {calculateTotal()}</span>
                </div>
              </div>

              <button
                onClick={handleCreateBooking}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          )}

          {/* Step 2: Payment Confirmation */}
          {step === 2 && bookingResult && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">📱 Complete Payment</p>
                <p className="text-sm">A payment request has been sent to {bookingData.phone_number}</p>
                <p className="text-sm mt-2">Reference: <span className="font-mono">{bookingResult.reference}</span></p>
                <p className="text-lg font-bold mt-2">Amount: RWF {bookingResult.total_amount}</p>
              </div>

              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">Check your phone and enter your PIN to complete the payment</p>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Confirming...' : 'I Have Paid'}
              </button>
            </div>
          )}

          {/* Step 3: Escrow Protection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-4xl mb-2">✓</div>
                <p className="font-semibold text-green-800">Payment Confirmed!</p>
                <p className="text-sm text-gray-700 mt-2">Your funds are now held in escrow</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">🔒 How Escrow Works:</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Your payment is held securely by the platform</li>
                  <li>The seller will deliver/ship the item to you</li>
                  <li>Once you receive and confirm the item is good, click "Confirm Receipt"</li>
                  <li>Funds will be released to the seller (minus platform commission)</li>
                  <li>Your security deposit will be returned after item return (for rentals)</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-4">Have you received the item in good condition?</p>
                <button
                  onClick={handleConfirmReceived}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Confirm Item Received'}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
