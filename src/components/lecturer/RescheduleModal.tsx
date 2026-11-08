/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Check,
  Search,
  Building
} from 'lucide-react';
import { Classroom, ConflictCheckResult, DayOfWeek, LectureSession, UserRole } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { CAMPUS_DAYS, findClassroomAvailability, detectConflicts } from '../../services/schedulingEngine';
import { Modal } from '../common/Modal';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: LectureSession | null;
  currentUser: { id: string; name: string; role: UserRole };
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  session,
  currentUser
}) => {
  const { classrooms, courses, studentGroups, rescheduleLectureSession, context } = useKNUSTStore();

  const [proposedDay, setProposedDay] = useState<DayOfWeek>('Monday');
  const [proposedStartTime, setProposedStartTime] = useState('10:00');
  const [proposedEndTime, setProposedEndTime] = useState('12:00');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with session parameters when opened
  useEffect(() => {
    if (session) {
      setProposedDay(session.day);
      setProposedStartTime(session.startTime);
      setProposedEndTime(session.endTime);
      setSelectedClassroomId(session.classroomId);
      setReason(session.rescheduledReason || '');
      setConflictResult(null);
      setGeneralError(null);
    }
  }, [session]);

  if (!session) return null;

  const currentRoom = classrooms.find(r => r.id === session.classroomId);
  const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
  const groups = studentGroups.filter(g => session.studentGroupIds.includes(g.id));
  const totalStudents = groups.reduce((acc, g) => acc + (g.population || 0), 0);

  // Real-time classroom scan for proposed day and time window
  const availability = findClassroomAvailability(
    proposedDay,
    proposedStartTime,
    proposedEndTime,
    totalStudents,
    context,
    session.id // Exclude current session
  );

  // Live conflict validation whenever user changes day, time, or selected classroom
  const runLiveValidation = (roomId: string) => {
    if (!roomId) return;
    const result = detectConflicts(
      {
        id: session.id,
        day: proposedDay,
        startTime: proposedStartTime,
        endTime: proposedEndTime,
        classroomId: roomId,
        primaryLecturerId: session.primaryLecturerId,
        studentGroupIds: session.studentGroupIds,
        courseIds: session.courseIds,
        isMerged: session.isMerged,
        mergedGroupId: session.mergedGroupId
      },
      context,
      session.id
    );
    setConflictResult(result);
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedClassroomId(roomId);
    runLiveValidation(roomId);
  };

  const handleDayOrTimeChange = (newDay: DayOfWeek, newStart: string, newEnd: string) => {
    setProposedDay(newDay);
    setProposedStartTime(newStart);
    setProposedEndTime(newEnd);

    // If currently selected room is occupied in new slot, reset it
    const newAvail = findClassroomAvailability(newDay, newStart, newEnd, totalStudents, context, session.id);
    const stillAvailable = newAvail.availableClassrooms.some(r => r.classroom.id === selectedClassroomId);
    if (!stillAvailable) {
      setSelectedClassroomId('');
      setConflictResult(null);
    } else {
      // re-validate with current room
      const res = detectConflicts(
        {
          id: session.id,
          day: newDay,
          startTime: newStart,
          endTime: newEnd,
          classroomId: selectedClassroomId,
          primaryLecturerId: session.primaryLecturerId,
          studentGroupIds: session.studentGroupIds,
          courseIds: session.courseIds,
          isMerged: session.isMerged,
          mergedGroupId: session.mergedGroupId
        },
        context,
        session.id
      );
      setConflictResult(res);
    }
  };

  const handleConfirmReschedule = () => {
    if (!selectedClassroomId) {
      setGeneralError('Please personally select a suitable available classroom.');
      return;
    }

    if (!reason.trim()) {
      setGeneralError('Please enter a brief reason for rescheduling.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    const res = rescheduleLectureSession({
      sessionId: session.id,
      newDay: proposedDay,
      newStartTime: proposedStartTime,
      newEndTime: proposedEndTime,
      newClassroomId: selectedClassroomId,
      reason: reason.trim(),
      user: currentUser
    });

    setIsSubmitting(false);

    if (!res.success) {
      if (res.conflictResult) {
        setConflictResult(res.conflictResult);
      }
      setGeneralError(res.error || 'Failed to reschedule lecture.');
      return;
    }

    onClose();
  };

  const selectedRoomObj = classrooms.find(r => r.id === selectedClassroomId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Lecture Session"
      subtitle="Step-by-step classroom selection and automated conflict verification"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Step 1: Original Lecture Summary */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-900 text-sm block">
              {sessionCourses.map(c => c.code).join(' / ')}: {session.title || sessionCourses.map(c => c.title).join(' / ')}
            </span>
            <div className="flex items-center gap-2 text-slate-600 mt-1">
              <span>Original Slot:</span>
              <span className="font-semibold text-slate-800">{session.day} {session.startTime} - {session.endTime}</span>
              <span>•</span>
              <span>Venue:</span>
              <span className="font-semibold text-slate-800">{currentRoom?.name}</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-100 text-emerald-800">
              {totalStudents} Enrolled Students ({groups.map(g => g.code).join(', ')})
            </span>
          </div>
        </div>

        {/* Step 2: Propose Day & Time Window */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Step 2: Choose Proposed Day & Time</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Proposed Day</label>
              <select
                value={proposedDay}
                onChange={(e) => handleDayOrTimeChange(e.target.value as DayOfWeek, proposedStartTime, proposedEndTime)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
              >
                {CAMPUS_DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Start Time (24h)</label>
              <input
                type="time"
                value={proposedStartTime}
                onChange={(e) => handleDayOrTimeChange(proposedDay, e.target.value, proposedEndTime)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">End Time (24h)</label>
              <input
                type="time"
                value={proposedEndTime}
                onChange={(e) => handleDayOrTimeChange(proposedDay, proposedStartTime, e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Step 3 & 4: Browse and Personally Select Available Classroom */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Step 3: Personally Select Available Classroom</span>
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Required Capacity: <strong className="text-emerald-700">{totalStudents} seats</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {availability.availableClassrooms.map(({ classroom, fitsCapacity, excessSeats }) => {
              const isSelected = selectedClassroomId === classroom.id;

              return (
                <div
                  key={classroom.id}
                  onClick={() => handleSelectRoom(classroom.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500 shadow-sm'
                      : fitsCapacity
                      ? 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                      : 'border-amber-200 bg-amber-50/40 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {classroom.name}
                      </span>
                      <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        fitsCapacity ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {classroom.capacity} seats
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{classroom.building}</p>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className={fitsCapacity ? 'text-emerald-700 font-medium' : 'text-amber-700 font-bold'}>
                      {fitsCapacity ? `+${excessSeats} extra seats` : `Deficit: ${excessSeats} seats`}
                    </span>
                    {isSelected && (
                      <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Occupied Notice */}
          {availability.occupiedClassrooms.length > 0 && (
            <p className="text-[11px] text-slate-400 italic">
              Note: {availability.occupiedClassrooms.length} occupied lecture hall(s) are blocked by the scheduling engine to prevent double booking.
            </p>
          )}
        </div>

        {/* Reason for Rescheduling */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Reason for Rescheduling <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Laboratory equipment installation; makeup lecture for week 4."
            className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Step 5: Conflict Engine Results Diagnostic Box */}
        {conflictResult && (
          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            conflictResult.hasConflicts
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {conflictResult.hasConflicts ? (
                <>
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Scheduling Conflict Detected! Cannot Confirm.</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Conflict Engine Verified: All Parameters Valid!</span>
                </>
              )}
            </div>

            {conflictResult.issues.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-xs pt-1 pl-1">
                {conflictResult.issues.map((issue, idx) => (
                  <li key={idx} className={issue.severity === 'ERROR' ? 'text-rose-800 font-medium' : 'text-amber-800'}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}

            {!conflictResult.hasConflicts && selectedRoomObj && (
              <p className="text-emerald-800 text-xs">
                No overlapping lecturer, room, or student group commitments. Classroom {selectedRoomObj.name} has sufficient capacity ({selectedRoomObj.capacity} seats for {totalStudents} students).
              </p>
            )}
          </div>
        )}

        {generalError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            {generalError}
          </div>
        )}

        {/* Footer Confirmation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {selectedRoomObj && (
              <span>New Venue: <strong className="text-slate-900">{selectedRoomObj.name}</strong> ({proposedDay} {proposedStartTime}-{proposedEndTime})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReschedule}
              disabled={isSubmitting || Boolean(conflictResult?.hasConflicts) || !selectedClassroomId}
              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                conflictResult?.hasConflicts || !selectedClassroomId
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Validating & Saving...' : 'Confirm & Notify Students'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
