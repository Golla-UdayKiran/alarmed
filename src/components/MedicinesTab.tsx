/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle,
  FileText,
  Volume2
} from 'lucide-react';
import { Medicine } from '../types';
import MedicineForm from './MedicineForm';

interface MedicinesTabProps {
  medicines: Medicine[];
  onAddMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  onEditMedicine: (id: string, updated: Omit<Medicine, 'id'>) => void;
  onDeleteMedicine: (id: string) => void;
  onRefillMedicine: (id: string, refillAmt: number) => void;
}

export default function MedicinesTab({
  medicines,
  onAddMedicine,
  onEditMedicine,
  onDeleteMedicine,
  onRefillMedicine
}: MedicinesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [deletingMedId, setDeletingMedId] = useState<string | null>(null);
  
  // Quick Refill states
  const [refillValue, setRefillValue] = useState<{ [key: string]: number }>({});

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateOrUpdate = (medData: Omit<Medicine, 'id'>) => {
    if (editingMed) {
      onEditMedicine(editingMed.id, medData);
      setEditingMed(null);
    } else {
      onAddMedicine(medData);
    }
    setIsFormOpen(false);
  };

  const startEdit = (med: Medicine) => {
    setEditingMed(med);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    const med = medicines.find(m => m.id === id);
    if (med) {
      setDeletingMedId(id);
    }
  };

  const executeDelete = () => {
    if (deletingMedId) {
      onDeleteMedicine(deletingMedId);
      setDeletingMedId(null);
    }
  };

  const handleRefillInput = (medId: string, value: number) => {
    setRefillValue(prev => ({ ...prev, [medId]: value }));
  };

  const triggerRefill = (medId: string) => {
    const amt = refillValue[medId] || 30; // default to 30
    onRefillMedicine(medId, amt);
    setRefillValue(prev => {
      const updated = { ...prev };
      delete updated[medId];
      return updated;
    });
  };

  // Icon color schemes
  const colorClasses = {
    emerald: { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', badge: 'bg-emerald-500', btn: 'hover:bg-emerald-50 text-emerald-600' },
    amber: { bg: 'bg-amber-50 border-amber-100 text-amber-700', badge: 'bg-amber-500', btn: 'hover:bg-amber-50 text-amber-600' },
    rose: { bg: 'bg-rose-50 border-rose-100 text-rose-700', badge: 'bg-rose-500', btn: 'hover:bg-rose-50 text-rose-600' },
    indigo: { bg: 'bg-indigo-50 border-indigo-100 text-indigo-700', badge: 'bg-indigo-500', btn: 'hover:bg-indigo-50 text-indigo-600' },
    violet: { bg: 'bg-violet-50 border-violet-100 text-violet-700', badge: 'bg-violet-500', btn: 'hover:bg-violet-50 text-violet-600' },
    sky: { bg: 'bg-sky-50 border-sky-100 text-sky-700', badge: 'bg-sky-500', btn: 'hover:bg-sky-50 text-sky-600' }
  };

  if (isFormOpen) {
    return (
      <div className="p-4">
        <MedicineForm 
          onSave={handleCreateOrUpdate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingMed(null);
          }}
          initialMedicine={editingMed || undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Upper header section */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h2 className="text-sm font-bold font-sans text-slate-800">My Medicine Cabinet</h2>
          <p className="text-[10px] text-slate-400 font-sans">
            Currently tracking <span className="font-bold text-emerald-600">{medicines.length}</span> drugs
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3.5 rounded-xl font-sans text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Med
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search by medicine or drug name..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700 focus:border-emerald-500 font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2 px-1 py-0.5 bg-slate-50 text-[9px] font-bold rounded hover:bg-slate-100 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Deletion Warning Dialog (MANDATORY CONFIRMATION) */}
      {deletingMedId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="font-sans font-bold text-slate-900 text-sm">Delete Medication Roster?</h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Are you sure you want to delete <b className="text-slate-800">
                  {medicines.find(m => m.id === deletingMedId)?.name}
                </b>?
                <br />
                This action is destructive and removes all schedule clocks and intake history logs!
              </p>
            </div>

            <div className="flex gap-2.5 pt-1.5">
              <button 
                onClick={() => setDeletingMedId(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drugs List */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl py-12 px-6 text-center text-slate-400 text-xs">
          {medicines.length === 0 
            ? 'Your cabinet is empty. Click "+ Add Med" to build your roster!' 
            : 'No medications match your search criteria.'}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredMedicines.map(med => {
            const colors = colorClasses[med.color] || colorClasses.emerald;
            const isLowStock = med.stock <= med.reorderLevel;

            return (
              <div 
                key={med.id}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col space-y-3 shadow-3xs"
              >
                {/* Header Information */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${colors.badge}`} />
                    <div>
                      <h4 className="font-sans font-bold text-slate-900 text-sm">{med.name}</h4>
                      <p className="text-[10px] text-slate-500 font-sans capitalize mt-0.5">
                        {med.type} • Dosage: <span className="font-bold">{med.dosage}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(med)}
                      className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Edit Med Params"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(med.id)}
                      className="p-1 px-1.5 bg-slate-50 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Medication"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Technical guidelines/Remarks */}
                {med.instructions && (
                  <p className="bg-slate-50 border border-slate-100/80 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-600 italic font-sans flex items-start gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Instructions: {med.instructions}</span>
                  </p>
                )}

                {/* Alarm clock reminders summary */}
                <div className="flex flex-wrap gap-1.5 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100 text-[10px] text-slate-600">
                  <span className="font-bold text-slate-400 flex items-center gap-0.5 mr-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Reminders:
                  </span>
                  {med.alarms.length === 0 ? (
                    <span className="italic text-zinc-400">No alarms set</span>
                  ) : (
                    med.alarms.map((al, idx) => {
                      const [hr, min] = al.split(':').map(Number);
                      const displayHr = hr % 12 || 12;
                      const ampm = hr >= 12 ? 'PM' : 'AM';
                      return (
                        <span 
                          key={`badge-${med.id}-${al}-${idx}`} 
                          className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-sans font-semibold text-slate-600"
                        >
                          {`${displayHr}:${min.toString().padStart(2, '0')} ${ampm}`}
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Stock details count & Refill trigger section */}
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      {isLowStock ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      <span className="text-[11px] font-sans text-slate-500">Pills Remaining</span>
                    </div>
                    <p className={`text-xs font-sans font-bold ${isLowStock ? 'text-rose-600 font-extrabold' : 'text-slate-800'}`}>
                      {med.stock} loaded pills 
                      {isLowStock && <span className="text-[10px] font-normal block text-rose-500">Below Reorder Level ({med.reorderLevel})</span>}
                    </p>
                  </div>

                  {/* Refill Inline Panel */}
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      min="1"
                      className="w-12 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-500"
                      value={refillValue[med.id] !== undefined ? refillValue[med.id] : 30}
                      onChange={(e) => handleRefillInput(med.id, parseInt(e.target.value, 10) || 0)}
                    />
                    <button
                      onClick={() => triggerRefill(med.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Refill
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
