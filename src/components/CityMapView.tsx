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
