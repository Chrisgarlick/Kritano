interface GdprWorkerConfig {
    pool: unknown;
}
export declare function createGdprWorker(_config: GdprWorkerConfig): {
    start(): Promise<void>;
    stop(): Promise<void>;
};
export {};
//# sourceMappingURL=gdpr-worker.service.d.ts.map