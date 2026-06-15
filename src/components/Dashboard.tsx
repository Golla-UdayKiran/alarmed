/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Calendar,
  Sparkles,
  RefreshCw,
  Heart
} from 'lucide-react';
import { Medicine, DoseLog } from '../types';

interface DashboardProps {
  medicines: Medicine[];
  logs: DoseLog[];
  onTakeMedicine: (medicineId: string, alarmTime?: string) => void;
  onRefillMedicine: (medicineId: string, alertCount: number) => void;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ 
  medicines, 
  logs, 
  onTakeMedicine, 
  onRefillMedicine,
  setActiveTab 
}: DashboardProps) {
  const [refillAmounts, setRefillAmounts] = useState<{ [key: string]: number }>({});

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper code to check if a specific alarm for a specific medicine was taken today
  const isAlarmTakenToday = (medicineId: string, alarmTime: string) => {
    return logs.some(log => {
      const logDay = log.takenAt.split('T')[0];
      // Find logs taken today for this medicine & representing this alarm time
      return log.medicineId === medicineId && 
             logDay === todayStr && 
             (log as any).alarmTime === alarmTime;
    });
  };

  // Compile all schedules alarms for today
  interface TodayScheduledDose {
    medicine: Medicine;
    alarmTime: string; // "HH:MM" format
    taken: boolean;
    sortMinutes: number; // For sorting timings
  }

  const todayDoses: TodayScheduledDose[] = [];

  medicines.forEach(med => {
    med.alarms.forEach(alarm => {
      const [hrs, mins] = alarm.split(':').map(Number);
      const isTaken = isAlarmTakenToday(med.id, alarm);
      todayDoses.push({
        medicine: med,
        alarmTime: alarm,
        taken: isTaken,
        sortMinutes: hrs * 60 + mins
      });
    });
  });

  // Sort chronologically by schedules time
  todayDoses.sort((a, b) => a.sortMinutes - b.sortMinutes);

  // Filter out low stock medicines
  const lowStockMedicines = medicines.filter(m => m.stock <= m.reorderLevel);

  // Statistics
  const totalScheduled = todayDoses.length;
  const totalTaken = todayDoses.filter(d => d.taken).length;
  const complianceRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;

  // Format 24h into pleasant 12h AM/PM
  const formatTimeToShow = (time24: string) => {
    const [hrs, mins] = time24.split(':').map(Number);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 || 12;
    return `${displayHrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleRefillSubmit = (e: React.FormEvent, medId: string) => {
    e.preventDefault();
    const count = refillAmounts[medId] || 30; // default to 30
    onRefillMedicine(medId, count);
    setRefillAmounts(prev => {
      const updated = { ...prev };
      delete updated[medId];
      return updated;
    });
  };

  const setAmountValue = (medId: string, amt: number) => {
    setRefillAmounts(prev => ({ ...prev, [medId]: amt }));
  };

  return (
    <div className="p-4 space-y-5">
      {/* Visual greeting & Progress Summary */}
      <section 
        id="dashboard-header-card" 
        className="relative overflow-hidden bg-slate-900 rounded-3xl p-5 text-white shadow-md border border-slate-800"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 space-y-3.5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-emerald-400 font-mono text-[10px] tracking-widest uppercase">My Active Status</p>
              <h2 className="text-xl font-sans font-bold tracking-tight mt-0.5">Welcome Back</h2>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-300">
              <Heart className="w-5 h-5 fill-emerald-500/20 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-mono">Today's Goals</p>
              <p className="text-lg font-bold font-sans mt-0.5">{totalTaken}/{totalScheduled}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-mono">Adherence</p>
              <p className="text-lg font-bold font-sans text-emerald-400 mt-0.5">{complianceRate}%</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-mono">Total Meds</p>
              <p className="text-lg font-bold font-sans text-sky-400 mt-0.5">{medicines.length}</p>
            </div>
          </div>

          {/* Quick interactive stats indicator bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${complianceRate}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Critical Stock Alert warnings */}
      {lowStockMedicines.length > 0 && (
        <section id="low-stock-notifications" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Stock Shortage Warnings
            </h3>
            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">
              {lowStockMedicines.length} Alert{lowStockMedicines.length > 1 ? 's' : ''}
            </span>
          </div>

          {lowStockMedicines.map(med => (
            <div 
              key={`alert-${med.id}`}
              className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-col space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-sans font-bold text-slate-900 text-sm">{med.name}</h4>
                  <p className="text-xs text-amber-700/90 mt-0.5 font-medium">
                    Only <span className="font-bold underline text-amber-800">{med.stock}</span> pills left! (Warning alert triggers at {med.reorderLevel})
                  </p>
                </div>
                <div className="text-[10px] font-mono bg-amber-100 px-2 py-1-0.5 rounded text-amber-700 font-semibold uppercase">
                  REORDER
                </div>
              </div>

              {/* Refill Quick Action Panel */}
              <form onSubmit={(e) => handleRefillSubmit(e, med.id)} className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="1"
                  max="500"
                  className="w-16 px-2.5 py-1.5 text-xs font-sans font-semibold border border-amber-300 rounded-lg outline-none bg-white text-slate-800 focus:border-amber-500"
                  value={refillAmounts[med.id] !== undefined ? refillAmounts[med.id] : 30}
                  onChange={(e) => setAmountValue(med.id, parseInt(e.target.value, 10) || 0)}
                  placeholder="Count"
                  required
                />
                <button 
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-sans text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Refill Count
                </button>
                <div className="flex gap-1">
                  <button 
                    type="button" 
                    onClick={() => setAmountValue(med.id, 30)}
                    className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded-md"
                  >
                    +30
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAmountValue(med.id, 60)}
                    className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold rounded-md"
                  >
                    +60
                  </button>
                </div>
              </form>
            </div>
          ))}
        </section>
      )}

      {/* Today's dosage schedules timeline */}
      <section id="today-timeline-scheduler" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" /> Today's Dosage Schedule
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {todayStr}
          </span>
        </div>

        {medicines.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3.5">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 mx-auto rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No medications registered yet. Register your daily dosages to compile your interactive schedule!
            </p>
            <button
              onClick={() => setActiveTab('medicines')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold rounded-xl inline-flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Drug Manually
            </button>
          </div>
        ) : todayDoses.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-400 text-xs">
            No alarms or dosage schedules registered on any medicines. Open the Meds or Alarms tabs to configure schedule timings!
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayDoses.map((dose, index) => {
              const med = dose.medicine;
              
              // Colors matching
              const colorMaps = {
                emerald: { bg: 'bg-emerald-50 border-emerald-100 text-emerald-800', dot: 'bg-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                amber: { bg: 'bg-amber-50 border-amber-100 text-amber-800', dot: 'bg-amber-500', btn: 'bg-amber-600 hover:bg-amber-700 text-white' },
                rose: { bg: 'bg-rose-50 border-rose-100 text-rose-800', dot: 'bg-rose-500', btn: 'bg-rose-600 hover:bg-rose-700 text-white' },
                indigo: { bg: 'bg-indigo-50 border-indigo-100 text-indigo-800', dot: 'bg-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
                violet: { bg: 'bg-violet-50 border-violet-100 text-violet-800', dot: 'bg-violet-500', btn: 'bg-violet-600 hover:bg-violet-700 text-white' },
                sky: { bg: 'bg-sky-50 border-sky-100 text-sky-800', dot: 'bg-sky-500', btn: 'bg-sky-600 hover:bg-sky-700 text-white' },
              };
              const colors = colorMaps[med.color] || colorMaps.emerald;

              return (
                <div 
                  key={`dose-${med.id}-${dose.alarmTime}-${index}`}
                  className={`bg-white border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all ${
                    dose.taken ? 'opacity-65 border-slate-100 bg-slate-50/50' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Visual status dot */}
                    <div className="relative">
                      {dose.taken ? (
                        <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex flex-col items-center justify-center border font-mono text-[9px] font-bold text-slate-500 bg-slate-50 border-slate-200`}>
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className={`font-sans font-bold text-sm ${dose.taken ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {med.name}
                        </h4>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${colors.bg}`}>
                          {med.dosage}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                        <span className="text-[10px] font-bold font-sans text-slate-700 flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-400" /> {formatTimeToShow(dose.alarmTime)}
                        </span>
                        {med.instructions && (
                          <>
                            <span className="text-[9px] text-slate-300">•</span>
                            <span className="text-[10px] italic text-slate-500 font-sans">{med.instructions}</span>
                          </>
                        )}
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className={`text-[9px] font-sans font-medium ${med.stock <= med.reorderLevel ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                          Stock: {med.stock} pills left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {dose.taken ? (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 py-1 px-2.5 rounded-full font-bold">
                        TAKEN
                      </span>
                    ) : (
                      <button
                        onClick={() => onTakeMedicine(med.id, dose.alarmTime)}
                        className={`text-xs font-sans font-bold py-1.5 px-3 rounded-xl shadow-xs transition-colors cursor-pointer ${colors.btn}`}
                      >
                        Take Dose
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Useful tips */}
      <section id="health-tips-card" className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-3">
        <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans font-bold text-xs text-emerald-900">Pro-Tip for Syncing Backups</h4>
          <p className="text-[10px] font-sans text-emerald-800 leading-relaxed">
            By enabling <b>Google Drive Backup</b>, you safeguard your tracks and scheduled dosage metrics securely. If you delete or reinstall the app, restore from Drive immediately!
          </p>
        </div>
      </section>
    </div>
  );
}
