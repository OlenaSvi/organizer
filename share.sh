#!/bin/bash
# Готовит версию для публикации по ссылке.
#
# Организатор.html — цельный документ. Страница по ссылке оборачивается
# в свой каркас <html><head><body>, поэтому наши собственные теги
# документа нужно снять, оставив только содержимое head и body.
set -e
cd "$(dirname "$0")"
./build.sh > /dev/null

SRC="Организатор.html"
OUT="build/share.html"
mkdir -p build

HEAD_END=$(grep -n "^</head>$" "$SRC" | head -1 | cut -d: -f1)
BODY_BEG=$(grep -n "^<body>$" "$SRC" | head -1 | cut -d: -f1)
BODY_END=$(grep -n "^</body>$" "$SRC" | head -1 | cut -d: -f1)

# Содержимое head без meta charset/viewport — их ставит каркас страницы.
sed -n "4,$((HEAD_END - 1))p" "$SRC" | grep -v '^<meta ' > "$OUT"
sed -n "$((BODY_BEG + 1)),$((BODY_END - 1))p" "$SRC" >> "$OUT"

echo "✅ готово: $OUT ($(wc -c < "$OUT" | tr -d ' ') байт)"
