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

T.done();
