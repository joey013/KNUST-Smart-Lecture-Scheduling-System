/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST Smart Class Scheduling System - Relational State & Data Store
 * Provides full relational persistence, conflict-validated mutations,
 * audit logging, and reactive subscriptions.
 */

import { useState, useEffect } from 'react';
import {
  Classroom,
  ConflictCheckResult,
  Course,
  DayOfWeek,
  Department,
  LectureSession,
  Lecturer,
  NotificationItem,
  SchedulingHistoryRecord,
  StudentGroup,
  UserRole
} from '../types';
import {
  INITIAL_AUDIT_HISTORY,
  INITIAL_CLASSROOMS,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_LECTURE_SESSIONS,
  INITIAL_LECTURERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STUDENT_GROUPS
} from './initialData';
import { detectConflicts, SchedulingContext } from '../services/schedulingEngine';

const STORAGE_KEY = 'knust_scheduling_store_v1';

export interface AppStoreData {
  departments: Department[];
  studentGroups: StudentGroup[];
  courses: Course[];
  lecturers: Lecturer[];
  classrooms: Classroom[];
  lectureSessions: LectureSession[];
  notifications: NotificationItem[];
  auditHistory: SchedulingHistoryRecord[];
}

function loadInitialState(): AppStoreData {
  if (typeof window === 'undefined') {
    return {
      departments: INITIAL_DEPARTMENTS,
      studentGroups: INITIAL_STUDENT_GROUPS,
      courses: INITIAL_COURSES,
      lecturers: INITIAL_LECTURERS,
      classrooms: INITIAL_CLASSROOMS,
      lectureSessions: INITIAL_LECTURE_SESSIONS,
      notifications: INITIAL_NOTIFICATIONS,
      auditHistory: INITIAL_AUDIT_HISTORY
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.departments && parsed.lectureSessions && parsed.classrooms) {
        return parsed;
      }
    }
  } catch {
    console.warn('Failed to parse cached KNUST scheduling data from localStorage. Falling back to fresh sample data.');
  }

  return {
    departments: INITIAL_DEPARTMENTS,
    studentGroups: INITIAL_STUDENT_GROUPS,
    courses: INITIAL_COURSES,
    lecturers: INITIAL_LECTURERS,
    classrooms: INITIAL_CLASSROOMS,
    lectureSessions: INITIAL_LECTURE_SESSIONS,
    notifications: INITIAL_NOTIFICATIONS,
    auditHistory: INITIAL_AUDIT_HISTORY
  };
}

