import { kv } from '@vercel/kv';

const SEED_MEMBERS = [
  { id: '1', name: 'Alex "PixelKing" Reyes', role: 'Art Director',      department: 'ART',    bio: 'Veteran sprite artist with 10 years in indie gaming. Dreams in 16×16.',                   avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alex',   twitter: '@pixelking',  year: '2018' },
  { id: '2', name: 'Jordan Mace',            role: 'Lead Developer',    department: 'CODE',   bio: 'C# wizard who once wrote a shader so efficient it made the GPU cry tears of joy.',        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Jordan', twitter: '@jmace_dev',  year: '2018' },
  { id: '3', name: 'Sam "Glitch" Torres',    role: 'Sound Designer',    department: 'AUDIO',  bio: 'Composes chiptune bangers by day, speedruns obscure 8-bit games by night.',               avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Sam',    twitter: '@glitch8bit', year: '2020' },
  { id: '4', name: 'Priya Nair',             role: 'Game Designer',     department: 'DESIGN', bio: 'Invented 3 game mechanics that got copied by AAA studios. She takes it as a compliment.', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Priya',  twitter: '@priya_gd',   year: '2021' },
  { id: '5', name: 'Chris "Null" Park',      role: 'Backend Engineer',  department: 'CODE',   bio: 'Keeps the servers alive with equal parts caffeine and dark magic.',                       avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Chris',  twitter: '@null_ptr',   year: '2022' },
  { id: '6', name: 'Morgan Lee',             role: 'Community Manager', department: 'OPS',    bio: 'Wrangles a Discord of 50k gamers like a seasoned dungeon master.',                        avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Morgan', twitter: '@morganlee',  year: '2023' },
];

async function ensureSeed() {
  const exists = await kv.exists('team:seeded');
  if (!exists) {
    for (const m of SEED_MEMBERS) {
      await kv.hset(`team:member:${m.id}`, m);
      await kv.sadd('team:ids', m.id);
    }
    await kv.set('team:seeded', '1');
    await kv.set('team:next_id', String(SEED_MEMBERS.length + 1));
  }
}

async function getAllMembers() {
  const ids = await kv.smembers('team:ids') || [];
  if (!ids.length) return [];
  const members = await Promise.all(
    ids.map(id => kv.hgetall(`team:member:${id}`))
  );
  return members.filter(Boolean).sort((a, b) => Number(a.id) - Number(b.id));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await ensureSeed();

  // GET — public
  if (req.method === 'GET') {
    const members = await getAllMembers();
    return res.status(200).json({ members });
  }

  // All mutations require admin key
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // POST — create
  if (req.method === 'POST') {
    const { name, role, department, bio, avatar, twitter, year } = req.body;
    if (!name || !role || !department) {
      return res.status(400).json({ error: 'name, role, department are required.' });
    }
    const id = String(await kv.incr('team:next_id'));
    const member = { id, name, role, department, bio: bio || '', avatar: avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`, twitter: twitter || '', year: year || new Date().getFullYear().toString() };
    await kv.hset(`team:member:${id}`, member);
    await kv.sadd('team:ids', id);
    return res.status(201).json({ success: true, member });
  }

  // PUT — update
  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });
    const existing = await kv.hgetall(`team:member:${id}`);
    if (!existing) return res.status(404).json({ error: 'Member not found.' });
    const updated = { ...existing, ...fields };
    await kv.hset(`team:member:${id}`, updated);
    return res.status(200).json({ success: true, member: updated });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });
    await kv.del(`team:member:${id}`);
    await kv.srem('team:ids', id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}