/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  AlertTriangle,
  Clock,
  FileText,
  Play,
  ShieldCheck
} from 'lucide-react';
import { runAllSchedulingTests, TestResult } from '../../services/testRunner';
import { useKNUSTStore } from '../../db/store';
import { Modal } from '../common/Modal';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const { departments, studentGroups, courses, lecturers, classrooms, lectureSessions } = useKNUSTStore();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MERGED_CLASS' | 'CONFLICTS' | 'CANCELLATION_RESCHEDULING' | 'CSV_IMPORT'>('ALL');

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllSchedulingTests({
        departments,
        studentGroups,
        courses,
        lecturers,
        classrooms,
        lectureSessions,
        notifications: [],
        auditHistory: []
      });
      setResults(res);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      runTests();
    }
  }, [isOpen]);

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalExecutionMs = results.reduce((acc, r) => acc + r.executionMs, 0).toFixed(1);

  const filteredResults = results.filter(r => {
    if (activeCategory === 'ALL') return true;
    return r.category === activeCategory;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Scenario Verification Suite (23 Tests)"
      subtitle="Comprehensive validation for KNUST Academic Affairs presentation"
      maxWidth="5xl"
    >
      <div className="space-y-4">
        {/* Hero Scoreboard */}
        <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-lg">
                Scheduling Engine Verification: {passedTests} / {totalTests} Passed
              </h3>
              <p className="text-xs text-emerald-200">
                Executed in {totalExecutionMs}ms across merged classes, conflicts, cancellations, and CSV modules.
              </p>
            </div>
          </div>

          <button
            onClick={runTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing Tests...' : 'Re-run All Tests'}</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 23 Tests ({passedTests}/{totalTests})
          </button>

          <button
            onClick={() => setActiveCategory('MERGED_CLASS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'MERGED_CLASS'
                ? 'bg-indigo-700 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Merged Class Tests (1-5)</span>
          </button>

          <button
            onClick={() => setActiveCategory('CONFLICTS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'CONFLICTS'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Conflict Detection Tests (6-9)</span>
          </button>

          <button
            onClick={() => setActiveCategory('CANCELLATION_RESCHEDULING')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'CANCELLATION_RESCHEDULING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cancellation & Rescheduling (10-18)</span>
          </button>

          <button
            onClick={() => setActiveCategory('CSV_IMPORT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'CSV_IMPORT'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV Timetable Tests (19-23)</span>
          </button>
        </div>

        {/* Tests List */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredResults.map(test => (
            <div
              key={test.id}
              className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-all ${
                test.passed
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">#{test.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{test.name}</h4>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{test.message}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`px-2 py-0.5 rounded-md font-bold font-mono text-[11px] ${
                  test.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 font-mono">{test.executionMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
