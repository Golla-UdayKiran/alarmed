/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';

// Simple in-memory token cache
let cachedAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem('g_access_token', token);
    localStorage.setItem('g_token_expiry', (Date.now() + 3550 * 1000).toString()); // Tokens last 1h
  } else {
    localStorage.removeItem('g_access_token');
    localStorage.removeItem('g_token_expiry');
  }
}

export function getCachedAccessToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  
  const token = localStorage.getItem('g_access_token');
  const expiry = localStorage.getItem('g_token_expiry');
  
  if (token && expiry) {
    if (Date.now() < parseInt(expiry, 10)) {
      cachedAccessToken = token;
      return token;
    }
  }
  
  // Clear expired token
  setCachedAccessToken(null);
  return null;
}

/**
 * Initiates the Google login flow.
 * Since the preview loads inside an iframe, we use a popup that redirects to Google.
 * The redirect URI is this same page. Upon loading, our page tracks if it is in a popup and has a token.
 */
export function initiateGoogleOAuth(clientId: string) {
  const redirectUri = window.location.origin;
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
  ].join(' ');

  const state = Math.random().toString(36).substring(2);
  localStorage.setItem('oauth_state', state);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${encodeURIComponent(state)}` +
    `&prompt=consent`;

  const width = 500;
  const height = 650;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const popup = window.open(
    authUrl,
    'Google_Sign_In_Popup',
    `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes`
  );

  return popup;
}

/**
 * Fetches user profile from Google UserInfo API
 */
export async function fetchGoogleProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google profile info');
  }

  const data = await response.json();
  return {
    name: data.name || 'Google User',
    email: data.email || '',
    picture: data.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  };
}

/**
 * Backs up app data (medicines, logs, settings) to Google Drive.
 * 1. Checks if 'medicine_tracker_backup.json' already exists.
 * 2. If yes, updates it.
 * 3. If no, creates it.
 */
export async function backupToGoogleDrive(accessToken: string, backupData: any): Promise<string> {
  // Step 1: Search for an existing file
  const searchQuery = encodeURIComponent("name = 'medicine_tracker_backup.json' and trashed = false");
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Google Drive search request failed');
  }

  const searchResult = await searchResponse.json();
  const existingFiles = searchResult.files || [];

  let fileId = '';

  if (existingFiles.length > 0) {
    // Update existing file
    fileId = existingFiles[0].id;
    const updateResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update existing backup file on Google Drive');
    }
  } else {
    // Create new file
    // First, upload file metadata
    const createMetaResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'medicine_tracker_backup.json',
        mimeType: 'application/json',
        description: 'Medicine dosage tracker backup',
      }),
    });

    if (!createMetaResponse.ok) {
      throw new Error('Failed to create file folder metadata on Google Drive');
    }

    const fileMeta = await createMetaResponse.json();
    fileId = fileMeta.id;

    // Send the actual file content
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload backup contents to Google Drive');
    }
  }

  return fileId;
}

/**
 * Restores app data from Google Drive backup file.
 */
export async function restoreFromGoogleDrive(accessToken: string): Promise<any> {
  // Step 1: Search for the backup file
  const searchQuery = encodeURIComponent("name = 'medicine_tracker_backup.json' and trashed = false");
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${searchQuery}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Google Drive search failed during restore execution');
  }

  const searchResult = await searchResponse.json();
  const existingFiles = searchResult.files || [];

  if (existingFiles.length === 0) {
    throw new Error('No backup file found on Google Drive. Create a backup first!');
  }

  const fileId = existingFiles[0].id;

  // Step 2: Fetch the file content
  const contentResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!contentResponse.ok) {
    throw new Error('Failed to download the backup file from Google Drive');
  }

  const backupData = await contentResponse.json();
  return {
    ...backupData,
    fileId,
  };
}
