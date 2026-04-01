# Operation Exodus - Build4Good 2026 Space Data Visualization Winner

## Project Overview:
A sci-fi storytelling app that uses real NASA climate and exoplanet data to answer: "Can we find a new home before Earth becomes uninhabitable?" Users progress through 3 acts.

### Core Tech Stack:
**Frontend**: Next.js 14 + React 18 + TypeScript <br>
**3D Rendering**: Three.js + React Three Fiber + Drei <br>
**State Management**: Zustand
**Styling**: Tailwind CSS + Framer Motion <br>
**Build: Webpack** (with ONNX Runtime alias handling)

### Data APIs:
**NASA Exoplanet Archive**:
Fetches top 300 exoplanets with radius < 2x Earth. Queries pl_name, pl_rade, pl_bmasse, pl_orbper, sy_dist, pl_eqt, ra, and dec attributes. Calculates Colonial Viability Index (CVI) using ESI component formula.

**NASA POWER**:
10-year historical climate data for US center (39.5°N, -98.35°W). Includes 5 parameters: T2M (temperature), PRECTOTCORR (precipitation), RH2M (humidity), WS2M (wind), ALLSKY_SFC_SW_DWN (solar radiation).

## Instructions

### Part 01 — EARTH IS DYING
You begin in a sterile, mission-critical control interface. Earth's climate is deteriorating in real time using NASA POWER data and linear regression projections. The dashboard presents cold, hard numbers — each stat card shows a projected future value based on 10 years of real climate data. The countdown timer tracks how long remains until the first critical threshold is breached. When it reaches zero, the system does not negotiate — it simply fails.

### Part 02 — FIND A NEW HOME
From this analytical starting point, you transition into exploration. Navigate to EXOPLANET SEARCH or click INITIATE EXODUS to enter a 3D star field populated with real exoplanet candidates from the NASA Exoplanet Archive. Select a planet to evaluate it against Earth's baseline using a radar chart of key attributes — temperature, radius, mass, orbital period, and distance. What begins as data analysis starts to feel like a search for hope.

### Part 03 — CONFIRM THE MISSION
Once you've selected a destination, click SELECT AS DESTINATION to proceed to LAUNCH SEQUENCE. The interface shifts into a cinematic view — an orbital trajectory arc that dynamically scales based on the distance to your chosen planet. Longer distances produce more extreme arcs, reflecting the risk of your decision. When you're ready, hit CONFIRM LAUNCH to initiate the sequence. At the end of the launch, your Colonial Viability Index (CVI) is revealed — your final score and the ultimate measure of whether humanity survives.
