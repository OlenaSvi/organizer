/* Остальные экраны: календарь, карта, матрица, список. */
T.seed();
var t = T.tasks();
t.forEach(function (i, k) { i.due = addDays(today(), k); });

T.head("КАЛЕНДАРЬ");
TAB = "calendar"; CALMODE = "week"; render();
var h = view.innerHTML;
T.ok("листалка: стрелки вокруг заголовка", (function () {
  var nav = /<div class="calnav">([\s\S]*?)<\/div>\s*<button class="navtoday/.exec(h);
  return nav && nav[1].indexOf('data-d="prev"') < nav[1].indexOf("caltitle")
      && nav[1].indexOf("caltitle") < nav[1].indexOf('data-d="next"'); })());
T.ok("полоска цветом вида", h.indexOf("border-left-color:var(--kind-") >= 0);
T.ok("рутины в сетке нет", (function () {
  var r = T.routine(); return !r || h.indexOf(esc(r.title)) < 0; })());
clickOn({ act: "calnav", d: "next" });
T.ok("листание вперёд работает", CALANCHOR !== null);
clickOn({ act: "calnav", d: "today" });
T.ok("возврат к сегодня", CALANCHOR === null);
CALMODE = "month"; render();
T.ok("месяц рисуется", view.innerHTML.indexOf("calgrid month") >= 0);

T.head("КАРТА: РАСКЛАДКА БЕЗ НАЛОЖЕНИЙ");
TAB = "map"; AXIS = "sphere"; S.open = S.spheres.slice(); render();
var svg = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                               view.innerHTML.indexOf("</svg>"));
var nodes = [], m, gre = /<g class="(branch|leaf)"[\s\S]*?<\/g>/g;
while ((m = gre.exec(svg))) {
  var g = m[0];
  var r = /<rect x="([-\d.e]+)" y="([-\d.e]+)" width="([\d.e]+)" height="([\d.e]+)"/.exec(g);
  var tx = /<text x="([-\d.e]+)"[^>]*text-anchor="(\w+)"[\s\S]*?>([^<]*)</.exec(g);
  if (r && tx) nodes.push({ l: +r[1], t: +r[2], r: +r[1] + +r[3], b: +r[2] + +r[4],
                            w: +r[3], tx: +tx[1], anchor: tx[2], txt: tx[3] });
}
var overlap = [];
for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
  var a = nodes[i], c = nodes[j];
  if (a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b) overlap.push(a.txt + " ↔ " + c.txt);
}
T.ok("узлы не пересекаются", overlap.length === 0, overlap.join(" | "));
var offc = nodes.filter(function (nd) {
  return nd.anchor === "middle" && Math.abs(nd.tx - (nd.l + nd.w / 2)) > 0.5; });
T.ok("подписи по центру своих пилюль", offc.length === 0);
T.ok("ветки залиты цветом", /fill:var\(--sph-\d\);opacity/.test(svg));
T.ok("листья — бледный тот же цвет", svg.indexOf("color-mix(in srgb, var(--sph-") >= 0);

T.head("КАРТА: МНОГО ДЕЛ В ОДНОЙ ВЕТКЕ — СТОЛБЦОМ");
for (var q = 0; q < 9; q++) S.items.push({
  id: "col" + q, title: "Довольно длинное название дела " + (q + 1),
  type: defaultType(), spheres: ["развитие"], created: today(), due: null, steps: [],
  done: false, multi: false, place: null, person: null, time: null, options: [],
  routine: null, notes: "", forceImp: null, today: null, notToday: null });
AXIS = "sphere"; S.open = ["развитие"]; render();
var svg2 = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                                view.innerHTML.indexOf("</svg>"));
var leafRects = [], mm2, rre = /<g class="leaf"[\s\S]*?<rect x="([-\d.e]+)" y="([-\d.e]+)" width="([\d.e]+)" height="([\d.e]+)"/g;
while ((mm2 = rre.exec(svg2)))
  leafRects.push({ l: +mm2[1], t: +mm2[2], r: +mm2[1] + +mm2[3], b: +mm2[2] + +mm2[4] });
var inBranch = live().filter(function (i) {
  return (i.spheres || []).indexOf("развитие") >= 0; }).length;
T.ok("нарисованы все дела ветки", leafRects.length === inBranch,
  leafRects.length + " из " + inBranch);
