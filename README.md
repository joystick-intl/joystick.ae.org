# JoyStick International — Website

Pixel-art indie game studio website with full Vercel deployment, serverless API, and admin panel.

---

## Project Structure

```
joystick/
├── public/
│   ├── index.html      ← Main site (games, about, careers, newsletter)
│   ├── team.html       ← Team page with flip-card grid + department filter
│   └── admin.html      ← Admin panel (team CRUD, jobs CRUD, subscribers)
├── api/
│   ├── team.js                  ← GET/POST/PUT/DELETE team members
│   ├── jobs.js                  ← GET/POST/PUT/DELETE job postings
│   └── newsletter/
│       ├── subscribe.js         ← POST — public newsletter sign-up
│       └── list.js              ← GET  — admin subscriber list
├── vercel.json          ← Routing + build config
├── package.json
├── .env.example         ← Required environment variables
└── README.md
```

---

## Deploy to Vercel — Step by Step

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
gh repo create joystick-international --public --push
# or: git remote add origin https://github.com/YOU/joystick-international.git && git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework Preset: **Other**
4. Click **Deploy** (it will fail on first run — that's expected, KV not connected yet)

### 3. Add Vercel KV (Database)
1. In your Vercel project → **Storage** tab → **Create Database** → **KV**
2. Name it `joystick-kv`, click **Create & Continue**
3. Under **Connect to Project**, select your project → **Connect**
4. Vercel automatically adds `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` to your env vars

### 4. Add Admin Secret
1. Vercel project → **Settings** → **Environment Variables**
2. Add: `ADMIN_SECRET` = a strong random string (e.g. output of `openssl rand -hex 32`)
3. Set for: Production, Preview, Development

### 5. Redeploy
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```
Or click **Redeploy** in the Vercel dashboard.

---

## Local Development

```bash
npm install -g vercel
npm install

# Link to your Vercel project (pulls env vars)
vercel link
vercel env pull .env.local

# Run locally
vercel dev
```
Site runs at `http://localhost:3000`

---

## Pages

| URL       | Description                          |
|-----------|--------------------------------------|
| `/`       | Main site                            |
| `/team`   | Team page (public)                   |
| `/admin`  | Admin panel (protected by ADMIN_SECRET) |

---

## API Endpoints

### Public
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/newsletter/subscribe` | Subscribe email          |
| GET    | `/api/team`                 | Get all team members     |
| GET    | `/api/jobs`                 | Get active job postings  |

### Admin (requires `x-admin-key` header)
| Method | Endpoint                 | Description                     |
|--------|--------------------------|---------------------------------|
| POST   | `/api/team`              | Add team member                 |
| PUT    | `/api/team`              | Update team member              |
| DELETE | `/api/team`              | Delete team member              |
| GET    | `/api/jobs`              | Get ALL jobs (incl. inactive)   |
| POST   | `/api/jobs`              | Add job posting                 |
| PUT    | `/api/jobs`              | Update / toggle job status      |
| DELETE | `/api/jobs`              | Delete job posting              |
| GET    | `/api/newsletter/list`   | Get all subscribers             |

---

## Admin Panel Usage

1. Visit `yourdomain.com/admin`
2. Enter your `ADMIN_SECRET` value as the key
3. Manage team members, job postings, and view newsletter subscribers
4. Export subscribers as CSV at any time

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS + Tailwind CDN + Press Start 2P & VT323 fonts
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel KV (Redis) via `@vercel/kv`
- **Hosting**: Vercel (free tier works for this project)