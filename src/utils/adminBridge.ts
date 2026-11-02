import Constants from 'expo-constants';
import { Platform } from 'react-native';

const ADMIN_PORT = 3002;

export function getAdminServerUrl(): string {
  const configured = process.env.EXPO_PUBLIC_TASKGO_ADMIN_URL;
  if (configured) return configured.replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${ADMIN_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${ADMIN_PORT}`;

  return `http://localhost:${ADMIN_PORT}`;
}

export async function sendRunnerHeartbeat(runnerId: string, online: boolean): Promise<void> {
  try {
    await fetch(`${getAdminServerUrl()}/api/runners/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runnerId, online }),
    });
  } catch {
    // The local app keeps working when the admin service is not running.
  }
}
