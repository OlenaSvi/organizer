/* Предложения на «Сегодня»: кто попадает, в каком порядке, что молчит. */
T.seed();
var t = T.tasks();

T.head("ПОРЯДОК: важное и срочное первым");
t[0].due = addDays(today(), 10); t[0].today = addDays(today(), -1);  // не успели
t[1].due = addDays(today(), 1);  t[1].forceImp = true;               // важное+срочное
t[2].due = addDays(today(), -1); t[2].forceImp = true;               // важное+срочное
t[3].due = addDays(today(), 8);  t[3].forceImp = true;
/* Срок завтра, а не сегодня: сегодняшний срок уносит дело прямо в день,
   и в предложениях его уже не будет — проверять было бы нечего. */
t[4].due = addDays(today(), 1);  t[4].forceImp = false;              // неважное, срок близко
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
b.due = addDays(today(), 1);
T.ok("срок подошёл — предлагается",
  todayItems().proposals.some(function (s) { return s.it === b; }));
b.due = today();
T.ok("а сегодняшний срок уносит его сразу в день",
  todayItems().mine.indexOf(b) >= 0
  && !todayItems().proposals.some(function (s) { return s.it === b; }));
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

T.head("СРОК СЕГОДНЯ — ДЕЛО УЖЕ В ДНЕ");
/* Раньше такое дело лежало в предложениях и его нужно было брать
   руками. Но срок сегодня и означает «сделать сегодня» — выбирать
   тут нечего, как и у встречи. */
T.reset();
var d1 = T.tasks()[0], d2 = T.tasks()[1], d3 = T.tasks()[2];
d1.due = today(); d2.due = addDays(today(), 1); d3.due = addDays(today(), -4);
render();
var day = todayItems();
T.ok("дело со сроком сегодня в дне", day.mine.indexOf(d1) >= 0);
T.ok("и его нет среди предложений — не задваивается",
  !day.proposals.some(function (s) { return s.it === d1; }));
T.ok("завтрашнее в день не лезет", day.mine.indexOf(d2) < 0);
T.ok("прошедший срок в день сам не идёт — решаете заново",
  day.mine.indexOf(d3) < 0 && day.proposals.some(function (s) { return s.it === d3; }));
T.ok("в колонке дел оно видно", T.card(d1.id).length > 0);

T.head("КНОПКА ГОВОРИТ ПРАВДУ О ТОМ, КУДА ДЕЛО УЙДЁТ");
/* Взятое вручную возвращается в «Предлагаю» — его можно взять снова.
   Дело со сроком сегодня в предложения не вернётся: срок уже сегодня,
   предлагать нечего. Поэтому и подпись у кнопки другая. */
T.reset();
var byDue = T.tasks()[0], byHand = T.tasks()[1];
byDue.due = today();
addToToday(byHand);
render();
/* T.card отдаёт хвост колонки от нужной карточки, поэтому по нему
   нельзя судить об ОТСУТСТВИИ текста: дальше идут соседние карточки.
   Смотрим саму кнопку этого дела. */
function unpickBtn(id) {
  var m = new RegExp('data-act="unpick" data-id="' + id
    + '"([^>]*)>([^<]+)<').exec(view.innerHTML.replace(/\s+/g, " "));
  return m ? { attrs: m[1], label: m[2].trim() } : null;
}
var bh = unpickBtn(byHand.id), bd = unpickBtn(byDue.id);
T.ok("у взятого вручную — «в предложения»", bh && bh.label === "в предложения",
  bh ? bh.label : "кнопки нет");
T.ok("у дела со сроком — «не сегодня»", bd && bd.label === "не сегодня",
  bd ? bd.label : "кнопки нет");
T.ok("и сказано, что вернётся завтра", bd && /завтра/.test(bd.attrs), bd ? bd.attrs : "");
/* В других ракурсах предлагать «＋ в сегодня» тому, что уже в дне,
   нельзя — кнопка обещала бы то, что уже сделано. */
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; ALLPERIOD = "all"; render();
var row = document.getElementById("allList").innerHTML;
var at = row.indexOf('data-id="' + byDue.id + '"');
T.ok("в списке не зовут добавить то, что уже в дне",
  row.slice(at, at + 700).indexOf("в сегодня") < 0);
TAB = "today"; byHand.today = null; render();

T.head("УБРАТЬ ИЗ ДНЯ ВСЁ-ТАКИ МОЖНО");
/* Отличие от встречи: встречу не отменить, а срок — ваш и двигается. */
clickOn({ act: "unpick", id: d1.id });
day = todayItems();
T.ok("кнопка и правда уносит его из дня", day.mine.indexOf(d1) < 0);
T.ok("и обратно в предложения не просится",
  !day.proposals.some(function (s) { return s.it === d1; }));
d1.notToday = null;

T.head("СЧЁТ ДНЯ УЧИТЫВАЕТ СРОКИ");
T.reset();
var due = T.tasks().slice(0, 3);
due.forEach(function (i) { i.due = today(); });
render();
T.ok("счётчик считает дела со сроком",
  /сделано 0 из 3/.test(T.visible(view.innerHTML)), T.visible(view.innerHTML).slice(0, 120));
clickOn({ act: "toggle", id: due[0].id });
T.ok("сделанное не выпадает из счёта",
  /сделано 1 из 3/.test(T.visible(view.innerHTML)));
clickOn({ act: "toggle", id: due[0].id });

T.head("ПЕРЕГРУЖЕННЫЙ ДЕНЬ НАЗЫВАЕТСЯ СПОКОЙНО");
T.reset();
S.cfg.todayCap = 3;
T.tasks().slice(0, 5).forEach(function (i) { i.due = today(); });
render();
var vis = T.visible(view.innerHTML);
T.ok("про сроки сказано словами", vis.indexOf("со сроком") >= 0, vis.slice(0, 200));
T.ok("и предложен выход, а не упрёк", vis.indexOf("сдвинуть") >= 0);
T.ok("«взято больше» не пишем — вы этого не выбирали",
  vis.indexOf("Взято больше") < 0);
S.cfg.todayCap = 5;
T.reset();

T.done();
