/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST Smart Class Scheduling System - Core Scheduling Engine
 * Implements strict conflict detection, merged session logic, capacity checks, and free period detection.
 */

import {
  Classroom,
  ConflictCheckResult,
  ConflictIssue,
  DayOfWeek,
  FreePeriodSlot,
  LectureSession,
  Lecturer,
  StudentGroup,
  Course
} from '../types';

export const CAMPUS_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CAMPUS_OPEN_HOUR = '07:00';
export const CAMPUS_CLOSE_HOUR = '20:00';

/**
 * Converts "HH:MM" string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes from midnight to "HH:MM" format
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Checks whether two time intervals [start1, end1) and [start2, end2) overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && e1 > s2;
}

export type { ConflictIssue } from '../types';
import { Department } from '../types';

export interface SchedulingContext {
  sessions: LectureSession[];
  classrooms: Classroom[];
  lecturers: Lecturer[];
  studentGroups: StudentGroup[];
  courses: Course[];
  departments: Department[];
}

/**
 * Validates a proposed or existing lecture session for all types of conflicts
 */
export function detectConflicts(
  target: {
    id?: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    classroomId: string;
    primaryLecturerId: string;
    studentGroupIds: string[];
    courseIds: string[];
    isMerged?: boolean;
    mergedGroupId?: string;
  },
  context: SchedulingContext,
  excludeSessionId?: string
): ConflictCheckResult {
  const issues: ConflictIssue[] = [];

  const startMin = timeToMinutes(target.startTime);
  const endMin = timeToMinutes(target.endTime);
  const campusOpenMin = timeToMinutes(CAMPUS_OPEN_HOUR);
  const campusCloseMin = timeToMinutes(CAMPUS_CLOSE_HOUR);

  // 1. Time Validity Checks
  if (startMin >= endMin) {
    issues.push({
      code: 'INVALID_TIME_RANGE',
      severity: 'ERROR',
      message: `Invalid time range: Start time (${target.startTime}) must be strictly before end time (${target.endTime}).`,
      suggestedAction: 'Please adjust the lecture start or end time.'
    });
  }

  if (startMin < campusOpenMin || endMin > campusCloseMin) {
    issues.push({
      code: 'INVALID_TIME_RANGE',
      severity: 'ERROR',
      message: `Lecture time (${target.startTime} - ${target.endTime}) is outside KNUST campus teaching hours (${CAMPUS_OPEN_HOUR} to ${CAMPUS_CLOSE_HOUR}).`,
      suggestedAction: 'Schedule within 07:00 to 20:00.'
    });
  }

  const durationMin = endMin - startMin;
  if (durationMin > 0 && durationMin < 30) {
    issues.push({
      code: 'INVALID_TIME_RANGE',
      severity: 'WARNING',
      message: `Lecture duration is only ${durationMin} minutes. Standard university periods are at least 1 to 2 hours.`,
      suggestedAction: 'Verify if a 30-minute lecture slot is intended.'
    });
  }

  // 2. Room Capacity vs Total Student Population Check
  const classroom = context.classrooms.find(r => r.id === target.classroomId);
  const participatingGroups = context.studentGroups.filter(g => target.studentGroupIds.includes(g.id));
  const totalStudentPopulation = participatingGroups.reduce((sum, g) => sum + (g.population || 0), 0);

  if (classroom) {
    if (classroom.capacity < totalStudentPopulation) {
      issues.push({
        code: 'CAPACITY_EXCEEDED',
        severity: 'ERROR',
        message: `Classroom capacity deficit: ${classroom.name} holds ${classroom.capacity} seats, but the combined student population is ${totalStudentPopulation} (${participatingGroups.map(g => `${g.code}: ${g.population}`).join(', ')}).`,
        conflictingEntityName: classroom.name,
        suggestedAction: `Select a larger hall such as CoE Great Hall (500 cap) or CCB Auditorium (400 cap) to accommodate ${totalStudentPopulation} students.`
      });
    }
  }

  // Active existing sessions to compare against
  // CRITICAL: Cancelled sessions do NOT cause conflicts because their slot and room are freed!
  const activeSessions = context.sessions.filter(s => {
    if (s.status === 'CANCELLED') return false;
    if (excludeSessionId && s.id === excludeSessionId) return false;
    if (target.id && s.id === target.id) return false;
    return true;
  });

  // 3. Overlap Checks against other active sessions on the same day
  for (const session of activeSessions) {
    if (session.day !== target.day) continue;

    // Do they overlap in time?
    if (!timeRangesOverlap(target.startTime, target.endTime, session.startTime, session.endTime)) {
      continue;
    }

    // Check if these two sessions are legitimately MERGED
    // If both belong to the same mergedGroupId, they are the SAME merged session - NOT a conflict!
    const isSameMergedGroup =
      Boolean(target.mergedGroupId) &&
      Boolean(session.mergedGroupId) &&
      target.mergedGroupId === session.mergedGroupId;

    if (isSameMergedGroup) {
      continue; // Legitimate merged session
    }

    // Find course codes for display in error messages
    const sessionCourseCodes = context.courses
      .filter(c => session.courseIds.includes(c.id))
      .map(c => c.code);

    // A. Classroom Conflict
    if (session.classroomId === target.classroomId) {
      const roomName = classroom?.name || 'Classroom';
      issues.push({
        code: 'ROOM_OVERLAP',
        severity: 'ERROR',
        message: `Classroom conflict: ${roomName} is already occupied by ${sessionCourseCodes.join('/') || 'another session'} from ${session.startTime} to ${session.endTime}.`,
        conflictingSessionId: session.id,
        conflictingCourseCodes: sessionCourseCodes,
        conflictingEntityName: roomName,
        suggestedAction: `Choose an alternative classroom or adjust the time slot.`
      });
    }

    // B. Lecturer Conflict
    if (session.primaryLecturerId === target.primaryLecturerId) {
      const lecturer = context.lecturers.find(l => l.id === target.primaryLecturerId);
      const lecturerName = lecturer ? `${lecturer.title} ${lecturer.fullName}` : 'Lecturer';
      issues.push({
        code: 'LECTURER_OVERLAP',
        severity: 'ERROR',
        message: `Lecturer schedule conflict: ${lecturerName} is already teaching ${sessionCourseCodes.join('/')} from ${session.startTime} to ${session.endTime}.`,
        conflictingSessionId: session.id,
        conflictingCourseCodes: sessionCourseCodes,
        conflictingEntityName: lecturerName,
        suggestedAction: `Assign another time slot or verify if this is an official merged lecture.`
      });
    }

    // C. Student Group Conflict
    const overlappingGroupIds = target.studentGroupIds.filter(gid => session.studentGroupIds.includes(gid));
    if (overlappingGroupIds.length > 0) {
      const overlappingGroups = context.studentGroups.filter(g => overlappingGroupIds.includes(g.id));
      const groupNames = overlappingGroups.map(g => g.name).join(', ');
      issues.push({
        code: 'GROUP_OVERLAP',
        severity: 'ERROR',
        message: `Student group timetable conflict: ${groupNames} already has ${sessionCourseCodes.join('/')} scheduled from ${session.startTime} to ${session.endTime}.`,
        conflictingSessionId: session.id,
        conflictingCourseCodes: sessionCourseCodes,
        conflictingEntityName: groupNames,
        suggestedAction: `Reschedule to an unoccupied time slot for ${groupNames}.`
      });
    }
  }

  return {
    hasConflicts: issues.some(i => i.severity === 'ERROR'),
    issues
  };
}

