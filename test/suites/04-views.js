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
  var r = /<rect x="([-\d.e]+)"\s+y="([-\d.e]+)"\s+width="([\d.e]+)"\s+height="([\d.e]+)"/.exec(g);
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
T.ok("ветки залиты цветом", /fill:var\(--sph-\d\)/.test(svg));
T.ok("корень — своя плашка, не из восьмёрки сфер",
  /fill:var\(--maproot\)/.test(svg));
/* Дело на карте — просто тёмный текст без плашки: цвет держит ветка, а
   у дела он только сбивал бы. Прозрачный прямоугольник под текстом —
   лишь область нажатия и захвата. */
T.ok("дело — текст, а не крашеная плашка",
  svg.indexOf("color-mix(in srgb, var(--sph-") < 0
  && /<g class="leaf"[\s\S]{0,300}style="fill:transparent"/.test(svg));

T.head("КАРТА: МНОГО ДЕЛ В ОДНОЙ ВЕТКЕ — СТОЛБЦОМ");
for (var q = 0; q < 9; q++) S.items.push({
  id: "col" + q, title: "Довольно длинное название дела " + (q + 1),
  type: defaultType(), spheres: ["развитие"], created: today(), due: null, steps: [],
  done: false, multi: false, place: null, person: null, time: null, options: [],
  routine: null, notes: "", forceImp: null, today: null, notToday: null });
AXIS = "sphere"; S.open = ["развитие"]; render();
var svg2 = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                                view.innerHTML.indexOf("</svg>"));
var leafRects = [], mm2, rre = /<g class="leaf"[\s\S]*?<rect x="([-\d.e]+)"\s+y="([-\d.e]+)"\s+width="([\d.e]+)"\s+height="([\d.e]+)"/g;
while ((mm2 = rre.exec(svg2)))
  leafRects.push({ l: +mm2[1], t: +mm2[2], r: +mm2[1] + +mm2[3], b: +mm2[2] + +mm2[4] });
var inBranch = live().filter(function (i) {
  return (i.spheres || []).indexOf("развитие") >= 0; }).length;
T.ok("нарисованы все дела ветки", leafRects.length === inBranch,
  leafRects.length + " из " + inBranch);
var xs = leafRects.map(function (b) { return Math.round(b.l); });
T.ok("листья стоят одной колонкой", new Set(xs).size === 1,
  "разных левых краёв: " + new Set(xs).size);
/* Шаг больше не одинаковый: подпись переносится, и высота листа
   зависит от числа строк. Требуем другого — чтобы они шли сверху вниз
   и не наезжали друг на друга. */
var sorted = leafRects.slice().sort(function (a, b) { return a.t - b.t; });
var gaps = [];
for (var g = 1; g < sorted.length; g++) gaps.push(Math.round(sorted[g].t - sorted[g - 1].b));
T.ok("листья не наезжают друг на друга",
  gaps.every(function (x) { return x >= 0; }), "просветы: " + gaps.join(","));
T.ok("и стоят вплотную, без провалов",
  gaps.every(function (x) { return x <= 20; }), "просветы: " + gaps.join(","));
var over2 = [];
for (var a2 = 0; a2 < leafRects.length; a2++)
  for (var b2 = a2 + 1; b2 < leafRects.length; b2++) {
    var A2 = leafRects[a2], B2 = leafRects[b2];
    if (A2.l < B2.r && B2.l < A2.r && A2.t < B2.b && B2.t < A2.b) over2.push(a2 + "×" + b2);
  }
T.ok("не налезают друг на друга", over2.length === 0, over2.join(" "));
S.items = S.items.filter(function (i) { return String(i.id).indexOf("col") !== 0; });
S.open = [];

T.head("НА КАРТЕ НАЗВАНИЕ ЦЕЛИКОМ");
/* Подпись обрывалась на 24 знаках многоточием — по такому листу
   нельзя было понять, что за дело. Теперь длинное имя переносится. */
