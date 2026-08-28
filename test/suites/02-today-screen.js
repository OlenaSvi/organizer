/* Экран «Сегодня»: три области, счётчик, шаги, празднование. */
T.seed();
var t = T.tasks(), ap = T.appt();
ap.due = today(); ap.time = "16:00";
addToToday(t[0]); addToToday(t[1]);
render();
var h = view.innerHTML;

T.head("ТРИ ОБЛАСТИ");
T.ok("две колонки", (h.match(/class="tcol/g) || []).length === 2);
var L = h.indexOf('<div class="tcol">'), Rc = h.indexOf('<div class="tcol side">');
T.ok("слева дела и предложения",
  h.slice(L, Rc).indexOf(">Дела</h2>") >= 0 && h.slice(L, Rc).indexOf("Предлагаю") >= 0);
T.ok("справа рутина и аппоинтменты",
  h.slice(Rc).indexOf(">Рутина</h3>") >= 0 && h.slice(Rc).indexOf(">Аппоинтменты</h3>") >= 0);
T.ok("встреча только справа",
  h.slice(Rc).indexOf(esc(ap.title)) >= 0 && h.slice(L, Rc).indexOf(esc(ap.title)) < 0);

T.head("СЧЁТЧИК ДНЯ");
T.ok("«сделано 0 из 2»", h.indexOf("сделано 0 из 2") >= 0);
var seg = /<span class="capseg">([\s\S]*?)<\/span>/.exec(h)[1];
T.ok("полосок по лимиту", (seg.match(/<i /g) || []).length === S.cfg.todayCap);
clickOn({ act: "toggle", id: t[0].id });
render();
T.ok("сделали — счёт растёт, а не падает",
  view.innerHTML.indexOf("сделано 1 из 2") >= 0);
T.ok("зачёркнутое стоит под карточками", (function () {
  var v = view.innerHTML;
  return v.indexOf("donebox") > v.indexOf('class="card ') &&
         v.indexOf("donebox") < v.indexOf("suggbox"); })());

T.head("ПРАЗДНОВАНИЕ");
T.ok("появилось после галочки",
  document.getElementById("cheerHost").innerHTML.indexOf('class="cheer"') >= 0);
clickOn({ act: "cheerhide" });
T.ok("клик убирает", document.getElementById("cheerHost").innerHTML === "");
clickOn({ act: "toggle", id: t[0].id });   // снимаем галочку
T.ok("при отмене не празднуем",
  document.getElementById("cheerHost").innerHTML === "");

T.head("МНОГОЭТАПНОЕ ДЕЛО");
T.reset();
var m = live().find(function (i) { return i.multi && i.steps.length > 1 && !isRoutine(i); });
m.steps.forEach(function (s, k) { s.done = (k < 1); });
addToToday(m); render();
var card = T.card(m.id);
var title = /<div class="title"[^>]*>([\s\S]*?)<\/div>/.exec(card)[1].replace(/<[^>]*>/g, "").trim();
T.ok("крупно — текст шага", title === esc(nextStep(m).text), "«" + title + "»");
T.ok("под ним «Шаг N из M» и название дела",
  card.indexOf("class=\"stepno\">Шаг 2 из") >= 0 && card.indexOf("в «" + esc(m.title) + "»") >= 0);

T.head("РУТИНА: ТОЧКИ НЕДЕЛИ");
T.reset();
var r = T.routine();
r.created = addDays(today(), -10);
var s0 = startOfWeek(today());
r.routine.days = [0, 1, 3, 4, 5, 6];          // без вторника
r.routine.history = [addDays(s0, 2)];         // среда недели
render();
var seg2 = /class="rdots"[\s\S]*?<\/div>/.exec(view.innerHTML)[0];
T.ok("всегда 7 точек", (seg2.match(/<i /g) || []).length === 7);
T.ok("день вне расписания — бледный", (seg2.match(/offday/g) || []).length === 1);
T.ok("сделанный день — синий", (seg2.match(/class="on/g) || []).length === 1);
T.reset();

T.done();