class KNUSTStore {
  private data: AppStoreData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = loadInitialState();
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to persist store to localStorage', e);
      }
    }
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getData(): AppStoreData {
    return this.data;
  }

  public getContext(): SchedulingContext {
    return {
      sessions: this.data.lectureSessions,
      classrooms: this.data.classrooms,
      lecturers: this.data.lecturers,
      studentGroups: this.data.studentGroups,
      courses: this.data.courses,
      departments: this.data.departments
    };
  }

  public resetToSampleData() {
    this.data = {
      departments: [...INITIAL_DEPARTMENTS],
      studentGroups: [...INITIAL_STUDENT_GROUPS],
      courses: [...INITIAL_COURSES],
      lecturers: [...INITIAL_LECTURERS],
      classrooms: [...INITIAL_CLASSROOMS],
      lectureSessions: [...INITIAL_LECTURE_SESSIONS],
      notifications: [...INITIAL_NOTIFICATIONS],
      auditHistory: [...INITIAL_AUDIT_HISTORY]
    };
    this.persist();
  }

  public importDatabaseJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.lectureSessions || !parsed.classrooms || !parsed.departments) {
        return { success: false, error: 'Invalid database backup JSON schema.' };
      }
      this.data = {
        departments: parsed.departments || [],
        studentGroups: parsed.studentGroups || [],
        courses: parsed.courses || [],
        lecturers: parsed.lecturers || [],
        classrooms: parsed.classrooms || [],
        lectureSessions: parsed.lectureSessions || [],
        notifications: parsed.notifications || [],
        auditHistory: parsed.auditHistory || []
      };
      this.persist();
      return { success: true };
    } catch {
      return { success: false, error: 'Malformed JSON payload.' };
    }
  }

  // --- CLASSROOM MANAGEMENT ---
  public addClassroom(classroom: Omit<Classroom, 'id'>): Classroom {
    const id = `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRoom: Classroom = { ...classroom, id };
    this.data.classrooms.push(newRoom);
    this.persist();
    return newRoom;
  }

  public updateClassroom(id: string, updates: Partial<Classroom>): boolean {
    const idx = this.data.classrooms.findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.classrooms[idx] = { ...this.data.classrooms[idx], ...updates };
    this.persist();
    return true;
  }

  public deleteClassroom(id: string): { success: boolean; error?: string } {
    // Check if room is used by active scheduled sessions
    const activeUse = this.data.lectureSessions.find(
      s => s.classroomId === id && s.status !== 'CANCELLED'
    );
    if (activeUse) {
      return {
        success: false,
        error: `Cannot delete classroom: It is currently assigned to an active lecture session.`
      };
    }
    this.data.classrooms = this.data.classrooms.filter(r => r.id !== id);
    this.persist();
    return { success: true };
  }

  // --- LECTURE SESSION CANCELLATION ---
  public cancelLectureSession(
    sessionId: string,
    reason: string,
    cancelledBy: { id: string; name: string; role: UserRole }
  ): { success: boolean; error?: string } {
    const sessionIndex = this.data.lectureSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return { success: false, error: 'Lecture session not found.' };
    }

    const session = this.data.lectureSessions[sessionIndex];

    // Permission check: Admin or the primary lecturer can cancel
    if (cancelledBy.role !== 'ADMIN' && session.primaryLecturerId !== cancelledBy.id) {
      return {
        success: false,
        error: 'Unauthorized: Lecturers can only cancel their own assigned lecture sessions.'
      };
    }

    if (session.status === 'CANCELLED') {
      return { success: false, error: 'Lecture session is already cancelled.' };
    }

    const updatedSession: LectureSession = {
      ...session,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledByUserId: cancelledBy.id
    };

    this.data.lectureSessions[sessionIndex] = updatedSession;

    // Room info & course codes for message
    const room = this.data.classrooms.find(r => r.id === session.classroomId);
    const courses = this.data.courses.filter(c => session.courseIds.includes(c.id));
    const courseCodes = courses.map(c => c.code);

    // Create Audit History
    const historyEntry: SchedulingHistoryRecord = {
      id: `hist-${Date.now()}`,
      sessionId: session.id,
      action: 'CANCELLED',
      timestamp: new Date().toISOString(),
      performedBy: cancelledBy,
      details: `Cancelled ${courseCodes.join('/') || 'Lecture'} on ${session.day} ${session.startTime}-${session.endTime} (${room?.name || 'Room'}). Reason: ${reason}`,
      previousState: { status: session.status },
      newState: { status: 'CANCELLED', cancellationReason: reason }
    };
    this.data.auditHistory.unshift(historyEntry);

    // Emit In-App Notification to enrolled student groups
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'CANCELLATION',
      title: `Lecture Cancelled: ${courseCodes.join(' / ')}`,
      message: `${courseCodes.join(' / ')} scheduled on ${session.day} at ${session.startTime} - ${session.endTime} (${room?.name || 'Classroom'}) has been cancelled.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedSessionId: session.id,
      courseCodes,
      targetDepartmentIds: courses.map(c => c.departmentId),
      targetGroupIds: session.studentGroupIds,
      authorName: cancelledBy.name,
      authorRole: cancelledBy.role,
      details: {
        originalTime: `${session.day} ${session.startTime} - ${session.endTime}`,
        originalRoom: room?.name || 'Room',
        reason
      }
    };
    this.data.notifications.unshift(notif);

    this.persist();
    return { success: true };
  }

  // --- LECTURE SESSION RESCHEDULING ---
  public rescheduleLectureSession(params: {
    sessionId: string;
    newDay: DayOfWeek;
    newStartTime: string;
    newEndTime: string;
    newClassroomId: string;
    reason: string;
    user: { id: string; name: string; role: UserRole };
  }): { success: boolean; conflictResult?: ConflictCheckResult; error?: string } {
    const sessionIndex = this.data.lectureSessions.findIndex(s => s.id === params.sessionId);
    if (sessionIndex === -1) {
      return { success: false, error: 'Lecture session not found.' };
    }

    const session = this.data.lectureSessions[sessionIndex];

    // Authorization check
    if (params.user.role !== 'ADMIN' && session.primaryLecturerId !== params.user.id) {
      return {
        success: false,
        error: 'Unauthorized: Lecturers can only reschedule their own assigned lecture sessions.'
      };
    }

    // Run strict conflict detection engine for the proposed new slot
    const conflictResult = detectConflicts(
      {
        id: session.id,
        day: params.newDay,
        startTime: params.newStartTime,
        endTime: params.newEndTime,
        classroomId: params.newClassroomId,
        primaryLecturerId: session.primaryLecturerId,
        studentGroupIds: session.studentGroupIds,
        courseIds: session.courseIds,
        isMerged: session.isMerged,
        mergedGroupId: session.mergedGroupId
      },
      this.getContext(),
      session.id // Exclude self during validation
    );

    if (conflictResult.hasConflicts) {
      return {
        success: false,
        conflictResult,
        error: 'Cannot reschedule: Conflicts were detected with the proposed time or classroom.'
      };
    }

    // Save previous state for history
    const oldDay = session.originalDay || session.day;
    const oldStartTime = session.originalStartTime || session.startTime;
    const oldEndTime = session.originalEndTime || session.endTime;
    const oldClassroomId = session.originalClassroomId || session.classroomId;

    const oldRoom = this.data.classrooms.find(r => r.id === session.classroomId);
    const newRoom = this.data.classrooms.find(r => r.id === params.newClassroomId);
    const courses = this.data.courses.filter(c => session.courseIds.includes(c.id));
    const courseCodes = courses.map(c => c.code);

    const updatedSession: LectureSession = {
      ...session,
      day: params.newDay,
      startTime: params.newStartTime,
      endTime: params.newEndTime,
      classroomId: params.newClassroomId,
      status: 'RESCHEDULED',
      originalDay: oldDay,
      originalStartTime: oldStartTime,
      originalEndTime: oldEndTime,
      originalClassroomId: oldClassroomId,
      rescheduledReason: params.reason,
      rescheduledAt: new Date().toISOString()
    };

    this.data.lectureSessions[sessionIndex] = updatedSession;

    // Add Audit History
    const historyEntry: SchedulingHistoryRecord = {
      id: `hist-${Date.now()}`,
      sessionId: session.id,
      action: 'RESCHEDULED',
      timestamp: new Date().toISOString(),
      performedBy: params.user,
      details: `Rescheduled ${courseCodes.join('/')} from ${oldDay} ${oldStartTime}-${oldEndTime} (${oldRoom?.name}) to ${params.newDay} ${params.newStartTime}-${params.newEndTime} (${newRoom?.name}). Reason: ${params.reason}`,
      previousState: {
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        classroomId: session.classroomId
      },
      newState: {
        day: params.newDay,
        startTime: params.newStartTime,
        endTime: params.newEndTime,
        classroomId: params.newClassroomId
      }
    };
    this.data.auditHistory.unshift(historyEntry);

    // Emit In-App Notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'RESCHEDULE',
      title: `Lecture Rescheduled: ${courseCodes.join(' / ')}`,
      message: `${courseCodes.join(' / ')} has been moved to ${params.newDay} at ${params.newStartTime} - ${params.newEndTime} in ${newRoom?.name || 'Classroom'}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedSessionId: session.id,
      courseCodes,
      targetDepartmentIds: courses.map(c => c.departmentId),
      targetGroupIds: session.studentGroupIds,
      authorName: params.user.name,
      authorRole: params.user.role,
      details: {
        originalTime: `${oldDay} ${oldStartTime} - ${oldEndTime}`,
        originalRoom: oldRoom?.name || 'Room',
        newTime: `${params.newDay} ${params.newStartTime} - ${params.newEndTime}`,
        newRoom: newRoom?.name || 'Room',
        reason: params.reason
      }
    };
    this.data.notifications.unshift(notif);

    this.persist();
    return { success: true };
  }

  // --- CREATE NEW LECTURE / MERGED LECTURE ---
  public createLectureSession(params: {
    title?: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    classroomId: string;
    primaryLecturerId: string;
    courseIds: string[];
    studentGroupIds: string[];
    isMerged?: boolean;
    mergedTitle?: string;
    user: { id: string; name: string; role: UserRole };
  }): { success: boolean; session?: LectureSession; conflictResult?: ConflictCheckResult; error?: string } {
    if (params.user.role !== 'ADMIN' && params.user.role !== 'LECTURER') {
      return { success: false, error: 'Unauthorized to create lecture sessions.' };
    }

    const mergedGroupId = params.isMerged
      ? `merged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      : undefined;

    // Check conflicts
    const conflictResult = detectConflicts(
      {
        day: params.day,
        startTime: params.startTime,
        endTime: params.endTime,
        classroomId: params.classroomId,
        primaryLecturerId: params.primaryLecturerId,
        studentGroupIds: params.studentGroupIds,
        courseIds: params.courseIds,
        isMerged: params.isMerged,
        mergedGroupId
      },
      this.getContext()
    );

    if (conflictResult.hasConflicts) {
      return {
        success: false,
        conflictResult,
        error: 'Scheduling conflict detected with existing lectures, room capacity, or times.'
      };
    }

    const newSession: LectureSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: params.title || params.mergedTitle,
      day: params.day,
      startTime: params.startTime,
      endTime: params.endTime,
      classroomId: params.classroomId,
      primaryLecturerId: params.primaryLecturerId,
      courseIds: params.courseIds,
      studentGroupIds: params.studentGroupIds,
      status: 'SCHEDULED',
      isMerged: Boolean(params.isMerged),
      mergedGroupId,
      mergedTitle: params.mergedTitle,
      academicYear: '2026/2027',
      semester: 1
    };

    this.data.lectureSessions.push(newSession);

    // Audit log
    const courses = this.data.courses.filter(c => params.courseIds.includes(c.id));
    const room = this.data.classrooms.find(r => r.id === params.classroomId);
    this.data.auditHistory.unshift({
      id: `hist-${Date.now()}`,
      sessionId: newSession.id,
      action: params.isMerged ? 'MERGED' : 'CREATED',
      timestamp: new Date().toISOString(),
      performedBy: params.user,
      details: `Scheduled ${courses.map(c => c.code).join('/')} on ${params.day} ${params.startTime}-${params.endTime} in ${room?.name}${params.isMerged ? ' (Merged Class)' : ''}`
    });

    if (params.isMerged) {
      this.data.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'MERGED_CLASS',
        title: `Merged Class Scheduled: ${courses.map(c => c.code).join(' / ')}`,
        message: `${params.mergedTitle || 'Combined Lecture'} scheduled on ${params.day} ${params.startTime} - ${params.endTime} in ${room?.name}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        relatedSessionId: newSession.id,
        courseCodes: courses.map(c => c.code),
        targetDepartmentIds: courses.map(c => c.departmentId),
        targetGroupIds: params.studentGroupIds,
        authorName: params.user.name,
        authorRole: params.user.role
      });
    }

    this.persist();
    return { success: true, session: newSession };
  }

  // --- MERGE EXISTING SESSIONS ---
  public mergeExistingSessions(
    sessionIds: string[],
    selectedClassroomId: string,
    mergedTitle: string,
    user: { id: string; name: string; role: UserRole }
  ): { success: boolean; mergedSession?: LectureSession; conflictResult?: ConflictCheckResult; error?: string } {
    if (sessionIds.length < 2) {
      return { success: false, error: 'Select at least 2 sessions to merge.' };
    }

    const sessionsToMerge = this.data.lectureSessions.filter(s => sessionIds.includes(s.id));
    if (sessionsToMerge.length !== sessionIds.length) {
      return { success: false, error: 'One or more selected sessions could not be found.' };
    }

    // Base template from first session
    const first = sessionsToMerge[0];
    const combinedCourseIds = Array.from(new Set(sessionsToMerge.flatMap(s => s.courseIds)));
    const combinedGroupIds = Array.from(new Set(sessionsToMerge.flatMap(s => s.studentGroupIds)));
    const primaryLecturerId = first.primaryLecturerId;

    const mergedGroupId = `merged-group-${Date.now()}`;

    // Verify conflicts with new merged configuration
    const conflictResult = detectConflicts(
      {
        day: first.day,
        startTime: first.startTime,
        endTime: first.endTime,
        classroomId: selectedClassroomId,
        primaryLecturerId,
        studentGroupIds: combinedGroupIds,
        courseIds: combinedCourseIds,
        isMerged: true,
        mergedGroupId
      },
      this.getContext(),
      first.id
    );

    if (conflictResult.hasConflicts) {
      return {
        success: false,
        conflictResult,
        error: 'Failed to merge sessions due to conflict or insufficient room capacity.'
      };
    }

    // Remove the old independent sessions and replace with 1 consolidated merged session
    this.data.lectureSessions = this.data.lectureSessions.filter(s => !sessionIds.includes(s.id));

    const mergedSession: LectureSession = {
      id: `session-merged-${Date.now()}`,
      title: mergedTitle,
      day: first.day,
      startTime: first.startTime,
      endTime: first.endTime,
      classroomId: selectedClassroomId,
      primaryLecturerId,
      courseIds: combinedCourseIds,
      studentGroupIds: combinedGroupIds,
      status: 'SCHEDULED',
      isMerged: true,
      mergedGroupId,
      mergedTitle,
      academicYear: first.academicYear,
      semester: first.semester
    };

    this.data.lectureSessions.push(mergedSession);

    const room = this.data.classrooms.find(r => r.id === selectedClassroomId);
    const courses = this.data.courses.filter(c => combinedCourseIds.includes(c.id));

    this.data.auditHistory.unshift({
      id: `hist-${Date.now()}`,
      sessionId: mergedSession.id,
      action: 'MERGED',
      timestamp: new Date().toISOString(),
      performedBy: user,
      details: `Merged ${sessionIds.length} sessions into "${mergedTitle}" (${courses.map(c => c.code).join('/')}) in ${room?.name}`
    });

    this.data.notifications.unshift({
      id: `notif-${Date.now()}`,
      type: 'MERGED_CLASS',
      title: `New Merged Lecture: ${mergedTitle}`,
      message: `${courses.map(c => c.code).join(' / ')} has been combined into a single merged session on ${first.day} ${first.startTime}-${first.endTime} in ${room?.name}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedSessionId: mergedSession.id,
      courseCodes: courses.map(c => c.code),
      targetDepartmentIds: courses.map(c => c.departmentId),
      targetGroupIds: combinedGroupIds,
      authorName: user.name,
      authorRole: user.role
    });

    this.persist();
    return { success: true, mergedSession };
  }

  // --- NOTIFICATIONS ---
  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead() {
    this.data.notifications.forEach(n => {
      n.isRead = true;
    });
    this.persist();
  }

  // --- BATCH IMPORT FROM CSV ---
  public commitImportedSessions(newSessions: LectureSession[], user: { id: string; name: string; role: UserRole }) {
    this.data.lectureSessions.push(...newSessions);
    this.data.auditHistory.unshift({
      id: `hist-${Date.now()}`,
      sessionId: 'batch-import',
      action: 'IMPORT',
      timestamp: new Date().toISOString(),
      performedBy: user,
      details: `Successfully imported ${newSessions.length} lecture session records from timetable CSV.`
    });
    this.persist();
  }
}

