/* Рутина: сколько занимает, в какую часть дня — и как это видно
   в панели дня и в окне рутины. Плюс карта четырёх недель. */
T.seed();
var HCSS = (function () {
  try { ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
  } catch (e) { return ""; }
})();
var routs = live().filter(isRoutine);
var r = routs[0], r2 = routs[1];

T.head("ПОЛЯ ЕСТЬ ТОЛЬКО У РУТИНЫ");
openItem(r.id); clickOn({ act: "edit", id: r.id });
var h = host.innerHTML;
T.ok("«Часть дня» в форме рутины", h.indexOf("Часть дня") >= 0);
T.ok("«Сколько занимает» в форме рутины", h.indexOf("Сколько занимает") >= 0);
clickOn({ act: "ecancel", id: r.id }); closeModal();
var t0 = T.tasks()[0];
openItem(t0.id); clickOn({ act: "edit", id: t0.id });
T.ok("у обычного дела этих полей нет",
  host.innerHTML.indexOf("Сколько занимает") < 0 && host.innerHTML.indexOf("Часть дня") < 0);
clickOn({ act: "ecancel", id: t0.id }); closeModal();

T.head("ВЫБОР СОХРАНЯЕТСЯ");
openItem(r.id); clickOn({ act: "edit", id: r.id });
T.ok("часть дня — тот же переключатель, что в настройках",
  /<div class="seg"[^>]*>[\s\S]{0,400}data-act="rpart"/.test(host.innerHTML));
/* Часть дня — последнее поле в сетке и потому занимает строку целиком:
   рядом с ним не должно зиять пустой клетки. Сам переключатель при этом
   не растягивается — у .seg подложка по размеру кнопок. */
T.ok("переключателю отдана строка целиком, пустой клетки рядом нет",
  /class="cfgitem wide"[^>]*>\s*<p class="lbl">Часть дня/.test(host.innerHTML));
T.ok("но сам он остаётся по размеру кнопок",
  /\.seg\{[^}]*width:fit-content/.test(HCSS || ""));
clickOn({ act: "rpart", id: r.id, v: "morning" });
T.ok("часть дня записалась", r.partOfDay === "morning");
T.ok("выбранное подсвечено", /data-v="morning"[^>]*class="on"|class="on"[^>]*data-v="morning"/
  .test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("четвёртая кнопка — прочерк",
  /data-act="rpart"[^>]*data-v=""[^>]*>—</.test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("и объясняет себя при наведении",
  /title="[^"]*не важна[^"]*"[^>]*data-v=""|data-v=""[^>]*title="[^"]*не важна/
    .test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "rpart", id: r.id, v: "" });
T.ok("«не важно» снимает выбор", !r.partOfDay);
T.ok("и подсвечивается само",
  /data-v=""[^>]*class="on"|class="on"[^>]*data-v=""/.test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "rpart", id: r.id, v: "morning" });
clickOn({ act: "dd", k: "mins:" + r.id });
T.ok("список минут открылся", host.innerHTML.indexOf('data-f="mins"') >= 0);
/* Самая короткая рутина — тоже рутина: «выпить таблетку» занимает минуту. */
T.ok("одна минута есть в списке",
  /data-f="mins"[^>]*data-v="1"[^>]*>\s*<span>1 мин<\/span>/
    .test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "ddset", f: "mins", id: r.id, v: "10" });
T.ok("минуты записались числом, а не строкой", r.mins === 10);
clickOn({ act: "esave", id: r.id }); closeModal();

T.head("ПАНЕЛЬ ДНЯ: ЧАСТИ ДНЯ СТВОРКАМИ");
/* Раньше части дня стояли группами одна под другой — панель короткая, и
   всё это приходилось листать. Теперь створки: видна одна часть. */
r.partOfDay = "morning"; r.mins = 10;
r2.partOfDay = "evening"; r2.mins = 20;
TAB = "today"; ROUTVIEW = "morning"; render();
var p = view.innerHTML;
T.ok("створки появились", p.indexOf('data-act="routview"') >= 0);
T.ok("утро идёт раньше вечера",
  p.indexOf("Утро") >= 0 && p.indexOf("Вечер") > p.indexOf("Утро"));
T.ok("в шапке — время открытой створки", /Рутина[\s\S]{0,120}10 мин/.test(p));
T.ok("в строке видно, сколько занимает", p.indexOf("10 мин") >= 0);

