/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Table,
  Check
} from 'lucide-react';
import {
  parseCsvText,
  autoDetectColumnMapping,
  validateCsvRows,
  convertCsvToSessions,
  DEFAULT_CSV_SAMPLE
} from '../../services/csvParser';
import { useKNUSTStore } from '../../db/store';
import { CsvColumnMapping, CsvValidationItem } from '../../types';
import { Modal } from '../common/Modal';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { context, commitImportedSessions } = useKNUSTStore();

  const [rawCsv, setRawCsv] = useState(DEFAULT_CSV_SAMPLE);
  const [step, setStep] = useState<'UPLOAD' | 'MAP' | 'PREVIEW'>('UPLOAD');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping | null>(null);
  const [validationItems, setValidationItems] = useState<CsvValidationItem[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawCsv(text);
        processRawCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const processRawCsv = (text: string) => {
    const { headers: parsedHeaders, rows: parsedRows } = parseCsvText(text);
    if (parsedHeaders.length === 0) {
      alert('The CSV file appears to be empty or unreadable.');
      return;
    }
    setHeaders(parsedHeaders);
    setRows(parsedRows);
    const detected = autoDetectColumnMapping(parsedHeaders);
    setMapping(detected);
    setStep('MAP');
  };

  const handleProceedToPreview = () => {
    if (!mapping) return;
    const validated = validateCsvRows(rows, mapping, context);
    setValidationItems(validated);
    setStep('PREVIEW');
  };

  const handleConfirmImport = () => {
    if (!mapping) return;
    const { sessions } = convertCsvToSessions(validationItems, context);
    commitImportedSessions(sessions, {
      id: 'admin-1',
      name: 'Academic Affairs Board',
      role: 'ADMIN'
    });
    setImportSuccessMsg(`Successfully committed ${sessions.length} timetable lecture sessions!`);
    setTimeout(() => {
      setImportSuccessMsg(null);
      onClose();
    }, 1800);
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([DEFAULT_CSV_SAMPLE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'KNUST_College_of_Engineering_Sample_Timetable.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validCount = validationItems.filter(v => v.status === 'VALID').length;
  const warningCount = validationItems.filter(v => v.status === 'WARNING').length;
  const errorCount = validationItems.filter(v => v.status === 'ERROR').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="KNUST Timetable CSV Import Engine"
      subtitle="Flexible column mapper, format validator, duplicate detector, and merged-group tagger"
      maxWidth="5xl"
    >
      <div className="space-y-4">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step === 'UPLOAD' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              1
            </span>
            <span className={step === 'UPLOAD' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              File Upload / Paste
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step === 'MAP' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              2
            </span>
            <span className={step === 'MAP' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              Column Mapping
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step === 'PREVIEW' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              3
            </span>
            <span className={step === 'PREVIEW' ? 'font-bold text-slate-900' : 'text-slate-500'}>
              Validation & Commit
            </span>
          </div>
        </div>

        {/* STEP 1: UPLOAD OR PASTE */}
        {step === 'UPLOAD' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
              <Upload className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">Upload College Timetable CSV</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Drag and drop your file here, or browse from your device. Columns can be mapped in the next step.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <div className="mt-3 flex items-center justify-center gap-2">
                <label
                  htmlFor="csv-file-input"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs"
                >
                  Browse File
                </label>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Or Paste Raw CSV Data (Preloaded with Demonstration Rows)</span>
                </label>
                <button
                  onClick={() => setRawCsv(DEFAULT_CSV_SAMPLE)}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Reset Sample Text
                </button>
              </div>
              <textarea
                rows={6}
                value={rawCsv}
                onChange={(e) => setRawCsv(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => processRawCsv(rawCsv)}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Column Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FLEXIBLE COLUMN MAPPING */}
        {step === 'MAP' && mapping && (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950">
              <h4 className="font-bold text-sm">Flexible Header Auto-Mapping</h4>
              <p className="mt-0.5 text-emerald-800">
                The parser has auto-detected likely column correspondences. Verify or reassign fields to match your CSV layout before running validation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {(Object.keys(mapping) as Array<keyof CsvColumnMapping>).map((fieldKey) => (
                <div key={fieldKey} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-700 capitalize">
                    {fieldKey.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <select
                    value={mapping[fieldKey]}
                    onChange={(e) => setMapping({ ...mapping, [fieldKey]: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-medium"
                  >
                    <option value="">-- Ignore Field --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setStep('UPLOAD')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back to File
              </button>
              <button
                onClick={handleProceedToPreview}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Run Validation & Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VALIDATION PREVIEW & COMMIT */}
        {step === 'PREVIEW' && (
          <div className="space-y-4">
            {/* Stats badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1.5 rounded-lg font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{validCount} Ready to Import</span>
              </span>
              {warningCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{warningCount} Warnings (Auto-resolved)</span>
                </span>
              )}
              {errorCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg font-bold bg-rose-100 text-rose-800 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{errorCount} Rows with Blocking Errors</span>
                </span>
              )}
            </div>

            {/* Validation Table */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Slot</th>
                    <th className="py-2.5 px-3">Venue</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Diagnostic Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {validationItems.map((item) => (
                    <tr
                      key={item.rowIndex}
                      className={
                        item.status === 'ERROR'
                          ? 'bg-rose-50/50 text-rose-950'
                          : item.status === 'WARNING'
                          ? 'bg-amber-50/30'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2 px-3 font-mono text-slate-400">#{item.rowIndex}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.data.courseCode || '-'}</td>
                      <td className="py-2 px-3">{item.data.studentGroupCode || '-'}</td>
                      <td className="py-2 px-3 font-mono">{item.data.day} {item.data.startTime}-{item.data.endTime}</td>
                      <td className="py-2 px-3 font-semibold">{item.data.classroomName || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'VALID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600">
                        {item.messages.join(' • ') || 'All checks passed.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {importSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setStep('MAP')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Back to Mapping
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={validCount === 0}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 ${
                  validCount === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Import ({validCount + warningCount} Valid Rows)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