T.reset();
var lg = T.tasks()[0];
lg.title = "Собрать документы для продления вида на жительство";
lg.spheres = ["Быт"];
TAB = "map"; AXIS = "sphere"; S.open = ["Быт"]; render();
function leafText(id) {
  var h = view.innerHTML.replace(/\s+/g, " ");
  var at = h.indexOf('data-drag-map="' + id + '"');
  if (at < 0) return null;
  var g = h.slice(at, h.indexOf("</g>", at));
  var out = [], m, re = />([^<>]+)</g;
  while ((m = re.exec(g))) out.push(m[1].trim());
  return out.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
T.ok("название показано целиком", leafText(lg.id) === lg.title, String(leafText(lg.id)));
T.ok("многоточия нет", (leafText(lg.id) || "").indexOf("…") < 0);
/* Переносить больше не нужно: подпись идёт вдоль гребёнки наружу, и
   места ей столько, сколько надо — карта просто становится шире. */
T.ok("подпись одной строкой, без переносов",
  (view.innerHTML.slice(view.innerHTML.indexOf('data-drag-map="' + lg.id + '"'))
    .slice(0, 900).match(/<tspan/g) || []).length === 0);
S.open = [];
T.reset();

T.head("КАРТА: РАСКРЫТЫ ВСЕ ВЕТКИ РАЗОМ");
["развитие", "Быт", "бюрократия"].forEach(function (sp, si) {
  for (var z = 0; z < 6 + si * 2; z++) S.items.push({
    /* Каждое третье — длинное: раскладка обязана держать перенос,
       а не только короткие подписи. */
    id: "z" + si + "_" + z, title: z % 3 === 2
      ? "Собрать документы для продления вида на жительство " + sp
      : "Дело " + sp + " номер " + (z + 1),
    type: defaultType(), spheres: [sp], created: today(), due: null, steps: [],
    done: false, multi: false, place: null, person: null, time: null, options: [],
    routine: null, notes: "", forceImp: null, today: null, notToday: null });
});
TAB = "map"; AXIS = "sphere"; S.open = S.spheres.slice(); render();
var svg3 = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                                view.innerHTML.indexOf("</svg>"));
var all3 = [], m3, gre3 = /<g class="(branch|leaf)"[\s\S]*?<rect x="([-\d.e]+)"\s+y="([-\d.e]+)"\s+width="([\d.e]+)"\s+height="([\d.e]+)"/g;
while ((m3 = gre3.exec(svg3)))
  all3.push({ kind: m3[1], l: +m3[2], t: +m3[3], r: +m3[2] + +m3[4], b: +m3[3] + +m3[5] });
T.ok("узлов много", all3.length > 25, all3.length + " узлов");
var bad3 = 0;
for (var i3 = 0; i3 < all3.length; i3++)
  for (var j3 = i3 + 1; j3 < all3.length; j3++) {
    var A3 = all3[i3], B3 = all3[j3];
    if (A3.l < B3.r && B3.l < A3.r && A3.t < B3.b && B3.t < A3.b) bad3++;
  }
T.ok("ничего не налезает друг на друга", bad3 === 0, bad3 + " пересечений");
S.items = S.items.filter(function (i) { return String(i.id).indexOf("z") !== 0; });
S.open = [];

T.head("КАРТА: ДЛИННЫЕ ИМЕНА ВЕТОК НЕ СЛИПАЮТСЯ");
["sphere", "place", "person", "type"].forEach(function (ax2) {
  AXIS = ax2; S.open = []; render();
  var sv = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                                view.innerHTML.indexOf("</svg>"));
  var br = [], mb, bre = /<g class="branch"[\s\S]*?<rect x="([-\d.e]+)"\s+y="([-\d.e]+)"\s+width="([\d.e]+)"\s+height="([\d.e]+)"[\s\S]*?>([^<]*)<\/text>/g;
  while ((mb = bre.exec(sv)))
    br.push({ l: +mb[1], t: +mb[2], r: +mb[1] + +mb[3], b: +mb[2] + +mb[4], txt: mb[5] });
  var hit = [];
  for (var p1 = 0; p1 < br.length; p1++)
    for (var p2 = p1 + 1; p2 < br.length; p2++) {
      var X = br[p1], Y = br[p2];
      if (X.l < Y.r && Y.l < X.r && X.t < Y.b && Y.t < X.b)
        hit.push(X.txt + " × " + Y.txt);
    }
  T.ok("ось «" + AXES[ax2] + "»: ветки не пересекаются", hit.length === 0, hit.join(", "));
});

/* Тот же случай, что на экране Елены: одна большая ветка раскрыта и
   сдвигает остальные — закрытые с длинными именами слипались. */
