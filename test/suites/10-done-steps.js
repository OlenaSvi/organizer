/* Закрытый шаг попадает в «сделанное» за сегодня, а дело остаётся
   в списке со следующим шагом. */
T.seed();
var m = live().find(function (i) { return i.multi && i.steps.length > 1; });
m.steps = [{ text: "поставить апостиль" }, { text: "отправить" }, { text: "проверить" }];
addToToday(m);
render();

T.head("ЗАКРЫЛИ ПЕРВЫЙ ШАГ");
clickOn({ act: "toggle", id: m.id });
T.ok("шаг отмечен сделанным", m.steps[0].done === true);
T.ok("и знает свой день", m.steps[0].doneAt === today());
T.ok("дело осталось живым", !m.done && pickedToday(m));
var card = T.card(m.id);
T.ok("в карточке — уже следующий шаг",
  card.indexOf("отправить") >= 0 && card.indexOf("Шаг 2 из 3") >= 0);
T.ok("шаг виден в сделанном за сегодня",
  view.innerHTML.indexOf('data-act="undostep"') >= 0 &&
  T.visible(view.innerHTML).indexOf("поставить апостиль") >= 0);
T.ok("рядом видно, из какого он дела",
  T.visible(view.innerHTML).indexOf(m.title) >= 0);
T.ok("счётчик дня считает шаг сделанным",
  /сделано 1 из \d+/.test(T.visible(view.innerHTML)));

T.head("ЗАКРЫЛИ ВТОРОЙ");
clickOn({ act: "toggle", id: m.id });
T.ok("в сделанном две строки шагов",
  (view.innerHTML.match(/data-act="undostep"/g) || []).length === 2);
T.ok("в карточке третий шаг", T.card(m.id).indexOf("Шаг 3 из 3") >= 0);

T.head("ЗАКРЫЛИ ПОСЛЕДНИЙ — ДЕЛО ЗАКОНЧЕНО");
clickOn({ act: "toggle", id: m.id });
T.ok("дело сделано", m.done === true && m.doneAt === today());
T.ok("в сделанном одна строка — само дело, без шагов",
  (view.innerHTML.match(/data-act="undostep"/g) || []).length === 0 &&
  view.innerHTML.indexOf("doneline") >= 0);
T.ok("карточки в списке дел больше нет", T.card(m.id) === "");

T.head("ВОЗВРАТ ШАГА");
clickOn({ act: "toggle", id: m.id });          // вернули дело в работу
T.ok("дело снова живое", !m.done);
m.steps.forEach(function (s, k) { if (k < 2) { s.done = true; s.doneAt = today(); } });
m.steps[2].done = false; delete m.steps[2].doneAt;
render();
clickOn({ act: "undostep", id: m.id, i: "1" });
T.ok("второй шаг открыт заново", m.steps[1].done !== true);
T.ok("и убран из сделанного",
  (view.innerHTML.match(/data-act="undostep"/g) || []).length === 1);
T.ok("карточка показывает его снова", T.card(m.id).indexOf("Шаг 2 из 3") >= 0);

T.head("ВЧЕРАШНИЕ ШАГИ СЕГОДНЯ НЕ ПОКАЗЫВАЮТСЯ");
m.steps[0].doneAt = addDays(today(), -1);
render();
T.ok("в сегодняшнем сделанном их нет",
  (view.innerHTML.match(/data-act="undostep"/g) || []).length === 0);
T.reset();

T.done();
