"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemoryUsage = getMemoryUsage;
exports.canAcceptJob = canAcceptJob;
exports.getMemoryThreshold = getMemoryThreshold;
const os_1 = __importDefault(require("os"));
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEFAULT_MEMORY_THRESHOLD = IS_PRODUCTION ? 85 : 98; // dev machines run hot
const MEMORY_THRESHOLD = parseInt(process.env.WORKER_MEMORY_THRESHOLD || String(DEFAULT_MEMORY_THRESHOLD), 10);
function getMemoryUsage() {
    const totalMB = os_1.default.totalmem() / 1024 / 1024;
    const freeMB = os_1.default.freemem() / 1024 / 1024;
    const usedPercent = Math.round(((totalMB - freeMB) / totalMB) * 100);
    return { usedPercent, freeMB: Math.round(freeMB), totalMB: Math.round(totalMB) };
}
function canAcceptJob() {
    return getMemoryUsage().usedPercent < MEMORY_THRESHOLD;
}
function getMemoryThreshold() {
    return MEMORY_THRESHOLD;
}
//# sourceMappingURL=memory-monitor.js.map