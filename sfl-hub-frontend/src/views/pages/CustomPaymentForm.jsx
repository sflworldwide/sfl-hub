import React, { useState, useEffect } from 'react';
import '../styles/PaymentForm.css'; 
import { api } from '../../utils/api'

const CustomPaymentForm = () => {
  const [amount, setAmount] = useState('20.00');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cardCode: ''
  });
  const [billingInfo, setBillingInfo] = useState({
    firstName: 'Ellen',
    lastName: 'Johnson',
    address: '14 Main Street',
    city: 'Pecan Springs',
    state: 'TX',
    zip: '44628',
    country: 'US',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); 
  const [bankData, setBankData] = useState({
    accountNumber: '',
    routingNumber: '',
    nameOnAccount: '',
    accountType: 'checking'
  });

  // Check if Accept.js is loaded
  useEffect(() => {
    console.log("Accept.js loaded:", !!window.Accept);
    if (window.Accept) {
      console.log("Accept methods:", Object.keys(window.Accept));
    }
  }, []);

  // Setup the global callback for Accept.js
  useEffect(() => {
    // Define the global function that Accept.js will call
    window.paymentFormCallback = function(response) {
      console.log("Response received from Authorize.net:", response);
      
      if (response.messages.resultCode === 'Error') {
        let errorMessage = 'Unknown error';
        if (response.messages && response.messages.message) {
          errorMessage = response.messages.message.map(msg => msg.text).join(' ');
        }
        setError(errorMessage);
        setLoading(false);
      } else {
        // Successfully got the payment nonce, now send it to your server
        sendPaymentToServer(response.opaqueData);
      }
    };
    
    // Cleanup function
    return () => {
      delete window.paymentFormCallback;
    };
  }, []);

  const handleCardInputChange = (e) => {
    setCardData({
      ...cardData,
      [e.target.name]: e.target.value
    });
  };

  const handleBankInputChange = (e) => {
    setBankData({
      ...bankData,
      [e.target.name]: e.target.value
    });
  };

  const handleBillingInfoChange = (e) => {
    setBillingInfo({
      ...billingInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For credit card payments
      if (paymentMethod === 'card') {
        // Create the payment nonce with Accept.js
        const { cardNumber, expMonth, expYear, cardCode } = cardData;
        
        // Create card data object for Accept.js - using string for callback
        const secureData = {
          cardData: {
            cardNumber,
            month: expMonth,
            year: expYear,
            cardCode
          },
          authData: {
            clientKey: '4B4G24a62Mr4u7g6ALDeTtkb6FZt3SJr9Wa2tE6C8sVHdgkRmvE8M7u7f22BdL3t',
            apiLoginID: '973QF64veA88'
          }
        };

        console.log("Sending card data to Authorize.Net", secureData);
        
        // Instead of using dispatchData directly, set up a form and use createFingerprint
        // This is more compatible with different Accept.js versions
        
        // Explicitly log to confirm the callback exists
        console.log("Callback function is set:", typeof window.paymentFormCallback);
        
        // Use global function name as string (preferred method for Accept.js)
        window.Accept.dispatchData(secureData, 'paymentFormCallback');
      } 
      // For bank account payments
      else if (paymentMethod === 'bank') {
        const { accountNumber, routingNumber, nameOnAccount, accountType } = bankData;
        
        // Create bank data object for Accept.js
        const secureData = {
          bankData: {
            accountNumber,
            routingNumber,
            nameOnAccount,
            accountType
          },
          authData: {
            clientKey: '4B4G24a62Mr4u7g6ALDeTtkb6FZt3SJr9Wa2tE6C8sVHdgkRmvE8M7u7f22BdL3t',
            apiLoginID: '973QF64veA88'
          }
        };

        console.log("Sending bank data to Authorize.Net", secureData);
        
        // Use global function name as string (preferred method for Accept.js)
        window.Accept.dispatchData(secureData, 'paymentFormCallback');
      }
      
    } catch (err) {
      console.error("Error during payment processing:", err);
      setError('Payment processing failed: ' + err.message);
      setLoading(false);
    }
  };

  // Send the payment nonce to your server for processing
  const sendPaymentToServer = async (opaqueData) => {
    try {
      console.log("Sending payment data to server:", {
        amount, 
        dataDescriptor: opaqueData.dataDescriptor,
        dataValue: opaqueData.dataValue
      });

      const response = await fetch(`${api.BackendURL}/api/payment/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          dataDescriptor: opaqueData.dataDescriptor,
          dataValue: opaqueData.dataValue,
          billTo: billingInfo
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);
      
      if (data.success) {
        // Handle successful payment (redirect to success page, etc.)
        window.location.href = '/payment-success?transactionId=' + data.transactionId;
      } else {
        setError('Payment failed: ' + data.message);
      }
    } catch (err) {
      console.error("Server communication error:", err);
      setError('Server communication error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="custom-payment-container">
      <h2>Secure Payment</h2>
      
      <div className="payment-method-selector">
        <div className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`} 
             onClick={() => setPaymentMethod('card')}>
          <input 
            type="radio" 
            name="paymentMethod" 
            checked={paymentMethod === 'card'} 
            onChange={() => setPaymentMethod('card')} 
          />
          <label>Credit Card</label>
        </div>
        <div className={`method-option ${paymentMethod === 'bank' ? 'selected' : ''}`} 
             onClick={() => setPaymentMethod('bank')}>
          <input 
            type="radio" 
            name="paymentMethod" 
            checked={paymentMethod === 'bank'} 
            onChange={() => setPaymentMethod('bank')} 
          />
          <label>Bank Account (ACH)</label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-section">
          <h3>Payment Details</h3>
          <div className="amount-field">
            <label>Amount ($)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          {paymentMethod === 'card' ? (
            <div className="card-fields">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={cardData.cardNumber}
                  onChange={handleCardInputChange}
                  placeholder="Card Number"
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>Expiration Month</label>
                  <select 
                    name="expMonth"
                    value={cardData.expMonth}
                    onChange={handleCardInputChange}
                    disabled={loading}
                    className="form-input"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group half">
                  <label>Expiration Year</label>
                  <select
                    name="expYear"
                    value={cardData.expYear}
                    onChange={handleCardInputChange}
                    disabled={loading}
                    className="form-input"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>CVV Code</label>
                <input
                  type="text"
                  name="cardCode"
                  value={cardData.cardCode}
                  onChange={handleCardInputChange}
                  placeholder="Security Code"
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>
          ) : (
            <div className="bank-fields">
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  name="nameOnAccount"
                  value={bankData.nameOnAccount}
                  onChange={handleBankInputChange}
                  placeholder="Name on Account"
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Routing Number</label>
                <input
                  type="text"
                  name="routingNumber"
                  value={bankData.routingNumber}
                  onChange={handleBankInputChange}
                  placeholder="Routing Number"
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankData.accountNumber}
                  onChange={handleBankInputChange}
                  placeholder="Account Number"
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  name="accountType"
                  value={bankData.accountType}
                  onChange={handleBankInputChange}
                  disabled={loading}
                  className="form-input"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="businessChecking">Business Checking</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Billing Information</h3>
          <div className="form-row">
            <div className="form-group half">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={billingInfo.firstName}
                onChange={handleBillingInfoChange}
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group half">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={billingInfo.lastName}
                onChange={handleBillingInfoChange}
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="address"
              value={billingInfo.address}
              onChange={handleBillingInfoChange}
              disabled={loading}
              className="form-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group half">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={billingInfo.city}
                onChange={handleBillingInfoChange}
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group quarter">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={billingInfo.state}
                onChange={handleBillingInfoChange}
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group quarter">
              <label>ZIP</label>
              <input
                type="text"
                name="zip"
                value={billingInfo.zip}
                onChange={handleBillingInfoChange}
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="country"
              value={billingInfo.country}
              onChange={handleBillingInfoChange}
              disabled={loading}
              className="form-input"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <div className="button-container">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomPaymentForm;