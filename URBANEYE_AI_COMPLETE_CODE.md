# UrbanEye AI — Complete Source Code

Project: UrbanEye AI: Smart City Civic Issue Detection (Team DOOMSCROLLERS · ManthanKriti 2k26)

---

## `package.json`

```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "start": "NODE_ENV=production tsx server.ts",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^3.6.1",
    "@tailwindcss/vite": "^4.3.3",
    "@types/leaflet": "^1.9.23",
    "@vitejs/plugin-react": "^6.1.1",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2",
    "@types/express": "^4.17.21"
  }
}
```

---

## `metadata.json`

```json
{
  "name": "UrbanEye AI",
  "description": "Smart City Civic Issue Detection — AI-powered reporting, geo-tag duplicate merging, priority scoring, department routing, and live city heatmap.",
  "requestFramePermissions": ["geolocation"],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
```

---

## `.env.example`

```env
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "types": ["vite/client"],
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "exclude": ["dist"]
}
```

---

## `vite.config.ts`

```tsx
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

---

## `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UrbanEye AI — Smart City Civic Issue Detection</title>
    <meta
      name="description"
      content="Smart City Civic Issue Detection platform by Team DOOMSCROLLERS: AI classification, geo-tag duplicate merging, priority scoring, department routing, and live city heatmap."
    />
    <meta property="og:title" content="UrbanEye AI — Smart City Civic Issue Detection" />
    <meta
      property="og:description"
      content="AI-assisted civic grievance detection, duplicate merging, priority scoring, and municipal department routing with live OpenStreetMap heatmap."
    />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## `server.ts`

```tsx
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  CATEGORY_META,
  SENSITIVE_ZONES,
  type CivicIssue,
  type IssueCategory,
  type IssueSeverity,
  type IssueStatus,
  type PriorityBreakdown,
  type VisionAnalysisResult,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DUPLICATE_RADIUS_METERS = 180;
const SENSITIVE_ZONE_RADIUS_METERS = 650;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calculatePriority(
  severityScore: number,
  lat: number,
  lng: number,
  duplicateCount: number
): PriorityBreakdown {
  let bestBonus = 0;
  let nearbyZone: string | null = null;

  for (const zone of SENSITIVE_ZONES) {
    const dist = haversineMeters(lat, lng, zone.lat, zone.lng);
    if (dist <= SENSITIVE_ZONE_RADIUS_METERS && zone.bonusPoints > bestBonus) {
      bestBonus = zone.bonusPoints;
      nearbyZone = `${zone.name} (${dist}m away)`;
    }
  }

  const duplicateBonus = Math.min((duplicateCount - 1) * 5, 15);
  const baseWeighted = Math.round(severityScore * 0.7);
  const totalScore = Math.min(100, baseWeighted + bestBonus + duplicateBonus);

  return {
    severityScore,
    locationBonus: bestBonus,
    duplicateBonus,
    nearbyZone,
    totalScore,
  };
}

function createInitialIssues(): CivicIssue[] {
  const seeds: Array<{
    id: string;
    title: string;
    category: IssueCategory;
    description: string;
    lat: number;
    lng: number;
    ward: string;
    addressLabel: string;
    severity: IssueSeverity;
    severityScore: number;
    confidence: number;
    status: IssueStatus;
    duplicateCount: number;
    hoursAgo: number;
  }> = [
    {
      id: 'UE-2026-101',
      title: 'Deep carriageway pothole near Sharda Hospital gate',
      category: 'pothole',
      description:
        'Asphalt failure spanning 1.4m across the ambulance approach lane, causing sudden braking.',
      lat: 28.4731,
      lng: 77.4828,
      ward: 'Knowledge Park III',
      addressLabel: 'Hospital Approach Rd, Knowledge Park III',
      severity: 'Critical',
      severityScore: 88,
      confidence: 94,
      status: 'Dispatched',
      duplicateCount: 3,
      hoursAgo: 5,
    },
    {
      id: 'UE-2026-102',
      title: 'Uncollected municipal waste overflow beside college bus bay',
      category: 'garbage',
      description:
        'Overflowing roadside waste bin obstructing pedestrian footpath outside campus entrance.',
      lat: 28.4748,
      lng: 77.4856,
      ward: 'Knowledge Park III',
      addressLabel: 'Plot 28, Knowledge Park III, Greater Noida',
      severity: 'High',
      severityScore: 74,
      confidence: 91,
      status: 'Verified',
      duplicateCount: 2,
      hoursAgo: 9,
    },
    {
      id: 'UE-2026-103',
      title: 'Mainline drinking water pipe leakage flooding service road',
      category: 'water_leakage',
      description:
        'Pressurized joint leak along the underground supply line pooling water across two lanes.',
      lat: 28.4682,
      lng: 77.5095,
      ward: 'Pari Chowk',
      addressLabel: 'Pari Chowk Service Lane, Greater Noida',
      severity: 'Critical',
      severityScore: 84,
      confidence: 89,
      status: 'Dispatched',
      duplicateCount: 2,
      hoursAgo: 12,
    },
    {
      id: 'UE-2026-104',
      title: 'Three consecutive LED streetlights non-functional on expressway ramp',
      category: 'streetlight',
      description:
        'Dark stretch of 120m at merge ramp creating low-visibility hazard for evening commuters.',
      lat: 28.4691,
      lng: 77.4942,
      ward: 'Knowledge Park II',
      addressLabel: 'Expressway Slip Road, Sector KP-II',
      severity: 'High',
      severityScore: 72,
      confidence: 87,
      status: 'Reported',
      duplicateCount: 1,
      hoursAgo: 18,
    },
    {
      id: 'UE-2026-105',
      title: 'Clustered surface potholes at Sector Alpha I roundabout',
      category: 'pothole',
      description:
        'Multiple shallow potholes formed after waterlogging along inner turning radius.',
      lat: 28.4789,
      lng: 77.5055,
      ward: 'Alpha I',
      addressLabel: 'Alpha Commercial Belt, Greater Noida',
      severity: 'Medium',
      severityScore: 58,
      confidence: 90,
      status: 'Verified',
      duplicateCount: 1,
      hoursAgo: 26,
    },
    {
      id: 'UE-2026-106',
      title: 'Streetlight pole wiring fault near Beta II park corner',
      category: 'streetlight',
      description:
        'Single pole flickering intermittently; junction box cover repaired after dispatch.',
      lat: 28.4812,
      lng: 77.5131,
      ward: 'Beta II',
      addressLabel: 'Block F, Sector Beta II, Greater Noida',
      severity: 'Low',
      severityScore: 36,
      confidence: 85,
      status: 'Resolved',
      duplicateCount: 1,
      hoursAgo: 42,
    },
  ];

  const now = Date.now();
  return seeds.map((s) => {
    const created = new Date(now - s.hoursAgo * 3600 * 1000).toISOString();
    const breakdown = calculatePriority(s.severityScore, s.lat, s.lng, s.duplicateCount);
    const meta = CATEGORY_META[s.category];
    return {
      id: s.id,
      title: s.title,
      category: s.category,
      department: meta.department,
      description: s.description,
      lat: s.lat,
      lng: s.lng,
      ward: s.ward,
      addressLabel: s.addressLabel,
      severity: s.severity,
      severityScore: s.severityScore,
      priorityScore: breakdown.totalScore,
      priorityBreakdown: breakdown,
      confidence: s.confidence,
      imageQuality: 'clear',
      privacyBlurred: true,
      status: s.status,
      duplicateCount: s.duplicateCount,
      mergeHistory:
        s.duplicateCount > 1
          ? [
              {
                timestamp: created,
                note: `Merged ${s.duplicateCount - 1} geo-tagged duplicate report(s) within ${DUPLICATE_RADIUS_METERS}m`,
                distanceMeters: 42,
              },
            ]
          : [],
      createdAt: created,
      updatedAt: created,
    };
  });
}

let issuesStore: CivicIssue[] = createInitialIssues();
let nextTicketSeq = 107;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, count: issuesStore.length });
  });

  // Fetch all civic issues sorted by priorityScore desc
  app.get('/api/issues', (_req, res) => {
    const sorted = [...issuesStore].sort((a, b) => b.priorityScore - a.priorityScore);
    res.json({ issues: sorted });
  });

  // Stage 2: Gemini Vision detection + quality & privacy check
  app.post('/api/analyze-issue', async (req, res) => {
    const { imageBase64, mimeType, description } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      description?: string;
    };

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        error: 'Please upload a civic issue photo (imageBase64 and mimeType are required).',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.',
      });
    }

    try {
      const prompt = `You are UrbanEye AI, a municipal civic issue vision classifier for smart cities.
