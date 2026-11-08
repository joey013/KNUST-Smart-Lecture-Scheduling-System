/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Users,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { DayOfWeek, LectureSession } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { Modal } from '../common/Modal';
import { CAMPUS_DAYS } from '../../services/schedulingEngine';

export const MergedClassManager: React.FC = () => {
  const {
    lectureSessions,
    courses,
    studentGroups,
    departments,
    classrooms,
    lecturers,
    createLectureSession
  } = useKNUSTStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mergedTitle, setMergedTitle] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('lec-boateng');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('room-great-hall');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mergedSessions = lectureSessions.filter(s => s.isMerged);

  // Calculate combined population
  const selectedGroups = studentGroups.filter(g => selectedGroupIds.includes(g.id));
  const combinedPopulation = selectedGroups.reduce((acc, g) => acc + g.population, 0);
  const targetClassroom = classrooms.find(r => r.id === selectedClassroomId);

  const openCreateModal = () => {
    setMergedTitle('Joint Applied Mathematics I');
    setSelectedCourseIds(['course-math151', 'course-ee151']);
    setSelectedGroupIds(['group-ce-y1', 'group-ee-y1']);
    setSelectedLecturerId('lec-boateng');
    setSelectedClassroomId('room-great-hall');
    setSelectedDay('Monday');
    setStartTime('08:00');
    setEndTime('10:00');
    setErrorMsg(null);
    setIsCreateModalOpen(true);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleCreateMerged = () => {
    if (!mergedTitle.trim()) {
      setErrorMsg('Please specify a title for the combined/merged lecture.');
      return;
    }

    if (selectedCourseIds.length === 0) {
      setErrorMsg('Select at least one course for this merged class.');
      return;
    }

    if (selectedGroupIds.length < 2) {
      setErrorMsg('A merged class requires at least 2 participating student groups (e.g. CE-Y1 + EE-Y1).');
      return;
    }

    if (!selectedClassroomId) {
      setErrorMsg('Select an assigned classroom hall.');
      return;
    }

    const res = createLectureSession({
      title: mergedTitle.trim(),
      day: selectedDay,
      startTime,
      endTime,
      classroomId: selectedClassroomId,
      primaryLecturerId: selectedLecturerId,
      courseIds: selectedCourseIds,
      studentGroupIds: selectedGroupIds,
      isMerged: true,
      mergedTitle: mergedTitle.trim(),
      user: {
        id: 'admin-1',
        name: 'Dean of Engineering (Academic Affairs)',
        role: 'ADMIN'
      }
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to schedule merged class.');
      return;
    }

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-linear-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Department Merged Class Engine</span>
          </div>
          <h2 className="text-2xl font-black text-white">KNUST Merged Class Coordinator</h2>
          <p className="text-xs text-indigo-200 max-w-xl mt-1">
            Combines cohorts from multiple departments into one unified session with combined capacity calculations, ensuring single shared lecturer and hall bookings without triggering false conflicts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-900" />
          <span>Create Merged Lecture</span>
        </button>
      </div>

      {/* Merged Classes List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base">
          Active Merged Sessions ({mergedSessions.length})
        </h3>

        {mergedSessions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No merged classes created yet. Click above to establish a joint multi-department class.
          </div>
        ) : (
          mergedSessions.map(session => {
            const room = classrooms.find(r => r.id === session.classroomId);
            const sessionCourses = courses.filter(c => session.courseIds.includes(c.id));
            const groups = studentGroups.filter(g => session.studentGroupIds.includes(g.id));
            const totalStudents = groups.reduce((acc, g) => acc + g.population, 0);
            const lecturer = lecturers.find(l => l.id === session.primaryLecturerId);

            return (
              <div key={session.id} className="p-4 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {session.mergedTitle || session.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-semibold text-xs bg-indigo-100 text-indigo-800">
                        Official Merged
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Merged courses: {sessionCourses.map(c => `${c.code} (${c.title})`).join(' • ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{session.day} {session.startTime} - {session.endTime}</span>
                  </div>
                </div>

                {/* Relational details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Participating Cohorts:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {groups.map(g => (
                        <div key={g.id} className="flex items-center justify-between">
                          <span>{g.name}</span>
                          <span className="text-slate-500 font-mono">({g.population})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Combined Room Capacity:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {room?.name} ({room?.capacity} seats)
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      ✓ Accommodates combined {totalStudents} students
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Assigned Shared Lecturer:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {lecturer?.title} {lecturer?.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dept: {lecturer?.departmentId.replace('dept-', '').toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Merged Class Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Official Merged Lecture"
        subtitle="Links multiple department student groups into one room and verifies joint capacity"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Merged Lecture Title *</label>
            <input
              type="text"
              value={mergedTitle}
              onChange={(e) => setMergedTitle(e.target.value)}
              placeholder="e.g. Joint Applied Mathematics I or Combined Signals & Systems"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          {/* Select Multiple Student Groups */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Select Participating Student Groups * (Requires at least 2)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
              {studentGroups.map(group => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <div
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span>{group.name}</span>
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      {group.population} students
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1 text-right text-xs font-bold text-indigo-800">
              Combined Student Population: {combinedPopulation} students
            </div>
          </div>

          {/* Select Multiple Courses */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Select Participating Courses *</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
              {courses.map(course => {
                const isSelected = selectedCourseIds.includes(course.id);
                return (
                  <div
                    key={course.id}
                    onClick={() => toggleCourse(course.id)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span>{course.code}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{course.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date, Time, Room, Lecturer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Assigned Lecturer</label>
              <select
                value={selectedLecturerId}
                onChange={(e) => setSelectedLecturerId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                {lecturers.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.title} {l.fullName} ({l.departmentId.replace('dept-', '').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Classroom / Auditorium</label>
              <select
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                {classrooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} - Capacity: {r.capacity} seats ({r.building})
                  </option>
                ))}
              </select>
              {targetClassroom && targetClassroom.capacity < combinedPopulation && (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  ⚠ Room capacity ({targetClassroom.capacity}) is too small for combined population ({combinedPopulation})!
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                {CAMPUS_DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-center font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-center font-bold"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMerged}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Link Departments</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
