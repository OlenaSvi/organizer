/* Фильтр периода в «Списке»: за неделю, за месяц, за всё время. */
T.seed();
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; ALLSORT = "due"; ALLPERIOD = "all";

var t = T.tasks();
t[0].created = today();                    // записано сегодня
t[1].created = addDays(today(), -3);       // на этой неделе
t[2].created = addDays(today(), -20);      // в этом месяце
t[3].created = addDays(today(), -90);      // давно
render();

function shown() {
  var out = [], m, re = /class="suggname"[^>]*>([^<]+)</g;
  var h = document.getElementById("allList").innerHTML;
  while ((m = re.exec(h))) out.push(m[1].trim());
  return out;
}

T.head("ПО УМОЛЧАНИЮ — ЗА ВСЁ ВРЕМЯ");
T.ok("период не сужен", ALLPERIOD === "all");
T.ok("давнее дело видно", shown().indexOf(t[3].title) >= 0);

T.head("ЗА НЕДЕЛЮ");
clickOn({ act: "dd", k: "allperiod" });
T.ok("панель открылась", view.innerHTML.indexOf("за месяц") >= 0);
clickOn({ act: "allperiodset", v: "week" });
var w = shown();
T.ok("сегодняшнее видно", w.indexOf(t[0].title) >= 0);
T.ok("трёхдневной давности видно", w.indexOf(t[1].title) >= 0);
T.ok("20 дней назад скрыто", w.indexOf(t[2].title) < 0);
T.ok("90 дней назад скрыто", w.indexOf(t[3].title) < 0);

T.head("ЗА МЕСЯЦ");
clickOn({ act: "dd", k: "allperiod" });
clickOn({ act: "allperiodset", v: "month" });
var mo = shown();
T.ok("20 дней назад видно", mo.indexOf(t[2].title) >= 0);
T.ok("90 дней назад по-прежнему скрыто", mo.indexOf(t[3].title) < 0);

T.head("В АРХИВЕ ПЕРИОД СЧИТАЕТСЯ ПО ДАТЕ ВЫПОЛНЕНИЯ");
t[0].done = true; t[0].doneAt = today();
t[1].done = true; t[1].doneAt = addDays(today(), -40);   // сделано давно
clickOn({ act: "dd", k: "allfilter" });
clickOn({ act: "allfilterset", v: "done" });
clickOn({ act: "dd", k: "allperiod" });
clickOn({ act: "allperiodset", v: "week" });
var box = document.getElementById("allList").innerHTML;
T.ok("сделанное сегодня видно", box.indexOf(esc(t[0].title)) >= 0);
T.ok("сделанное 40 дней назад скрыто", box.indexOf(esc(t[1].title)) < 0);
clickOn({ act: "dd", k: "allperiod" });
clickOn({ act: "allperiodset", v: "all" });
box = document.getElementById("allList").innerHTML;
T.ok("за всё время — видно и старое", box.indexOf(esc(t[1].title)) >= 0);

T.head("ПЕРИОД ЗАПОМИНАЕТСЯ");
clickOn({ act: "dd", k: "allperiod" });
clickOn({ act: "allperiodset", v: "month" });
T.ok("сохранён вместе с остальным видом",
  JSON.parse(localStorage.getItem("organizer.view")).allPeriod === "month");
ALLPERIOD = "all"; ALLFILTER = "all";
T.reset();

T.head("РУТИНА В «СДЕЛАННЫЕ» НЕ ПОПАДАЕТ");
/* Отмечается каждый день — за месяц это сотня записей, под которыми
   тонет всё настоящее. Её история и так видна в самой рутине:
   недельные точки и карта четырёх недель. */
T.reset();
var r = T.routine();
r.routine.history = [today(), addDays(today(), -1), addDays(today(), -2)];
var task = T.tasks()[0];
task.done = true; task.doneAt = today();
var ap2 = T.appt();
ap2.repeat = { days: [0, 1, 2, 3, 4, 5, 6], history: [today()] };
ap2.due = null;
TAB = "all"; ALLFILTER = "done"; ALLPERIOD = "all"; ALLQUERY = ""; render();
var box2 = document.getElementById("allList").innerHTML;
T.ok("рутины в архиве нет", box2.indexOf(esc(r.title)) < 0);
T.ok("а сделанное дело — на месте", box2.indexOf(esc(task.title)) >= 0);
T.ok("и состоявшаяся встреча тоже", box2.indexOf(esc(ap2.title)) >= 0);
T.ok("счётчик рутину не считает",
  document.getElementById("allCount").textContent.indexOf("2 ") === 0,
  document.getElementById("allCount").textContent);

T.head("НО В СВОЁМ ДНЕ ОНА ПО-ПРЕЖНЕМУ ВИДНА");
/* Архив — это история. Панель дня — состояние сегодня, и отмеченная
   рутина обязана быть в ней видна, иначе галочка выглядит впустую. */
TAB = "today"; ALLFILTER = "all"; render();
T.ok("отмеченная рутина в панели дня", T.visible(view.innerHTML).indexOf(r.title) >= 0);
task.done = false; task.doneAt = null;
ap2.repeat = null;
T.reset();

T.head("РУТИНА В СПИСКЕ ОТМЕЧАЕТСЯ");
/* Кружок у рутины был нарисован, но ничего не делал: приглушённая
   заглушка без действия. Нажимаешь — ничего. Либо он работает, либо
   его быть не должно. */
T.reset();
var rr = T.routine();
rr.routine.days = [0, 1, 2, 3, 4, 5, 6];
rr.routine.history = [];
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; ALLPERIOD = "all"; render();
var row = document.getElementById("allList").innerHTML.replace(/\s+/g, " ");
T.ok("кружок у рутины — кнопка, а не заглушка",
  new RegExp('<button class="tick[^"]*" data-act="toggle" data-id="' + rr.id + '"').test(row),
  row.slice(row.indexOf(rr.id) - 160, row.indexOf(rr.id) + 40));
clickOn({ act: "toggle", id: rr.id });
T.ok("отметилась сегодняшним днём", rr.routine.history.indexOf(today()) >= 0);
render();
row = document.getElementById("allList").innerHTML.replace(/\s+/g, " ");
T.ok("и это видно в строке",
  new RegExp('class="tick on"[^>]*data-id="' + rr.id + '"').test(row));
clickOn({ act: "toggle", id: rr.id });
T.ok("повторное нажатие снимает", rr.routine.history.indexOf(today()) < 0);
T.reset();

T.done();
