#!/bin/bash
# Сборка приложения из частей + проверка синтаксиса.
#   ./build.sh          — собрать «Организатор.html»
#   ./build.sh --check  — собрать и только проверить синтаксис
set -e
cd "$(dirname "$0")"

OUT="Организатор.html"
PARTS="src/app.head.part src/app.lang.part src/app.cloud.part src/app.body.part src/app.views.part \
       src/app.map.part src/app.modal.part src/app.events.part"

cat $PARTS > "$OUT"
# Номер версии — момент сборки, по местному времени.
sed -i "" "s/__VERSION__/$(date '+%Y-%m-%d %H:%M')/" "$OUT"

# Логику вынимаем из <script>…</script> — её же используют тесты.
awk '/^<script>$/{f=1;next} /^<\/script>$/{f=0} f' "$OUT" \
  | sed 's/^"use strict";$//' > build/logic.js

RES=$(osascript -l JavaScript -e '
  ObjC.import("Foundation");
  var s = $.NSString.stringWithContentsOfFileEncodingError("'"$PWD"'/build/logic.js", 4, null).js;
  try { new Function(s); "ok" } catch (e) { "ОШИБКА: " + e.message }')

if [ "$RES" != "ok" ]; then
  echo "❌ $RES"
  exit 1
fi

echo "✅ собрано: $OUT ($(wc -c < "$OUT" | tr -d ' ') байт), синтаксис чист"
