/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  Clock, 
  ShieldCheck, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Medicine } from '../types';

interface AlarmsTabProps {
  medicines: Medicine[];
}

/**
 * Clean Web Audio synthesizer for the alarm preview.
 */
export function playSyntheticChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Primary bell tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(660, ctx.currentTime); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // ramp up to A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15); // E5

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('Audio synthesis was blocked or failed', err);
  }
}

export default function AlarmsTab({ medicines }: AlarmsTabProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const triggerSoundPreview = () => {
    setIsPlaying(true);
    playSyntheticChime();
    setTimeout(() => {
      setIsPlaying(false);
    }, 700);
  };

  // Compile unique alarms across all medicines
  interface CompMedAlarm {
    time24: string;
    medicines: { name: string; color: string; dosage: string }[];
    sortMinutes: number;
  }

  const alarmsMap: { [key: string]: CompMedAlarm['medicines'] } = {};

  medicines.forEach(med => {
    med.alarms.forEach(al => {
      if (!alarmsMap[al]) {
        alarmsMap[al] = [];
      }
      alarmsMap[al].push({
        name: med.name,
        color: med.color,
        dosage: med.dosage
      });
    });
  });

  const compiledAlarms: CompMedAlarm[] = Object.keys(alarmsMap).map(time24 => {
    const [hrs, mins] = time24.split(':').map(Number);
    return {
      time24,
      medicines: alarmsMap[time24],
      sortMinutes: hrs * 60 + mins
    };
  });

  // Sort chronological
  compiledAlarms.sort((a, b) => a.sortMinutes - b.sortMinutes);

  const format12hTime = (time24: string) => {
    const [hrs, mins] = time24.split(':').map(Number);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 || 12;
    return `${displayHrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    sky: 'bg-sky-500'
  };

  return (
    <div className="p-4 space-y-4">
      {/* Sound Settings Card */}
      <section 
        id="alarm-sound-box" 
        className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-3xs"
      >
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-600" /> Prescribed Alert Volumizer
          </h3>
          <p className="text-[10px] text-slate-400 font-sans">
            In-app custom high-frequency vibration & chime previews
          </p>
        </div>

        <button
          onClick={triggerSoundPreview}
          disabled={isPlaying}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer transition-all ${
            isPlaying 
              ? 'bg-emerald-100 text-emerald-800 scale-95 border border-emerald-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
          {isPlaying ? 'Chiming...' : 'Test Sound'}
        </button>
      </section>

      {/* Alarm list */}
      <section id="compiled-alarm-reminders" className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-emerald-600" /> All Alarm Clocks ({compiledAlarms.length})
        </h4>

        {compiledAlarms.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-400 text-xs">
            No active alarms mapped yet. Setup medication timers on your medicines to schedule active clocks!
          </div>
        ) : (
          <div className="space-y-2.5">
            {compiledAlarms.map((alarmObj) => (
              <div 
                key={`alarm-card-${alarmObj.time24}`}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-3xs"
              >
                <div className="space-y-2">
                  {/* Alarm Time Display */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-sans font-extrabold text-slate-900 text-base leading-none">
                      {format12hTime(alarmObj.time24)}
                    </span>
                  </div>

                  {/* Bound Medications */}
                  <div className="flex flex-col gap-1 pl-1">
                    <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider font-extrabold">Medications:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {alarmObj.medicines.map((med, medIdx) => (
                        <div 
                          key={`${alarmObj.time24}-${med.name}-${medIdx}`}
                          className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 text-[11px] font-sans font-semibold text-slate-700"
                        >
                          <span className={`w-2 h-2 rounded-full ${colorClasses[med.color] || colorClasses.emerald}`} />
                          <span>{med.name} ({med.dosage})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50/70 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Instruction Tips */}
      <section className="bg-amber-50 rounded-2xl p-4 border border-amber-100/70 flex items-start gap-3">
        <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans font-bold text-xs text-amber-950">Daily Alerts Notification Handling</h4>
          <p className="text-[10px] font-sans text-amber-800 leading-relaxed">
            PillPulse keeps clocks alive whenever this tab or preview window is open. When a timing trigger initiates, a vibrant take card is prompted instantly in-app!
          </p>
        </div>
      </section>
    </div>
  );
}
