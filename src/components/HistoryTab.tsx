/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { DoseLog } from '../types';

interface HistoryTabProps {
  logs: DoseLog[];
  onClearLogs: () => void;
}

export default function HistoryTab({ logs, onClearLogs }: HistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const filteredLogs = logs.filter(log =>
    log.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLogDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const today = new Date().toDateString();
      const logDay = date.toDateString();
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (today === logDay) {
        return `Today at ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${dateStr} at ${timeStr}`;
      }
    } catch {
      return isoStr;
    }
  };

  const handleClearTrigger = () => {
    setIsConfirmingClear(true);
  };

  const executeClear = () => {
    onClearLogs();
    setIsConfirmingClear(false);
  };

  const colorClassesObj = {
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-500 bg-amber-50 border-amber-100',
    rose: 'text-rose-500 bg-rose-50 border-rose-100',
    indigo: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    violet: 'text-violet-500 bg-violet-50 border-violet-100',
    sky: 'text-sky-500 bg-sky-50 border-sky-100'
  };

  return (
    <div className="p-4 space-y-4">
      {/* Upper header section */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h2 className="text-sm font-bold font-sans text-slate-800">Dosage Intake History</h2>
          <p className="text-[10px] text-slate-400 font-sans">
            Tracked <span className="font-bold text-emerald-600">{logs.length}</span> recorded doses
          </p>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={handleClearTrigger}
            className="text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 py-1.5 px-3 rounded-xl font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Logs
          </button>
        )}
      </div>

      {/* Confirmation Modal for Clearing Logs (MANDATORY CONFIRMATION) */}
      {isConfirmingClear && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1.5 align-middle">
              <h3 className="font-sans font-bold text-slate-900 text-sm">Wipe Patient Logs?</h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                This is a destructive action that will wipe out all past medicine dosage tracking logs. 
                <br />
                This action cannot be undone! Are you sure?
              </p>
            </div>

            <div className="flex gap-2.5 pt-1.5">
              <button 
                onClick={() => setIsConfirmingClear(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeClear}
                className="flex-1 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar Input */}
      {logs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search logs by medicine name..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700 focus:border-emerald-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Logs timeline list */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl py-12 px-6 text-center text-slate-400 text-xs">
          {logs.length === 0 
            ? 'No dosage logs recorded yet. Visit the Home dashboard to track doses!' 
            : 'No dosage records match your query.'}
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {filteredLogs.slice().reverse().map((log) => {
            const colors = colorClassesObj[log.color] || colorClassesObj.emerald;
            
            return (
              <div 
                key={log.id}
                className="relative flex items-start gap-4 pl-1"
              >
                {/* Timeline Node Icon Pin */}
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 z-10 ${colors}`}>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>

                {/* Log Entry Card contents */}
                <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-sans font-bold text-slate-800 text-xs">{log.medicineName}</h4>
                    <span className="text-[9px] font-bold font-sans text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100 uppercase">
                      {log.dosage}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-sans font-semibold text-slate-600">
                      {formatLogDate(log.takenAt)}
                    </span>
                    {(log as any).alarmTime && (
                      <span className="text-emerald-500 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-sans ml-1 text-[9px]">
                        Alarm: {log.alarmTime}
                      </span>
                    )}
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
