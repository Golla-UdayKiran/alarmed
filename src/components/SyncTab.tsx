/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, 
  Upload, 
  Download, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Shield,
  Key,
  Database,
  ExternalLink
} from 'lucide-react';
import { UserProfile, DriveBackupMetadata } from '../types';

interface SyncTabProps {
  userProfile: UserProfile | null;
  onLogin: (clientId: string) => void;
  onLoginDemo: () => void;
  onLogout: () => void;
  onBackup: () => Promise<string>;
  onRestore: () => Promise<{ lastBackupTime: string }>;
  backupMetadata: DriveBackupMetadata | null;
}

export default function SyncTab({
  userProfile,
  onLogin,
  onLoginDemo,
  onLogout,
  onBackup,
  onRestore,
  backupMetadata
}: SyncTabProps) {
  const [clientId, setClientId] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);

  // Load client ID from localStorage if stored
  useEffect(() => {
    const savedId = localStorage.getItem('g_client_id') || '';
    setClientId(savedId);
  }, []);

  const handleSaveClientIdAndForceLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) return;
    localStorage.setItem('g_client_id', clientId.trim());
    onLogin(clientId.trim());
  };

  const handleBackupClick = async () => {
    setIsBackingUp(true);
    setSyncStatus({ type: null, message: '' });
    try {
      const fileId = await onBackup();
      setSyncStatus({
        type: 'success',
        message: 'Successfully exported active prescriptions and logs backup safely to Google Drive!'
      });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Failed connecting to Google Drive. Keep your internet stable.'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    setIsConfirmingRestore(true);
  };

  const executeRestore = async () => {
    setIsConfirmingRestore(false);
    setIsRestoring(true);
    setSyncStatus({ type: null, message: '' });
    try {
      await onRestore();
      setSyncStatus({
        type: 'success',
        message: 'Google Drive backup successfully downloaded! All local schedules and medicine alerts has been hydrated.'
      });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Restore downloaded failed. Verify if a past backup exists.'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header section */}
      <section className="bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs text-center space-y-1">
        <h2 className="text-sm font-bold font-sans text-slate-800 flex items-center justify-center gap-1.5">
          <Database className="w-4 h-4 text-emerald-600" /> Google Server Database Synchronization
        </h2>
        <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
          Sync prescription schedules and daily compliance records automatically with Google Drive.
        </p>
      </section>

      {/* Warn Confirm for Restore (MANDATORY CONFIRMATION) */}
      {isConfirmingRestore && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 shrink-0" />
            </div>

            <div className="text-center space-y-1.5 matches">
              <h3 className="font-sans font-bold text-slate-900 text-sm">Download Backups from Drive?</h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Warning! Downloading your backups will <b className="text-rose-600">overwrite</b> your active local prescription list, stock inventories, and log history.
                <br /><br />
                Are you sure you want to proceed and override all current local metrics?
              </p>
            </div>

            <div className="flex gap-2.5 pt-1.5">
              <button 
                onClick={() => setIsConfirmingRestore(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                No, Keep Local
              </button>
              <button 
                onClick={executeRestore}
                className="flex-1 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer mr-0.5"
              >
                Yes, Hydrate Prescriptions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status Banner alert */}
      {syncStatus.type && (
        <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 shadow-3xs animate-fade-in ${
          syncStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {syncStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div>
            <h5 className="font-sans font-bold">{syncStatus.type === 'success' ? 'Task Completed' : 'Operation Interrupted'}</h5>
            <p className="text-[11px] font-medium mt-0.5">{syncStatus.message}</p>
          </div>
        </div>
      )}

      {/* Main Authentication Block */}
      {userProfile ? (
        <div className="space-y-4">
          {/* User Account Info card */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <img 
                src={userProfile.picture} 
                alt={userProfile.name} 
                className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5 flex-1">
                <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase">
                  Authenticated
                </span>
                <h4 className="font-sans font-bold text-sm tracking-tight pt-0.5">{userProfile.name}</h4>
                <p className="text-[11px] text-slate-400 font-sans truncate">{userProfile.email}</p>
              </div>
            </div>

            {/* Sync Timestamp details */}
            <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="text-slate-400 text-[10px] uppercase font-mono">Last Sync Session</p>
                <p className="font-sans font-bold text-slate-200">
                  {backupMetadata?.lastBackupTime 
                    ? new Date(backupMetadata.lastBackupTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'No backups recorded yet!'}
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-slate-400 text-[10px] uppercase font-mono">Device Backup Target</p>
                <p className="font-sans font-bold text-slate-200">Google Drive: App folder</p>
              </div>
            </div>
          </div>

          {/* Sync operations buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleBackupClick}
              disabled={isBackingUp || isRestoring}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer text-center"
            >
              <Upload className={`w-5 h-5 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span className="text-xs leading-none">Backup to Drive</span>
              <span className="text-[9px] font-normal text-emerald-100 uppercase font-mono tracking-wider">Export State</span>
            </button>

            <button
              onClick={handleRestoreClick}
              disabled={isBackingUp || isRestoring}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 font-sans font-bold py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors shadow-3xs hover:shadow-xs disabled:opacity-50 cursor-pointer text-center"
            >
              <Download className={`w-5 h-5 ${isRestoring ? 'animate-bounce' : ''}`} />
              <span className="text-xs leading-none">Restore Data</span>
              <span className="text-[9px] font-normal text-slate-500 uppercase font-mono tracking-wider">Download Sched</span>
            </button>
          </div>

          {/* Sign out */}
          <button
            onClick={onLogout}
            className="w-full bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 py-2.5 rounded-xl font-sans text-xs font-bold text-slate-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect Google Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-3xs">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <h4 className="font-sans font-bold text-slate-900">Custom OAuth Client Configuration</h4>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  To synchronize files securely with Google Drive, you should copy your Google Client ID here. If you just want to test app features, tap the <b>Demo Mode Simulator</b>!
                </p>
              </div>
            </div>

            {/* Custom Google Client ID form */}
            <form onSubmit={handleSaveClientIdAndForceLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-400" /> Google API Client ID
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    placeholder="E.g. XXXXXX-XXXXXX.apps.googleusercontent.com"
                    className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-700 focus:border-emerald-500 focus:bg-white font-medium"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="absolute right-1.5 top-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Set ID & Login
                  </button>
                </div>
              </div>

              {savedClientIdExists(clientId) && (
                <div className="flex justify-between items-center text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <span className="text-slate-400">Save Setting: Persisted in local config</span>
                  <button
                    type="button"
                    onClick={() => {
                      setClientId('');
                      localStorage.removeItem('g_client_id');
                    }}
                    className="text-rose-500 hover:underline font-bold"
                  >
                    Clear Saved ID
                  </button>
                </div>
              )}
            </form>

            <span className="relative flex justify-center text-xs text-slate-300 before:absolute before:left-0 before:top-2.5 before:w-[42%] before:h-px before:bg-slate-100 after:absolute after:right-0 after:top-2.5 after:w-[42%] after:h-px after:bg-slate-100">
              OR
            </span>

            {/* Simulated login with Google Drive backups */}
            <button
              onClick={onLoginDemo}
              className="w-full border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <CloudLightning className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Launch Demo Mode Simulator (Recommended)</span>
            </button>
          </div>

          {/* Dev Help guide list */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] font-sans text-slate-600 space-y-2.5">
            <h5 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" /> Google APIs Setup Instructions:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-500">
              <li>Open the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-bold">Google Cloud Console <ExternalLink className="w-3 h-3 text-slate-400" /></a></li>
              <li>Configure OAuth consent screen choosing <b className="text-slate-700">External</b></li>
              <li>Under Credentials, tap <b>Create Credentials</b> & select <b>OAuth Client ID</b></li>
              <li>Select Application Type: <b>Web Application</b></li>
              <li>Add Authorized Redirect URI: <code className="bg-white border border-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-600">{window.location.origin}</code></li>
              <li>Copy the resulting Client ID & paste it above!</li>
            </ol>
            <p className="text-[9px] italic text-slate-400 leading-normal">
              Note: The Google Account you log in with MUST be registered as a Test User on your Google OAuth consent screen setup in Cloud Console.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function savedClientIdExists(id: string): boolean {
  return localStorage.getItem('g_client_id') === id.trim() && id.trim().length > 0;
}
