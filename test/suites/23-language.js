/* Английский интерфейс. Проверка ведёт всю работу по переводу: она
   рисует экраны на английском и ищет в разметке кириллицу. Данные
   (названия дел, сферы, места) переводить не положено, поэтому для
   проверки заводим приложение с английскими данными — тогда любая
   найденная кириллица означает непереведённый интерфейс.

   Экраны перечислены в DONE. Перевод идёт частями: сделанное сюда
   вписывается и назад уже не отваливается.                          */
var DONE = ["settings", "today", "calendar", "map", "matrix", "all", "item", "capture", "gate"];

T.head("СЛОВАРЬ ЦЕЛ");
T.ok("английский словарь не пуст", Object.keys(EN).length > 50,
  Object.keys(EN).length + " фраз");
var bad = Object.keys(EN).filter(function (k) {
  return typeof EN[k] !== "string" || !EN[k].trim();
});
T.ok("у каждой фразы есть перевод", bad.length === 0, bad.join(", "));
var cyr = Object.keys(EN).filter(function (k) { return /[А-Яа-яЁё]/.test(EN[k]); });
T.ok("в переводах нет кириллицы", cyr.length === 0, cyr.join(", "));

T.head("ЯЗЫК ПЕРЕКЛЮЧАЕТСЯ");
S.cfg.lang = "ru"; setLang();
T.ok("по умолчанию русский", tr("Настройки") === "Настройки");
S.cfg.lang = "en"; setLang();
T.ok("после переключения — английский", tr("Настройки") === "Settings");
T.ok("непереведённое остаётся русским, а не пропадает",
  tr("такой фразы в словаре нет") === "такой фразы в словаре нет");

T.head("УТОЧНЕНИЕ ПЕРЕВОДА ПО МЕСТУ");
S.cfg.lang = "en"; setLang();
T.ok("в списке выбора — no deadline", tr("без срока") === "no deadline");
T.ok("а в итоге дня — with no deadline",
  tr("без срока", "итог") === "with no deadline");
T.ok("уточнение без перевода падает на обычный ключ",
  tr("без срока", "такого-места-нет") === "no deadline");
S.cfg.lang = "ru"; setLang();
T.ok("по-русски уточнение ничего не меняет",
  tr("без срока", "итог") === "без срока");

T.head("МНОЖЕСТВЕННОЕ ЧИСЛО ПО-АНГЛИЙСКИ");
S.cfg.lang = "en"; setLang();
T.ok("1 minute", plural(1, "минута", "минуты", "минут") === "minute");
T.ok("2 minutes", plural(2, "минута", "минуты", "минут") === "minutes");
T.ok("5 minutes", plural(5, "минута", "минуты", "минут") === "minutes");
T.ok("21 minute — без русского исключения",
  plural(21, "минута", "минуты", "минут") === "minutes");
S.cfg.lang = "ru"; setLang();
T.ok("а по-русски по-прежнему 21 минута",
  plural(21, "минута", "минуты", "минут") === "минута");

T.head("ПЕРВЫЙ ЗАПУСК НА АНГЛИЙСКОМ");
S.cfg.lang = "en"; setLang();
var fresh = seed();
T.ok("сферы заведены по-английски",
  fresh.spheres.every(function (sp) { return !/[А-Яа-яЁё]/.test(sp); }),
  fresh.spheres.join(", "));
T.ok("места тоже", fresh.places.join("|") === "Country 1|Country 2",
  fresh.places.join(", "));
T.ok("и человек", fresh.people.join("|") === "Me", fresh.people.join(", "));
T.ok("и примеры дел", fresh.items.every(function (i) {
  return !/[А-Яа-яЁё]/.test(i.title); }),
  fresh.items.map(function (i) { return i.title; }).join(" · "));
T.ok("шаги и варианты внутри примеров тоже", fresh.items.every(function (i) {
  return (i.steps || []).concat(i.options || []).every(function (x) {
    return !/[А-Яа-яЁё]/.test(x.text); }); }));
T.ok("виды дел названы по-английски",
  fresh.types.every(function (d) { return !/[А-Яа-яЁё]/.test(typeLabel(d)); }),
  fresh.types.map(typeLabel).join(" · "));
S.cfg.lang = "ru"; setLang();
T.ok("а по-русски они прежние", typeLabel(seed().types[0]) === "дело");

