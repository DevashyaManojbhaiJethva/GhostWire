# GhostWire Backend — P3

Backend & ML system for GhostWire automatic road accident detection and emergency dispatch.

---

## What This Does

Receives crash events from ESP32 nodes via MQTT, validates them, and automatically dispatches emergency services in under 4 seconds.

---

## Stack

- Node.js + Express.js
- Eclipse Mosquitto (MQTT broker) — Docker
- Redis — Docker
- OSRM (routing) — Docker
- MongoDB Atlas
- Socket.io
- Twilio (SMS + Voice)
- Custom KNN classifier (pure JS)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your values in `.env`:
- `MONGO_URI` — MongoDB Atlas connection string
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `OFFICER_PHONE_NUMBER` — phone number to receive SMS alerts
- `HMAC_SECRET` — must match the secret on P1's ESP32

### 3. Start Docker containers
```bash
cd docker
docker-compose up -d
cd ..
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm start
```

Server runs on `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/zones` | KNN risk zone GeoJSON |
| GET | `/api/depots` | All resource depots |
| GET | `/api/depots/nearest?lat=&lng=` | Nearest depot to a location |
| GET | `/api/route?depotLat=&depotLng=&crashLat=&crashLng=` | Route from depot to crash |
| GET | `/api/cv/scene/:node_id` | Latest CV scene data |
| POST | `/api/cv/scene/:node_id` | Push CV scene data (P2) |

---

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `incident` | Server → Client | New crash confirmed + dispatch summary |
| `zone_update` | Server → Client | KNN GeoJSON every 15 minutes |
| `cv_event` | Server → Client | CV scene data from P2 |
| `request_zones` | Client → Server | Request current zone data |

---

## MQTT

**Broker:** `mqtt://localhost:1883`  
**Topic:** `/ghostwire/events/{node_id}`  
**QoS:** 1

### Message format (from P1 ESP32):
```json
{
  "node_id": "node_42",
  "sensors": {
    "mic": true,
    "vibration": true,
    "ir": true
  },
  "lat": 23.0225,
  "lng": 72.5714,
  "timestamp": "2026-05-16T10:00:00Z",
  "hmac": "sha256_signature"
}
```

---

## Testing

Simulate a crash event:
```bash
node test-mqtt.js
```

This publishes a valid MQTT message with correct HMAC signature.

---

## For Teammates

**P1 (Hardware):** Publish to `/ghostwire/events/{node_id}` with the message format above. HMAC secret is in `.env`.

**P2 (CV):** POST scene data to `POST /api/cv/scene/:node_id`. Dashboard will receive it via `cv_event` Socket.io event.

**P4 (Blockchain):** `blockchain_tx` field is available on the Event model. Update it after confirmation.

**P5 (Dashboard):** Connect Socket.io to `http://localhost:3000`. Consume REST API endpoints above.

---

## Author

P3 — Neil (Backend & ML Engineer)
