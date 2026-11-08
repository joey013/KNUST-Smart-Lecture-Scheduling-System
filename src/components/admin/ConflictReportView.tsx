/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, ShieldCheck, RefreshCw, AlertTriangle, ArrowRight, MapPin, Users } from 'lucide-react';
import { useKNUSTStore } from '../../db/store';
import { detectConflicts } from '../../services/schedulingEngine';
import { ConflictIssue } from '../../types';

export const ConflictReportView: React.FC = () => {
  const { lectureSessions, classrooms, courses, lecturers, studentGroups, context } = useKNUSTStore();
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString());

  // Run full conflict diagnostic across all active sessions
  const activeSessions = lectureSessions.filter(s => s.status !== 'CANCELLED');
  const allIssues: Array<{ session: typeof activeSessions[0]; issue: ConflictIssue }> = [];

  for (const session of activeSessions) {
    const res = detectConflicts(
      {
        id: session.id,
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        classroomId: session.classroomId,
        primaryLecturerId: session.primaryLecturerId,
        studentGroupIds: session.studentGroupIds,
        courseIds: session.courseIds,
        isMerged: session.isMerged,
        mergedGroupId: session.mergedGroupId
      },
      context,
      session.id // Don't conflict with self
    );

    for (const issue of res.issues) {
      allIssues.push({ session, issue });
    }
  }

  const handleRescan = () => {
    setLastScanTime(new Date().toLocaleTimeString());
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
        allIssues.length === 0
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : 'bg-rose-50/80 border-rose-200 text-rose-950'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl ${allIssues.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {allIssues.length === 0 ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-rose-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base">
              {allIssues.length === 0
                ? 'Timetable Integrity Verified: Zero Conflicts Detected'
                : `Active Timetable Alerts: ${allIssues.length} Potential Issue(s)`}
            </h3>
            <p className="text-xs mt-0.5 opacity-80">
              Scanned {activeSessions.length} active lecture sessions across {classrooms.length} campus lecture halls. Last checked at {lastScanTime}.
            </p>
          </div>
        </div>

        <button
          onClick={handleRescan}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Re-scan Database</span>
        </button>
      </div>

      {/* Issues List or Clean State */}
      {allIssues.length === 0 ? (
        <div className="p-10 bg-white rounded-xl border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-800 text-base">Clean Scheduling Engine State</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All rooms have sufficient capacity for enrolled student populations, no lecturers are double-booked, and merged cohorts are properly established.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Detected Issues ({allIssues.length})</h4>
          {allIssues.map(({ session, issue }, index) => {
            const room = classrooms.find(r => r.id === session.classroomId);
            const coursesList = courses.filter(c => session.courseIds.includes(c.id));
            const lecturer = lecturers.find(l => l.id === session.primaryLecturerId);

            return (
              <div
                key={index}
                className="p-4 bg-white rounded-xl border border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {coursesList.map(c => c.code).join('/')}
                    </span>
                    <span className="font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                      {issue.code}
                    </span>
                  </div>

                  <p className="text-rose-800 font-medium">{issue.message}</p>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px] pt-1">
                    <span>{session.day} {session.startTime}-{session.endTime}</span>
                    <span>•</span>
                    <span>Hall: {room?.name}</span>
                    <span>•</span>
                    <span>Lecturer: {lecturer?.title} {lecturer?.fullName}</span>
                  </div>
                </div>

                {issue.suggestedAction && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] max-w-xs shrink-0">
                    <span className="font-bold block">Recommended Action:</span>
                    {issue.suggestedAction}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
