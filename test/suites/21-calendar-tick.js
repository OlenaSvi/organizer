/* Галочка в календаре должна отмечать ТОТ день, в клетке которого она
   стоит. Для повторяющейся записи это единственный осмысленный
   вариант: у неё нет одной даты, у неё их много. */
T.seed();
T.reset();
var a = T.appt();
a.due = null; a.time = "18:00"; a.created = addDays(today(), -60);
var wd = new Date(today() + "T12:00:00").getDay();
a.repeat = { every: "week", days: [wd], history: [] };
var past = addDays(today(), -7), future = addDays(today(), 7);
TAB = "calendar"; CALMODE = "month"; CALANCHOR = past; render();

function rowOf(iso, id) {
  var h = view.innerHTML.replace(/\s+/g, " ");
  var at = h.indexOf('data-d="' + iso + '" data-id="' + id + '"');
  if (at < 0) at = h.indexOf('data-id="' + id + '" data-d="' + iso + '"');
  return at < 0 ? "" : h.slice(Math.max(0, at - 220), at + 220);
}

T.head("ГАЛОЧКА ЗНАЕТ СВОЙ ДЕНЬ");
T.ok("у прошлой встречи галочка помнит дату", rowOf(past, a.id).length > 0,
  "нет кнопки с датой " + past);
clickOn({ act: "toggleon", id: a.id, d: past });
T.ok("отметился именно тот день", (a.repeat.history || []).indexOf(past) >= 0,
  (a.repeat.history || []).join(" · "));
T.ok("а сегодня — нет", (a.repeat.history || []).indexOf(today()) < 0);
render();
T.ok("в клетке видно, что состоялась", /class="calrow done"/.test(view.innerHTML));
clickOn({ act: "toggleon", id: a.id, d: past });
T.ok("повторное нажатие снимает", (a.repeat.history || []).indexOf(past) < 0);

T.head("БУДУЩЕЕ НЕ ОТМЕЧАЕТСЯ");
/* «Состоялась» про завтрашнюю встречу — бессмыслица. */
CALANCHOR = future; render();
T.ok("у будущей встречи галочки нет", rowOf(future, a.id).indexOf("caltick") < 0,
  rowOf(future, a.id).slice(0, 160));

T.head("У ОБЫЧНОЙ ЗАПИСИ ВСЁ ПО-ПРЕЖНЕМУ");
T.reset();
var t0 = T.tasks()[0];
t0.due = today();
CALMODE = "month"; CALANCHOR = today(); render();
T.ok("галочка на месте", view.innerHTML.indexOf('data-act="toggle" data-id="' + t0.id + '"') >= 0);
clickOn({ act: "toggle", id: t0.id });
T.ok("дело закрылось", t0.done === true);
clickOn({ act: "toggle", id: t0.id });
CALANCHOR = null;
T.reset();

T.head("ГАЛОЧКА СИДИТ В СВОЁМ КРУЖКЕ");
/* «Птичка» рисуется абсолютным псевдоэлементом — кружок обязан быть
   position:relative, иначе она уезжает к ближайшему позиционированному
   предку, то есть под всю строку календаря. Браузера в проверках нет,
   поэтому смотрим прямо в CSS.                                      */
T.ok("у кружка календаря есть position:relative", (function () {
  try { ObjC.import("Foundation");
    var css = $.NSString.stringWithContentsOfFileEncodingError("Организатор.html", 4, null).js;
    var m = /\.caltick\{[^}]*\}/.exec(css.replace(/\s+/g, ""));
    return !!m && m[0].indexOf("position:relative") >= 0;
  } catch (e) { return false; }
})());

T.done();
