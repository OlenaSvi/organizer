/* Предложения на «Сегодня»: кто попадает, в каком порядке, что молчит. */
T.reset();
var t = T.tasks();

T.head("ПОРЯДОК: важное и срочное первым");
t[0].due = addDays(today(), 10); t[0].today = addDays(today(), -1);  // не успели
t[1].due = addDays(today(), 1);  t[1].forceImp = true;               // важное+срочное
t[2].due = addDays(today(), -1); t[2].forceImp = true;               // важное+срочное
t[3].due = addDays(today(), 8);  t[3].forceImp = true;
t[4].due = today();              t[4].forceImp = false;              // неважное, срок пришёл
if (t[5]) t[5].due = null;
render();
var p = todayItems().proposals;
var first2 = p.slice(0, 2).map(function (s) { return s.it; });
T.ok("первыми — важное и срочное",
  first2.every(function (i) { return isImportant(i) && urgency(i); }));
T.ok("внутри группы — по дате",
  daysUntil(first2[0].due) <= daysUntil(first2[1].due));
var carriedAt = p.findIndex(function (s) { return /не успели/.test(s.why); });
T.ok("«не успели» после срочного важного", carriedAt >= 2, "место " + (carriedAt + 1));
T.ok("неважное со сроком — в самом низу", p[p.length - 1].quiet === true);

T.head("НЕВАЖНОЕ МОЛЧИТ, ПОКА СРОК ДАЛЕКО");
T.reset();
var b = t[0]; b.forceImp = false; b.due = addDays(today(), 20);
T.ok("не предлагается", !todayItems().proposals.some(function (s) { return s.it === b; }));
b.due = today();
T.ok("срок пришёл — предлагается",
  todayItems().proposals.some(function (s) { return s.it === b; }));
b.due = addDays(today(), S.cfg.urgentDays);
T.ok("на границе «горит за» — предлагается",
  todayItems().proposals.some(function (s) { return s.it === b; }));
b.due = addDays(today(), S.cfg.urgentDays + 1);
T.ok("за границей — молчит",
  !todayItems().proposals.some(function (s) { return s.it === b; }));

T.head("ЧТО НЕ ПРЕДЛАГАЕТСЯ НИКОГДА");
T.reset();
var ap = T.appt(); ap.due = today();
T.ok("встречи не предлагаются",
  !todayItems().proposals.some(function (s) { return isAppt(s.it); }));
T.ok("рутина не предлагается",
  !todayItems().proposals.some(function (s) { return isRoutine(s.it); }));
T.ok("идеи не предлагаются",
  !todayItems().proposals.some(function (s) { return isIdea(s.it); }));

T.head("ДЕЛО БЕЗ СФЕРЫ УЧАСТВУЕТ");
T.reset();
var x = T.tasks()[0]; var keep = x.spheres.slice();
x.spheres = []; x.due = addDays(today(), 1);
T.ok("предлагается наравне со всеми",
  todayItems().proposals.some(function (s) { return s.it === x; }));
render();
T.ok("помечено «без сферы»", view.innerHTML.indexOf("без сферы") >= 0);
x.spheres = keep;

T.head("ОЧЕРЕДЬ ПОДТЯГИВАЕТСЯ");
T.reset();
for (var k = 0; k < 6; k++) S.items.push({
  id: "q" + k, title: "дело очереди " + (k + 1), type: defaultType(),
  spheres: ["Быт"], created: "2026-02-0" + (k + 1), due: addDays(today(), k + 5),
  steps: [], done: false, multi: false, place: null, person: null, time: null,
  options: [], routine: null, notes: "", forceImp: null, today: null, notToday: null });
render();
var before = todayItems();
T.note("показано " + before.proposals.length + ", в очереди " + before.queued);
clickOn({ act: "takeone", id: before.proposals[0].it.id });
var after = todayItems();
T.ok("после «взять» список снова полный",
  after.proposals.length === before.proposals.length);
T.ok("пришло новое из очереди", after.proposals.some(function (s) {
  return !before.proposals.some(function (b2) { return b2.it.id === s.it.id; }); }));
var b3 = todayItems();
clickOn({ act: "skip", id: b3.proposals[0].it.id });
T.ok("после «не сегодня» — тоже полный",
  todayItems().proposals.length === b3.proposals.length);
S.items = S.items.filter(function (i) { return String(i.id).indexOf("q") !== 0; });

T.head("ЛИМИТ И ВСТРЕЧИ");
T.reset();
ap = T.appt(); ap.due = today();
T.tasks().forEach(function (i, k2) { i.due = addDays(today(), k2); });
clickOn({ act: "takeall" });
var ti = todayItems();
T.ok("«Взять всё» набирает дела до лимита, не считая встреч",
  ti.chosenCount === Math.min(S.cfg.todayCap, T.tasks().length),
  ti.chosenCount + " из " + S.cfg.todayCap + ", встреч рядом " + ti.apptCount);

T.head("ПУСТОТА ОБЪЯСНЯЕТСЯ");
T.reset();
T.tasks().forEach(function (i) { addToToday(i); });
render();
T.ok("сказано, почему предлагать нечего",
  /Предлагать нечего: .+/.test(T.visible(view.innerHTML)));
T.reset();

T.done();
