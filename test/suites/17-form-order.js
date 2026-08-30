/* Поля формы идут в одном порядке у всех видов: сначала «что это»,
   потом «когда», потом принадлежность, потом важность. Раньше «Вид дела»
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
  T.ok(esc(typeDef(it.type).name) + ": первым идёт вид дела", order(it)[0] === "Вид дела");
});

T.head("ПОРЯДОК ЦЕЛИКОМ");
expect("обычное дело", T.tasks()[0],
  ["Вид дела", "Дедлайн", "Сфера", "Место", "Человек", "Важность"]);
expect("выбрать / купить", live().find(isChoice),
  ["Вид дела", "Дедлайн", "Сфера", "Место", "Человек", "Важность"]);
expect("идея", live().find(isIdea),
  ["Вид дела", "Сфера", "Место", "Человек"]);
expect("рутина", T.routine(),
  ["Вид дела", "Сколько занимает", "В какие дни", "Часть дня",
   "Сфера", "Место", "Человек"]);
var ap = T.appt();
expect("встреча", ap,
  ["Вид дела", "Когда", "Дата и время", "Сфера", "Место", "Человек",
   "Важность", "Адрес, телефон, что взять с собой"]);
ap.repeat = { days: [1, 3], history: [] }; ap.due = null;
expect("встреча по расписанию", ap,
  ["Вид дела", "Когда", "В какие дни", "Время", "Сфера", "Место", "Человек",
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
  return g ? (g[1].match(/grid-column:1\/-1/g) || []).length : -1;
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

T.done();
