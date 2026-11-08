/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building, Plus, Search, Edit2, Trash2, CheckCircle, Wind, Tv, Volume2, Users, AlertTriangle } from 'lucide-react';
import { Classroom } from '../../types';
import { useKNUSTStore } from '../../db/store';
import { Modal } from '../common/Modal';

export const ClassroomManagement: React.FC = () => {
  const { classrooms, lectureSessions, addClassroom, updateClassroom, deleteClassroom } = useKNUSTStore();

  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formCapacity, setFormCapacity] = useState(150);
  const [formFloor, setFormFloor] = useState('Ground Floor');
  const [formAc, setFormAc] = useState(true);
  const [formProjector, setFormProjector] = useState(true);
  const [formAudio, setFormAudio] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  const buildings = Array.from(new Set(classrooms.map(c => c.building)));

  const filteredClassrooms = classrooms.filter(c => {
    if (buildingFilter !== 'ALL' && c.building !== buildingFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.building.toLowerCase().includes(q);
    }
    return true;
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormName('');
    setFormBuilding('Petroleum Building');
    setFormCapacity(150);
    setFormFloor('Ground Floor');
    setFormAc(true);
    setFormProjector(true);
    setFormAudio(false);
    setFormNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (room: Classroom) => {
    setEditingRoom(room);
    setFormName(room.name);
    setFormBuilding(room.building);
    setFormCapacity(room.capacity);
    setFormFloor(room.floor || 'Ground Floor');
    setFormAc(room.hasAirConditioning);
    setFormProjector(room.hasProjector);
    setFormAudio(room.hasAudioSystem);
    setFormNotes(room.notes || '');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formBuilding.trim()) {
      setFormError('Classroom name and building are required.');
      return;
    }

    if (formCapacity <= 0) {
      setFormError('Classroom capacity must be at least 1 seat.');
      return;
    }

    if (editingRoom) {
      updateClassroom(editingRoom.id, {
        name: formName.trim(),
        building: formBuilding.trim(),
        capacity: Number(formCapacity),
        floor: formFloor,
        hasAirConditioning: formAc,
        hasProjector: formProjector,
        hasAudioSystem: formAudio,
        notes: formNotes
      });
    } else {
      addClassroom({
        name: formName.trim(),
        building: formBuilding.trim(),
        capacity: Number(formCapacity),
        floor: formFloor,
        hasAirConditioning: formAc,
        hasProjector: formProjector,
        hasAudioSystem: formAudio,
        notes: formNotes
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (room: Classroom) => {
    if (window.confirm(`Are you sure you want to delete classroom ${room.name}?`)) {
      const res = deleteClassroom(room.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Classroom & Lecture Hall Inventory</h3>
          <p className="text-xs text-slate-500">
            Manage physical halls, seat capacities, multimedia capabilities, and building locations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Classroom</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search hall name or building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer"
        >
          <option value="ALL">All Buildings ({classrooms.length} Halls)</option>
          {buildings.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Classroom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredClassrooms.map(room => {
          const activeBookings = lectureSessions.filter(
            s => s.classroomId === room.id && s.status !== 'CANCELLED'
          ).length;

          return (
            <div key={room.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{room.name}</h4>
                    <p className="text-xs text-slate-500">{room.building}</p>
                    <span className="text-[11px] text-slate-400">{room.floor || 'Ground'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md font-mono text-xs font-black bg-emerald-100 text-emerald-800">
                    {room.capacity} seats
                  </span>
                </div>

                {/* Features */}
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                  {room.hasAirConditioning && (
                    <span className="flex items-center gap-1 text-sky-700" title="Air Conditioned">
                      <Wind className="w-3.5 h-3.5" /> AC
                    </span>
                  )}
                  {room.hasProjector && (
                    <span className="flex items-center gap-1 text-emerald-700" title="Multimedia Projector">
                      <Tv className="w-3.5 h-3.5" /> Projector
                    </span>
                  )}
                  {room.hasAudioSystem && (
                    <span className="flex items-center gap-1 text-purple-700" title="PA Sound">
                      <Volume2 className="w-3.5 h-3.5" /> PA System
                    </span>
                  )}
                </div>

                {room.notes && (
                  <p className="text-[11px] text-slate-400 mt-2 italic line-clamp-2">
                    {room.notes}
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {activeBookings} active lecture bookings
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(room)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                    title="Edit Classroom"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(room)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md cursor-pointer"
                    title="Delete Classroom"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Classroom Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingRoom ? `Edit Classroom: ${editingRoom.name}` : 'Register New Campus Classroom'}
        maxWidth="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Classroom Name / Number *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. PB 003 or ELT 3"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Building / Block *</label>
            <input
              type="text"
              value={formBuilding}
              onChange={(e) => setFormBuilding(e.target.value)}
              placeholder="e.g. Petroleum Building"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Capacity (Seats) *</label>
              <input
                type="number"
                value={formCapacity}
                onChange={(e) => setFormCapacity(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Floor Level</label>
              <input
                type="text"
                value={formFloor}
                onChange={(e) => setFormFloor(e.target.value)}
                placeholder="Ground Floor"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Amenities checkboxes */}
          <div className="space-y-1.5 pt-1">
            <span className="font-semibold text-slate-700 block">Classroom Facilities</span>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAc}
                  onChange={(e) => setFormAc(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Air Conditioning</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formProjector}
                  onChange={(e) => setFormProjector(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Projector</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAudio}
                  onChange={(e) => setFormAudio(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Audio PA System</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes / Location Guidelines</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Near dean's office; wheelchair ramp accessible."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          {formError && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-lg">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              Save Classroom
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
