// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// WhatsApp API Configuration (Using Twilio)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Alternative: TextLocal (for India SMS)
const TEXTLOCAL_API_KEY = process.env.TEXTLOCAL_API_KEY;
const TEXTLOCAL_SENDER = process.env.TEXTLOCAL_SENDER;

// WhatsApp Business API (Alternative using 360dialog)
const WHATSAPP_API_URL = 'https://waba.360dialog.io/v1/messages';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

// Send Message Endpoint
app.post('/api/send-message', async (req, res) => {
  try {
    const { message, phoneNumbers, messageType, scheduleTime } = req.body;
    
    if (!message || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data' 
      });
    }

    const results = [];
    const failedNumbers = [];

    // Send to each number
    for (const phone of phoneNumbers) {
      try {
        let result;
        
        if (messageType === 'whatsapp') {
          // Send via WhatsApp
          result = await sendWhatsAppMessage(phone, message);
        } else if (messageType === 'sms') {
          // Send via SMS
          result = await sendSMS(phone, message);
        } else {
          throw new Error('Invalid message type');
        }

        results.push({
          phone,
          success: true,
          messageId: result.messageId || result.sid
        });
        
      } catch (error) {
        console.error(`Failed to send to ${phone}:`, error);
        results.push({
          phone,
          success: false,
          error: error.message
        });
        failedNumbers.push(phone);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Messages sent successfully! ${successCount} delivered, ${failedCount} failed`,
      sentCount: successCount,
      failedCount: failedCount,
      results: results
    });

  } catch (error) {
    console.error('Error in send-message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Function to send WhatsApp message using Twilio
async function sendWhatsAppMessage(to, message) {
  const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  
  const result = await client.messages.create({
    body: message,
    from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`
  });

  return result;
}

// Function to send SMS using Twilio
async function sendSMS(to, message) {
  const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  
  const result = await client.messages.create({
    body: message,
    from: TWILIO_PHONE_NUMBER,
    to: to
  });

  return result;
}

// Alternative: Send SMS using TextLocal (India specific)
async function sendSMSviaTextLocal(to, message) {
  const params = new URLSearchParams({
    apikey: TEXTLOCAL_API_KEY,
    numbers: to,
    message: message,
    sender: TEXTLOCAL_SENDER
  });

  const response = await axios.post('https://api.textlocal.in/send/', params);
  return response.data;
}

// Alternative: WhatsApp Business API via 360dialog
async function sendWhatsAppVia360Dialog(to, message) {
  const response = await axios.post(
    WHATSAPP_API_URL,
    {
      to: to,
      type: "text",
      text: {
        body: message
      }
    },
    {
      headers: {
        'D360-API-KEY': WHATSAPP_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Check balance endpoint
app.get('/api/balance', async (req, res) => {
  try {
    // Check Twilio balance
    const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const balance = await client.balance.fetch();
    
    res.json({
      success: true,
      balance: balance.balance,
      currency: balance.currency
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Message history endpoint
app.get('/api/history', async (req, res) => {
  try {
    const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const messages = await client.messages.list({ limit: 50 });
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.sid,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        status: msg.status,
        dateSent: msg.dateSent,
        direction: msg.direction
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});