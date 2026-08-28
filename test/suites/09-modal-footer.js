/* Ряд кнопок внизу окна закреплён: при прокрутке длинного окна он
   остаётся на виду. Класс modalfoot — единый признак такого ряда. */
T.seed();

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
