/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, MapPin, Users, CheckCircle2, XCircle, Wind, Tv, Volume2 } from 'lucide-react';
import { Classroom, DayOfWeek } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { CAMPUS_DAYS, findClassroomAvailability } from '../../services/schedulingEngine';
import { Modal } from '../common/Modal';

interface ClassroomSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDay?: DayOfWeek;
  initialStartTime?: string;
  initialEndTime?: string;
  onSelectClassroom?: (classroom: Classroom) => void;
  requiredCapacity?: number;
}

export const ClassroomSearchModal: React.FC<ClassroomSearchModalProps> = ({
  isOpen,
  onClose,
  initialDay = 'Monday',
  initialStartTime = '08:00',
  initialEndTime = '10:00',
  onSelectClassroom,
  requiredCapacity = 0
}) => {
  const { context } = useKNUSTStore();
  const [day, setDay] = useState<DayOfWeek>(initialDay);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [minCapacity, setMinCapacity] = useState(requiredCapacity || 0);
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');

  const availability = findClassroomAvailability(
    day,
    startTime,
    endTime,
    minCapacity,
    context
  );

  const buildings = Array.from(new Set(context.classrooms.map(c => c.building)));

  const filteredAvailable = availability.availableClassrooms.filter(item => {
    if (buildingFilter !== 'ALL' && item.classroom.building !== buildingFilter) return false;
    return true;
  });

  const filteredOccupied = availability.occupiedClassrooms.filter(item => {
    if (buildingFilter !== 'ALL' && item.classroom.building !== buildingFilter) return false;
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Classroom Availability & Venue Search"
      subtitle="Find unoccupied lecture halls, check seat capacities, and locate study venues"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Search controls */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Day of Week</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            >
              {CAMPUS_DAYS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-center font-medium"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-center font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Min Capacity (Seats)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              placeholder="e.g. 100"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Building / Block</label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="ALL">All Campus Buildings</option>
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary stats */}
        <div className="flex items-center gap-4 text-xs font-medium px-1">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{filteredAvailable.length} Available Rooms</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>{filteredOccupied.length} Currently Booked</span>
          </span>
        </div>

        {/* Available Rooms Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Available Rooms ({day} {startTime} - {endTime})
          </h4>

          {filteredAvailable.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs border border-slate-200">
              No classrooms available matching this time slot and capacity criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredAvailable.map(({ classroom, fitsCapacity, excessSeats }) => (
                <div
                  key={classroom.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>{classroom.name}</span>
                        </div>
                        <p className="text-xs text-slate-500">{classroom.building} ({classroom.floor || 'Ground'})</p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                        fitsCapacity ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {classroom.capacity} seats
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-500">
                      {classroom.hasAirConditioning && (
                        <span className="flex items-center gap-1 text-sky-700" title="Air Conditioned">
                          <Wind className="w-3.5 h-3.5" /> AC
                        </span>
                      )}
                      {classroom.hasProjector && (
                        <span className="flex items-center gap-1 text-emerald-700" title="Projector Equipped">
                          <Tv className="w-3.5 h-3.5" /> Projector
                        </span>
                      )}
                      {classroom.hasAudioSystem && (
                        <span className="flex items-center gap-1 text-purple-700" title="PA Sound System">
                          <Volume2 className="w-3.5 h-3.5" /> PA Audio
                        </span>
                      )}
                    </div>

                    {classroom.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">{classroom.notes}</p>
                    )}
                  </div>

                  {onSelectClassroom && (
                    <button
                      onClick={() => {
                        onSelectClassroom(classroom);
                        onClose();
                      }}
                      className="mt-3 w-full py-1.5 bg-emerald-700 text-white font-semibold text-xs rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Select {classroom.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Occupied Rooms Collapsible Section */}
        {filteredOccupied.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Occupied Rooms During This Slot ({filteredOccupied.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredOccupied.map(({ classroom, courseCodes, lecturerName, occupiedBy }) => (
                <div key={classroom.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{classroom.name}</span>
                    <span className="text-slate-500 text-[11px] ml-1.5">({classroom.building})</span>
                    <div className="text-slate-600 font-medium text-[11px] mt-0.5">
                      Booked by: <span className="font-semibold text-slate-900">{courseCodes.join('/')}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>{occupiedBy.startTime}-{occupiedBy.endTime}</div>
                    <div className="truncate max-w-[120px]">{lecturerName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