T.head("СДЕЛАННОЕ ИЗ СУММЫ УХОДИТ");
clickOn({ act: "toggle", id: r.id });
p = view.innerHTML;
T.ok("время открытой створки обнулилось", !/Рутина[\s\S]{0,120}10 мин/.test(p));
T.ok("но сама рутина на месте, зачёркнутая",
  T.visible(p).indexOf(r.title) >= 0);
clickOn({ act: "toggle", id: r.id });

T.head("БЕЗ ЧАСТЕЙ ДНЯ — ПЛОСКИЙ СПИСОК, КАК РАНЬШЕ");
r.partOfDay = null; r2.partOfDay = null; ROUTVIEW = null; render();
T.ok("створок нет", view.innerHTML.indexOf('data-act="routview"') < 0);
T.ok("а рутины на месте", T.visible(view.innerHTML).indexOf(r.title) >= 0);
T.ok("в строке видно, сколько занимает", view.innerHTML.indexOf("10 мин") >= 0);

T.head("ОКНО РУТИНЫ");
r.partOfDay = "morning";
openItem(r.id);
var vis = T.visible(host.innerHTML);
T.ok("видно часть дня", vis.indexOf("Утро") >= 0);
T.ok("видно длительность", vis.indexOf("10 мин") >= 0);

T.head("КАРТА ЧЕТЫРЁХ НЕДЕЛЬ");
T.ok("карта есть", host.innerHTML.indexOf('class="heat"') >= 0);
T.ok("сегодняшняя клетка помечена",
  (host.innerHTML.match(/class="hc[^"]*\bnow\b/g) || []).length === 1);
T.ok("в ней 28 клеток",
  (host.innerHTML.match(/class="hc[ "]/g) || []).length === 28,
  String((host.innerHTML.match(/class="hc[ "]/g) || []).length));
closeModal();

T.head("ПУСТЫЕ КЛЕТКИ ВИДНЫ");
/* Дни до появления привычки и будущие рисуются бледно, а не прозрачно:
   у новой рутины три строки были невидимы и карта выглядела дырой. */
T.ok("у пустой клетки есть фон",
  !/\.heat i\.gone\{[^}]*background:transparent/.test(HCSS),
  "иначе новая рутина показывает пустоту вместо карты");
