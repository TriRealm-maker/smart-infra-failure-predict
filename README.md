# CrisisGuard AI

An AI-powered emergency response system that helps users prepare for, respond to, and recover from disasters.

## Features

### 1. Live Dashboard
- Real-time weather conditions
- Air Quality Index (AQI) monitoring
- Current location tracking

### 2. Emergency Services Map
- Interactive map showing nearby:
  - Hospitals & Clinics
  - Police Stations
  - Fire Stations
  - Pharmacies
  - Emergency Shelters
- Distance calculation and directions

### 3. Infrastructure Failure Prediction
- AI-powered risk assessment for **buildings, bridges, and towers**
- Analysis based on:
  - Geographic location
  - Current weather and AQI signals
  - Asset type context
- Specific structural threat alerts and maintenance recommendations
- Worker safety index and exposure advisory for field teams

### 4. Medical Emergency ID
- Personal medical profile
- Blood type, allergies, conditions
- Medication list
- Emergency contact information
- Document upload (prescriptions, insurance)
- Shareable QR code for rescuers

### 5. Disaster Guides
- Step-by-step instructions for:
  - Earthquake
  - Flood
  - Fire
  - Hurricane
  - Tornado
  - Tsunami

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Maps | OpenStreetMap + Leaflet |
| Weather | OpenWeatherMap API |
| AI | Ollama (Local) |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- OpenWeatherMap API key (free at openweathermap.org)
- Ollama installed locally (optional, for AI predictions)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd crisisguard-ai
```

2. Install dependencies:
```bash
npm run install:all
```

3. Configure environment variables:

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENWEATHERMAP_API_KEY=your_openweathermap_key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
CLIENT_URL=http://localhost:5173
```

4. Start the development servers:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Ollama Setup

For AI-powered disaster predictions:

1. Install Ollama: https://ollama.ai
2. Pull the model:
```bash
ollama pull llama3.2
```
3. Start Ollama:
```bash
ollama serve
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Weather & Location
- `GET /api/weather?lat=&lng=` - Get weather + AQI
- `GET /api/places?lat=&lng=` - Get nearby emergency services

### Prediction
- `GET /api/prediction?lat=&lng=&assetType=building|bridge|tower` - AI risk assessment + worker safety advisory
- `GET /api/guide?disaster=` - Get disaster guide

### Medical
- `GET /api/medical/profile` - Get medical profile
- `PUT /api/medical/profile` - Update profile
- `POST /api/medical/upload` - Upload document
- `POST /api/medical/share` - Generate share link

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables

### Backend (Render/Railway)
1. Connect to GitHub repository
2. Set environment variables
3. Deploy as Node.js service

### Database (MongoDB Atlas)
1. Create free cluster
2. Get connection string
3. Add to server environment

## Project Structure

```
crisisguard-ai/
├── client/               # React Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI
│   │   ├── pages/      # Page components
│   │   ├── context/    # Auth context
│   │   ├── services/   # API calls
│   │   └── types/      # TypeScript types
│   └── ...
├── server/              # Express Backend
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── models/     # MongoDB schemas
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Auth middleware
│   │   └── services/   # External APIs
│   └── ...
└── README.md
```

## License

MIT
