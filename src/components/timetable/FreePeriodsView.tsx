/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle, AlertTriangle, Coffee, Sparkles, BookOpen, Search } from 'lucide-react';
import { DayOfWeek, StudentGroup } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { calculateFreePeriodsForGroup, CAMPUS_DAYS } from '../../services/schedulingEngine';
import { StatusBadge } from '../common/Badge';

interface FreePeriodsViewProps {
  studentGroup: StudentGroup;
  onSearchClassroomForSlot?: (day: DayOfWeek, startTime: string, endTime: string) => void;
}

export const FreePeriodsView: React.FC<FreePeriodsViewProps> = ({
  studentGroup,
  onSearchClassroomForSlot
}) => {
  const { context } = useKNUSTStore();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  const freeSlots = calculateFreePeriodsForGroup(studentGroup.id, selectedDay, context);

  // Today's lectures for context
  const daySessions = context.sessions
    .filter(s => s.studentGroupIds.includes(studentGroup.id) && s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);
  const freeHours = (totalFreeMinutes / 60).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/10 text-emerald-200">
                <Coffee className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-lg">Free Period & Study Gap Finder</h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Showing calculated available study hours for <span className="font-bold underline">{studentGroup.name}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs border border-white/10">
            <div>
              <div className="text-2xl font-black text-amber-300">{freeHours} hrs</div>
              <div className="text-[10px] text-emerald-200 uppercase font-medium">Free on {selectedDay}</div>
            </div>
          </div>
        </div>

        {/* Day Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-4 pt-3 border-t border-white/15">
          {CAMPUS_DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDay === day
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Free Periods Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Identified Free Windows for {selectedDay}</span>
              <span className="text-xs font-normal text-slate-500">({freeSlots.length} slots)</span>
            </h4>
            <span className="text-xs text-slate-500 font-medium">Academic Hours: 08:00 - 18:00</span>
          </div>

          {freeSlots.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No free gaps found</p>
              <p className="text-xs text-slate-400">Full back-to-back lectures on this day.</p>
            </div>
          ) : (
            freeSlots.map((slot, index) => {
              const isCancellation = slot.type === 'FREED_BY_CANCELLATION';
              const isWholeDay = slot.type === 'WHOLE_DAY_FREE';

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isCancellation
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : isWholeDay
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isCancellation
                        ? 'bg-rose-100 text-rose-700'
                        : isWholeDay
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isCancellation ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                          {Math.floor(slot.durationMinutes / 60)}h {slot.durationMinutes % 60}m duration
                        </span>
                        {isCancellation && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-200 text-rose-800">
                            Freed by Cancellation
                          </span>
                        )}
                        {isWholeDay && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-200 text-emerald-800">
                            Entire Day Free
                          </span>
                        )}
                      </div>

                      <p className="text-xs mt-1 text-slate-600">
                        {slot.note || 'Available study period.'}
                      </p>

                      {isCancellation && slot.cancelledSession && (
                        <p className="text-[11px] text-rose-700 mt-1 font-medium italic">
                          Originally scheduled course was cancelled by lecturer.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Room finder button during this slot */}
                  {onSearchClassroomForSlot && (
                    <button
                      onClick={() => onSearchClassroomForSlot(selectedDay, slot.startTime, slot.endTime)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Find Free Room</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Timeline for this Day */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 px-1">
            {selectedDay}&apos;s Scheduled Classes
          </h4>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {daySessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Coffee className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-medium text-slate-600">No scheduled classes</p>
                <p className="text-[11px] text-slate-400">Enjoy your study break!</p>
              </div>
            ) : (
              daySessions.map(session => {
                const room = context.classrooms.find(r => r.id === session.classroomId);
                const courses = context.courses.filter(c => session.courseIds.includes(c.id));
                const lecturer = context.lecturers.find(l => l.id === session.primaryLecturerId);

                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      session.status === 'CANCELLED'
                        ? 'bg-rose-50/50 border-rose-200 opacity-75'
                        : session.status === 'RESCHEDULED'
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {courses.map(c => c.code).join('/')}
                      </span>
                      <StatusBadge status={session.status} size="sm" />
                    </div>
                    <div className="text-slate-600 font-mono">
                      {session.startTime} - {session.endTime}
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center justify-between">
                      <span>Venue: {room?.name}</span>
                      <span>{lecturer?.title} {lecturer?.fullName.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
