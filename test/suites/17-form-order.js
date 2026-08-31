/* Поля формы идут в одном порядке у всех видов: сначала «что это»,
   потом «когда», потом принадлежность, потом важность. Раньше «Вид»
   оказывался то вторым, то четвёртым — в зависимости от вида. */
T.seed();

function labels(html) {
  var out = [], m, re = /<p class="lbl"[^>]*>\s*([^<\n]+)/g;
  while ((m = re.exec(html))) out.push(m[1].trim().replace(/\s+/g, " "));
  return out;
}
function order(it) {
  openItem(it.id); clickOn({ act: "edit", id: it.id });
  var L = labels(host.innerHTML);
  clickOn({ act: "ecancel", id: it.id }); closeModal();
  return L;
}
function expect(name, it, want) {
  var got = order(it);
  T.ok(name, got.join(" → ") === want.join(" → "), got.join(" → "));
}

T.head("«ЧТО ЭТО» ВСЕГДА ПЕРВОЕ");
var kinds = [T.tasks()[0], T.routine(), T.appt(),
             live().find(isIdea), live().find(isChoice)];
kinds.forEach(function (it) {
  T.ok(esc(typeDef(it.type).name) + ": первым идёт вид дела", order(it)[0] === "Вид");
});

T.head("ПОРЯДОК ЦЕЛИКОМ");
expect("обычное дело", T.tasks()[0],
  ["Вид", "Дедлайн", "Сфера", "Место", "Человек", "Важность"]);
expect("выбрать / купить", live().find(isChoice),
  ["Вид", "Дедлайн", "Сфера", "Место", "Человек", "Важность"]);
expect("идея", live().find(isIdea),
  ["Вид", "Сфера", "Место", "Человек"]);
expect("рутина", T.routine(),
  ["Вид", "Сколько занимает", "В какие дни", "Часть дня",
   "Сфера", "Место", "Человек"]);
var ap = T.appt();
expect("встреча", ap,
  ["Вид", "Когда", "Дата и время", "Сфера", "Место", "Человек",
   "Важность", "Адрес, телефон, что взять с собой"]);
ap.repeat = { days: [1, 3], history: [] }; ap.due = null;
expect("встреча по расписанию", ap,
  ["Вид", "Когда", "В какие дни", "Время", "Сфера", "Место", "Человек",
   "Важность", "Адрес, телефон, что взять с собой"]);

T.head("В СЕТКЕ НЕТ ДЫР");
/* Нечётное число полей — последнее занимает строку целиком, иначе
   рядом с ним зияла бы пустая клетка. */
function gridCells(html) {
  var g = /<div class="cfggrid"[^>]*>([\s\S]*?)<p class="lbl"[^>]*>\s*Сфера/.exec(html);
  return g ? (g[1].match(/class="cfgitem"/g) || []).length : -1;
}
function fullCells(html) {
  var g = /<div class="cfggrid"[^>]*>([\s\S]*?)<p class="lbl"[^>]*>\s*Сфера/.exec(html);
  return g ? (g[1].match(/class="cfgitem wide"/g) || []).length : -1;
}
[[T.routine(), "рутина"], [ap, "встреча по расписанию"],
 [T.tasks()[0], "обычное дело"], [live().find(isIdea), "идея"]].forEach(function (p) {
  openItem(p[0].id); clickOn({ act: "edit", id: p[0].id });
  var half = gridCells(host.innerHTML) - fullCells(host.innerHTML);
  T.ok(p[1] + ": половинных ячеек чётное число", half % 2 === 0,
    half + " половинных, " + fullCells(host.innerHTML) + " во всю ширину");
  clickOn({ act: "ecancel", id: p[0].id }); closeModal();
});
ap.repeat = null;
T.reset();

T.head("СОСЕДИ В СТРОКЕ ОДНОЙ ВЫСОТЫ");
var FCSS = (function () {
  try { ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();
T.ok("переключатель подогнан под высоту поля",
  /\.cfgitem \.seg\{[^}]*height:44px/.test(FCSS)
  && /\.ddbtn\{[^}]*height:44px/.test(FCSS),
  "иначе строка «Вид · Когда» выглядит разъехавшейся");
T.ok("широкое поле раскрывает список от своего левого края",
  /\.cfgitem\.wide \.dd\.inline\{[^}]*left:0/.test(FCSS),
  "прижатый вправо, список висел посреди широкой кнопки");

T.head("ПОДСКАЗКА У ИДЕИ НЕ ЗАСЛОНЯЕТ ПОЛЕ");
var idea = live().find(isIdea);
openItem(idea.id); clickOn({ act: "edit", id: idea.id });
var hint = /class="qs"[^>]*>([\s\S]*?)<\/p>/.exec(host.innerHTML);
T.ok("подсказка короткая", hint && hint[1].replace(/\s+/g, " ").trim().length < 110,
  hint ? String(hint[1].replace(/\s+/g, " ").trim().length) + " знаков" : "нет");
clickOn({ act: "ecancel", id: idea.id }); closeModal();

T.done();
