/* Перенос дела с ветки на ветку — от нажатия до броска, весь путь.
   Раньше это нигде не проверялось: карту переписали, подсветка цели
   отвалилась молча, и понять, работает ли перенос, можно было только
   руками. Теперь путь прогоняется целиком. */
T.seed();
T.reset();
var it0 = T.tasks()[0];
it0.spheres = ["Быт"];
TAB = "map"; AXIS = "sphere"; S.open = ["Быт", "развитие"];
ZOOM = 1; PAN = { x: 0, y: 0 };
render();

/* Карта живёт в SVG, а у поддельного DOM нет ни размеров, ни узлов.
   Подставляем размеры и подсовываем поддельный лист — всё остальное
   (MAPNODES, пересчёт координат, сам перенос) настоящее. */
var W = 600, H = 600;
var mapEl = document.getElementById("map");
mapEl.getBoundingClientRect = function () {
  return { left: 0, top: 0, width: W, height: H };
};
var vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(view.innerHTML);
T.ok("у карты есть поле зрения", !!vb, vb ? vb[0] : "нет viewBox");
var vbW = +vb[3], vbH = +vb[4];
var k = Math.min(W / vbW, H / vbH);
/* Обратный пересчёт: точка карты → точка экрана. Та же формула, что и
   в приложении, только наоборот. */
function screenOf(p) {
  return { clientX: W / 2 + (p.x * ZOOM + PAN.x) * k,
           clientY: H / 2 + (p.y * ZOOM + PAN.y) * k };
}

var moved = [];
var leaf = { dataset: { dragMap: it0.id, from: "Быт" },
  classList: { add: function (c) { moved.push("+" + c); },
               remove: function (c) { moved.push("-" + c); } },
  setAttribute: function (n, v) { moved.push(n + "=" + v); },
  removeAttribute: function () { moved.push("-transform"); } };
leaf.closest = function (sel) { return sel === "[data-drag-map]" ? leaf : null; };
var target = { closest: function (sel) { return leaf.closest(sel); } };

function mid(n) {
  return n.x1 !== undefined ? { x: (n.x0 + n.x1) / 2, y: (n.y0 + n.y1) / 2 }
                            : { x: n.x, y: n.y };
}
var from = MAPNODES.find(function (n) { return n.val === "Быт"; });
var to = MAPNODES.find(function (n) { return n.val === "развитие"; });
T.ok("обе ветки есть среди целей", !!from && !!to,
  MAPNODES.map(function (n) { return n.val; }).join(" · "));

function fire(who, type, pt) {
  (who._l[type] || []).forEach(function (f) {
    f({ target: target, clientX: pt.clientX, clientY: pt.clientY,
        preventDefault: function () {}, stopPropagation: function () {} });
  });
}

T.head("ВЕДЁМ ДЕЛО НА ДРУГУЮ ВЕТКУ");
fire(mapEl, "pointerdown", screenOf(mid(from)));
fire(window, "pointermove", screenOf({ x: (mid(from).x + mid(to).x) / 2, y: (mid(from).y + mid(to).y) / 2 }));
T.ok("лист поехал за пальцем", moved.some(function (m) { return /^transform=/.test(m); }),
  moved.join(" "));
T.ok("и помечен как переносимый", moved.indexOf("+dragging") >= 0);
fire(window, "pointermove", screenOf(mid(to)));
fire(window, "pointerup", screenOf(mid(to)));
T.ok("дело переехало в другую сферу", (it0.spheres || []).indexOf("развитие") >= 0,
  (it0.spheres || []).join(" · "));
T.ok("и ушло из прежней", (it0.spheres || []).indexOf("Быт") < 0);

T.head("ЦЕЛЬ — ВСЯ ПОЛОСА ВЕТКИ, А НЕ ТОЛЬКО ПЛАШКА");
/* Плашки веток стоят в своей колонке, а дела — далеко наружу. Если
   ловить бросок только плашкой, целиться приходится в узкую полоску
   вдалеке от того места, куда рука ведёт естественно. */
T.reset();
it0.spheres = ["Быт"];
TAB = "map"; AXIS = "sphere"; S.open = ["Быт", "развитие"]; ZOOM = 1; PAN = { x: 0, y: 0 };
render();
mapEl = document.getElementById("map");
mapEl.getBoundingClientRect = function () {
  return { left: 0, top: 0, width: W, height: H };
};
from = MAPNODES.find(function (n) { return n.val === "Быт"; });
to = MAPNODES.find(function (n) { return n.val === "развитие"; });
leaf.dataset.from = "Быт";
/* Целимся туда, где у ветки «развитие» висят её дела — наружу от плашки. */
var farX = to.x1 !== undefined ? (to.x0 + to.x1) / 2 : to.x;
var midY = to.y1 !== undefined ? (to.y0 + to.y1) / 2 : to.y;
fire(mapEl, "pointerdown", screenOf({ x: from.x !== undefined ? from.x : 0,
                                      y: from.y !== undefined ? from.y : 0 }));
fire(window, "pointermove", screenOf({ x: farX, y: midY }));
fire(window, "pointerup", screenOf({ x: farX, y: midY }));
T.ok("бросок рядом с делами ветки засчитан",
  (it0.spheres || []).indexOf("развитие") >= 0, (it0.spheres || []).join(" · "));

T.head("БРОСОК МИМО НИЧЕГО НЕ МЕНЯЕТ");
T.reset();
it0.spheres = ["Быт"];
TAB = "map"; AXIS = "sphere"; S.open = ["Быт"]; ZOOM = 1; PAN = { x: 0, y: 0 };
render();
mapEl = document.getElementById("map");
mapEl.getBoundingClientRect = function () {
  return { left: 0, top: 0, width: W, height: H };
};
leaf.dataset.from = "Быт";
from = MAPNODES.find(function (n) { return n.val === "Быт"; });
fire(mapEl, "pointerdown", screenOf(mid(from)));
fire(window, "pointermove", { clientX: 5, clientY: 5 });
fire(window, "pointerup", { clientX: 5, clientY: 5 });
T.ok("сфера осталась прежней", (it0.spheres || []).join() === "Быт",
  (it0.spheres || []).join(" · "));

T.head("НАЖАЛИ И ОТПУСТИЛИ — ЭТО ПРОСМОТР, А НЕ ПЕРЕНОС");
T.reset();
it0.spheres = ["Быт"];
TAB = "map"; S.open = ["Быт"]; ZOOM = 1; PAN = { x: 0, y: 0 }; render();
mapEl = document.getElementById("map");
mapEl.getBoundingClientRect = function () {
  return { left: 0, top: 0, width: W, height: H };
};
from = MAPNODES.find(function (n) { return n.val === "Быт"; });
var pt = screenOf(mid(from));
fire(mapEl, "pointerdown", pt);
fire(window, "pointermove", { clientX: pt.clientX + 2, clientY: pt.clientY + 1 });
fire(window, "pointerup", { clientX: pt.clientX + 2, clientY: pt.clientY + 1 });
T.ok("открылось окно дела", host.innerHTML.indexOf(esc(it0.title)) >= 0);
T.ok("сфера не менялась", (it0.spheres || []).join() === "Быт");
closeModal();
T.reset();

T.done();
