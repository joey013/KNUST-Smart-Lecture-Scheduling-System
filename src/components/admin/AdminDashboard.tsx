/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Calendar,
  Layers,
  Building,
  AlertTriangle,
  Upload,
  History,
  CheckCircle2,
  Users,
  BookOpen,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { LectureSession, UserRole } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { WeeklyTimetable } from '../timetable/WeeklyTimetable';
import { ClassroomManagement } from './ClassroomManagement';
import { MergedClassManager } from './MergedClassManager';
import { ConflictReportView } from './ConflictReportView';
import { AuditHistoryView } from './AuditHistoryView';
import { CsvImportModal } from './CsvImportModal';
import { TestSuiteModal } from './TestSuiteModal';
import { CancelModal } from '../lecturer/CancelModal';
import { RescheduleModal } from '../lecturer/RescheduleModal';

interface AdminDashboardProps {
  onOpenNotifications: () => void;
  onOpenTestSuite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenNotifications,
  onOpenTestSuite
}) => {
  const {
    departments,
    studentGroups,
    courses,
    lecturers,
    classrooms,
    lectureSessions,
    auditHistory
  } = useKNUSTStore();

  const [activeTab, setActiveTab] = useState<'MASTER' | 'MERGED' | 'CLASSROOMS' | 'CONFLICTS' | 'AUDIT'>('MASTER');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedSessionForCancel, setSelectedSessionForCancel] = useState<LectureSession | null>(null);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<LectureSession | null>(null);

  const currentUser = {
    id: 'admin-1',
    name: 'College Academic Affairs Administrator',
    role: 'ADMIN' as const
  };

  // Metrics
  const totalSessions = lectureSessions.length;
  const activeSessions = lectureSessions.filter(s => s.status !== 'CANCELLED');
  const cancelledCount = lectureSessions.filter(s => s.status === 'CANCELLED').length;
  const rescheduledCount = lectureSessions.filter(s => s.status === 'RESCHEDULED').length;
  const mergedCount = lectureSessions.filter(s => s.isMerged).length;
  const totalClassroomSeats = classrooms.reduce((acc, r) => acc + r.capacity, 0);
  const totalStudents = studentGroups.reduce((acc, g) => acc + g.population, 0);

  // Filtered master timetable sessions
  const filteredMasterSessions = lectureSessions.filter(session => {
    if (selectedDeptId === 'ALL') return true;
    const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
    return sessionCourses.some(c => c.departmentId === selectedDeptId);
  });

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>CoE Academic Affairs Directorate</span>
            </div>
            <h2 className="text-2xl font-black text-white">Central Timetable Administration</h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Oversee departmental lecture allocations, coordinate inter-department merged classes, manage lecture hall capacities, and import CSV schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-900" />
              <span>Import Timetable CSV</span>
            </button>

            <button
              onClick={onOpenTestSuite}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Run Automated Tests</span>
            </button>
          </div>
        </div>

        {/* Institution KPI Stats */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Active Lectures</span>
            <span className="text-xl font-black text-white">{activeSessions.length}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Merged Sessions</span>
            <span className="text-xl font-black text-indigo-300">{mergedCount}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Classroom Halls</span>
            <span className="text-xl font-black text-white">{classrooms.length}</span>
            <span className="text-[10px] text-slate-400 block">{totalClassroomSeats} total seats</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Enrolled Students</span>
            <span className="text-xl font-black text-emerald-300">{totalStudents}</span>
            <span className="text-[10px] text-slate-400 block">{studentGroups.length} cohorts</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Cancellations</span>
            <span className="text-xl font-black text-rose-300">{cancelledCount}</span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Rescheduled</span>
            <span className="text-xl font-black text-amber-300">{rescheduledCount}</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('MASTER')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'MASTER'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Master Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab('MERGED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'MERGED'
                ? 'border-indigo-700 text-indigo-800 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Merged Class Coordinator ({mergedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLASSROOMS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'CLASSROOMS'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Classroom & Hall Catalog ({classrooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CONFLICTS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'CONFLICTS'
                ? 'border-rose-700 text-rose-800 bg-rose-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Conflict Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'border-slate-800 text-slate-900 bg-slate-100 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Audit History ({auditHistory.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'MASTER' && (
        <div className="space-y-4">
          {/* Department Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filter Department:</span>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-medium cursor-pointer"
              >
                <option value="ALL">All College Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-500 font-medium">
              Showing {filteredMasterSessions.length} lectures
            </span>
          </div>

          <WeeklyTimetable
            sessions={filteredMasterSessions}
            currentRole="ADMIN"
            onCancel={(s) => setSelectedSessionForCancel(s)}
            onReschedule={(s) => setSelectedSessionForReschedule(s)}
            title="College of Engineering Master Schedule"
            subtitle="As administrator, you can cancel or reschedule any lecture with override privilege."
          />
        </div>
      )}

      {activeTab === 'MERGED' && <MergedClassManager />}

      {activeTab === 'CLASSROOMS' && <ClassroomManagement />}

      {activeTab === 'CONFLICTS' && <ConflictReportView />}

      {activeTab === 'AUDIT' && <AuditHistoryView />}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />

      {/* Admin Cancel Modal */}
      <CancelModal
        isOpen={Boolean(selectedSessionForCancel)}
        onClose={() => setSelectedSessionForCancel(null)}
        session={selectedSessionForCancel}
        currentUser={currentUser}
      />

      {/* Admin Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(selectedSessionForReschedule)}
        onClose={() => setSelectedSessionForReschedule(null)}
        session={selectedSessionForReschedule}
        currentUser={currentUser}
      />
    </div>
  );
};
