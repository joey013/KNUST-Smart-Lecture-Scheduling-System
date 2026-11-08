/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNUST SMART CLASS SCHEDULING SYSTEM
 * College of Engineering, Kwame Nkrumah University of Science and Technology (KNUST), Ghana
 */

import React, { useState } from 'react';
import { UserRole } from './types';
import { Navbar } from './components/layout/Navbar';
import { NotificationCenter } from './components/layout/NotificationCenter';
import { StudentDashboard } from './components/student/StudentDashboard';
import { LecturerDashboard } from './components/lecturer/LecturerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TestSuiteModal } from './components/admin/TestSuiteModal';
import { CsvImportModal } from './components/admin/CsvImportModal';
import { useKNUSTStore } from './db/store';
import { GraduationCap, ShieldCheck, CheckCircle2, Building, RefreshCw, FileText } from 'lucide-react';

export default function App() {
  const { studentGroups, lecturers, resetToSampleData } = useKNUSTStore();

  const [currentRole, setCurrentRole] = useState<UserRole>('STUDENT');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('group-ce-y2');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('lec-boateng');

  // Modals
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Institution Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        selectedLecturerId={selectedLecturerId}
        onLecturerChange={setSelectedLecturerId}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onOpenCsvImport={() => setIsCsvImportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'STUDENT' && (
          <StudentDashboard
            selectedGroupId={selectedGroupId}
            onOpenNotifications={() => setIsNotificationOpen(true)}
          />
        )}

        {currentRole === 'LECTURER' && (
          <LecturerDashboard
            selectedLecturerId={selectedLecturerId}
          />
        )}

        {currentRole === 'ADMIN' && (
          <AdminDashboard
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenTestSuite={() => setIsTestSuiteOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 font-black text-sm flex items-center justify-center">
              CoE
            </div>
            <div>
              <p className="font-bold text-slate-800">
                Kwame Nkrumah University of Science and Technology (KNUST)
              </p>
              <p className="text-[11px] text-slate-500">
                College of Engineering • Computer Engineering Final Year Project Prototype
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setIsTestSuiteOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Engine (23 Tests)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCsvImportOpen(true)}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Timetable CSV Import</span>
            </button>
            <span>•</span>
            <button
              onClick={() => {
                if (window.confirm('Reset all timetable records to KNUST demonstration dataset?')) {
                  resetToSampleData();
                }
              }}
              className="text-rose-600 hover:underline cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-out Notification Drawer */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        currentRole={currentRole}
        currentGroupId={selectedGroupId}
        currentLecturerId={selectedLecturerId}
      />

      {/* Automated Scenario Verification Suite Modal (23 Tests) */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      {/* CSV Timetable Import Modal */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
      />
    </div>
  );
}
