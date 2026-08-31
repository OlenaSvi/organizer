/* Второй уровень настроек: правки копятся, кнопка сохраняет, крестик
   откатывает. Добавление — по Enter, без отдельной кнопки. */
T.seed();

T.head("КНОПКА СОХРАНЕНИЯ");
DIRPAGE = null; DIREDIT = null; openSettings();
clickOn({ act: "diropen", p: "sphere" });
var h = host.innerHTML;
T.ok("кнопка «Сохранить изменения» есть", h.indexOf('data-act="dirsave"') >= 0);
T.ok("пока правок нет — кнопка неактивна",
  /data-act="dirsave"[^>]*disabled|disabled[^>]*data-act="dirsave"/.test(h.replace(/\s+/g, " ")));
T.ok("пока правок нет — сообщения нет", h.indexOf("Изменения сохранены") < 0);
T.ok("неактивная кнопка не отзывается на наведение", (function () {
  try { ObjC.import("Foundation");
    var css = $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js.replace(/\s+/g, " ");
    return /\.btn\[disabled\]\{[^}]*pointer-events:none/.test(css);
  } catch (e) { return false; }
})());

T.head("ПРАВКА, СОХРАНЕНИЕ, СООБЩЕНИЕ");
clickOn({ act: "diredit", v: "Быт" });
document.getElementById("dirName").value = "Дом";
clickOn({ act: "sphren", v: "Быт" });
T.ok("имя изменилось в списке", S.spheres.indexOf("Дом") >= 0);
T.ok("после правки кнопка ожила",
  !/data-act="dirsave"[^>]*disabled/.test(host.innerHTML.replace(/\s+/g, " ")));
clickOn({ act: "dirsave" });
T.ok("окно осталось открытым на той же странице",
  DIRPAGE === "sphere" && host.innerHTML.indexOf("<b>Сферы</b>") >= 0);
T.ok("слева появилось «Изменения сохранены»",
  host.innerHTML.indexOf("Изменения сохранены") >= 0);
T.ok("и кнопка снова неактивна — сохранять нечего",
  /data-act="dirsave"[^>]*disabled/.test(host.innerHTML.replace(/\s+/g, " ")));
T.ok("записалось в хранилище",
  JSON.parse(localStorage.getItem("organizer.v1")).spheres.indexOf("Дом") >= 0);

T.head("КРЕСТИК ОТКАТЫВАЕТ НЕСОХРАНЁННОЕ");
clickOn({ act: "diredit", v: "Дом" });
document.getElementById("dirName").value = "Хозяйство";
clickOn({ act: "sphren", v: "Дом" });
T.ok("правка применилась к списку", S.spheres.indexOf("Хозяйство") >= 0);
clickOn({ act: "dirclose" });
T.ok("после крестика вернулось сохранённое",
  S.spheres.indexOf("Дом") >= 0 && S.spheres.indexOf("Хозяйство") < 0);
T.ok("метки на делах тоже вернулись",
  !live().some(function (i) { return (i.spheres || []).indexOf("Хозяйство") >= 0; }));

T.head("ДОБАВЛЕНИЕ ПО ENTER, БЕЗ КНОПКИ");
DIRPAGE = "sphere"; DIREDIT = null; openSettings();
T.ok("кнопки «Добавить» нет", host.innerHTML.indexOf('data-act="sphadd"') < 0);
var inp = document.getElementById("dirNew");
T.ok("поле подсказывает про Enter",
  /placeholder="[^"]*Enter"/.test(host.innerHTML));
inp.value = "Финансы";
(inp._l.keydown || []).slice(-1).forEach(function (f) { f({ key: "Enter" }); });
T.ok("Enter добавляет сферу", S.spheres.indexOf("Финансы") >= 0);
clickOn({ act: "dirsave" });

T.head("УДАЛЕНИЕ ТОЖЕ ОТКАТЫВАЕТСЯ");
DIRPAGE = "sphere"; openSettings();
clickOn({ act: "sphdel", v: "Финансы" });
T.ok("сфера убрана из списка", S.spheres.indexOf("Финансы") < 0);
clickOn({ act: "dirclose" });
T.ok("крестик вернул её", S.spheres.indexOf("Финансы") >= 0);
DIRPAGE = "sphere"; openSettings();
clickOn({ act: "sphdel", v: "Финансы" });
clickOn({ act: "dirsave" });
clickOn({ act: "dirclose" });
T.ok("после сохранения удаление остаётся", S.spheres.indexOf("Финансы") < 0);
S.spheres = S.spheres.map(function (x) { return x === "Дом" ? "Быт" : x; });
save();

T.head("ВИДЫ ДЕЛ НЕ ЗАВОДЯТСЯ И НЕ ПЕРЕИМЕНОВЫВАЮТСЯ");
/* Заводить новые виды было нечестно: новый всегда получался обычным
   делом, и рутину заново им создать было нельзя. Осталось одно —
   убрать лишний вид, доставшийся с прежних времён. */
DIRPAGE = "type"; DIREDIT = null; dirBackup = null; openSettings();
var th = host.innerHTML;
T.ok("поля «добавить вид» нет", th.indexOf('id="dirNew"') < 0);
T.ok("и переименования нет", th.indexOf('data-act="diredit"') < 0);
T.ok("сказано, почему", th.indexOf("завести заново") >= 0, th.slice(-400));

T.head("ОСНОВНЫЕ ЧЕТЫРЕ УБРАТЬ НЕЛЬЗЯ");
/* Иначе можно остаться без рутины навсегда: вернуть её нечем. */
["task", "routine", "appt", "idea"].forEach(function (k) {
  T.ok(esc(typeDef(k).name) + " — без кнопки «убрать»",
    !new RegExp('data-act="typdel" data-v="' + k + '"').test(th));
});

T.head("СВОЙ ЛИШНИЙ ВИД УБРАТЬ МОЖНО");
S.types.push({ key: "old_choice", name: "выбрать / купить", hint: "", kind: "choice" });
openSettings();
T.ok("у него кнопка есть",
  /data-act="typdel" data-v="old_choice"/.test(host.innerHTML.replace(/\s+/g, " ")));
S.types = S.types.filter(function (t) { return t.key !== "old_choice"; });
DIRPAGE = null; dirBackup = null; closeModal();
T.reset();

T.done();
