/* Ряд кнопок внизу окна закреплён: при прокрутке длинного окна он
   остаётся на виду. Класс modalfoot — единый признак такого ряда. */
T.seed();

/* Стили собранного файла — чтобы проверять правила, а не только разметку. */
var BUILD_CSS = (function () {
  try {
    ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();

/* Всё, что идёт после начала футера. Резать по первому </div> нельзя:
   внутри футера есть распорка <div class="spacer">. */
function foot(html) {
  var at = html.indexOf('class="row modalfoot"');
  return at < 0 ? "" : html.slice(at);
}

T.head("ФУТЕР ЗАКРЕПЛЁН ВО ВСЕХ ОКНАХ");

clickOn({ act: "cap" });
var d = S.items.find(function (i) { return i.draft; });
T.ok("создание дела", host.innerHTML.indexOf('class="row modalfoot"') >= 0);
T.ok("  кнопки на месте", host.innerHTML.indexOf("capsave") >= 0
  && host.innerHTML.indexOf("capsavetake") >= 0);
clickOn({ act: "capcancel" });

var x = T.tasks()[0];
openItem(x.id);
T.ok("просмотр дела", host.innerHTML.indexOf('class="row modalfoot"') >= 0);
T.ok("  кнопки на месте", host.innerHTML.indexOf('data-act="edit"') >= 0);
clickOn({ act: "edit", id: x.id });
T.ok("редактирование", host.innerHTML.indexOf('class="row modalfoot"') >= 0);
T.ok("  кнопки на месте", host.innerHTML.indexOf('data-act="esave"') >= 0
  && host.innerHTML.indexOf('data-act="del"') >= 0);
clickOn({ act: "ecancel", id: x.id });
closeModal();

DIRPAGE = null; DIREDIT = null; openSettings();
T.ok("настройки", host.innerHTML.indexOf('class="row modalfoot"') >= 0);
T.ok("  «Применить изменения» именно в футере",
  foot(host.innerHTML).indexOf("cfgapply") >= 0);
T.ok("  кнопки данных НЕ в футере — они часть содержимого",
  foot(host.innerHTML).indexOf("exportdata") < 0);
clickOn({ act: "cfgcancel" });

T.head("ФУТЕР — РОВНО ОДИН НА ОКНО");
["cap"].forEach(function (a) { clickOn({ act: a }); });
T.ok("в создании один", (host.innerHTML.match(/row modalfoot/g) || []).length === 1);
clickOn({ act: "capcancel" });
openItem(x.id);
T.ok("в просмотре один", (host.innerHTML.match(/row modalfoot/g) || []).length === 1);
clickOn({ act: "edit", id: x.id });
T.ok("в редакторе один", (host.innerHTML.match(/row modalfoot/g) || []).length === 1);
clickOn({ act: "ecancel", id: x.id });
closeModal();
openSettings();
T.ok("в настройках один", (host.innerHTML.match(/row modalfoot/g) || []).length === 1);
clickOn({ act: "cfgcancel" });

T.head("РАСКЛАДКА ФУТЕРА");
openItem(x.id);
var f = foot(host.innerHTML);
T.ok("порядок: Редактировать → распорка → Сделать сегодня",
  f.indexOf('data-act="edit"') < f.indexOf('class="spacer"') &&
  f.indexOf('class="spacer"') < f.indexOf('data-act="pin"'));
T.ok("выравнивание держит только распорка, без авто-отступов",
  BUILD_CSS.indexOf(".modal .row.modalfoot .btn.link{margin:0}") >= 0);
closeModal();

T.head("ФУТЕР ВО ВСЮ ШИРИНУ ОКНА");
T.ok("правилу max-width:100% сделано исключение",
  /\.modal \.row\.modalfoot\{[^}]*max-width:none/.test(BUILD_CSS),
  "иначе футер уже содержимого и кнопка не доходит до края");

T.head("ЗАМЕТКА БЕЗ ЛИШНИХ ЛИНИЙ");
var n = T.tasks()[0];
n.notes = "проверочная заметка";
openItem(n.id);
T.ok("заметка не использует класс вариантов",
  host.innerHTML.indexOf('class="opt" style="white-space:pre-wrap"') < 0,
  "у .opt есть верхняя граница — она рисовала линию под заголовком");
T.ok("заметка на месте", host.innerHTML.indexOf("проверочная заметка") >= 0);
closeModal();
n.notes = "";

T.head("ПУСТАЯ ЗАМЕТКА НЕ ПОКАЗЫВАЕТСЯ");
var q = T.tasks()[1];
[["", "пустая строка"], ["   ", "одни пробелы"], ["\n\n", "переводы строк"]]
  .forEach(function (p2) {
    q.notes = p2[0];
    openItem(q.id);
    T.ok("не показана: " + p2[1], host.innerHTML.indexOf(">Заметка<") < 0
      && host.innerHTML.indexOf("readnote") < 0);
    closeModal();
  });
q.notes = "  настоящая заметка  ";
openItem(q.id);
T.ok("настоящая — показана", host.innerHTML.indexOf("настоящая заметка") >= 0);
closeModal();
q.notes = "";

T.head("ДЕЙСТВИЯ ИЗ ФУТЕРА РАБОТАЮТ");
clickOn({ act: "cap" });
var d2 = S.items.find(function (i) { return i.draft; });
d2.title = "Из футера";
clickOn({ act: "capsave" });
T.ok("сохранение из закреплённого футера",
  live().some(function (i) { return i.title === "Из футера"; }));
S.items = S.items.filter(function (i) { return i.title !== "Из футера"; });
openItem(x.id);
clickOn({ act: "pin", id: x.id });
T.ok("«Сделать сегодня» из футера", pickedToday(x));
closeModal();
T.reset();

T.done();