/**
 * Searches and categorizes all classrooms by availability for a given day and time slot
 */
export function findClassroomAvailability(
  day: DayOfWeek,
  startTime: string,
  endTime: string,
  requiredCapacity: number = 0,
  context: SchedulingContext,
  excludeSessionId?: string
): {
  availableClassrooms: Array<{
    classroom: Classroom;
    fitsCapacity: boolean;
    excessSeats: number;
  }>;
  occupiedClassrooms: Array<{
    classroom: Classroom;
    occupiedBy: LectureSession;
    courseCodes: string[];
    lecturerName: string;
  }>;
} {
  const availableClassrooms: Array<{
    classroom: Classroom;
    fitsCapacity: boolean;
    excessSeats: number;
  }> = [];

  const occupiedClassrooms: Array<{
    classroom: Classroom;
    occupiedBy: LectureSession;
    courseCodes: string[];
    lecturerName: string;
  }> = [];

  const activeSessions = context.sessions.filter(s => {
    if (s.status === 'CANCELLED') return false;
    if (excludeSessionId && s.id === excludeSessionId) return false;
    return s.day === day && timeRangesOverlap(startTime, endTime, s.startTime, s.endTime);
  });

  const occupiedRoomIds = new Map<string, LectureSession>();
  for (const s of activeSessions) {
    occupiedRoomIds.set(s.classroomId, s);
  }

  for (const room of context.classrooms) {
    const occupyingSession = occupiedRoomIds.get(room.id);
    if (occupyingSession) {
      const courseCodes = context.courses
        .filter(c => occupyingSession.courseIds.includes(c.id))
        .map(c => c.code);
      const lecturer = context.lecturers.find(l => l.id === occupyingSession.primaryLecturerId);
      occupiedClassrooms.push({
        classroom: room,
        occupiedBy: occupyingSession,
        courseCodes,
        lecturerName: lecturer ? `${lecturer.title} ${lecturer.fullName}` : 'Lecturer'
      });
    } else {
      const fitsCapacity = room.capacity >= requiredCapacity;
      const excessSeats = room.capacity - requiredCapacity;
      availableClassrooms.push({
        classroom: room,
        fitsCapacity,
        excessSeats
      });
    }
  }

  // Sort available rooms: rooms that fit capacity first, sorted by best fit (lowest non-negative excess)
  availableClassrooms.sort((a, b) => {
    if (a.fitsCapacity && !b.fitsCapacity) return -1;
    if (!a.fitsCapacity && b.fitsCapacity) return 1;
    return a.classroom.capacity - b.classroom.capacity;
  });

  return {
    availableClassrooms,
    occupiedClassrooms
  };
}

