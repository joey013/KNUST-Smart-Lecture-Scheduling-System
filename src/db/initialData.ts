/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST College of Engineering Sample Data (Clearly labelled temporary demonstration dataset)
 */

import { Department, StudentGroup, Course, Lecturer, Classroom, LectureSession, NotificationItem, SchedulingHistoryRecord } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-ce',
    code: 'CE',
    name: 'Computer Engineering',
    faculty: 'Faculty of Electrical and Computer Engineering'
  },
  {
    id: 'dept-ee',
    code: 'EE',
    name: 'Electrical and Electronic Engineering',
    faculty: 'Faculty of Electrical and Computer Engineering'
  },
  {
    id: 'dept-me',
    code: 'ME',
    name: 'Mechanical Engineering',
    faculty: 'Faculty of Mechanical and Chemical Engineering'
  },
  {
    id: 'dept-cev',
    code: 'CEV',
    name: 'Civil Engineering',
    faculty: 'Faculty of Civil and Geo Engineering'
  },
  {
    id: 'dept-bme',
    code: 'BME',
    name: 'Biomedical Engineering',
    faculty: 'Faculty of Electrical and Computer Engineering'
  },
  {
    id: 'dept-che',
    code: 'CHE',
    name: 'Chemical Engineering',
    faculty: 'Faculty of Mechanical and Chemical Engineering'
  },
  {
    id: 'dept-mse',
    code: 'MSE',
    name: 'Materials Science and Engineering',
    faculty: 'Faculty of Mechanical and Chemical Engineering'
  },
  {
    id: 'dept-age',
    code: 'AGE',
    name: 'Agricultural Engineering',
    faculty: 'Faculty of Civil and Geo Engineering'
  }
];

export const INITIAL_STUDENT_GROUPS: StudentGroup[] = [
  {
    id: 'group-ce-y1',
    name: 'Computer Engineering Year 1',
    code: 'CE-Y1',
    departmentId: 'dept-ce',
    yearLevel: 1,
    population: 120
  },
  {
    id: 'group-ce-y2',
    name: 'Computer Engineering Year 2',
    code: 'CE-Y2',
    departmentId: 'dept-ce',
    yearLevel: 2,
    population: 110
  },
  {
    id: 'group-ce-y3',
    name: 'Computer Engineering Year 3',
    code: 'CE-Y3',
    departmentId: 'dept-ce',
    yearLevel: 3,
    population: 95
  },
  {
    id: 'group-ee-y1',
    name: 'Electrical Engineering Year 1',
    code: 'EE-Y1',
    departmentId: 'dept-ee',
    yearLevel: 1,
    population: 125
  },
  {
    id: 'group-ee-y2',
    name: 'Electrical Engineering Year 2',
    code: 'EE-Y2',
    departmentId: 'dept-ee',
    yearLevel: 2,
    population: 105
  },
  {
    id: 'group-me-y2',
    name: 'Mechanical Engineering Year 2',
    code: 'ME-Y2',
    departmentId: 'dept-me',
    yearLevel: 2,
    population: 140
  },
  {
    id: 'group-cev-y2',
    name: 'Civil Engineering Year 2',
    code: 'CEV-Y2',
    departmentId: 'dept-cev',
    yearLevel: 2,
    population: 130
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-math151',
    code: 'MATH 151',
    title: 'Applied Mathematics I',
    creditHours: 3,
    departmentId: 'dept-ce'
  },
  {
    id: 'course-ee151',
    code: 'EE 151',
    title: 'Applied Electricity & Circuit Theory',
    creditHours: 3,
    departmentId: 'dept-ee'
  },
  {
    id: 'course-coe251',
    code: 'COE 251',
    title: 'Data Structures and Algorithms',
    creditHours: 3,
    departmentId: 'dept-ce'
  },
  {
    id: 'course-ee251',
    code: 'EE 251',
    title: 'Signals & Systems Analysis',
    creditHours: 3,
    departmentId: 'dept-ee'
  },
  {
    id: 'course-coe253',
    code: 'COE 253',
    title: 'Digital Systems & Logic Design',
    creditHours: 3,
    departmentId: 'dept-ce'
  },
  {
    id: 'course-coe255',
    code: 'COE 255',
    title: 'Software Engineering Principles',
    creditHours: 3,
    departmentId: 'dept-ce'
  },
  {
    id: 'course-coe351',
    code: 'COE 351',
    title: 'Computer Architecture & Organisation',
    creditHours: 3,
    departmentId: 'dept-ce'
  },
  {
    id: 'course-me251',
    code: 'ME 251',
    title: 'Applied Thermodynamics I',
    creditHours: 3,
    departmentId: 'dept-me'
  },
  {
    id: 'course-cev251',
    code: 'CEV 251',
    title: 'Fluid Mechanics for Civil Engineers',
    creditHours: 3,
    departmentId: 'dept-cev'
  }
];

