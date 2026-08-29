/* Важность: доступна при создании и в правке, а в просмотре видна
   клеткой матрицы — срочное/несрочное × важное/неважное. */
T.seed();

T.head("ВАЖНОСТЬ ПРИ СОЗДАНИИ");
clickOn({ act: "cap" });
var d = S.items.find(function (i) { return i.draft; });
var h = host.innerHTML;
T.ok("поле «Важность» в форме есть", h.indexOf("Важность") >= 0);
T.ok("два варианта", h.indexOf(">важное<") >= 0 && h.indexOf(">неважное<") >= 0);
T.ok("по умолчанию важное", isImportant(d));
d.title = "Проверка важности";
clickOn({ act: "equad", id: d.id, q: "not" });
T.ok("выбор «неважное» применяется", d.forceImp === false);
clickOn({ act: "capsave" });
var saved = live().find(function (i) { return i.title === "Проверка важности"; });
T.ok("сохраняется вместе с делом", saved && !isImportant(saved));

T.head("МЕТКА КЛЕТКИ В ПРОСМОТРЕ");
saved.due = today();                       // срочное + неважное
openItem(saved.id);
T.ok("«Срочное неважное»", T.visible(host.innerHTML).indexOf("Срочное неважное") >= 0);
closeModal();
saved.forceImp = true;
openItem(saved.id);
T.ok("«Срочное важное»", T.visible(host.innerHTML).indexOf("Срочное важное") >= 0);
closeModal();
saved.due = addDays(today(), 30);
openItem(saved.id);
T.ok("«Несрочное важное»", T.visible(host.innerHTML).indexOf("Несрочное важное") >= 0);
closeModal();
saved.forceImp = false;
openItem(saved.id);
T.ok("«Несрочное неважное»", T.visible(host.innerHTML).indexOf("Несрочное неважное") >= 0);
T.ok("старой метки «молчит до срока» больше нет",
  host.innerHTML.indexOf("молчит до срока") < 0);
/* Класс .quad занят клетками матрицы (min-height 180px): если метка
   его наследует, она раздувается в прямоугольник. */
T.ok("метка не использует класс клетки матрицы",
  host.innerHTML.indexOf('class="tag quad"') < 0 &&
  host.innerHTML.indexOf("quadtag") >= 0);
closeModal();
S.items = S.items.filter(function (i) { return i.title !== "Проверка важности"; });

T.head("ЛИНИИ В ОКНЕ: ТОЛЬКО МЕЖДУ ЗОНАМИ");
var bare = live().find(function (i) {
  return !(i.notes || "").trim() && !(i.multi && i.steps.length)
      && !isRoutine(i) && !(i.options || []).length; });
openItem(bare.id);
T.ok("у дела без деталей — ни одного разделителя внутри",
  (host.innerHTML.match(/class="sep"/g) || []).length === 0,
  "линия остаётся только у футера");
closeModal();
var rich = live().find(function (i) { return i.multi && i.steps.length; });
rich.notes = "заметка";
openItem(rich.id);
T.ok("у дела с деталями — ровно один разделитель",
  (host.innerHTML.match(/class="sep"/g) || []).length === 1);
T.ok("он стоит перед деталями", (function () {
  var h2 = host.innerHTML;
  return h2.indexOf('class="sep"') < h2.indexOf("Шаги"); })());
closeModal();
rich.notes = "";

T.head("У КОГО МЕТКИ НЕТ");
var r = T.routine();
openItem(r.id);
T.ok("у рутины клетки нет — она не в матрице",
  T.visible(host.innerHTML).indexOf("Срочн") < 0 &&
  T.visible(host.innerHTML).indexOf("Несрочн") < 0);
closeModal();
var idea = live().find(isIdea);
openItem(idea.id);
T.ok("у идеи клетки нет — это ещё не обязательство",
  T.visible(host.innerHTML).indexOf("Срочн") < 0 &&
  T.visible(host.innerHTML).indexOf("Несрочн") < 0);
closeModal();

T.head("МЕТКА СХОДИТСЯ С МАТРИЦЕЙ");
T.reset();
var x = T.tasks()[0];
x.due = today(); x.forceImp = true;
TAB = "matrix"; render();
var box = /<div class="quad[^"]*" data-drop-quad="iu">[\s\S]*?<\/div>\s*<\/div>/.exec(view.innerHTML)[0];
T.ok("дело лежит в клетке «Срочное важное»", box.indexOf(esc(x.title)) >= 0);
openItem(x.id);
T.ok("и метка в просмотре та же",
  T.visible(host.innerHTML).indexOf(QUADS[quadrant(x)]) >= 0, QUADS[quadrant(x)]);
closeModal();

T.head("ПРАВКА ВАЖНОСТИ ОСТАЛАСЬ");
openItem(x.id); clickOn({ act: "edit", id: x.id });
T.ok("в редакторе поле есть", host.innerHTML.indexOf("Важность") >= 0);
clickOn({ act: "equad", id: x.id, q: "not" });
T.ok("переключается", x.forceImp === false);
clickOn({ act: "ecancel", id: x.id });
T.ok("крестик откатывает", isImportant(x));
closeModal();
T.reset();

T.head("ВСЕ ДЕЛА В КЛЕТКЕ ВИДНЫ");
/* Клетка обрывала список на восьмом деле и писала «и ещё 12» — а это
   никуда не вело: остальные дела становились недостижимы. */
var MCSS = (function () {
  try {
    ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();
T.reset();
S.items = [];
var many = [];
for (var k = 1; k <= 20; k++) {
  var t20 = { id: "m" + k, title: "Дело номер " + k, type: defaultType(),
    multi: false, spheres: ["Быт"], place: null, person: null, due: null,
    time: null, steps: [], options: [], routine: null, done: false,
    created: today(), notes: "", forceImp: true, today: null, notToday: null };
  S.items.push(t20); many.push(t20);
}
TAB = "matrix"; render();
var mh = view.innerHTML;
var missing = many.filter(function (i) { return mh.indexOf(esc(i.title)) < 0; });
T.ok("видны все двадцать", missing.length === 0,
  missing.length ? "не хватает " + missing.length : "");
T.ok("тупикового «и ещё» больше нет", mh.indexOf("и ещё") < 0);
T.ok("длинный список прокручивается внутри клетки",
  /\.quad ul\{[^}]*overflow-y:auto/.test(MCSS),
  "иначе одна клетка растянула бы всю строку матрицы");
T.reset();

T.done();
