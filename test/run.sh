#!/bin/bash
# Прогон всех проверок.
#   ./test/run.sh            — весь набор
#   ./test/run.sh today      — только файлы, где в имени есть «today»
set -e
cd "$(dirname "$0")/.."

./build.sh > /dev/null

FILTER="${1:-}"
FAIL=0
for suite in test/suites/*.js; do
  name=$(basename "$suite" .js)
  [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]] && continue
  cat test/harness.js test/seed.js build/logic.js "$suite" > build/run.js
  OUT=$(osascript -l JavaScript build/run.js 2>&1) || true
  echo "$OUT"
  echo "$OUT" | grep -q "проблем не найдено" || FAIL=1
done

echo
if [ "$FAIL" = "0" ]; then
  echo "═══ ВСЕ ПРОВЕРКИ ПРОШЛИ ═══"
else
  echo "═══ ЕСТЬ ПРОВАЛЫ ═══"
  exit 1
fi