/**
 * Free period calculation engine for a specific student group or lecturer
 */
export function calculateFreePeriodsForGroup(
  groupId: string,
  day: DayOfWeek,
  context: SchedulingContext,
  dayStartHour = '08:00',
  dayEndHour = '18:00'
): FreePeriodSlot[] {
  const freeSlots: FreePeriodSlot[] = [];

  // Get all sessions relevant to this student group on this day
  const daySessions = context.sessions.filter(
    s => s.studentGroupIds.includes(groupId) && s.day === day
  );

  if (daySessions.length === 0) {
    return [
      {
        day,
        startTime: dayStartHour,
        endTime: dayEndHour,
        durationMinutes: timeToMinutes(dayEndHour) - timeToMinutes(dayStartHour),
        type: 'WHOLE_DAY_FREE',
        note: 'No lectures scheduled for this entire day.'
      }
    ];
  }

  // Identify sessions explicitly CANCELLED
  const cancelledSessions = daySessions.filter(s => s.status === 'CANCELLED');
  for (const cancelled of cancelledSessions) {
    const courses = context.courses.filter(c => cancelled.courseIds.includes(c.id)).map(c => c.code).join('/');
    freeSlots.push({
      day,
      startTime: cancelled.startTime,
      endTime: cancelled.endTime,
      durationMinutes: timeToMinutes(cancelled.endTime) - timeToMinutes(cancelled.startTime),
      type: 'FREED_BY_CANCELLATION',
      note: `Lecture cancelled: ${courses || 'Lecture'} (${cancelled.cancellationReason || 'No reason specified'})`,
      cancelledSession: cancelled
    });
  }

  // Now calculate natural gaps between active (SCHEDULED or RESCHEDULED) sessions
  const activeSessions = daySessions
    .filter(s => s.status !== 'CANCELLED')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let currentPointerMin = timeToMinutes(dayStartHour);
  const dayEndMin = timeToMinutes(dayEndHour);

  for (const session of activeSessions) {
    const sessionStartMin = timeToMinutes(session.startTime);
    const sessionEndMin = timeToMinutes(session.endTime);

    if (sessionStartMin > currentPointerMin) {
      // Gap detected!
      const gapDuration = sessionStartMin - currentPointerMin;
      if (gapDuration >= 30) {
        // Only count if gap is at least 30 mins
        freeSlots.push({
          day,
          startTime: minutesToTime(currentPointerMin),
          endTime: session.startTime,
          durationMinutes: gapDuration,
          type: 'NATURAL_FREE_GAP',
          note: `Free period between lectures (${gapDuration} mins)`
        });
      }
    }

    currentPointerMin = Math.max(currentPointerMin, sessionEndMin);
  }

  // Gap after last lecture until campus close
  if (currentPointerMin < dayEndMin) {
    const trailingGap = dayEndMin - currentPointerMin;
    if (trailingGap >= 30) {
      freeSlots.push({
        day,
        startTime: minutesToTime(currentPointerMin),
        endTime: dayEndHour,
        durationMinutes: trailingGap,
        type: 'NATURAL_FREE_GAP',
        note: `Free afternoon/evening slot (${trailingGap} mins)`
      });
    }
  }

  // Sort slots by start time
  return freeSlots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}
