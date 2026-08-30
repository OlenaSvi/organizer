/* Рутина: сколько занимает, в какую часть дня — и как это видно
   в панели дня и в окне рутины. Плюс карта четырёх недель. */
T.seed();
var routs = live().filter(isRoutine);
var r = routs[0], r2 = routs[1];

T.head("ПОЛЯ ЕСТЬ ТОЛЬКО У РУТИНЫ");
openItem(r.id); clickOn({ act: "edit", id: r.id });
var h = host.innerHTML;
T.ok("«Часть дня» в форме рутины", h.indexOf("Часть дня") >= 0);
T.ok("«Сколько занимает» в форме рутины", h.indexOf("Сколько занимает") >= 0);
clickOn({ act: "ecancel", id: r.id }); closeModal();
var t0 = T.tasks()[0];
openItem(t0.id); clickOn({ act: "edit", id: t0.id });
T.ok("у обычного дела этих полей нет",
  host.innerHTML.indexOf("Сколько занимает") < 0 && host.innerHTML.indexOf("Часть дня") < 0);
clickOn({ act: "ecancel", id: t0.id }); closeModal();

T.head("ВЫБОР СОХРАНЯЕТСЯ");
openItem(r.id); clickOn({ act: "edit", id: r.id });
T.ok("часть дня набрана теми же плитками, что и дни недели",
  /<div class="rt">[\s\S]{0,400}data-act="rpart"/.test(host.innerHTML));
clickOn({ act: "rpart", id: r.id, v: "morning" });
T.ok("часть дня записалась", r.partOfDay === "morning");
T.ok("выбранная плитка подсвечена так же, как день недели",
  /<div class="hit"[^>]*data-act="rpart"[^>]*data-v="morning"/
    .test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "rpart", id: r.id, v: "morning" });
T.ok("повторное нажатие снимает выбор — это и есть «не важно»", !r.partOfDay);
T.ok("отдельной кнопки «не важно» больше нет", host.innerHTML.indexOf("не важно") < 0
  || host.innerHTML.indexOf('data-f="partOfDay"') < 0);
clickOn({ act: "rpart", id: r.id, v: "morning" });
clickOn({ act: "dd", k: "mins:" + r.id });
T.ok("список минут открылся", host.innerHTML.indexOf('data-f="mins"') >= 0);
/* Самая короткая рутина — тоже рутина: «выпить таблетку» занимает минуту. */
T.ok("одна минута есть в списке",
  /data-f="mins"[^>]*data-v="1"[^>]*>\s*<span>1 мин<\/span>/
    .test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "ddset", f: "mins", id: r.id, v: "10" });
T.ok("минуты записались числом, а не строкой", r.mins === 10);
clickOn({ act: "esave", id: r.id }); closeModal();

T.head("ПАНЕЛЬ ДНЯ: ГРУППЫ ПО ЧАСТЯМ ДНЯ");
r.partOfDay = "morning"; r.mins = 10;
r2.partOfDay = "evening"; r2.mins = 20;
TAB = "today"; render();
var p = view.innerHTML;
T.ok("группы появились", p.indexOf('class="rgroup"') >= 0);
T.ok("утро идёт раньше вечера",
  p.indexOf("Утро") >= 0 && p.indexOf("Вечер") > p.indexOf("Утро"));
T.ok("у каждой группы своя сумма", p.indexOf("10 мин") >= 0 && p.indexOf("20 мин") >= 0);
T.ok("общее время — в шапке панели", /Рутина[\s\S]{0,120}30 мин/.test(p));

T.head("СДЕЛАННОЕ ИЗ СУММЫ УХОДИТ");
clickOn({ act: "toggle", id: r.id });
p = view.innerHTML;
T.ok("группы «Утро» больше нет", p.indexOf(">Утро<") < 0);
T.ok("общее время уменьшилось", /Рутина[\s\S]{0,120}20 мин/.test(p));
clickOn({ act: "toggle", id: r.id });

T.head("БЕЗ ЧАСТЕЙ ДНЯ — ПЛОСКИЙ СПИСОК, КАК РАНЬШЕ");
r.partOfDay = null; r2.partOfDay = null; render();
T.ok("заголовков групп нет", view.innerHTML.indexOf('class="rgroup"') < 0);
T.ok("а рутины на месте", T.visible(view.innerHTML).indexOf(r.title) >= 0);
T.ok("в строке видно, сколько занимает", view.innerHTML.indexOf("10 мин") >= 0);

T.head("ОКНО РУТИНЫ");
r.partOfDay = "morning";
openItem(r.id);
var vis = T.visible(host.innerHTML);
T.ok("видно часть дня", vis.indexOf("Утро") >= 0);
T.ok("видно длительность", vis.indexOf("10 мин") >= 0);

T.head("КАРТА ЧЕТЫРЁХ НЕДЕЛЬ");
T.ok("карта есть", host.innerHTML.indexOf('class="heat"') >= 0);
T.ok("в ней 28 клеток",
  (host.innerHTML.match(/class="hc[ "]/g) || []).length === 28,
  String((host.innerHTML.match(/class="hc[ "]/g) || []).length));
closeModal();

T.head("ДОЛЯ СЧИТАЕТСЯ ЧЕСТНО");
r.created = addDays(today(), -60);
r.routine.days = [0, 1, 2, 3, 4, 5, 6];
r.routine.history = [];
for (var k = 0; k < 5; k++) r.routine.history.push(addDays(today(), -k));
openItem(r.id);
vis = T.visible(host.innerHTML);
var m = /За 4 недели: (\d+) из (\d+)/.exec(vis);
T.ok("строка за 4 недели есть", !!m, vis.slice(0, 200));
T.ok("сделанное посчитано", m && +m[1] === 5, m ? m[1] : "—");
T.ok("будущие дни в знаменатель не идут", m && +m[2] >= 21 && +m[2] <= 28, m ? m[2] : "—");
closeModal();

T.head("ДНИ ДО ПОЯВЛЕНИЯ РУТИНЫ НЕ СЧИТАЮТСЯ");
/* Иначе новая привычка сразу показывала бы провал за месяц, которого не было. */
r.created = addDays(today(), -2);
r.routine.history = [today()];
openItem(r.id);
m = /За 4 недели: (\d+) из (\d+)/.exec(T.visible(host.innerHTML));
T.ok("знаменатель — только прожитые дни", m && +m[2] === 3, m ? m[2] : "—");
closeModal();

T.head("СВЕРХ РАСПИСАНИЯ — ЭТО ПЛЮС, А НЕ МИНУС");
r.created = addDays(today(), -60);
r.routine.days = [new Date(today() + "T12:00:00").getDay()];
r.routine.history = [today(), addDays(today(), -1)];
openItem(r.id);
vis = T.visible(host.innerHTML);
T.ok("названо отдельно", vis.indexOf("сверх расписания") >= 0, vis.slice(0, 220));
m = /За 4 недели: (\d+) из (\d+)/.exec(vis);
T.ok("долю не портит", m && +m[1] === 1 && +m[2] === 4, m ? m[1] + "/" + m[2] : "—");
closeModal();
T.reset();

T.done();
