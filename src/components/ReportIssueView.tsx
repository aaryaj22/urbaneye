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
