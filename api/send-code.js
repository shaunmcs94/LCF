const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, res) {
  // ✅ CORS handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Parse the body (for debugging)
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Missing 'phone' in request body" });
  }

  try {
    const verification = await client.verify
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });

    res.status(200).json({ success: true, status: verification.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send verification code.' });
  }
}
