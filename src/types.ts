/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Medicine {
  id: string;
  name: string;
  dosage: string; // e.g. "1 Pill" or "10ml"
  type: 'pill' | 'capsule' | 'liquid' | 'tablets' | 'injection' | 'other';
  color: 'emerald' | 'amber' | 'rose' | 'indigo' | 'violet' | 'sky';
  stock: number; // Current remaining quantity
  reorderLevel: number; // Alert when stock <= reorderLevel
  alarms: string[]; // Array of "HH:MM" (24h) timings, e.g. ["08:00", "20:00"]
  instructions?: string; // e.g. "Take after food"
}

export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  color: string;
  takenAt: string; // ISO date string
  alarmTime?: string; // Optional HH:MM indicator slot
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface DriveBackupMetadata {
  lastBackupTime: string;
  fileName: string;
  fileId?: string;
}
