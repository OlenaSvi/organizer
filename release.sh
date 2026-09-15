#!/bin/bash
# Выложить текущую сборку на основной адрес (всем).
#   ./release.sh "описание изменения"
# GitHub Pages отдаёт папку docs/, главную страницу ищет как index.html.
set -e
cd "$(dirname "$0")"
./build.sh > /dev/null
./test/run.sh > /dev/null || { echo "❌ проверки не прошли — выкладки нет"; exit 1; }
mkdir -p docs && cp "Организатор.html" docs/index.html
git add -A
git commit -q -m "${1:-Выкладка}" || true
git push -q origin master
echo "✅ выложено на https://olenasvi.github.io/organizer/ (версия $(grep -o 'const VERSION = "[^"]*"' docs/index.html | cut -d'"' -f2))"
