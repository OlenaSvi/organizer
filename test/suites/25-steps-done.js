/* Дело со всеми закрытыми шагами — сделанное дело, где бы шаг ни
   закрыли: галочкой на «Сегодня» или в окне правки. Иначе оно жило
   «живым», нигде не показывалось, но всплывало в подсказке о повторе:
   «похоже, это уже есть» — про дело, которое давно сделано.        */
T.seed();

var m = live().find(function (i) { return i.multi && i.steps.length > 1; });
m.steps.forEach(function (s) { s.done = false; }); m.done = false; m.doneAt = null; save();

T.head("ПОДСКАЗКА О ПОВТОРЕ НЕ ВИДИТ СДЕЛАННОЕ");
var t = T.tasks()[0];
T.ok("живое дело с тем же названием — подсказка есть", findDupes(t.title, "x").length > 0);
t.done = true; t.doneAt = today();
T.ok("сделали — подсказки нет", findDupes(t.title, "x").length === 0);
t.done = false; t.doneAt = null;

T.head("ПОСЛЕДНИЙ ШАГ ЗАКРЫТ В ОКНЕ ПРАВКИ — ДЕЛО СДЕЛАНО");
openItem(m.id); clickOn({ act: "edit", id: m.id });
for (var k = 0; k < m.steps.length - 1; k++) clickOn({ act: "step", id: m.id, i: k });
T.ok("пока остался открытый шаг — дело живое", !m.done);
clickOn({ act: "step", id: m.id, i: m.steps.length - 1 });
T.ok("закрыли последний — дело сделано, с датой", m.done === true && m.doneAt === today());
T.ok("и подсказка о повторе его не предлагает", findDupes(m.title, "x").length === 0);
clickOn({ act: "step", id: m.id, i: 0 });
T.ok("открыли шаг обратно — дело снова живое", !m.done && !m.doneAt);
clickOn({ act: "ecancel", id: m.id }); closeModal();

T.head("САМОПОЧИНКА ЛЕЧИТ СТАРЫЕ ЗАПИСИ");
m.steps.forEach(function (s) { s.done = true; s.doneAt = "2026-09-01"; }); m.done = false; m.doneAt = null;
normalizeItems();
T.ok("дело со всеми закрытыми шагами стало сделанным", m.done === true);
T.ok("дата — день последнего шага", m.doneAt === "2026-09-01");
T.ok("в архиве оно есть", doneEntries().some(function (e) { return e.it === m; }));
m.steps.forEach(function (s) { s.done = false; s.doneAt = null; }); m.done = false; m.doneAt = null;
T.reset();

T.done();