Analyze the uploaded photo${description ? ` and citizen note ("${description.slice(0, 300)}")` : ''}.

Classify the issue strictly into one of:
- "pothole" (road damage, cracks, broken asphalt, craters)
- "garbage" (uncollected trash, overflowing bins, illegal dumping)
- "streetlight" (broken/unlit/damaged street light pole or lamp)
- "water_leakage" (burst pipe, waterlogging from pipe leak, overflowing drain/hydrant)
- "other" (not a municipal civic infrastructure issue, e.g. selfie, indoor photo, blank wall, screenshot)

Also evaluate:
- isValidCivicIssue: true only if it shows one of the 4 civic issues above
- imageQuality: "clear", "blurry", or "unusable"
- confidence: integer 0-100 representing classification confidence
- severity: "Low", "Medium", "High", or "Critical"
- severityScore: integer 1-100 based on physical hazard, obstruction, or damage extent
- facesDetected: boolean (true if identifiable human faces appear)
- platesDetected: boolean (true if readable vehicle license plates appear)
- title: concise 6-10 word civic ticket title
- summary: concise 1-2 sentence technical visual observation
- recommendedAction: concrete municipal dispatch instruction`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidCivicIssue: { type: Type.BOOLEAN },
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              imageQuality: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
              severity: { type: Type.STRING },
              severityScore: { type: Type.INTEGER },
              facesDetected: { type: Type.BOOLEAN },
              platesDetected: { type: Type.BOOLEAN },
              recommendedAction: { type: Type.STRING },
            },
            required: [
              'isValidCivicIssue',
              'category',
              'title',
              'summary',
              'imageQuality',
              'confidence',
              'severity',
              'severityScore',
              'facesDetected',
              'platesDetected',
              'recommendedAction',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as VisionAnalysisResult;

      // Normalize fields safely
      const allowedCategories = ['pothole', 'garbage', 'streetlight', 'water_leakage', 'other'];
      const normalizedCategory = allowedCategories.includes(parsed.category)
        ? parsed.category
        : 'other';

      const result: VisionAnalysisResult = {
        ...parsed,
        category: normalizedCategory as VisionAnalysisResult['category'],
        confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 0))),
        severityScore: Math.max(1, Math.min(100, Math.round(parsed.severityScore ?? 50))),
      };

      return res.json({ analysis: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Vision analysis failed';
      console.error('Gemini Vision API error:', message);
      return res.status(502).json({
        error: `Gemini Vision service error: ${message}`,
      });
    }
  });

  // Stages 3, 4, 5: Duplicate check (geo-tag + category), priority scoring, department routing
  app.post('/api/issues', (req, res) => {
    const body = req.body as {
      title?: string;
      category?: IssueCategory;
      description?: string;
      lat?: number;
      lng?: number;
      ward?: string;
      addressLabel?: string;
      severity?: IssueSeverity;
      severityScore?: number;
      confidence?: number;
      imageQuality?: 'clear' | 'blurry' | 'unusable';
      privacyBlurred?: boolean;
      imageDataUrl?: string;
    };

    if (
      !body.category ||
      !CATEGORY_META[body.category] ||
      typeof body.lat !== 'number' ||
      typeof body.lng !== 'number'
    ) {
      return res.status(400).json({
        error: 'Valid category and GPS coordinates (lat, lng) are required.',
      });
    }

    const nowIso = new Date().toISOString();
    const incomingSeverityScore = Math.max(
      1,
      Math.min(100, Math.round(body.severityScore ?? 60))
    );

    // Stage 3: Geo-tag + category duplicate check against non-resolved issues
    let duplicateMatch: { issue: CivicIssue; distance: number } | null = null;
    for (const existing of issuesStore) {
      if (existing.status === 'Resolved') continue;
      if (existing.category !== body.category) continue;
      const dist = haversineMeters(body.lat, body.lng, existing.lat, existing.lng);
      if (dist <= DUPLICATE_RADIUS_METERS) {
        if (!duplicateMatch || dist < duplicateMatch.distance) {
          duplicateMatch = { issue: existing, distance: dist };
        }
      }
    }

    if (duplicateMatch) {
      const target = duplicateMatch.issue;
      target.duplicateCount += 1;
      target.severityScore = Math.max(target.severityScore, incomingSeverityScore);
      target.priorityBreakdown = calculatePriority(
        target.severityScore,
        target.lat,
        target.lng,
        target.duplicateCount
      );
      target.priorityScore = target.priorityBreakdown.totalScore;
      target.updatedAt = nowIso;
      target.mergeHistory.unshift({
        timestamp: nowIso,
        note: `Duplicate citizen report merged (${duplicateMatch.distance}m from original pin). Priority boosted to ${target.priorityScore}.`,
        distanceMeters: duplicateMatch.distance,
      });
      if (body.imageDataUrl && !target.imageDataUrl) {
        target.imageDataUrl = body.imageDataUrl;
      }

      return res.status(200).json({
        merged: true,
        matchedDistanceMeters: duplicateMatch.distance,
        issue: target,
      });
    }

    // Create new ticket & auto-route to concerned department
    const meta = CATEGORY_META[body.category];
    const priorityBreakdown = calculatePriority(incomingSeverityScore, body.lat, body.lng, 1);

    const newIssue: CivicIssue = {
      id: `UE-2026-${nextTicketSeq++}`,
      title: (body.title ?? `${meta.label} reported`).trim(),
      category: body.category,
      department: meta.department,
      description: (body.description ?? 'Submitted via UrbanEye AI citizen portal.').trim(),
      lat: body.lat,
      lng: body.lng,
      ward: (body.ward ?? 'Knowledge Park III').trim(),
      addressLabel:
        (body.addressLabel ?? `${body.lat.toFixed(4)}°N, ${body.lng.toFixed(4)}°E`).trim(),
      severity: body.severity ?? 'Medium',
      severityScore: incomingSeverityScore,
      priorityScore: priorityBreakdown.totalScore,
      priorityBreakdown,
      confidence: Math.max(0, Math.min(100, Math.round(body.confidence ?? 85))),
      imageQuality: body.imageQuality ?? 'clear',
      privacyBlurred: Boolean(body.privacyBlurred),
      status: 'Reported',
      duplicateCount: 1,
      mergeHistory: [],
      imageDataUrl: body.imageDataUrl,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    issuesStore.unshift(newIssue);

    return res.status(201).json({
      merged: false,
      issue: newIssue,
    });
  });

  // Update ticket workflow status
  app.patch('/api/issues/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status?: IssueStatus };
    const allowed: IssueStatus[] = ['Reported', 'Verified', 'Dispatched', 'Resolved'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const issue = issuesStore.find((item) => item.id === id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue ticket not found.' });
    }

    issue.status = status;
    issue.updatedAt = new Date().toISOString();
    return res.json({ issue });
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UrbanEye AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
```

