/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Medicine, DoseLog, UserProfile, DriveBackupMetadata } from './types';
import MobileFrame from './components/MobileFrame';
import Dashboard from './components/Dashboard';
import MedicinesTab from './components/MedicinesTab';
import AlarmsTab from './components/AlarmsTab';
import HistoryTab from './components/HistoryTab';
import SyncTab from './components/SyncTab';
import { 
  initiateGoogleOAuth, 
  fetchGoogleProfile, 
  backupToGoogleDrive, 
  restoreFromGoogleDrive,
  setCachedAccessToken,
  getCachedAccessToken
} from './utils/gapi';
import { playSyntheticChime } from './utils/audio';
import { Bell, Clock, Heart, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';

const DEFAULT_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    name: 'Atorvastatin',
    dosage: '1 Tablet',
    type: 'tablets',
    color: 'indigo',
    stock: 45,
    reorderLevel: 10,
    alarms: ['08:00', '21:00'],
    instructions: 'Take with evening meals'
  },
  {
    id: 'med-2',
    name: 'Amoxicillin',
    dosage: '1 Capsule',
    type: 'capsule',
    color: 'emerald',
    stock: 14,
    reorderLevel: 10,
    alarms: ['08:00', '13:00', '20:00'], // Multiple daily timings!
    instructions: 'Complete full 7-day course'
  },
  {
    id: 'med-3',
    name: 'Vitamin D3',
    dosage: '1 Pill',
    type: 'pill',
    color: 'amber',
    stock: 3, // Low stock triggers notification!
    reorderLevel: 7,
    alarms: ['08:00'],
    instructions: 'Take after your morning breakfast'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [backupMetadata, setBackupMetadata] = useState<DriveBackupMetadata | null>(null);

  // Background alarm states
  const [activeAlarm, setActiveAlarm] = useState<{ medicine: Medicine; time: string } | null>(null);
  const [firedAlarms, setFiredAlarms] = useState<string[]>([]); // list of "medId-time-YYYY-MM-DD"

  // Load state from local storage on startup
  useEffect(() => {
    // 1. Medicines
    const savedMed = localStorage.getItem('pulse_medicines');
    if (savedMed) {
      setMedicines(JSON.parse(savedMed));
    } else {
      setMedicines(DEFAULT_MEDICINES);
      localStorage.setItem('pulse_medicines', JSON.stringify(DEFAULT_MEDICINES));
    }

    // 2. Logs
    const savedLogs = localStorage.getItem('pulse_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      setLogs([]);
    }

    // 3. Profiles & Backup Meta
    const savedProfile = localStorage.getItem('pulse_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    const savedSyncMeta = localStorage.getItem('pulse_backup_metadata');
    if (savedSyncMeta) {
      setBackupMetadata(JSON.parse(savedSyncMeta));
    }

    // Check if token already exists in memory or storage
    const token = getCachedAccessToken();
    if (token && savedProfile) {
      // Keep profile session alive
    } else {
      // Clear session if expired
      setCachedAccessToken(null);
    }
  }, []);

  // Sync state changes to storage
  const saveMedicinesState = (newMeds: Medicine[]) => {
    setMedicines(newMeds);
    localStorage.setItem('pulse_medicines', JSON.stringify(newMeds));
  };

  const saveLogsState = (newLogs: DoseLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('pulse_logs', JSON.stringify(newLogs));
  };

  // Google OAuth Listener and Popup Handling
  useEffect(() => {
    // Handle hash check first (if we are inside the popup)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const access_token = hashParams.get('access_token');
      const state = hashParams.get('state');
      
      const savedState = localStorage.getItem('oauth_state');
      // If we are in popup and token is valid, post message back to the main thread
      if (access_token && window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', token: access_token }, '*');
        window.close();
        return;
      }
    }

    // Listen for login messages
    const handleOAuthMessage = async (event: MessageEvent) => {
      // Check message matches container origins
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const token = event.data.token;
        setCachedAccessToken(token);

        try {
          const profile = await fetchGoogleProfile(token);
          setUserProfile(profile);
          localStorage.setItem('pulse_profile', JSON.stringify(profile));

          // Search and sync from Drive if backup file exists
          try {
            const backup = await restoreFromGoogleDrive(token);
            if (backup) {
              setBackupMetadata({
                lastBackupTime: backup.lastBackupTime || new Date().toISOString(),
                fileName: backup.fileName || 'medicine_tracker_backup.json',
                fileId: backup.fileId
              });
              localStorage.setItem('pulse_backup_metadata', JSON.stringify({
                lastBackupTime: backup.lastBackupTime || new Date().toISOString(),
                fileName: backup.fileName || 'medicine_tracker_backup.json',
                fileId: backup.fileId
              }));
              
              // Apply downloaded backup data
              if (backup.medicines) {
                saveMedicinesState(backup.medicines);
              }
              if (backup.logs) {
                saveLogsState(backup.logs);
              }
            }
          } catch (driveErr) {
            console.log('No starting backup found or restoration failed. Setup fresh.', driveErr);
          }
        } catch (profileErr) {
          console.error('Google authorization error:', profileErr);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Background clock checker for medication alarm rings
  useEffect(() => {
    const checkScheduledAlarms = () => {
      const now = new Date();
      const currentHrs = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHrs}:${currentMins}`;
      const todayStr = now.toISOString().split('T')[0];

      medicines.forEach(med => {
        med.alarms.forEach(alarmTime => {
          if (alarmTime === currentTimeStr) {
            // Unique key to prevent double triggers in same minute
            const alarmKey = `${med.id}-${alarmTime}-${todayStr}`;
            if (!firedAlarms.includes(alarmKey)) {
              setFiredAlarms(prev => [...prev, alarmKey]);
              setActiveAlarm({ medicine: med, time: alarmTime });
              playSyntheticChime(); // Play synthesized audio buzzer chime
            }
          }
        });
      });
    };

    const interval = setInterval(checkScheduledAlarms, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [medicines, firedAlarms]);

  // LOGIN OPERATIONS
  const handleInitiateLogin = (clientId: string) => {
    initiateGoogleOAuth(clientId);
  };

  const handleDemoLogin = () => {
    // Simulator Mode
    const demoProfile: UserProfile = {
      name: 'Demo Patient',
      email: 'udaytechintelugu1@gmail.com',
      picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
    };
    setUserProfile(demoProfile);
    localStorage.setItem('pulse_profile', JSON.stringify(demoProfile));
    
    // Simulate backup metadata
    const demoBackupMeta: DriveBackupMetadata = {
      lastBackupTime: new Date().toISOString(),
      fileName: 'medicine_tracker_backup.json'
    };
    setBackupMetadata(demoBackupMeta);
    localStorage.setItem('pulse_backup_metadata', JSON.stringify(demoBackupMeta));
  };

  const handleLogout = () => {
    setUserProfile(null);
    setBackupMetadata(null);
    setCachedAccessToken(null);
    localStorage.removeItem('pulse_profile');
    localStorage.removeItem('pulse_backup_metadata');
  };

  // BACKUP OPERATIONS - GOOGLE DRIVE
  const handleDriveBackup = async (): Promise<string> => {
    const token = getCachedAccessToken();
    const backupContent = {
      medicines,
      logs,
      lastBackupTime: new Date().toISOString(),
      fileName: 'medicine_tracker_backup.json'
    };

    if (token) {
      // Real Google API call
      const fileId = await backupToGoogleDrive(token, backupContent);
      const meta = {
        lastBackupTime: new Date().toISOString(),
        fileName: 'medicine_tracker_backup.json',
        fileId
      };
      setBackupMetadata(meta);
      localStorage.setItem('pulse_backup_metadata', JSON.stringify(meta));
      return fileId;
    } else {
      // Demo Simulator Save
      return new Promise((resolve) => {
        setTimeout(() => {
          const meta = {
            lastBackupTime: new Date().toISOString(),
            fileName: 'medicine_tracker_backup.json'
          };
          setBackupMetadata(meta);
          localStorage.setItem('pulse_backup_metadata', JSON.stringify(meta));
          localStorage.setItem('simulated_gdrive_file', JSON.stringify(backupContent));
          resolve('simulated-drive-id-12345');
        }, 1500);
      });
    }
  };

  const handleDriveRestore = async (): Promise<{ lastBackupTime: string }> => {
    const token = getCachedAccessToken();

    if (token) {
      // Real Google Drive restore
      const backup = await restoreFromGoogleDrive(token);
      if (backup) {
        if (backup.medicines) saveMedicinesState(backup.medicines);
        if (backup.logs) saveLogsState(backup.logs);
        
        const meta = {
          lastBackupTime: backup.lastBackupTime || new Date().toISOString(),
          fileName: 'medicine_tracker_backup.json',
          fileId: backup.fileId
        };
        setBackupMetadata(meta);
        localStorage.setItem('pulse_backup_metadata', JSON.stringify(meta));
        return { lastBackupTime: meta.lastBackupTime };
      }
      throw new Error('Database backup file download retrieved null.');
    } else {
      // Demo Simulator Restore
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const raw = localStorage.getItem('simulated_gdrive_file');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.medicines) saveMedicinesState(parsed.medicines);
            if (parsed.logs) saveLogsState(parsed.logs);
            resolve({ lastBackupTime: parsed.lastBackupTime });
          } else {
            reject(new Error('No simulated backup file found in Drive. Perform a backup export first!'));
          }
        }, 1500);
      });
    }
  };

  // CLIENT MANIPULATION ACTIONS
  const handleAddNewMedicine = (medData: Omit<Medicine, 'id'>) => {
    const newMed: Medicine = {
      ...medData,
      id: `med-${Date.now()}`
    };
    saveMedicinesState([...medicines, newMed]);
  };

  const handleEditMedicine = (medId: string, updatedFields: Omit<Medicine, 'id'>) => {
    const updatedMeds = medicines.map(m => {
      if (m.id === medId) {
        return { ...updatedFields, id: medId };
      }
      return m;
    });
    saveMedicinesState(updatedMeds);
  };

  const handleDeleteMedicine = (medId: string) => {
    const updatedMeds = medicines.filter(m => m.id !== medId);
    saveMedicinesState(updatedMeds);
  };

  const handleRefillStockCount = (medId: string, refillAmt: number) => {
    const updatedMeds = medicines.map(m => {
      if (m.id === medId) {
        return { ...m, stock: m.stock + refillAmt };
      }
      return m;
    });
    saveMedicinesState(updatedMeds);
  };

  const handleTakeIntakeLog = (medId: string, alarmTime?: string) => {
    const target = medicines.find(m => m.id === medId);
    if (!target) return;

    // Decrement loaded pill counts (lower bound at 0)
    const updatedMeds = medicines.map(m => {
      if (m.id === medId) {
        return { ...m, stock: Math.max(0, m.stock - 1) };
      }
      return m;
    });
    saveMedicinesState(updatedMeds);

    // Save history logs trace
    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      medicineName: target.name,
      dosage: target.dosage,
      color: target.color,
      takenAt: new Date().toISOString()
    };
    
    if (alarmTime) {
      (newLog as any).alarmTime = alarmTime;
    }

    saveLogsState([...logs, newLog]);
  };

  const handleClearHistoryLogs = () => {
    saveLogsState([]);
  };

  // Low Stock metric calculator
  const lowStockCount = medicines.filter(m => m.stock <= m.reorderLevel).length;

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            medicines={medicines}
            logs={logs}
            onTakeMedicine={handleTakeIntakeLog}
            onRefillMedicine={handleRefillStockCount}
            setActiveTab={setActiveTab}
          />
        );
      case 'medicines':
        return (
          <MedicinesTab 
            medicines={medicines}
            onAddMedicine={handleAddNewMedicine}
            onEditMedicine={handleEditMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            onRefillMedicine={handleRefillStockCount}
          />
        );
      case 'alarms':
        return <AlarmsTab medicines={medicines} />;
      case 'history':
        return (
          <HistoryTab 
            logs={logs}
            onClearLogs={handleClearHistoryLogs}
          />
        );
      case 'sync':
        return (
          <SyncTab 
            userProfile={userProfile}
            onLogin={handleInitiateLogin}
            onLoginDemo={handleDemoLogin}
            onLogout={handleLogout}
            onBackup={handleDriveBackup}
            onRestore={handleDriveRestore}
            backupMetadata={backupMetadata}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Real-time Buzzer overlay alert modal */}
      {activeAlarm && (
        <div id="full-alarm-overlay-buzzer" className="fixed inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-[100] animate-pulse">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 w-full max-w-sm text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Bell className="w-8 h-8 stroke-[2.25]" />
              </div>
              <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase font-bold animate-pulse">Active Alarm Buzzing</p>
            </div>

            <div className="space-y-1">
              <h3 className="font-sans font-extrabold text-white text-2xl tracking-tight leading-none">
                {activeAlarm.medicine.name}
              </h3>
              <p className="text-slate-400 text-sm font-semibold font-sans mt-1.5 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-emerald-400" /> Prescribed Alert Time: {activeAlarm.time}
              </p>
              <div className="pt-2">
                <span className="inline-block bg-slate-800 border border-slate-700/60 px-3.5 py-1 text-xs font-bold text-slate-200 rounded-full font-mono">
                  Take size: {activeAlarm.medicine.dosage}
                </span>
              </div>
              {activeAlarm.medicine.instructions && (
                <p className="text-slate-400 text-[11px] italic pt-2 font-medium">
                  "{activeAlarm.medicine.instructions}"
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  handleTakeIntakeLog(activeAlarm.medicine.id, activeAlarm.time);
                  setActiveAlarm(null);
                  playSyntheticChime(); // small chime feedback
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white font-sans text-sm font-bold py-3 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-5 h-5 stroke-[2.5]" /> Log Dosage Intake
              </button>
              
              <button
                onClick={() => {
                  setActiveAlarm(null);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs py-2 rounded-xl cursor-pointer transition-colors"
              >
                Snooze Alarm Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main smartphone body chassis */}
      <MobileFrame 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
      >
        {renderActiveTabContent()}
      </MobileFrame>

      {/* Footer copyright */}
      <footer className="text-center py-4 bg-slate-100 text-[10px] text-slate-400 font-mono">
        PILLPULSE CLINICAL TRACKER SYSTEM • CODENAME ANTIGRAVITY
      </footer>
    </div>
  );
}
