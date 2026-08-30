/* Встреча по расписанию: сессия у психолога дважды в неделю. Повторяется
   бессрочно, отмечается по дню и никогда не закрывается навсегда. */
T.seed();
var a = T.appt();
var WD = new Date(today() + "T12:00:00").getDay();
var OTHER = (WD + 3) % 7;

T.head("ПЕРЕКЛЮЧАТЕЛЬ ЕСТЬ ТОЛЬКО У ВСТРЕЧИ");
openItem(a.id); clickOn({ act: "edit", id: a.id });
var h = host.innerHTML;
T.ok("выбор «одна дата / по расписанию»",
  h.indexOf('data-act="arepeat"') >= 0 && h.indexOf("По расписанию") >= 0);
T.ok("по умолчанию — одна дата", !repeats(a));
var t0 = T.tasks()[0];
clickOn({ act: "ecancel", id: a.id }); closeModal();
openItem(t0.id); clickOn({ act: "edit", id: t0.id });
T.ok("у обычного дела такого выбора нет",
  host.innerHTML.indexOf('data-act="arepeat"') < 0);
clickOn({ act: "ecancel", id: t0.id }); closeModal();

T.head("ПЕРЕХОД НА РАСПИСАНИЕ");
openItem(a.id); clickOn({ act: "edit", id: a.id });
clickOn({ act: "arepeat", id: a.id, v: "days" });
T.ok("расписание завелось", !!a.repeat && !a.repeat.days.length);
T.ok("подсвечена ровно одна кнопка",
  (host.innerHTML.match(/data-act="arepeat"[^>]*class="on"/g) || []).length === 1,
  String((host.innerHTML.match(/data-act="arepeat"[^>]*class="on"/g) || []).length));
