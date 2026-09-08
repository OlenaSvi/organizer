/* Первый запуск: что видит человек, открывший приложение впервые.
   Плюс — что пустое приложение не ломается ни на одном экране. */

T.head("ПЕРВЫЙ ЗАПУСК: ЕСТЬ ЧТО ПОСМОТРЕТЬ");
/* Разовые правки чинят историю уже заведённого приложения. Тому, кто
   открыл его впервые, чинить нечего: очистка дел, сделанная однажды
   для своих данных, стирала примеры и у него — приложение открывалось
   пустым, и показать его кому-нибудь было нечего. */
var fresh = seed();
T.ok("примеры дел есть", fresh.items.length > 0, fresh.items.length + " записей");
/* Разовых правок в коде больше нет вовсе — чинить у новичка нечего. */
T.ok("разовых правок в приложении не осталось", (function () {
  try { ObjC.import("Foundation");
    var src = $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js;
    return !/if \(!S\.[a-zA-Z0-9_]+\)\s*\{/.test(src.replace(/S\.types|S\.todayOrder|S\.hereNow/g, "X"));
  } catch (e) { return false; }
})());
T.ok("справочники на месте", fresh.spheres.length >= 8 && fresh.places.length >= 2);
/* Места — заготовки «Страна 1» и «Страна 2», а не чьи-то города:
   приложение разводит дела по странам, и новичку показывают саму
   механику, а не чужую географию. Переименование в настройках тянет
   за собой и дела, так что заготовку достаточно назвать своим. */
T.ok("места — безымянные заготовки стран",
  fresh.places.join("|") === "Страна 1|Страна 2", fresh.places.join(", "));
T.ok("примеры разложены по обеим странам", (function () {
  var used = {};
  fresh.items.forEach(function (i) { if (i.place) used[i.place] = 1; });
  return used["Страна 1"] && used["Страна 2"];
})(), fresh.items.filter(function (i) { return i.place; })
  .map(function (i) { return i.title + " → " + i.place; }).join(", "));

T.head("СТАРТОВЫЙ НАБОР ВИДОВ");
var names = fresh.types.map(function (t) { return t.name; });
T.ok("«выбрать / купить» больше нет", names.indexOf("выбрать / купить") < 0,
  names.join(" · "));
T.ok("обычное дело называется «дело»", names.indexOf("дело") >= 0);
T.ok("а «Сделать» не осталось", names.indexOf("Сделать") < 0);
T.ok("«сходить / съездить» тоже убрано — это обычное дело с местом",
  names.indexOf("сходить / съездить") < 0);
T.ok("остальные виды на месте",
  ["рутина", "аппоинтмент", "идея на будущее"]
    .every(function (n) { return names.indexOf(n) >= 0; }), names.join(" · "));
T.ok("видов ровно пять", fresh.types.length === 5, String(fresh.types.length));
T.ok("напоминание среди них", names.indexOf("напоминание") >= 0);
T.ok("варианты остаются у идеи",
  fresh.types.some(function (t) { return t.kind === "idea"; }));
var kinds = {};
fresh.items.forEach(function (i) { kinds[typeDef(i.type).kind] = true; });
T.ok("показаны все виды дел сразу",
  ["plain", "routine", "appt", "idea"].every(function (k) { return kinds[k]; }),
  Object.keys(kinds).join(", "));

T.head("НОВЫЕ ДЕЛА НЕ УДАЛЯЮТСЯ");
S.items.push({ id: "mine1", title: "Купить колбасу", type: defaultType(),
  spheres: ["Быт"], created: today(), due: null, steps: [], done: false, multi: false,
  place: null, person: null, time: null, options: [], routine: null, notes: "",
  forceImp: null, today: null, notToday: null });
normalizeItems(); render();
T.ok("своё дело остаётся на месте", S.items.some(function (i) { return i.id === "mine1"; }));
T.ok("и видно в «Списке»", (function () {
  TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; render();
  return document.getElementById("allList").innerHTML.indexOf("Купить колбасу") >= 0; })());
S.items = S.items.filter(function (i) { return i.id !== "mine1"; });

T.head("СПРАВОЧНИКИ И НАСТРОЙКИ СОХРАНЕНЫ");
T.ok("сферы на месте", S.spheres.length >= 8, S.spheres.join(", "));
T.ok("места на месте", S.places.length >= 2, S.places.join(", "));
/* Людей в стартовом наборе один — «Я»: имена близких у каждого свои,
   и подставлять чужие в новое приложение неуместно. */
T.ok("человек «Я» на месте", S.people.indexOf("Я") >= 0, S.people.join(", "));
T.ok("виды дел на месте", S.types.length >= 4,
  S.types.map(function (t) { return t.name; }).join(", "));
T.ok("настройки не сброшены", S.cfg.todayCap > 0 && S.cfg.urgentDays > 0
  && (S.cfg.theme === "light" || S.cfg.theme === "dark"));

T.head("ПУСТОЕ ПРИЛОЖЕНИЕ НЕ ЛОМАЕТСЯ");
/* Когда примеры удалены, экраны обязаны объяснять пустоту словами. */
var keep = S.items;
S.items = [];
T.reset();
["today", "calendar", "map", "matrix", "all"].forEach(function (tab) {
  TAB = tab;
  try { render(); T.ok("экран «" + TABS[tab] + "» рисуется", view.innerHTML.length > 50); }
  catch (e) { T.ok("экран «" + TABS[tab] + "» рисуется", false, e.message); }
});
TAB = "today"; render();
T.ok("на пустом «Сегодня» объяснение, а не тишина",
  /Предлагать нечего|На сегодня всё|Пока ничего не взято/.test(T.visible(view.innerHTML)));
T.ok("карта показывает пустые ветки — есть куда класть", (function () {
  TAB = "map"; AXIS = "sphere"; render();
  return (view.innerHTML.match(/class="branch"/g) || []).length === S.spheres.length; })());

T.head("СОЗДАНИЕ РАБОТАЕТ НА ПУСТОМ МЕСТЕ");
T.reset();
clickOn({ act: "cap" });
var d = S.items.find(function (i) { return i.draft; });
T.ok("форма открывается", !!d && host.innerHTML.indexOf("capText") >= 0);
d.title = "Первое настоящее дело";
clickOn({ act: "esphere", id: d.id, v: S.spheres[0] });
clickOn({ act: "capsave" });
var saved = live().find(function (i) { return i.title === "Первое настоящее дело"; });
T.ok("дело создаётся и сохраняется", !!saved);
T.ok("и сразу попадает в предложения",
  todayItems().proposals.some(function (s) { return s.it === saved; }));
S.items = keep;
T.reset();

T.done();
