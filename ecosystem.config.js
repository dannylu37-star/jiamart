// PM2 进程配置 — Jiamart M4 Mac Mini 本地部署
module.exports = {
  apps: [
    {
      name: 'jiamart-backend',
      script: 'dist/main.js',
      cwd: '/opt/jiamart/apps/backend',
      instances: 2,              // M4 有足够核心，跑2个实例负载均衡
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USERNAME: 'jiamart',
        DB_NAME: 'jiamart_shop',
        OPS_DB_NAME: 'jiamart_ops',
        UPLOAD_DIR: '/opt/jiamart/uploads',
      },
      // 日志
      out_file: '/var/log/jiamart/backend-out.log',
      error_file: '/var/log/jiamart/backend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 自动重启
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 3000,
    },
  ],
};
