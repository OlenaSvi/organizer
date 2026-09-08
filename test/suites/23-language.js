/* Английский интерфейс. Проверка ведёт всю работу по переводу: она
   рисует экраны на английском и ищет в разметке кириллицу. Данные
   (названия дел, сферы, места) переводить не положено, поэтому для
   проверки заводим приложение с английскими данными — тогда любая
   найденная кириллица означает непереведённый интерфейс.

   Экраны перечислены в DONE. Перевод идёт частями: сделанное сюда
   вписывается и назад уже не отваливается.                          */
var DONE = ["settings"];

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

T.head("МНОЖЕСТВЕННОЕ ЧИСЛО ПО-АНГЛИЙСКИ");
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

if (DONE.indexOf("settings") >= 0) {
  openSettings();
  var left = ruLeft(host.innerHTML);
  T.ok("настройки полностью по-английски", left.length === 0, left.join(" | "));
  closeModal();
}
S.cfg.lang = "ru"; setLang(); T.reset();

T.done();
