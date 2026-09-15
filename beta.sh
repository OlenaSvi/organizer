#!/bin/bash
# Выложить текущую сборку на пробный адрес — посмотреть на телефоне до
# того, как менять основной.  ./beta.sh "описание"
set -e
cd "$(dirname "$0")"
./build.sh > /dev/null
./test/run.sh > /dev/null || { echo "❌ проверки не прошли — выкладки нет"; exit 1; }
mkdir -p docs/beta && cp "Организатор.html" docs/beta/index.html
cp docs/icon-180.png docs/icon-512.png docs/manifest.webmanifest docs/beta/ 2>/dev/null || true
git add -A
git commit -q -m "${1:-Пробная выкладка}" || true
git push -q origin master
echo "✅ пробный адрес: https://olenasvi.github.io/organizer/beta/ (версия $(grep -o 'const VERSION = "[^"]*"' docs/beta/index.html | cut -d'"' -f2))"
