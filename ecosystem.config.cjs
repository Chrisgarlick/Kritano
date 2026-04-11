module.exports = {
  apps: [
    {
      name: 'kritano-api',
      cwd: '/home/deploy/kritano/server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      error_file: '/home/deploy/kritano/logs/api-error.log',
      out_file: '/home/deploy/kritano/logs/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'kritano-worker',
      cwd: '/home/deploy/kritano/server',
      script: 'node_modules/.bin/tsx',
      args: 'src/worker.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '700M',
      error_file: '/home/deploy/kritano/logs/worker-error.log',
      out_file: '/home/deploy/kritano/logs/worker-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
