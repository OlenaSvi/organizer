/* Третье состояние дела: не трогали · в работе · сделано. «В работе»
   не значит «сделано» нигде — оно значит «я этим занимаюсь». */
T.seed();
T.reset();
var w = T.tasks()[0];

T.head("КНОПКА ЕСТЬ У ДЕЛА И БОЛЬШЕ НИ У КОГО");
openItem(w.id);
T.ok("у дела есть «Взяться»",
  /data-act="work"[^>]*>Взяться</.test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("выглядит как «Сделать сегодня» — залитой",
  /class="btn primary"[^>]*data-act="work"/.test(host.innerHTML.replace(/\s+/g, " ")));
closeModal();
[T.routine(), T.appt(), live().find(isIdea)].forEach(function (x) {
  openItem(x.id);
  T.ok(typeDef(x.type).name + ": кнопки нет", host.innerHTML.indexOf('data-act="work"') < 0);
  closeModal();
});

T.head("НАЖАЛИ — КНОПКА ПЕРЕВЕРНУЛАСЬ");
openItem(w.id);
clickOn({ act: "work", id: w.id });
T.ok("признак поставлен", w.working === true);
T.ok("подпись стала обратной",
  /data-act="work"[^>]*>Отложить</.test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("и вид тоже — простой ссылкой",
  /class="btn link"[^>]*data-act="work"/.test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "work", id: w.id });
T.ok("повторное нажатие снимает", !w.working);
clickOn({ act: "work", id: w.id });
closeModal();

T.head("КРУЖОК У НАЗВАНИЯ");
addToToday(w);
TAB = "today"; render();
T.ok("виден в дне", /class="wdot"/.test(T.card(w.id)));
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; ALLPERIOD = "all"; render();
T.ok("виден в списке", /class="wdot"/.test(document.getElementById("allList").innerHTML));
TAB = "matrix"; render();
T.ok("виден в матрице", /class="wdot"/.test(view.innerHTML));
w.working = false;
TAB = "today"; render();
T.ok("без признака кружка нет", !/class="wdot"/.test(view.innerHTML));

T.head("ЗАВТРА ВОЗВРАЩАЕТСЯ БЕЗ УПРЁКА");
T.reset();
w = T.tasks()[0];
w.due = null; w.forceImp = true; w.today = addDays(today(), -1);
render();
var why = function () {
  var s2 = todayItems().proposals.find(function (x) { return x.it === w; });
  return s2 ? s2.why : null;
};
T.ok("нетронутое возвращается с «не успели»", /не успели/.test(why() || ""), String(why()));
w.working = true;
render();
T.ok("дело в работе возвращается молча", why() === "", String(why()));
T.ok("но возвращается", todayItems().proposals.some(function (x) { return x.it === w; }));

T.head("«В РАБОТЕ» — НЕ «СДЕЛАНО»");
T.reset();
w = T.tasks()[0]; w.working = true; addToToday(w);
render();
T.ok("в счёт сделанного не идёт",
  /сделано 0 из/.test(T.visible(view.innerHTML)), T.visible(view.innerHTML).slice(0, 80));
T.ok("в архиве его нет", (function () {
  TAB = "all"; ALLFILTER = "done"; render();
  return document.getElementById("allList").innerHTML.indexOf(esc(w.title)) < 0; })());
ALLFILTER = "all"; TAB = "today"; render();
clickOn({ act: "toggle", id: w.id });
T.ok("галочка по-прежнему закрывает дело", w.done === true);
T.ok("и признак работы ему больше не нужен", !/class="wdot"/.test(view.innerHTML));
clickOn({ act: "undo", id: w.id });
T.reset();

T.done();
