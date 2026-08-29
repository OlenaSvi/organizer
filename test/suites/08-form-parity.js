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

T.head("ШАГИ, ЗАМЕТКА И ВАРИАНТЫ — ОДИНАКОВЫЕ КНОПКИ");
T.ok("у дела без шагов — пунктирная кнопка «＋ шаги»",
  h.indexOf("＋ шаги") >= 0 && h.indexOf('class="steps"') < 0);
T.ok("заметка такая же", h.indexOf("＋ заметка") >= 0 && h.indexOf("edNotes") < 0);
T.ok("кнопки стоят одним рядом", /<div class="caprow">[\s\S]*?＋ шаги[\s\S]*?＋ заметка/.test(h));
clickOn({ act: "emulti", id: x.id });
T.ok("одно нажатие раскрывает блок с полем ввода",
  host.innerHTML.indexOf('id="newStep"') >= 0 && host.innerHTML.indexOf("＋ шаги") < 0);
T.ok("и даёт вернуть дело к одному действию",
  host.innerHTML.indexOf("убрать шаги") >= 0);
clickOn({ act: "emulti", id: x.id });
T.ok("возврат работает", host.innerHTML.indexOf("＋ шаги") >= 0);
clickOn({ act: "ecancel", id: x.id }); closeModal();

var ch = live().find(isChoice);
openItem(ch.id); clickOn({ act: "edit", id: ch.id });
h = host.innerHTML;
T.ok("у «выбрать/купить» есть кнопка «＋ варианты»", h.indexOf("＋ варианты") >= 0);
T.ok("список вариантов пока свёрнут", h.indexOf("newOpt") < 0);
clickOn({ act: "formopen", k: "options", id: ch.id });
T.ok("раскрывается по нажатию", host.innerHTML.indexOf("newOpt") >= 0);
clickOn({ act: "ecancel", id: ch.id }); closeModal();

ch.options = [{ text: "подешевле" }];
openItem(ch.id); clickOn({ act: "edit", id: ch.id });
T.ok("заполненные варианты раскрыты сразу", host.innerHTML.indexOf("newOpt") >= 0);
clickOn({ act: "ecancel", id: ch.id }); closeModal();
ch.options = [];

var plain = T.tasks().find(function (i) { return !isChoice(i) && !isIdea(i); });
openItem(plain.id); clickOn({ act: "edit", id: plain.id });
T.ok("у обычного дела вариантов нет вовсе",
  host.innerHTML.indexOf("＋ варианты") < 0 && host.innerHTML.indexOf("newOpt") < 0);
clickOn({ act: "ecancel", id: plain.id }); closeModal();

var m2 = live().find(function (i) { return i.multi && i.steps.length > 1; });
m2.notes = "уже есть заметка";
openItem(m2.id); clickOn({ act: "edit", id: m2.id });
T.ok("заполненная заметка раскрыта сразу", host.innerHTML.indexOf("edNotes") >= 0);
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
