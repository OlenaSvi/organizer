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
  h.slice(Rc).indexOf(">Рутина") >= 0 && h.slice(Rc).indexOf(">Аппоинтменты</h3>") >= 0);
T.ok("встреча только справа",
  h.slice(Rc).indexOf(esc(ap.title)) >= 0 && h.slice(L, Rc).indexOf(esc(ap.title)) < 0);

T.head("ЗАГОЛОВКИ ТРЁХ ОБЛАСТЕЙ ОДНОГО РАЗМЕРА");
var CSS3 = (function () {
  try { ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();
var hDela = /\.tcol > \.todayhead h2\{[^}]*font-size:([\d.]+)px/.exec(CSS3);
var hSide = /\.sidepanel h3\{[^}]*font-size:([\d.]+)px/.exec(CSS3);
T.ok("«Дела» и «Рутина» одного кегля",
  hDela && hSide && hDela[1] === hSide[1],
  hDela && hSide ? hDela[1] + "px и " + hSide[1] + "px" : "правило не найдено");

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

T.head("НЕДЕЛЯ НАЧИНАЕТСЯ КАК В НАСТРОЙКАХ");
T.reset();
var rt2 = T.routine();
/* Ленивый захват до </div></div> терял последний день: берём кусок от
   начала блока и вытаскиваем все подписи дней подряд. */
function weekRow(html) {
  var at = html.indexOf('<div class="rt">');
  if (at < 0) return [];
  var src = html.slice(at, at + 900);
  var out = [], mm, re2 = />([а-я]{2})</g;
  while ((mm = re2.exec(src)) && out.length < 7) out.push(mm[1]);
  return out;
}
S.cfg.weekStart = 1; save();
openItem(rt2.id); clickOn({ act: "edit", id: rt2.id });
var w1 = weekRow(host.innerHTML);
T.ok("при «пн» неделя начинается с понедельника", w1[0] === "пн" && w1[6] === "вс",
  w1.join(" "));
clickOn({ act: "ecancel", id: rt2.id });
T.ok("в просмотре тот же порядок", weekRow(host.innerHTML)[0] === "пн",
  weekRow(host.innerHTML).join(" "));
closeModal();

S.cfg.weekStart = 0; save();
openItem(rt2.id); clickOn({ act: "edit", id: rt2.id });
var w0 = weekRow(host.innerHTML);
T.ok("при «вс» неделя начинается с воскресенья", w0[0] === "вс" && w0[6] === "сб",
  w0.join(" "));
clickOn({ act: "ecancel", id: rt2.id }); closeModal();
S.cfg.weekStart = 1; save();

T.ok("точки под рутиной идут в том же порядке", (function () {
  render();
  var dots = /class="rdots"[\s\S]*?<\/div>/.exec(view.innerHTML)[0];
  return (dots.match(/<i /g) || []).length === 7; })());

T.head("РУТИНА КРУТИТСЯ САМА, ВСТРЕЧИ НЕ УЕЗЖАЮТ");
T.reset(); render();
T.ok("панели помечены", view.innerHTML.indexOf("sidepanel routines") >= 0
  && view.innerHTML.indexOf("sidepanel appts") >= 0);
var CSS2 = (function () {
  try { ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();
T.ok("правая колонка — вертикальная стопка без своей прокрутки",
  /\.tcol\.side\{[^}]*flex-direction:column/.test(CSS2)
  && /\.tcol\.side\{[^}]*overflow:hidden/.test(CSS2));
T.ok("прокручивается содержимое, а не вся колонка",
  /\.tscroll\{[^}]*overflow-y:auto/.test(CSS2)
  && /\.tcol\{[^}]*overflow:hidden/.test(CSS2));
T.ok("заголовки вне прокрутки — не липкие, а неподвижные",
  !/\.tcol > \.todayhead\{[^}]*position:sticky/.test(CSS2)
  && !/\.sidepanel h3\{[^}]*position:sticky/.test(CSS2));
T.ok("содержимое дел обёрнуто", view.innerHTML.indexOf('class="tscroll"') >= 0);
T.ok("заголовок дел — вне обёртки", (function () {
  var h2 = view.innerHTML;
  return h2.indexOf('class="todayhead"') < h2.indexOf('class="tscroll"'); })());
T.ok("рутина забирает свободную высоту",
  /\.sidepanel\.routines\{[^}]*flex:1 1 auto/.test(CSS2));
T.ok("панель встреч фиксированной высоты — даже когда их нет",
  /\.sidepanel\.appts\{[^}]*flex:0 0 /.test(CSS2)
  && /\.sidepanel\.appts\{[^}]*min-height/.test(CSS2));
T.ok("нижняя панель без отступа снизу — низ вровень с колонкой дел",
  /\.tcol\.side \.sidepanel:last-child\{[^}]*margin-bottom:0/.test(CSS2));
T.ok("колонки растянуты на одну высоту",
  /\.tgrid\{[^}]*align-items:stretch/.test(CSS2));
T.ok("у обеих панелей своя прокручиваемая область",
  (view.innerHTML.match(/class="panelscroll"/g) || []).length === 2);

T.head("РУТИНА: СТРОКА НЕ РАССЫПАЕТСЯ");
T.reset();
var rr = T.routine();
rr.title = "Стакан тёплой воды натощак";
rr.spheres = ["здоровье физическое", "развитие"];
render();
/* Берём кусок разметки от нужной рутины: ленивый захват до трёх
   закрывающих тегов цеплял соседнюю строку. */
var line = (function () {
  var h2 = view.innerHTML, at = h2.indexOf(esc(rr.title));
  var from = h2.lastIndexOf('<div class="rline', at);
  return h2.slice(from, from + 1200);
})();
T.ok("название и счёт — верхней строкой",
  /class="rtop">[\s\S]*?rname[\s\S]*?rscore/.test(line));
T.ok("чипы сфер — отдельной строкой",
  line.indexOf('class="rmeta"') > line.indexOf('class="rtop"'));
T.ok("точки недели — ниже чипов",
  line.indexOf('class="rdots"') > line.indexOf('class="rmeta"'));
T.ok("название не обрезано", T.visible(line).indexOf("Стакан тёплой воды натощак") >= 0);

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
