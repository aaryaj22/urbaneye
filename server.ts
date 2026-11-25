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
