/* Окно дела: просмотр → правка → откат; форма создания. */
T.seed();
/* Берём дело с видом «сходить / съездить»: у вида «Сделать» название
   совпало бы с подстрокой кнопки «Сделать сегодня».                */
var x = T.tasks().find(function (i) { return typeDef(i.type).key === "errand"; })
        || T.tasks()[0];
x.notes = "проверочная заметка"; x.due = addDays(today(), 3);

T.head("ПРОСМОТР — ТОЛЬКО ЧТЕНИЕ");
openItem(x.id);
var h = host.innerHTML;
T.ok("открылся просмотр", h.indexOf("Редактировать") >= 0);
T.ok("полей ввода нет", h.indexOf("<input") < 0);
T.ok("заметка видна", h.indexOf("проверочная заметка") >= 0);
T.ok("вид дела не написан словами",
  T.visible(h).indexOf(typeName(x)) < 0);
T.ok("«Сделать сегодня» — главная синяя",
  /btn primary" data-act="pin"/.test(h));
T.ok("«Редактировать» — текстовая", /btn link" data-act="edit"/.test(h));

T.head("ПРАВКА И ОТКАТ");
clickOn({ act: "edit", id: x.id });
T.ok("редактор открылся", host.innerHTML.indexOf("edTitle") >= 0);
var oldPlace = x.place;
clickOn({ act: "dd", k: "place:" + x.id });
clickOn({ act: "ddset", f: "place", id: x.id, v: "Израиль" });
T.ok("правка применяется сразу", x.place === "Израиль");
clickOn({ act: "ecancel", id: x.id });
T.ok("крестик откатывает правку", x.place === oldPlace, "стало «" + x.place + "»");
T.ok("и возвращает в просмотр", host.innerHTML.indexOf("Редактировать") >= 0);
closeModal();

T.head("ФОРМА СОЗДАНИЯ");
clickOn({ act: "cap" });
var d = S.items.find(function (i) { return i.draft; });
h = host.innerHTML;
T.ok("заголовок «Новое дело»", h.indexOf("<h3>Новое дело</h3>") >= 0);
T.ok("заметка и шаги свёрнуты",
  h.indexOf("＋ заметка") >= 0 && h.indexOf("＋ шаги") >= 0 && h.indexOf("capNotes") < 0);
T.ok("важности в форме нет", h.indexOf("Важность") < 0);
d.title = "Проверочное дело";
clickOn({ act: "dd", k: "due:" + d.id });
clickOn({ act: "duequick", id: d.id, v: "tomorrow" });
clickOn({ act: "esphere", id: d.id, v: "Быт" });
clickOn({ act: "capsavetake" });
var saved = live().find(function (i) { return i.title === "Проверочное дело"; });
T.ok("«добавить и взять»: сохранило и взяло в день",
  saved && saved.due === addDays(today(), 1) && pickedToday(saved));
S.items = S.items.filter(function (i) { return i.title !== "Проверочное дело"; });

T.head("СРОК: ЧИПЫ И КАЛЕНДАРЬ");
openItem(x.id); clickOn({ act: "edit", id: x.id });
clickOn({ act: "dd", k: "due:" + x.id });
h = host.innerHTML;
T.ok("быстрые чипы", ["сегодня", "завтра", "через неделю", "без срока"]
  .every(function (w) { return h.indexOf(w) >= 0; }));
T.ok("сетка календаря целая", (h.match(/class="ddday/g) || []).length >= 28);
T.ok("прошлые дни не нажимаются", /<span class="ddday off/.test(h));
clickOn({ act: "duepick", id: x.id, d: addDays(today(), 9) });
T.ok("день выбирается", x.due === addDays(today(), 9));
clickOn({ act: "ecancel", id: x.id }); closeModal();

T.head("СМЕНА ВИДА ЧИСТИТ ЛИШНЕЕ");
var ideaKey = S.types.find(function (t2) { return t2.kind === "idea"; }).key;
x.due = today();
openItem(x.id); clickOn({ act: "edit", id: x.id });
clickOn({ act: "dd", k: "type:" + x.id });
clickOn({ act: "ddset", f: "type", id: x.id, v: ideaKey });
T.ok("идея теряет срок", x.due === null);
clickOn({ act: "ecancel", id: x.id }); closeModal();
T.reset();

T.done();
