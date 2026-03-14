import os from 'os';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEFAULT_MEMORY_THRESHOLD = IS_PRODUCTION ? 85 : 98; // dev machines run hot
const MEMORY_THRESHOLD = parseInt(process.env.WORKER_MEMORY_THRESHOLD || String(DEFAULT_MEMORY_THRESHOLD), 10);

export function getMemoryUsage(): { usedPercent: number; freeMB: number; totalMB: number } {
  const totalMB = os.totalmem() / 1024 / 1024;
  const freeMB = os.freemem() / 1024 / 1024;
  const usedPercent = Math.round(((totalMB - freeMB) / totalMB) * 100);
  return { usedPercent, freeMB: Math.round(freeMB), totalMB: Math.round(totalMB) };
}

export function canAcceptJob(): boolean {
  return getMemoryUsage().usedPercent < MEMORY_THRESHOLD;
}

export function getMemoryThreshold(): number {
  return MEMORY_THRESHOLD;
}
