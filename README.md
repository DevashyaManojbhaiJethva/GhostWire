# 👻 GhostWire
### Automatic Road Accident Detection & Emergency Dispatch System

> *"India loses 1.78 lakh lives every year to road accidents. Most die not from the crash — but from the 18–25 minute wait for help. GhostWire eliminates that wait."*

---

## 🚨 The Problem

- **1.78 lakh deaths** per year on Indian roads
- Average emergency response time: **18–25 minutes**
- Witnesses flee due to fear of **IPC Section 304A** legal liability
- Existing CCTV infrastructure costs **₹50–80 lakh per km**

## ⚡ The Solution

GhostWire deploys **₹750 ESP32 nodes** on roadside poles. Each node has 3 sensors. The moment all 3 fire simultaneously — mic, vibration, IR — the system automatically:

- 📞 Calls **108 ambulance** with GPS coordinates
- 📱 SMS the nearest **police officer** with a Google Maps link
- 🗺️ Computes the **fastest route** from the nearest resource depot
- 📡 Updates the **live dashboard** in real time
- ⛓️ Records tamper-proof **blockchain evidence**
- 🧠 Predicts **future crash zones** using KNN ML

**All of this in under 4 seconds. No human witnesses needed.**

---

## 🏗️ System Architecture

```
ESP32 Node (P1)          Backend (P3)               Dashboard (P5)
┌─────────────┐          ┌─────────────────┐        ┌─────────────┐
│ Mic Sensor  │          │ MQTT Broker     |        │ Live Map    │
│ Vibration   │──MQTT──▶│ Event Validator  │──WS──▶│ Incident    │
│ IR Sensor   │          │ KNN Classifier   │       │ Alerts      │
└─────────────┘          │ OSRM Router      │       │ Zone Heat   │
                         │ Twilio Dispatch  │       │ Map         │
CV Module (P2)           └────────┬─────────┘       └─────────────┘
┌─────────────┐                   │
│ YOLOv8n     │                   ▼
│ MediaPipe   │──REST──▶  108 Ambulance + Police SMS
└─────────────┘
                         Blockchain (P4)
                         ┌─────────────┐
                         │ Polygon     │
                         │ Evidence    │
                         │ Record      │
                         └─────────────┘
```

---

## 🧩 System Layers

### Layer 1 — Core Detection (P1 + P3)
- ESP32 nodes with 3-sensor crash confirmation
- HMAC-signed MQTT events (tamper-proof)
- 30-second deduplication
- Automatic 108 dispatch + Twilio SMS/Voice
- Blockchain evidence via Polygon (P4)

### Layer 2 — Intelligence (P3 ML)
- **KNN Accident Zone Classifier** — K=7, Haversine distance
- 500m × 500m grid cells across Ahmedabad road network
- 3-tier risk scoring: 🟡 Yellow → 🟠 Orange → 🔴 Red
- Runs every 15 minutes, cached in Redis, streamed to dashboard

### Layer 3 — Computer Vision (P2)
- **YOLOv8n** pre-crash vehicle detection on Raspberry Pi 4
- **MediaPipe** driver consciousness scoring on Pi Zero 2W
- CV scene data streamed live to dashboard

---

## 💰 Cost Economics

| Solution | Cost per km |
|----------|------------|
| Traditional CCTV | ₹50–80 lakh |
| **GhostWire** | **₹15,000** |

**One GhostWire node: ₹750. Coverage: 4km for ₹15,000.**

---

## 🗂️ Repository Structure