---

## `src/index.css`

```css
@import "tailwindcss";

@theme {
  --font-display: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
  --font-sans: "DM Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  body {
    font-family: var(--font-sans);
    color: #0f172a;
    background-color: #f8fafc;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
    text-wrap: balance;
  }
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Ensure Leaflet map tiles and controls layer cleanly beneath modals */
.leaflet-container {
  font-family: var(--font-sans);
  z-index: 1;
}

.leaflet-popup-content-wrapper {
  border-radius: 0.5rem;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
  border: 1px solid #e2e8f0;
}

.leaflet-popup-content {
  margin: 12px 14px;
}
```

---

## `src/main.tsx`

```tsx
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
```

---

## `src/types.ts`

```tsx
export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water_leakage';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Reported' | 'Verified' | 'Dispatched' | 'Resolved';

export type ImageQuality = 'clear' | 'blurry' | 'unusable';

export interface SensitiveZone {
  id: string;
  name: string;
  type: 'School / College' | 'Hospital' | 'Highway / Arterial';
  lat: number;
  lng: number;
  bonusPoints: number;
}

export interface PriorityBreakdown {
  severityScore: number;
  locationBonus: number;
  duplicateBonus: number;
  nearbyZone: string | null;
  totalScore: number;
}

export interface MergeLogEntry {
  timestamp: string;
  note: string;
  distanceMeters: number;
}

export interface CivicIssue {
  id: string;
  title: string;
  category: IssueCategory;
  department: string;
  description: string;
  lat: number;
  lng: number;
  ward: string;
  addressLabel: string;
  severity: IssueSeverity;
  severityScore: number;
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  confidence: number;
  imageQuality: ImageQuality;
  privacyBlurred: boolean;
  status: IssueStatus;
  duplicateCount: number;
  mergeHistory: MergeLogEntry[];
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisionAnalysisResult {
  isValidCivicIssue: boolean;
  category: IssueCategory | 'other';
  title: string;
  summary: string;
  imageQuality: ImageQuality;
  confidence: number;
  severity: IssueSeverity;
  severityScore: number;
  facesDetected: boolean;
  platesDetected: boolean;
  recommendedAction: string;
}

export const CATEGORY_META: Record<
  IssueCategory,
  {
    label: string;
    department: string;
    colorHex: string;
    textColorClass: string;
    dotColorClass: string;
  }
> = {
  pothole: {
    label: 'Pothole',
    department: 'Roads & Highways Department',
    colorHex: '#DC2626',
    textColorClass: 'text-red-700',
    dotColorClass: 'bg-red-600',
  },
  garbage: {
    label: 'Uncollected Garbage',
    department: 'Sanitation & Solid Waste Dept.',
    colorHex: '#D97706',
    textColorClass: 'text-amber-700',
    dotColorClass: 'bg-amber-600',
  },
  streetlight: {
    label: 'Faulty Streetlight',
    department: 'Electrical & Street Lighting Dept.',
    colorHex: '#2563EB',
    textColorClass: 'text-blue-700',
    dotColorClass: 'bg-blue-600',
  },
  water_leakage: {
    label: 'Water Leakage',
    department: 'Water Supply & Jal Board',
    colorHex: '#0891B2',
    textColorClass: 'text-cyan-700',
    dotColorClass: 'bg-cyan-600',
  },
};

export const SENSITIVE_ZONES: SensitiveZone[] = [
  {
    id: 'zone-dtc',
    name: 'Delhi Technical Campus (Knowledge Park III)',
    type: 'School / College',
    lat: 28.4744,
    lng: 77.4848,
    bonusPoints: 20,
  },
  {
    id: 'zone-sharda',
    name: 'Sharda Hospital & Medical Corridor',
    type: 'Hospital',
    lat: 28.4728,
    lng: 77.4822,
    bonusPoints: 25,
  },
  {
    id: 'zone-expressway',
    name: 'Noida-Greater Noida Expressway',
    type: 'Highway / Arterial',
    lat: 28.4685,
    lng: 77.4935,
    bonusPoints: 18,
  },
  {
    id: 'zone-parichowk',
    name: 'Pari Chowk Arterial Junction',
    type: 'Highway / Arterial',
    lat: 28.4671,
    lng: 77.5112,
    bonusPoints: 18,
  },
  {
    id: 'zone-kailash',
    name: 'Kailash Hospital Greater Noida',
    type: 'Hospital',
    lat: 28.4776,
    lng: 77.5038,
    bonusPoints: 25,
  },
];

export const TEAM_MEMBERS = [
  { name: 'Aarya Jain', enrollment: '03918011625' },
  { name: 'Avantika Priya', enrollment: '03518011625' },
  { name: 'Satyapriya Sinha', enrollment: '01218011625' },
  { name: 'Pragati Diwedi', enrollment: '00718012725' },
  { name: 'Rishabh Sharma', enrollment: '02018011925' },
  { name: 'Rishabh Singh Rathore', enrollment: '03718011625' },
];
```

---

