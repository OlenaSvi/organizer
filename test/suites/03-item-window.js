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
T.ok("клетка матрицы подписана",
  /Срочное|Несрочное/.test(T.visible(h)));
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
T.ok("шаги видны сразу, заметка свёрнута",
  h.indexOf('data-act="emulti"') >= 0 && h.indexOf("＋ заметка") >= 0
  && h.indexOf("capNotes") < 0);
T.ok("важность в форме есть", h.indexOf("Важность") >= 0);
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
/* Срок ставим на сегодня: календарь открывается на месяце срока, и в
   текущем месяце заведомо есть прошедшие дни — кроме первого числа. */
x.due = today();
openItem(x.id); clickOn({ act: "edit", id: x.id });
clickOn({ act: "dd", k: "due:" + x.id });
h = host.innerHTML;
T.ok("быстрые чипы", ["сегодня", "завтра", "через неделю", "без срока"]
  .every(function (w) { return h.indexOf(w) >= 0; }));
T.ok("сетка календаря целая", (h.match(/class="ddday/g) || []).length >= 28);
T.ok("прошлые дни не нажимаются",
  /<span class="ddday off/.test(h) || today().slice(-2) === "01",
  "в первый день месяца прошедших дней в сетке может не быть");
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

/* Время и расписание повторов — свойства встречи. Оставшись на обычном
   деле, время всплывало в подписях («5 ноября 10:00»), хотя поля для
   него в форме нет; расписание же ломало галочку — она отмечала день
   в истории повторов вместо того, чтобы закрыть дело. */
var apKey = S.types.find(function (t2) { return t2.kind === "appt"; }).key;
var taskKey = S.types.find(function (t2) { return t2.kind === "plain"; }).key;
clickOn({ act: "dd", k: "type:" + x.id });
clickOn({ act: "ddset", f: "type", id: x.id, v: apKey });
x.due = addDays(today(), 3); x.time = "10:00";
x.repeat = { days: [1, 3], history: [] };
clickOn({ act: "dd", k: "type:" + x.id });
clickOn({ act: "ddset", f: "type", id: x.id, v: taskKey });
T.ok("дело теряет время", x.time === null, String(x.time));
T.ok("и расписание повторов", !x.repeat);
T.ok("а дедлайн остаётся", x.due === addDays(today(), 3));

T.head("САМОПОЧИНКА УБИРАЕТ ЧУЖИЕ ПОЛЯ");
/* Записи, испорченные прежней версией, чинятся при загрузке. */
x.time = "09:15"; x.repeat = { days: [2], history: [] };
normalizeItems();
T.ok("время у обычного дела стёрто", x.time === null);
T.ok("расписание тоже", !x.repeat);
var ap4 = T.appt(); ap4.due = addDays(today(), 2); ap4.time = "14:00";
normalizeItems();
T.ok("а у встречи время не трогаем", ap4.time === "14:00");
clickOn({ act: "ecancel", id: x.id }); closeModal();
T.reset();

T.head("ССЫЛКА В ЗАМЕТКЕ ОСТАЁТСЯ ССЫЛКОЙ");
T.reset();
var n = T.tasks()[0];
n.notes = "запись тут https://example.com/a?x=1&y=2 и всё";
openItem(n.id);
var h = host.innerHTML.replace(/\s+/g, " ");
T.ok("адрес стал ссылкой",
  /<a class="lnk" href="https:\/\/example\.com\/a\?x=1&amp;y=2"/.test(h), h.slice(h.indexOf("<a"), h.indexOf("<a") + 90));
T.ok("открывается в новой вкладке и без доступа к странице",
  /target="_blank" rel="noopener noreferrer"/.test(h));
T.ok("текст вокруг остался текстом",
  h.indexOf("запись тут") >= 0 && h.indexOf("и всё") >= 0);

T.head("ТОЧКА В КОНЦЕ — НЕ ЧАСТЬ АДРЕСА");
n.notes = "смотри https://example.com/страница. потом решим";
openItem(n.id);
h = host.innerHTML.replace(/\s+/g, " ");
T.ok("точка осталась снаружи ссылки", /страница<\/a>\./.test(h) || /<\/a>\./.test(h),
  h.slice(h.indexOf("<a"), h.indexOf("<a") + 140));

T.head("АДРЕС БЕЗ HTTP");
n.notes = "www.example.com";
openItem(n.id);
h = host.innerHTML.replace(/\s+/g, " ");
T.ok("к www дописывается https", /href="https:\/\/www\.example\.com"/.test(h));
T.ok("а видно по-прежнему www", />www\.example\.com</.test(h));

T.head("ОПАСНОЕ ОСТАЁТСЯ БЕЗОПАСНЫМ");
n.notes = '<script>alert(1)</script> и javascript:alert(2) и "кавычки"';
openItem(n.id);
h = host.innerHTML;
T.ok("разметка из заметки не исполняется", h.indexOf("<script") < 0);
T.ok("javascript: ссылкой не становится", h.indexOf('href="javascript:') < 0);
T.ok("кавычки экранированы", h.indexOf('&quot;') >= 0 || h.indexOf("&#39;") >= 0);
n.notes = "";

T.head("В ВАРИАНТАХ ТОЖЕ");
var ch = live().find(isChoice);
ch.options = [{ text: "вот этот https://shop.example/item" }];
openItem(ch.id);
T.ok("вариант со ссылкой", /<a class="lnk" href="https:\/\/shop\.example\/item"/
  .test(host.innerHTML.replace(/\s+/g, " ")));
ch.options = [];

T.head("БЕЗ АДРЕСОВ НИЧЕГО НЕ МЕНЯЕТСЯ");
n.notes = "просто заметка без адресов";
openItem(n.id);
T.ok("лишних ссылок не появилось", host.innerHTML.indexOf('class="lnk"') < 0);
T.ok("текст на месте", host.innerHTML.indexOf("просто заметка без адресов") >= 0);
n.notes = "";
closeModal();
T.reset();

T.done();
