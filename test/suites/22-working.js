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

T.head("У ДЕЛА С ШАГАМИ КРУЖОК ТОЖЕ ВИДЕН");
/* В карточке дня такое дело показано ШАГОМ, а не названием — и кружок
   там сначала не рисовался вовсе. «В работе» это про дело целиком, а
   не про его название, поэтому кружок должен быть виден и здесь. */
T.reset();
var ms = live().find(function (i) { return i.multi && (i.steps || []).length; });
ms.working = true;
addToToday(ms);
TAB = "today"; render();
T.ok("карточка ведёт шагом", T.card(ms.id).indexOf("Шаг 1 из") >= 0
  || /Шаг \d+ из/.test(T.card(ms.id)), T.visible(T.card(ms.id)).slice(0, 90));
T.ok("и кружок на месте", /class="wdot"/.test(T.card(ms.id)));
ms.working = false;
render();
T.ok("без признака его нет", !/class="wdot"/.test(T.card(ms.id)));

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

T.head("ВЗЯЛИСЬ — ЗНАЧИТ СЕГОДНЯ");
/* «Взяться» — это «начинаю сейчас». Отдельно потом жать «Сделать
   сегодня» было бы лишним решением на пустом месте. */
T.reset();
var g = T.tasks()[0];
g.due = null;
openItem(g.id);
clickOn({ act: "work", id: g.id });
T.ok("дело встало в сегодня", pickedToday(g));
T.ok("и помечено работой", g.working === true);
T.ok("окно осталось открытым", host.innerHTML.indexOf(esc(g.title)) >= 0);

T.head("«ОТЛОЖИТЬ» ИЗ ДНЯ НЕ ВЫКИДЫВАЕТ");
/* Перестать работать над делом и убрать его из дня — разные решения. */
clickOn({ act: "work", id: g.id });
T.ok("признак снят", !g.working);
T.ok("а из дня не ушло", pickedToday(g));
closeModal();

T.head("«ВЗЯТЬСЯ» ОТМЕНЯЕТ ПРЕЖНЕЕ «НЕ СЕГОДНЯ»");
/* Дело, от которого сегодня отказались, спрятано и из дня, и из
   предложений — так задумано. Но «взяться» — это новое решение, и оно
   должно старое отменять, иначе дело просто исчезает: помечено
   работой, а нигде не видно. */
T.reset();
var sk = T.tasks()[0];
sk.due = null;
clickOn({ act: "skip", id: sk.id });
T.ok("после отказа его не видно нигде",
  todayItems().mine.indexOf(sk) < 0
  && !todayItems().proposals.some(function (x) { return x.it === sk; }));
openItem(sk.id);
clickOn({ act: "work", id: sk.id });
T.ok("взялись — отказ снят", !skippedToday(sk));
T.ok("и дело в дне", todayItems().mine.indexOf(sk) >= 0);
closeModal();

T.head("ТО ЖЕ У ДЕЛА СО СРОКОМ СЕГОДНЯ");
/* Такое дело стоит в дне по сроку, и «не сегодня» его оттуда уносит.
   «Взяться» обязано вернуть. */
T.reset();
var sd = T.tasks()[0];
sd.due = today();
render();
clickOn({ act: "unpick", id: sd.id });
T.ok("ушло из дня", todayItems().mine.indexOf(sd) < 0);
openItem(sd.id);
clickOn({ act: "work", id: sd.id });
T.ok("вернулось", todayItems().mine.indexOf(sd) >= 0);
T.ok("и помечено работой", sd.working === true);
closeModal();

T.head("ЛИМИТ ДЕЙСТВУЕТ ТОТ ЖЕ");
/* Взять дело в переполненный день «Взяться» не может тихо: спрашивает,
   что вытеснить, — ровно как «Сделать сегодня». */
T.reset();
S.cfg.todayCap = 2;
var few = T.tasks();
few.forEach(function (i) { i.due = null; });
addToToday(few[0]); addToToday(few[1]);
render();
openItem(few[2].id);
clickOn({ act: "work", id: few[2].id });
T.ok("признак всё равно поставлен", few[2].working === true);
T.ok("в день молча не влезло", !pickedToday(few[2]));
T.ok("спросили, что вытеснить",
  /Что уберём/.test(T.visible(host.innerHTML)),
  T.visible(host.innerHTML).slice(0, 140));
closeModal();
S.cfg.todayCap = 5;

T.head("ДЕЛО СО СРОКОМ СЕГОДНЯ УЖЕ В ДНЕ");
T.reset();
var d1 = T.tasks()[0];
d1.due = today();
openItem(d1.id);
clickOn({ act: "work", id: d1.id });
T.ok("взято не помечается — оно и так в дне", !d1.today);
T.ok("но признак работы стоит", d1.working === true);
closeModal();
T.reset();

T.done();
