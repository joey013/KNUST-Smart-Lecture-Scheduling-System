/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, MapPin, Users, BookOpen, AlertTriangle, ArrowRight, UserCheck, Edit3, XCircle } from 'lucide-react';
import { LectureSession, UserRole } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { StatusBadge } from '../common/Badge';

interface TimetableCardProps {
  session: LectureSession;
  currentRole: UserRole;
  currentUserId?: string;
  onCancel?: (session: LectureSession) => void;
  onReschedule?: (session: LectureSession) => void;
  compact?: boolean;
}

export const TimetableCard: React.FC<TimetableCardProps> = ({
  session,
  currentRole,
  currentUserId,
  onCancel,
  onReschedule,
  compact = false
}) => {
  const { classrooms, courses, lecturers, studentGroups } = useKNUSTStore();

  const classroom = classrooms.find(r => r.id === session.classroomId);
  const oldClassroom = session.originalClassroomId ? classrooms.find(r => r.id === session.originalClassroomId) : null;
  const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
  const primaryLecturer = lecturers.find(l => l.id === session.primaryLecturerId);
  const groups = studentGroups.filter(g => session.studentGroupIds.includes(g.id));
  const totalStudents = groups.reduce((acc, g) => acc + (g.population || 0), 0);

  // Can the current user manage this lecture?
  // Admin can manage everything. Lecturer can manage lectures assigned to them.
  const canManage =
    currentRole === 'ADMIN' ||
    (currentRole === 'LECTURER' && session.primaryLecturerId === currentUserId);

  const isCancelled = session.status === 'CANCELLED';
  const isRescheduled = session.status === 'RESCHEDULED';
  const isMerged = session.isMerged;

  return (
    <div
      className={`rounded-xl border transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
        isCancelled
          ? 'bg-rose-50/40 border-rose-200 text-rose-950 dark:bg-rose-950/20'
          : isRescheduled
          ? 'bg-amber-50/40 border-amber-200 text-amber-950 dark:bg-amber-950/20'
          : isMerged
          ? 'bg-indigo-50/40 border-indigo-200 text-slate-900 dark:bg-indigo-950/20'
          : 'bg-white border-slate-200 text-slate-900 hover:border-emerald-300 hover:shadow-xs'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Top Banner / Indicators */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={session.status} size="sm" />
          {isMerged && <StatusBadge status="MERGED" size="sm" />}
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{session.startTime} - {session.endTime}</span>
        </div>
      </div>

      {/* Course Title & Codes */}
      <div className="mt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {sessionCourses.map(c => (
            <span
              key={c.id}
              className={`font-black tracking-tight ${compact ? 'text-sm' : 'text-base'} ${
                isCancelled ? 'line-through text-rose-800' : 'text-slate-900'
              }`}
            >
              {c.code}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5 font-medium">
          {session.title || sessionCourses.map(c => c.title).join(' / ') || 'Lecture'}
        </p>
      </div>

      {/* Rescheduled details alert box */}
      {isRescheduled && (
        <div className="mt-2 p-2 rounded-lg bg-amber-100/70 border border-amber-300 text-xs text-amber-900 space-y-0.5">
          <div className="flex items-center gap-1 font-semibold text-amber-950">
            <ArrowRight className="w-3 h-3 text-amber-700" />
            <span>Moved from {session.originalDay} {session.originalStartTime}-{session.originalEndTime}</span>
          </div>
          {oldClassroom && (
            <p className="text-[11px] text-amber-800 pl-4">
              Original venue: {oldClassroom.name}
            </p>
          )}
          {session.rescheduledReason && (
            <p className="text-[11px] text-amber-800 italic pl-4">
              Reason: {session.rescheduledReason}
            </p>
          )}
        </div>
      )}

      {/* Cancellation reason box */}
      {isCancelled && session.cancellationReason && (
        <div className="mt-2 p-2 rounded-lg bg-rose-100/70 border border-rose-300 text-xs text-rose-900 space-y-0.5">
          <div className="flex items-center gap-1 font-semibold text-rose-950">
            <AlertTriangle className="w-3 h-3 text-rose-700" />
            <span>Lecture Cancelled</span>
          </div>
          <p className="text-[11px] text-rose-800 italic pl-4">
            Reason: {session.cancellationReason}
          </p>
          <p className="text-[10px] text-rose-700 pl-4 font-medium">
            Room {classroom?.name} slot is now free.
          </p>
        </div>
      )}

      {/* Venue, Capacity, Groups, Lecturer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
        {/* Classroom */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{classroom ? classroom.name : 'Unassigned Room'}</span>
            <span className="text-[11px] text-slate-400">({classroom?.building})</span>
          </div>
          {classroom && (
            <span
              className={`text-[11px] font-mono font-medium px-1.5 py-0.2 rounded ${
                classroom.capacity < totalStudents
                  ? 'bg-rose-100 text-rose-700 font-bold'
                  : 'text-slate-500 bg-slate-100'
              }`}
              title={`Classroom Capacity: ${classroom.capacity} seats | Expected Students: ${totalStudents}`}
            >
              Cap: {classroom.capacity}
            </span>
          )}
        </div>

        {/* Lecturer */}
        <div className="flex items-center gap-1.5 text-slate-700">
          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {primaryLecturer ? `${primaryLecturer.title} ${primaryLecturer.fullName}` : 'Lecturer not assigned'}
          </span>
        </div>

        {/* Student Groups & Population */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 truncate">
            <Users className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{groups.map(g => g.code).join(' + ')}</span>
          </div>
          <span className="font-semibold text-slate-700">
            {totalStudents} students
          </span>
        </div>
      </div>

      {/* Action buttons for Lecturer / Admin */}
      {canManage && (
        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
          {!isCancelled && (
            <>
              <button
                type="button"
                onClick={() => onReschedule && onReschedule(session)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-amber-600" />
                <span>Reschedule</span>
              </button>

              <button
                type="button"
                onClick={() => onCancel && onCancel(session)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <XCircle className="w-3 h-3 text-rose-600" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {isCancelled && (
            <span className="text-[11px] text-rose-600 font-medium italic">
              Cancelled by lecturer
            </span>
          )}
        </div>
      )}
    </div>
  );
};
