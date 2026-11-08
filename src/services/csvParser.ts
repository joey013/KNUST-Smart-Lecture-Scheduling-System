/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST Smart Class Scheduling System - CSV Timetable Parser & Validation Engine
 * Flexible column mapper, error detector, duplicate detector, and merged-group tagger.
 */

import { CsvColumnMapping, CsvValidationItem, DayOfWeek, Department, LectureSession } from '../types';
import { CAMPUS_DAYS, timeToMinutes } from './schedulingEngine';
import { SchedulingContext } from './schedulingEngine';

export const DEFAULT_CSV_SAMPLE = `Course Code,Course Title,Department,Lecturer,Student Group,Class Size,Day,Start Time,End Time,Classroom,Room Capacity,Merged With
MATH 151,Applied Mathematics I,Computer Engineering,Prof. Kwame Boateng,CE-Y1,120,Monday,08:00,10:00,CoE Great Hall,500,JOINT_MATH_Y1
EE 151,Applied Electricity,Electrical Engineering,Prof. Kwame Boateng,EE-Y1,125,Monday,08:00,10:00,CoE Great Hall,500,JOINT_MATH_Y1
COE 251,Data Structures & Algorithms,Computer Engineering,Dr. Abena Mensah,CE-Y2,110,Wednesday,10:00,12:00,PB 001,300,JOINT_SIGNALS_Y2
EE 251,Signals & Systems,Electrical Engineering,Dr. Abena Mensah,EE-Y2,105,Wednesday,10:00,12:00,PB 001,300,JOINT_SIGNALS_Y2
COE 253,Digital Systems Design,Computer Engineering,Dr. Joyce Agyeiwaa,CE-Y2,110,Tuesday,08:00,10:00,ELT 1,220,
ME 251,Applied Thermodynamics,Mechanical Engineering,Ing. Nana Yaw Asabere,ME-Y2,140,Monday,10:00,12:00,CLT 1,250,
CEV 251,Fluid Mechanics,Civil Engineering,Dr. Kofi Osei-Tutu,CEV-Y2,130,Thursday,12:00,14:00,CLT 1,250,
COE 351,Computer Architecture,Computer Engineering,Prof. Kwame Boateng,CE-Y3,95,Thursday,08:00,10:00,CANB 201,180,`;

export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Helper to split CSV row taking quotes into account
  const splitCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Intelligent auto-mapping heuristics for KNUST timetable column headers
 */
export function autoDetectColumnMapping(headers: string[]): CsvColumnMapping {
  const findMatch = (candidates: string[]): string => {
    const match = headers.find(h => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return candidates.some(c => lower.includes(c));
    });
    return match || '';
  };

  return {
    courseCode: findMatch(['coursecode', 'code', 'course_code', 'course']),
    courseTitle: findMatch(['title', 'coursetitle', 'coursename', 'name', 'subject']),
    departmentCode: findMatch(['dept', 'department', 'programme', 'program']),
    lecturerName: findMatch(['lecturer', 'instructor', 'teacher', 'prof', 'staff']),
    studentGroupCode: findMatch(['group', 'studentgroup', 'class', 'batch', 'year', 'level']),
    groupPopulation: findMatch(['size', 'population', 'students', 'count', 'capacity']),
    day: findMatch(['day', 'weekday']),
    startTime: findMatch(['start', 'starttime', 'from']),
    endTime: findMatch(['end', 'endtime', 'to']),
    classroomName: findMatch(['room', 'classroom', 'hall', 'venue', 'location', 'theatre']),
    roomCapacity: findMatch(['roomcapacity', 'hallcapacity', 'venuecapacity']),
    mergedTag: findMatch(['merged', 'mergedwith', 'joint', 'combined', 'grouptag', 'mergeid'])
  };
}

/**
 * Validates parsed CSV rows against internal rules and context
 */
