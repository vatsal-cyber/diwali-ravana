/* Find the Ravana: a Diwali party game. TV runs the show, phones hold the secrets. */
"use strict";

/* ================= config ================= */
var CFG = {
  short: "tinyurl.com/ravanatv",
  maxP: 8, minP: 3,
  awayMs: 25000, hbMs: 8000, annMs: 4000,
  peekMs: 40000, turnMs: 25000, voteMs: 45000, guessMs: 35000, afterGuessMs: 8000, autoMs: 1300,
  saveHours: 6
};
if (window.RAVANA_CFG) Object.assign(CFG, window.RAVANA_CFG);
var BROKERS = window.RAVANA_BROKERS || [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
  "wss://mqtt.eclipseprojects.io:443/mqtt"
];
var ROOT = "diwali-ravana-v2/";
var JOIN_URL = location.href.split("#")[0].split("?")[0];

var WORDS = {
  "Sweets": ["Ladoo", "Jalebi", "Gulab jamun", "Kaju katli", "Barfi", "Rasmalai", "Soan papdi", "Peda", "Rasgulla", "Gujiya", "Halwa", "Mysore pak"],
  "Snacks": ["Samosa", "Chakli", "Namak pare", "Kachori", "Chivda", "Mathri", "Shakarpara", "Pakora", "Bhujia"],
  "Decorations": ["Diya", "Rangoli", "Marigold garland", "Fairy lights", "Paper lantern", "Toran", "Candles", "Flower petals", "Akash kandil"],
  "Fireworks": ["Sparkler", "Flowerpot", "Rocket", "Ground spinner", "Snake tablet", "Bijli bomb", "Roman candle", "Atom bomb"],
  "The Ramayana": ["Rama", "Sita", "Hanuman", "Lakshmana", "Ayodhya", "Golden deer", "Pushpak Vimana", "Lanka", "Bow and arrow"],
  "Puja": ["Lakshmi puja", "Aarti", "Tilak", "Kalash", "Incense", "Prasad", "Coconut", "Puja bell", "Ganesha idol"],
  "Festival days": ["Dhanteras", "Choti Diwali", "Govardhan puja", "Bhai Dooj", "Annakut", "Diwali night"],
  "Party time": ["New clothes", "Card party", "Gift box", "Dhol", "Dance-off", "Group selfie", "Cleaning the house", "Gold coins", "Dry fruit box"]
};
var AVATARS = [
  { g: "diya", c: "#D98E26" }, { g: "lotus", c: "#C9577F" }, { g: "moon", c: "#4E5BB8" }, { g: "spark", c: "#2F84B8" },
  { g: "kite", c: "#2E9781" }, { g: "lantern", c: "#C24C38" }, { g: "marigold", c: "#D9741F" }, { g: "mango", c: "#5E9433" },
  { g: "bell", c: "#8E68C9" }, { g: "dhol", c: "#A65B3E" }, { g: "ladoo", c: "#B8892A" }, { g: "feather", c: "#22808F" }
];
var GLYPHS = {
  diya: '<path d="M0,-18 C5,-11 6,-6 3.5,-2.5 C2,-.5 -2,-.5 -3.5,-2.5 C-6,-6 -5,-11 0,-18Z"/><path d="M-17,3 Q0,1 17,3 Q14,15 0,16 Q-14,15 -17,3Z"/>',
  lotus: '<path d="M0,-17 C6,-9 6,3 0,10 C-6,3 -6,-9 0,-17Z"/><path transform="rotate(-42 0 10)" d="M0,-9 C5,-3 5,5 0,10 C-5,5 -5,-3 0,-9Z"/><path transform="rotate(42 0 10)" d="M0,-9 C5,-3 5,5 0,10 C-5,5 -5,-3 0,-9Z"/><ellipse cy="14" rx="14" ry="2.6"/>',
  moon: '<path d="M3,-16 A16,16 0 1 0 16,3 A12.5,12.5 0 1 1 3,-16Z"/><path d="M10,-13 l1.2,3 3,1.2 -3,1.2 -1.2,3 -1.2,-3 -3,-1.2 3,-1.2Z"/>',
  spark: '<path d="M-2,-17 C0,-5 4,-2 15,0 C4,2 0,5 -2,17 C-4,5 -8,2 -19,0 C-8,-2 -4,-5 -2,-17Z"/><path d="M12,-15 C12.6,-11.5 13.5,-10.6 17,-10 C13.5,-9.4 12.6,-8.5 12,-5 C11.4,-8.5 10.5,-9.4 7,-10 C10.5,-10.6 11.4,-11.5 12,-15Z"/>',
  kite: '<path d="M0,-18 L13,-3 L0,13 L-13,-3Z"/><path d="M0,13 q-5,4 0,7 q5,3 0,6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M0,-18 L0,13 M-13,-3 L13,-3" stroke="var(--c)" stroke-width="1.8"/>',
  lantern: '<rect x="-1.2" y="-21" width="2.4" height="5"/><path d="M-6,-16 H6 L13,-3 L7,11 H-7 L-13,-3Z"/><path d="M-13,-3 H13 M-6,-16 L-7,11 M6,-16 L7,11" stroke="var(--c)" stroke-width="1.6"/><path d="M-4,11 v8 M0,11 v10 M4,11 v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  marigold: '<g>' + (function () { var o = ""; for (var i = 0; i < 8; i++) o += '<path transform="rotate(' + (i * 45) + ')" d="M0,-4 C5,-8 5,-16 0,-19 C-5,-16 -5,-8 0,-4Z"/>'; for (var j = 0; j < 8; j++) o += '<path transform="rotate(' + (j * 45 + 22.5) + ')" opacity=".7" d="M0,-4 C4,-7 4,-13 0,-15 C-4,-13 -4,-7 0,-4Z"/>'; return o; })() + '</g><circle r="5.2" style="fill:var(--c)"/><circle r="2.6"/>',
  mango: '<path d="M-1,-15 C10,-11 16,-1 13,8 C10,17 -7,18 -12,9 C-16,1 -11,-9 -1,-15Z"/><path d="M-1,-15 C1,-20 7,-22 11,-19 C8,-15 3,-14 -1,-15Z"/>',
  bell: '<rect x="-2" y="-21" width="4" height="6" rx="1"/><path d="M0,-16 C8,-16 10,-9 10,-1 L14,8 H-14 L-10,-1 C-10,-9 -8,-16 0,-16Z"/><circle cy="12.5" r="3.4"/>',
  dhol: '<path d="M-16,-9 Q0,-13 16,-9 V9 Q0,13 -16,9Z"/><path d="M-11,-10 L-6,10 L0,-11 L6,10 L11,-10" fill="none" stroke="var(--c)" stroke-width="2"/><ellipse cx="-16" rx="3" ry="9"/><ellipse cx="16" rx="3" ry="9"/>',
  ladoo: '<circle cx="-7.5" cy="7" r="7.5"/><circle cx="7.5" cy="7" r="7.5"/><circle cy="-6" r="7.5"/><g style="fill:var(--c)"><circle cx="-9" cy="5" r="1.2"/><circle cx="6" cy="9" r="1.2"/><circle cx="2" cy="-8" r="1.2"/><circle cx="-2" cy="-4" r="1"/></g>',
  feather: '<path d="M0,-19 C10,-10 11,3 0,14 C-11,3 -10,-10 0,-19Z"/><ellipse cy="-3" rx="5.5" ry="7.5" style="fill:var(--c)"/><ellipse cy="-2" rx="3" ry="4.2"/><path d="M0,14 V22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
};