export const INITIAL_LECTURERS: Lecturer[] = [
  {
    id: 'lec-boateng',
    title: 'Prof.',
    fullName: 'Kwame Boateng',
    email: 'kboateng.coe@knust.edu.gh',
    phone: '+233 24 411 2233',
    departmentId: 'dept-ce',
    officeLocation: 'Petroleum Building 3rd Floor, Rm 312'
  },
  {
    id: 'lec-frimpong',
    title: 'Dr.',
    fullName: 'Emmanuel Frimpong',
    email: 'efrimpong.elect@knust.edu.gh',
    phone: '+233 20 890 1234',
    departmentId: 'dept-ee',
    officeLocation: 'Electrical Block, Rm 104'
  },
  {
    id: 'lec-agyeiwaa',
    title: 'Dr.',
    fullName: 'Joyce Agyeiwaa',
    email: 'jagyeiwaa.ce@knust.edu.gh',
    phone: '+233 55 332 9988',
    departmentId: 'dept-ce',
    officeLocation: 'CoE Annex, Rm 205'
  },
  {
    id: 'lec-asabere',
    title: 'Ing.',
    fullName: 'Nana Yaw Asabere',
    email: 'nyasabere.me@knust.edu.gh',
    phone: '+233 24 556 7788',
    departmentId: 'dept-me',
    officeLocation: 'Mechanical Engineering Block, Rm 12'
  },
  {
    id: 'lec-mensah',
    title: 'Dr.',
    fullName: 'Abena Mensah',
    email: 'amensah.ee@knust.edu.gh',
    phone: '+233 27 771 2345',
    departmentId: 'dept-ee',
    officeLocation: 'Electrical Block, Rm 202'
  },
  {
    id: 'lec-kwofie',
    title: 'Prof.',
    fullName: 'Samuel Kwofie',
    email: 'skwofie.mse@knust.edu.gh',
    phone: '+233 24 331 4455',
    departmentId: 'dept-mse',
    officeLocation: 'Materials Engineering Wing, Rm 04'
  },
  {
    id: 'lec-osei',
    title: 'Dr.',
    fullName: 'Kofi Osei-Tutu',
    email: 'koseitutu.cev@knust.edu.gh',
    phone: '+233 20 112 3456',
    departmentId: 'dept-cev',
    officeLocation: 'Civil Engineering Block, Rm 210'
  }
];

