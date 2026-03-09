import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const normalised = email.toLowerCase().trim();

  // Check duplicate
  const existing = await kv.sismember('newsletter:emails', normalised);
  if (existing) {
    return res.status(409).json({ error: 'Already subscribed!' });
  }

  await kv.sadd('newsletter:emails', normalised);
  await kv.lpush('newsletter:log', JSON.stringify({
    email: normalised,
    subscribedAt: new Date().toISOString()
  }));

  return res.status(200).json({ success: true, message: 'Subscribed! Level up complete.' });
}