```
GhostWire/
├── ghostwire-backend/          # P3 — Backend & ML
│   ├── config/                 # DB, Redis, MQTT config
│   ├── mqtt/                   # Mosquitto broker + subscriber
│   ├── workers/                # Dispatch + KNN workers
│   ├── ml/                     # KNN classifier (pure JS)
│   ├── models/                 # MongoDB schemas
│   ├── services/               # Twilio, OSRM, 108, depot
│   ├── routes/                 # REST API endpoints
│   ├── socket/                 # Socket.io server
│   ├── docker/                 # Docker compose (MQTT+Redis+OSRM)
│   └── scripts/                # DB seed scripts
├── accident_knn_system.py      # P4 — KNN ML prototype (Python)
├── accident_sensor_data.csv    # P4 — Sample accident dataset
├── medical_supply_houses.csv   # P4 — Medical supply locations
├── map.html                    # P4 — Google Maps visualization
└── map_data.json               # P4 — Generated map data
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Docker Desktop
- MongoDB Atlas account
- Twilio account

### 1. Clone the repo
```bash
git clone https://github.com/DevashyaManojbhaiJethva/GhostWire.git
cd GhostWire/ghostwire-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Fill in your values:
```env
MONGO_URI=your_mongodb_atlas_uri
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OFFICER_PHONE_NUMBER=+91xxxxxxxxxx
HMAC_SECRET=ghostwire_secret_key_2026
```

### 4. Start Docker containers
```bash
cd docker
docker-compose up -d
cd ..
```

### 5. Seed the database
```bash
npm run seed
```

### 6. Start the server
```bash
npm start
```

### 7. Test crash detection
```bash
node test-mqtt.js
```

✅ Watch the SMS arrive on your phone in under 4 seconds.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/zones` | KNN risk zone GeoJSON |
| GET | `/api/depots` | All resource depots |
| GET | `/api/depots/nearest?lat=&lng=` | Nearest depot |
| GET | `/api/route?depotLat=&depotLng=&crashLat=&crashLng=` | OSRM route |
| GET | `/api/cv/scene/:node_id` | CV scene data |
| POST | `/api/cv/scene/:node_id` | Push CV data (P2) |

## 📡 Socket.io Events

| Event | Description |
|-------|-------------|
| `incident` | Live crash alert with full dispatch summary |
| `zone_update` | KNN GeoJSON heatmap every 15 minutes |
| `cv_event` | Computer vision scene data from P2 |

---

## 🧠 P4 — KNN ML Prototype

The `accident_knn_system.py` classifies road accident risk zones using scikit-learn KNN, visualizes them on Google Maps, and determines optimal medical supply dispatch based on sensor data.

### Run the ML prototype
```bash
pip install pandas scikit-learn
python accident_knn_system.py
python -m http.server 8000
```
Open `http://localhost:8000/map.html` and replace `YOUR_GOOGLE_MAPS_API_KEY` with your real key.

### Files
| File | Description |
|------|-------------|
| `accident_knn_system.py` | KNN model, zone prediction, supply selection |
| `accident_sensor_data.csv` | Sample accident and sensor dataset |
| `medical_supply_houses.csv` | Supply house locations and inventory |
| `map.html` | Google Maps zone visualization |
| `map_data.json` | Generated by the Python script |

---

## 👥 Team

| Member | Role | Responsibilities |
|--------|------|-----------------|
| P1 | Hardware Engineer | ESP32 nodes, sensor firmware, MQTT publish |
| P2 | CV Engineer | YOLOv8n detection, MediaPipe consciousness scoring |
| P3 | Backend & ML Engineer | Node.js backend, MQTT broker, KNN, OSRM, Twilio, Socket.io |
| P4 | Blockchain & ML | Polygon evidence, KNN Python prototype, Google Maps viz |
| P5 | Frontend Engineer | React dashboard, live map, incident alerts |

---

## 🌍 Global Scalability

GhostWire is designed for zero-friction international deployment:

> **Japan adaptation: 1 config line change. Zero firmware changes.**

The node firmware, MQTT protocol, and blockchain layer are region-agnostic. Only the emergency dispatch webhook URL changes per country.

---

## 📄 License

MIT License — Built for hackathon 2026.

---

<div align="center">
  <strong>GhostWire — The machine witness that never flees.</strong>
</div>