export const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 'room-great-hall',
    name: 'CoE Great Hall',
    building: 'College of Engineering Central Complex',
    capacity: 500,
    floor: 'Ground Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: true,
    notes: 'Primary auditorium for combined/merged engineering lectures and faculty events.'
  },
  {
    id: 'room-pb-001',
    name: 'PB 001',
    building: 'Petroleum Building',
    capacity: 300,
    floor: 'Ground Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: true,
    notes: 'Equipped with dual multimedia displays and wireless microphones.'
  },
  {
    id: 'room-pb-002',
    name: 'PB 002',
    building: 'Petroleum Building',
    capacity: 150,
    floor: 'Ground Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: false,
    notes: 'Mid-sized lecture theatre suited for single-department core lectures.'
  },
  {
    id: 'room-pb-104',
    name: 'PB 104',
    building: 'Petroleum Building',
    capacity: 80,
    floor: 'First Floor',
    hasAirConditioning: false,
    hasProjector: true,
    hasAudioSystem: false,
    notes: 'Tutorial room and seminar hall.'
  },
  {
    id: 'room-elt-1',
    name: 'ELT 1',
    building: 'Electrical Block',
    capacity: 220,
    floor: 'First Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: true,
    notes: 'Electrical Lecture Theatre 1.'
  },
  {
    id: 'room-elt-2',
    name: 'ELT 2',
    building: 'Electrical Block',
    capacity: 140,
    floor: 'Second Floor',
    hasAirConditioning: false,
    hasProjector: true,
    hasAudioSystem: false,
    notes: 'Electrical Lecture Theatre 2.'
  },
  {
    id: 'room-canb-201',
    name: 'CANB 201',
    building: 'Commercial Area New Block',
    capacity: 180,
    floor: 'Second Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: true,
    notes: 'Well-ventilated modern lecture room near the campus banking square.'
  },
  {
    id: 'room-clt-1',
    name: 'CLT 1',
    building: 'Civil Engineering Block',
    capacity: 250,
    floor: 'Ground Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: true,
    notes: 'Civil Lecture Theatre 1.'
  },
  {
    id: 'room-ccb-aud',
    name: 'CCB Auditorium',
    building: 'Central Classroom Block',
    capacity: 400,
    floor: 'Ground Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: true,
    notes: 'Centrally located university lecture theatre.'
  },
  {
    id: 'room-lab-301',
    name: 'Lab 301',
    building: 'Electrical Block',
    capacity: 60,
    floor: 'Third Floor',
    hasAirConditioning: true,
    hasProjector: true,
    hasAudioSystem: false,
    notes: 'Hardware laboratory with 40 workstation benches.'
  }
];

