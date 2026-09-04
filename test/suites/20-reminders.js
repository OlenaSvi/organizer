/* Напоминание — не дело: его не делают, про него помнят. Появляется в
   свой день, ничего не требует, в счёт дня не идёт. */
T.seed();
var rk = S.types.find(function (t) { return t.kind === "remind"; });
T.head("ВИД ЕСТЬ И ОН ПЯТЫЙ");
T.ok("вид «напоминание» заведён", !!rk, S.types.map(function (t) { return t.name; }).join(" · "));
/* Набор проверок сам заводит недостающие виды, поэтому считаем не все,
   а стандартные пять. */
T.ok("стандартных видов пять",
  ["plain", "routine", "appt", "idea", "remind"].every(function (k) {
    return S.types.some(function (t) { return t.kind === k; }); }),
  S.types.map(function (t) { return t.name; }).join(" · "));

T.reset();
var r = T.tasks()[0];
r.type = rk.key; r.due = today(); r.time = "10:00"; r.forceImp = true;
normalizeItems();

T.head("НИЧЕГО НЕ ТРЕБУЕТ");
T.ok("времени у напоминания нет — оно про день", r.time === null);
TAB = "today"; render();
var day = todayItems();
T.ok("в предложения не идёт",
  !day.proposals.some(function (s) { return s.it === r; }));
T.ok("в счёт дня не идёт", day.dueCount === 0 && day.chosenCount === 0,
  day.dueCount + " по сроку, " + day.chosenCount + " взято");
T.ok("в матрицу не идёт", (function () {
  TAB = "matrix"; render();
  return view.innerHTML.indexOf(esc(r.title)) < 0; })());

T.head("НО В СВОЙ ДЕНЬ ВИДНО");
TAB = "today"; render();
var panel = /class="apptbox"[\s\S]*?<\/div><\/div>/.exec(view.innerHTML);
T.ok("стоит в панели событий", T.visible(panel[0]).indexOf(r.title) >= 0);
T.ok("панель названа событиями, а не встречами",
  view.innerHTML.indexOf(">События дня</h3>") >= 0);
T.ok("в календаре тоже", calItems(today()).indexOf(r) >= 0);
r.due = addDays(today(), 1); render();
panel = /class="apptbox"[\s\S]*?<\/div><\/div>/.exec(view.innerHTML);
T.ok("в чужой день не висит", T.visible(panel[0]).indexOf(r.title) < 0);
r.due = today();

T.head("ОТМЕТИЛИ — ЗНАЧИТ БЫЛО");
render();
clickOn({ act: "toggle", id: r.id });
T.ok("отмечено", r.done === true);
T.ok("осталось на месте зачёркнутым", /class="aline done"/.test(view.innerHTML));
clickOn({ act: "toggle", id: r.id });

T.head("ПОВТОР ПО ГОДАМ РАБОТАЕТ И У НЕГО");
r.due = null;
r.repeat = { every: "year", day: 26, month: 8, history: [] };
normalizeItems();
T.ok("расписание пережило самопочинку", !!r.repeat && r.repeat.every === "year");
T.ok("26 сентября — да", repeatOn(r, "2027-09-26"));
T.ok("27 сентября — нет", !repeatOn(r, "2027-09-27"));
T.ok("в календаре на своей дате", calItems("2027-09-26").indexOf(r) >= 0);
T.ok("словами", /26 сентября каждый год/.test(dateLabel(r)), dateLabel(r));

T.head("ФОРМА: РАСПИСАНИЕ ЕСТЬ, ВРЕМЕНИ НЕТ");
openItem(r.id); clickOn({ act: "edit", id: r.id });
var h = host.innerHTML;
T.ok("выбор «одна дата / по расписанию» есть", h.indexOf('data-act="arepeat"') >= 0);
T.ok("четыре вида повтора", (h.match(/data-act="rmode"/g) || []).length === 4);
T.ok("поля времени нет", h.indexOf("<p class=\"lbl\">Время</p>") < 0);
T.ok("важности нет — напоминание не делают", h.indexOf("Важность") < 0);
clickOn({ act: "ecancel", id: r.id }); closeModal();
T.reset();

T.done();
