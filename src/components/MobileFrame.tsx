/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Pill, 
  Bell, 
  History, 
  CloudRain, 
  Battery, 
  Wifi, 
  Signal, 
  CloudLightning,
  RefreshCw,
  LogOut,
  User,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  lowStockCount: number;
}

export default function MobileFrame({ 
  children, 
  activeTab, 
  setActiveTab, 
  userProfile, 
  onLogout,
  lowStockCount
}: MobileFrameProps) {
  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(100);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Soft fluctuate battery for realism
  useEffect(() => {
    const r = Math.floor(Math.random() * 5) + 85; // 85% to 90%
    setBatteryLevel(r);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Heart, badge: 0 },
    { id: 'medicines', label: 'Meds', icon: Pill, badge: lowStockCount },
    { id: 'alarms', label: 'Alarms', icon: Bell, badge: 0 },
    { id: 'history', label: 'Logs', icon: History, badge: 0 },
    { id: 'sync', label: 'Backup', icon: RefreshCw, badge: 0 },
  ];

  return (
    <div id="mobile-shell-wrapper" className="flex justify-center items-center py-6 min-h-screen bg-slate-100 select-none">
      {/* Device Body Container */}
      <div 
        id="phone-device-body" 
        className="relative w-full max-w-[410px] h-[840px] bg-slate-900 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border-[12px] border-slate-950 flex flex-col overflow-hidden"
      >
        {/* Dynamic Notch / Island */}
        <div id="island-notch" className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[25px] bg-black rounded-full z-30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mr-2"></div>
          <div className="w-3 h-3 bg-zinc-900 rounded-full border border-zinc-800"></div>
        </div>

        {/* Status Bar */}
        <div id="mobile-status-bar" className="h-10 px-6 pt-2 flex justify-between items-center bg-white border-b border-slate-100 text-slate-800 text-xs font-semibold z-20">
          <div>{time}</div>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <span className="text-[10px]">LTE</span>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">{batteryLevel}%</span>
              <Battery className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            </div>
          </div>
        </div>

        {/* Dynamic App Header */}
        <header id="app-header" className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-slate-900 text-base tracking-tight leading-none">PillPulse</h1>
              <p className="text-[10px] font-mono text-slate-500">DOSAGE TRAILER</p>
            </div>
          </div>

          {/* User profile toggle/signout */}
          {userProfile ? (
            <div className="flex items-center gap-2">
              <img 
                src={userProfile.picture} 
                alt={userProfile.name} 
                className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={onLogout}
                title="Google Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-[10px] flex items-center gap-1 font-sans bg-slate-100 border border-slate-200 text-slate-500 py-1 px-2.5 rounded-full font-medium">
              <User className="w-3 h-3 text-slate-400" /> Offline Mode
            </div>
          )}
        </header>

        {/* Main Application Window Canvas */}
        <div id="screen-page-canvas" className="flex-1 overflow-y-auto bg-slate-50 relative pb-16">
          {children}
        </div>

        {/* Global Bottom Navigation Shell */}
        <nav id="bottom-navbar" className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-1 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all cursor-pointer"
              >
                <div 
                  className={`p-1 rounded-lg transition-transform ${
                    isActive 
                      ? 'text-emerald-600 scale-110' 
                      : 'text-slate-400 hover:text-slate-600 hover:scale-105'
                  }`}
                >
                  <IconComponent className="w-5 h-5 stroke-[2.25]" />
                </div>
                <span 
                  className={`text-[9px] font-medium leading-none mt-0.5 ${
                    isActive ? 'font-semibold text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Notifications Alert Badges */}
                {tab.badge > 0 && (
                  <span className="absolute top-1.5 right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 border border-white text-[8px] font-bold text-white flex items-center justify-center animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
