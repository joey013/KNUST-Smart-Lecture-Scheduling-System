/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Coffee,
  AlertTriangle,
  ArrowRight,
  Layers,
  Search,
  BookOpen,
  History,
  Building,
  CheckCircle2,
  Users
} from 'lucide-react';
import { DayOfWeek, LectureSession, StudentGroup } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { WeeklyTimetable } from '../timetable/WeeklyTimetable';
import { FreePeriodsView } from '../timetable/FreePeriodsView';
import { ClassroomSearchModal } from './ClassroomSearchModal';
import { StatusBadge } from '../common/Badge';
import { CAMPUS_DAYS } from '../../services/schedulingEngine';

interface StudentDashboardProps {
  selectedGroupId: string;
  onOpenNotifications: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  selectedGroupId,
  onOpenNotifications
}) => {
  const { studentGroups, departments, courses, classrooms, lecturers, lectureSessions, notifications, auditHistory } = useKNUSTStore();

  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'FREE_PERIODS' | 'CANCELLED' | 'RESCHEDULED' | 'MERGED' | 'HISTORY'>('WEEKLY');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchDay, setSearchDay] = useState<DayOfWeek>('Monday');
  const [searchStart, setSearchStart] = useState('08:00');
  const [searchEnd, setSearchEnd] = useState('10:00');

  const currentGroup = studentGroups.find(g => g.id === selectedGroupId) || studentGroups[0];
  const currentDept = departments.find(d => d.id === currentGroup.departmentId);

  // Group's sessions
  const groupSessions = lectureSessions.filter(s => s.studentGroupIds.includes(currentGroup.id));

  // Today's day name (or default to Monday for demo)
  const todayDayName: DayOfWeek = 'Tuesday'; // realistic demo day
  const todaysSessions = groupSessions
    .filter(s => s.day === todayDayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const cancelledSessions = groupSessions.filter(s => s.status === 'CANCELLED');
  const rescheduledSessions = groupSessions.filter(s => s.status === 'RESCHEDULED');
  const mergedSessions = groupSessions.filter(s => s.isMerged);

  const handleOpenRoomSearch = (day: DayOfWeek, start: string, end: string) => {
    setSearchDay(day);
    setSearchStart(start);
    setSearchEnd(end);
    setIsSearchModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-2 backdrop-blur-xs">
              <span>{currentDept?.name}</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">{currentGroup.name}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Student Timetable & Live Class Hub
            </h2>
            <p className="text-xs text-emerald-100 max-w-xl mt-1">
              Real-time schedule updates, automated free period detection, cancellation alerts, and available study hall locator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-xs cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-900" />
              <span>Search Free Classrooms</span>
            </button>

            <button
              onClick={onOpenNotifications}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-xs cursor-pointer border border-white/20"
            >
              <span>Recent Alerts</span>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick KPI badges */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 p-2.5 rounded-xl">
            <span className="text-emerald-200 text-[11px] block">Weekly Lectures</span>
            <span className="text-lg font-black text-white">{groupSessions.filter(s => s.status !== 'CANCELLED').length}</span>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl">
            <span className="text-emerald-200 text-[11px] block">Merged Lectures</span>
            <span className="text-lg font-black text-indigo-300">{mergedSessions.length}</span>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl">
            <span className="text-emerald-200 text-[11px] block">Cancellations</span>
            <span className="text-lg font-black text-rose-300">{cancelledSessions.length}</span>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl">
            <span className="text-emerald-200 text-[11px] block">Rescheduled</span>
            <span className="text-lg font-black text-amber-300">{rescheduledSessions.length}</span>
          </div>
        </div>
      </div>

      {/* Today's Agenda Callout */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Today&apos;s Lectures ({todayDayName})
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {todaysSessions.length} sessions scheduled today
          </span>
        </div>

        {todaysSessions.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 text-xs">
            No classes scheduled for today. Check the Free Periods tab for open study times!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysSessions.map(session => {
              const room = classrooms.find(r => r.id === session.classroomId);
              const coursesList = courses.filter(c => session.courseIds.includes(c.id));
              const lecturer = lecturers.find(l => l.id === session.primaryLecturerId);

              return (
                <div
                  key={session.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                    session.status === 'CANCELLED'
                      ? 'bg-rose-50/50 border-rose-200'
                      : session.status === 'RESCHEDULED'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {coursesList.map(c => c.code).join('/')}
                      </span>
                      <StatusBadge status={session.status} size="sm" />
                    </div>
                    <p className="text-slate-600 font-medium truncate mt-0.5">
                      {session.title || coursesList.map(c => c.title).join('/')}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                    <span className="font-semibold text-slate-900">{session.startTime} - {session.endTime}</span>
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {room?.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
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
            <span>Weekly Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab('FREE_PERIODS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'FREE_PERIODS'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-4 h-4 text-emerald-600" />
            <span>Free Periods & Gaps</span>
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'border-rose-600 text-rose-800 bg-rose-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Cancelled Lectures ({cancelledSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RESCHEDULED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'RESCHEDULED'
                ? 'border-amber-600 text-amber-800 bg-amber-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Rescheduled ({rescheduledSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MERGED')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'MERGED'
                ? 'border-indigo-600 text-indigo-800 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Merged Classes ({mergedSessions.length})</span>
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
            <span>Audit History</span>
          </button>
        </nav>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'WEEKLY' && (
        <WeeklyTimetable
          sessions={groupSessions}
          currentRole="STUDENT"
          title={`${currentGroup.name} Master Timetable`}
          subtitle={`Official timetable for ${currentGroup.population} students enrolled in ${currentDept?.name}`}
        />
      )}

      {activeTab === 'FREE_PERIODS' && (
        <FreePeriodsView
          studentGroup={currentGroup}
          onSearchClassroomForSlot={handleOpenRoomSearch}
        />
      )}

      {activeTab === 'CANCELLED' && (
        <div className="space-y-3">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Notice on Cancelled Lectures</h4>
              <p className="mt-0.5 text-rose-800 leading-relaxed">
                Lectures listed below were officially cancelled by your lecturers or department administrators. You do not need to attend these sessions, and the rooms have been freed up.
              </p>
            </div>
          </div>

          {cancelledSessions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No cancelled lectures</p>
              <p className="text-xs text-slate-500">All scheduled lectures are active.</p>
            </div>
          ) : (
            cancelledSessions.map(session => {
              const room = classrooms.find(r => r.id === session.classroomId);
              const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
              const lecturer = lecturers.find(l => l.id === session.primaryLecturerId);

              return (
                <div key={session.id} className="p-4 bg-white rounded-xl border border-rose-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-rose-900 line-through">
                        {sessionCourses.map(c => c.code).join('/')}
                      </span>
                      <span className="text-xs text-slate-600">
                        {session.title || sessionCourses.map(c => c.title).join('/')}
                      </span>
                    </div>
                    <StatusBadge status="CANCELLED" size="sm" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                    <span className="font-bold">Reason: </span>
                    <span>{session.cancellationReason || 'No reason provided.'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Originally: {session.day} {session.startTime} - {session.endTime} ({room?.name})</span>
                    <span>Lecturer: {lecturer?.title} {lecturer?.fullName}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'RESCHEDULED' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Rescheduled Lectures</h4>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                The following lectures have been moved to new dates, times, or venues. Please note your new classroom assignment before reporting.
              </p>
            </div>
          </div>

          {rescheduledSessions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No rescheduled lectures</p>
              <p className="text-xs text-slate-500">All lectures are running on their original timetable slots.</p>
            </div>
          ) : (
            rescheduledSessions.map(session => {
              const newRoom = classrooms.find(r => r.id === session.classroomId);
              const oldRoom = classrooms.find(r => r.id === session.originalClassroomId);
              const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
              const lecturer = lecturers.find(l => l.id === session.primaryLecturerId);

              return (
                <div key={session.id} className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-base text-slate-900">
                        {sessionCourses.map(c => c.code).join('/')}
                      </span>
                      <span className="text-xs text-slate-600 ml-2">
                        {session.title || sessionCourses.map(c => c.title).join('/')}
                      </span>
                    </div>
                    <StatusBadge status="RESCHEDULED" size="sm" />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Original Schedule:</span>
                      <span className="line-through text-slate-600 font-medium">
                        {session.originalDay} {session.originalStartTime}-{session.originalEndTime}
                      </span>
                      <div className="text-[11px] text-slate-500">Room: {oldRoom?.name || 'Previous Room'}</div>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-bold block flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                        New Confirmed Schedule:
                      </span>
                      <span className="text-slate-900 font-bold">
                        {session.day} {session.startTime} - {session.endTime}
                      </span>
                      <div className="text-[11px] font-bold text-emerald-700">
                        New Room: {newRoom?.name} ({newRoom?.building})
                      </div>
                    </div>
                  </div>

                  {session.rescheduledReason && (
                    <p className="text-xs text-slate-600 italic">
                      Reason: {session.rescheduledReason}
                    </p>
                  )}

                  <div className="text-right text-[11px] text-slate-400">
                    Lecturer: {lecturer?.title} {lecturer?.fullName}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'MERGED' && (
        <div className="space-y-3">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-950 flex items-start gap-3">
            <Layers className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Combined / Merged Lectures</h4>
              <p className="mt-0.5 text-indigo-800 leading-relaxed">
                At KNUST, certain foundational courses are attended jointly with other engineering departments in large auditorium halls.
              </p>
            </div>
          </div>

          {mergedSessions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No merged classes</p>
              <p className="text-xs text-slate-500">Your group does not currently share combined sessions.</p>
            </div>
          ) : (
            mergedSessions.map(session => {
              const room = classrooms.find(r => r.id === session.classroomId);
              const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
              const partnerGroups = studentGroups.filter(g => session.studentGroupIds.includes(g.id));
              const totalStudents = partnerGroups.reduce((acc, g) => acc + g.population, 0);
              const lecturer = lecturers.find(l => l.id === session.primaryLecturerId);

              return (
                <div key={session.id} className="p-4 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-base text-slate-900">
                        {session.mergedTitle || session.title}
                      </span>
                      <div className="text-xs text-indigo-800 font-medium">
                        Courses: {sessionCourses.map(c => `${c.code} (${c.title})`).join(' • ')}
                      </div>
                    </div>
                    <StatusBadge status="MERGED" size="sm" />
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Attending Departments</span>
                      <span className="font-semibold text-slate-900">
                        {partnerGroups.map(g => `${g.name} (${g.population})`).join(' + ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[11px] block">Venue & Capacity</span>
                      <span className="font-semibold text-slate-900">
                        {room?.name} (Cap: {room?.capacity} seats / {totalStudents} students)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[11px] block">Day & Time</span>
                      <span className="font-semibold text-slate-900">
                        {session.day} {session.startTime} - {session.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    Lead Lecturer: {lecturer?.title} {lecturer?.fullName}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Scheduling Audit Log for Your Courses</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditHistory.map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-900">{entry.details}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Action: {entry.action} • By: {entry.performedBy.name} ({entry.performedBy.role})
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classroom Search Modal */}
      <ClassroomSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialDay={searchDay}
        initialStartTime={searchStart}
        initialEndTime={searchEnd}
      />
    </div>
  );
};
