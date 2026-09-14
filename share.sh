#!/bin/bash
# Готовит версию для публикации по ссылке.
#
# Организатор.html — цельный документ. Страница по ссылке оборачивается
# в свой каркас <html><head><body>, поэтому наши собственные теги
# документа нужно снять, оставив только содержимое head и body.
#
# И версия по ссылке хранится в браузере под своим ключом. Иначе она
# делит память со всем, что открыто с того же адреса, и человек,
# заходивший на страницу раньше, видит не новое приложение, а своё
# старое состояние: примеры и справочники создаются только тогда,
# когда сохранённого нет вовсе. Со своим ключом каждая публикация
# честно показывает первый запуск, ничего при этом не удаляя.
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

# Свой ключ хранения — только у версии по ссылке.
sed -i "" 's/const KEY = "organizer\.v1"/const KEY = "organizer.demo"/' "$OUT"
sed -i "" 's/const VIEWKEY = "organizer\.view"/const VIEWKEY = "organizer.demo.view"/' "$OUT"

# У страницы по ссылке нет доступа к сети — раздел «Аккаунт» там пустой.
sed -i "" 's/^const CLOUD = { url: "[^"]*", key: "[^"]*" };/const CLOUD = { url: "", key: "" };/' "$OUT"
grep -q '^const CLOUD = { url: "", key: "" };' "$OUT" || { echo "❌ ключи облака не вычищены"; exit 1; }

for k in '"organizer.demo"' '"organizer.demo.view"'; do
  grep -q "$k" "$OUT" || { echo "❌ ключ $k не подставился"; exit 1; }
done
grep -q '"organizer\.v1"' "$OUT" && { echo "❌ остался личный ключ organizer.v1"; exit 1; }

echo "✅ готово: $OUT ($(wc -c < "$OUT" | tr -d ' ') байт), ключ organizer.demo"