T.ok("и это «По расписанию»",
  /data-v="days"[^>]*class="on"/.test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("одной даты больше нет", a.due === null);
T.ok("появились плитки дней", host.innerHTML.indexOf('data-act="rday"') >= 0);
T.ok("у времени своя ячейка сетки, рядом с днями",
  /class="cfgitem"[^>]*>\s*<p class="lbl">Время<\/p>/.test(host.innerHTML));
T.ok("родного поля времени больше нет", host.innerHTML.indexOf('type="time"') < 0);
T.ok("время набирается такими же кнопками, что и всё остальное",
  (host.innerHTML.match(/data-act="dd" data-k="t[hm]:/g) || []).length === 2);
T.ok("и у переключателя своя",
  /class="cfgitem"[^>]*>\s*<p class="lbl">Когда<\/p>/.test(host.innerHTML));
clickOn({ act: "rday", id: a.id, i: String(WD) });
clickOn({ act: "rday", id: a.id, i: String(OTHER) });
T.ok("два дня выбраны", a.repeat.days.length === 2);
a.time = "18:00";
clickOn({ act: "esave", id: a.id }); closeModal();

T.head("СТОИТ В СВОЙ ДЕНЬ");
TAB = "today"; render();
T.ok("сегодня встреча в панели", T.visible(view.innerHTML).indexOf(a.title) >= 0);
T.ok("и со временем", view.innerHTML.indexOf("18:00") >= 0);
a.repeat.days = [OTHER];
render();
T.ok("в чужой день её нет", T.visible(view.innerHTML).indexOf(a.title) < 0);
a.repeat.days = [WD, OTHER];

T.head("В КАЛЕНДАРЕ — НА КАЖДОМ СВОЁМ ДНЕ");
T.ok("сегодня", calItems(today()).indexOf(a) >= 0);
T.ok("и через неделю тоже", calItems(addDays(today(), 7)).indexOf(a) >= 0);
T.ok("а в чужой день — нет", calItems(addDays(today(), 1)).indexOf(a) < 0
  || (WD + 1) % 7 === OTHER);
a.created = addDays(today(), -3);
T.ok("до появления встречи её в календаре нет",
  calItems(addDays(today(), -7)).indexOf(a) < 0);

T.head("ГАЛОЧКА ОТМЕЧАЕТ ДЕНЬ, А НЕ ЗАКРЫВАЕТ ЗАПИСЬ");
TAB = "today"; render();
clickOn({ act: "toggle", id: a.id });
T.ok("сегодня отмечено состоявшимся", repeatDone(a, today()));
T.ok("сама встреча жива", !a.done && live().indexOf(a) >= 0);
clickOn({ act: "toggle", id: a.id });
T.ok("повторная галочка снимает отметку", !repeatDone(a, today()));
clickOn({ act: "toggle", id: a.id });

T.head("САМОПОЧИНКА ЕЁ НЕ АРХИВИРУЕТ");
normalizeItems();
T.ok("не ушла в архив", !a.done);
T.ok("и одной даты у неё не появилось", a.due === null);

T.head("КОГДА — СЛОВАМИ");
var lbl = dateLabel(a);
T.ok("расписание проговорено", /^по /.test(lbl) && lbl.indexOf("18:00") >= 0, lbl);
T.ok("названы оба дня", lbl.split(",").length === 2, lbl);

T.head("РАЗОВАЯ ВСТРЕЧА НЕ СЛОМАЛАСЬ");
openItem(a.id); clickOn({ act: "edit", id: a.id });
clickOn({ act: "arepeat", id: a.id, v: "once" });
T.ok("расписание убрано", !repeats(a));
T.ok("и снова подсвечена ровно одна кнопка",
  (host.innerHTML.match(/data-act="arepeat"[^>]*class="on"/g) || []).length === 1);
T.ok("и это «Одна дата»",
  /data-v="once"[^>]*class="on"/.test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("поле даты вернулось", host.innerHTML.indexOf("Дата и время") >= 0);
/* Дата, часы и минуты в одной строке. В половине ширины окна кнопка
   даты сжималась до одной буквы, а мини-календарь вылезал за край. */
T.ok("дате и времени отдана вся ширина строки",
  /grid-column:1\/-1[^>]*>\s*<p class="lbl">Дата и время/.test(host.innerHTML));
clickOn({ act: "ecancel", id: a.id }); closeModal();
T.reset();

T.head("ОКНО ВСТРЕЧИ ПО РАСПИСАНИЮ");
a.repeat.history = [today(), addDays(today(), -7)];
openItem(a.id);
var vis = T.visible(host.innerHTML);
T.ok("расписание в шапке словами", vis.indexOf("по ") >= 0 && vis.indexOf("18:00") >= 0);
T.ok("дни показаны плитками", host.innerHTML.indexOf('class="rt"') >= 0);
T.ok("видно, сколько раз состоялась", /Состоялась 2 раза/.test(vis), vis.slice(0, 260));
T.ok("и когда в последний раз", vis.indexOf("последний раз") >= 0);
closeModal();

T.head("ОТМЕЧЕННАЯ СЕГОДНЯ ВЫГЛЯДИТ ОТМЕЧЕННОЙ");
TAB = "today"; render();
T.ok("строка помечена сделанной", /class="aline done"/.test(view.innerHTML));
a.repeat.history = [addDays(today(), -7)];
render();
T.ok("а неотмеченная — нет", view.innerHTML.indexOf('class="aline done"') < 0);

T.head("ПРОШЕДШИЕ СЕССИИ ПОПАДАЮТ В АРХИВ");
TAB = "all"; ALLFILTER = "done"; ALLPERIOD = "all"; ALLQUERY = ""; render();
T.ok("сессия недельной давности видна",
  document.getElementById("allList").innerHTML.indexOf(esc(a.title)) >= 0);
T.ok("вернуть можно только сегодняшнюю",
  (document.getElementById("allList").innerHTML.match(/>вернуть</g) || []).length === 0);
ALLFILTER = "all";

T.head("ВРЕМЯ НАБИРАЕТСЯ ЧАСАМИ И МИНУТАМИ");
a.time = null;
openItem(a.id); clickOn({ act: "edit", id: a.id });
clickOn({ act: "dd", k: "th:" + a.id });
T.ok("список часов открылся", host.innerHTML.indexOf('data-f="h"') >= 0);
T.ok("часов ровно 24", (host.innerHTML.match(/data-f="h"/g) || []).length === 24);
clickOn({ act: "ttime", f: "h", id: a.id, v: "18" });
T.ok("час выбран, минуты ровные", a.time === "18:00");
clickOn({ act: "dd", k: "tm:" + a.id });
T.ok("минуты шагают по пять", (host.innerHTML.match(/data-f="m"/g) || []).length === 12);
clickOn({ act: "ttime", f: "m", id: a.id, v: "45" });
T.ok("минуты сменились, час остался", a.time === "18:45");
clickOn({ act: "dd", k: "th:" + a.id });
clickOn({ act: "ttime", f: "clear", id: a.id, v: "" });
T.ok("«без времени» очищает", a.time === null);
a.time = "18:00";
clickOn({ act: "esave", id: a.id }); closeModal();

T.done();