export const INITIAL_LECTURE_SESSIONS: LectureSession[] = [
  // 1. Merged Class: CE-Y1 (120) + EE-Y1 (125) = 245 students in CoE Great Hall (500 cap)
  {
    id: 'session-math151-merged',
    title: 'MATH 151 / EE 151 - Joint Applied Mathematics I',
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    classroomId: 'room-great-hall',
    primaryLecturerId: 'lec-boateng',
    status: 'SCHEDULED',
    courseIds: ['course-math151', 'course-ee151'],
    studentGroupIds: ['group-ce-y1', 'group-ee-y1'],
    isMerged: true,
    mergedGroupId: 'merged-joint-math-1',
    mergedTitle: 'Joint CE/EE Year 1 Applied Mathematics',
    academicYear: '2026/2027',
    semester: 1
  },
  // 2. Single Department: ME-Y2 (140) in CLT 1
  {
    id: 'session-me251',
    day: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    classroomId: 'room-clt-1',
    primaryLecturerId: 'lec-asabere',
    status: 'SCHEDULED',
    courseIds: ['course-me251'],
    studentGroupIds: ['group-me-y2'],
    isMerged: false,
    academicYear: '2026/2027',
    semester: 1
  },
  // 3. Single Department: CE-Y2 in ELT 1 (8:00 - 10:00 Tuesday)
  {
    id: 'session-coe253',
    day: 'Tuesday',
    startTime: '08:00',
    endTime: '10:00',
    classroomId: 'room-elt-1',
    primaryLecturerId: 'lec-agyeiwaa',
    status: 'SCHEDULED',
    courseIds: ['course-coe253'],
    studentGroupIds: ['group-ce-y2'],
    isMerged: false,
    academicYear: '2026/2027',
    semester: 1
  },
  // 4. Single Department: CE-Y2 in PB 002 (14:00 - 16:00 Tuesday)
  {
    id: 'session-coe255-tue',
    day: 'Tuesday',
    startTime: '14:00',
    endTime: '16:00',
    classroomId: 'room-pb-002',
    primaryLecturerId: 'lec-boateng',
    status: 'SCHEDULED',
    courseIds: ['course-coe255'],
    studentGroupIds: ['group-ce-y2'],
    isMerged: false,
    academicYear: '2026/2027',
    semester: 1
  },
  // 5. Merged Class: COE 251 & EE 251 (CE-Y2 110 + EE-Y2 105 = 215 students in PB 001, 300 cap)
  {
    id: 'session-signals-merged',
    title: 'COE 251 / EE 251 - Joint Signals & Systems Fundamentals',
    day: 'Wednesday',
    startTime: '10:00',
    endTime: '12:00',
    classroomId: 'room-pb-001',
    primaryLecturerId: 'lec-mensah',
    status: 'SCHEDULED',
    courseIds: ['course-coe251', 'course-ee251'],
    studentGroupIds: ['group-ce-y2', 'group-ee-y2'],
    isMerged: true,
    mergedGroupId: 'merged-joint-signals-2',
    mergedTitle: 'Joint CE/EE Year 2 Signals & Systems',
    academicYear: '2026/2027',
    semester: 1
  },
  // 6. Single Department: CE-Y3 in CANB 201 (Thursday 08:00 - 10:00)
  {
    id: 'session-coe351',
    day: 'Thursday',
    startTime: '08:00',
    endTime: '10:00',
    classroomId: 'room-canb-201',
    primaryLecturerId: 'lec-boateng',
    status: 'SCHEDULED',
    courseIds: ['course-coe351'],
    studentGroupIds: ['group-ce-y3'],
    isMerged: false,
    academicYear: '2026/2027',
    semester: 1
  },
  // 7. Single Department: CEV-Y2 in CLT 1 (Thursday 12:00 - 14:00)
  {
    id: 'session-cev251',
    day: 'Thursday',
    startTime: '12:00',
    endTime: '14:00',
    classroomId: 'room-clt-1',
    primaryLecturerId: 'lec-osei',
    status: 'SCHEDULED',
    courseIds: ['course-cev251'],
    studentGroupIds: ['group-cev-y2'],
    isMerged: false,
    academicYear: '2026/2027',
    semester: 1
  },
  // 8. Rescheduled Session Example: COE 253 was originally Wed 14:00 in ELT 2, moved to Thursday 14:00 - 16:00 in PB 002
  {
    id: 'session-coe253-rescheduled',
    day: 'Thursday',
    startTime: '14:00',
    endTime: '16:00',
    classroomId: 'room-pb-002',
    primaryLecturerId: 'lec-agyeiwaa',
    status: 'RESCHEDULED',
    courseIds: ['course-coe253'],
    studentGroupIds: ['group-ce-y2'],
    isMerged: false,
    originalDay: 'Wednesday',
    originalStartTime: '14:00',
    originalEndTime: '16:00',
    originalClassroomId: 'room-elt-2',
    rescheduledReason: 'Laboratory equipment maintenance required in ELT 2 on Wednesday afternoon.',
    rescheduledAt: '2026-11-06T09:30:00Z',
    academicYear: '2026/2027',
    semester: 1
  },
  // 9. Cancelled Session Example: Friday 08:00 - 10:00 COE 255 in PB 002
  {
    id: 'session-coe255-cancelled',
    day: 'Friday',
    startTime: '08:00',
    endTime: '10:00',
    classroomId: 'room-pb-002',
    primaryLecturerId: 'lec-boateng',
    status: 'CANCELLED',
    courseIds: ['course-coe255'],
    studentGroupIds: ['group-ce-y2'],
    isMerged: false,
    cancellationReason: 'Prof. Boateng attending emergency CoE Academic Board accreditation session.',
    cancelledAt: '2026-11-07T16:00:00Z',
    cancelledByUserId: 'lec-boateng',
    academicYear: '2026/2027',
    semester: 1
  },
  // 10. Lab session: EE-Y2 in Lab 301 (Friday 10:00 - 12:00)
  {
    id: 'session-ee-lab',
    day: 'Friday',
    startTime: '10:00',
    endTime: '12:00',
    classroomId: 'room-lab-301',
    primaryLecturerId: 'lec-frimpong',
    status: 'SCHEDULED',
    courseIds: ['course-ee151'],
    studentGroupIds: ['group-ee-y2'],
    isMerged: false,
    academicYear: '2026/2027',
    semester: 1
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'CANCELLATION',
    title: 'Lecture Cancelled: COE 255 Software Engineering',
    message: 'The Friday 08:00 - 10:00 lecture for Computer Engineering Year 2 has been cancelled by Prof. Kwame Boateng.',
    timestamp: '2026-11-07T16:00:00Z',
    isRead: false,
    relatedSessionId: 'session-coe255-cancelled',
    courseCodes: ['COE 255'],
    targetDepartmentIds: ['dept-ce'],
    targetGroupIds: ['group-ce-y2'],
    authorName: 'Prof. Kwame Boateng',
    authorRole: 'LECTURER',
    details: {
      originalTime: 'Friday 08:00 - 10:00',
      originalRoom: 'PB 002',
      reason: 'Attending emergency CoE Academic Board accreditation session.'
    }
  },
  {
    id: 'notif-2',
    type: 'RESCHEDULE',
    title: 'Lecture Rescheduled: COE 253 Digital Systems',
    message: 'COE 253 originally on Wednesday 14:00 - 16:00 in ELT 2 has been moved to Thursday 14:00 - 16:00 in PB 002.',
    timestamp: '2026-11-06T09:30:00Z',
    isRead: false,
    relatedSessionId: 'session-coe253-rescheduled',
    courseCodes: ['COE 253'],
    targetDepartmentIds: ['dept-ce'],
    targetGroupIds: ['group-ce-y2'],
    authorName: 'Dr. Joyce Agyeiwaa',
    authorRole: 'LECTURER',
    details: {
      originalTime: 'Wednesday 14:00 - 16:00',
      originalRoom: 'ELT 2',
      newTime: 'Thursday 14:00 - 16:00',
      newRoom: 'PB 002',
      reason: 'Laboratory equipment maintenance required in ELT 2 on Wednesday afternoon.'
    }
  },
  {
    id: 'notif-3',
    type: 'MERGED_CLASS',
    title: 'Official Merged Class Notice: MATH 151 / EE 151',
    message: 'Computer Engineering Y1 and Electrical Engineering Y1 attend Joint Applied Mathematics I together in CoE Great Hall on Mondays 08:00 - 10:00.',
    timestamp: '2026-11-01T08:00:00Z',
    isRead: true,
    relatedSessionId: 'session-math151-merged',
    courseCodes: ['MATH 151', 'EE 151'],
    targetDepartmentIds: ['dept-ce', 'dept-ee'],
    targetGroupIds: ['group-ce-y1', 'group-ee-y1'],
    authorName: 'Academic Affairs Board',
    authorRole: 'ADMIN'
  }
];