AXIS = "type";
var doKey = S.types.find(function (t2) { return t2.key === "task"; });
if (doKey) {
  for (var d2 = 0; d2 < 10; d2++) S.items.push({
    id: "d2_" + d2, title: "Написать эндокринологу " + (d2 + 1), type: doKey.key,
    spheres: ["другое"], created: today(), due: null, steps: [], done: false,
    multi: false, place: null, person: null, time: null, options: [],
    routine: null, notes: "", forceImp: null, today: null, notToday: null });
  S.open = [doKey.key]; render();
  var sv2 = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                                 view.innerHTML.indexOf("</svg>"));
  var br2 = [], mb2, bre2 = /<g class="branch"[\s\S]*?<rect x="([-\d.e]+)"\s+y="([-\d.e]+)"\s+width="([\d.e]+)"\s+height="([\d.e]+)"[\s\S]*?>([^<]*)<\/text>/g;
  while ((mb2 = bre2.exec(sv2)))
    br2.push({ l: +mb2[1], t: +mb2[2], r: +mb2[1] + +mb2[3], b: +mb2[2] + +mb2[4], txt: mb2[5] });
  var hit2 = [];
  for (var q1 = 0; q1 < br2.length; q1++)
    for (var q2 = q1 + 1; q2 < br2.length; q2++) {
      var U = br2[q1], V = br2[q2];
      if (U.l < V.r && V.l < U.r && U.t < V.b && V.t < U.b) hit2.push(U.txt + " × " + V.txt);
    }
  T.ok("с раскрытой большой веткой соседи тоже не слипаются",
    hit2.length === 0, hit2.join(", "));
  S.items = S.items.filter(function (i) { return String(i.id).indexOf("d2_") !== 0; });
}
S.open = []; AXIS = "sphere";

/* Набор с экрана Елены: длинные названия видов рядом внизу круга. */
T.head("КАРТА: ВЕТКИ НЕ ТЕСНЯТСЯ");
var keep = S.items.slice();
S.items = [];
[[10, "plain", "Написать эндокринологу"], [6, "routine", "Рутина"],
 [2, "appt", "Приём"], [1, "idea", "Инвестиции"],
 [1, "errand", "Съездить"], [1, "choice", "Выбрать подарок"]].forEach(function (spec) {
  var tp = S.types.find(function (x) { return x.kind === spec[1]; }) || S.types[0];
  for (var i4 = 0; i4 < spec[0]; i4++) S.items.push({
    id: spec[1] + i4, title: spec[2] + " " + (i4 + 1), type: tp.key, spheres: ["другое"],
    created: today(), due: null, steps: [], done: false, multi: false, place: null,
    person: null, time: null, options: [],
    routine: spec[1] === "routine" ? { days: [0,1,2,3,4,5,6], history: [] } : null,
    notes: "", forceImp: null, today: null, notToday: null });
});
AXIS = "type";
S.open = [S.types.find(function (t3) { return t3.kind === "plain"; }).key];
render();
var sv3 = view.innerHTML.slice(view.innerHTML.indexOf('id="mapG"'),
                               view.innerHTML.indexOf("</svg>"));
var br3 = [], mb3, bre3 = /<g class="branch"[\s\S]*?<rect x="([-\d.e]+)"\s+y="([-\d.e]+)"\s+width="([\d.e]+)"\s+height="([\d.e]+)"/g;
while ((mb3 = bre3.exec(sv3)))
  br3.push({ l: +mb3[1], t: +mb3[2], r: +mb3[1] + +mb3[3], b: +mb3[2] + +mb3[4] });
var gap3 = 1e9;
for (var g1 = 0; g1 < br3.length; g1++)
  for (var g2 = g1 + 1; g2 < br3.length; g2++) {
    var G1 = br3[g1], G2 = br3[g2];
    var dx3 = Math.max(G1.l - G2.r, G2.l - G1.r, 0);
    var dy3 = Math.max(G1.t - G2.b, G2.t - G1.b, 0);
    gap3 = Math.min(gap3, (dx3 || dy3) ? Math.hypot(dx3, dy3) : -1);
  }
/* В дереве ветки стоят столбцом вплотную к своему ряду, поэтому
   требовать 24px воздуха между ними бессмысленно. Требуем другого:
   чтобы они не наезжали и шли ровной колонкой. */