// Global Singleton Instance
export const knustStore = new KNUSTStore();

/**
 * Custom React Hook to consume store reactively
 */
export function useKNUSTStore() {
  const [data, setData] = useState<AppStoreData>(knustStore.getData());

  useEffect(() => {
    const unsubscribe = knustStore.subscribe(() => {
      setData({ ...knustStore.getData() });
    });
    return unsubscribe;
  }, []);

  return {
    ...data,
    context: knustStore.getContext(),
    addClassroom: knustStore.addClassroom.bind(knustStore),
    updateClassroom: knustStore.updateClassroom.bind(knustStore),
    deleteClassroom: knustStore.deleteClassroom.bind(knustStore),
    cancelLectureSession: knustStore.cancelLectureSession.bind(knustStore),
    rescheduleLectureSession: knustStore.rescheduleLectureSession.bind(knustStore),
    createLectureSession: knustStore.createLectureSession.bind(knustStore),
    mergeExistingSessions: knustStore.mergeExistingSessions.bind(knustStore),
    markNotificationAsRead: knustStore.markNotificationAsRead.bind(knustStore),
    markAllNotificationsAsRead: knustStore.markAllNotificationsAsRead.bind(knustStore),
    resetToSampleData: knustStore.resetToSampleData.bind(knustStore),
    importDatabaseJson: knustStore.importDatabaseJson.bind(knustStore),
    commitImportedSessions: knustStore.commitImportedSessions.bind(knustStore)
  };
}
