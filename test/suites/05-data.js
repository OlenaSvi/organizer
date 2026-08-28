/* Данные: миграции, самопочинка, выгрузка-загрузка, настройки. */
T.seed();

T.head("САМОПОЧИНКА");
var idea = live().find(isIdea);
idea.due = today(); idea.time = "10:00";
render();
T.ok("у идеи стирается забытый срок", idea.due === null && idea.time === null);

var ap = T.appt();
ap.due = addDays(today(), -2); ap.done = false; delete ap.autoDone;
render();
T.ok("прошедшая встреча уходит в «состоялась»", ap.done === true);
T.ok("своим днём, не сегодняшним", ap.doneAt === addDays(today(), -2));
clickOn({ act: "undo", id: ap.id });
render(); render();
T.ok("вернули — не утаскивается обратно", ap.done === false);
ap.due = addDays(today(), 5); ap.done = false; ap.doneAt = null;

T.head("ВЫГРУЗКА И ЗАГРУЗКА");
var payload = exportPayload();
var back = JSON.parse(payload);
T.ok("все записи в файле", back.items.length === S.items.length);
T.ok("настройки и справочники в файле",
  back.cfg && Array.isArray(back.spheres) && Array.isArray(back.types));
T.ok("мусор отвергается", !!applyImport("это не json").error);
T.ok("чужой json отвергается", !!applyImport('{"привет":1}').error);
T.ok("свой файл принимается", !applyImport(payload).error);

T.head("НАСТРОЙКИ");
DIRPAGE = null; DIREDIT = null; openSettings();
var h = host.innerHTML;
T.ok("четыре справочника строками", ["sphere", "place", "person", "type"]
  .every(function (k) { return h.indexOf('data-p="' + k + '"') >= 0; }));
T.ok("«Применить изменения» в самом низу",
  h.indexOf("cfgapply") > h.indexOf("Загрузить из файла"));
T.ok("темы только две", h.indexOf("как в системе") < 0
  && h.indexOf(">светлая<") >= 0 && h.indexOf(">тёмная<") >= 0);
clickOn({ act: "diropen", p: "sphere" });
T.ok("второй уровень открылся", host.innerHTML.indexOf("‹ Настройки") >= 0);
clickOn({ act: "diredit", v: "Быт" });
T.ok("правка в строке", host.innerHTML.indexOf('id="dirName"') >= 0);
document.getElementById("dirName").value = "Дом";
clickOn({ act: "sphren", v: "Быт" });
T.ok("переименование переносит метки на делах",
  S.spheres.indexOf("Дом") >= 0 && live().some(function (i) {
    return (i.spheres || []).indexOf("Дом") >= 0; }));
DIREDIT = "Дом"; openSettings();
document.getElementById("dirName").value = "Быт";
clickOn({ act: "sphren", v: "Дом" });
T.ok("вернули имя обратно", S.spheres.indexOf("Быт") >= 0);
clickOn({ act: "dirback" });
T.ok("возврат на первый уровень", DIRPAGE === null);
clickOn({ act: "cfgcancel" });

T.head("СОСТОЯНИЕ ВИДА ПЕРЕЖИВАЕТ ПЕРЕЗАГРУЗКУ");
TAB = "matrix"; AXIS = "place"; CALMODE = "month"; ALLFILTER = "idea"; render();
var v = JSON.parse(localStorage.getItem("organizer.view"));
T.ok("вкладка, ось, режим и срез сохранены",
  v.tab === "matrix" && v.axis === "place" && v.calMode === "month" && v.allFilter === "idea");
T.ok("дата календаря НЕ сохраняется", !("calAnchor" in v));
T.reset();

T.done();
