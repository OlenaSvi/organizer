/* Отметка «я сейчас здесь» прячет дела, привязанные к другим местам —
   во всех ракурсах, а не только в «Сегодня». Чтобы увидеть всё сразу,
   в том же переключателе есть «Везде · без учёта места». */
T.seed();
var t = T.tasks();
t[0].place = "Кипр";       t[0].due = today();   // здешнее
t[1].place = "Амстердам";  t[1].due = today();   // чужое
t[2].place = "Израиль";    t[2].due = today();   // чужое
t[3].place = null;         t[3].due = today();   // без места — везде своё
t[1].spheres = ["Быт"]; t[4].spheres = ["Быт"];
S.hereNow = "Кипр";

var HERE = t[0].title, AWAY1 = t[1].title, AWAY2 = t[2].title, ANY = t[3].title;
function has(h, s) { return h.indexOf(esc(s)) >= 0; }

T.head("СПИСОК");
TAB = "all"; ALLFILTER = "all"; ALLQUERY = ""; ALLPERIOD = "all"; ALLSORT = "due";
render();
var lh = document.getElementById("allList").innerHTML;
T.ok("здешнее дело видно", has(lh, HERE));
T.ok("дело из другой страны скрыто", !has(lh, AWAY1));
T.ok("и второе тоже", !has(lh, AWAY2));
T.ok("дело без места видно везде", has(lh, ANY));
T.ok("счётчик считает то, что показано",
  document.getElementById("allCount").textContent.indexOf(String(here().length)) === 0);

T.head("МАТРИЦА");
TAB = "matrix"; render();
T.ok("здешнее на месте", has(view.innerHTML, HERE));
T.ok("чужое не показывается", !has(view.innerHTML, AWAY1) && !has(view.innerHTML, AWAY2));

T.head("КАЛЕНДАРЬ");
TAB = "calendar"; CALMODE = "week"; CALANCHOR = null; render();
T.ok("здешнее на месте", has(view.innerHTML, HERE));
T.ok("чужое не показывается", !has(view.innerHTML, AWAY1) && !has(view.innerHTML, AWAY2));

T.head("КАРТА");
TAB = "map"; AXIS = "sphere"; render();
var byt = itemsIn("Быт").map(function (i) { return i.title; });
T.ok("ветка не берёт чужое", byt.indexOf(AWAY1) < 0, byt.join(" · "));
T.ok("здешнее в ветке осталось", byt.indexOf(t[4].title) >= 0);

T.head("РАЗОБРАТЬ");
t[1].spheres = []; t[4].spheres = [];
render();
openInbox();
T.ok("чужое не просится разбирать", !has(host.innerHTML, AWAY1));
T.ok("здешнее просится", has(host.innerHTML, t[4].title));
closeModal();
t[1].spheres = ["Быт"]; t[4].spheres = ["Быт"];

T.head("СКОЛЬКО СПРЯТАНО — СКАЗАНО СЛОВАМИ");
/* Молчаливое исчезновение выглядит как поломка переключателя. */
["all", "matrix", "calendar", "map"].forEach(function (tab) {
  TAB = tab; render();
  T.ok(TABS[tab] + ": сказано, что спрятано и почему",
    view.innerHTML.indexOf("к другим местам") >= 0);
});

T.head("«ВЕЗДЕ» ВОЗВРАЩАЕТ ВСЁ");
S.hereNow = null;
TAB = "all"; render();
lh = document.getElementById("allList").innerHTML;
T.ok("чужое вернулось", has(lh, AWAY1) && has(lh, AWAY2));
T.ok("и лишней приписки нет", view.innerHTML.indexOf("к другим местам") < 0);

T.head("ПЕРЕКЛЮЧАТЕЛЬ СЧИТАЕТ ВСЕ МЕСТА");
/* Иначе непонятно, куда уехали дела и где их искать. */
S.hereNow = "Кипр"; DD = "here"; render();
var hb = document.getElementById("hereBox").innerHTML;
T.ok("у Амстердама счёт не обнулился", /Амстердам[\s\S]*?<em>1 дело здесь/.test(hb));
DD = null;

T.head("АРХИВ ОТ МЕСТА НЕ ЗАВИСИТ");
/* Сделанное — это уже история, а не то, что можно сделать здесь. */
t[1].done = true; t[1].doneAt = today();
TAB = "all"; ALLFILTER = "done"; render();
T.ok("сделанное в другой стране видно",
  has(document.getElementById("allList").innerHTML, AWAY1));
ALLFILTER = "all"; S.hereNow = null;
T.reset();

T.done();