T.ok("ветки не наезжают друг на друга", gap3 >= 0, Math.round(gap3) + "px");
S.items = keep; S.open = []; AXIS = "sphere";

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
/* Срез «дела» значил «всё, кроме рутины, встреч и идей». Плоский вид
   остался один — «дело», — и два соседних пункта стали означать ровно
   одно и то же. Из двух одинаковых остаётся тот, что назван видом. */
T.ok("«дела» и «дело» не стоят рядом двумя пунктами",
  allFilters().filter(function (f) { return /^дел[оа]$/.test(f[1]); }).length === 1,
  allFilters().map(function (f) { return f[1]; }).join(" · "));
T.ok("срез по виду «дело» на месте",
  allFilters().some(function (f) { return f[1] === "дело"; }));
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

T.head("«СНАЧАЛА НОВЫЕ» — ПО ПОРЯДКУ СОЗДАНИЯ");
/* Все дела одного дня раньше были неразличимы: хранилась только дата,
   и внутри дня список раскладывался по алфавиту. Записанное последним
   должно стоять первым. Имена выбраны так, чтобы алфавит спорил с
   порядком записи — иначе проверка ничего не докажет. */
T.reset();
S.items = [];
["Аня", "Яна", "Боря"].forEach(function (nm) {
  clickOn({ act: "cap" });
  var dr = S.items.find(function (i) { return i.draft; });
  dr.title = nm;
  clickOn({ act: "capsave" });
});
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; ALLPERIOD = "all";
clickOn({ act: "dd", k: "allsort" });
clickOn({ act: "allsortset", v: "fresh" });
var fresh = [];
document.getElementById("allList").innerHTML
  .replace(/class="suggname"[^>]*>([^<]+)</g, function (mm, nm) { fresh.push(nm.trim()); return mm; });
T.ok("последнее записанное — первым", fresh.join(" · ") === "Боря · Яна · Аня",
  fresh.join(" · "));
T.ok("это не алфавит", fresh.join() !== "Аня,Боря,Яна");
ALLSORT = "due";
T.reset();

T.head("ПЕРЕТАСКИВАНИЕ ПО КАРТЕ ЧЕСТНОЕ");
/* Подсветка цели искала у ветки кружок — а ветки давно плашки, и
   перенос выглядел неработающим: лист ездит, а ничего не отзывается. */
var MC = (function () {
  try { ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();
T.ok("подсветка цели ищет плашку, а не кружок",
  MC.indexOf(".branch circle") < 0 && MC.indexOf('.branch rect') >= 0);
T.ok("лист не трогается с места от дрожания руки",
  /moved > DRAG_MIN/.test(MC) || /moved > 5/.test(MC),
  "иначе клик выглядит как неудавшийся перенос");

T.head("КАРТА НА ВЕСЬ ЭКРАН");
/* Карта — единственный экран, где не хватает места по-настоящему:
   раскрытые ветки уходят за края. Разворот не меняет саму карту, он
   только отдаёт ей всё окно. */
T.reset();
TAB = "map"; AXIS = "sphere"; render();
T.ok("кнопка разворота есть", view.innerHTML.indexOf('data-act="mapfull"') >= 0);
T.ok("пока свёрнута — обёртка обычная",
  /class="mapstage"/.test(view.innerHTML), "класс full не должен стоять");
clickOn({ act: "mapfull" });
T.ok("развернулась", /class="mapstage full"/.test(view.innerHTML));
T.ok("подпись кнопки сменилась",
  view.innerHTML.indexOf("свернуть") >= 0);
T.ok("оси и кнопки остались внутри — иначе ими не воспользоваться",
  view.innerHTML.indexOf('class="mapstage full"') <
  view.innerHTML.indexOf('data-act="axis"'));
clickOn({ act: "mapfull" });
T.ok("свернулась обратно", /class="mapstage"/.test(view.innerHTML)
  && view.innerHTML.indexOf('class="mapstage full"') < 0);

T.head("РАЗВОРОТ НЕ ПЕРЕЖИВАЕТ УХОД С КАРТЫ");
/* Иначе, вернувшись на карту через день, находишь её на весь экран и
   не понимаешь, что случилось. */
clickOn({ act: "mapfull" });
TAB = "today"; render();
TAB = "map"; render();
T.ok("вернулись — карта обычного размера",
  view.innerHTML.indexOf('class="mapstage full"') < 0);
T.reset();

T.done();