export function validateCsvRows(
  rows: Record<string, string>[],
  mapping: CsvColumnMapping,
  context: SchedulingContext
): CsvValidationItem[] {
  const validatedItems: CsvValidationItem[] = [];
  const seenSignatures = new Set<string>();

  rows.forEach((row, index) => {
    const messages: string[] = [];
    let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';

    const courseCode = row[mapping.courseCode]?.trim() || '';
    const courseTitle = row[mapping.courseTitle]?.trim() || '';
    const dept = row[mapping.departmentCode]?.trim() || '';
    const lecturer = row[mapping.lecturerName]?.trim() || '';
    const group = row[mapping.studentGroupCode]?.trim() || '';
    const day = row[mapping.day]?.trim() || '';
    const startTime = row[mapping.startTime]?.trim() || '';
    const endTime = row[mapping.endTime]?.trim() || '';
    const room = row[mapping.classroomName]?.trim() || '';
    const mergedTag = row[mapping.mergedTag]?.trim() || '';

    // 1. Missing required fields check
    if (!courseCode) {
      messages.push('Missing required Course Code.');
      status = 'ERROR';
    }
    if (!day) {
      messages.push('Missing required Day.');
      status = 'ERROR';
    }
    if (!startTime || !endTime) {
      messages.push('Missing Start Time or End Time.');
      status = 'ERROR';
    }
    if (!room) {
      messages.push('Missing Classroom/Hall venue.');
      status = 'ERROR';
    }

    // 2. Day format check
    const normalizedDay = CAMPUS_DAYS.find(
      d => d.toLowerCase() === day.toLowerCase()
    );
    if (day && !normalizedDay) {
      messages.push(`Invalid day "${day}". Must be Monday through Saturday.`);
      status = 'ERROR';
    }

    // 3. Time format & range checks
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      messages.push(`Invalid start time "${startTime}". Use HH:MM 24-hr format (e.g. 08:00).`);
      status = 'ERROR';
    }
    if (endTime && !timeRegex.test(endTime)) {
      messages.push(`Invalid end time "${endTime}". Use HH:MM 24-hr format (e.g. 10:00).`);
      status = 'ERROR';
    }
    if (timeRegex.test(startTime) && timeRegex.test(endTime)) {
      const sMin = timeToMinutes(startTime);
      const eMin = timeToMinutes(endTime);
      if (sMin >= eMin) {
        messages.push(`Start time (${startTime}) cannot be after or equal to end time (${endTime}).`);
        status = 'ERROR';
      }
    }

    // 4. Duplicate Record Detection
    const recordSignature = `${courseCode}_${group}_${day}_${startTime}_${endTime}_${room}`.toUpperCase();
    if (seenSignatures.has(recordSignature)) {
      messages.push(`Duplicate lecture record found in CSV file.`);
      status = 'ERROR';
    } else {
      seenSignatures.add(recordSignature);
    }

    // 5. Inconsistent Course/Dept matching warnings
    if (courseCode) {
      const courseMatch = context.courses.find(
        c => c.code.toLowerCase() === courseCode.toLowerCase()
      );
      if (!courseMatch) {
        messages.push(`Course "${courseCode}" does not match registered catalog; will be auto-registered.`);
        if (status !== 'ERROR') status = 'WARNING';
      }
    }

    if (dept && context.departments) {
      const deptMatch = context.departments.find(
        (d: Department) =>
          d.code.toLowerCase() === dept.toLowerCase() ||
          d.name.toLowerCase().includes(dept.toLowerCase())
      );
      if (!deptMatch) {
        messages.push(`Department "${dept}" not directly matched; will link by best match.`);
        if (status !== 'ERROR') status = 'WARNING';
      }
    }

    if (room) {
      const roomMatch = context.classrooms.find(
        r => r.name.toLowerCase() === room.toLowerCase()
      );
      if (!roomMatch) {
        messages.push(`Classroom "${room}" not currently in database; will be auto-created.`);
        if (status !== 'ERROR') status = 'WARNING';
      }
    }

    if (mergedTag) {
      messages.push(`Flagged as Merged Lecture (Tag: ${mergedTag}).`);
    }

    validatedItems.push({
      rowIndex: index + 1,
      data: {
        courseCode,
        courseTitle,
        departmentCode: dept,
        lecturerName: lecturer,
        studentGroupCode: group,
        day: normalizedDay || day,
        startTime,
        endTime,
        classroomName: room,
        mergedTag
      },
      status,
      messages
    });
  });

  return validatedItems;
}

/**
 * Transforms validated CSV records into LectureSession instances
 * Automatically aggregates rows sharing identical merged tags!
 */
