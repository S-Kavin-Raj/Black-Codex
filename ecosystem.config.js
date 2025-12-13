module.exports = {
  apps: [
    {
      name: 'codex-backend',
      cwd: 'codex-backend',
      script: 'src/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001
      }
    },
    {
      name: 'codex-frontend',
      cwd: 'codex-Frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
