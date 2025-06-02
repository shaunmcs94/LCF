const twilio = require('twilio');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Parse body (Vercel Node 22+ may need manual JSON parsing)
  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(req.body);
    } catch (e) {
      body = {};
    }
  }

  // Debug the received body
  console.log('DEBUG: Received body', body);

  const { code, phone } = body;

  if (!code || !phone) {
    console.log('DEBUG: Missing code or phone', { code, phone });
    res.status(400).json({ error: 'Code and phone are required.' });
    return;
  }

  // Load Twilio credentials and service SID
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // <<<<--- FIXED HERE

  // Debug serviceSid value and length
  console.log('DEBUG: TWILIO_VERIFY_SERVICE_SID', process.env.TWILIO_VERIFY_SERVICE_SID);
  console.log('DEBUG: serviceSid value and length', serviceSid, (serviceSid || '').length);

  // Validate serviceSid format
  if (!serviceSid || !serviceSid.startsWith('VA') || serviceSid.length !== 34) {
    res.status(500).json({ error: 'TWILIO_VERIFY_SERVICE_SID is missing or invalid.' });
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code });

    if (check.status === 'approved') {
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false, error: 'Incorrect or expired code.' });
    }
  } catch (err) {
    console.log('DEBUG: Twilio error', err);
    res.status(400).json({ success: false, error: err.message });
  }
};
