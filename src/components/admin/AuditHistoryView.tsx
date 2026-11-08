/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, Search, Filter, Calendar, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { useKNUSTStore } from '../../db/store';

export const AuditHistoryView: React.FC = () => {
  const { auditHistory } = useKNUSTStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredHistory = auditHistory.filter(item => {
    if (actionFilter !== 'ALL' && item.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.details.toLowerCase().includes(q) ||
        item.performedBy.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Scheduling Audit Ledger</h3>
          <p className="text-xs text-slate-500">
            Immutable log of all lecture creations, cancellations, reschedulings, merges, and batch timetable imports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
          >
            <option value="ALL">All Actions ({auditHistory.length})</option>
            <option value="CREATED">Created</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="MERGED">Merged</option>
            <option value="IMPORT">CSV Import</option>
          </select>
        </div>
      </div>

      {/* History Ledger List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs max-h-[500px] overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No audit records found matching criteria.
          </div>
        ) : (
          filteredHistory.map(entry => (
            <div key={entry.id} className="p-4 hover:bg-slate-50/60 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    entry.action === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : entry.action === 'RESCHEDULED'
                      ? 'bg-amber-100 text-amber-800'
                      : entry.action === 'MERGED'
                      ? 'bg-indigo-100 text-indigo-800'
                      : entry.action === 'IMPORT'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {entry.action}
                  </span>
                  <span className="font-bold text-slate-900">{entry.details}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span>Performed by: <strong className="text-slate-700">{entry.performedBy.name}</strong> ({entry.performedBy.role})</span>
                  <span>•</span>
                  <span>Session Ref: {entry.sessionId}</span>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
