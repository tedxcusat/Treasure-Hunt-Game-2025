# 🕵️‍♂️ Murder Mystery AR: The Lost Signal

> **A Location-Based Alternate Reality Game for TEDxCUSAT 2025**

Turn the campus into a crime scene. Solve clues, track signals, and uncover the truth using Augmented Reality.

## 🌟 Features
-   **Immersive Navigation**: Custom "Detective's Torch" compass that rotates with you (Course-Up Mode).
-   **Real-World Routing**: Integrated walking paths to guide players between zones (Mock & Real modes).
-   **Augmented Reality**: Scan real-world markers to reveal hidden evidence.
-   **Tactical HUD**: specialized interface with Signal Strength, Sonar, and Mission timers.
-   **Offline capable**: Includes a robust Mock Mode for development and testing without GPS.

## 📍 Missions (Zones)
1.  **Administrative Office**: The seat of power.
2.  **University Library**: Where silence speaks volumes.
3.  **School of Mgmt. Studies**: The training ground.
4.  **Butterfly Park**: Nature's witness.
5.  **CITTIC**: Innovation's edge.
6.  **Amenity Centre**: The gathering point.

## 🛠 Tech Stack
-   **Framework**: Next.js 16 (Turbopack)
-   **Language**: TypeScript
-   **Mapping**: Leaflet / OpenStreetMap / OSRM
-   **AR**: A-Frame & AR.js
-   **Styling**: TailwindCSS

## 🚀 Getting Started

### Prerequisites
-   Node.js 18+
-   Mobile Device (for full AR/GPS experience)

### Installation
```bash
npm install
```

### Development (Mock Mode)
Run the development server. GPS location can be simulated in browser DevTools.
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📱 Mobile Testing
-   This app requires **HTTPS** for Camera and GPS access on mobile.
-   Use `ngrok` or similar to tunnel your `localhost:3000` to a public URL for testing on a real device.

---
*Built for TEDxCUSAT 2025*