export const INITIAL_AUDIT_HISTORY: SchedulingHistoryRecord[] = [
  {
    id: 'hist-1',
    sessionId: 'session-coe255-cancelled',
    action: 'CANCELLED',
    timestamp: '2026-11-07T16:00:00Z',
    performedBy: {
      id: 'lec-boateng',
      name: 'Prof. Kwame Boateng',
      role: 'LECTURER'
    },
    details: 'Cancelled Friday 08:00 - 10:00 COE 255 lecture in PB 002. Reason: CoE Academic Board meeting.'
  },
  {
    id: 'hist-2',
    sessionId: 'session-coe253-rescheduled',
    action: 'RESCHEDULED',
    timestamp: '2026-11-06T09:30:00Z',
    performedBy: {
      id: 'lec-agyeiwaa',
      name: 'Dr. Joyce Agyeiwaa',
      role: 'LECTURER'
    },
    details: 'Rescheduled COE 253 from Wednesday 14:00 (ELT 2) to Thursday 14:00 (PB 002).'
  },
  {
    id: 'hist-3',
    sessionId: 'session-math151-merged',
    action: 'MERGED',
    timestamp: '2026-11-01T08:00:00Z',
    performedBy: {
      id: 'admin-1',
      name: 'Dr. K. A. Mensah (Dean of Engineering)',
      role: 'ADMIN'
    },
    details: 'Created merged lecture session combining CE-Y1 (120) and EE-Y1 (125) with Prof. Kwame Boateng in CoE Great Hall.'
  }
];
