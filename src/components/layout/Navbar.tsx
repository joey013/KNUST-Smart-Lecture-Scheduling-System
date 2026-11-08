/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  GraduationCap,
  UserCheck,
  ShieldAlert,
  Bell,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../../types';
import { useKNUSTStore } from '../../db/store';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  selectedLecturerId: string;
  onLecturerChange: (lecturerId: string) => void;
  onOpenNotifications: () => void;
  onOpenTestSuite: () => void;
  onOpenCsvImport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  selectedGroupId,
  onGroupChange,
  selectedLecturerId,
  onLecturerChange,
  onOpenNotifications,
  onOpenTestSuite,
  onOpenCsvImport
}) => {
  const { studentGroups, lecturers, notifications, resetToSampleData } = useKNUSTStore();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleReset = () => {
    if (window.confirm('Reset all scheduling data back to clean KNUST College of Engineering sample demonstration dataset?')) {
      resetToSampleData();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top institution banner */}
      <div className="bg-[#005a36] text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-amber-300">KNUST</span>
          <span className="text-emerald-200">|</span>
          <span>College of Engineering (CoE)</span>
          <span className="hidden sm:inline text-emerald-200">•</span>
          <span className="hidden sm:inline text-emerald-100">Smart Timetable & Classroom Allocation Engine</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-emerald-100">
          <span className="bg-emerald-900/80 px-2 py-0.5 rounded text-amber-200 font-mono">
            Sem 1 • 2026/2027
          </span>
          <button
            onClick={onOpenTestSuite}
            className="flex items-center gap-1 text-emerald-100 hover:text-white hover:underline cursor-pointer"
            title="Run 23 Automated Scenario Verification Tests"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Verify Engine (23 Tests)</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-black text-lg shadow-sm border border-emerald-900">
              CoE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  Smart Class Scheduling
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Kwame Nkrumah University of Science and Technology
              </p>
            </div>
          </div>

          {/* Role Switcher & Persona Selectors */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary Role Tabs */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-0.5 border border-slate-200">
              <button
                onClick={() => onRoleChange('STUDENT')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentRole === 'STUDENT'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Student</span>
              </button>

              <button
                onClick={() => onRoleChange('LECTURER')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentRole === 'LECTURER'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lecturer</span>
              </button>

              <button
                onClick={() => onRoleChange('ADMIN')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  currentRole === 'ADMIN'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin</span>
              </button>
            </div>

            {/* Persona Context Dropdown */}
            {currentRole === 'STUDENT' && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs">
                <span className="text-slate-400 font-medium">Group:</span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => onGroupChange(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {studentGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.population} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentRole === 'LECTURER' && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs">
                <span className="text-slate-400 font-medium">Lecturer:</span>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => onLecturerChange(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.title} {l.fullName} ({l.departmentId.replace('dept-', '').toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              aria-label="Open notifications"
              title="Class Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Reset Data Button */}
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-slate-200"
              title="Reset to KNUST Demo Dataset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