T.ok("сегодня выделено в стилях", /\.heat i\.now\{/.test(HCSS));

T.head("ДОЛЯ СЧИТАЕТСЯ ЧЕСТНО");
r.created = addDays(today(), -60);
r.routine.days = [0, 1, 2, 3, 4, 5, 6];
r.routine.history = [];
for (var k = 0; k < 5; k++) r.routine.history.push(addDays(today(), -k));
openItem(r.id);
vis = T.visible(host.innerHTML);
var m = /За 4 недели: (\d+) из (\d+)/.exec(vis);
T.ok("строка за 4 недели есть", !!m, vis.slice(0, 200));
T.ok("сделанное посчитано", m && +m[1] === 5, m ? m[1] : "—");
T.ok("будущие дни в знаменатель не идут", m && +m[2] >= 21 && +m[2] <= 28, m ? m[2] : "—");
closeModal();

T.head("ДНИ ДО ПОЯВЛЕНИЯ РУТИНЫ НЕ СЧИТАЮТСЯ");
/* Иначе новая привычка сразу показывала бы провал за месяц, которого не было. */
r.created = addDays(today(), -2);
r.routine.history = [today()];
openItem(r.id);
m = /За 4 недели: (\d+) из (\d+)/.exec(T.visible(host.innerHTML));
T.ok("знаменатель — только прожитые дни", m && +m[2] === 3, m ? m[2] : "—");
closeModal();

T.head("СВЕРХ РАСПИСАНИЯ — ЭТО ПЛЮС, А НЕ МИНУС");
r.created = addDays(today(), -60);
r.routine.days = [new Date(today() + "T12:00:00").getDay()];
r.routine.history = [today(), addDays(today(), -1)];
openItem(r.id);
vis = T.visible(host.innerHTML);
T.ok("названо отдельно", vis.indexOf("сверх расписания") >= 0, vis.slice(0, 220));
m = /За 4 недели: (\d+) из (\d+)/.exec(vis);
T.ok("долю не портит", m && +m[1] === 1 && +m[2] === 4, m ? m[1] + "/" + m[2] : "—");
closeModal();
T.reset();

T.head("ПЛИТКИ ДНЕЙ ВЕЗДЕ ОДИНАКОВЫЕ");
/* Разметка была скопирована в четыре места и успела разойтись: в окне
   архива неделя начиналась с воскресенья вопреки настройке. */
T.reset();
S.cfg.weekStart = 1;
var rr = live().filter(isRoutine)[0];
rr.routine.days = [1, 3, 5];
rr.routine.history = [today()];

function firstDay(html) {
  var m = /<div class="rt">\s*<div[^>]*>([^<]+)</.exec(html);
  return m ? m[1].trim() : "—";
}
function tiles(html) {
  var box = /<div class="rt">([\s\S]*?)<\/div>\s*<\/div>/.exec(html);
  var out = [], m, re = /<div[^>]*>([а-я]{2})</g;
  if (!box) return out;
  while ((m = re.exec(box[1]))) out.push(m[1]);
  return out;
}

openItem(rr.id);
var viewDays = tiles(host.innerHTML);
T.ok("в просмотре неделя с понедельника", firstDay(host.innerHTML) === "пн",
  viewDays.join(" "));
closeModal();

openItem(rr.id); clickOn({ act: "edit", id: rr.id });
T.ok("в форме тот же порядок", firstDay(host.innerHTML) === "пн");
T.ok("и та же подпись", host.innerHTML.indexOf("В какие дни") >= 0);
T.ok("блок дней занимает всю ширину строки",
  /class="cfgitem wide"[^>]*>\s*<p class="lbl">В какие дни/.test(host.innerHTML));
clickOn({ act: "ecancel", id: rr.id }); closeModal();

clickOn({ act: "opendone", id: rr.id, when: today() });
T.ok("в окне архива неделя тоже с понедельника",
  firstDay(host.innerHTML) === "пн", tiles(host.innerHTML).join(" "));
T.ok("и подпись та же, а не «Расписание»",
  host.innerHTML.indexOf("В какие дни") >= 0 && host.innerHTML.indexOf("Расписание") < 0);
closeModal();

S.cfg.weekStart = 0;
openItem(rr.id);
T.ok("с воскресеньем в настройках — везде воскресенье",
  firstDay(host.innerHTML) === "вс");
closeModal();
clickOn({ act: "opendone", id: rr.id, when: today() });
T.ok("в архиве тоже", firstDay(host.innerHTML) === "вс");
closeModal();
S.cfg.weekStart = 1;
T.reset();

T.head("СТВОРКИ РУТИНЫ ПО ЧАСТЯМ ДНЯ");
/* Панель рутины короткая: показывать разом утро, день и вечер значит
   заставлять листать. Створка показывает то, что сейчас нужно. */
T.reset();
var rs = live().filter(isRoutine);
rs[0].partOfDay = "morning"; rs[0].mins = 10;
rs[1].partOfDay = "evening"; rs[1].mins = 20;
TAB = "today"; ROUTVIEW = "morning"; render();
T.ok("переключатель появился", view.innerHTML.indexOf('data-act="routview"') >= 0);
T.ok("створки названы частями дня",
  /Утро/.test(view.innerHTML) && /Вечер/.test(view.innerHTML));
T.ok("видно только утреннюю", T.visible(view.innerHTML).indexOf(rs[0].title) >= 0
  && T.visible(view.innerHTML).indexOf(rs[1].title) < 0);
clickOn({ act: "routview", v: "evening" });
T.ok("переключились на вечер", T.visible(view.innerHTML).indexOf(rs[1].title) >= 0
  && T.visible(view.innerHTML).indexOf(rs[0].title) < 0);
T.ok("время створки — в шапке панели",
  /Рутина[\s\S]{0,120}20 мин/.test(view.innerHTML));

T.head("БЕЗ ЧАСТИ ДНЯ — СТВОРКА «ЛЮБОЕ»");
rs[1].partOfDay = null;
ROUTVIEW = null; render();
T.ok("створка названа одним словом", /Любое/.test(view.innerHTML));
clickOn({ act: "routview", v: "" });
T.ok("в ней рутина без части дня",
  T.visible(view.innerHTML).indexOf(rs[1].title) >= 0);

T.head("ОДНА ГРУППА — ПЕРЕКЛЮЧАТЕЛЬ НЕ НУЖЕН");
rs[0].partOfDay = null;
ROUTVIEW = null; render();
T.ok("створок нет", view.innerHTML.indexOf('data-act="routview"') < 0);
T.ok("а рутины на месте", T.visible(view.innerHTML).indexOf(rs[0].title) >= 0
  && T.visible(view.innerHTML).indexOf(rs[1].title) >= 0);
ROUTVIEW = null;
T.reset();

T.done();
