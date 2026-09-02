/* Повтор бывает четырёх видов: по дням недели, каждый месяц, раз в
   квартал и каждый год. Последнее — про дни рождения. */
T.seed();
var a = T.appt();
a.due = null;
a.created = "2026-01-01";

function on(iso) { return repeatOn(a, iso); }

T.head("КАЖДЫЙ МЕСЯЦ");
a.repeat = { every: "month", day: 5, history: [] };
T.ok("расписание считается заполненным", repeats(a));
T.ok("5 февраля — да", on("2026-02-05"));
T.ok("5 марта — да", on("2026-03-05"));
T.ok("6 марта — нет", !on("2026-03-06"));
T.ok("до появления записи — нет", !on("2025-12-05"));

T.head("КОРОТКИЙ МЕСЯЦ НЕ ПРОПУСКАЕТСЯ");
/* «Каждое 31-е» в феврале сдвигается на последний день: пропуск
   выглядел бы как поломка. */
a.repeat = { every: "month", day: 31, history: [] };
T.ok("31 января — да", on("2026-01-31"));
T.ok("28 февраля 2026 — да", on("2026-02-28"));
T.ok("27 февраля — нет", !on("2026-02-27"));
T.ok("29 февраля 2028 — да (високосный)", on("2028-02-29"));
T.ok("28 февраля 2028 — нет", !on("2028-02-28"));
T.ok("30 апреля — да", on("2026-04-30"));

T.head("РАЗ В КВАРТАЛ");
/* Отсчёт от месяца, в котором запись появилась. */
a.repeat = { every: "quarter", day: 1, history: [] };
T.ok("январь — да", on("2026-01-01"));
T.ok("февраль — нет", !on("2026-02-01"));
T.ok("апрель — да", on("2026-04-01"));
T.ok("июль — да", on("2026-07-01"));
T.ok("август — нет", !on("2026-08-01"));
T.ok("январь следующего года — да", on("2027-01-01"));

T.head("КАЖДЫЙ ГОД — ДЕНЬ РОЖДЕНИЯ");
a.repeat = { every: "year", day: 12, month: 2, history: [] };
T.ok("12 марта 2026 — да", on("2026-03-12"));
T.ok("12 марта 2027 — да", on("2027-03-12"));
T.ok("12 апреля — нет", !on("2026-04-12"));
T.ok("11 марта — нет", !on("2026-03-11"));
T.ok("29 февраля переносится на 28-е", (function () {
  a.repeat = { every: "year", day: 29, month: 1, history: [] };
  return on("2027-02-28") && !on("2027-02-27") && on("2028-02-29"); })());

T.head("СТАРАЯ ЗАПИСЬ БЕЗ ВИДА ПОВТОРА — НЕДЕЛЬНАЯ");
a.repeat = { days: [1, 3], history: [] };
normalizeItems();
T.ok("вид проставлен", a.repeat.every === "week");
T.ok("и работает по дням недели",
  on(addDays(startOfWeek("2026-06-01"), 0)) || on("2026-06-01"));

T.head("СЛОВАМИ");
a.time = "18:00";
a.repeat = { every: "month", day: 5, history: [] };
T.ok("каждый месяц", dateLabel(a) === "5-го каждый месяц · 18:00", dateLabel(a));
a.repeat = { every: "quarter", day: 5, history: [] };
T.ok("раз в квартал", dateLabel(a) === "5-го раз в квартал · 18:00", dateLabel(a));
a.repeat = { every: "year", day: 12, month: 2, history: [] };
T.ok("каждый год", dateLabel(a) === "12 марта каждый год · 18:00", dateLabel(a));
a.repeat = { every: "week", days: [2], history: [] };
T.ok("по дням недели", /^по /.test(dateLabel(a)), dateLabel(a));

T.head("В КАЛЕНДАРЕ СТОИТ НА СВОИХ ДАТАХ");
a.repeat = { every: "year", day: 12, month: 2, history: [] };
a.spheres = ["Семья"]; S.hereNow = null;
T.ok("12 марта — есть", calItems("2027-03-12").indexOf(a) >= 0);
T.ok("13 марта — нет", calItems("2027-03-13").indexOf(a) < 0);

T.head("ФОРМА: ЧЕТЫРЕ КНОПКИ И СВОИ ПОЛЯ");
openItem(a.id); clickOn({ act: "edit", id: a.id });
var h = host.innerHTML.replace(/\s+/g, " ");
T.ok("четыре вида повтора", (h.match(/data-act="rmode"/g) || []).length === 4,
  String((h.match(/data-act="rmode"/g) || []).length));
T.ok("у года — день и месяц",
  h.indexOf('data-k="rnum:') >= 0 && h.indexOf('data-k="rmon:') >= 0);
T.ok("дней недели у года нет", h.indexOf('data-act="rday"') < 0);
clickOn({ act: "rmode", id: a.id, v: "month" });
h = host.innerHTML.replace(/\s+/g, " ");
T.ok("у месяца — только число",
  h.indexOf('data-k="rnum:') >= 0 && h.indexOf('data-k="rmon:') < 0);
T.ok("число сохраняется", (function () {
  clickOn({ act: "rdate", f: "day", id: a.id, v: "17" });
  return a.repeat.day === 17 && a.repeat.every === "month"; })());
clickOn({ act: "rmode", id: a.id, v: "week" });
T.ok("у недели — плитки дней",
  host.innerHTML.indexOf('data-act="rday"') >= 0);
clickOn({ act: "ecancel", id: a.id }); closeModal();
T.reset();

T.done();
