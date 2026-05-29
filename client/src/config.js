// În producție (pe Render/Vercel) va fi folosit URL-ul API-ului online, iar local va fi localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
