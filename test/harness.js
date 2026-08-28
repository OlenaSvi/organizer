/* ── Поддельный DOM для прогонов в JavaScriptCore (osascript) ─────── */
var store = {};
globalThis.localStorage = {
  getItem: function (k) { return (k in store) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; },
};
globalThis.alert = function () {};
globalThis.confirm = function () { return true; };
globalThis.setTimeout = function () { return 0; };
globalThis.clearTimeout = function () {};
globalThis.setInterval = function () { return 0; };
globalThis.clearInterval = function () {};

function mkNode(id) {
  var n = {
    id: id || "", innerHTML: "", value: "", textContent: "", hidden: false,
    checked: false, className: "", scrollTop: 0, files: null,
    dataset: {}, style: {}, _l: {},
    addEventListener: function (t, f) { (this._l[t] = this._l[t] || []).push(f); },
    removeEventListener: function (t, f) {
      if (this._l[t]) this._l[t] = this._l[t].filter(function (g) { return g !== f; });
    },
    focus: function () {}, click: function () {}, remove: function () {},
    appendChild: function () {}, setAttribute: function () {}, removeAttribute: function () {},
    closest: function () { return null; },
    classList: { add: function () {}, remove: function () {} },
  };
  return n;
}
var NODES = {};
globalThis.document = {
  _l: {},
  addEventListener: function (t, f) { (this._l[t] = this._l[t] || []).push(f); },
  removeEventListener: function (t, f) {
    if (this._l[t]) this._l[t] = this._l[t].filter(function (g) { return g !== f; });
  },
  getElementById: function (id) { return NODES[id] || (NODES[id] = mkNode(id)); },
  createElement: function (tag) { return mkNode(""); },
  documentElement: { setAttribute: function () {}, removeAttribute: function () {} },
  body: mkNode("body"),
  querySelectorAll: function () { return []; },
};
globalThis.window = {
  _l: {},
  addEventListener: function (t, f) { (this._l[t] = this._l[t] || []).push(f); },
  removeEventListener: function (t, f) {
    if (this._l[t]) this._l[t] = this._l[t].filter(function (g) { return g !== f; });
  },
  scrollY: 0, scrollTo: function () {},
};

/* Клик «как из делегата»: собирает элемент с data-атрибутами и зовёт
   всех подписчиков document.click. attrs → dataset (act, id, v, ...). */
globalThis.clickOn = function (attrs) {
  var el = mkNode("");
  Object.keys(attrs).forEach(function (k) { el.dataset[k] = String(attrs[k]); });
  /* Кнопки этих действий в настоящей разметке живут ВНУТРИ выпадашки —
     closest("[data-ddwrap]") там истинен, иначе защита закрыла бы её. */
  var INDD = { dd:1, ddset:1, ddaddshow:1, ddaddgo:1, duequick:1, duepick:1,
               ddnav:1, hereset:1, allfilterset:1 };
  el.closest = function (sel) {
    if (sel === "[data-act]") return el;
    if (sel === "[data-ddwrap]" && INDD[attrs.act]) return el;
    return null;
  };
  var target = { closest: function (sel) { return el.closest(sel); } };
  (document._l.click || []).forEach(function (f) {
    f({ target: target, preventDefault: function () {}, stopPropagation: function () {} });
  });
};
