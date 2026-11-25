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
