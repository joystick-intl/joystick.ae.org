import { kv } from '@vercel/kv';

const SEED_JOBS = [
  { id: '1', title: 'Senior Pixel Artist', department: 'ART',   description: 'Master of sprites needed for upcoming RPG project. Design character sprites, tilesets, and full UI systems.', requirements: '5+ years pixel art experience\nProficiency in Aseprite\nPortfolio of shipped titles', type: 'Full-Time',  active: '1' },
  { id: '2', title: 'Unity Developer',     department: 'CODE',  description: 'Seeking a wizard with C# mastery and shader knowledge. Build core game systems, tooling, and pipelines.',     requirements: '3+ years Unity\nStrong C# skills\nShader/HLSL knowledge a plus',                  type: 'Full-Time',  active: '1' },
  { id: '3', title: 'Sound Designer',      department: 'AUDIO', description: 'Create crunchy 8-bit SFX and atmospheric tracks. Bring our pixel worlds to life with immersive audio.',       requirements: 'Experience with FMOD or Wwise\nChiptune/retro portfolio\nPassion for game audio',    type: 'Full-Time',  active: '1' },
];

async function ensureSeed() {
  const exists = await kv.exists('jobs:seeded');
  if (!exists) {
    for (const j of SEED_JOBS) {
      await kv.hset(`jobs:job:${j.id}`, j);
      await kv.sadd('jobs:ids', j.id);
    }
    await kv.set('jobs:seeded', '1');
    await kv.set('jobs:next_id', String(SEED_JOBS.length + 1));
  }
}

async function getAllJobs(activeOnly = false) {
  const ids = await kv.smembers('jobs:ids') || [];
  if (!ids.length) return [];
  const jobs = await Promise.all(ids.map(id => kv.hgetall(`jobs:job:${id}`)));
  const filtered = jobs.filter(Boolean);
  return (activeOnly ? filtered.filter(j => j.active === '1') : filtered)
    .sort((a, b) => Number(a.id) - Number(b.id));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await ensureSeed();

  // GET — public only sees active jobs
  if (req.method === 'GET') {
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_SECRET;
    const jobs = await getAllJobs(!isAdmin);
    return res.status(200).json({ jobs });
  }

  // Mutations — admin only
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // POST — create
  if (req.method === 'POST') {
    const { title, department, description, requirements, type } = req.body;
    if (!title || !department || !description) {
      return res.status(400).json({ error: 'title, department, description required.' });
    }
    const id = String(await kv.incr('jobs:next_id'));
    const job = { id, title, department, description, requirements: requirements || '', type: type || 'Full-Time', active: '1' };
    await kv.hset(`jobs:job:${id}`, job);
    await kv.sadd('jobs:ids', id);
    return res.status(201).json({ success: true, job });
  }

  // PUT — update / toggle active
  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'id required.' });
    const existing = await kv.hgetall(`jobs:job:${id}`);
    if (!existing) return res.status(404).json({ error: 'Job not found.' });
    const updated = { ...existing, ...fields };
    await kv.hset(`jobs:job:${id}`, updated);
    return res.status(200).json({ success: true, job: updated });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required.' });
    await kv.del(`jobs:job:${id}`);
    await kv.srem('jobs:ids', id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}