/* ================= utils ================= */
function now() { return Date.now(); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function rid(n) { var s = ""; while (s.length < (n || 8)) s += Math.random().toString(36).slice(2); return s.slice(0, n || 8); }
function lsGet(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
function ssGet(k) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function ssSet(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pad2(n) { return ("0" + n).slice(-2); }
function tsec(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? Math.floor(s / 60) + ":" + pad2(s % 60) : String(s); }
function fnv(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }
function normWord(s) {
  s = String(s || "").toLowerCase();
  try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) { }
  return s.replace(/[^a-z0-9]/g, "");
}
function lev(a, b) {
  var m = a.length, n = b.length, d = [], i, j;
  for (i = 0; i <= m; i++) d[i] = [i];
  for (j = 0; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function judgeGuess(g, word) {
  var a = normWord(g), b = normWord(word);
  if (!a) return false;
  if (a === b || a.replace(/s$/, "") === b.replace(/s$/, "")) return true;
  var tol = b.length <= 4 ? 0 : (b.length <= 8 ? 1 : 2);
  return lev(a, b) <= tol;
}
var IS_TOUCH = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
var REDUCED = false;
try { REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { }
function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

var S = { view: "home", cache: {}, ckey: {}, emoji: true, holding: false, disc: null, lan: null };

function emojiSupport() {
  try {
    var c = document.createElement("canvas"); c.width = c.height = 40;
    var x = c.getContext("2d"); x.textBaseline = "top"; x.font = "32px sans-serif"; x.fillText("🪔", 0, 0);
    var d = x.getImageData(0, 0, 40, 40).data, colored = 0;
    for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 40 && (Math.abs(d[i] - d[i + 1]) > 40 || Math.abs(d[i] - d[i + 2]) > 40)) colored++;
    return colored > 20;
  } catch (e) { return true; }
}

/* ================= art ================= */
function petal(r, len, w) {
  var a = -r - len / 2, b = -r + len / 2, q1 = -r - len / 4, q2 = -r + len / 4, h = w / 2;
  return "M0," + a + " C" + h + "," + q1 + " " + h + "," + q2 + " 0," + b + " C" + (-h) + "," + q2 + " " + (-h) + "," + q1 + " 0," + a + "Z";
}
var RLAYERS = [
  { dot: 46, c: "#FFB22E" },
  { r: 96, n: 8, len: 112, w: 58, c: "#F2367D" },
  { r: 206, n: 12, len: 118, w: 52, c: "#FFB22E" },
  { r: 300, n: 16, len: 80, w: 38, c: "#19B3A3" },
  { r: 362, dots: 32, d: 9, c: "#FFF3DF" },
  { r: 420, n: 24, len: 70, w: 30, c: "#F2367D" },
  { r: 480, dots: 48, d: 7, c: "#FFB22E" }
];
function rangoli(mode, cls) {
  var out = '<svg class="' + (cls || "") + '" viewBox="-500 -500 1000 1000" aria-hidden="true">';
  RLAYERS.forEach(function (L, li) {
    if (mode === "gold") { L = Object.assign({}, L, { c: li % 2 ? "#F2B544" : "#FBF1DF" }); mode = "fillg"; }
    if (mode === "fillg") L = Object.assign({}, L, { c: li % 2 ? "#F2B544" : "#FBF1DF" });
    var st = mode === "draw" ? ' fill="none" stroke="' + L.c + '" stroke-width="6" pathLength="1" style="animation-delay:' + (li * 0.22).toFixed(2) + 's"' : ' fill="' + L.c + '"';
    if (L.dot) { out += '<circle r="' + L.dot + '"' + st + '/>'; return; }
    if (L.dots) {
      for (var i = 0; i < L.dots; i++) {
        var a = i / L.dots * Math.PI * 2;
        out += '<circle cx="' + (Math.cos(a) * L.r).toFixed(1) + '" cy="' + (Math.sin(a) * L.r).toFixed(1) + '" r="' + L.d + '"' + st + '/>';
      }
      return;
    }
    var d = petal(L.r, L.len, L.w);
    for (var k = 0; k < L.n; k++) out += '<path d="' + d + '" transform="rotate(' + (k * 360 / L.n).toFixed(2) + ')"' + st + '/>';
  });
  return out + "</svg>";
}
function lights(W, n, h) {
  var seg = W / n, sag = h || 34, out = '<svg viewBox="0 0 ' + W + " " + (sag + 30) + '" preserveAspectRatio="xMidYMin slice" aria-hidden="true" class="lights">';
  var bulbs = "", k = 0;
  for (var i = 0; i < n; i++) {
    var x0 = i * seg, x1 = x0 + seg, cx = x0 + seg / 2;
    out += '<path d="M' + x0.toFixed(1) + ' 6 Q' + cx.toFixed(1) + " " + (6 + sag * 2).toFixed(1) + " " + x1.toFixed(1) + ' 6" fill="none" stroke="rgba(251,241,223,.22)" stroke-width="1.6"/>';
    for (var t = 1; t < 8; t++) {
      var f = t / 8, x = x0 + f * seg, y = 6 + sag * 4 * f * (1 - f) * 1.0;
      var warm = (k % 3 === 0) ? "#FFD27A" : (k % 3 === 1 ? "#FBF1DF" : "#F2B544");
      bulbs += '<circle class="b' + (k % 4) + '" cx="' + x.toFixed(1) + '" cy="' + (y + 5).toFixed(1) + '" r="4.2" fill="' + warm + '"/>'; k++;
    }
  }
  return out + bulbs + "</svg>";
}
function toran(W, n) {
  var seg = W / n, sag = 46, out = '<svg viewBox="0 0 ' + W + ' 120" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><path d="M0 8H' + W + '" stroke="#8B5A2B" stroke-width="4"/>';
  for (var i = 0; i < n; i++) {
    var x0 = i * seg;
    for (var t = 0; t <= 10; t++) {
      var f = t / 10, x = x0 + f * seg, y = 10 + sag * 4 * f * (1 - f);
      var c = t % 2 ? "#FFC21A" : "#FF8A1F";
      out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" fill="' + c + '"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="' + (t % 2 ? "#FF9F1C" : "#FFD25A") + '"/>';
    }
    var lx = x0;
    out += '<g transform="translate(' + lx.toFixed(1) + ',12)"><path d="M0 0 C10 18 10 40 0 62 C-10 40 -10 18 0 0Z" fill="#3F9B4B"/><path d="M0 0 C16 14 22 32 18 50 C8 38 2 20 0 0Z" fill="#2F7D3A"/><path d="M0 0 C-16 14 -22 32 -18 50 C-8 38 -2 20 0 0Z" fill="#2F7D3A"/><circle cy="70" r="7" fill="#FFB22E"/></g>';
  }
  return out + "</svg>";
}
function diya(cls) {
  return '<svg class="diya ' + (cls || "") + '" viewBox="0 0 120 110" aria-hidden="true">' +
    '<g class="flame"><path d="M60 8 C72 26 76 40 71 51 C67 60 53 60 49 51 C44 40 48 26 60 8Z" fill="#FF8A1F"/>' +
    '<path d="M60 20 C67 32 69 41 66 48 C63 54 57 54 54 48 C51 41 53 32 60 20Z" fill="#FFC93C"/>' +
    '<ellipse cx="60" cy="47" rx="4.5" ry="7.5" fill="#FFF8D6"/></g>' +
    '<path d="M12 62 Q60 58 108 62 Q103 96 60 99 Q17 96 12 62Z" fill="#C2552B"/>' +
    '<path d="M12 62 Q60 70 108 62" stroke="#7A2E14" stroke-width="3" fill="none"/>' +
    '<g fill="#FFB22E"><circle cx="30" cy="78" r="3.5"/><circle cx="45" cy="83" r="3.5"/><circle cx="60" cy="85" r="3.5"/><circle cx="75" cy="83" r="3.5"/><circle cx="90" cy="78" r="3.5"/></g>' +
    '<path d="M38 92 Q60 97 82 92" stroke="#F2367D" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
}
var ICONS = {
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  play: '<path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/>',
  snd: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M17 9.5l4.5 5M21.5 9.5l-4.5 5"/>',
  gear: '<path d="M4 7h9M18 7h2M4 17h3M12 17h8"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9.5" cy="17" r="2.3"/>',
  full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  crown: '<path d="M3 8.5l4.5 3.8L12 5l4.5 7.3L21 8.5 19.2 19H4.8z" fill="currentColor" stroke="none"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  moon: '<path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z" fill="currentColor" stroke="none"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M4 12h15M14 6l6 6-6 6"/>',
  back: '<path d="M20 12H5M10 6l-6 6 6 6"/>',
  dots: '<circle cx="5" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.9" fill="currentColor" stroke="none"/>',
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  note: '<path d="M9 17.5V6.2l10-2.2v11.5"/><circle cx="6.6" cy="17.6" r="2.6" fill="currentColor"/><circle cx="16.6" cy="15.6" r="2.6" fill="currentColor"/>',
  noteoff: '<path d="M9 17.5V6.2l10-2.2v11.5"/><circle cx="6.6" cy="17.6" r="2.6" fill="currentColor"/><circle cx="16.6" cy="15.6" r="2.6" fill="currentColor"/><path d="M3 3l18 18" stroke-width="2.8"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  wifi: '<path d="M2.5 9a14 14 0 0119 0M5.5 12.5a9.5 9.5 0 0113 0M8.7 16a5 5 0 016.6 0"/><circle cx="12" cy="19.2" r="1.3" fill="currentColor" stroke="none"/>'
};
function ic(n) { return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[n] + "</svg>"; }
function qrSvg(text) {
  try {
    var q = qrcode(0, "M"); q.addData(text); q.make();
    var n = q.getModuleCount(), p = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) p += "M" + c + " " + r + "h1v1h-1z";
    return '<svg viewBox="-2 -2 ' + (n + 4) + " " + (n + 4) + '" shape-rendering="crispEdges"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#FFF3DF"/><path d="' + p + '" fill="#1A0B2E"/></svg>';
  } catch (e) { return ""; }
}
function avHTML(name, avIdx, size, cls) {
  var a = AVATARS[avIdx] || AVATARS[0];
  return '<span class="av ' + (cls || "") + '" style="--c:' + a.c + ";--s:" + size + 'px"><svg class="avg" viewBox="-24 -24 48 48" fill="currentColor" aria-hidden="true">' + GLYPHS[a.g] + "</svg></span>";
}
function B(label, act, arg, cls, attrs) {
  var a = arg == null ? "" : String(arg);
  return '<button type="button" class="btn ' + (cls || "") + '" data-act="' + act + '"' + (arg != null ? ' data-arg="' + esc(a) + '"' : "") + ' data-k="' + act + ":" + esc(a) + '" ' + (attrs || "") + ">" + label + "</button>";
}
function IB(act, icon, label, arg, extra) {
  return '<button type="button" class="ibtn ' + (extra || "") + '" data-act="' + act + '"' + (arg != null ? ' data-arg="' + esc(arg) + '"' : "") + ' data-k="' + act + ":" + esc(arg == null ? "" : arg) + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + ic(icon) + "</button>";
}

/* ================= sound ================= */
var SND = {
  ctx: null, on: lsGet("ravana_snd") !== false, noiseBuf: null,
  unlock: function () {
    if (!this.ctx) { try { var A = window.AudioContext || window.webkitAudioContext; if (A) this.ctx = new A(); } catch (e) { } }
    if (this.ctx && this.ctx.state === "suspended") { try { this.ctx.resume(); } catch (e) { } }
    if (S.view === "tv" && typeof MUS !== "undefined" && MUS.on && !MUS.master && T.H) { MUS.mood = null; MUS.setMood(T.H.paused ? "off" : T.H.phase); }
  },
  ok: function () { return this.on && this.ctx && this.ctx.state === "running"; },
  env: function (g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  osc: function (type, f, t, a, peak, d, f2) {
    var c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    this.env(g, t, a, peak, d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + a + d + 0.05);
  },
  noise: function (t, d, peak, freq) {
    var c = this.ctx;
    if (!this.noiseBuf) { var b = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = b.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; this.noiseBuf = b; }
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = "bandpass"; f.frequency.value = freq || 1800; f.Q.value = 0.8;
    this.env(g, t, 0.005, peak, d); s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + d + 0.05);
  },
  bell: function (f, delay) {
    if (!this.ok()) return; var t = this.ctx.currentTime + (delay || 0);
    this.osc("sine", f, t, 0.005, 0.22, 1.4); this.osc("sine", f * 2.01, t, 0.005, 0.08, 0.9); this.osc("sine", f * 3.02, t, 0.005, 0.04, 0.5);
  },
  join: function () { this.bell(988); this.bell(1319, 0.09); },
  dhol: function (delay, big) {
    if (!this.ok()) return; var t = this.ctx.currentTime + (delay || 0);
    this.osc("sine", big ? 140 : 190, t, 0.004, big ? 0.7 : 0.45, 0.32, 48); this.noise(t, 0.06, 0.18, 2500);
  },
  tick: function () { if (!this.ok()) return; var t = this.ctx.currentTime; this.osc("square", 1500, t, 0.002, 0.05, 0.05); },
  roll: function () { for (var i = 0; i < 14; i++) this.dhol(i * 0.1 * (1 - i * 0.025), i === 13); },
  fanfare: function (delay) { var d = delay || 0;[784, 988, 1175, 1568].forEach(function (f, i) { SND.bell(f, d + i * 0.12); }); },
  boo: function (delay) { if (!this.ok()) return; var t = this.ctx.currentTime + (delay || 0); this.osc("sawtooth", 220, t, 0.05, 0.12, 1.1, 90); this.osc("sawtooth", 233, t, 0.05, 0.08, 1.1, 95); },
  pop: function () { if (!this.ok()) return; var t = this.ctx.currentTime; this.noise(t, 0.35, 0.25, 900 + Math.random() * 900); }
};

/* ================= music: tanpura drone, keherwa dhol groove, bansuri melody ================= */
var MUS = {
  on: lsGet("ravana_music") !== false, mood: null, cfg: null, master: null, timer: 0, next: 0, step: 0, prevF: 0,
  SA: 293.66, /* Sa = D4 */
  MOODS: {
    lobby: { vol: 0.9, tempo: 96, drone: 1, groove: "full", melody: 1 },
    peek: { vol: 0.55, tempo: 96, drone: 1, groove: "light", melody: 0 },
    clues: { vol: 0.45, tempo: 96, drone: 1, groove: "light", melody: 0 },
    discuss: { vol: 0.5, tempo: 100, drone: 1, groove: "light", melody: 0 },
    vote: { vol: 0.7, tempo: 116, drone: 1, groove: "tense", melody: 0 },
    verdict: { vol: 0.45, tempo: 70, drone: 1, groove: "heart", melody: 0 },
    guess: { vol: 0.6, tempo: 66, drone: 1, groove: "heart", melody: 0 },
    reveal: { vol: 0.85, tempo: 104, drone: 1, groove: "full", melody: 1, duck: 3.4 },
    skipped: { vol: 0.5, tempo: 96, drone: 1, groove: "light", melody: 0 },
    final: { vol: 0.95, tempo: 108, drone: 1, groove: "full", melody: 1, duck: 2.5 }
  },
  /* phrases in eighth notes: [semitones from Sa, length]. 16 eighths = 2 keherwa cycles */
  PH: {
    A: [[7, 1], [9, 1], [12, 2], [9, 1], [7, 1], [4, 2], [7, 1], [4, 1], [2, 1], [4, 1], [0, 4]],
    B: [[4, 1], [7, 1], [9, 2], [7, 1], [9, 1], [12, 1], [14, 1], [12, 2], [9, 1], [7, 1], [4, 2], [2, 2]],
    C: [[12, 1], [9, 1], [7, 1], [4, 1], [7, 2], [4, 1], [2, 1], [0, 2], [2, 1], [4, 1], [2, 2], [-5, 1], [0, 1]],
    D: [[0, 1], [2, 1], [4, 1], [7, 1], [9, 2], [12, 2], [14, 1], [12, 1], [9, 1], [7, 1], [9, 2], [7, 2]]
  },
  SONG: ["A", "B", "A", "C", "", "", "D", "C", "", ""],
  setMood: function (name, force) {
    if (!this.on && name !== "off") name = "off";
    if (name === this.mood && !force) return;
    var prev = this.mood; this.mood = name;
    var cfg = this.MOODS[name] || null;
    if (!SND.ctx) return;
    var c = SND.ctx, t = c.currentTime;
    if (!this.master) { this.master = c.createGain(); this.master.gain.value = 0.0001; var comp = c.createDynamicsCompressor(); this.master.connect(comp); comp.connect(c.destination); }
    var g = this.master.gain; g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t);
    if (!cfg) { g.exponentialRampToValueAtTime(0.0001, t + 0.8); this.cfg = null; return; }
    var target = 0.32 * cfg.vol;
    if (cfg.duck) { g.exponentialRampToValueAtTime(target * 0.18, t + 0.3); g.setValueAtTime(target * 0.18, t + cfg.duck); g.exponentialRampToValueAtTime(target, t + cfg.duck + 1.2); }
    else g.exponentialRampToValueAtTime(target, t + (prev && prev !== "off" ? 0.8 : 2.2));
    this.cfg = cfg;
    if (!this.timer) { this.next = t + 0.1; var me = this; this.timer = setInterval(function () { me.tick(); }, 90); }
  },
  tick: function () {
    var c = SND.ctx; if (!c || c.state !== "running") return;
    if (!this.cfg) { if (this.master && this.master.gain.value < 0.001) { clearInterval(this.timer); this.timer = 0; } return; }
    if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.3) { this.play(this.step, this.next); this.next += 30 / this.cfg.tempo; this.step++; }
  },
  f: function (semi, oct) { return this.SA * Math.pow(2, semi / 12 + (oct || 0)); },
  play: function (s, t) {
    var cfg = this.cfg, p = s % 8, sd = 30 / cfg.tempo;
    if (cfg.drone && p % 2 === 0) this.tanpura([this.f(7, -2), this.f(0, -1), this.f(0, -1), this.f(0, -2)][p / 2], t);
    var gr = cfg.groove;
    if (gr === "full" || gr === "light") {
      /* keherwa: dha ge na ti | na ka dhi na */
      var bass = [1, 0.7, 0, 0, 0, 0, 0.9, 0][p], hi = [0.8, 0, 0.9, 0.5, 0.8, 0, 0.8, 0.9][p];
      if (gr === "light") hi *= 0.35;
      if (bass) this.dhol(t, bass);
      if (hi) this.tin(t, hi);
      if (p === 5 && gr === "full") this.ka(t);
      if (gr === "full" && s % 32 === 31) { this.tin(t + sd / 2, 0.6); this.tin(t + sd * 0.75, 0.5); }
    } else if (gr === "tense") {
      if (p % 2 === 0) this.dhol(t, p === 0 ? 1 : 0.6);
      this.tin(t, p % 2 ? 0.35 : 0.55); this.tin(t + sd / 2, 0.22);
    } else if (gr === "heart") {
      if (p % 4 === 0) { this.dhol(t, 0.9); this.dhol(t + sd * 0.55, 0.6); }
    }
    if (cfg.melody) {
      var bar = Math.floor(s / 16) % this.SONG.length, ph = this.PH[this.SONG[bar]];
      if (ph) {
        var off = s % 16, acc = 0;
        for (var i = 0; i < ph.length; i++) { if (acc === off) { this.flute(this.f(ph[i][0], 0), t, ph[i][1] * sd); break; } acc += ph[i][1]; }
      }
    }
  },
  out: function () { return this.master; },
  tanpura: function (f, t) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = f; o2.frequency.value = f * 1.003;
    lp.type = "lowpass"; lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 2.4); lp.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.out()); o.start(t); o2.start(t); o.stop(t + 3.3); o2.stop(t + 3.3);
  },
  dhol: function (t, v) {
    var c = SND.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.28);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.75 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g); g.connect(this.out()); o.start(t); o.stop(t + 0.45);
  },
  tin: function (t, v) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o2.type = "triangle"; o.frequency.value = 620; o2.frequency.value = 1245;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); o2.connect(g); g.connect(this.out()); o.start(t); o2.start(t); o.stop(t + 0.18); o2.stop(t + 0.18);
    this.noise(t, 0.035, 0.05 * v, 3200);
  },
  ka: function (t) { this.noise(t, 0.06, 0.12, 1400); },
  noise: function (t, d, peak, freq) {
    var c = SND.ctx;
    if (!SND.noiseBuf) { var b = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = b.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; SND.noiseBuf = b; }
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = SND.noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.out()); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  },
  flute: function (f, t, dur) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = "sine"; o2.type = "triangle";
    var from = this.prevF && Math.abs(Math.log(this.prevF / f)) < 0.5 ? this.prevF : f;
    o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    o2.frequency.setValueAtTime(from * 2, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.06);
    lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.3, dur));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    lp.type = "lowpass"; lp.frequency.value = 2600;
    var end = t + Math.max(0.18, dur * 0.96);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.05); g.gain.setValueAtTime(0.11, end - 0.06); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.12);
    var g2 = c.createGain(); g2.gain.value = 0.18;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(this.out());
    o.start(t); o2.start(t); lfo.start(t); o.stop(end + 0.15); o2.stop(end + 0.15); lfo.stop(end + 0.15);
    this.noise(t, 0.08, 0.025, 2200);
    this.prevF = f;
  }
};

