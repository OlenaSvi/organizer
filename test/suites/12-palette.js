/* Цвета веток должны различаться на глаз: в палитре не должно быть
   двух близких оттенков, иначе разные сферы выглядят одинаково. */
T.seed();

/* Достаём палитру из собранного файла — она живёт в CSS. */
var CSS = (function () {
  try {
    ObjC.import("Foundation");
    return $.NSString.stringWithContentsOfFileEncodingError(
      "Организатор.html", 4, null).js;
  } catch (e) { return ""; }
})();

function slots(prefix) {
  var out = [], m, re = new RegExp("--" + prefix + "-(\\d):\\s*(#[0-9a-f]{6})", "gi");
  while ((m = re.exec(CSS))) { if (!out[+m[1]]) out[+m[1]] = m[2]; }
  return out.filter(Boolean);
}
function rgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16)];
}
/* Две меры сразу: расстояние в RGB ловит общую похожесть, а разница
   тона — случай «два разных оранжевых», который RGB прощает. */
function dist(a, b) {
  var x = rgb(a), y = rgb(b);
  var rm = (x[0] + y[0]) / 2;
  var dr = x[0] - y[0], dg = x[1] - y[1], db = x[2] - y[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}
function hsl(hex) {
  var c = rgb(hex).map(function (v) { return v / 255; });
  var mx = Math.max.apply(null, c), mn = Math.min.apply(null, c), d = mx - mn;
  var l = (mx + mn) / 2;
  var s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  var h = 0;
  if (d) {
    if (mx === c[0]) h = 60 * (((c[1] - c[2]) / d) % 6);
    else if (mx === c[1]) h = 60 * ((c[2] - c[0]) / d + 2);
    else h = 60 * ((c[0] - c[1]) / d + 4);
  }
  return { h: (h + 360) % 360, s: s, l: l };
}
function tooClose(a, b) {
  if (dist(a, b) < 55) return "почти совпадают";
  var A = hsl(a), B = hsl(b);
  var dh = Math.abs(A.h - B.h); if (dh > 180) dh = 360 - dh;
  if (dh < 18 && A.s > 0.25 && B.s > 0.25)
    return "один тон (" + Math.round(dh) + "°)";
  return "";
}

T.head("ПАЛИТРА СФЕР — СВЕТЛАЯ ТЕМА");
var light = slots("sph").slice(0, 8);
T.ok("восемь слотов", light.length === 8, light.join(" "));
var close = [];
for (var i = 0; i < light.length; i++)
  for (var j = i + 1; j < light.length; j++) {
    var why = tooClose(light[i], light[j]);
    if (why) close.push(light[i] + " ≈ " + light[j] + " — " + why);
  }
T.ok("нет двух похожих цветов", close.length === 0, close.join(", "));

T.head("ПАЛИТРА СФЕР — ТЁМНАЯ ТЕМА");
var darkCSS = CSS.slice(CSS.indexOf('data-theme="dark"'));
var dark = [], md, red = /--sph-(\d):\s*(#[0-9a-f]{6})/gi;
while ((md = red.exec(darkCSS)) && dark.length < 8) dark.push(md[2]);
T.ok("восемь слотов", dark.length === 8, dark.join(" "));
var closeD = [];
for (var i2 = 0; i2 < dark.length; i2++)
  for (var j2 = i2 + 1; j2 < dark.length; j2++) {
    var w2 = tooClose(dark[i2], dark[j2]);
    if (w2) closeD.push(dark[i2] + " ≈ " + dark[j2] + " — " + w2);
  }
T.ok("нет двух похожих цветов", closeD.length === 0, closeD.join(", "));

T.head("КАЖДОЙ ВЕТКЕ — СВОЙ СЛОТ");
var used = S.spheres.map(function (sp) { return colorOf("sphere", sp); });
T.ok("цвета не повторяются", used.length === new Set(used).size,
  S.spheres.length + " сфер, " + new Set(used).size + " разных цветов");

T.head("ЦВЕТА ВИДОВ ДЕЛ ТОЖЕ РАЗЛИЧИМЫ");
var kinds = [];
["appt", "go", "buy", "idea", "routine", "do"].forEach(function (k) {
  var m2 = new RegExp("--kind-" + k + ":\\s*(#[0-9a-f]{6})", "i").exec(CSS);
  if (m2) kinds.push(m2[1]);
});
var closeK = [];
for (var a = 0; a < kinds.length; a++)
  for (var b = a + 1; b < kinds.length; b++)
    if (tooClose(kinds[a], kinds[b])) closeK.push(kinds[a] + " ≈ " + kinds[b]);
T.ok("виды дел различимы", closeK.length === 0, closeK.join(", "));

T.done();
