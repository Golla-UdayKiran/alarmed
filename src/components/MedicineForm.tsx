/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  Pill, 
  FileText, 
  Sliders, 
  Tag 
} from 'lucide-react';
import { Medicine } from '../types';

interface MedicineFormProps {
  onSave: (medicine: Omit<Medicine, 'id'>) => void;
  onCancel: () => void;
  initialMedicine?: Medicine; // If editing
}

export default function MedicineForm({ onSave, onCancel, initialMedicine }: MedicineFormProps) {
  const [name, setName] = useState(initialMedicine?.name || '');
  const [dosage, setDosage] = useState(initialMedicine?.dosage || '1 Pill');
  const [type, setType] = useState<Medicine['type']>(initialMedicine?.type || 'pill');
  const [color, setColor] = useState<Medicine['color']>(initialMedicine?.color || 'emerald');
  const [stock, setStock] = useState<number>(initialMedicine?.stock !== undefined ? initialMedicine.stock : 60);
  const [reorderLevel, setReorderLevel] = useState<number>(initialMedicine?.reorderLevel !== undefined ? initialMedicine.reorderLevel : 10);
  const [instructions, setInstructions] = useState(initialMedicine?.instructions || '');
  
  // Array of "HH:MM" timings
  const [alarms, setAlarms] = useState<string[]>(initialMedicine?.alarms || ['08:00']);
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');

  const addAlarm = () => {
    if (!newAlarmTime) return;
    // Prevent duplicates
    if (!alarms.includes(newAlarmTime)) {
      setAlarms([...alarms, newAlarmTime].sort());
    }
  };

  const removeAlarm = (indexToRemove: number) => {
    setAlarms(alarms.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      dosage: dosage.trim() || '1 Pill',
      type,
      color,
      stock: Number(stock) >= 0 ? Number(stock) : 0,
      reorderLevel: Number(reorderLevel) >= 0 ? Number(reorderLevel) : 0,
      alarms: alarms.length > 0 ? alarms : ['08:00'],
      instructions: instructions.trim() || undefined,
    });
  };

  const colors: Medicine['color'][] = ['emerald', 'amber', 'rose', 'indigo', 'violet', 'sky'];
  const types: Medicine['type'][] = ['pill', 'capsule', 'liquid', 'tablets', 'injection', 'other'];

  const colorClasses = {
    emerald: 'bg-emerald-500 border-emerald-600 ring-emerald-300',
    amber: 'bg-amber-500 border-amber-600 ring-amber-300',
    rose: 'bg-rose-500 border-rose-600 ring-rose-300',
    indigo: 'bg-indigo-500 border-indigo-600 ring-indigo-300',
    violet: 'bg-violet-500 border-violet-600 ring-violet-300',
    sky: 'bg-sky-500 border-sky-600 ring-sky-300'
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-6 shadow-xs">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-sans font-bold text-slate-900 text-base">
            {initialMedicine ? 'Edit Drug Details' : 'Manual Medicine Setup'}
          </h3>
          <p className="text-[10px] text-slate-400">Configure parameters, stock counts & schedule alert timings</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Medicine Name */}
        <div className="space-y-1.5 animate-fade-in">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Pill className="w-3.5 h-3.5" /> Medicine / Drug Name
          </label>
          <input 
            type="text"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm font-sans text-slate-800"
            placeholder="e.g. Lipitor, Paracetamol, Insulin"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Dosage & Drug Type */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Single Dosage
            </label>
            <input 
              type="text"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm font-sans text-slate-800"
              placeholder="e.g. 1 Pill, 10ml, 1 Capsule"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Formulation
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm font-sans text-slate-800"
              value={type}
              onChange={(e) => setType(e.target.value as Medicine['type'])}
            >
              {types.map(t => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Starting Stock & Reorder Trigger */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Pill className="w-3.5 h-3.5 text-slate-500" /> Loaded Pills Count
            </label>
            <input 
              type="number"
              min="0"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm font-sans text-slate-800"
              placeholder="e.g. 60"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Low Stock Cutoff
            </label>
            <input 
              type="number"
              min="0"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm font-sans text-slate-800"
              placeholder="e.g. 10 (Alerts under)"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        {/* Color Coding Themes */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Pick Medication UI Accent Color</label>
          <div className="flex gap-2.5 justify-between">
            {colors.map(col => {
              const active = color === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    active 
                      ? 'border-slate-800 scale-110 ring-2' 
                      : 'border-transparent hover:scale-105'
                  } ${colorClasses[col]}`}
                  title={col}
                />
              );
            })}
          </div>
        </div>

        {/* Custom Intake Instructions */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Guidelines / Remarks
          </label>
          <input 
            type="text"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm font-sans text-slate-800"
            placeholder="e.g. Take after breakfast, avoid citric drinks"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        {/* MULTIPLE ALARM ALERT TIMINGS */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" /> Daily Alert Timings (Multiple Alarms Supported)
          </label>
          
          <div className="flex items-center gap-2">
            <input 
              type="time"
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-semibold"
              value={newAlarmTime}
              onChange={(e) => setNewAlarmTime(e.target.value)}
            />
            <button
              type="button"
              onClick={addAlarm}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Timing
            </button>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
            {alarms.length === 0 ? (
              <p className="text-[10px] text-zinc-400 italic">No schedules alarms registered. At least one required.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {alarms.map((alarm, idx) => {
                  const [hr, min] = alarm.split(':').map(Number);
                  const displayHr = hr % 12 || 12;
                  const ampm = hr >= 12 ? 'PM' : 'AM';
                  return (
                    <div 
                      key={`alarm-${alarm}-${idx}`}
                      className="inline-flex items-center gap-1 BG px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{`${displayHr}:${min.toString().padStart(2, '0')} ${ampm}`}</span>
                      <button
                        type="button"
                        onClick={() => removeAlarm(idx)}
                        className="p-0.5 hover:bg-slate-100 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold py-2.5 rounded-xl block text-center cursor-pointer transition-colors shadow-xs"
          >
            {initialMedicine ? 'Update Medication' : 'Save Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
}
