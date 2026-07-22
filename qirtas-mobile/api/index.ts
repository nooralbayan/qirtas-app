export const API_BASE_URL = 'https://nooralbayan.onrender.com/api';

export async function fetchAppState() {
  try {
    const res = await fetch(`${API_BASE_URL}/state`);
    const json = await res.json();
    if (json.success) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('Error fetching state:', err);
    return null;
  }
}

export async function updateState(key: string, value: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/state/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('Error updating state:', err);
    return { success: false, error: 'Failed to connect' };
  }
}
