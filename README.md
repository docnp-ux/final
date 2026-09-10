# IoT Solar Tracker

Final project for **Coding Factory 9** (AUEB / ΚΕΔΙΒΙΜ). A dual-axis solar
panel tracker: an ESP32-S3 reads 4 LDR sensors and (in a later stage) two
INA219 power sensors, reports to a FastAPI backend, and admins can view
live/historical data and manually override the servo position from a React
dashboard. No hardware? A simulator reproduces the exact same traffic a real
device would send — see [No hardware? Run the simulator](#no-hardware-run-the-simulator).

## Contents

- [Getting started](#getting-started)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [No hardware? Run the simulator](#no-hardware-run-the-simulator)
- [Local development (without Docker)](#local-development-without-docker)
- [Authentication](#authentication)
- [API docs](#api-docs)
- [Testing](#testing)
- [Real hardware firmware](#real-hardware-firmware)
- [Quick reference: all commands](#quick-reference-all-commands)
- [Design decisions](#design-decisions)

## Getting started

Everything runs in Docker, so you don't need Python, Node or PostgreSQL on
your machine — and there are no `.env` files to fill in, since every
setting lives in `docker-compose.yml`.

### 1. Install Docker

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
and make sure it is running before you continue.

### 2. Clone the repository

```bash
git clone https://github.com/docnp-ux/final.git
cd final
```

### 3. Build and start the stack

```bash
docker compose up --build -d
```

The first build takes a few minutes — it pulls the Postgres image and
installs both the Python and Node dependencies. `-d` runs everything in
the background; leave it out if you'd rather watch the logs.

### 4. Confirm all three containers are up

```bash
docker ps
```

You should see `solar-tracker-postgres` (healthy), `solar-tracker-backend`
and `solar-tracker-frontend`.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

> Port 3000 is the more conventional choice for the frontend, but 3001 is
> used here because 3000 may already be taken on the host — see
> `docker-compose.yml`'s `frontend.ports` if you want to change it.

### 5. Populate the database and start a simulated device

```bash
docker exec -it solar-tracker-backend uv run --no-dev python scripts/demo.py --days 2
```

This creates the admin account, backfills two days of history so the
charts aren't empty, and then keeps posting live readings every 15
seconds — the same traffic a real ESP32-S3 sends. Leave it running and
press Ctrl+C when you're done. For history only, without the live part,
swap `demo.py` for `seed.py` in the command above.

### 6. Log in to the dashboard

Open http://localhost:3001 and sign in:

| Username | Password |
| --- | --- |
| `admin` | `adminpass123` |

### 7. Look around

Pick the device from the list, then use the sidebar to move between
Overview, Live, Sensors, Graphs and Manual Override. On Manual Override,
set a servo angle and watch the simulator pick the command up within a few
seconds.

### 8. Shut down

```bash
docker compose down      # stop, keep the database
docker compose down -v   # stop and wipe the database too
```

If Docker complains that port 5432 or 8000 is already allocated, something
else on the host is bound to it — a local PostgreSQL install is the usual
culprit. Stop that service, or change the host-side port in
`docker-compose.yml`.

## Architecture

Domain-driven design with a layered backend (**Repository → Service →
Router**), so routers stay thin and business logic doesn't leak into the
database layer:

- **Domain model**: `Device`, `SensorReading` (4 LDR quadrants + computed
  side-averages and tracking diffs + the servo angle at that moment),
  `PowerReading` (one table for both INA219 sensors, disambiguated by a
  `panel`/`load` source), `ServoPosition`, `ServoCommand` (manual override,
  `pending → acknowledged → done`), `EnergyAggregate` (hourly Wh rollups via
  trapezoidal integration), `User`.
- **Role-based visibility**, enforced in the service layer (not the
  frontend): regular users see simplified panel wattage/voltage and a
  generation chart; admins additionally see raw sensor data, both power
  sources, servo control, and generation-vs-consumption.
- **Two auth paths**: JWT/OAuth2 password flow for human users (via the
  React frontend), a static per-device API key header
  (`X-Device-API-Key`) for the ESP32 — a microcontroller can't practically
  do an OAuth2 login flow.

## Tech stack

| Layer | Stack |
| --- | --- |
| Backend | FastAPI, SQLModel, PostgreSQL, `uv` for dependency management |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, react-hook-form + zod, react-router v7 |
| Firmware | ESP32-S3, Arduino/C++ |
| Deployment | Docker Compose (postgres + backend + frontend) |

## Repository layout

```
backend/     FastAPI app, tests, demo simulator, seed script
frontend/    React + Vite dashboard
firmware/    Real ESP32-S3 Arduino sketch (LDR stage) + its own README
docker-compose.yml
```

## No hardware? Run the simulator

`simulate_esp32.py` behaves exactly like the real firmware: it samples
fake sensor/power readings locally and POSTs the averaged reading to the
backend every few minutes, using the same device API-key auth and
endpoints the real ESP32-S3 uses (see [Real hardware firmware](#real-hardware-firmware)),
including a plausible day/night light curve and reacting to servo override
commands.

```bash
cd backend
uv run simulate_esp32.py --api-key <device_api_key>
```

Both `seed.py` and `demo.py` print the device's API key as they run, and
registering a device from the dashboard shows it once too.

Useful flags: `--base-url` (default `http://localhost:8000`),
`--sample-interval` / `--report-interval` in seconds (defaults: sample
every 5s, report the average every 5 minutes — shorten `--report-interval`
for faster feedback while testing).

**One command for both:** `scripts/demo.py` runs `seed.py` and then hands
off straight into `simulate_esp32.py` for that same device — history is
populated *and* the Live page keeps updating, without juggling two
terminals or copying an API key by hand:

```bash
cd backend
uv run scripts/demo.py --days 2
```

(Or through Docker: `docker exec solar-tracker-backend uv run --no-dev python scripts/demo.py --days 2` —
note this keeps running until you stop the container or `docker exec -it`
into it and Ctrl+C, since it's the same process simulating live traffic.)

## Local development (without Docker)

### Backend

Requires Python 3.12+ and [`uv`](https://docs.astral.sh/uv/), plus a
running PostgreSQL (or point `DATABASE_URL` at SQLite for a quick local
run — see `backend/.env.example`).

```bash
cd backend
uv sync
cp .env.example .env   # edit DATABASE_URL etc. as needed
uv run uvicorn app.main:app --reload
```

### Frontend

Requires Node 20+.

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL, default http://localhost:8000
npm run dev
```

Opens at http://localhost:5173.

## Authentication

- Register any user via the frontend's sign-up page.
- **Username `admin` automatically grants admin privileges** — a
  deliberate demo shortcut, not a production auth pattern.
- Admins can register devices (get an API key) and issue manual servo
  override commands; regular users get a read-only, simplified dashboard.

## API docs

FastAPI generates these automatically from the code — no separate
documentation to maintain:

- Swagger UI (interactive, has an "Authorize" button for JWT):
  http://localhost:8000/docs
- ReDoc (read-only, cleaner for browsing): http://localhost:8000/redoc

A Postman collection is also included at `postman/solar-tracker.postman_collection.json`
for manual integration testing outside the browser.

## Testing

```bash
cd backend
uv run pytest
```

31 `TestClient`-based tests covering auth, device registration and
ownership, role-based measurement visibility, and servo command ownership
— using an in-memory SQLite database via a dependency override, no real
Postgres needed.

## Real hardware firmware

`firmware/` has the actual Arduino sketch flashed to a real ESP32-S3 for
this project (currently stage 1: LDR sensors only, reporting the same
averaged-reading shape the simulator sends). See
[`firmware/README.md`](firmware/README.md) for wiring, setup, and the
onboard status-LED meaning. INA219 power sensors and servo control are a
planned follow-up stage.

## Quick reference: all commands

Everything below assumes the containers are already up
(`docker compose up --build -d`); `solar-tracker-backend` is the fixed
container name from `docker-compose.yml`.

**Lifecycle**

```bash
docker compose up --build -d      # build + start everything
docker ps                         # check the 3 containers are healthy
docker compose down               # stop, keep the data
docker compose down -v            # stop and wipe the database too
```

**Seed history only (no live traffic)**

```bash
docker exec solar-tracker-backend uv run --no-dev python scripts/seed.py --days 2
```

**Seed + live simulation, one device**

```bash
docker exec -it solar-tracker-backend uv run --no-dev python scripts/demo.py --days 2
```

**Multiple simulated devices** — run once per device, each in its own
terminal, with a different `--device-name`:

```bash
docker exec -it solar-tracker-backend uv run --no-dev python scripts/demo.py --device-name sim-esp32-01 --days 2
docker exec -it solar-tracker-backend uv run --no-dev python scripts/demo.py --device-name sim-esp32-02 --days 1
docker exec -it solar-tracker-backend uv run --no-dev python scripts/demo.py --device-name sim-esp32-03 --days 1
```

**Running scripts locally instead of through Docker** (needs `uv sync` in
`backend/` first, and nothing else already bound to port 5432):

```bash
cd backend
uv run scripts/demo.py --device-name sim-esp32-02 --days 1
uv run simulate_esp32.py --api-key <device_api_key>
```

**Tests**

```bash
cd backend
uv run pytest
```

## Design decisions

A few choices worth knowing the reasoning behind:

- **No Alembic migrations.** The domain model was still evolving during
  development with no production data to protect; `SQLModel.metadata.create_all()`
  plus recreating the dev database on schema changes was simpler. Alembic
  would be the natural next step for a production version.
- **Servo control is polling-based, not WebSockets.** More robust for a
  live demo — nothing to break via dropped connections/reconnect logic,
  and it works identically for real hardware or the simulator. WebSockets
  remain a documented stretch goal.
- **Sensor/power readings are averaged on-device over a 5-minute window**,
  not posted raw every few seconds — raw posting would flood the backend
  with mostly-noise rows (>17,000/day per device) for little benefit.
