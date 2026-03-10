#!/bin/bash
# ============================================================
# Jiamart M4 Mac Mini 一键部署脚本
# 使用: bash setup-mac-mini.sh
# ============================================================
set -e

echo "🍎 Jiamart M4 Mac Mini 部署开始..."
echo ""

# ── 1. 安装依赖 ────────────────────────────────────────────
echo "📦 Step 1: 安装系统依赖"
# 检查 Homebrew
which brew > /dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install mysql nginx node 2>/dev/null || true
npm install -g pm2 2>/dev/null || true
echo "   ✅ 依赖已安装"

# ── 2. 创建目录结构 ───────────────────────────────────────
echo ""
echo "📁 Step 2: 创建目录"
sudo mkdir -p /opt/jiamart/apps /opt/jiamart/uploads/vendor-forms
sudo mkdir -p /var/log/jiamart
sudo chown -R $(whoami) /opt/jiamart /var/log/jiamart
echo "   ✅ 目录就绪"

# ── 3. 克隆/拉取代码 ─────────────────────────────────────
echo ""
echo "🔄 Step 3: 拉取最新代码"
if [ -d /opt/jiamart/apps/backend ]; then
  cd /opt/jiamart/apps && git pull
else
  cd /opt/jiamart/apps && git clone https://github.com/dannylu37-star/jiamart.git .
fi
echo "   ✅ 代码已更新"

# ── 4. 构建后端 ───────────────────────────────────────────
echo ""
echo "🔧 Step 4: 构建后端"
cd /opt/jiamart/apps/apps/backend
npm ci --silent
npm run build
echo "   ✅ 后端构建完成"

# ── 5. 构建前端 ───────────────────────────────────────────
echo ""
echo "🎨 Step 5: 构建前端"
cd /opt/jiamart/apps/apps/dashboard
npm ci --silent
npm run build
echo "   ✅ 前端构建完成"

# ── 6. 配置数据库 ─────────────────────────────────────────
echo ""
echo "🗄️  Step 6: 配置 MySQL"
brew services start mysql 2>/dev/null || true
sleep 3
# 运行 migrations
for sql in /opt/jiamart/apps/apps/backend/src/*/migrations/create_*.sql; do
  echo "   Running: $sql"
  mysql -uroot jiamart_ops < "$sql" 2>/dev/null || true
done
echo "   ✅ 数据库就绪"

# ── 7. 配置 Nginx ─────────────────────────────────────────
echo ""
echo "🌐 Step 7: 配置 Nginx"
cp /opt/jiamart/apps/nginx.conf /opt/homebrew/etc/nginx/servers/jiamart.conf
# 修改 root 路径指向实际 dist
sed -i '' 's|/opt/jiamart/apps/dashboard/dist|/opt/jiamart/apps/apps/dashboard/dist|g' \
  /opt/homebrew/etc/nginx/servers/jiamart.conf
brew services restart nginx
echo "   ✅ Nginx 已配置"

# ── 8. 启动 PM2 ───────────────────────────────────────────
echo ""
echo "🚀 Step 8: 启动服务"
cd /opt/jiamart/apps
pm2 delete jiamart-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1  # 输出开机启动命令

echo ""
echo "════════════════════════════════════════"
echo "🎉 部署完成！"
echo ""
echo "   后台管理: http://localhost/admin"
echo "   API:      http://localhost/api/v1"
echo "   PM2状态:  pm2 status"
echo "   后端日志: pm2 logs jiamart-backend"
echo "   Nginx日志: tail -f /opt/homebrew/var/log/nginx/error.log"
echo "════════════════════════════════════════"
