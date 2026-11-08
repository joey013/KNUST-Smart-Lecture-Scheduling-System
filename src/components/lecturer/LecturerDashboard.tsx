/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit3,
  XCircle,
  AlertTriangle,
  History,
  BookOpen,
  Building,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { LectureSession } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { WeeklyTimetable } from '../timetable/WeeklyTimetable';
import { CancelModal } from './CancelModal';
import { RescheduleModal } from './RescheduleModal';
import { ClassroomSearchModal } from '../student/ClassroomSearchModal';
import { StatusBadge } from '../common/Badge';

interface LecturerDashboardProps {
  selectedLecturerId: string;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  selectedLecturerId
}) => {
  const { lecturers, departments, courses, classrooms, studentGroups, lectureSessions, auditHistory } = useKNUSTStore();

  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'UPCOMING' | 'HISTORY' | 'ROOMS'>('WEEKLY');
  const [selectedSessionForCancel, setSelectedSessionForCancel] = useState<LectureSession | null>(null);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<LectureSession | null>(null);
  const [isRoomFinderOpen, setIsRoomFinderOpen] = useState(false);

  const currentLecturer = lecturers.find(l => l.id === selectedLecturerId) || lecturers[0];
  const currentDept = departments.find(d => d.id === currentLecturer.departmentId);

  // All sessions taught by this lecturer
  const lecturerSessions = lectureSessions.filter(
    s => s.primaryLecturerId === currentLecturer.id || s.secondaryLecturerIds?.includes(currentLecturer.id)
  );

  const activeSessions = lecturerSessions.filter(s => s.status !== 'CANCELLED');
  const cancelledSessions = lecturerSessions.filter(s => s.status === 'CANCELLED');
  const rescheduledSessions = lecturerSessions.filter(s => s.status === 'RESCHEDULED');

  const currentUser = {
    id: currentLecturer.id,
    name: `${currentLecturer.title} ${currentLecturer.fullName}`,
    role: 'LECTURER' as const
  };

  return (
    <div className="space-y-6">
      {/* Lecturer Profile & Hero Header */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <span>{currentDept?.name}</span>
              <span>•</span>
              <span>Faculty of Electrical and Computer Engineering</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              {currentLecturer.title} {currentLecturer.fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
              <span>{currentLecturer.email}</span>
              <span>•</span>
              <span>{currentLecturer.officeLocation || 'KNUST Faculty Offices'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRoomFinderOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer flex items-center gap-2"
            >
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Check Hall Availability</span>
            </button>
          </div>
        </div>

        {/* Teaching metrics */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Assigned Lectures</span>
            <span className="text-xl font-black text-white">{activeSessions.length}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Merged Cohorts</span>
            <span className="text-xl font-black text-indigo-300">{lecturerSessions.filter(s => s.isMerged).length}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Cancellations</span>
            <span className="text-xl font-black text-rose-300">{cancelledSessions.length}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 text-[11px] block">Rescheduled Slots</span>
            <span className="text-xl font-black text-amber-300">{rescheduledSessions.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('WEEKLY')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'WEEKLY'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Teaching Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'UPCOMING'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Upcoming Sessions ({activeSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-slate-800 text-slate-900 bg-slate-100 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>My Cancellation & Reschedule History</span>
          </button>
        </nav>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'WEEKLY' && (
        <WeeklyTimetable
          sessions={lecturerSessions}
          currentRole="LECTURER"
          currentUserId={currentLecturer.id}
          onCancel={(s) => setSelectedSessionForCancel(s)}
          onReschedule={(s) => setSelectedSessionForReschedule(s)}
          title={`Teaching Timetable: ${currentLecturer.title} ${currentLecturer.fullName}`}
          subtitle="Directly manage your own classes. Click 'Reschedule' to select alternative available halls, or 'Cancel' to release the room."
        />
      )}

      {activeTab === 'UPCOMING' && (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950">
            <h4 className="font-bold text-sm">Direct Lecturer Management Privilege</h4>
            <p className="mt-0.5 text-emerald-800">
              You are authorised to directly cancel or reschedule your assigned lecture sessions. All changes are validated in real-time by the conflict engine and dispatched to student devices immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => {
              const room = classrooms.find(r => r.id === session.classroomId);
              const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
              const groups = studentGroups.filter(g => session.studentGroupIds.includes(g.id));
              const totalStudents = groups.reduce((acc, g) => acc + g.population, 0);

              return (
                <div key={session.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900">
                        {sessionCourses.map(c => c.code).join(' / ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={session.status} size="sm" />
                        {session.isMerged && <StatusBadge status="MERGED" size="sm" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {session.title || sessionCourses.map(c => c.title).join('/')}
                    </p>

                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {session.day} {session.startTime} - {session.endTime}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {room?.name} ({room?.capacity} cap)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {groups.map(g => g.code).join(' + ')}
                        </span>
                        <span className="font-bold text-slate-800">{totalStudents} Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedSessionForReschedule(session)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reschedule Lecture</span>
                    </button>

                    <button
                      onClick={() => setSelectedSessionForCancel(session)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel Lecture</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Your Recent Lecture Management Audit Entries</h4>
          <div className="space-y-2">
            {auditHistory
              .filter(h => h.performedBy.id === currentLecturer.id || h.details.includes(currentLecturer.fullName))
              .map(entry => (
                <div key={entry.id} className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{entry.details}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 inline-block">Action: {entry.action}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      <CancelModal
        isOpen={Boolean(selectedSessionForCancel)}
        onClose={() => setSelectedSessionForCancel(null)}
        session={selectedSessionForCancel}
        currentUser={currentUser}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(selectedSessionForReschedule)}
        onClose={() => setSelectedSessionForReschedule(null)}
        session={selectedSessionForReschedule}
        currentUser={currentUser}
      />

      {/* Classroom Search Modal */}
      <ClassroomSearchModal
        isOpen={isRoomFinderOpen}
        onClose={() => setIsRoomFinderOpen(false)}
      />
    </div>
  );
};
