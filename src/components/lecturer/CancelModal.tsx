/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, Clock, MapPin, Users, CheckCircle, Bell } from 'lucide-react';
import { LectureSession, UserRole } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { Modal } from '../common/Modal';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: LectureSession | null;
  currentUser: { id: string; name: string; role: UserRole };
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  session,
  currentUser
}) => {
  const { classrooms, courses, studentGroups, cancelLectureSession } = useKNUSTStore();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const room = classrooms.find(r => r.id === session.classroomId);
  const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
  const groups = studentGroups.filter(g => session.studentGroupIds.includes(g.id));

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancelling this lecture session.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = cancelLectureSession(session.id, reason.trim(), currentUser);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to cancel lecture session.');
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Lecture Session"
      subtitle="Release classroom booking and dispatch notification to all enrolled student groups"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Session details recap */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              {sessionCourses.map(c => c.code).join(' / ')}
            </span>
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Pending Cancellation
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{session.day}, {session.startTime} - {session.endTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{room?.name} ({room?.building})</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 pt-1 border-t border-slate-200/60">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Enrolled: {groups.map(g => g.name).join(', ')}</span>
          </div>
        </div>

        {/* Cancellation Reason input */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Reason for Cancellation <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Attending mandatory College of Engineering board meeting; review lecture slides on VClass."
            className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            This reason will be included in the automated student notification alert and timetable logs.
          </p>
        </div>

        {/* Notice Box */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] space-y-0.5">
            <p className="font-semibold text-amber-950">System Action Notice:</p>
            <p>1. Status will change to <span className="font-mono font-bold">CANCELLED</span> in all student timetables.</p>
            <p>2. Classroom <span className="font-bold">{room?.name}</span> will be immediately marked free for other bookings.</p>
            <p>3. This time slot will be classified as a &quot;Period freed by cancellation&quot; for affected students.</p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
