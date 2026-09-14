/* Аккаунт и синхронизация. Сеть подменена: поддельный Supabase отвечает
   ровно на те несколько адресов, что зовёт приложение.

   Главные правила, которые здесь закреплены:
   — без ключей проекта раздела «Аккаунт» нет вовсе, а save() ничего
     не шлёт;
   — без входа всё работает как раньше, данные никуда не уходят;
   — данные с устройства никогда не затираются молча: перед тем как
     заменить их облаком, копия ложится в organizer.v1.backup, а если
     на устройстве своё и в облаке своё — приложение спрашивает;
   — обрыв связи — не ошибка: сохраняем здесь, отправим потом.       */

function fakeCloud() {
  var users = {}, states = {}, tokens = {}, refresh = {}, log = [], n = 0;
  function session(u) {
    n++; var at = "at" + n, rt = "rt" + n;
    tokens[at] = u.id; refresh[rt] = u;
    return { access_token: at, refresh_token: rt, expires_in: 3600,
             token_type: "bearer", user: { id: u.id, email: u.email } };
  }
  function resp(status, body) {
    return Promise.resolve({ ok: status < 300, status: status,
      json: function () { return Promise.resolve(body); } });
  }
  var api = { users: users, states: states, log: log, offline: false,
    expireAll: function () { tokens = {}; },
    confirmFirst: false,
    fetch: function (url, opt) {
      opt = opt || {};
      var m = opt.method || "GET", h = opt.headers || {};
      var body = opt.body ? JSON.parse(opt.body) : null;
      log.push(m + " " + url.replace(/^https?:\/\/[^/]+/, ""));
      if (api.offline) return Promise.reject(new Error("Failed to fetch"));
      if (h.apikey !== "anon-key") return resp(401, { message: "No API key found" });

      if (url.indexOf("/auth/v1/signup") >= 0) {
        if (users[body.email]) return resp(422, { code: "user_already_exists", msg: "User already registered" });
        var u = { id: "uid-" + body.email, email: body.email, password: body.password };
        users[body.email] = u;
        if (api.confirmFirst) return resp(200, { id: u.id, email: u.email });
        return resp(200, session(u));
      }
      if (url.indexOf("grant_type=password") >= 0) {
        var u2 = users[body.email];
        if (!u2 || u2.password !== body.password)
          return resp(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
        return resp(200, session(u2));
      }
      if (url.indexOf("grant_type=refresh_token") >= 0) {
        var u3 = refresh[body.refresh_token];
        if (!u3) return resp(400, { error: "invalid_grant", error_description: "Refresh Token Not Found" });
        delete refresh[body.refresh_token];
        return resp(200, session(u3));
      }
      if (url.indexOf("/auth/v1/logout") >= 0) return resp(204, null);
      if (url.indexOf("/auth/v1/recover") >= 0) return resp(200, {});

      if (url.indexOf("/rest/v1/states") >= 0) {
        var tok = String(h.Authorization || "").replace("Bearer ", "");
        var uid = tokens[tok];
        if (!uid) return resp(401, { message: "JWT expired" });
        if (m === "GET") return resp(200, states[uid] ? [states[uid]] : []);
        if (m === "POST") {                       // upsert
          if (body.user_id !== uid) return resp(403, { message: "row-level security" });
          states[uid] = body; return resp(201, [body]);
        }
        if (m === "PATCH") {                      // условное обновление по rev
          var want = /rev=eq\.(\d+)/.exec(url);
          var cur = states[uid];
          if (!cur || !want || String(cur.rev) !== want[1]) return resp(200, []);
          Object.assign(cur, body); return resp(200, [cur]);
        }
      }
      return resp(404, { message: "no such route" });
    } };
  return api;
}

var srv = fakeCloud();
function onCloud() { CLOUD.url = "https://x.supabase.co"; CLOUD.key = "anon-key"; CLOUDFETCH = srv.fetch; }
function offCloud() { CLOUD.url = ""; CLOUD.key = ""; CLOUDFETCH = null; }
function field(id, v) { document.getElementById(id).value = v; }
function backup() { try { return JSON.parse(localStorage.getItem("organizer.v1.backup")); } catch (e) { return null; } }
function titles() { return S.items.map(function (i) { return i.title; }).sort().join("|"); }

(async function () {
  T.seed();
  cloudForget();                    // никакой сессии от прошлых прогонов

  T.head("БЕЗ КЛЮЧЕЙ ПРОЕКТА АККАУНТА НЕТ");
  offCloud();
  openSettings();
  T.ok("раздела «Аккаунт» в настройках нет", host.innerHTML.indexOf("accEmail") < 0);
  closeModal();
  cloudTouch(); await cloudPush();
  T.ok("save() ничего не шлёт", srv.log.length === 0);

  T.head("БЕЗ ВХОДА ПРИЛОЖЕНИЯ НЕТ — ТОЛЬКО ЭКРАН ВХОДА");
  onCloud();
  TAB = "today"; render();
  T.ok("вместо дел — экран входа", view.innerHTML.indexOf('id="gate"') >= 0
    && view.innerHTML.indexOf("todayhead") < 0);
  T.ok("на нём почта, пароль и кнопка «Войти»",
    view.innerHTML.indexOf("accEmail") >= 0 && view.innerHTML.indexOf('data-act="cloudin"') >= 0);
  T.ok("подписи над полями и «показать пароль»", view.innerHTML.indexOf("Почта:") >= 0
    && view.innerHTML.indexOf("Пароль:") >= 0 && view.innerHTML.indexOf('data-act="showpass"') >= 0);
  T.ok("ссылки «Забыли пароль?» и «Нет аккаунта? Зарегистрироваться»",
    view.innerHTML.indexOf('data-act="cloudrecover"') >= 0
    && view.innerHTML.indexOf('data-act="gatemode" data-v="up"') >= 0
    && view.innerHTML.indexOf('data-act="cloudup"') < 0);
  clickOn({ act: "gatemode", v: "up" });
  T.ok("по ссылке открывается регистрация: заголовок, кнопка и путь назад",
    view.innerHTML.indexOf("Регистрация") >= 0 && view.innerHTML.indexOf('data-act="cloudup"') >= 0
    && view.innerHTML.indexOf('data-act="gatemode" data-v="in"') >= 0
    && view.innerHTML.indexOf('data-act="cloudin"') < 0);
  clickOn({ act: "gatemode", v: "in" });
  T.ok("и обратно ко входу", view.innerHTML.indexOf('data-act="cloudin"') >= 0);
  T.ok("«показать пароль» меняет поле, не перерисовывая экран", (function () {
    var p = document.getElementById("accPass"); p.type = "password"; p.value = "тайна";
    clickOn({ act: "showpass" }); var shown = p.type === "text" && p.value === "тайна";
    clickOn({ act: "showpass" }); return shown && p.type === "password"; })());
  T.ok("вкладок нет", document.getElementById("tabs").innerHTML === "");
  T.ok("кнопки аккаунта в шапке нет — входить негде, кроме экрана",
    document.getElementById("acctBtn").hidden === true);
  ["calendar", "map", "matrix", "all"].forEach(function (tab) {
    TAB = tab; render();
    T.ok("экран «" + TABS[tab] + "» без входа тоже закрыт", view.innerHTML.indexOf('id="gate"') >= 0);
  });
  TAB = "today";
  var before = titles();
  cloudTouch(); await cloudPush();
  T.ok("без сессии ничего не уходит", srv.log.length === 0);
  T.ok("и данные на устройстве не тронуты", titles() === before);
  clickOn({ act: "settings" }); clickOn({ act: "cap" }); clickOn({ act: "inbox" });
  T.ok("без входа ни настройки, ни новое дело не открываются", host.innerHTML === "");
  T.ok("язык можно сменить прямо на экране входа", (function () {
    clickOn({ act: "lang", v: "en" }); var en = view.innerHTML.indexOf("Sign in") >= 0;
    clickOn({ act: "lang", v: "ru" }); return en && view.innerHTML.indexOf("Войти") >= 0; })());

  T.head("РЕГИСТРАЦИЯ: СВОИ ДЕЛА УЕЗЖАЮТ В ПУСТОЕ ОБЛАКО");
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignUp();
  T.ok("сессия сохранена", !!cloudSession() && cloudSession().user.email === "e@test.ru");
  T.ok("в облаке появилась запись", !!srv.states["uid-e@test.ru"]);
  T.ok("и в ней ровно мои дела",
    srv.states["uid-e@test.ru"].data.items.length === S.items.length);
  T.ok("ревизия 1", srv.states["uid-e@test.ru"].rev === 1);
  T.ok("экран входа ушёл, дела на месте", view.innerHTML.indexOf('id="gate"') < 0
    && view.innerHTML.indexOf("todayhead") >= 0);
  T.ok("в шапке появилась кнопка аккаунта — иконка человека, почта в подсказке",
    document.getElementById("acctBtn").hidden === false
    && /<svg/.test(document.getElementById("acctBtn").innerHTML)
    && document.getElementById("acctBtn").title.indexOf("e@test.ru") >= 0);
  clickOn({ act: "account" });
  T.ok("кнопка открывает своё окно: кто вошёл и «Выйти»",
    host.innerHTML.indexOf("e@test.ru") >= 0 && host.innerHTML.indexOf('data-act="cloudout"') >= 0);
  closeModal();
  openSettings();
  T.ok("в настройках аккаунта больше нет — он живёт отдельно", host.innerHTML.indexOf("accEmail") < 0
    && host.innerHTML.indexOf('data-act="cloudout"') < 0);
  closeModal();

  T.head("ПРАВКА → ОТПРАВКА");
  S.items[0].title = "Переименовано на ноутбуке"; save();
  T.ok("после save() есть что отправить", cloudDirty());
  await cloudPush();
  T.ok("ревизия выросла", srv.states["uid-e@test.ru"].rev === 2);
  T.ok("в облаке новое название",
    srv.states["uid-e@test.ru"].data.items[0].title === "Переименовано на ноутбуке");
  T.ok("больше нечего отправлять", !cloudDirty());

  T.head("ВЫХОД: ДАННЫЕ ОСТАЮТСЯ, ЭКРАН ВХОДА ВОЗВРАЩАЕТСЯ");
  var mine = titles();
  await cloudSignOut();
  T.ok("сессии нет", !cloudSession());
  T.ok("дела на устройстве целы", titles() === mine);
  T.ok("снова экран входа", view.innerHTML.indexOf('id="gate"') >= 0);

  T.head("ВХОД НА ЧИСТОМ УСТРОЙСТВЕ: ОБЛАКО БЕРЁТСЯ МОЛЧА");
  /* Чистое устройство — только примеры первого запуска. */
  var keep = JSON.parse(JSON.stringify(S));
  S.items = templateItems(); normalizeItems(); save();
  T.ok("устройство считается чистым", cloudFresh());
  render();
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignIn();
  T.ok("вопросов не задано", !cloudPending());
  T.ok("на устройстве теперь дела из облака",
    S.items.some(function (i) { return i.title === "Переименовано на ноутбуке"; }));
  closeModal();

  T.head("НЕВЕРНЫЙ ПАРОЛЬ — СЛОВАМИ, БЕЗ ПОЛОМКИ");
  await cloudSignOut();
  field("accEmail", "e@test.ru"); field("accPass", "wrong");
  await cloudSignIn();
  T.ok("сессии нет", !cloudSession());
  T.ok("причина названа по-человечески на экране входа",
    view.innerHTML.indexOf("Почта или пароль не подошли") >= 0, cloudNote());

  T.head("ВХОД, КОГДА И ЗДЕСЬ СВОЁ, И В ОБЛАКЕ СВОЁ: СПРАШИВАЕМ");
  S.items = keep.items.map(function (i) { return Object.assign({}, i, { title: i.title + " (айпад)" }); });
  normalizeItems(); save();
  T.ok("устройство не чистое", !cloudFresh());
  render();
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignIn();
  T.ok("вошли", !!cloudSession());
  T.ok("приложение спрашивает, что оставить", cloudPending()
    && host.innerHTML.indexOf('data-act="cloudkeep"') >= 0);
  T.ok("ничего ещё не тронуто", S.items.every(function (i) { return /айпад/.test(i.title); }));
  T.ok("и ничего не отправлено", srv.states["uid-e@test.ru"].rev === 2);

  T.head("ВЫБОР «ВЗЯТЬ ИЗ ОБЛАКА»: КОПИЯ ОСТАЁТСЯ");
  await cloudKeep("cloud");
  T.ok("вопрос снят", !cloudPending());
  T.ok("на устройстве данные облака",
    S.items.some(function (i) { return i.title === "Переименовано на ноутбуке"; }));
  T.ok("прежние данные устройства лежат в копии",
    backup() && backup().items.every(function (i) { return /айпад/.test(i.title); }));
  T.ok("экраны рисуются", (TAB = "today", render(), view.innerHTML.length > 200));

  T.head("ВЫБОР «ОСТАВИТЬ ЭТО УСТРОЙСТВО»: ОБЛАКО ПЕРЕПИСЫВАЕТСЯ");
  await cloudSignOut();
  S.items = keep.items.map(function (i) { return Object.assign({}, i, { title: i.title + " (айпад)" }); });
  normalizeItems(); save();
  render();
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignIn();
  T.ok("снова спрашивает", cloudPending());
  await cloudKeep("device");
  T.ok("в облаке теперь данные устройства",
    srv.states["uid-e@test.ru"].data.items.every(function (i) { return /айпад/.test(i.title); }));
  T.ok("ревизия выросла", srv.states["uid-e@test.ru"].rev === 3);
  closeModal();

  T.head("В ОБЛАКЕ ЛИШЬ НЕТРОНУТЫЕ ПРИМЕРЫ — СВОЁ ВАЖНЕЕ, НЕ СПРАШИВАЕМ");
  /* Зарегистрировались на сайте, где были только примеры, а потом
     открыли свой файл с настоящими делами: примеры в облаке — ничьи. */
  await cloudSignOut();
  var real = JSON.parse(JSON.stringify(S));
  var tmplState = JSON.parse(JSON.stringify(S)); tmplState.items = templateItems();
  srv.states["uid-e@test.ru"] = { user_id: "uid-e@test.ru", data: tmplState, rev: 7,
    updated_at: new Date().toISOString(), device: "" };
  render();
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignIn();
  T.ok("вопроса нет", !cloudPending());
  T.ok("на устройстве остались настоящие дела", titles() === real.items.map(function (i) { return i.title; }).sort().join("|"));
  T.ok("а в облако уехали они же, поверх примеров",
    srv.states["uid-e@test.ru"].rev === 8
    && srv.states["uid-e@test.ru"].data.items.every(function (i) { return /айпад/.test(i.title); }));

  T.head("В ОБЛАКЕ ПОЯВИЛОСЬ НОВЕЕ: ПОДТЯГИВАЕМ");
  /* Другое устройство записало ревизию 4. */
  var other = JSON.parse(JSON.stringify(srv.states["uid-e@test.ru"]));
  other.rev = other.rev + 1; other.data.items[0].title = "С другого устройства";
  srv.states["uid-e@test.ru"] = other;
  await cloudSync("focus");
  T.ok("подтянули", S.items[0].title === "С другого устройства");
  T.ok("копия прежнего состояния сохранена", !!backup());
  T.ok("наша метка ревизии обновилась", cloudMark().rev === other.rev);

  T.head("КОНФЛИКТ: ПРАВИЛИ ЗДЕСЬ, А ОБЛАКО УШЛО ВПЕРЁД");
  S.items[1].title = "Правка на этом устройстве"; save();
  var other2 = JSON.parse(JSON.stringify(srv.states["uid-e@test.ru"]));
  other2.rev = other2.rev + 1; other2.data.items[2].title = "Правка на другом устройстве";
  srv.states["uid-e@test.ru"] = other2;
  await cloudPush();
  T.ok("облако победило", S.items[2].title === "Правка на другом устройстве"
    && S.items[1].title !== "Правка на этом устройстве");
  T.ok("моя правка не пропала — она в копии",
    backup().items[1].title === "Правка на этом устройстве");
  T.ok("приложение сказало об этом словами", /новее/.test(cloudNote()), cloudNote());

  T.head("ПРОТУХШИЙ ТОКЕН ОБНОВЛЯЕТСЯ САМ");
  srv.expireAll();
  S.items[0].title = "После протухания"; save();
  var logAt = srv.log.length;
  await cloudPush();
  T.ok("сходили за новым токеном",
    srv.log.slice(logAt).some(function (l) { return /refresh_token/.test(l); }));
  T.ok("и отправили", srv.states["uid-e@test.ru"].data.items[0].title === "После протухания");
  T.ok("сессия жива", !!cloudSession());

  T.head("НЕТ СВЯЗИ — НЕ ОШИБКА");
  srv.offline = true;
  S.items[0].title = "Правка без сети"; save();
  await cloudPush();
  T.ok("правка осталась ждать отправки", cloudDirty());
  T.ok("сказано, что связи нет", /связи/.test(cloudNote()), cloudNote());
  T.ok("сессия не сброшена", !!cloudSession());
  srv.offline = false;
  await cloudPush();
  T.ok("связь вернулась — отправилось",
    srv.states["uid-e@test.ru"].data.items[0].title === "Правка без сети" && !cloudDirty());

  T.head("РЕГИСТРАЦИЯ С ПОДТВЕРЖДЕНИЕМ ПО ПОЧТЕ");
  await cloudSignOut();
  srv.confirmFirst = true;
  field("accEmail", "new@test.ru"); field("accPass", "secret-2");
  await cloudSignUp();
  T.ok("сессии пока нет", !cloudSession());
  T.ok("сказано проверить почту", /почт/.test(cloudNote()), cloudNote());
  srv.confirmFirst = false;

  T.head("ПОВТОРНАЯ РЕГИСТРАЦИЯ ТОЙ ЖЕ ПОЧТЫ");
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignUp();
  T.ok("объяснено, что аккаунт уже есть", /уже есть/.test(cloudNote()), cloudNote());

  T.head("ПО-АНГЛИЙСКИ ЭКРАН ВХОДА И ОКНО АККАУНТА ПЕРЕВЕДЕНЫ");
  S.cfg.lang = "en"; setLang(); render();
  var ru = /[А-Яа-яЁё][А-Яа-яЁё «».,:;!?()-]*/g, m, left = [];
  while ((m = ru.exec(view.innerHTML))) if (m[0].trim().length > 1 && m[0].trim() !== "Русский") left.push(m[0].trim());
  T.ok("кириллицы на экране входа нет", left.length === 0, left.join(" | "));
  field("accEmail", "e@test.ru"); field("accPass", "secret-1");
  await cloudSignIn();
  clickOn({ act: "account" });
  left = [];
  while ((m = ru.exec(host.innerHTML))) if (m[0].trim().length > 1) left.push(m[0].trim());
  T.ok("кириллицы в окне аккаунта нет", left.length === 0, left.join(" | "));
  closeModal();
  S.cfg.lang = "ru"; setLang();

  offCloud(); cloudForget(); T.reset();
  /* Набор асинхронный: итог печатаем сами — значение промиса прогон
     не увидит. */
  console.log(T.done());
})().catch(function (e) { T.ok("проверка упала с ошибкой", false, String(e && e.stack || e)); console.log(T.done()); });