var xs = leafRects.map(function (b) { return Math.round(b.l); });
T.ok("листья стоят одной колонкой", new Set(xs).size === 1,
  "разных левых краёв: " + new Set(xs).size);
var ys = leafRects.map(function (b) { return b.t; }).sort(function (a, b) { return a - b; });
var gaps = [];
for (var g = 1; g < ys.length; g++) gaps.push(Math.round(ys[g] - ys[g - 1]));
T.ok("шаг между ними одинаковый", new Set(gaps).size === 1, "шаги: " + gaps.join(","));
var over2 = [];
for (var a2 = 0; a2 < leafRects.length; a2++)
  for (var b2 = a2 + 1; b2 < leafRects.length; b2++) {
    var A2 = leafRects[a2], B2 = leafRects[b2];
    if (A2.l < B2.r && B2.l < A2.r && A2.t < B2.b && B2.t < A2.b) over2.push(a2 + "×" + b2);
  }
T.ok("не налезают друг на друга", over2.length === 0, over2.join(" "));
S.items = S.items.filter(function (i) { return String(i.id).indexOf("col") !== 0; });
S.open = [];

T.head("КАРТА: КЛИК ПО ЛИСТУ НА ВСЕХ ОСЯХ");
["sphere", "place", "person", "type"].forEach(function (ax) {
  AXIS = ax; S.open = axisValues(ax).slice(); render();
  var mapEl = document.getElementById("map");
  var one = live()[0];
  var lf = { dataset: { dragMap: one.id, from: "x" },
             classList: { add: function () {}, remove: function () {} },
             setAttribute: function () {}, removeAttribute: function () {} };
  closeModal();
  (mapEl._l.pointerdown || []).slice(-1).forEach(function (f) {
    f({ target: { closest: function (s) { return s === "[data-drag-map]" ? lf : null; } },
        clientX: 100, clientY: 100 }); });
  (window._l.pointerup || []).slice(-1).forEach(function (f) { f({ clientX: 100, clientY: 100 }); });
  T.ok("ось «" + AXES[ax] + "»: клик открывает просмотр",
    host.innerHTML.indexOf("Редактировать") >= 0);
  closeModal();
});
AXIS = "sphere"; S.open = [];

T.head("МАТРИЦА");
TAB = "matrix"; render();
h = view.innerHTML;
T.ok("метка «Главная клетка» одна и в описании",
  (h.match(/Главная клетка/g) || []).length === 1);
T.ok("синей обводки у главной клетки нет", h.indexOf("quad hero") >= 0);
T.ok("счётчик перед плюсом", (function () {
  var h3 = /<h3>[\s\S]*?<\/h3>/.exec(h)[0];
  return h3.indexOf("qcount") < h3.indexOf("addhere"); })());
T.ok("«на паузе» из старых версий не осталось", h.indexOf("паузе") < 0);

T.head("СПИСОК");
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; render();
h = view.innerHTML;
T.ok("срез «все» первым и по умолчанию",
  allFilters()[0][0] === "all" && ALLFILTER === "all");
T.ok("показано всё живое",
  (document.getElementById("allList").innerHTML.match(/class="allrow"/g) || []).length
    === live().length);
T.ok("сортировка есть", h.indexOf('data-k="allsort"') >= 0);
T.ok("счётчик стоит над списком, а не у заголовка",
  h.indexOf('id="allCount"') > h.indexOf('class="allbar"')
  && h.indexOf('id="allCount"') < h.indexOf('id="allList"'));
T.ok("счётчик считает отфильтрованное", (function () {
  var rk = "type:" + S.types.find(function (t2) { return t2.kind === "routine"; }).key;
  ALLFILTER = rk; render();
  var n2 = live().filter(isRoutine).length;
  var txt = document.getElementById("allCount").textContent;
  ALLFILTER = "all"; render();
  return txt.indexOf(String(n2)) === 0; })());
clickOn({ act: "dd", k: "allsort" });
clickOn({ act: "allsortset", v: "alpha" });
var names = [];
document.getElementById("allList").innerHTML
  .replace(/class="suggname"[^>]*>([^<]+)</g, function (mm, nm) { names.push(nm.trim()); return mm; });
T.ok("алфавит работает",
  names.join() === names.slice().sort(function (a, b) { return a.localeCompare(b, "ru"); }).join());
ALLSORT = "due";
T.ok("слова «просрочено» нет нигде", view.innerHTML.indexOf("просрочен") < 0);
T.reset();

T.done();