/* ================= fireworks ================= */
var FX = {
  c: null, x: null, parts: [], raf: 0, until: 0, style: "joy", nextBurst: 0,
  init: function () { this.c = document.getElementById("fx"); if (!this.c) return; this.x = this.c.getContext("2d"); this.size(); var me = this; window.addEventListener("resize", function () { me.size(); }); },
  size: function () { if (!this.c) return; this.c.width = window.innerWidth; this.c.height = window.innerHeight; },
  burst: function (x, y, cols, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 5.5;
      this.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, d: 0.008 + Math.random() * 0.012, c: cols[i % cols.length], r: 1.6 + Math.random() * 2.4 });
    }
    SND.pop();
  },
  show: function (sec, style) {
    if (REDUCED || !this.x) return;
    this.until = now() + sec * 1000; this.style = style || "joy"; this.nextBurst = 0;
    if (!this.raf) this.loop();
  },
  loop: function () {
    var me = this, x = this.x, W = this.c.width, H = this.c.height;
    if (now() < this.until && now() > this.nextBurst) {
      var cols = this.style === "boo" ? ["#E5412D", "#FF6F61", "#7A2E14", "#FFB22E"] : (Math.random() < 0.5 ? ["#FFB22E", "#FFF3DF", "#FF8A1F"] : ["#F2367D", "#19B3A3", "#FFF3DF", "#5EC8FF"]);
      var y = this.style === "boo" ? H * (0.65 + Math.random() * 0.25) : H * (0.12 + Math.random() * 0.4);
      this.burst(W * (0.1 + Math.random() * 0.8), y, cols, this.style === "boo" ? 40 : 70);
      this.nextBurst = now() + 260 + Math.random() * 420;
    }
    x.globalCompositeOperation = "destination-out"; x.fillStyle = "rgba(0,0,0,0.22)"; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "lighter";
    for (var i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i]; p.vx *= 0.985; p.vy = p.vy * 0.985 + (this.style === "boo" ? -0.02 : 0.05); p.x += p.vx; p.y += p.vy; p.l -= p.d;
      if (p.l <= 0) { this.parts.splice(i, 1); continue; }
      x.globalAlpha = Math.max(0, p.l); x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    if (this.parts.length || now() < this.until) this.raf = requestAnimationFrame(function () { me.loop(); });
    else { this.raf = 0; x.clearRect(0, 0, W, H); }
  }
};

/* ================= network: MQTT relays, all in parallel ================= */
function Net(code, cb) {
  var self = { peers: {}, connected: 0, mine: null, ann: null, id: "", started: 0 };
  var base = ROOT + code + "/p/", clients = [], hiddenAt = 0, timers = [];
  function onMsg(topic, payload, packet) {
    if (topic.indexOf(base) !== 0) return;
    var id = topic.slice(base.length); if (!id || id === self.id) return;
    var txt = payload ? payload.toString() : "";
    if (!txt) { if (self.peers[id]) { delete self.peers[id]; cb.peers && cb.peers(); } return; }
    var st; try { st = JSON.parse(txt); } catch (e) { return; }
    if (!st || st.app !== "ravana" || st.id !== id) return;
    var old = self.peers[id], live = !(packet && packet.retain);
    if (old && (old.st._ts || 0) > (st._ts || 0)) return;
    if (old && old.st._ts === st._ts) { if (live) old.seen = now(); return; }
    self.peers[id] = { st: st, seen: live ? now() : (old ? old.seen : 0), recv: now() };
    cb.peers && cb.peers();
  }
  function pub1(c) { try { c.publish(base + self.id, JSON.stringify(self.mine), { retain: true, qos: 0 }); } catch (e) { } }
  function pubAnn(c) { if (!self.ann) return; try { c.publish(self.ann.topic, JSON.stringify(Object.assign({}, self.ann.obj, { _ts: now(), now: now() })), { retain: true, qos: 0 }); } catch (e) { } }
  function status() {
    var n = 0; clients.forEach(function (c) { if (c && c.connected) n++; });
    if (n !== self.connected) { self.connected = n; cb.status && cb.status(n); }
  }
  function connectOne(url) {
    var c;
    try {
      c = mqtt.connect(url, Object.assign({ clientId: "rv_" + self.id.slice(0, 10) + "_" + rid(5), keepalive: 20, reconnectPeriod: 2500, connectTimeout: 9000, clean: true }, window.RAVANA_MQTT_OPTS || {}));
    } catch (e) { return null; }
    c.on("connect", function () { c.subscribe(base + "+", { qos: 0 }); if (self.mine) pub1(c); pubAnn(c); status(); });
    c.on("close", status); c.on("offline", status); c.on("error", function () { });
    c.on("message", onMsg);
    return c;
  }
  self.start = function (id) {
    self.id = id; self.started = now();
    clients = BROKERS.map(connectOne);
    timers.push(setInterval(function () { if (self.mine) { self.mine._ts = now(); self.mine.now = now(); clients.forEach(function (c) { if (c && c.connected) pub1(c); }); } status(); }, CFG.hbMs));
    timers.push(setInterval(function () { clients.forEach(function (c) { if (c && c.connected) pubAnn(c); }); }, CFG.annMs));
  };
  self.publish = function (st) {
    self.mine = JSON.parse(JSON.stringify(st)); self.mine._ts = now(); self.mine.now = now();
    clients.forEach(function (c) { if (c && c.connected) pub1(c); });
  };
  self.announce = function (topic, obj) { self.ann = { topic: topic, obj: obj }; clients.forEach(function (c) { if (c && c.connected) pubAnn(c); }); };
  self.unannounce = function () { if (!self.ann) return; var t = self.ann.topic; self.ann = null; clients.forEach(function (c) { try { if (c && c.connected) c.publish(t, "", { retain: true, qos: 0 }); } catch (e) { } }); };
  self.restart = function () {
    clients.forEach(function (c) { try { if (c) c.end(true); } catch (e) { } });
    clients = BROKERS.map(connectOne); status();
  };
  self.stop = function (clear) {
    timers.forEach(clearInterval); timers = [];
    clients.forEach(function (c) {
      try { if (c && c.connected && clear) c.publish(base + self.id, "", { retain: true, qos: 0 }); } catch (e) { }
      try { if (c) setTimeout(function () { c.end(true); }, 400); } catch (e) { }
    });
    clients = []; self.stopped = true;
  };
  self.alive = function (id) { var p = self.peers[id]; return !!(p && p.seen && now() - p.seen < CFG.awayMs); };
  function onVis() {
    if (self.stopped) return;
    if (document.hidden) { hiddenAt = now(); return; }
    if (hiddenAt && now() - hiddenAt > 2500) self.restart();
    else clients.forEach(function (c) { if (c && !c.connected) { try { c.reconnect(); } catch (e) { } } });
    hiddenAt = 0;
    if (self.mine) self.publish(self.mine);
  }
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("online", function () { if (!self.stopped) self.restart(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted && !self.stopped) self.restart(); });
  return self;
}

/* Same-Wi-Fi discovery: devices behind one router share a public IP. We only use a hash of it. */
function lanKey(cb) {
  if (window.RAVANA_LAN !== undefined) { cb(window.RAVANA_LAN); return; }
  var c = ssGet("ravana_lan"); if (c && now() - c.t < 600000) { cb(c.k); return; }
  var urls = ["https://api.ipify.org?format=json", "https://ipv4.icanhazip.com/"], i = 0;
  (function next() {
    if (i >= urls.length || !window.fetch) { cb(null); return; }
    var u = urls[i++], done = false;
    var to = setTimeout(function () { if (!done) { done = true; next(); } }, 4500);
    fetch(u, { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (t) {
      if (done) return; done = true; clearTimeout(to);
      var ip = String(t).trim(); try { var j = JSON.parse(t); if (j && j.ip) ip = j.ip; } catch (e) { }
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) { next(); return; }
      var k = fnv("diwali|" + ip) + fnv(ip + "|ravana"); ssSet("ravana_lan", { k: k, t: now() }); cb(k);
    }).catch(function () { if (!done) { done = true; clearTimeout(to); next(); } });
  })();
}
function Discover(key, onChange) {
  var self = { rooms: {}, clients: [] }, topic = ROOT + "lan/" + key + "/+";
  self.clients = BROKERS.map(function (url) {
    var c; try { c = mqtt.connect(url, Object.assign({ clientId: "rvd_" + rid(10), keepalive: 30, reconnectPeriod: 4000, connectTimeout: 9000, clean: true }, window.RAVANA_MQTT_OPTS || {})); } catch (e) { return null; }
    c.on("connect", function () { c.subscribe(topic, { qos: 0 }); });
    c.on("error", function () { });
    c.on("message", function (t, p, pk) {
      var id = t.split("/").pop(), txt = p ? p.toString() : "";
      if (!txt) { if (self.rooms[id]) { delete self.rooms[id]; onChange(); } return; }
      var st; try { st = JSON.parse(txt); } catch (e) { return; }
      if (!st || st.app !== "ravana" || !st.code) return;
      var live = !(pk && pk.retain), old = self.rooms[id];
      self.rooms[id] = { st: st, seen: live ? now() : (old ? old.seen : 0) };
      onChange();
    });
    return c;
  });
  self.list = function () {
    var out = [];
    Object.keys(self.rooms).forEach(function (k) { var r = self.rooms[k]; if (r.seen && now() - r.seen < 15000) out.push(r.st); });
    out.sort(function (a, b) { return (b.created || 0) - (a.created || 0); });
    return out;
  };
  self.stop = function () { self.clients.forEach(function (c) { try { if (c) c.end(true); } catch (e) { } }); self.clients = []; };
  return self;
}

