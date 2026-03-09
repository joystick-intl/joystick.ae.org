import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Simple admin key guard
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const emails  = await kv.smembers('newsletter:emails') || [];
  const logRaw  = await kv.lrange('newsletter:log', 0, -1) || [];
  const log     = logRaw.map(e => (typeof e === 'string' ? JSON.parse(e) : e));

  return res.status(200).json({ count: emails.length, emails, log });
}