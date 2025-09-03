import React, { useEffect } from 'react';
import './payment-model.css';

export const PaymentModal = ({ isOpen, onClose, token }) => {
  // When the modal opens and token is available, submit the form
  useEffect(() => {
    if (isOpen && token) {
      // Create a form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://test.authorize.net/payment/payment';
      form.target = 'payment-iframe'; // Target the iframe
      form.style.display = 'none';

      // Create token input
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = token;

      // Append elements
      form.appendChild(tokenInput);
      document.body.appendChild(form);
      
      console.log('Submitting form with token:', token);
      form.submit();
      
      // Clean up the form
      return () => {
        document.body.removeChild(form);
      };
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-container">
        <div className="payment-modal-header">
          <h3>Secure Payment</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="payment-modal-body">
          <iframe 
            name="payment-iframe" // This name must match the target in the form
            width="100%"
            height="700px"
            frameBorder="0"
            scrolling="auto"
            title="Payment Form"
          />
        </div>
      </div>
    </div>
  );
};