/* ================= rendering helpers ================= */
function root() { return document.getElementById("root"); }
function focusKey(el) { return el && el.getAttribute ? el.getAttribute("data-k") : null; }
function patch(id, html, key) {
  var el = document.getElementById(id); if (!el) return false;
  if (S.cache[id] === html) return false;
  var ae = document.activeElement;
  if (ae && el.contains(ae) && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA") && S.ckey[id] === key && key !== undefined) return false;
  if (S.holding && el.querySelector(".card3d") && S.ckey[id] === key) return false;
  var fk = ae && el.contains(ae) ? focusKey(ae) : null;
  el.innerHTML = html; S.cache[id] = html; S.ckey[id] = key;
  if (fk) { var n = el.querySelector('[data-k="' + fk.replace(/"/g, '\\"') + '"]'); if (n && !n.disabled) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } } }
  return true;
}
function setRoot(html) { root().innerHTML = html; S.cache = {}; S.ckey = {}; }
function focusables(scope) {
  return Array.prototype.slice.call(scope.querySelectorAll("button:not([disabled]), input, [data-nav]")).filter(function (el) {
    var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  });
}
function navScope() { return document.querySelector(".ov.open, .sheet") || document.body; }
function ensureFocus(force) {
  if (IS_TOUCH) return;
  var scope = navScope(), ae = document.activeElement;
  var prim = scope.querySelector("[data-primary]:not([disabled])");
  var userChose = ae && ae !== document.body && focusKey(ae) !== S.autoKey;
  if (!force && ae && ae !== document.body && scope.contains(ae) && !ae.disabled && (userChose || !prim || ae === prim)) return;
  var stage = document.getElementById("tvMain");
  var p = prim || (stage && scope.contains(stage) ? focusables(stage)[0] : null) || focusables(scope)[0];
  if (p) { try { p.focus({ preventScroll: true }); } catch (e) { p.focus(); } S.autoKey = focusKey(p); }
}
function moveFocus(dir) {
  var scope = navScope(), list = focusables(scope), cur = document.activeElement;
  if (!cur || list.indexOf(cur) < 0) { ensureFocus(); return; }
  var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = null, bs = Infinity;
  list.forEach(function (el) {
    if (el === cur) return;
    var q = el.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, dx = x - cx, dy = y - cy, main, side;
    if (dir === "l") { if (dx > -4) return; main = -dx; side = Math.abs(dy); }
    if (dir === "r") { if (dx < 4) return; main = dx; side = Math.abs(dy); }
    if (dir === "u") { if (dy > -4) return; main = -dy; side = Math.abs(dx); }
    if (dir === "d") { if (dy < 4) return; main = dy; side = Math.abs(dx); }
    var sc = main + side * 2.2; if (sc < bs) { bs = sc; best = el; }
  });
  if (best) { try { best.focus({ preventScroll: true }); } catch (e) { best.focus(); } }
}
function updateTimers(offset, pausedAt) {
  var t = now() + (offset || 0);
  var els = document.querySelectorAll("[data-dl]");
  for (var i = 0; i < els.length; i++) {
    var el = els[i], dl = +el.getAttribute("data-dl"), tot = +el.getAttribute("data-tot") || 1, f = el.getAttribute("data-fmt");
    var rem = Math.max(0, dl - t), frac = Math.max(0, Math.min(1, rem / tot));
    if (f === "s") el.textContent = tsec(rem);
    else if (f === "ring") el.setAttribute("stroke-dashoffset", (553 * (1 - frac)).toFixed(1));
    else if (f === "bar") el.style.transform = "scaleX(" + frac.toFixed(3) + ")";
    el.classList.toggle("low", rem < 10000);
  }
}
/* timer markup: live (deadline) or frozen (paused remaining ms) */
function tText(dl, frozen) { return frozen != null ? '<span class="tnum">' + tsec(frozen) + "</span>" : '<span class="tnum" data-dl="' + dl + '" data-fmt="s">' + tsec(dl - now()) + "</span>"; }
function tRing(dl, tot, frozen, inner) {
  var rem = frozen != null ? frozen : dl - now(), frac = Math.max(0, Math.min(1, rem / tot));
  return '<div class="ringwrap"><svg class="ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="trk"/><circle cx="100" cy="100" r="88" class="prog" stroke-dasharray="553" stroke-dashoffset="' + (553 * (1 - frac)).toFixed(1) + '" transform="rotate(-90 100 100)"' +
    (frozen != null ? "" : ' data-dl="' + dl + '" data-tot="' + tot + '" data-fmt="ring"') + '/></svg><div class="ringin">' + (inner || tText(dl, frozen)) + "</div></div>";
}
function tBar(dl, tot, frozen) {
  var rem = frozen != null ? frozen : dl - now(), frac = Math.max(0, Math.min(1, rem / tot));
  return '<div class="tbar"><i style="transform:scaleX(' + frac.toFixed(3) + ')"' + (frozen != null ? "" : ' data-dl="' + dl + '" data-tot="' + tot + '" data-fmt="bar"') + "></i></div>";
}

/* ================= TV (host) ================= */
var T = { H: null, net: null, newIds: {}, fit: lsGet("ravana_fit") || { size: 0.92, y: 0.015 }, showSet: false, pend: null, awaySince: {}, lastTick: -1, revealKey: "", confirmNew: false, lanKey: null, lastSnd: {} };

function H() { return T.H; }
function roster() { var r = T.H.roster; return Object.keys(r).sort(function (a, b) { return r[a].joinedAt - r[b].joinedAt; }); }
function rname(id) { var p = T.H.roster[id] || (T.H.ghosts && T.H.ghosts[id]); return p ? p.name : "Someone"; }
function rav(id) { var p = T.H.roster[id] || (T.H.ghosts && T.H.ghosts[id]); return p ? p.av : 0; }
function avOf(id, size, cls) { return avHTML(rname(id), rav(id), size, cls); }
function pst(id) { var p = T.net && T.net.peers[id]; return p && p.st.role === "player" ? p.st : null; }
function online(id) { return T.net ? T.net.alive(id) : false; }
function onlinePlayers() { return T.H.players.filter(online); }
function isRoundPhase(ph) { return ["peek", "clues", "discuss", "vote", "verdict", "guess"].indexOf(ph) >= 0; }

function newHost() {
  return {
    app: "ravana", role: "host", id: "tv_" + rid(10), code: String(1000 + Math.floor(Math.random() * 9000)), sess: rid(10), created: now(),
    v: 0, phase: "lobby", roster: {}, ghosts: {}, removed: {}, rejected: {}, scores: {}, settings: { rounds: 5, talk: 90 },
    round: 0, rk: "", players: [], word: "", cat: "", ravanaId: "", order: [], clueIdx: 0, turnEnd: 0, timerEnd: 0, timerTot: 1,
    paused: false, pauseLeft: null, result: null, used: [], cmdSeen: {}, away: [], vip: "", notice: "", ack: { saw: [], ready: [], voted: [] }
  };
}
function savedHost() { var h = lsGet("ravana_host"); return h && h.code && now() - (h.savedAt || 0) < CFG.saveHours * 3600000 ? h : null; }

function tvStart(resume) {
  stopDiscovery();
  var h = resume ? savedHost() : null;
  if (h) {
    T.H = h;
    if (isRoundPhase(h.phase) && !h.paused) {
      h.paused = true;
      h.pauseLeft = { timer: Math.max(15000, (h.timerEnd || 0) - (h.savedAt || now())), turn: Math.max(10000, (h.turnEnd || 0) - (h.savedAt || now())) };
    }
  } else {
    if (T.H && T.net) { T.net.unannounce(); }
    T.H = newHost();
  }
  if (T.net) T.net.stop(false);
  T.net = Net(T.H.code, { peers: tvOnPeers, status: function () { tvRender(); } });
  T.net.start(T.H.id);
  lanKey(function (k) { T.lanKey = k; tvAnnounce(); });
  S.view = "tv"; setRoot(tvShell()); fitTV();
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(function () { }); } catch (e) { }
  tvPub();
}
function tvAnnounce() {
  if (!T.lanKey || !T.net || !T.H) return;
  T.net.announce(ROOT + "lan/" + T.lanKey + "/" + T.H.id, { app: "ravana", code: T.H.code, created: T.H.created, n: Object.keys(T.H.roster).length, phase: T.H.phase });
}
function tvPub() {
  var h = T.H; h.v++;
  T.net.publish(h);
  lsSet("ravana_host", Object.assign({}, h, { savedAt: now() }));
  tvAnnounce();
  tvRender();
}

/* ---- presence intake ---- */
function tvOnPeers() {
  var h = T.H; if (!h) return;
  var changed = false, peers = T.net.peers;
  Object.keys(peers).forEach(function (id) {
    var st = peers[id].st;
    if (st.role !== "player" || st.code !== h.code || st.sess !== h.sess) return;
    if (st.left) { if (h.roster[id]) { removePlayer(id, "left"); changed = true; } return; }
    if (h.removed[id]) return;
    var name = String(st.name || "").trim().slice(0, 14);
    if (!name) return;
    var taken = roster().some(function (o) { return o !== id && h.roster[o].name.toLowerCase() === name.toLowerCase(); });
    if (!h.roster[id]) {
      if (!T.net.alive(id)) return;
      var reason = Object.keys(h.roster).length >= CFG.maxP ? "full" : (taken ? "name" : "");
      if (reason) { if (h.rejected[id] !== reason + ":" + name) { h.rejected[id] = reason + ":" + name; changed = true; } return; }
      var used = roster().map(function (o) { return h.roster[o].av; });
      var av = +st.av; if (!(av >= 0 && av < AVATARS.length) || used.indexOf(av) >= 0) { for (var a = 0; a < AVATARS.length; a++) if (used.indexOf(a) < 0) { av = a; break; } }
      h.roster[id] = { name: name, av: av, joinedAt: now() };
      if (h.scores[id] == null) h.scores[id] = 0;
      delete h.rejected[id]; T.newIds[id] = true; changed = true;
      SND.join();
    } else {
      var r = h.roster[id];
      if (r.name !== name && !taken) { r.name = name; changed = true; }
    }
    if (st.cmd && st.cmd.seq > (h.cmdSeen[id] || 0)) { h.cmdSeen[id] = st.cmd.seq; changed = true; runCmd(id, st.cmd); }
  });
  if (recomputeDerived()) changed = true;
  if (guessIntake()) changed = true;
  if (changed) tvPub(); else tvRender();
}
function recomputeDerived() {
  var h = T.H, ch = false;
  var away = roster().filter(function (id) { return !online(id); });
  if (away.join() !== h.away.join()) { h.away = away; ch = true; }
  var vip = roster().filter(online)[0] || "";
  if (vip !== h.vip) { h.vip = vip; ch = true; }
  var ack = { saw: [], ready: [], voted: [] };
  if (h.rk) h.players.forEach(function (id) {
    var p = pst(id); if (!p) return;
    if (p.saw === h.rk) ack.saw.push(id);
    if (p.ready === h.rk) ack.ready.push(id);
    if (p.vote && p.vote.rk === h.rk && h.players.indexOf(p.vote.t) >= 0 && p.vote.t !== id) ack.voted.push(id);
  });
  if (JSON.stringify(ack) !== JSON.stringify(h.ack)) { h.ack = ack; ch = true; }
  return ch;
}
function guessIntake() {
  var h = T.H; if (h.phase !== "guess" || !h.result || h.result.guess != null) return false;
  var p = pst(h.ravanaId);
  if (p && p.guess && p.guess.rk === h.rk && String(p.guess.text || "").trim()) {
    h.result.guess = String(p.guess.text).trim().slice(0, 40);
    h.result.guessOk = judgeGuess(h.result.guess, h.word);
    h.timerEnd = now() + CFG.afterGuessMs; h.timerTot = CFG.afterGuessMs;
    if (h.result.guessOk) SND.fanfare(); else SND.boo();
    return true;
  }
  return false;
}

/* ---- commands from phones ---- */
function runCmd(id, c) {
  var h = T.H, vip = id === h.vip;
  if (c.type === "done") { if (h.phase === "clues" && c.rk === h.rk && c.idx === h.clueIdx && h.order[h.clueIdx] === id && !h.paused) nextSpeaker(); return; }
  if (!vip) return;
  if (c.type === "pause") { doPause(); return; }
  if (c.type === "resume") { doResume(); return; }
  if (h.paused) return;
  if (c.type === "start" && h.phase === "lobby") startGame();
  else if (c.type === "skip" && c.rk === h.rk) { if (h.phase === "peek") toClues(); else if (h.phase === "clues") nextSpeaker(); }
  else if (c.type === "votenow" && h.phase === "discuss" && c.rk === h.rk) toVote();
  else if (c.type === "skip" && h.phase === "verdict" && c.rk === h.rk) afterVerdict();
  else if (c.type === "next" && (h.phase === "reveal" || h.phase === "skipped") && c.rk === h.rk) nextRound();
  else if (c.type === "again" && h.phase === "final") playAgain();
}

/* ---- game flow ---- */
function startGame() {
  var h = T.H; if (roster().length < CFG.minP) return;
  roster().forEach(function (id) { h.scores[id] = 0; });
  h.round = 0; h.ghosts = {};
  startRound();
}
function pickWord() {
  var h = T.H, pool = [];
  Object.keys(WORDS).forEach(function (c) { WORDS[c].forEach(function (w) { if (h.used.indexOf(w) < 0) pool.push([c, w]); }); });
  if (!pool.length) { h.used = []; return pickWord(); }
  return pool[Math.floor(Math.random() * pool.length)];
}
function startRound() {
  var h = T.H, ids = roster();
  if (ids.length < CFG.minP) { h.phase = "lobby"; h.notice = "Need at least 3 players to keep going."; return; }
  var cw = pickWord(), on = ids.filter(online);
  h.round++; h.rk = rid(6); h.cat = cw[0]; h.word = cw[1]; h.used.push(cw[1]);
  h.players = ids; h.ravanaId = (on.length ? on : ids)[Math.floor(Math.random() * (on.length || ids.length))];
  h.order = shuffle(ids); h.clueIdx = 0; h.result = null; h.notice = ""; h.ack = { saw: [], ready: [], voted: [] };
  h.phase = "peek"; h.timerEnd = now() + CFG.peekMs; h.timerTot = CFG.peekMs; h.paused = false; h.pauseLeft = null;
  T.pend = null; SND.dhol(0, true);
}
function toClues() {
  var h = T.H; h.phase = "clues"; h.clueIdx = -1; T.pend = null; nextSpeaker(true);
}
function nextSpeaker(first) {
  var h = T.H;
  h.clueIdx++;
  while (h.clueIdx < h.order.length && (!h.roster[h.order[h.clueIdx]])) h.clueIdx++;
  if (h.clueIdx >= h.order.length) { toDiscuss(); return; }
  h.turnEnd = now() + CFG.turnMs; T.awaySince = {};
  SND.dhol(0, false);
}
function toDiscuss() { var h = T.H; h.phase = "discuss"; h.timerEnd = now() + h.settings.talk * 1000; h.timerTot = h.settings.talk * 1000; T.pend = null; SND.bell(659); }
function toVote() { var h = T.H; h.phase = "vote"; h.timerEnd = now() + CFG.voteMs; h.timerTot = CFG.voteMs; T.pend = null; SND.bell(784); SND.bell(988, 0.12); }
function tally() {
  var h = T.H, counts = {}, voted = {};
  h.players.forEach(function (id) {
    var p = pst(id);
    if (p && p.vote && p.vote.rk === h.rk && h.players.indexOf(p.vote.t) >= 0 && p.vote.t !== id) { voted[id] = p.vote.t; counts[p.vote.t] = (counts[p.vote.t] || 0) + 1; }
  });
  var max = 0, tops = [];
  Object.keys(counts).forEach(function (k) { if (counts[k] > max) { max = counts[k]; tops = [k]; } else if (counts[k] === max) tops.push(k); });
  var caught = tops.length === 1 && tops[0] === h.ravanaId;
  var delta = {}; h.players.forEach(function (id) { delta[id] = 0; });
  Object.keys(voted).forEach(function (v) { if (voted[v] === h.ravanaId && v !== h.ravanaId) delta[v] += 1; });
  if (!caught) delta[h.ravanaId] = (delta[h.ravanaId] || 0) + 2;
  h.result = { caught: caught, picked: tops.length === 1 ? tops[0] : "", tie: tops.length > 1, none: !tops.length, counts: counts, voted: voted, delta: delta, guess: null, guessOk: false };
  T.pend = null;
  h.phase = "verdict"; h.timerEnd = now() + (h.result.picked ? 7000 : 5000); h.timerTot = h.timerEnd - now();
}
function afterVerdict() {
  var h = T.H;
  if (h.result.caught) { h.phase = "guess"; h.timerEnd = now() + CFG.guessMs; h.timerTot = CFG.guessMs; SND.dhol(0, true); }
  else finishRound();
}
function finishRound() {
  var h = T.H, r = h.result;
  if (!r) return;
  if (r.caught && r.guessOk) r.delta[h.ravanaId] = (r.delta[h.ravanaId] || 0) + 2;
  Object.keys(r.delta).forEach(function (id) { if (h.scores[id] != null) h.scores[id] += r.delta[id]; });
  h.phase = "reveal"; T.pend = null;
}
function nextRound() {
  var h = T.H;
  if (h.settings.rounds && h.round >= h.settings.rounds) { h.phase = "final"; h.rk = rid(6); return; }
  startRound();
}
function playAgain() { var h = T.H; roster().forEach(function (id) { h.scores[id] = 0; }); h.round = 0; h.phase = "lobby"; h.rk = ""; h.result = null; h.ghosts = {}; }
function skipRound(reason) { var h = T.H; h.phase = "skipped"; h.notice = reason; h.result = null; T.pend = null; }
function removePlayer(id, why) {
  var h = T.H; if (!h.roster[id]) return;
  h.ghosts = h.ghosts || {}; h.ghosts[id] = h.roster[id];
  delete h.roster[id]; delete h.scores[id];
  if (why === "removed") h.removed[id] = true;
  var inRound = h.players.indexOf(id) >= 0 && (isRoundPhase(h.phase));
  if (!inRound) { h.players = h.players.filter(function (x) { return x !== id; }); return; }
  if (id === h.ravanaId) { skipRound(rname(id) + " was the Ravana and left the game."); return; }
  var cur = h.order[h.clueIdx];
  h.players = h.players.filter(function (x) { return x !== id; });
  var oi = h.order.indexOf(id);
  h.order = h.order.filter(function (x) { return x !== id; });
  if (h.phase === "clues") {
    if (cur === id) { h.clueIdx = oi - 1; nextSpeaker(); }
    else if (oi < h.clueIdx) h.clueIdx--;
  }
  if (h.players.length < CFG.minP) skipRound("Not enough players left for this round.");
}
function doPause() { var h = T.H; if (h.paused) return; h.paused = true; h.pauseLeft = { timer: Math.max(0, h.timerEnd - now()), turn: Math.max(0, h.turnEnd - now()) }; }
function doResume() { var h = T.H; if (!h.paused) return; var pl = h.pauseLeft || { timer: 20000, turn: 15000 }; h.timerEnd = now() + Math.max(5000, pl.timer); h.turnEnd = now() + Math.max(5000, pl.turn); h.paused = false; h.pauseLeft = null; T.pend = null; }

/* ---- clock: timers + auto steps ---- */
function tvTick() {
  var h = T.H; if (!h || S.view !== "tv") return;
  var ch = recomputeDerived();
  if (!h.paused) {
    var t = now(), on = onlinePlayers();
    var allIn = function (list) { return on.length > 0 && on.every(function (id) { return list.indexOf(id) >= 0; }); };
    var auto = null;
    if (h.phase === "peek") { if (t > h.timerEnd) { toClues(); ch = true; } else if (allIn(h.ack.saw)) auto = "peek"; }
    else if (h.phase === "clues") {
      var cur = h.order[h.clueIdx];
      if (cur && !online(cur)) { T.awaySince[cur] = T.awaySince[cur] || t; if (t - T.awaySince[cur] > 4000) { nextSpeaker(); ch = true; } }
      else if (t > h.turnEnd) { nextSpeaker(); ch = true; }
    }
    else if (h.phase === "discuss") { if (t > h.timerEnd) { toVote(); ch = true; } else if (allIn(h.ack.ready)) auto = "discuss"; }
    else if (h.phase === "vote") { if (t > h.timerEnd) { tally(); ch = true; } else if (allIn(h.ack.voted)) auto = "vote"; }
    else if (h.phase === "verdict") { if (t > h.timerEnd) { afterVerdict(); ch = true; } }
    else if (h.phase === "guess") { if (t > h.timerEnd) { if (h.result.guess == null) { h.result.guess = ""; h.result.guessOk = false; } finishRound(); ch = true; } }
    if (auto) {
      if (!T.pend || T.pend.k !== auto + h.rk) T.pend = { k: auto + h.rk, at: t + CFG.autoMs };
      else if (t >= T.pend.at) { T.pend = null; if (auto === "peek") toClues(); else if (auto === "discuss") toVote(); else tally(); ch = true; }
    } else if (T.pend && !ch) T.pend = null;
    if ((h.phase === "discuss" || h.phase === "vote") && !h.paused) {
      var sec = Math.ceil((h.timerEnd - t) / 1000);
      if (sec <= 5 && sec >= 1 && sec !== T.lastTick) { T.lastTick = sec; SND.tick(); }
    }
  }
  if (ch) tvPub();
  updateTimers(0);
}

/* ---- TV views ---- */
function tvShell() {
  return '<div class="tv" id="tv"><div class="toplights">' + lights(1920, 6, 30) + '</div>' +
    '<header class="tvh" id="tvHead"></header>' +
    '<div class="tvm"><div class="stagewrap"><div class="bgr">' + rangoli("gold") + '</div><section class="stage" id="tvMain"></section></div><aside class="rail" id="tvRail"></aside></div>' +
    '<footer class="tvf" id="tvFoot"></footer><div id="tvOv"></div></div>';
}
function fitTV() {
  var el = document.getElementById("tv"); if (!el) return;
  var vw = window.innerWidth, vh = window.innerHeight, f = T.fit;
  var s = Math.min(vw / 1920, vh / 1080) * f.size;
  el.style.transform = "translate(-50%,-50%) translateY(" + Math.round(f.y * vh) + "px) scale(" + s.toFixed(4) + ")";
}
function tvRender() {
  var h = T.H; if (!h || S.view !== "tv") return;
  if (!document.getElementById("tvMain")) { setRoot(tvShell()); fitTV(); }
  patch("tvHead", tvHead(h));
  var mainKey = h.phase + "|" + h.rk + "|" + h.clueIdx;
  if (S.lastMainKey !== mainKey && h.phase + "|" + h.rk !== String(S.lastMainKey).split("|").slice(0, 2).join("|")) T.phaseAt = now();
  var phaseChanged = patch("tvMain", tvMain(h), mainKey) && S.lastMainKey !== mainKey;
  S.lastMainKey = mainKey;
  patch("tvRail", tvRail(h));
  patch("tvFoot", tvFoot(h));
  var ovChanged = patch("tvOv", tvOverlay(h));
  T.newIds = {};
  var rk = (h.phase === "reveal" || h.phase === "verdict" || h.phase === "final") ? h.phase + h.rk : "";
  if (rk && rk !== T.revealKey) {
    T.revealKey = rk;
    var R = h.result;
    if (h.phase === "verdict") {
      if (R.picked) { SND.roll(); setTimeout(function () { if (R.caught) { FX.show(3.5, "joy"); SND.fanfare(); } else { FX.show(2, "boo"); SND.boo(); } }, 2300); }
      else SND.boo(0.2);
    } else if (h.phase === "reveal") {
      if (R.caught) { setTimeout(function () { if (R.guessOk) { FX.show(2, "boo"); SND.boo(); } else { FX.show(3, "joy"); SND.fanfare(); } }, 500); }
      else { SND.roll(); setTimeout(function () { FX.show(2.5, "boo"); SND.boo(); }, 1550); }
    } else { FX.show(7, "joy"); SND.fanfare(); SND.fanfare(0.8); }
  }
  ensureFocus(phaseChanged || ovChanged);
  MUS.setMood(h.paused || T.showSet ? (T.showSet ? MUS.mood : "off") : h.phase);
  updateTimers(0);
}
var STEPS = ["Cards", "Clues", "Talk", "Vote", "Reveal"];
var STEP_OF = { peek: 0, clues: 1, discuss: 2, vote: 3, verdict: 4, guess: 4, reveal: 4, skipped: 4 };
function tvHead(h) {
  var conn = T.net && T.net.connected > 0, mid;
  if (h.phase === "lobby") mid = '<span class="midtxt">Waiting for players</span>';
  else if (h.phase === "final") mid = '<span class="midtxt">Final results</span>';
  else {
    var cur = STEP_OF[h.phase];
    mid = '<span class="rnd">Round ' + h.round + (h.settings.rounds ? '<small> of ' + h.settings.rounds + "</small>" : "") + '</span><ol class="track">' +
      STEPS.map(function (n, i) { return '<li class="' + (i < cur ? "done" : (i === cur ? "cur" : "")) + '"><i></i>' + n + "</li>"; }).join("") + "</ol>";
  }
  return '<div class="brand">' + diya("brand-diya") + '<span class="disp">Find the Ravana</span></div>' +
    '<div class="mid">' + mid + "</div>" +
    '<div class="tools"><span class="roomchip"><span class="dot ' + (conn ? "on" : "off") + '"></span>Room <b>' + h.code + "</b></span>" +
    (isRoundPhase(h.phase) ? IB(h.paused ? "resume" : "pause", h.paused ? "play" : "pause", h.paused ? "Resume" : "Pause") : "") +
    IB("settings", "gear", "Settings") + "</div>";
}
function railStatus(h, id) {
  if (!online(id)) return '<span class="st away">' + ic("moon") + "away</span>";
  if (h.players.indexOf(id) < 0 && isRoundPhase(h.phase)) return '<span class="st wait">next round</span>';
  if (h.phase === "peek" && h.ack.saw.indexOf(id) >= 0) return '<span class="st ok">' + ic("check") + "</span>";
  if (h.phase === "discuss" && h.ack.ready.indexOf(id) >= 0) return '<span class="st ok">' + ic("check") + "</span>";
  if (h.phase === "vote" && h.ack.voted.indexOf(id) >= 0) return '<span class="st ok">' + ic("check") + "</span>";
  return "";
}
function tvRail(h) {
  var ids = roster();
  if (h.phase !== "lobby") ids.sort(function (a, b) { return (h.scores[b] || 0) - (h.scores[a] || 0) || h.roster[a].joinedAt - h.roster[b].joinedAt; });
  var rows = ids.map(function (id) {
    var d = h.phase === "reveal" && h.result ? h.result.delta[id] : 0;
    return '<div class="prow' + (T.newIds[id] ? " new" : "") + (online(id) ? "" : " isaway") + '">' + avOf(id, 62, online(id) ? "" : "away") +
      '<span class="nm">' + esc(rname(id)) + (id === h.vip ? '<span class="crown" title="Can control the game from their phone">' + ic("crown") + "</span>" : "") + "</span>" +
      railStatus(h, id) + (d ? '<span class="delta">+' + d + "</span>" : "") +
      (h.phase === "lobby" ? "" : '<span class="sc disp">' + (h.scores[id] || 0) + "</span>") + "</div>";
  }).join("");
  var empties = "";
  if (h.phase === "lobby") for (var i = ids.length; i < Math.max(CFG.minP, Math.min(ids.length + 1, CFG.maxP)); i++) empties += '<div class="prow empty"><span class="av ghost" style="--s:62px"></span><span class="nm">Open seat</span></div>';
  return '<h3>Players <span>' + ids.length + " of " + CFG.maxP + "</span></h3>" + '<div class="plist">' + rows + empties + "</div>";
}
function tvFoot(h) {
  var hint = {
    lobby: "Scan the code with your phone camera to join.",
    peek: "Hold your card to see it, then tap Got it.",
    clues: "Say one word that hints at the secret word. Not too obvious, the Ravana is listening.",
    discuss: "Talk it out. Who doesn't seem to know the word?",
    vote: "Vote on your phone. You can change your vote until time runs out.",
    verdict: "The votes are in.",
    guess: "If the Ravana guesses the word, they steal 2 points.",
    reveal: (h.vip ? rname(h.vip) + " can start the next round from their phone." : "Start the next round when you're ready."),
    skipped: "No points this round.",
    final: "Happy Diwali! Play again to start a new game with the same players."
  }[h.phase] || "";
  var right = !T.net || T.net.connected === 0 ? '<span class="warn">Reconnecting to the internet…</span>' : (h.phase === "lobby" ? '<span class="muted">Edges cut off? Settings ' + ic("gear") + " has screen size</span>" : "");
  return '<span class="cap2">' + hint + "</span>" + right;
}
function optRow(label, opts, val, act) {
  return '<div class="optrow"><span class="lbl">' + label + '</span><div class="seg">' + opts.map(function (o) { return B(o[1], act, o[0], "chip" + (o[0] === val ? " sel" : "")); }).join("") + "</div></div>";
}
function tvMain(h) {
  var ph = h.phase, pl = h.paused ? h.pauseLeft : null;
  if (ph === "lobby") {
    var n = roster().length, digits = h.code.split("").map(function (d) { return '<span class="digit disp">' + d + "</span>"; }).join("");
    return '<div class="lobby"><div class="qrcol"><div class="qrwrap"><div class="qr">' + qrSvg(JOIN_URL + "#join-" + h.code) + '</div></div><p class="cap">Scan to join</p></div>' +
      '<div class="joincol"><p class="joinat">Or go to <b>' + CFG.short + "</b> and enter</p>" + '<div class="digits">' + digits + "</div>" +
      '<div class="opts">' + optRow("Rounds", [[3, "3"], [5, "5"], [8, "8"], [0, "No limit"]], h.settings.rounds, "setRounds") + optRow("Talk time", [[60, "1 min"], [90, "1½ min"], [120, "2 min"]], h.settings.talk, "setTalk") + "</div>" +
      '<div class="startrow">' + B("Start game", "start", null, "big", "data-primary" + (n < CFG.minP ? " disabled" : "")) +
      '<p class="note">' + (n < CFG.minP ? "Need at least 3 players. " + (n === 1 ? "1 has" : n + " have") + " joined." : (h.notice ? esc(h.notice) : "The player with the crown can also start from their phone.")) + "</p></div></div></div>";
  }
  if (ph === "peek") {
    var el = now() - (T.phaseAt || 0);
    var rc = el < 2300 ? '<div class="roundcard" style="animation-delay:-' + (el / 1000).toFixed(2) + 's"><span class="disp">Round ' + h.round + "</span><small>Check your phones</small></div>" : "";
    return rc + '<h1 class="h1">Check your phones</h1>' +
      '<p class="sub">Everyone gets the same secret word, except one player. They\'re the Ravana, and they only get a hint.</p>' +
      '<div class="readyrow">' + h.players.map(function (id) { var ok = h.ack.saw.indexOf(id) >= 0; return '<div class="rchip' + (ok ? " ok" : "") + '">' + avOf(id, 76, online(id) ? "" : "away") + '<span class="tick">' + ic("check") + "</span></div>"; }).join("") + "</div>" +
      '<div class="actrow">' + B("Start the clues", "skip", null, "", "data-primary") + '<span class="tchip">' + ic("clock") + tText(h.timerEnd, pl ? pl.timer : null) + "</span></div>";
  }
  if (ph === "clues") {
    var cur = h.order[h.clueIdx], away = !online(cur);
    var strip = h.order.map(function (id, i) { return '<li class="' + (i < h.clueIdx ? "done" : (i === h.clueIdx ? "cur" : "")) + '"><span class="num">' + (i + 1) + "</span>" + avOf(id, 74, online(id) ? "" : "away") + '<span class="onm">' + esc(rname(id)) + "</span></li>"; }).join("");
    return '<div class="cluewrap"><div class="speaker"><div class="halo">' + rangoli("gold") + "</div>" + avOf(cur, 210) + "</div>" +
      '<div class="ctext"><span class="kicker">Up now</span><h1 class="h1 sname">' + esc(rname(cur)) + '</h1><p class="sub">' + (away ? "is away, skipping their turn" : "give a one-word clue") + "</p>" +
      tBar(h.turnEnd, CFG.turnMs, pl ? pl.turn : null) + "</div></div>" + '<ol class="order">' + strip + "</ol>" +
      '<div class="actrow">' + B("Next speaker", "skip", null, "", "data-primary") + "</div>";
  }
  if (ph === "discuss") {
    var on = onlinePlayers().length, rd = h.ack.ready.length;
    return '<h1 class="h1 dq">Who doesn\'t know the word?</h1>' + tRing(h.timerEnd, h.timerTot, pl ? pl.timer : null) +
      '<p class="sub">Ready to vote: <b>' + rd + " of " + on + "</b></p>" +
      '<div class="actrow">' + B("Start the vote", "votenow", null, "", "data-primary") + B("Add 30 seconds", "addtime", null, "ghost") + "</div>";
  }
  if (ph === "vote") {
    var tiles = h.players.map(function (id) { var v = h.ack.voted.indexOf(id) >= 0; return '<div class="vt' + (v ? " voted" : "") + '">' + avOf(id, 80, online(id) ? "" : "away") + '<span class="vn">' + esc(rname(id)) + '</span><span class="vs">' + (v ? ic("check") + "voted" : (online(id) ? "thinking…" : "away")) + "</span></div>"; }).join("");
    return '<div class="votehead"><h1 class="h1">Vote on your phones</h1>' + tRing(h.timerEnd, h.timerTot, pl ? pl.timer : null) + '</div><div class="vgrid">' + tiles + "</div>" +
      '<div class="actrow">' + B("Count the votes", "count", null, "", "data-primary") + '<span class="note">' + h.ack.voted.length + " of " + onlinePlayers().length + " voted</span></div>";
  }
  if (ph === "verdict") {
    var V = h.result;
    if (!V.picked) return '<div class="verdict-s"><h1 class="h1">' + (V.none ? "Nobody voted" : "The votes were split") + '</h1><p class="sub">No one was picked, so the Ravana gets away.</p>' +
      '<div class="actrow">' + B("Continue", "verdictnext", null, "", "data-primary") + "</div></div>";
    return '<div class="verdict-s ' + (V.caught ? "good" : "bad") + '"><p class="r1">The group picked</p><div class="r2 vp">' + avOf(V.picked, 190) + '<span class="rname disp">' + esc(rname(V.picked)) + "</span></div>" +
      '<div class="stamp disp">' + (V.caught ? "The Ravana!" : "Not the Ravana") + "</div>" +
      '<div class="r6 actrow">' + B("Continue", "verdictnext", null, "", "data-primary") + "</div></div>";
  }
  if (ph === "guess") {
    var r = h.result, g = r.guess;
    var box = g == null ? '<div class="gbox wait"><span class="typing">Waiting for a guess<i>.</i><i>.</i><i>.</i></span></div>'
      : '<div class="gbox"><span class="gtext disp">' + (g ? esc(g) : "No guess") + '</span><span class="verdict ' + (r.guessOk ? "ok" : "no") + '">' + (r.guessOk ? "That's the word!" : "Not the word") + "</span></div>";
    return '<div class="caught">' + avOf(h.ravanaId, 150, "red") + '</div><h1 class="h1">' + esc(rname(h.ravanaId)) + "'s last chance</h1>" +
      '<p class="sub">Guess the secret word to steal 2 points.</p>' + box +
      '<div class="actrow">' + (g == null ? B("Skip the guess", "continue", null, "ghost") : B("Show the results", "continue", null, "", "data-primary") + B(r.guessOk ? "Don't count it" : "Count it", "override", r.guessOk ? "0" : "1", "ghost")) +
      '<span class="tchip">' + tText(h.timerEnd, pl ? pl.timer : null) + "</span></div>";
  }
  if (ph === "reveal") {
    var R = h.result, out;
    if (R.caught && R.guessOk) out = "Caught, but they guessed the word. They steal 2 points.";
    else if (R.caught) out = "Caught! Everyone who voted for them gets a point.";
    else if (R.none) out = "Nobody voted, so the Ravana escapes with 2 points.";
    else if (R.tie) out = "The votes were split, so the Ravana escapes with 2 points.";
    else out = "The group picked the wrong person. The Ravana escapes with 2 points.";
    var chips = h.players.filter(function (id) { return R.voted[id]; }).map(function (id) { return '<span class="vchip' + (R.voted[id] === h.ravanaId ? " right" : "") + '">' + avOf(id, 46) + ic("arrow") + avOf(R.voted[id], 46) + "</span>"; }).join("");
    var last = h.settings.rounds && h.round >= h.settings.rounds, rn = esc(rname(h.ravanaId));
    if (R.caught) {
      out = R.guessOk ? rn + " guessed it, so they steal 2 points. Everyone who caught them still gets 1."
        : (R.guess ? rn + "\u2019s guess, \u201c" + esc(R.guess) + "\u201d, was wrong. Everyone who caught them gets a point." : rn + " didn't guess. Everyone who caught them gets a point.");
      return '<div class="reveal quick ' + (R.guessOk ? "bad" : "good") + '"><div class="rdraw">' + rangoli("draw", "draw") + "</div>" +
        '<p class="r1">The secret word was</p><p class="r3 big"><span class="rword disp">' + esc(h.word) + "</span></p>" + '<p class="r4">' + out + "</p>" +
        (chips ? '<div class="r5 vchips">' + chips + "</div>" : "") +
        '<div class="r6 actrow">' + B(last ? "See final results" : "Next round", "next", null, "big", "data-primary") + "</div></div>";
    }
    return '<div class="reveal bad"><div class="rdraw">' + rangoli("draw", "draw") + "</div>" +
      '<p class="r1">The real Ravana was</p><div class="r2">' + avOf(h.ravanaId, 150, "red") + '<span class="rname disp">' + rn + "</span></div>" +
      '<p class="r3">The word was <span class="rword disp">' + esc(h.word) + "</span></p>" + '<p class="r4">' + out + "</p>" +
      (chips ? '<div class="r5 vchips">' + chips + "</div>" : "") +
      '<div class="r6 actrow">' + B(last ? "See final results" : "Next round", "next", null, "big", "data-primary") + "</div></div>";
  }
  if (ph === "skipped") {
    return '<h1 class="h1">Round skipped</h1><p class="sub">' + esc(h.notice) + "</p>" + '<div class="actrow">' + B("Next round", "next", null, "big", "data-primary") + "</div>";
  }
  if (ph === "final") {
    var ids = roster().sort(function (a, b) { return (h.scores[b] || 0) - (h.scores[a] || 0); });
    var rank = function (id) { return 1 + ids.filter(function (o) { return (h.scores[o] || 0) > (h.scores[id] || 0); }).length; };
    var top = ids.slice(0, 3), order = [top[1], top[0], top[2]], cls = ["p2", "p1", "p3"];
    var pod = order.map(function (id, i) { if (!id) return '<div class="pod ' + cls[i] + ' none"></div>'; var rk2 = rank(id); return '<div class="pod ' + cls[i] + '">' + avOf(id, i === 1 ? 150 : 120) + '<span class="pnm">' + esc(rname(id)) + '</span><span class="psc">' + (h.scores[id] || 0) + " point" + ((h.scores[id] || 0) === 1 ? "" : "s") + '</span><div class="block"><span class="disp">' + rk2 + "</span></div></div>"; }).join("");
    var winners = ids.filter(function (id) { return rank(id) === 1; });
    var title = !winners.length ? "Happy Diwali!" : (winners.length === 1 ? esc(rname(winners[0])) + " wins!" : (winners.length === 2 ? esc(rname(winners[0])) + " and " + esc(rname(winners[1])) + " tie!" : "A " + winners.length + "-way tie!"));
    return '<h1 class="h1 ftitle">' + title + '</h1><p class="sub fsub">Happy Diwali, everyone.</p>' + '<div class="podium">' + pod + "</div>" +
      '<div class="actrow">' + B("Play again", "again", null, "big", "data-primary") + "</div>";
  }
  return "";
}
function tvOverlay(h) {
  if (T.showSet) {
    var plist = roster().map(function (id) { return B(avOf(id, 40) + "<span>" + esc(rname(id)) + "</span>", "remove", id, "ghost chip pchip"); }).join("") || '<span class="muted">No players yet</span>';
    return '<div class="ov open"><div class="ovin set"><h2 class="h2 disp">Settings</h2>' +
      '<div class="setrow"><span class="lbl">Screen size</span>' + IB("fitminus", "minus", "Smaller") + '<b class="val">' + Math.round(T.fit.size * 100) + "%</b>" + IB("fitplus", "plus", "Bigger") + '<span class="muted">Make it smaller if the edges are cut off</span></div>' +
      '<div class="setrow"><span class="lbl">Move screen</span>' + IB("fitup", "up", "Move up") + IB("fitdown", "down", "Move down") + '<span class="muted">Move it down if the browser bar covers the top</span></div>' +
      '<div class="setrow"><span class="lbl">Sound</span>' + B(MUS.on ? "Music on" : "Music off", "music", null, "chip" + (MUS.on ? " sel" : "")) + B(SND.on ? "Effects on" : "Effects off", "sound", null, "chip" + (SND.on ? " sel" : "")) + B("Full screen", "full", null, "chip") + "</div>" +
      '<div class="setrow wrap"><span class="lbl">Remove</span>' + plist + "</div>" +
      '<div class="setrow"><span class="lbl">Game</span>' + B("End game, back to lobby", "endgame", null, "ghost chip") + B(T.confirmNew ? "Press again to confirm" : "New room code", "newroom", null, "ghost chip" + (T.confirmNew ? " danger" : "")) + "</div>" +
      '<div class="actrow">' + B("Done", "closeset", null, "", "data-primary") + "</div></div></div>";
  }
  if (h.paused) {
    return '<div class="ov open"><div class="ovin">' + diya("big-diya") + '<h1 class="h1">Paused</h1><p class="sub">Timers are stopped on every screen.</p>' +
      '<div class="actrow">' + B("Resume", "resume", null, "big", "data-primary") + B("Settings", "settings", null, "ghost") + "</div></div></div>";
  }
  return "";
}

/* ================= phone (player) ================= */
var P = { me: null, net: null, code: "", st: null, off: 0, hostSeen: 0, finding: false, joinStart: 0, err: "", menu: false, confirmLeave: false, guessDraft: "", lastTurn: "", sel: -1, wake: null };
function loadMe() { P.me = lsGet("ravana_me") || { id: "p_" + rid(12), name: "", av: -1 }; if (!P.me.id) P.me.id = "p_" + rid(12); lsSet("ravana_me", P.me); }
function savedRoom() { var r = lsGet("ravana_room"); return r && now() - (r.ts || 0) < CFG.saveHours * 3600000 ? r : null; }
function hostOf() {
  if (!P.net) return null;
  var best = null;
  Object.keys(P.net.peers).forEach(function (id) {
    var p = P.net.peers[id]; if (p.st.role !== "host" || p.st.code !== P.code) return;
    if (!best || p.seen > best.seen || (p.seen === best.seen && (p.st._ts || 0) > (best.st._ts || 0))) best = p;
  });
  return best;
}
function HS() { var b = hostOf(); return b ? b.st : null; }
function requestWake() {
  try { if (navigator.wakeLock && !document.hidden) navigator.wakeLock.request("screen").then(function (w) { P.wake = w; }).catch(function () { }); } catch (e) { }
}
document.addEventListener("visibilitychange", function () { if (!document.hidden && S.view === "phone") requestWake(); });

function startJoin(code) {
  stopDiscovery();
  code = String(code || "").replace(/\D/g, "").slice(0, 4);
  if (code.length !== 4) { P.err = "Enter the 4-digit code from the TV."; setView("join1"); return; }
  if (P.net && P.code !== code) { P.net.stop(false); P.net = null; }
  P.code = code; P.err = ""; P.finding = true; P.joinStart = now(); P.hostSeen = 0;
  if (!P.net) { P.net = Net(code, { peers: phOnPeers, status: function () { if (S.view === "phone") phRender(); } }); P.net.start(P.me.id); }
  setView("finding");
}
function phOnPeers() {
  var b = hostOf();
  if (b && b.seen && b.seen > P.hostSeen) { P.hostSeen = b.seen; P.off = (b.st.now || b.st._ts) - b.seen; }
  if (S.view === "finding" && b) {
    var h = b.st, sr = savedRoom();
    P.finding = false;
    if (h.roster[P.me.id] && !h.removed[P.me.id] && P.me.name) { goPhone(); return; }
    if (sr && sr.code === P.code && sr.sess === h.sess && P.me.name && !h.removed[P.me.id] && !(h.rejected && h.rejected[P.me.id])) { goPhone(); return; }
    setView("join2"); return;
  }
  if (S.view === "join2") { patch("j2grid", avGrid(HS())); return; }
  if (S.view === "phone") {
    var H2 = HS();
    if (H2 && P.st && P.st.sess !== H2.sess) { P.st.sess = H2.sess; phPub(); return; }
    if (H2 && H2.phase === "clues" && H2.order[H2.clueIdx] === P.me.id) { var k = H2.rk + ":" + H2.clueIdx; if (P.lastTurn !== k) { P.lastTurn = k; vibrate([90, 50, 90]); } }
    phAutoResend(H2);
    phRender();
  }
}
/* if the TV hasn't confirmed something we sent, push our presence again */
function phAutoResend(h) {
  if (!h || !P.st || !P.net) return;
  var need = false;
  if (h.rk && P.st.vote && P.st.vote.rk === h.rk && h.phase === "vote" && h.ack.voted.indexOf(P.me.id) < 0) need = true;
  if (h.rk && P.st.saw === h.rk && h.phase === "peek" && h.ack.saw.indexOf(P.me.id) < 0) need = true;
  if (need && (!P.lastResend || now() - P.lastResend > 3000)) { P.lastResend = now(); P.net.publish(P.st); }
}
function goPhone() {
  var h = HS(); if (!h) return;
  var saved = lsGet("ravana_pst");
  var base = { app: "ravana", role: "player", id: P.me.id, code: P.code, sess: h.sess, name: P.me.name, av: P.me.av, left: false, joinedAt: now(), saw: "", ready: "", vote: null, guess: null, cmd: null };
  if (saved && saved.id === P.me.id && saved.sess === h.sess && saved.code === P.code) base = Object.assign(base, { saw: saved.saw || "", ready: saved.ready || "", vote: saved.vote || null, guess: saved.guess || null, joinedAt: saved.joinedAt || base.joinedAt });
  P.st = base;
  lsSet("ravana_room", { code: P.code, sess: h.sess, ts: now() });
  requestWake();
  setView("phone");
  phPub();
}
function phPub() { if (!P.st || !P.net) return; P.net.publish(P.st); lsSet("ravana_pst", P.st); var r = savedRoom(); if (r) { r.ts = now(); lsSet("ravana_room", r); } phRender(); }
function phCmd(type) { var h = HS(); if (!h) return; P.st.cmd = { seq: now(), type: type, rk: h.rk, idx: h.clueIdx }; phPub(); }
function phStatus(h) {
  if (!h) return "nohost";
  var me = P.me.id;
  if (h.removed && h.removed[me]) return "removed";
  if (h.rejected && h.rejected[me] && !h.roster[me]) return "rejected";
  if (!h.roster[me]) return "joining";
  if (h.phase === "lobby") return "lobby";
  if (h.phase === "final") return "final";
  if (h.players.indexOf(me) < 0) return "waiting";
  return h.phase;
}
function pName(h, id) { var p = h.roster[id] || (h.ghosts && h.ghosts[id]); return p ? p.name : "Someone"; }
function pAv(h, id, size, cls) { var p = h.roster[id] || (h.ghosts && h.ghosts[id]) || {}; return avHTML(p.name, p.av, size, cls); }

function phRender() {
  if (S.view !== "phone") return;
  if (!document.getElementById("phMain")) setRoot('<div class="ph"><header class="phh" id="phHead"></header><main class="phm" id="phMain"></main><div id="phOv"></div></div>');
  var h = HS(), stt = phStatus(h);
  patch("phHead", phHead(h));
  patch("phMain", phMain(h, stt), stt + "|" + (h ? h.rk + "|" + h.phase : ""));
  patch("phOv", phOv(h, stt));
  updateTimers(P.off);
}
function phHead(h) {
  var conn = P.net && P.net.connected > 0, vip = h && h.vip === P.me.id;
  return avHTML(P.me.name, P.me.av, 40) + '<span class="who">' + esc(P.me.name) + (vip ? '<span class="crown">' + ic("crown") + "</span>" : "") + "</span>" +
    '<span class="room"><span class="dot ' + (conn ? "on" : "off") + '"></span>Room ' + esc(P.code) + "</span>" + IB("menu", "dots", "Menu");
}
function card(h, small) {
  var mine = h.ravanaId === P.me.id;
  var back = mine
    ? '<div class="face back rav"><span class="kick">You are the</span><span class="cw disp">Ravana</span><span class="ct">You don\'t know the word. Your hint: it\'s about <b>' + esc(h.cat) + "</b>. Blend in.</span></div>"
    : '<div class="face back"><span class="kick">The secret word</span><span class="cw disp">' + esc(h.word) + '</span><span class="ct">Give clues that fit it, without saying it.</span></div>';
  return '<div class="card3d' + (small ? " small" : "") + '" data-hold="1"><div class="inner"><div class="face front"><div class="fr">' + rangoli("gold") + "</div>" + diya("card-diya") + '<span class="hold">Hold to see your card</span></div>' + back + "</div></div>";
}
function phMain(h, stt) {
  var me = P.me.id, vipC = h && h.vip === me && !h.paused;
  if (stt === "nohost") return '<div class="center">' + diya("big-diya") + '<h2 class="h2 disp">Looking for the TV</h2><p class="sub">Make sure the TV page is still open.</p></div>';
  if (stt === "joining") return '<div class="center">' + diya("big-diya") + '<h2 class="h2 disp">Joining room ' + esc(P.code) + '</h2><p class="sub">Hang on a second…</p></div>';
  if (stt === "rejected") {
    var why = String(h.rejected[me] || "").split(":")[0];
    return '<div class="center"><h2 class="h2 disp">' + (why === "full" ? "This room is full" : "That name is taken") + '</h2><p class="sub">' + (why === "full" ? "The game is limited to 8 players." : "Someone in this room already uses that name. Pick another one.") + "</p>" +
      '<div class="acts">' + (why === "full" ? B("Back to the start", "home", null, "ghost") : B("Change my name", "changename", null, "")) + "</div></div>";
  }
  if (stt === "removed") return '<div class="center"><h2 class="h2 disp">You were removed</h2><p class="sub">The TV removed you from this game.</p><div class="acts">' + B("Join again", "joinagain", null, "") + "</div></div>";
  if (stt === "lobby") {
    var ids = Object.keys(h.roster).sort(function (a, b) { return h.roster[a].joinedAt - h.roster[b].joinedAt; });
    var n = ids.length;
    return '<div class="center">' + avHTML(P.me.name, h.roster[me].av, 120, "pop") + '<h2 class="h2 disp">You\'re in, ' + esc(P.me.name) + "!</h2>" +
      '<div class="mini">' + ids.map(function (id) { return '<span class="mchip">' + pAv(h, id, 34) + esc(pName(h, id)) + "</span>"; }).join("") + "</div>" +
      (vipC ? '<div class="acts">' + B("Start the game", "cmd", "start", "big", n < CFG.minP ? "disabled" : "") + '<p class="note">' + (n < CFG.minP ? "Need at least 3 players." : "You have the crown, so you can start.") + "</p></div>"
        : '<p class="sub">Waiting for ' + (h.vip ? esc(pName(h, h.vip)) : "the TV") + " to start the game.</p>") + "</div>";
  }
  if (stt === "waiting") return '<div class="center">' + diya("big-diya") + '<h2 class="h2 disp">Round ' + h.round + " is on</h2><p class=\"sub\">You'll be dealt in next round. Watch the TV and enjoy the chaos.</p></div>";
  if (stt === "peek") {
    var seen = P.st.saw === h.rk, acked = h.ack.saw.indexOf(me) >= 0;
    return card(h) + '<div class="acts">' + (seen ? '<p class="status">' + (acked ? ic("check") + " Got it. Waiting for the others (" + h.ack.saw.length + " of " + h.players.length + ")" : "Sending…") + "</p>" : B("Got it", "saw", null, "big")) +
      (vipC ? B("Start the clues now", "cmd", "skip", "ghost") : "") + "</div>";
  }
  if (stt === "clues") {
    var cur = h.order[h.clueIdx], mine = cur === me, pos = h.order.indexOf(me);
    return card(h, true) + (mine ? '<div class="turn">Your turn! Say one word.</div><div class="acts">' + B("I said my word", "cmd", "done", "big") + "</div>"
      : '<div class="upnow">' + pAv(h, cur, 52) + '<div><span class="k">Up now</span><b>' + esc(pName(h, cur)) + "</b></div></div>" +
      '<p class="sub">' + (pos > h.clueIdx ? "You're number " + (pos + 1) + "." : "You've given your clue.") + "</p>" +
      (vipC ? '<div class="acts">' + B("Skip to next speaker", "cmd", "skip", "ghost") + "</div>" : ""));
  }
  if (stt === "discuss") {
    var ready = P.st.ready === h.rk, pl = h.paused ? h.pauseLeft.timer : null;
    return card(h, true) + '<h2 class="h2 disp">Talk it out</h2><p class="sub">Who doesn\'t know the word? ' + tText(h.timerEnd, pl) + " left.</p>" +
      '<div class="acts">' + B(ready ? "Ready ✓ (tap to undo)" : "I'm ready to vote", "ready", null, ready ? "ghost big" : "big") + (vipC ? B("Start the vote now", "cmd", "votenow", "ghost") : "") + "</div>";
  }
  if (stt === "vote") {
    var my = P.st.vote && P.st.vote.rk === h.rk ? P.st.vote.t : "", ok = h.ack.voted.indexOf(me) >= 0, pl2 = h.paused ? h.pauseLeft.timer : null;
    var opts = h.players.filter(function (id) { return id !== me; }).map(function (id) { return '<button type="button" class="vbtn' + (my === id ? " sel" : "") + '" data-act="vote" data-arg="' + id + '" data-k="vote:' + id + '">' + pAv(h, id, 46) + '<span class="vnm">' + esc(pName(h, id)) + "</span>" + (my === id ? ic("check") : "") + "</button>"; }).join("");
    return '<h2 class="h2 disp">Who is the Ravana?</h2><p class="sub">' + tText(h.timerEnd, pl2) + " left to vote</p>" + '<div class="vlist">' + opts + "</div>" +
      '<p class="status">' + (my ? (ok ? ic("check") + " The TV has your vote. You can change it." : "Sending your vote…") : "Tap a name to vote.") + "</p>";
  }
  if (stt === "verdict") return '<div class="center">' + diya("big-diya") + '<h2 class="h2 disp">Look at the TV!</h2><p class="sub">The votes are in.</p>' + (vipC ? '<div class="acts">' + B("Continue", "cmd", "skip", "ghost") + "</div>" : "") + "</div>";
  if (stt === "guess") {
    if (h.ravanaId === me) {
      var sent = P.st.guess && P.st.guess.rk === h.rk;
      if (h.result && h.result.guess != null) return '<div class="center"><h2 class="h2 disp">' + (h.result.guessOk ? "You got it!" : "Not quite") + '</h2><p class="sub">Your guess: <b>' + esc(h.result.guess || "none") + "</b></p></div>";
      return '<div class="center"><h2 class="h2 disp">You were caught!</h2><p class="sub">Guess the secret word to steal 2 points. Your hint was <b>' + esc(h.cat) + "</b></p>" +
        '<form class="gform" data-form="guess"><input id="guessIn" class="field" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="Your guess" value="' + esc(P.guessDraft) + '">' +
        '<button class="btn big" type="submit"' + (sent ? " disabled" : "") + ">" + (sent ? "Sent" : "Submit my guess") + "</button></form></div>";
    }
    return '<div class="center">' + pAv(h, h.ravanaId, 110, "red") + '<h2 class="h2 disp">' + esc(pName(h, h.ravanaId)) + "'s last chance</h2><p class=\"sub\">They're guessing the word on their phone.</p></div>";
  }
  if (stt === "reveal") {
    var R = h.result, d = R.delta[me] || 0;
    return '<div class="center">' + pAv(h, h.ravanaId, 96, R.caught ? "" : "red") + '<p class="sub">The Ravana was <b>' + esc(pName(h, h.ravanaId)) + "</b></p>" +
      '<p class="sub">The word was <b>' + esc(h.word) + "</b></p>" + '<div class="pts disp' + (d ? " got" : "") + '">+' + d + '</div><p class="sub">You have ' + (h.scores[me] || 0) + " point" + ((h.scores[me] || 0) === 1 ? "" : "s") + ".</p>" +
      (vipC ? '<div class="acts">' + B(h.settings.rounds && h.round >= h.settings.rounds ? "See final results" : "Next round", "cmd", "next", "big") + "</div>" : '<p class="note">Next round starts from the TV' + (h.vip ? " or " + esc(pName(h, h.vip)) + "'s phone" : "") + ".</p>") + "</div>";
  }
  if (stt === "skipped") return '<div class="center"><h2 class="h2 disp">Round skipped</h2><p class="sub">' + esc(h.notice) + "</p>" + (vipC ? '<div class="acts">' + B("Next round", "cmd", "next", "big") + "</div>" : "") + "</div>";
  if (stt === "final") {
    var ids2 = Object.keys(h.roster), mine2 = h.scores[me] || 0, rank = 1 + ids2.filter(function (o) { return (h.scores[o] || 0) > mine2; }).length;
    var suf = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
    return '<div class="center">' + avHTML(P.me.name, P.me.av, 110, "pop") + '<h2 class="h2 disp">You came ' + rank + suf + '</h2><div class="pts disp got">' + mine2 + '</div><p class="sub">points. Happy Diwali!</p>' +
      (vipC ? '<div class="acts">' + B("Play again", "cmd", "again", "big") + "</div>" : "") + "</div>";
  }
  return "";
}
function phOv(h, stt) {
  var out = "";
  if (P.menu) {
    var vip = h && h.vip === P.me.id;
    out += '<div class="backdrop" data-act="closemenu"></div><div class="sheet"><h3 class="disp">Room ' + esc(P.code) + "</h3>" +
      (vip && h && isRoundPhase(h.phase) ? B(h.paused ? "Resume the game" : "Pause the game", "cmd", h.paused ? "resume" : "pause", "ghost") : "") +
      (P.confirmLeave ? B("Yes, leave the game", "leaveyes", null, "danger") : B("Leave the game", "leave", null, "ghost")) +
      B("Close", "closemenu", null, "") + "</div>";
  }
  if (h && h.paused && stt !== "joining") out += '<div class="pov">' + diya("big-diya") + '<h2 class="h2 disp">Paused</h2><p class="sub">The game is paused on the TV.</p>' + (h.vip === P.me.id ? B("Resume", "cmd", "resume", "big") : "") + "</div>";
  var b = hostOf();
  if (P.net && P.net.connected > 0 && (!b || !b.seen || now() - b.seen > 35000) && now() - P.net.started > 15000 && stt !== "removed") {
    out += '<div class="pov">' + diya("big-diya") + '<h2 class="h2 disp">Can\'t reach the TV</h2><p class="sub">Is the game still open on the TV? We\'ll reconnect automatically when it\'s back.</p>' + B("Join with a different code", "newcode", null, "ghost") + "</div>";
  } else if (P.net && P.net.connected === 0 && now() - P.net.started > 4000) {
    out += '<div class="netbar">Reconnecting…</div>';
  }
  return out;
}

/* ================= home + join ================= */
function stopDiscovery() { if (S.disc) { S.disc.stop(); S.disc = null; } }
function startDiscovery() {
  if (S.disc || !window.mqtt) return;
  lanKey(function (k) {
    if (!k || S.disc || (S.view !== "home" && S.view !== "join1")) return;
    S.disc = Discover(k, function () { if (S.view === "home") patch("homeLan", homeLan()); else if (S.view === "join1") patch("j1Lan", homeLan()); });
  });
}
function homeLan() {
  var rooms = S.disc ? S.disc.list() : [];
  if (!rooms.length) return "";
  return '<div class="lan">' + rooms.slice(0, 3).map(function (r) {
    return B(ic("wifi") + "<span>Join the game on this Wi-Fi<small>Room " + esc(r.code) + " · " + r.n + " player" + (r.n === 1 ? "" : "s") + "</small></span>", "lanjoin", r.code, "lanbtn", IS_TOUCH ? "data-primary" : "");
  }).join("") + "</div>";
}
function renderHome() {
  var sr = savedRoom(), sh = savedHost();
  setRoot('<div class="home"><div class="htoran">' + lights(1920, 6, 30) + '</div><div class="hero">' + diya("hero-diya") + '<h1 class="title disp">Find the Ravana</h1><p class="tag">A Diwali party game. The TV runs the show, your phones hold the secrets.</p></div>' +
    '<div class="choices"><div id="homeLan">' + homeLan() + "</div>" +
    (sr && P.me.name ? B("Rejoin room " + esc(sr.code) + " as " + esc(P.me.name), "rejoin", sr.code, "rani big") : "") +
    B("Join a game", "join1", null, "big", IS_TOUCH ? "data-primary" : "") +
    B("Use this screen as the TV", "tvnew", null, "ghost big", IS_TOUCH ? "" : "data-primary") +
    (sh ? B("Resume the TV game (room " + esc(sh.code) + ")", "tvresume", null, "ghost") : "") +
    '</div><p class="foot">For 3 to 8 players. Rounds take about 3 minutes.</p></div>');
  startDiscovery();
  ensureFocus();
}
function renderJoin1() {
  setRoot('<div class="ph form"><header class="phh">' + IB("home", "back", "Back") + '<span class="who">Join a game</span></header><main class="phm">' +
    '<div id="j1Lan">' + homeLan() + "</div>" +
    '<form data-form="code" class="stack"><label class="lbl" for="codeIn">Room code from the TV</label><input id="codeIn" class="field code disp" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="0000" value="' + esc(P.code) + '">' +
    (P.err ? '<p class="err">' + esc(P.err) + "</p>" : "") + '<button class="btn big" type="submit">Find the room</button></form></main></div>');
  startDiscovery();
  var ci = document.getElementById("codeIn"); if (ci && !P.code && !IS_TOUCH) ci.focus();
}
function renderFinding() {
  setRoot('<div class="ph"><main class="phm"><div class="center">' + diya("big-diya") + '<h2 class="h2 disp">Finding room ' + esc(P.code) + '</h2><p class="sub" id="findMsg">Connecting to the TV…</p><div class="acts">' + B("Use a different code", "join1", null, "ghost") + "</div></div></main></div>");
}
function avGrid(h) {
  var used = {}, names = [];
  if (h) Object.keys(h.roster).forEach(function (id) { if (id !== P.me.id) used[h.roster[id].av] = true; });
  if (P.sel < 0 || used[P.sel]) { P.sel = P.me.av >= 0 && !used[P.me.av] ? P.me.av : -1; if (P.sel < 0) for (var i = 0; i < AVATARS.length; i++) if (!used[i]) { P.sel = i; break; } }
  return AVATARS.map(function (a, i) { return '<button type="button" class="avpick' + (P.sel === i ? " sel" : "") + '" data-act="pickav" data-arg="' + i + '" data-k="pickav:' + i + '"' + (used[i] ? " disabled" : "") + ">" + avHTML(P.me.name || "?", i, 54) + "</button>"; }).join("");
}
function renderJoin2() {
  var h = HS();
  setRoot('<div class="ph form"><header class="phh">' + IB("join1", "back", "Back") + '<span class="who">Room ' + esc(P.code) + '</span></header><main class="phm">' +
    '<form data-form="name" class="stack"><label class="lbl" for="nameIn">Your name</label><input id="nameIn" class="field" maxlength="14" autocomplete="given-name" autocapitalize="words" placeholder="Name" value="' + esc(P.me.name) + '">' +
    '<span class="lbl">Pick your look</span><div class="avgrid" id="j2grid">' + avGrid(h) + "</div>" +
    (P.err ? '<p class="err">' + esc(P.err) + "</p>" : "") + '<button class="btn big" type="submit">Join the game</button>' +
    (P.me.name ? '<button type="button" class="linkbtn" data-act="newme">Not ' + esc(P.me.name) + "? Join as someone new</button>" : "") + "</form></main></div>");
}
function setView(v) {
  S.view = v; S.cache = {}; S.ckey = {};
  if (v === "home") renderHome();
  else if (v === "join1") renderJoin1();
  else if (v === "finding") renderFinding();
  else if (v === "join2") renderJoin2();
  else if (v === "phone") phRender();
  else if (v === "tv") tvRender();
}

/* ================= actions ================= */
var ACT = {
  /* home / join */
  home: function () { if (P.net && S.view !== "phone") { P.net.stop(false); P.net = null; } P.err = ""; setView("home"); },
  join1: function () { if (P.net) { P.net.stop(false); P.net = null; } P.err = ""; setView("join1"); },
  lanjoin: function (code) { startJoin(code); },
  rejoin: function (code) { startJoin(code); },
  pickav: function (i) { P.sel = +i; patch("j2grid", avGrid(HS())); },
  newme: function () { P.me = { id: "p_" + rid(12), name: "", av: -1 }; lsSet("ravana_me", P.me); lsDel("ravana_pst"); if (P.net) { P.net.stop(false); P.net = null; } startJoin(P.code); },
  /* TV */
  tvnew: function () { SND.unlock(); tvStart(false); },
  tvresume: function () { SND.unlock(); tvStart(true); },
  setRounds: function (v) { T.H.settings.rounds = +v; tvPub(); },
  setTalk: function (v) { T.H.settings.talk = +v; tvPub(); },
  start: function () { startGame(); tvPub(); },
  skip: function () { if (T.H.phase === "peek") toClues(); else if (T.H.phase === "clues") nextSpeaker(); tvPub(); },
  votenow: function () { toVote(); tvPub(); },
  addtime: function () { T.H.timerEnd += 30000; T.H.timerTot += 30000; tvPub(); },
  count: function () { tally(); tvPub(); },
  verdictnext: function () { if (T.H.phase === "verdict") { afterVerdict(); tvPub(); } },
  "continue": function () { var r = T.H.result; if (r && r.guess == null) { r.guess = ""; r.guessOk = false; } finishRound(); tvPub(); },
  override: function (v) { var r = T.H.result; r.guessOk = v === "1"; T.H.timerEnd = now() + CFG.afterGuessMs; T.H.timerTot = CFG.afterGuessMs; tvPub(); },
  next: function () { nextRound(); tvPub(); },
  again: function () { playAgain(); tvPub(); },
  pause: function () { doPause(); tvPub(); },
  resume: function () { doResume(); tvPub(); },
  music: function () { MUS.on = !MUS.on; lsSet("ravana_music", MUS.on); SND.unlock(); if (!MUS.on) MUS.setMood("off", true); else { MUS.mood = null; } if (S.view === "tv") { S.cache.tvHead = S.cache.tvOv = null; tvRender(); } },
  sound: function () { SND.on = !SND.on; lsSet("ravana_snd", SND.on); SND.unlock(); if (SND.on) SND.join(); if (S.view === "tv") { S.cache.tvHead = S.cache.tvOv = null; tvRender(); } },
  settings: function () { T.showSet = true; T.confirmNew = false; tvRender(); },
  closeset: function () { T.showSet = false; T.confirmNew = false; tvRender(); },
  fitplus: function () { T.fit.size = Math.min(1, +(T.fit.size + 0.02).toFixed(2)); lsSet("ravana_fit", T.fit); fitTV(); tvRender(); },
  fitminus: function () { T.fit.size = Math.max(0.7, +(T.fit.size - 0.02).toFixed(2)); lsSet("ravana_fit", T.fit); fitTV(); tvRender(); },
  fitup: function () { T.fit.y = Math.max(-0.12, +(T.fit.y - 0.01).toFixed(3)); lsSet("ravana_fit", T.fit); fitTV(); },
  fitdown: function () { T.fit.y = Math.min(0.12, +(T.fit.y + 0.01).toFixed(3)); lsSet("ravana_fit", T.fit); fitTV(); },
  full: function () {
    var d = document, el = d.documentElement;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
      else { var p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (p && p.catch) p.catch(function () { }); }
    } catch (e) { }
    setTimeout(fitTV, 400);
  },
  remove: function (id) { removePlayer(id, "removed"); tvPub(); },
  endgame: function () { playAgain(); T.showSet = false; tvPub(); },
  newroom: function () { if (!T.confirmNew) { T.confirmNew = true; tvRender(); return; } T.confirmNew = false; T.showSet = false; lsDel("ravana_host"); tvStart(false); },
  /* phone */
  saw: function () { var h = HS(); if (!h) return; P.st.saw = h.rk; phPub(); },
  ready: function () { var h = HS(); if (!h) return; P.st.ready = P.st.ready === h.rk ? "" : h.rk; phPub(); },
  vote: function (id) { var h = HS(); if (!h || h.phase !== "vote") return; P.st.vote = { rk: h.rk, t: id }; vibrate(15); phPub(); },
  cmd: function (type) { P.menu = false; P.confirmLeave = false; phCmd(type); },
  menu: function () { P.menu = true; P.confirmLeave = false; phRender(); },
  closemenu: function () { P.menu = false; P.confirmLeave = false; phRender(); },
  leave: function () { P.confirmLeave = true; phRender(); },
  leaveyes: function () {
    if (P.st && P.net) { P.st.left = true; P.net.publish(P.st); }
    var n = P.net; P.net = null; setTimeout(function () { if (n) n.stop(false); }, 1500);
    lsDel("ravana_room"); lsDel("ravana_pst"); P.menu = false; P.confirmLeave = false; P.st = null; setView("home");
  },
  newcode: function () { if (P.net) { P.net.stop(false); P.net = null; } lsDel("ravana_room"); P.code = ""; setView("join1"); },
  changename: function () { setView("join2"); },
  joinagain: function () { P.me = { id: "p_" + rid(12), name: P.me.name, av: P.me.av }; lsSet("ravana_me", P.me); lsDel("ravana_pst"); var c = P.code; if (P.net) { P.net.stop(false); P.net = null; } startJoin(c); }
};
var FORMS = {
  code: function () { var v = (document.getElementById("codeIn") || {}).value || ""; startJoin(v); },
  name: function () {
    var name = String((document.getElementById("nameIn") || {}).value || "").trim().slice(0, 14), h = HS();
    if (!name) { P.err = "Type your name."; renderJoin2(); return; }
    if (h && Object.keys(h.roster).some(function (id) { return id !== P.me.id && h.roster[id].name.toLowerCase() === name.toLowerCase(); })) { P.err = "Someone already uses that name. Add an initial."; P.me.name = name; renderJoin2(); return; }
    if (h && !h.roster[P.me.id] && Object.keys(h.roster).length >= CFG.maxP) { P.err = "This room is full."; renderJoin2(); return; }
    P.me.name = name; P.me.av = P.sel; P.err = ""; lsSet("ravana_me", P.me);
    if (h && h.rejected && h.rejected[P.me.id]) { P.me.id = "p_" + rid(12); lsSet("ravana_me", P.me); var c = P.code; P.net.stop(false); P.net = null; P.code = c; P.net = Net(c, { peers: phOnPeers, status: function () { phRender(); } }); P.net.start(P.me.id); var wait = setInterval(function () { if (HS()) { clearInterval(wait); goPhone(); } }, 200); return; }
    goPhone();
  },
  guess: function () {
    var h = HS(), v = String((document.getElementById("guessIn") || {}).value || "").trim();
    if (!h || !v) return;
    P.guessDraft = v; P.st.guess = { rk: h.rk, text: v }; if (document.activeElement) document.activeElement.blur(); phPub();
  }
};

/* ================= events ================= */
document.addEventListener("click", function (e) {
  var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
  if (!t || t.disabled) return;
  SND.unlock();
  var f = ACT[t.getAttribute("data-act")];
  if (f) { e.preventDefault(); f(t.getAttribute("data-arg"), t); }
});
document.addEventListener("submit", function (e) { e.preventDefault(); var f = FORMS[e.target.getAttribute("data-form")]; if (f) f(); });
document.addEventListener("input", function (e) {
  var t = e.target;
  if (t.id === "guessIn") P.guessDraft = t.value;
  if (t.id === "codeIn") { var v = t.value.replace(/\D/g, "").slice(0, 4); if (v !== t.value) t.value = v; P.code = v; if (v.length === 4 && IS_TOUCH) { t.blur(); } }
  if (t.id === "nameIn") P.me.name = t.value;
});
document.addEventListener("keydown", function (e) {
  SND.unlock();
  var k = e.key || "", code = e.keyCode, ae = document.activeElement, inInput = ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
  var dir = (k === "ArrowLeft" || code === 37) ? "l" : (k === "ArrowRight" || code === 39) ? "r" : (k === "ArrowUp" || code === 38) ? "u" : (k === "ArrowDown" || code === 40) ? "d" : "";
  var back = code === 10009 || code === 461 || k === "Escape" || k === "GoBack" || (k === "Backspace" && !inInput);
  if (back) {
    if (S.view === "tv" && T.showSet) { e.preventDefault(); ACT.closeset(); }
    else if (S.view === "phone" && P.menu) { e.preventDefault(); ACT.closemenu(); }
    return;
  }
  if (!dir) return;
  if (inInput && (dir === "l" || dir === "r")) return;
  e.preventDefault(); moveFocus(dir);
});
function onHold(on) {
  var c = document.querySelector(".card3d"); if (!c) return;
  if (on) { c.classList.add("flip"); S.holding = true; vibrate(8); }
  else { c.classList.remove("flip"); S.holding = false; if (S.view === "phone") setTimeout(phRender, 50); }
}
document.addEventListener("pointerdown", function (e) { if (e.target.closest && e.target.closest("[data-hold]")) { e.preventDefault(); onHold(true); } });
["pointerup", "pointercancel"].forEach(function (ev) { document.addEventListener(ev, function () { if (S.holding) onHold(false); }); });
document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest("[data-hold]")) e.preventDefault(); });
window.addEventListener("resize", function () { fitTV(); });
window.addEventListener("hashchange", function () { route(); });

