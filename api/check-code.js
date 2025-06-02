const twilio = require('twilio');

module.exports = async (req, res) => {
  // --- CORS preflight handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // --- Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // --- Always set CORS header for POST
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { code, phone } = req.body;

  if (!code || !phone) {
    res.status(400).json({ error: 'Code and phone are required.' });
    return;
  }

  // Set these with your real Twilio credentials and service SID
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_SERVICE_SID;

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
    res.status(400).json({ success: false, error: err.message });
  }
};
