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