setInterval(function () {
  if (S.view === "tv") tvTick();
  else if (S.view === "phone") { updateTimers(P.off); if (P.net) { var h = HS(); phAutoResend(h); patch("phOv", phOv(h, phStatus(h))); } }
  else if (S.view === "finding" && P.finding && now() - P.joinStart > 12000) {
    P.finding = false; P.err = "No TV found with code " + P.code + ". Check the code on the TV screen.";
    if (P.net) { P.net.stop(false); P.net = null; } setView("join1");
  } else if (S.view === "finding" && P.net) {
    var m = document.getElementById("findMsg"); if (m) m.textContent = P.net.connected ? "Connected. Looking for the TV…" : "Connecting…";
  } else if ((S.view === "home" || S.view === "join1") && S.disc) { patch(S.view === "home" ? "homeLan" : "j1Lan", homeLan()); }
}, 250);

function route() {
  var m = /#join-(\d{4})/.exec(location.hash || "");
  if (m && S.view !== "phone" && S.view !== "tv") { startJoin(m[1]); return true; }
  return false;
}
window.addEventListener("load", function () { FX.init(); });
(function boot() {
  S.emoji = emojiSupport();
  loadMe();
  FX.init();
  if (!route()) setView("home");
})();
window.RV = { S: S, T: T, P: P, ACT: ACT, FORMS: FORMS, HS: HS, CFG: CFG };