T.head("НА ЭКРАНАХ НЕ ОСТАЛОСЬ РУССКОГО");
/* Данные — английские: своё приложение, заведённое по-английски. */
S.cfg.lang = "en"; setLang();
S.spheres = seed().spheres; S.places = seed().places; S.people = seed().people;
S.items = seed().items; normalizeItems(); T.reset();

function ruLeft(html) {
  /* Русские слова в разметке — по одному куску, чтобы было видно, что чинить. */
  var out = [], m, re = /[А-Яа-яЁё][А-Яа-яЁё «».,:;!?()«»-]*/g;
  while ((m = re.exec(html))) if (m[0].trim().length > 1) out.push(m[0].trim());
  return out.filter(function (v, i, a) { return a.indexOf(v) === i; })
    /* «Русский» на кнопке языка — не недоделка: название языка пишут
       на нём самом, иначе его не найдёт тот, кто ищет родной. */
    .filter(function (v) { return v !== "Русский"; });
}

function screenClean(name, draw, where) {
  if (DONE.indexOf(name) < 0) return;
  draw();
  var left = ruLeft(where());
  T.ok(name + ": по-английски", left.length === 0, left.join(" | "));
}

screenClean("settings", function () { openSettings(); }, function () { return host.innerHTML; });
closeModal();
["today", "calendar", "map", "matrix", "all"].forEach(function (tab) {
  screenClean(tab, function () { TAB = tab; render(); }, function () { return view.innerHTML; });
});
TAB = "today"; render();
screenClean("item", function () { openItem(T.tasks()[0].id); },
  function () { return host.innerHTML; });
closeModal();
screenClean("capture", function () { clickOn({ act: "cap" }); },
  function () { return host.innerHTML; });
clickOn({ act: "capcancel" });
/* Экран входа: включаем затвор ключами-заглушками, без сети. */
CLOUD.url = "https://gate.test"; CLOUD.key = "k";
screenClean("gate", function () { render(); }, function () { return view.innerHTML; });
CLOUD.url = ""; CLOUD.key = ""; render();

/* Половина текста живёт в состояниях, а не на первом экране: пустые
   списки, открытые списки выбора, окна правки, карточка рутины. */
T.head("СОСТОЯНИЯ, А НЕ ТОЛЬКО ПЕРВЫЙ ЭКРАН");
function clean(name, html) {
  var left = ruLeft(html);
  T.ok(name, left.length === 0, left.join(" | "));
}

var task = T.tasks()[0];
openItem(task.id); clickOn({ act: "edit", id: task.id });
clean("окно правки", host.innerHTML);
clickOn({ act: "dd", k: "place:" + task.id });
clean("выбор места раскрыт", host.innerHTML);
clickOn({ act: "dd", k: "place:" + task.id });
clickOn({ act: "dd", k: "due:" + task.id });
clean("выбор срока раскрыт", host.innerHTML);
clickOn({ act: "ecancel", id: task.id }); closeModal();

var rout = T.routine();
openItem(rout.id);
clean("карточка рутины", host.innerHTML);
clickOn({ act: "edit", id: rout.id });
clean("правка рутины", host.innerHTML);
clickOn({ act: "ecancel", id: rout.id }); closeModal();

var ap = T.appt();
openItem(ap.id); clickOn({ act: "edit", id: ap.id });
clickOn({ act: "arepeat", id: ap.id, v: "days" });
clean("встреча по расписанию", host.innerHTML);
["month", "quarter", "year"].forEach(function (m) {
  clickOn({ act: "rmode", id: ap.id, v: m });
  clean("повтор: " + m, host.innerHTML);
});
clickOn({ act: "arepeat", id: ap.id, v: "once" });
clickOn({ act: "ecancel", id: ap.id }); closeModal();

/* Сделанное дело: окно просмотра архива. */
var d2 = T.tasks()[1];
clickOn({ act: "toggle", id: d2.id });
clickOn({ act: "opendone", id: d2.id, when: today() });
clean("просмотр сделанного", host.innerHTML);
closeModal();
clickOn({ act: "toggle", id: d2.id });

/* Пустое приложение — там живут все объяснения пустоты. */
var keep = S.items;
S.items = []; T.reset();
["today", "calendar", "map", "matrix", "all"].forEach(function (tab) {
  TAB = tab; render();
  clean("пусто: " + TABS[tab], view.innerHTML);
});
S.items = keep; T.reset(); TAB = "today"; render();
S.cfg.lang = "ru"; setLang(); T.reset();

T.done();
