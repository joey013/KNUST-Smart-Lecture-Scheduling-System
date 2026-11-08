/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Grid,
  List,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { DayOfWeek, LectureSession, UserRole } from '../../types';
import { CAMPUS_DAYS } from '../../services/schedulingEngine';
import { TimetableCard } from './TimetableCard';

interface WeeklyTimetableProps {
  sessions: LectureSession[];
  currentRole: UserRole;
  currentUserId?: string;
  onCancel?: (session: LectureSession) => void;
  onReschedule?: (session: LectureSession) => void;
  title?: string;
  subtitle?: string;
}

const TIME_SLOTS = [
  { label: '08:00 - 10:00', start: '08:00', end: '10:00' },
  { label: '10:00 - 12:00', start: '10:00', end: '12:00' },
  { label: '12:00 - 14:00', start: '12:00', end: '14:00' },
  { label: '14:00 - 16:00', start: '14:00', end: '16:00' },
  { label: '16:00 - 18:00', start: '16:00', end: '18:00' }
];

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  sessions,
  currentRole,
  currentUserId,
  onCancel,
  onReschedule,
  title,
  subtitle
}) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED' | 'RESCHEDULED' | 'MERGED'>('ALL');

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    // Day filter
    if (selectedDay !== 'ALL' && session.day !== selectedDay) {
      return false;
    }

    // Status filter
    if (statusFilter === 'ACTIVE' && session.status === 'CANCELLED') return false;
    if (statusFilter === 'CANCELLED' && session.status !== 'CANCELLED') return false;
    if (statusFilter === 'RESCHEDULED' && session.status !== 'RESCHEDULED') return false;
    if (statusFilter === 'MERGED' && !session.isMerged) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = session.title?.toLowerCase().includes(q);
      const matchDay = session.day.toLowerCase().includes(q);
      return matchTitle || matchDay;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Title & Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search lectures, code, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'CANCELLED' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => setStatusFilter('MERGED')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'MERGED' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Merged
            </button>
          </div>

          {/* Grid vs List toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
              title="Chronological List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedDay === 'ALL'
              ? 'bg-emerald-800 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Days (Mon - Sat)
        </button>
        {CAMPUS_DAYS.map(day => {
          const count = sessions.filter(s => s.day === day && s.status !== 'CANCELLED').length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedDay === day
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{day}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedDay === day ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid View */}
      {viewMode === 'GRID' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="min-w-[860px]">
            {/* Header row: Days of week */}
            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700">
              {(selectedDay === 'ALL' ? CAMPUS_DAYS : [selectedDay]).map(day => (
                <div key={day} className="py-3 px-2 border-r last:border-r-0 border-slate-200">
                  <span className="text-slate-900 font-bold">{day}</span>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                    {sessions.filter(s => s.day === day && s.status !== 'CANCELLED').length} active lectures
                  </div>
                </div>
              ))}
            </div>

            {/* Timetable Body columns */}
            <div className="grid grid-cols-6 divide-x divide-slate-200 min-h-[500px]">
              {(selectedDay === 'ALL' ? CAMPUS_DAYS : [selectedDay]).map(day => {
                const daySessions = filteredSessions
                  .filter(s => s.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={day} className="p-2 space-y-2.5 bg-slate-50/20">
                    {daySessions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                        <Clock className="w-6 h-6 stroke-1 text-slate-300 mb-1" />
                        <span className="text-xs font-medium text-slate-500">Free Day</span>
                        <span className="text-[10px] text-slate-400">No classes scheduled</span>
                      </div>
                    ) : (
                      daySessions.map(session => (
                        <TimetableCard
                          key={session.id}
                          session={session}
                          currentRole={currentRole}
                          currentUserId={currentUserId}
                          onCancel={onCancel}
                          onReschedule={onReschedule}
                          compact
                        />
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'LIST' && (
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No lectures match current filter criteria</p>
              <p className="text-xs text-slate-400 mt-0.5">Try resetting search or day filters above.</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <TimetableCard
                key={session.id}
                session={session}
                currentRole={currentRole}
                currentUserId={currentUserId}
                onCancel={onCancel}
                onReschedule={onReschedule}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
