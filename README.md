# Simple Robot Dashboard

A small web dashboard that shows the robot list and the latest 50 logs per robot. Online robots are indicated with a green dot.

## Endpoints used

- **Robot list:** `http://65.2.178.186:5174/macs`
- **Latest / last 50 logs:** `http://65.2.178.186:5174/view/{robotId}`  
  Example: `http://65.2.178.186:5174/view/2805A503DE4C`

The app runs a local server that proxies these requests to avoid CORS.

## Run

```bash
node server.js
```

Then open **http://localhost:3000**.

- **Robots** (left): list from `/macs`; green dot = robot considered online (recent successful log fetch).
- **Logs** (right): last 50 logs for the selected robot from `/view/{robotId}`.
- Data auto-refreshes every 10 seconds.

## Host on GitHub Pages

GitHub Pages serves **static files only** (no Node.js). The dashboard is a single HTML file, so you can host it there. The page will call the robot API directly from the browser.

### 1. Create a GitHub repo

- On GitHub: **New repository** → name it e.g. `SimpleRobotDashboard` → Create.
- Do **not** add a README (you already have one).

### 2. Push this project

```bash
cd /path/to/SimpleRobotDashboard
git init
git add index.html README.md
git commit -m "Robot dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/SimpleRobotDashboard.git
git push -u origin main
```

(You can add `server.js` and `package.json` too if you want the repo to run locally; GitHub Pages will only use the static files.)

### 3. Turn on GitHub Pages

- In the repo: **Settings** → **Pages** (left sidebar).
- Under **Build and deployment**:
  - **Source:** Deploy from a branch
  - **Branch:** `main` (or `master`) → **/ (root)** → Save.
- After a minute or two, the site will be at:
  - **https://YOUR_USERNAME.github.io/SimpleRobotDashboard/**

### 4. CORS

The dashboard runs in the browser on `https://...github.io/...` but fetches from `http://65.2.178.186:5174`. The browser will allow this only if the **robot API server** sends CORS headers, for example:

- `Access-Control-Allow-Origin: *`  
  or  
- `Access-Control-Allow-Origin: https://YOUR_USERNAME.github.io`

If the API does not send these headers, requests will be blocked and the dashboard will show errors. In that case you have two options:

- **Option A:** Enable CORS on the server at `65.2.178.186:5174` (add the header above).
- **Option B:** Keep using the Node proxy locally (`node server.js`) or host the proxy somewhere else (e.g. Railway, Render) and set `window.ROBOT_DASHBOARD_API` to that proxy URL.

## Optional: open HTML only

If you serve `index.html` from the same origin as the API (e.g. same host/port as `65.2.178.186:5174`), you can open the file and set `API_BASE = ''` so requests go to the same origin.
