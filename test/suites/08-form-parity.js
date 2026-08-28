/* Редактор и создание — одна и та же форма: те же секции, тот же
   порядок. Разница только в заполненности и в кнопках внизу. */
T.seed();

/* Список секций формы в порядке появления. */
function sections(html) {
  var out = [], m, re = /<p class="lbl"[^>]*>([^<]+)</g;
  while ((m = re.exec(html))) out.push(m[1].trim().replace(/\s+/g, " "));
  return out;
}

T.head("ОДИН И ТОТ ЖЕ ПОРЯДОК СЕКЦИЙ");
clickOn({ act: "cap" });
var d = S.items.find(function (i) { return i.draft; });
var capSections = sections(host.innerHTML);
T.note("создание: " + capSections.join(" · "));
clickOn({ act: "capcancel" });

var x = T.tasks()[0];
openItem(x.id); clickOn({ act: "edit", id: x.id });
var edSections = sections(host.innerHTML);
T.note("редактор: " + edSections.join(" · "));
T.ok("секции совпадают", capSections.join("|") === edSections.join("|"));

T.head("ПОЛЯ ЗАПОЛНЕНЫ ТЕКУЩИМИ ДАННЫМИ");
var h = host.innerHTML;
T.ok("название в поле", h.indexOf('value="' + esc(x.title) + '"') >= 0);
T.ok("вид дела выбран", h.indexOf(esc(typeName(x))) >= 0);
T.ok("сфера отмечена", new RegExp('chip on" data-act="esphere"[^>]*data-v="'
  + esc(x.spheres[0]) + '"').test(h.replace(/\s+/g, " ")));
T.ok("важность отмечена",
  /chip on"[^>]*data-act="equad"[^>]*data-q="imp"/.test(h.replace(/\s+/g, " ")));

T.head("ЗАМЕТКА И ШАГИ: СВЁРНУТЫ, ПОКА ПУСТЫ");
T.ok("у пустого дела — кнопки «＋»",
  h.indexOf("＋ заметка") >= 0 && h.indexOf("＋ шаги") >= 0);
clickOn({ act: "ecancel", id: x.id }); closeModal();

var m2 = live().find(function (i) { return i.multi && i.steps.length > 1; });
m2.notes = "уже есть заметка";
openItem(m2.id); clickOn({ act: "edit", id: m2.id });
h = host.innerHTML;
T.ok("заполненная заметка раскрыта сразу", h.indexOf("edNotes") >= 0);
T.ok("существующие шаги раскрыты сразу", h.indexOf('data-act="emulti"') >= 0);
clickOn({ act: "ecancel", id: m2.id }); closeModal();
m2.notes = "";

T.head("КНОПКИ РАЗНЫЕ — ЭТО НОРМАЛЬНО");
clickOn({ act: "cap" });
h = host.innerHTML;
T.ok("в создании: Добавить · добавить и взять · Отмена",
  h.indexOf("capsave") >= 0 && h.indexOf("capsavetake") >= 0 && h.indexOf(">Отмена<") >= 0);
T.ok("в создании нет «Удалить»", h.indexOf('data-act="del"') < 0);
clickOn({ act: "capcancel" });
openItem(x.id); clickOn({ act: "edit", id: x.id });
h = host.innerHTML;
T.ok("в редакторе: Удалить · Готово",
  h.indexOf('data-act="del"') >= 0 && h.indexOf('data-act="esave"') >= 0);

T.head("ПРАВКА И ОТКАТ РАБОТАЮТ");
clickOn({ act: "dd", k: "place:" + x.id });
clickOn({ act: "ddset", f: "place", id: x.id, v: "Израиль" });
T.ok("поле меняет дело", x.place === "Израиль");
clickOn({ act: "ecancel", id: x.id });
T.ok("крестик откатывает", x.place !== "Израиль");
T.ok("и возвращает в просмотр", host.innerHTML.indexOf("Редактировать") >= 0);
closeModal();

T.head("РУТИНА: ДНИ ВМЕСТО СРОКА В ОБОИХ ОКНАХ");
var r = T.routine();
openItem(r.id); clickOn({ act: "edit", id: r.id });
h = host.innerHTML;
T.ok("в редакторе рутины — расписание", h.indexOf("В какие дни") >= 0);
T.ok("и нет дедлайна", h.indexOf("Дедлайн") < 0);
T.ok("и нет шагов", h.indexOf("＋ шаги") < 0 && h.indexOf('data-act="emulti"') < 0);
clickOn({ act: "ecancel", id: r.id }); closeModal();
T.reset();

T.done();