export function convertCsvToSessions(
  validatedItems: CsvValidationItem[],
  context: SchedulingContext
): {
  sessions: LectureSession[];
  newCourses: Array<{ code: string; title: string; deptId: string }>;
  newClassrooms: Array<{ name: string; capacity: number }>;
} {
  const sessions: LectureSession[] = [];
  const validRows = validatedItems.filter(v => v.status !== 'ERROR');

  const newCourses: Array<{ code: string; title: string; deptId: string }> = [];
  const newClassrooms: Array<{ name: string; capacity: number }> = [];

  // Group by mergedTag if present, or create independent sessions
  const mergedGroups = new Map<string, CsvValidationItem[]>();
  const independentRows: CsvValidationItem[] = [];

  for (const item of validRows) {
    const tag = (item.data.mergedTag as string)?.trim();
    if (tag) {
      if (!mergedGroups.has(tag)) {
        mergedGroups.set(tag, []);
      }
      mergedGroups.get(tag)!.push(item);
    } else {
      independentRows.push(item);
    }
  }

  // 1. Process Independent Rows
  for (const item of independentRows) {
    const d = item.data;
    const courseCode = d.courseCode as string;
    const roomName = d.classroomName as string;

    // Resolve or find room
    let room = context.classrooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
    let roomId = room?.id;
    if (!roomId) {
      roomId = `room-imported-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      newClassrooms.push({ name: roomName, capacity: 150 });
    }

    // Resolve course
    let course = context.courses.find(c => c.code.toLowerCase() === courseCode.toLowerCase());
    let courseId = course?.id;
    if (!courseId) {
      courseId = `course-imported-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      newCourses.push({
        code: courseCode,
        title: (d.courseTitle as string) || courseCode,
        deptId: 'dept-ce'
      });
    }

    // Resolve lecturer
    const lecturerName = (d.lecturerName as string) || '';
    const lecturer = context.lecturers.find(l =>
      l.fullName.toLowerCase().includes(lecturerName.toLowerCase())
    );
    const lecturerId = lecturer ? lecturer.id : 'lec-boateng';

    // Resolve group
    const groupCode = (d.studentGroupCode as string) || '';
    const group = context.studentGroups.find(g =>
      g.code.toLowerCase() === groupCode.toLowerCase()
    );
    const groupId = group ? group.id : 'group-ce-y2';

    sessions.push({
      id: `session-csv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: (d.courseTitle as string) || courseCode,
      day: (d.day as DayOfWeek) || 'Monday',
      startTime: d.startTime as string,
      endTime: d.endTime as string,
      classroomId: roomId,
      primaryLecturerId: lecturerId,
      courseIds: [courseId],
      studentGroupIds: [groupId],
      status: 'SCHEDULED',
      isMerged: false,
      academicYear: '2026/2027',
      semester: 1
    });
  }

  // 2. Process Merged Groups
  for (const [tag, items] of mergedGroups.entries()) {
    const first = items[0].data;
    const courseIds: string[] = [];
    const groupIds: string[] = [];
    const courseTitles: string[] = [];

    const roomName = first.classroomName as string;
    let room = context.classrooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
    let roomId = room?.id;
    if (!roomId) {
      roomId = `room-imported-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      newClassrooms.push({ name: roomName, capacity: 350 });
    }

    for (const item of items) {
      const code = item.data.courseCode as string;
      let course = context.courses.find(c => c.code.toLowerCase() === code.toLowerCase());
      if (course) {
        courseIds.push(course.id);
        courseTitles.push(course.code);
      } else {
        const newId = `course-imported-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        courseIds.push(newId);
        courseTitles.push(code);
        newCourses.push({
          code,
          title: (item.data.courseTitle as string) || code,
          deptId: 'dept-ce'
        });
      }

      const gCode = (item.data.studentGroupCode as string) || '';
      const group = context.studentGroups.find(g => g.code.toLowerCase() === gCode.toLowerCase());
      if (group) {
        groupIds.push(group.id);
      } else {
        groupIds.push('group-ce-y1');
      }
    }

    const lecturerName = (first.lecturerName as string) || '';
    const lecturer = context.lecturers.find(l =>
      l.fullName.toLowerCase().includes(lecturerName.toLowerCase())
    );
    const lecturerId = lecturer ? lecturer.id : 'lec-boateng';

    sessions.push({
      id: `session-csv-merged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `Joint ${courseTitles.join(' / ')} (${tag})`,
      day: (first.day as DayOfWeek) || 'Monday',
      startTime: first.startTime as string,
      endTime: first.endTime as string,
      classroomId: roomId,
      primaryLecturerId: lecturerId,
      courseIds: Array.from(new Set(courseIds)),
      studentGroupIds: Array.from(new Set(groupIds)),
      status: 'SCHEDULED',
      isMerged: true,
      mergedGroupId: `merged-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      mergedTitle: `Joint ${courseTitles.join(' / ')}`,
      academicYear: '2026/2027',
      semester: 1
    });
  }

  return { sessions, newCourses, newClassrooms };
}
