import { saveshipmentData } from '../services/shipmentServices.js';
import { getmyShipmentData } from '../services/shipmentServices.js';
import { getmyShipmentsByIDData } from '../services/shipmentServices.js';
import { deleteShipmentById } from '../services/shipmentServices.js';
import CryptoJS from 'crypto-js';
import {getSecrets} from '../services/userService.js';
import logger from '../utils/logger.js';
import jwt from "jsonwebtoken";


const savenewShipments = async (req, res) => {
  let userIP = req.body.data.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || "::1";
    try {
      const countryData = req.body.data;
      const { username, emailLogger} = countryData;
      const secrets = await getSecrets();
      const decryptedEmail = CryptoJS.AES.decrypt(decodeURIComponent(emailLogger), secrets.SECRET_KEY).toString(CryptoJS.enc.Utf8);
      logger.info({
      action: 'create_shipment',
      ip: userIP,
      username: username,  
      email: decryptedEmail,        
      message: 'New shipment created successfully',
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    });
      const user = await saveshipmentData(countryData);
      res.status(200).json({ user });
    } catch (error) {
      logger.error({
      action: 'create_shipment',
      error: error.message,
      stack: error.stack,
      ip: userIP,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    });
      res.status(500).json({ error: 'Error in add shipment' });
    }
  };

const getmyShipmentsByID = async (req, res) => {
  let userIP = req.body.data.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || "::1";
  try {
    const { data } = req.body;
    const { username, email, ip } = data;   
    const secrets = await getSecrets();
    const decryptedEmail = CryptoJS.AES.decrypt(decodeURIComponent(email), secrets.SECRET_KEY).toString(CryptoJS.enc.Utf8);
    logger.info({
      action: 'view_shipments',
      userId: data.Person_ID,
      username: username, 
      email: decryptedEmail,        
      ip: userIP,
      message: 'Shipment list requested',
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    });

    const user = await getmyShipmentsByIDData(data);
    res.status(200).json({ user });
  } catch (error) {
    logger.error({
      action: 'view_shipments',
      error: error.message,
      stack: error.stack,
      ip: userIP,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    });
    res.status(500).json({ error: 'Error in retrieving shipment list' });
  }
};

const getmyShipments = async (req, res) => {
  // console.log('getmyShipments called');
  let userIP = req.body.data.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || "::1";
  try {
    const { data } = req.body;
    const { username, email } = data;  
    const secrets = await getSecrets();
    const decryptedEmail = CryptoJS.AES.decrypt(decodeURIComponent(email), secrets.SECRET_KEY).toString(CryptoJS.enc.Utf8);

    logger.info({
      action: 'list_shipments',
      shipmentId: data.Shipping_ID,
      username: username,   
      email: decryptedEmail,       
      ip: userIP,
      message: 'Shipment details requested',
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    });

    const user = await getmyShipmentData(data);
    res.status(200).json({ user });
  } catch (error) {
    logger.error({
      action: 'list_shipments',
      error: error.message,
      stack: error.stack,
      ip: userIP,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    });
    res.status(500).json({ error: 'Error in retrieving shipment details' });
  }
};

const removeShipment = async (req, res) => {
  try {
    const { ShippingID, TrackingNumber } = req.body;

    if (!ShippingID || !TrackingNumber) {
      return res.status(400).json({ error: 'ShippingID and TrackingNumber are required' });
    }

    const result = await deleteShipmentById(ShippingID, TrackingNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {savenewShipments, getmyShipments, getmyShipmentsByID, removeShipment};