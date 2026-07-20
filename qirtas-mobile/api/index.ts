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
