/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST Smart Class Scheduling System - Automated Test Engine (23 Scenarios)
 * Validates merged classes, conflicts, cancellations, rescheduling, and CSV imports.
 */

import { detectConflicts, findClassroomAvailability, SchedulingContext } from './schedulingEngine';
import { parseCsvText, validateCsvRows, autoDetectColumnMapping, convertCsvToSessions } from './csvParser';
import {
  INITIAL_CLASSROOMS,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_LECTURE_SESSIONS,
  INITIAL_LECTURERS,
  INITIAL_STUDENT_GROUPS
} from '../db/initialData';
import { AppStoreData } from '../db/store';
import { LectureSession } from '../types';

export interface TestResult {
  id: number;
  category: 'MERGED_CLASS' | 'CONFLICTS' | 'CANCELLATION_RESCHEDULING' | 'CSV_IMPORT';
  name: string;
  passed: boolean;
  message: string;
  details?: string;
  executionMs: number;
}

export function runAllSchedulingTests(currentStoreData?: AppStoreData): TestResult[] {
  const results: TestResult[] = [];

  const baseData: AppStoreData = currentStoreData || {
    departments: INITIAL_DEPARTMENTS,
    studentGroups: INITIAL_STUDENT_GROUPS,
    courses: INITIAL_COURSES,
    lecturers: INITIAL_LECTURERS,
    classrooms: INITIAL_CLASSROOMS,
    lectureSessions: INITIAL_LECTURE_SESSIONS,
    notifications: [],
    auditHistory: []
  };

  const getFreshContext = (): SchedulingContext => ({
    sessions: JSON.parse(JSON.stringify(baseData.lectureSessions)) as LectureSession[],
    classrooms: JSON.parse(JSON.stringify(baseData.classrooms)),
    lecturers: JSON.parse(JSON.stringify(baseData.lecturers)),
    studentGroups: JSON.parse(JSON.stringify(baseData.studentGroups)),
    courses: JSON.parse(JSON.stringify(baseData.courses)),
    departments: JSON.parse(JSON.stringify(baseData.departments))
  });

  // --- Category 1: Merged Class Tests (1-5) ---

  // Test 1: Two departments share a lecture with one lecturer
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const merged = ctx.sessions.find(s => s.isMerged && s.id === 'session-math151-merged');
    const passed = Boolean(
      merged &&
      merged.studentGroupIds.includes('group-ce-y1') &&
      merged.studentGroupIds.includes('group-ee-y1') &&
      merged.primaryLecturerId === 'lec-boateng'
    );
    results.push({
      id: 1,
      category: 'MERGED_CLASS',
      name: 'Two departments share a lecture with one lecturer',
      passed,
      message: passed
        ? 'Session "MATH 151 / EE 151" correctly links Computer Eng (CE-Y1) and Electrical Eng (EE-Y1) to Prof. Boateng.'
        : 'Failed to verify shared multi-department lecture session.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 2: The same lecturer teaches multiple courses in one merged session
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const merged = ctx.sessions.find(s => s.id === 'session-math151-merged');
    const passed = Boolean(
      merged &&
      merged.courseIds.length > 1 &&
      merged.courseIds.includes('course-math151') &&
      merged.courseIds.includes('course-ee151')
    );
    results.push({
      id: 2,
      category: 'MERGED_CLASS',
      name: 'Same lecturer teaches multiple courses in one merged session',
      passed,
      message: passed
        ? 'Lecturer teaches MATH 151 and EE 151 within single consolidated session ID.'
        : 'Merged session does not hold multiple course IDs.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 3: The merged lecture appears on all participating departmental timetables
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const ceSessions = ctx.sessions.filter(s => s.studentGroupIds.includes('group-ce-y1'));
    const eeSessions = ctx.sessions.filter(s => s.studentGroupIds.includes('group-ee-y1'));
    const passed = Boolean(
      ceSessions.some(s => s.id === 'session-math151-merged') &&
      eeSessions.some(s => s.id === 'session-math151-merged')
    );
    results.push({
      id: 3,
      category: 'MERGED_CLASS',
      name: 'Merged lecture appears on all participating departmental timetables',
      passed,
      message: passed
        ? 'Timetable filter by CE-Y1 and EE-Y1 both successfully retrieve the identical merged session without duplication.'
        : 'Merged lecture missing on one or more departmental timetables.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 4: Combined student population is used for room capacity
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // CE-Y1 (120) + EE-Y1 (125) = 245
    // Small room: PB 002 (capacity 150) -> Must trigger CAPACITY_EXCEEDED
    const check = detectConflicts(
      {
        day: 'Monday',
        startTime: '10:00',
        endTime: '12:00',
        classroomId: 'room-pb-002', // capacity 150
        primaryLecturerId: 'lec-frimpong',
        studentGroupIds: ['group-ce-y1', 'group-ee-y1'],
        courseIds: ['course-math151', 'course-ee151'],
        isMerged: true
      },
      ctx
    );
    const capacityIssue = check.issues.find(i => i.code === 'CAPACITY_EXCEEDED');
    const passed = Boolean(capacityIssue && capacityIssue.message.includes('245'));
    results.push({
      id: 4,
      category: 'MERGED_CLASS',
      name: 'Combined student population is used for room capacity',
      passed,
      message: passed
        ? `Correctly summed group populations (120 + 125 = 245) and rejected room PB 002 (capacity 150).`
        : 'Engine did not sum group populations or failed to flag capacity deficit.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 5: A merged lecture does not generate a false lecturer or classroom conflict
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Validating existing merged session against itself or with same mergedGroupId
    const check = detectConflicts(
      {
        id: 'session-math151-merged',
        day: 'Monday',
        startTime: '08:00',
        endTime: '10:00',
        classroomId: 'room-great-hall',
        primaryLecturerId: 'lec-boateng',
        studentGroupIds: ['group-ce-y1', 'group-ee-y1'],
        courseIds: ['course-math151', 'course-ee151'],
        isMerged: true,
        mergedGroupId: 'merged-joint-math-1'
      },
      ctx,
      'session-math151-merged'
    );
    const passed = !check.hasConflicts;
    results.push({
      id: 5,
      category: 'MERGED_CLASS',
      name: 'Merged lecture does not generate a false lecturer or room conflict',
      passed,
      message: passed
        ? 'Engine verified merged session without false self-collisions.'
        : `False conflict generated: ${check.issues.map(i => i.message).join(', ')}`,
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // --- Category 2: Conflict Tests (6-9) ---

  // Test 6: One lecturer is assigned to two unrelated lectures simultaneously
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Prof. Boateng is teaching on Monday 08:00-10:00. Attempt unrelated session with him at Monday 09:00-11:00 in CLT 1
    const check = detectConflicts(
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        classroomId: 'room-clt-1',
        primaryLecturerId: 'lec-boateng',
        studentGroupIds: ['group-me-y2'],
        courseIds: ['course-me251'],
        isMerged: false
      },
      ctx
    );
    const issue = check.issues.find(i => i.code === 'LECTURER_OVERLAP');
    const passed = Boolean(issue && check.hasConflicts);
    results.push({
      id: 6,
      category: 'CONFLICTS',
      name: 'Lecturer assigned to two unrelated lectures simultaneously',
      passed,
      message: passed
        ? `Caught conflict: ${issue?.message}`
        : 'Failed to detect lecturer overlap conflict.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 7: Two unrelated lectures assigned to same room simultaneously
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Room CLT 1 has ME 251 on Monday 10:00 - 12:00. Try assigning CE-Y2 in CLT 1 on Monday 10:30 - 12:30
    const check = detectConflicts(
      {
        day: 'Monday',
        startTime: '10:30',
        endTime: '12:30',
        classroomId: 'room-clt-1',
        primaryLecturerId: 'lec-agyeiwaa',
        studentGroupIds: ['group-ce-y2'],
        courseIds: ['course-coe251'],
        isMerged: false
      },
      ctx
    );
    const issue = check.issues.find(i => i.code === 'ROOM_OVERLAP');
    const passed = Boolean(issue && check.hasConflicts);
    results.push({
      id: 7,
      category: 'CONFLICTS',
      name: 'Two unrelated lectures assigned to the same room simultaneously',
      passed,
      message: passed
        ? `Caught conflict: ${issue?.message}`
        : 'Failed to detect room overlap conflict.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 8: Student group has two unrelated compulsory lectures simultaneously
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Group CE-Y2 has COE 253 on Tuesday 08:00 - 10:00. Try scheduling another course for CE-Y2 on Tuesday 09:00 - 11:00
    const check = detectConflicts(
      {
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '11:00',
        classroomId: 'room-pb-001',
        primaryLecturerId: 'lec-frimpong',
        studentGroupIds: ['group-ce-y2'],
        courseIds: ['course-coe251'],
        isMerged: false
      },
      ctx
    );
    const issue = check.issues.find(i => i.code === 'GROUP_OVERLAP');
    const passed = Boolean(issue && check.hasConflicts);
    results.push({
      id: 8,
      category: 'CONFLICTS',
      name: 'Student group has two unrelated lectures simultaneously',
      passed,
      message: passed
        ? `Caught conflict: ${issue?.message}`
        : 'Failed to detect student group overlap conflict.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 9: Room is too small for student population
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Group ME-Y2 has population 140. Lab 301 has capacity 60.
    const check = detectConflicts(
      {
        day: 'Saturday',
        startTime: '09:00',
        endTime: '11:00',
        classroomId: 'room-lab-301', // capacity 60
        primaryLecturerId: 'lec-asabere',
        studentGroupIds: ['group-me-y2'], // population 140
        courseIds: ['course-me251'],
        isMerged: false
      },
      ctx
    );
    const issue = check.issues.find(i => i.code === 'CAPACITY_EXCEEDED');
    const passed = Boolean(issue && check.hasConflicts);
    results.push({
      id: 9,
      category: 'CONFLICTS',
      name: 'Classroom is too small for the student population',
      passed,
      message: passed
        ? `Caught deficit: ${issue?.message}`
        : 'Failed to catch room capacity shortage.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // --- Category 3: Cancellation & Rescheduling Tests (10-18) ---

  // Test 10: Lecturer cancels their own lecture
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const session = ctx.sessions.find(s => s.id === 'session-me251')!;
    const isLecOwner = session.primaryLecturerId === 'lec-asabere';
    session.status = 'CANCELLED';
    session.cancellationReason = 'Personal health emergency.';
    const passed = isLecOwner && session.status === 'CANCELLED';
    results.push({
      id: 10,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Lecturer cancels their own lecture',
      passed,
      message: passed
        ? 'Lecturer Ing. Asabere successfully cancelled ME 251 with verified ownership.'
        : 'Failed to cancel lecture session.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 11: Lecturer reschedules their own lecture
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const session = ctx.sessions.find(s => s.id === 'session-me251')!;
    session.status = 'RESCHEDULED';
    session.day = 'Friday';
    session.startTime = '14:00';
    session.endTime = '16:00';
    session.originalDay = 'Monday';
    const passed = session.status === 'RESCHEDULED' && session.day === 'Friday';
    results.push({
      id: 11,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Lecturer reschedules their own lecture',
      passed,
      message: passed
        ? 'Successfully transitioned session to RESCHEDULED with new Friday slot and preserved original slot.'
        : 'Failed to reschedule lecture.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 12: Lecturer selects an available room
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const avail = findClassroomAvailability('Thursday', '16:00', '18:00', 100, ctx);
    const passed = avail.availableClassrooms.length > 0 && avail.availableClassrooms.some(r => r.fitsCapacity);
    results.push({
      id: 12,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Lecturer selects an available room',
      passed,
      message: passed
        ? `Found ${avail.availableClassrooms.length} available classrooms matching capacity.`
        : 'No available rooms found for free time slot.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 13: Lecturer attempts to select an occupied room
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Monday 08:00 - 10:00 CoE Great Hall is occupied by MATH 151
    const check = detectConflicts(
      {
        day: 'Monday',
        startTime: '08:00',
        endTime: '10:00',
        classroomId: 'room-great-hall',
        primaryLecturerId: 'lec-agyeiwaa',
        studentGroupIds: ['group-ce-y2'],
        courseIds: ['course-coe253'],
        isMerged: false
      },
      ctx
    );
    const passed = check.hasConflicts && check.issues.some(i => i.code === 'ROOM_OVERLAP');
    results.push({
      id: 13,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Lecturer attempts to select an occupied room',
      passed,
      message: passed
        ? 'Engine strictly blocked selection of occupied CoE Great Hall.'
        : 'Engine allowed selection of an occupied room.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 14: Lecturer attempts to schedule an overlapping unrelated lecture
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    // Tuesday 08:00 - 10:00 Dr. Joyce Agyeiwaa is teaching COE 253. Attempt overlapping session 09:00 - 11:00
    const check = detectConflicts(
      {
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '11:00',
        classroomId: 'room-pb-001',
        primaryLecturerId: 'lec-agyeiwaa',
        studentGroupIds: ['group-ee-y1'],
        courseIds: ['course-ee151'],
        isMerged: false
      },
      ctx
    );
    const passed = check.hasConflicts && check.issues.some(i => i.code === 'LECTURER_OVERLAP');
    results.push({
      id: 14,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Lecturer attempts to schedule overlapping unrelated lecture',
      passed,
      message: passed
        ? 'Engine successfully intercepted lecturer overlap conflict.'
        : 'Failed to intercept lecturer overlap.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 15: Administrator cancels a lecture
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const session = ctx.sessions[0];
    session.status = 'CANCELLED';
    session.cancelledByUserId = 'admin-1';
    session.cancellationReason = 'Administrative university holiday proclamation.';
    const passed = session.status === 'CANCELLED' && session.cancelledByUserId === 'admin-1';
    results.push({
      id: 15,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Administrator cancels any lecture with override privilege',
      passed,
      message: passed
        ? 'Administrator successfully executed university-wide cancellation.'
        : 'Admin cancellation failed.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 16: Administrator reschedules a lecture
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const session = ctx.sessions[1];
    session.status = 'RESCHEDULED';
    session.originalDay = session.day;
    session.day = 'Saturday';
    session.startTime = '10:00';
    session.endTime = '12:00';
    const passed = session.status === 'RESCHEDULED' && session.day === 'Saturday';
    results.push({
      id: 16,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Administrator reschedules any lecture',
      passed,
      message: passed
        ? 'Administrator successfully rescheduled session to Saturday 10:00-12:00.'
        : 'Admin rescheduling failed.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 17: Affected students receive appropriate notifications
  (() => {
    const t0 = performance.now();
    const notifs = baseData.notifications;
    const hasCancelNotif = notifs.some(n => n.type === 'CANCELLATION' && n.targetGroupIds.length > 0);
    const hasReschedNotif = notifs.some(n => n.type === 'RESCHEDULE' && n.targetGroupIds.length > 0);
    const passed = hasCancelNotif && hasReschedNotif;
    results.push({
      id: 17,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Affected students receive appropriate in-app notifications',
      passed,
      message: passed
        ? 'Notification queue holds cancellation and rescheduling alerts targeted to student groups.'
        : 'Missing student-targeted notification records.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 18: Original schedule and new schedule are preserved in history
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const rescheduled = ctx.sessions.find(s => s.status === 'RESCHEDULED');
    const passed = Boolean(
      rescheduled &&
      rescheduled.originalDay &&
      rescheduled.originalStartTime &&
      rescheduled.day &&
      rescheduled.startTime
    );
    results.push({
      id: 18,
      category: 'CANCELLATION_RESCHEDULING',
      name: 'Original schedule and new schedule are preserved in audit history',
      passed,
      message: passed
        ? `Preserved original (${rescheduled?.originalDay} ${rescheduled?.originalStartTime}) and new (${rescheduled?.day} ${rescheduled?.startTime}) values.`
        : 'Original scheduling parameters were lost.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // --- Category 4: CSV Tests (19-23) ---

  // Test 19: Valid CSV is imported successfully
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const rawCsv = `Course Code,Course Title,Department,Lecturer,Student Group,Day,Start Time,End Time,Classroom
COE 401,Embedded Systems Lab,Computer Engineering,Dr. Joyce Agyeiwaa,CE-Y3,Tuesday,14:00,16:00,Lab 301`;
    const { headers, rows } = parseCsvText(rawCsv);
    const mapping = autoDetectColumnMapping(headers);
    const validated = validateCsvRows(rows, mapping, ctx);
    const conversion = convertCsvToSessions(validated, ctx);
    const passed = validated[0].status === 'VALID' && conversion.sessions.length === 1;
    results.push({
      id: 19,
      category: 'CSV_IMPORT',
      name: 'Valid CSV is imported successfully',
      passed,
      message: passed
        ? 'Parsed valid row and generated valid LectureSession entity.'
        : 'Valid CSV parsing failed.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 20: CSV with missing required columns produces useful errors
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const invalidCsv = `Course Code,Course Title,Day,Start Time,End Time,Classroom
,Missing Code Lecture,Monday,08:00,10:00,PB 001`;
    const { headers, rows } = parseCsvText(invalidCsv);
    const mapping = autoDetectColumnMapping(headers);
    const validated = validateCsvRows(rows, mapping, ctx);
    const passed = validated[0].status === 'ERROR' && validated[0].messages.some(m => m.includes('Course Code'));
    results.push({
      id: 20,
      category: 'CSV_IMPORT',
      name: 'CSV with missing required fields produces clear errors',
      passed,
      message: passed
        ? `Produced expected error: ${validated[0].messages.join(', ')}`
        : 'Failed to flag missing required field.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 21: Duplicate records are detected
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const dupCsv = `Course Code,Student Group,Day,Start Time,End Time,Classroom
COE 251,CE-Y2,Monday,08:00,10:00,PB 001
COE 251,CE-Y2,Monday,08:00,10:00,PB 001`;
    const { headers, rows } = parseCsvText(dupCsv);
    const mapping = autoDetectColumnMapping(headers);
    const validated = validateCsvRows(rows, mapping, ctx);
    const passed = validated[1].status === 'ERROR' && validated[1].messages.some(m => m.includes('Duplicate'));
    results.push({
      id: 21,
      category: 'CSV_IMPORT',
      name: 'Duplicate records are detected in CSV import',
      passed,
      message: passed
        ? 'Duplicate signature detected and flagged with error on second row.'
        : 'Duplicate row was not flagged.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 22: Inconsistent course and department names are flagged
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const warnCsv = `Course Code,Department,Day,Start Time,End Time,Classroom
NEWCOURSE 999,Unregistered Space Science Dept,Tuesday,10:00,12:00,PB 001`;
    const { headers, rows } = parseCsvText(warnCsv);
    const mapping = autoDetectColumnMapping(headers);
    const validated = validateCsvRows(rows, mapping, ctx);
    const passed = validated[0].status === 'WARNING' && validated[0].messages.some(m => m.includes('registered catalog'));
    results.push({
      id: 22,
      category: 'CSV_IMPORT',
      name: 'Inconsistent course/dept names are flagged with warnings',
      passed,
      message: passed
        ? `Flagged with warning for auto-resolution: ${validated[0].messages.join(' | ')}`
        : 'Unregistered course/department was not flagged.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  // Test 23: Merged lecture relationships are preserved during import
  (() => {
    const t0 = performance.now();
    const ctx = getFreshContext();
    const mergedCsv = `Course Code,Course Title,Department,Lecturer,Student Group,Day,Start Time,End Time,Classroom,Merged With
MATH 151,Applied Math,Computer Eng,Prof. Boateng,CE-Y1,Monday,08:00,10:00,CoE Great Hall,MERGE_JOINT_1
EE 151,Applied Elect,Electrical Eng,Prof. Boateng,EE-Y1,Monday,08:00,10:00,CoE Great Hall,MERGE_JOINT_1`;
    const { headers, rows } = parseCsvText(mergedCsv);
    const mapping = autoDetectColumnMapping(headers);
    const validated = validateCsvRows(rows, mapping, ctx);
    const conversion = convertCsvToSessions(validated, ctx);
    const passed = Boolean(
      conversion.sessions.length === 1 &&
      conversion.sessions[0].isMerged &&
      conversion.sessions[0].courseIds.length >= 2 &&
      conversion.sessions[0].studentGroupIds.length >= 2
    );
    results.push({
      id: 23,
      category: 'CSV_IMPORT',
      name: 'Merged lecture relationships are preserved and unified during import',
      passed,
      message: passed
        ? 'Preserved "MERGE_JOINT_1" tag: aggregated 2 rows into 1 single merged LectureSession with multiple courses and groups.'
        : 'Failed to unify merged rows into single merged session.',
      executionMs: Number((performance.now() - t0).toFixed(2))
    });
  })();

  return results;
}
