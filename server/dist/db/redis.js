"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.testRedisConnection = testRedisConnection;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
exports.redis = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
async function testRedisConnection() {
    try {
        await exports.redis.connect();
        await exports.redis.ping();
        console.log('Redis connected successfully');
        return true;
    }
    catch (error) {
        console.error('Redis connection failed:', error);
        return false;
    }
}
//# sourceMappingURL=redis.js.map