## `src/App.tsx`

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Map, PlusCircle, ListChecks, BookOpen, Menu, X } from 'lucide-react';
import type { CivicIssue, IssueStatus } from './types';
import { CityMapView } from './components/CityMapView';
import { ReportIssueView } from './components/ReportIssueView';
import { ComplaintQueueView } from './components/ComplaintQueueView';
import { ProjectOverviewView } from './components/ProjectOverviewView';

type ActiveTab = 'map' | 'report' | 'queue' | 'project';

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  title: string;
  icon: typeof Map;
}> = [
  { id: 'map', label: 'City Map & Heatmap', title: 'City Map & Live Heatmap', icon: Map },
  { id: 'report', label: 'Report Issue', title: '6-Stage Issue Intake & AI Detection', icon: PlusCircle },
  { id: 'queue', label: 'Complaint Queue', title: 'Department Triage & Status Queue', icon: ListChecks },
  { id: 'project', label: 'Project & Research', title: 'UrbanEye AI · ManthanKriti 2k26', icon: BookOpen },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const fetchIssues = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/issues');
      if (!res.ok) {
        throw new Error('Failed to load civic issues.');
      }
      const data = await res.json();
      setIssues(data.issues ?? []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Unable to reach server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleUpdateStatus = async (id: string, status: IssueStatus) => {
    const res = await fetch(`/api/issues/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const updated = data.issue as CivicIssue;
    setIssues((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleIssueSubmitted = (issue: CivicIssue, merged: boolean) => {
    setIssues((prev) => {
      if (merged) {
        return prev
          .map((item) => (item.id === issue.id ? issue : item))
          .sort((a, b) => b.priorityScore - a.priorityScore);
      }
      return [issue, ...prev].sort((a, b) => b.priorityScore - a.priorityScore);
    });
    setSelectedIssueId(issue.id);
  };

  const handleViewOnMap = (issueId: string) => {
    setSelectedIssueId(issueId);
    setActiveTab('map');
  };

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-14 flex items-center px-5 border-b border-slate-200">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            UrbanEye AI
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-700">Greater Noida Pilot</div>
          <div>Knowledge Park III · Team DOOMSCROLLERS</div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-full bg-white border-r border-slate-200 flex flex-col z-50">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
              <span className="text-lg font-bold text-slate-900">UrbanEye AI</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Bar Contract: Context Breadcrumb — Primary Action */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-8 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
              {currentNav.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'report' && (
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                Report Civic Issue
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-6">
          {loadError ? (
            <div className="p-5 bg-white border border-red-200 rounded-lg text-sm text-red-700">
              {loadError}
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-slate-200/70 rounded-lg animate-pulse" />
              <div className="h-[460px] bg-slate-200/70 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {activeTab === 'map' && (
                <CityMapView
                  issues={issues}
                  selectedIssueId={selectedIssueId}
                  onSelectIssue={setSelectedIssueId}
                  onUpdateStatus={handleUpdateStatus}
                  onNavigateToReport={() => setActiveTab('report')}
                />
              )}
              {activeTab === 'report' && (
                <ReportIssueView
                  onIssueSubmitted={handleIssueSubmitted}
                  onViewOnMap={handleViewOnMap}
                />
              )}
              {activeTab === 'queue' && (
                <ComplaintQueueView
                  issues={issues}
                  onUpdateStatus={handleUpdateStatus}
                  onViewOnMap={handleViewOnMap}
                />
              )}
              {activeTab === 'project' && <ProjectOverviewView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## `src/components/CityMapView.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Flame,
  Layers,
  MapPin,
  ShieldAlert,
  Building2,
  GitMerge,
  CheckCircle2,
} from 'lucide-react';
import {
  CATEGORY_META,
  SENSITIVE_ZONES,
  type CivicIssue,
  type IssueCategory,
  type IssueStatus,
} from '../types';

interface CityMapViewProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onUpdateStatus: (id: string, status: IssueStatus) => Promise<void>;
  onNavigateToReport: () => void;
}

const STATUS_STEPS: IssueStatus[] = ['Reported', 'Verified', 'Dispatched', 'Resolved'];

function getSeverityColor(severity: CivicIssue['severity']): string {
  switch (severity) {
    case 'Critical':
      return 'text-red-700';
    case 'High':
      return 'text-amber-700';
    case 'Medium':
      return 'text-blue-700';
    default:
      return 'text-slate-600';
  }
}

export function CityMapView({
  issues,
  selectedIssueId,
  onSelectIssue,
  onUpdateStatus,
  onNavigateToReport,
}: CityMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategory>('all');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    if (categoryFilter === 'all') return issues;
    return issues.filter((item) => item.category === categoryFilter);
  }, [issues, categoryFilter]);

  const selectedIssue = useMemo(() => {
    if (selectedIssueId) {
      const found = issues.find((i) => i.id === selectedIssueId);
      if (found) return found;
    }
    return filteredIssues[0] ?? issues[0] ?? null;
  }, [issues, filteredIssues, selectedIssueId]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.4735, 77.4965],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    heatmapLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render markers, heatmap circles, and sensitive zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatmapLayer = heatmapLayerRef.current;
    const zonesLayer = zonesLayerRef.current;
    if (!map || !markersLayer || !heatmapLayer || !zonesLayer) return;

    markersLayer.clearLayers();
    heatmapLayer.clearLayers();
    zonesLayer.clearLayers();

    if (showZones) {
      for (const zone of SENSITIVE_ZONES) {
        L.circle([zone.lat, zone.lng], {
          radius: 420,
          color: '#0f172a',
          weight: 1,
          dashArray: '4 4',
          fillColor: '#64748b',
          fillOpacity: 0.05,
        })
          .bindTooltip(`${zone.name} (${zone.type}) · +${zone.bonusPoints} priority`, {
            direction: 'top',
          })
          .addTo(zonesLayer);
      }
    }

    if (showHeatmap) {
      for (const issue of filteredIssues) {
        if (issue.status === 'Resolved') continue;
        const weight = Math.max(0.35, issue.priorityScore / 100);
        const outerRadius = 220 + issue.duplicateCount * 55;
        const heatColor =
          issue.priorityScore >= 80
            ? '#dc2626'
            : issue.priorityScore >= 60
              ? '#ea580c'
              : '#eab308';

        // Outer soft thermal halo
        L.circle([issue.lat, issue.lng], {
          radius: outerRadius,
          stroke: false,
          fillColor: heatColor,
          fillOpacity: 0.12 * weight,
          interactive: false,
        }).addTo(heatmapLayer);

        // Inner intense core
        L.circle([issue.lat, issue.lng], {
          radius: outerRadius * 0.52,
          stroke: false,
          fillColor: heatColor,
          fillOpacity: 0.24 * weight,
          interactive: false,
        }).addTo(heatmapLayer);
      }
    }

    for (const issue of filteredIssues) {
      const meta = CATEGORY_META[issue.category];
      const isSelected = selectedIssue?.id === issue.id;
      const radius = isSelected ? 10 : Math.min(9, 6 + issue.duplicateCount);

      const marker = L.circleMarker([issue.lat, issue.lng], {
        radius,
        color: isSelected ? '#0f172a' : '#ffffff',
        weight: isSelected ? 3 : 2,
        fillColor: issue.status === 'Resolved' ? '#16a34a' : meta.colorHex,
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        `${issue.id} · ${meta.label} (Priority ${issue.priorityScore})`,
        { direction: 'top', offset: [0, -6] }
      );

      marker.on('click', () => {
        onSelectIssue(issue.id);
      });

      marker.addTo(markersLayer);
    }
  }, [filteredIssues, showHeatmap, showZones, selectedIssue?.id, onSelectIssue]);

  const handleStatusChange = async (nextStatus: IssueStatus) => {
    if (!selectedIssue || updatingId) return;
    setUpdatingId(selectedIssue.id);
    try {
      await onUpdateStatus(selectedIssue.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filter & Layer Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter issues by category">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All Issues ({issues.length})
          </button>
          {(Object.keys(CATEGORY_META) as IssueCategory[]).map((cat) => {
            const count = issues.filter((i) => i.category === cat).length;
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_META[cat].colorHex }}
                  aria-hidden="true"
                />
                <span>{CATEGORY_META[cat].label}</span>
                <span className="tabular-nums opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowHeatmap((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showHeatmap
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hotspot Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showZones
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sensitive Zones</span>
          </button>
        </div>
      </div>

      {/* Main Split: Leaflet Map + Ticket Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 text-xs text-slate-600">
            <span className="font-medium text-slate-900">
              Greater Noida Pilot Ward Map · OpenStreetMap + Leaflet
            </span>
            <span className="tabular-nums font-mono text-slate-500">
              {filteredIssues.length} plotted issues
            </span>
          </div>
          <div
            ref={mapContainerRef}
            className="w-full h-[460px] lg:h-[540px]"
            aria-label="Interactive Greater Noida civic issue map and hotspot heatmap"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-hidden="true" />
                Pothole
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" aria-hidden="true" />
                Garbage
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                Streetlight
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" aria-hidden="true" />
                Water Leakage
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
                Resolved
              </span>
            </div>
            <span className="text-slate-500">Click any pin to inspect priority &amp; routing</span>
          </div>
        </div>

        {/* Selected Issue Detail Rail */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          {selectedIssue ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span>{selectedIssue.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedIssue.ward}</span>
                  </div>
                  <h2 className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                    {selectedIssue.title}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">Priority</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {selectedIssue.priorityScore}
                  </div>
                </div>
              </div>

              {selectedIssue.imageDataUrl && (
                <div className="rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={selectedIssue.imageDataUrl}
                    alt={selectedIssue.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedIssue.description}
              </p>

              {/* Clean unboxed key-value details */}
              <dl className="grid grid-cols-1 gap-2.5 text-xs border-t border-b border-slate-100 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                    Category &amp; Severity
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {CATEGORY_META[selectedIssue.category].label} ·{' '}
                    <span className={getSeverityColor(selectedIssue.severity)}>
                      {selectedIssue.severity}
                    </span>
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Routed Department
                  </dt>
                  <dd className="font-medium text-slate-900 text-right">
                    {selectedIssue.department}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    Coordinates
                  </dt>
                  <dd className="font-mono tabular-nums text-slate-700">
                    {selectedIssue.lat.toFixed(4)}, {selectedIssue.lng.toFixed(4)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <GitMerge className="w-3.5 h-3.5" aria-hidden="true" />
                    Merged Reports
                  </dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900">
                    {selectedIssue.duplicateCount} report{selectedIssue.duplicateCount > 1 ? 's' : ''}
                  </dd>
                </div>
              </dl>

              {/* Priority Score Breakdown */}
              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="font-medium text-slate-900">Priority Calculation</div>
                <div className="flex justify-between">
                  <span>Vision severity base (70% weight)</span>
                  <span className="font-mono tabular-nums">
                    +{Math.round(selectedIssue.priorityBreakdown.severityScore * 0.7)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Sensitive zone{' '}
                    {selectedIssue.priorityBreakdown.nearbyZone
                      ? `(${selectedIssue.priorityBreakdown.nearbyZone})`
                      : '(none nearby)'}
                  </span>
                  <span className="font-mono tabular-nums">
                    +{selectedIssue.priorityBreakdown.locationBonus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duplicate report boost</span>
                  <span className="font-mono tabular-nums">
                    +{selectedIssue.priorityBreakdown.duplicateBonus}
                  </span>
                </div>
              </div>

              {selectedIssue.mergeHistory.length > 0 && (
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span className="font-medium text-slate-700">Latest Merge: </span>
                  {selectedIssue.mergeHistory[0].note}
                </div>
              )}

              {/* Status Progression Controls */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-700 mb-2 flex items-center justify-between">
                  <span>Department Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {selectedIssue.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-md">
                  {STATUS_STEPS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingId === selectedIssue.id}
                      onClick={() => handleStatusChange(st)}
                      className={`py-1.5 px-1 text-[11px] font-medium rounded transition-colors truncate ${
                        selectedIssue.status === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-600">No civic issues match the active filter.</p>
              <button
                type="button"
                onClick={onNavigateToReport}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
              >
                Report First Issue
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
```

---

## `src/components/ReportIssueView.tsx`

```tsx
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import L from 'leaflet';
import {
  Upload,
  Crosshair,
  ScanEye,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  CATEGORY_META,
  type CivicIssue,
  type IssueCategory,
  type IssueSeverity,
  type VisionAnalysisResult,
} from '../types';

interface ReportIssueViewProps {
  onIssueSubmitted: (issue: CivicIssue, merged: boolean) => void;
  onViewOnMap: (issueId: string) => void;
}

const QUICK_LOCATIONS = [
  {
    label: 'Delhi Technical Campus (KP-III)',
    ward: 'Knowledge Park III',
    lat: 28.4744,
    lng: 77.4848,
  },
  {
    label: 'Sharda Hospital Gate (Duplicate Test)',
    ward: 'Knowledge Park III',
    lat: 28.4732,
    lng: 77.4829,
  },
  {
    label: 'Pari Chowk Service Lane',
    ward: 'Pari Chowk',
    lat: 28.468,
    lng: 77.5098,
  },
  {
    label: 'Sector Alpha I Roundabout',
    ward: 'Alpha I',
    lat: 28.4789,
    lng: 77.5055,
  },
];

export function ReportIssueView({
  onIssueSubmitted,
  onViewOnMap,
}: ReportIssueViewProps) {
  const pinMapRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const [lat, setLat] = useState<number>(28.4744);
  const [lng, setLng] = useState<number>(77.4848);
  const [ward, setWard] = useState<string>('Knowledge Park III');
  const [description, setDescription] = useState<string>('');
  const [privacyBlurEnabled, setPrivacyBlurEnabled] = useState<boolean>(true);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);

  // Editable classification fields (populated by Vision AI, or manually adjustable)
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>('pothole');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [severity, setSeverity] = useState<IssueSeverity>('High');
  const [severityScore, setSeverityScore] = useState<number>(75);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionOutcome, setSubmissionOutcome] = useState<{
    merged: boolean;
    matchedDistanceMeters?: number;
    issue: CivicIssue;
  } | null>(null);

  // Initialize Leaflet pin-confirmation map
  useEffect(() => {
    if (!pinMapRef.current || mapRef.current) return;

    const map = L.map(pinMapRef.current, {
      center: [lat, lng],
      zoom: 15,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.circleMarker([lat, lng], {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#1d4ed8',
      fillOpacity: 1,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const nextLat = Number(e.latlng.lat.toFixed(5));
      const nextLng = Number(e.latlng.lng.toFixed(5));
      setLat(nextLat);
      setLng(nextLng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync pin position
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysis(null);
    setAnalysisError(null);
    setSubmissionOutcome(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageDataUrl(result);
      const base64Part = result.split(',')[1] ?? '';
      setImageBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  const handleUseBrowserGps = () => {
    if (!navigator.geolocation) {
      setAnalysisError('Browser geolocation is unavailable. Click on the map to pin location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(5)));
        setLng(Number(pos.coords.longitude.toFixed(5)));
        setWard('GPS Confirmed Location');
      },
      () => {
        setAnalysisError('Location permission denied. Please click the map pin directly.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleRunVisionDetection = async () => {
    if (!imageBase64) {
      setAnalysisError('Upload a photo first to run UrbanEye Vision detection.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setSubmissionOutcome(null);

    try {
      const res = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Vision detection request failed.');
      }

      const detected = data.analysis as VisionAnalysisResult;
      setAnalysis(detected);

      if (detected.category !== 'other') {
        setSelectedCategory(detected.category);
      }
      setCustomTitle(detected.title);
      setSeverity(detected.severity);
      setSeverityScore(detected.severityScore);
    } catch (err: unknown) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Unable to analyze uploaded image.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitPipeline = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const meta = CATEGORY_META[selectedCategory];
      const finalTitle =
        customTitle.trim() || `${meta.label} reported at ${ward}`;

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          category: selectedCategory,
          description:
            description.trim() ||
            analysis?.summary ||
            `${meta.label} flagged via UrbanEye AI citizen intake.`,
          lat,
          lng,
          ward,
          addressLabel: `${ward} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
          severity,
          severityScore,
          confidence: analysis?.confidence ?? 85,
          imageQuality: analysis?.imageQuality ?? 'clear',
          privacyBlurred: privacyBlurEnabled,
          imageDataUrl: imageDataUrl ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit civic issue.');
      }

      setSubmissionOutcome({
        merged: Boolean(data.merged),
        matchedDistanceMeters: data.matchedDistanceMeters,
        issue: data.issue as CivicIssue,
      });
      onIssueSubmitted(data.issue as CivicIssue, Boolean(data.merged));
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Submission failed. Please retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const routedDepartment = CATEGORY_META[selectedCategory].department;

  return (
    <div className="flex flex-col gap-6">
      {/* 6-Stage Pipeline Stepper Strip */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {[
            '01. Image + GPS Upload',
            '02. Vision Detection',
            '03. Duplicate Check',
            '04. Priority Score',
            '05. Dept. Routing',
            '06. Map & Status',
          ].map((stepLabel, idx) => {
            const active =
              (idx === 0 && !analysis) ||
              (idx === 1 && analyzing) ||
              (idx >= 2 && idx <= 4 && Boolean(analysis) && !submissionOutcome) ||
              (idx === 5 && Boolean(submissionOutcome));
            return (
              <div
                key={stepLabel}
                className={`py-1.5 px-2.5 rounded border text-center font-medium truncate ${
                  active
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {stepLabel}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Intake Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Stage 1 (Photo Upload + GPS Pin Confirmation) */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              1. Photo Upload &amp; Map Pin Confirmation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a civic issue photograph and verify the GPS pin on the map before AI classification.
            </p>
          </div>

          {/* Photo Input */}
          <div>
            <label
              htmlFor="issue-photo-upload"
              className="block text-xs font-medium text-slate-700 mb-2"
            >
              Civic Issue Photograph (Pothole, Garbage, Streetlight, or Water Leakage)
            </label>
            <label
              htmlFor="issue-photo-upload"
              className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-5 cursor-pointer hover:bg-slate-50 transition-colors text-center"
            >
              {imageDataUrl ? (
                <div className="w-full space-y-2">
                  <img
                    src={imageDataUrl}
                    alt="Uploaded civic issue preview"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-56 object-contain rounded border border-slate-200 bg-slate-100"
                  />
                  <span className="inline-block text-xs text-blue-700 font-medium">
                    Click to replace photo
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-6 h-6 text-slate-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-slate-700">
                    Select photo from device
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports JPG, PNG, WebP · Auto-checked for quality &amp; privacy
                  </span>
                </div>
              )}
              <input
                id="issue-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          {/* Citizen Privacy Toggle */}
          <div className="flex items-center justify-between gap-3 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Privacy safeguard: flag faces &amp; license plates for auto-blur</span>
            </div>
            <input
              type="checkbox"
              aria-label="Enable auto-blur privacy flag for faces and number plates"
              checked={privacyBlurEnabled}
              onChange={(e) => setPrivacyBlurEnabled(e.target.checked)}
              className="h-4 w-4 accent-blue-700 rounded cursor-pointer"
            />
          </div>

          {/* Citizen Notes */}
          <div>
            <label
              htmlFor="citizen-note"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Location Landmark / Citizen Note (Optional)
            </label>
            <textarea
              id="citizen-note"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Large pothole near campus main gate blocking left lane..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Map Pin Confirmation */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700">
                Confirm GPS Pin (Click map to adjust)
              </span>
              <button
                type="button"
                onClick={handleUseBrowserGps}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
              >
                <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Use My GPS</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc.label}
                  type="button"
                  onClick={() => {
                    setLat(loc.lat);
                    setLng(loc.lng);
                    setWard(loc.ward);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  {loc.label}
                </button>
              ))}
            </div>

            <div
              ref={pinMapRef}
              className="w-full h-56 rounded-md border border-slate-200 overflow-hidden"
              aria-label="Map pin confirmation widget"
            />

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
              <span>Ward: {ward}</span>
              <span>
                {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
              </span>
            </div>
          </div>
        </section>

        {/* Right: Stage 2 (Vision AI) + Stage 3-5 (Duplicate Check, Priority, Routing) */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                2. AI Vision Detection &amp; Department Routing
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Classify issue type, check image quality, merge nearby duplicates, and auto-route.
              </p>
            </div>
            <button
              type="button"
              disabled={!imageBase64 || analyzing}
              onClick={handleRunVisionDetection}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
            >
              <ScanEye className="w-4 h-4" aria-hidden="true" />
              <span>{analyzing ? 'Analyzing...' : 'Run Vision Detection'}</span>
            </button>
          </div>

          {analysisError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{analysisError}</span>
            </div>
          )}

          {analysis && (
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  Vision Model Assessment
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-600">
                  Confidence: {analysis.confidence}% · Quality: {analysis.imageQuality}
                </span>
              </div>

              {(!analysis.isValidCivicIssue ||
                analysis.imageQuality === 'unusable' ||
                analysis.confidence < 60) && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Low confidence or unclear civic issue detected. Please verify the category manually below or upload a clearer photo.
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-700 leading-relaxed">{analysis.summary}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>
                  Faces detected:{' '}
                  <strong className="text-slate-900">
                    {analysis.facesDetected ? 'Yes (flag for blur)' : 'No'}
                  </strong>
                </span>
                <span>
                  License plates:{' '}
                  <strong className="text-slate-900">
                    {analysis.platesDetected ? 'Yes (flag for blur)' : 'No'}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Classification & Severity Fields (auto-filled by AI or manually configurable) */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Issue Category (Auto-Routes Department)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_META) as IssueCategory[]).map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 text-left rounded-md border text-xs transition-colors ${
                        active
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">{CATEGORY_META[cat].label}</div>
                      <div
                        className={`text-[11px] truncate ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {CATEGORY_META[cat].department}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="ticket-title"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Complaint Title
              </label>
              <input
                id="ticket-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={`${CATEGORY_META[selectedCategory].label} near ${ward}`}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="severity-select"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Severity Level
                </label>
                <select
                  id="severity-select"
                  value={severity}
                  onChange={(e) => {
                    const next = e.target.value as IssueSeverity;
                    setSeverity(next);
                    if (next === 'Critical') setSeverityScore(90);
                    else if (next === 'High') setSeverityScore(75);
                    else if (next === 'Medium') setSeverityScore(55);
                    else setSeverityScore(30);
                  }}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="severity-score-input"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Base Severity Score (1–100)
                </label>
                <input
                  id="severity-score-input"
                  type="number"
                  min={1}
                  max={100}
                  value={severityScore}
                  onChange={(e) =>
                    setSeverityScore(Math.max(1, Math.min(100, Number(e.target.value) || 50)))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Target Municipal Department</span>
              <span className="font-semibold text-slate-900">{routedDepartment}</span>
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {submitError}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitPipeline}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{submitting ? 'Processing Pipeline...' : 'Submit & Route Complaint'}</span>
            </button>
          </div>

          {/* Pipeline Outcome Banner */}
          {submissionOutcome && (
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                {submissionOutcome.merged ? (
                  <>
                    <GitMerge className="w-4 h-4" aria-hidden="true" />
                    <span>
                      Duplicate Detected ({submissionOutcome.matchedDistanceMeters}m away) — Merged into{' '}
                      {submissionOutcome.issue.id}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>
                      New Ticket {submissionOutcome.issue.id} Routed to{' '}
                      {submissionOutcome.issue.department}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-emerald-800">
                Assigned Priority Score:{' '}
                <strong className="font-mono tabular-nums">
                  {submissionOutcome.issue.priorityScore}/100
                </strong>
                {submissionOutcome.issue.priorityBreakdown.nearbyZone
                  ? ` · Proximity boost: ${submissionOutcome.issue.priorityBreakdown.nearbyZone}`
                  : ''}
                {' · '}Total merged reports:{' '}
                <strong className="font-mono tabular-nums">
                  {submissionOutcome.issue.duplicateCount}
                </strong>
              </p>
              <button
                type="button"
                onClick={() => onViewOnMap(submissionOutcome.issue.id)}
                className="px-3.5 py-1.5 text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded hover:bg-emerald-100 transition-colors"
              >
                Inspect on Live City Map
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

---

## `src/components/ComplaintQueueView.tsx`

```tsx
import { useMemo, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import {
  CATEGORY_META,
  type CivicIssue,
  type IssueCategory,
  type IssueStatus,
} from '../types';

interface ComplaintQueueViewProps {
  issues: CivicIssue[];
  onUpdateStatus: (id: string, status: IssueStatus) => Promise<void>;
  onViewOnMap: (id: string) => void;
}

const STATUS_FILTERS: Array<'all' | IssueStatus> = [
  'all',
  'Reported',
  'Verified',
  'Dispatched',
  'Resolved',
];

export function ComplaintQueueView({
  issues,
  onUpdateStatus,
  onViewOnMap,
}: ComplaintQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IssueStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategory>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const openCount = issues.filter((i) => i.status !== 'Resolved').length;
    const criticalCount = issues.filter(
      (i) => i.status !== 'Resolved' && i.priorityScore >= 80
    ).length;
    const mergedReports = issues.reduce(
      (acc, i) => acc + Math.max(0, i.duplicateCount - 1),
      0
    );
    const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
    return { openCount, criticalCount, mergedReports, resolvedCount };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (q) {
        const hay = `${item.id} ${item.title} ${item.ward} ${item.department}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [issues, searchQuery, statusFilter, categoryFilter]);

  const handleStatusSelect = async (id: string, nextStatus: IssueStatus) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 4-Column Summary Strip (flat hairline cells, tabular numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-xs text-slate-500">Active Open Tickets</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.openCount}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">High / Critical Priority (80+)</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-red-700">
            {metrics.criticalCount}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Duplicates Auto-Merged</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-blue-700">
            {metrics.mergedReports}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Resolved Tickets</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {metrics.resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, ward, department..."
              aria-label="Search civic complaints"
              className="pl-8 pr-3 py-1.5 w-64 rounded-md border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            aria-label="Filter by issue category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | IssueCategory)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_META) as IssueCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4">Ticket ID</th>
                <th className="py-2.5 px-4">Issue &amp; Ward</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Routed Department</th>
                <th className="py-2.5 px-4 text-right">Reports</th>
                <th className="py-2.5 px-4 text-right">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No tickets match your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const meta = CATEGORY_META[issue.category];
                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono tabular-nums font-medium text-slate-700 whitespace-nowrap">
                        {issue.id}
                      </td>
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {issue.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {issue.ward} · {issue.addressLabel}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-700">
                        {meta.label}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {issue.department}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        {issue.duplicateCount}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {issue.priorityScore}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Update status for ${issue.id}`}
                          disabled={updatingId === issue.id}
                          value={issue.status}
                          onChange={(e) =>
                            handleStatusSelect(issue.id, e.target.value as IssueStatus)
                          }
                          className="px-2 py-1 rounded border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="Reported">Reported</option>
                          <option value="Verified">Verified</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewOnMap(issue.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Locate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## `src/components/ProjectOverviewView.tsx`

```tsx
import { FileText, ExternalLink } from 'lucide-react';
import { TEAM_MEMBERS } from '../types';

const PIPELINE_STAGES = [
  {
    step: '01. Image + GPS Upload',
    detail: 'Citizen uploads a photo with map-pin confirmed coordinates before submission.',
  },
  {
    step: '02. Vision Model Detects Issue',
    detail: 'Classifies pothole, garbage, streetlight fault, or water leakage with confidence & quality check.',
  },
  {
    step: '03. Duplicate Check',
    detail: 'Image + geo-tag matching merges repeat reports within ward proximity.',
  },
  {
    step: '04. Priority Score',
    detail: 'Combines physical severity with proximity to schools, hospitals, and highways.',
  },
  {
    step: '05. Department Routing',
    detail: 'Auto-routes the verified complaint directly to the concerned municipal department.',
  },
  {
    step: '06. Dashboard & Status',
    detail: 'Live OpenStreetMap + Leaflet city map, hotspot heatmap, and status tracking.',
  },
];

const CHALLENGES = [
  {
    risk: 'Blurry or fake images',
    strategy: 'Quality check, confidence threshold, manual review',
  },
  {
    risk: 'Limited training data',
    strategy: 'Pretrained models, transfer learning, augmentation',
  },
  {
    risk: 'Inaccurate GPS location',
    strategy: 'Map pin confirmation before submit',
  },
  {
    risk: 'Department adoption',
    strategy: 'Simple dashboard, pilot in one ward first',
  },
  {
    risk: 'Citizen privacy',
    strategy: 'Auto-blur faces and number plates',
  },
];

const REFERENCES = [
  {
    title: 'YOLO Object Detection',
    citation: 'Redmon et al., "You Only Look Once: Unified, Real-Time Object Detection", CVPR 2016',
    url: 'https://arxiv.org/abs/1506.02640',
  },
  {
    title: 'Road Damage Dataset (RDD2022)',
    citation: 'Arya et al., "RDD2022: A multi-national image dataset for automatic Road Damage Detection"',
    url: 'https://arxiv.org/abs/2209.08538',
  },
  {
    title: 'Smart Cities Mission, India',
    citation: 'Ministry of Housing and Urban Affairs (MoHUA)',
    url: 'https://smartcities.gov.in',
  },
  {
    title: 'Swachh Bharat Mission - Urban',
    citation: 'Citizen grievance and sanitation reporting model',
    url: 'https://swachhbharatmission.gov.in',
  },
  {
    title: 'Leaflet + OpenStreetMap',
    citation: 'Open-source mapping and heatmap tools',
    url: 'https://leafletjs.com',
  },
];

export function ProjectOverviewView() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Institutional Banner */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-slate-500">
              Delhi Technical Campus, Greater Noida · Affiliated to GGSIPU, New Delhi (NAAC-A++)
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              UrbanEye AI: Smart City Civic Issue Detection
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              Team DOOMSCROLLERS · Theme: Smart Cities / Urban Governance · ManthanKriti 2k26 (Software).
              Brings detection, de-duplication, prioritization, and department routing into one unified civic pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/assets/aistudio/UrbanEye_AI_ManthanKriti__1__b28691e4.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Presentation Deck (PDF)</span>
            </a>
            <a
              href="/assets/aistudio/UrbanEye_AI_Poster__2__632ff67e.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Project Poster (PDF)</span>
            </a>
          </div>
        </div>
      </section>

      {/* 6-Stage Methodology */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          6-Stage Implementation Methodology
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_STAGES.map((item) => (
            <div
              key={item.step}
              className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-1.5"
            >
              <div className="text-xs font-semibold text-blue-800">{item.step}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feasibility & Stack + Challenges Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Feasibility &amp; Target Architecture
          </h3>
          <dl className="space-y-3 text-xs">
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Computer Vision</dt>
              <dd className="text-slate-600 mt-0.5">
                YOLO / CNN (PyTorch, OpenCV) &amp; multimodal vision classification
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Machine Learning</dt>
              <dd className="text-slate-600 mt-0.5">
                scikit-learn &amp; spatial scoring for priority ranking and duplicate matching
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Frontend &amp; Mapping</dt>
              <dd className="text-slate-600 mt-0.5">
                React + Leaflet + OpenStreetMap (city map &amp; hotspot heatmap)
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Backend &amp; Geo-Database</dt>
              <dd className="text-slate-600 mt-0.5">
                REST APIs + PostgreSQL / PostGIS geo-queries for production scale
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">Economic &amp; Operational Viability</dt>
              <dd className="text-slate-600 mt-0.5">
                Low-cost open-source stack designed for single-ward pilot deployment first.
              </dd>
            </div>
          </dl>
        </section>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Challenges &amp; Mitigation Strategies
            </h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-6 font-semibold">Potential Challenge / Risk</th>
                <th className="py-2.5 px-6 font-semibold">Strategy for Overcoming</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CHALLENGES.map((row) => (
                <tr key={row.risk}>
                  <td className="py-3 px-6 font-medium text-slate-900">{row.risk}</td>
                  <td className="py-3 px-6 text-slate-600">{row.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Team Members (Batch 2026-27) + Research References */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Team DOOMSCROLLERS
            </h3>
            <span className="text-xs font-mono text-slate-500">Batch 2026–27</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-6 font-semibold">Student Name</th>
                <th className="py-2.5 px-6 font-semibold text-right">Enrollment No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEAM_MEMBERS.map((member) => (
                <tr key={member.enrollment}>
                  <td className="py-2.5 px-6 font-medium text-slate-900">
                    {member.name}
                  </td>
                  <td className="py-2.5 px-6 text-right font-mono tabular-nums text-slate-600">
                    {member.enrollment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Impact &amp; Research References
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-b border-slate-100 pb-4">
            <div>
              <div className="font-semibold text-slate-900">Social Impact</div>
              <p className="text-slate-600 mt-1">Safer roads, public spaces, stronger citizen participation.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Economic Impact</div>
              <p className="text-slate-600 mt-1">Early repairs cost less and reduce manual triage staff effort.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Environmental Impact</div>
              <p className="text-slate-600 mt-1">Faster garbage and leak action means cleaner streets and less water waste.</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs">
            {REFERENCES.map((ref) => (
              <li
                key={ref.title}
                className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
              >
                <div>
                  <div className="font-medium text-slate-900">{ref.title}</div>
                  <div className="text-slate-500">{ref.citation}</div>
                </div>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${ref.title}`}
                  className="text-blue-700 hover:text-blue-900 shrink-0 p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
```

