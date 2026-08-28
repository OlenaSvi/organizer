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
      i.done = false; i.doneAt = null;
    });
    S.todayOrder = null; S.hereNow = null; S.suggCollapsed = false;
    TAB = "today"; AXIS = "sphere"; S.open = [];
    ALLFILTER = "all"; ALLQUERY = ""; ALLSORT = "due";
    CALMODE = "week"; CALANCHOR = null;
    DD = null; DIRPAGE = null; DIREDIT = null;
    if (typeof closeModal === "function") closeModal();
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
