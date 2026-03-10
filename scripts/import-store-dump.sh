#!/bin/bash
# ============================================================
# Jiamart 门店数据导入脚本
# 用法: ./scripts/import-store-dump.sh <sql.gz文件路径> <门店后缀>
# 例如: ./scripts/import-store-dump.sh ~/Desktop/sql_shop2.sql.gz s2
# ============================================================

set -e

DUMP_FILE="$1"
SUFFIX="$2"

if [ -z "$DUMP_FILE" ] || [ -z "$SUFFIX" ]; then
  echo "Usage: $0 <dump.sql.gz> <suffix>"
  echo "  e.g: $0 ~/Desktop/sql_shop2_jiamar_20260305.sql.gz s2"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ File not found: $DUMP_FILE"
  exit 1
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_USER="${DB_USER:-jiamart}"
DB_PASS="${DB_PASS:-jiamart_dev_2026}"
DB_NAME="${DB_NAME:-jiamart_shop}"

MYSQL="MYSQL_PWD=$DB_PASS mysql -h$DB_HOST -u$DB_USER $DB_NAME"

echo "📦 Extracting SQL from $DUMP_FILE..."
TMP_SQL="/tmp/shop_${SUFFIX}.sql"
gunzip -c "$DUMP_FILE" > "$TMP_SQL"
echo "   Raw size: $(du -sh $TMP_SQL | cut -f1)"

echo "🔧 Extracting key tables and renaming with _${SUFFIX} suffix..."
TMP_KEY="/tmp/shop_${SUFFIX}_key.sql"

python3 << PYEOF
import re, os

suffix = "${SUFFIX}"
tables = {'sp_epos_order', 'sp_epos_order_details', 'sp_day_tol', 'sp_goods', 'sp_stock'}

out = open("${TMP_KEY}", 'w')
out.write("USE jiamart_shop;\n\n")
out.write(f"-- Store suffix: {suffix}\n\n")

in_table = None
buf = []

with open("${TMP_SQL}", 'r', errors='replace') as f:
    for line in f:
        m = re.match(r"CREATE TABLE \`(.*?)\`", line)
        if m:
            in_table = m.group(1)
            if in_table in tables:
                buf = [f"DROP TABLE IF EXISTS \`{in_table}_{suffix}\`;\n",
                       line.replace(f'\`{in_table}\`', f'\`{in_table}_{suffix}\`')]
            else:
                buf = []
            continue
        if in_table:
            if in_table in tables:
                modified = line.replace('text COMMENT', 'longtext COMMENT')
                buf.append(modified)
            if 'ENGINE=' in line:
                if in_table in tables:
                    out.write(''.join(buf) + '\n')
                in_table = None
                buf = []
            continue
        for t in tables:
            if line.startswith(f'INSERT INTO \`{t}\`'):
                out.write(line.replace(f'\`{t}\`', f'\`{t}_{suffix}\`', 1))
                break

out.close()
size = os.path.getsize("${TMP_KEY}") // 1024 // 1024
print(f"   Key tables SQL: {size}MB")
PYEOF

echo "🗄️  Importing into $DB_NAME (this may take a few minutes)..."
eval "$MYSQL < $TMP_KEY"
echo "   Import complete!"

echo ""
echo "✅ Verifying row counts:"
eval "$MYSQL" << SQLEOF
SELECT 
  CONCAT('sp_epos_order_${SUFFIX}') AS table_name,
  COUNT(*) AS rows
FROM sp_epos_order_${SUFFIX}
UNION ALL
SELECT CONCAT('sp_day_tol_${SUFFIX}'), COUNT(*) FROM sp_day_tol_${SUFFIX}
UNION ALL
SELECT CONCAT('sp_goods_${SUFFIX}'), COUNT(*) FROM sp_goods_${SUFFIX};
SQLEOF

echo ""
echo "📊 Quick sales summary:"
eval "$MYSQL" << SQLEOF
SELECT 
  MIN(data_day) AS earliest,
  MAX(data_day) AS latest,
  COUNT(*) AS days,
  CONCAT('£', FORMAT(SUM(sales), 0)) AS total_revenue
FROM sp_day_tol_${SUFFIX};
SQLEOF

echo ""
echo "🧹 Cleaning up temp files..."
rm -f "$TMP_SQL" "$TMP_KEY"

echo ""
echo "🎉 Done! Tables available: sp_epos_order_${SUFFIX}, sp_day_tol_${SUFFIX}, sp_goods_${SUFFIX}, sp_epos_order_details_${SUFFIX}"
echo ""
echo "Next: update apps/backend/src/ai-forecast/*.service.ts to add store suffix '${SUFFIX}' routing"
