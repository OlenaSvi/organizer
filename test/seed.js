/* Общие помощники для всех наборов проверок.
   Подключается между harness.js и логикой приложения. */

/* Пустое хранилище: приложение само создаёт шаблонные дела. */

/* Вызывается ПОСЛЕ загрузки логики — объявляем через globalThis,
   чтобы не спорить с "use strict" и порядком объявлений. */
globalThis.T = {
  /* Отчёт набора */
  R: [], BUGS: [],
  ok: function (name, cond, note) {
    this.R.push((cond ? "  ок   " : "  БАГ  ") + name + (note ? " — " + note : ""));
    if (!cond) this.BUGS.push(name);
  },
  head: function (title) { this.R.push(""); this.R.push("════ " + title + " ════"); },
  note: function (text) { this.R.push("  " + text); },
  done: function () {
    this.R.push("");
    this.R.push("═══ " + (this.BUGS.length
      ? this.BUGS.length + " ПРОБЛЕМ: " + this.BUGS.join("; ")
      : "проблем не найдено") + " ═══");
    return this.R.join("\n");
  },

  /* Чистое состояние: ничего не взято, ничего не отложено, важность
     по умолчанию, место «везде». Вызывать в начале каждой проверки. */
  reset: function () {
    S.items.forEach(function (i) {
      i.today = null; i.notToday = null; i.forceImp = undefined;
      i.working = false;                 // признак «в работе» — тоже состояние
      i.done = false; i.doneAt = null;
    });
    S.todayOrder = null; S.hereNow = null; S.suggCollapsed = false;
    TAB = "today"; AXIS = "sphere"; S.open = [];
    ALLFILTER = "all"; ALLQUERY = ""; ALLSORT = "due";
    CALMODE = "week"; CALANCHOR = null;
    DD = null; DIRPAGE = null; DIREDIT = null;
    if (typeof closeModal === "function") closeModal();
  },

  /* Набор дел для проверок. Тесты не должны зависеть от того, что
     приложение поставляет с собой: заводим своё и предсказуемое. */
  seed: function () {
    var mk = function (o) {
      return Object.assign({
        id: "f" + Math.random().toString(36).slice(2, 8), title: "", type: defaultType(),
        multi: false, spheres: ["Быт"], place: null, person: null, due: null, time: null,
        steps: [], options: [], routine: null, done: false, created: today(),
        notes: "", forceImp: null, today: null, notToday: null,
      }, o);
    };
    /* Виды дел — справочник пользователя, и «выбрать / купить» в
       стартовом наборе больше нет. Проверки не должны от этого зависеть:
       если вида с нужным поведением нет, заводим свой. */
    var kind = function (k) {
      var t = S.types.find(function (x) { return x.kind === k; });
      if (!t) { t = { key: "test_" + k, name: "проверочный " + k, hint: "", kind: k };
        S.types.push(t); }
      return t.key;
    };
    S.items = [
      mk({ title: "Оплатить счёт", spheres: ["бюрократия"] }),
      mk({ title: "Купить лампочки", type: kind("choice"), spheres: ["Быт"], place: "Кипр" }),
      mk({ title: "Съездить на почту", type: "errand", spheres: ["другое"], place: "Кипр",
           multi: true, steps: [{ text: "найти номер", done: false },
                                { text: "доехать", done: false }] }),
      mk({ title: "Записаться к врачу", spheres: ["здоровье физическое"], person: "Мама" }),
      mk({ title: "Разобрать шкаф", spheres: ["Быт"] }),
      mk({ title: "Найти курсы", spheres: ["развитие"] }),
      /* Все дни: иначе проверки «Сегодня» падали бы по выходным —
         рутина на пн–пт в субботу законно не показывается. */
      mk({ title: "Зарядка", type: kind("routine"), spheres: ["здоровье физическое"],
           routine: { days: [0, 1, 2, 3, 4, 5, 6], history: [] } }),
      mk({ title: "Чтение", type: kind("routine"), spheres: ["развитие"],
           routine: { days: [0, 1, 2, 3, 4, 5, 6], history: [] } }),
      mk({ title: "Приём у врача", type: kind("appt"), spheres: ["здоровье физическое"],
           place: "Амстердам", due: addDays(today(), 3), time: "10:30",
           notes: "взять страховку" }),
      mk({ title: "Подумать про курсы", type: kind("idea"), spheres: ["развитие"] }),
    ];
    S.todayOrder = null;
    this.reset();
  },

  /* Живые дела без рутин, идей и встреч. */
  tasks: function () {
    return live().filter(function (i) {
      return !isRoutine(i) && !isIdea(i) && !isAppt(i);
    });
  },
  routine: function () { return live().filter(isRoutine)[0]; },
  appt: function () {
    var a = S.items.find(function (i) { return isAppt(i) && !i.draft; });
    if (a) { a.done = false; a.doneAt = null; delete a.autoDone; }
    return a;
  },

  /* Видимый текст экрана: без тегов и без содержимого атрибутов. */
  visible: function (html) {
    return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  },
  /* Разметка одной карточки «Сегодня» по id дела. */
  card: function (id) {
    var parts = view.innerHTML.split(/<div class="card\s/);
    for (var k = 1; k < parts.length; k++)
      if (parts[k].indexOf('data-id="' + id + '"') >= 0) return parts[k];
    return "";
  },
};
