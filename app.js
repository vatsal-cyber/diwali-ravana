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
/* ================= utils ================= */
var GAMES = {
  ravana: { name: "Find the Ravana", blurb: "Everyone gets the same secret word, except the Ravana, who only gets a hint. Give clues, talk, vote, find them.", minP: 3, foot: "3 to 8 players. Rounds take about 3 minutes." },
  zoom: { name: "Pehchaan Kaun?", blurb: "A sweet or snack, Indian or from around the world, starts zoomed way in and slowly zooms out. Name it on your phone before time runs out. One player at a time, most right wins.", minP: 2, foot: "2 to 8 players. Each turn is one minute." }
};
var FOOD_FALLBACK = [["jalebi", "Jalebi", "s"], ["gulab_jamun", "Gulab jamun", "s"], ["kaju_katli", "Kaju katli", "s"], ["rasgulla", "Rasgulla", "s"], ["samosa", "Samosa", "n"], ["pani_puri", "Pani puri", "n"], ["dhokla", "Dhokla", "n"], ["vada_pav", "Vada pav", "n"]];
var FOOD_INFO = {};
var FOODS = (window.FOOD_DB && window.FOOD_DB.length ? window.FOOD_DB : FOOD_FALLBACK.map(function (x) { return { id: x[0], n: x[1], t: x[2], g: "", aka: "", r: "", c: "in", f: [50, 50] }; })).map(function (f) { FOOD_INFO[f.id] = f; return [f.id, f.n, f.t, f.c || "in"]; });
function foodSrc(k) { return "food/" + k + ".jpg?v=18"; }
var ZFOOD = [["mix", "Mix"], ["in", "Indian"], ["w", "World"]];
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
    '<path d="M10 61 Q60 56 110 61 Q105 97 60 100 Q15 97 10 61Z" fill="#2F8F5B"/>' +
    '<path d="M18 66 Q60 63 102 66 Q98 90 60 92 Q22 90 18 66Z" fill="#C93C7E"/>' +
    '<path d="M10 61 Q60 69 110 61" stroke="#1F6A42" stroke-width="3" fill="none"/>' +
    '<g fill="#F6D995"><circle cx="30" cy="77" r="3"/><circle cx="45" cy="82" r="3"/><circle cx="60" cy="84" r="3"/><circle cx="75" cy="82" r="3"/><circle cx="90" cy="77" r="3"/></g>' +
    '<path d="M36 89 Q60 95 84 89" stroke="#FFF6EC" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="2 4"/></svg>';
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
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>',
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
/* ================= the cast: lotus lamps ================= */
var LOTUS = [
  { c: "#FF2E8C", t: "#FFB3D6" }, { c: "#FF7A1A", t: "#FFD0A3" }, { c: "#1FB6A8", t: "#A9F0E6" }, { c: "#9B4DFF", t: "#D9C2FF" },
  { c: "#FFC21A", t: "#FFF0B3" }, { c: "#E8203C", t: "#FFB1B8" }, { c: "#2E8BFF", t: "#B8D8FF" }, { c: "#45C96A", t: "#C3F2CF" }, { c: "#FF8FB8", t: "#FFE0EC" }
];
var AVATARS = LOTUS;
var GOLD = "#F3C96B", GOLD2 = "#B98A2D", GOLD3 = "#FFE7A8";
function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
function petalD(len, w) { return "M0,0 C" + w + "," + (-len * 0.32).toFixed(1) + " " + (w * 0.58).toFixed(1) + "," + (-len * 0.9).toFixed(1) + " 0," + (-len) + " C" + (-w * 0.58).toFixed(1) + "," + (-len * 0.9).toFixed(1) + " " + (-w) + "," + (-len * 0.32).toFixed(1) + " 0,0Z"; }
/* a lotus lamp: layered petals with a rim light, a brass cup, a lit wick, and a pool of warm light below */
function lotusSVG(i, o) {
  o = o || {};
  var L = LOTUS[((i % LOTUS.length) + LOTUS.length) % LOTUS.length], uid = "lt" + (o.uid || i);
  var base = o.dark ? "#3A0618" : L.c, tip = o.dark ? "#7A1238" : L.t, deep = o.dark ? "#1C030C" : shade(L.c, 0.62), s = "";
  s += '<defs>' +
    '<linearGradient id="' + uid + 'a" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + deep + '"/><stop offset=".45" stop-color="' + base + '"/><stop offset=".85" stop-color="' + tip + '"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>' +
    '<linearGradient id="' + uid + 'b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + deep + '"/><stop offset=".6" stop-color="' + base + '"/><stop offset="1" stop-color="' + tip + '"/></linearGradient>' +
    '<linearGradient id="' + uid + 'c" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + shade(L.c, 0.4) + '"/><stop offset="1" stop-color="' + deep + '"/></linearGradient>' +
    '<radialGradient id="' + uid + 'g" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#FFD98A" stop-opacity=".85"/><stop offset=".4" stop-color="#FF9A3C" stop-opacity=".32"/><stop offset="1" stop-color="#FF6A2A" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="' + uid + 'f" cx=".5" cy=".9" r=".6"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".35" stop-color="#FFC14A"/><stop offset=".8" stop-color="#FF6A1E"/><stop offset="1" stop-color="#FF6A1E" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="' + uid + 'm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E5E14"/><stop offset=".3" stop-color="#FFE7A8"/><stop offset=".6" stop-color="#D9A84A"/><stop offset="1" stop-color="#8E5E14"/></linearGradient>' +
    '<radialGradient id="' + uid + 'p" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFB347" stop-opacity=".55"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient>' +
    '</defs>';
  /* pool of light on the floor */
  if (o.ripples !== false) s += '<ellipse class="pool" cx="80" cy="140" rx="74" ry="14" fill="url(#' + uid + 'p)"/>';
  s += '<circle class="glow" cx="80" cy="92" r="66" fill="url(#' + uid + 'g)"/>';
  var back = [-58, -34, -11, 11, 34, 58], mid = [-44, -22, 0, 22, 44], front = [-30, -10, 10, 30];
  s += '<g transform="translate(80,128)">';
  back.forEach(function (a) { s += '<path d="' + petalD(68, 16) + '" transform="rotate(' + a + ')" fill="url(#' + uid + 'c)"/>'; });
  mid.forEach(function (a) { s += '<path d="' + petalD(62, 16) + '" transform="rotate(' + a + ')" fill="url(#' + uid + 'b)"/><path d="' + petalD(62, 16) + '" transform="rotate(' + a + ')" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.2"/>'; });
  /* the cup */
  s += '<path d="M-40,-4 Q0,10 40,-4 L34,10 Q0,20 -34,10Z" fill="url(#' + uid + 'm)"/><ellipse cy="-4" rx="40" ry="8" fill="#5A3A12"/><ellipse cy="-5" rx="34" ry="5.5" fill="#F6B01E"/><ellipse cy="-6" rx="22" ry="3" fill="#FFE39A" opacity=".8"/>';
  /* the flame */
  s += '<g class="flame" transform="translate(0,-8)"><path d="M0,-36 C10,-23 13,-12 9,-3 C6,4 -6,4 -9,-3 C-13,-12 -10,-23 0,-36Z" fill="url(#' + uid + 'f)"/><path d="M0,-24 C5,-15 6,-9 3.5,-4 C2,-1 -2,-1 -3.5,-4 C-6,-9 -5,-15 0,-24Z" fill="#FFF8D6" opacity=".9"/></g>';
  front.forEach(function (a) { s += '<path d="' + petalD(50, 17) + '" transform="rotate(' + a + ') translate(0,6)" fill="url(#' + uid + 'a)"/><path d="' + petalD(50, 17) + '" transform="rotate(' + a + ') translate(0,6)" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>'; });
  s += "</g>";
  if (o.crown) s += '<g transform="translate(80,30)"><path d="M-16,8 L-12,-8 L-5,2 L0,-12 L5,2 L12,-8 L16,8Z" fill="' + GOLD + '"/><circle cy="-2" r="2.2" fill="#FF2E8C"/></g>';
  return s;
}
function lotus(i, w, cls, o) {
  o = o || {};
  var k = ((i % LOTUS.length) + LOTUS.length) % LOTUS.length, src = o.dark ? "art/lotus_dark.png" : "art/lotus" + k + ".png";
  return '<span class="lotus ' + (cls || "") + (o.dark ? " dark" : "") + '" style="--w:' + w + 'px;--c:' + LOTUS[k].c + '">' +
    (o.ripples !== false ? '<i class="pool"></i>' : "") + '<i class="glow"></i><img src="' + src + '" alt="" draggable="false"><i class="flick"></i>' +
    (o.refl ? '<img class="refl" src="' + src + '" alt="" draggable="false">' : "") + (o.dark ? "" : '<i class="gl a"></i><i class="gl b"></i><i class="gl c"></i>') +
    (o.crown ? '<svg class="crown3d" viewBox="-20 -16 40 28"><path d="M-16,8 L-12,-8 L-5,2 L0,-12 L5,2 L12,-8 L16,8Z" fill="#F3C96B" stroke="#B98A2D" stroke-width="1.2"/><circle cy="-2" r="2.2" fill="#FF2E8C"/></svg>' : "") + "</span>";
}
function ravanaSVG() { return '<img class="ravimg" src="art/ravana.png" alt="" draggable="false">'; }
function avHTML(name, avIdx, size, cls) {
  var k = ((avIdx % LOTUS.length) + LOTUS.length) % LOTUS.length;
  return '<span class="av ' + (cls || "") + '" style="--s:' + size + 'px;--c:' + LOTUS[k].c + '"><img src="art/lotus' + k + '.png" alt="" draggable="false"></span>';
}
/* the phone card: a lotus bud that opens in your hand */
function budSVG(i, o) {
  var L = LOTUS[((i % LOTUS.length) + LOTUS.length) % LOTUS.length], uid = "bud" + i, c = o && o.dark ? "#4A0A22" : L.c, t = o && o.dark ? "#8E1B45" : L.t;
  var s = '<defs><linearGradient id="' + uid + 'p" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + c + '"/><stop offset=".8" stop-color="' + t + '"/><stop offset="1" stop-color="#FFF8F0"/></linearGradient><radialGradient id="' + uid + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FF8A2A" stop-opacity="0"/></radialGradient></defs>';
  s += '<circle class="bglow" cx="100" cy="128" r="96" fill="url(#' + uid + 'g)"/>';
  s += '<g transform="translate(100,170)">';
  /* a closed bud: 3 rows of petals, all pointing up; opening rotates each row outward around the base */
  var rows = [{ a: [-22, -8, 8, 22], len: 120, w: 30, cls: "pb", open: 3.2 }, { a: [-16, 0, 16], len: 108, w: 30, cls: "pm", open: 4.2 }, { a: [-9, 9], len: 92, w: 30, cls: "pf", open: 7 }];
  rows.forEach(function (r) { r.a.forEach(function (ang) { s += '<path class="pt ' + r.cls + '" style="--a:' + ang + 'deg;--o:' + (ang * r.open) + 'deg" d="' + petalD(r.len, r.w) + '" transform="rotate(' + ang + ')" fill="url(#' + uid + 'p)" stroke="' + GOLD + '" stroke-width="2" stroke-linejoin="round"/>'; }); });
  s += '<g class="heart"><ellipse cy="-4" rx="28" ry="10" fill="#F6B01E"/><ellipse cy="-6" rx="16" ry="5" fill="#FFE39A"/><g class="flame" transform="translate(0,-12)"><path d="M0,-40 C12,-23 15,-12 10,-2 C6,6 -6,6 -10,-2 C-15,-12 -12,-23 0,-40Z" fill="#FF8A1F"/><path d="M0,-29 C6,-17 7,-10 4,-4 C2,1 -2,1 -4,-4 C-7,-10 -6,-17 0,-29Z" fill="#FFC93C"/><ellipse cy="-8" rx="3" ry="6.5" fill="#FFF8D6"/></g></g>';
  s += "</g>";
  return s;
}

/* ================= the set: sky, haveli skyline, pool ================= */
function rng(seed) { var a = seed | 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function backdrop() {
  var r = rng(11), stars = "", i;
  for (i = 0; i < 110; i++) { stars += '<circle cx="' + (r() * 1800).toFixed(0) + '" cy="' + (r() * 420).toFixed(0) + '" r="' + (0.7 + r() * 1.5).toFixed(1) + '" fill="#FFF4D6" opacity="' + (0.3 + r() * 0.6).toFixed(2) + '" class="star s' + (i % 3) + '"/>'; }
  var sky = "", xs = [40, 150, 250, 330, 470, 580, 700, 800, 900, 1000, 1110, 1230, 1330, 1450, 1560, 1660, 1760], hs = [50, 90, 60, 130, 70, 160, 100, 80, 190, 110, 70, 140, 90, 120, 60, 150, 70];
  for (i = 0; i < xs.length; i++) {
    var x = xs[i], hh = hs[i], w = 54 + (hh % 50), y = 500 - hh, dome = hh > 100;
    sky += '<rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="' + (hh + 20) + '" fill="#1E0824"/>';
    if (dome) sky += '<path d="M' + (x - w / 2) + " " + y + " C" + (x - w / 2) + " " + (y - w * 0.95) + " " + (x + w / 2) + " " + (y - w * 0.95) + " " + (x + w / 2) + " " + y + 'Z" fill="#1E0824"/><path d="M' + x + " " + (y - w * 0.7) + ' v-24" stroke="#C9A24E" stroke-width="2"/><circle cx="' + x + '" cy="' + (y - w * 0.7 - 26) + '" r="3" fill="' + GOLD + '"/>';
    else sky += '<path d="M' + (x - w / 2) + " " + y + " L" + x + " " + (y - 22) + " L" + (x + w / 2) + " " + y + 'Z" fill="#1E0824"/>';
    for (var k = 0; k < 3; k++) sky += '<rect x="' + (x - 16 + k * 13) + '" y="' + (y + 18 + (k % 2) * 22) + '" width="5" height="8" fill="#FFB347" opacity=".9"/>';
    if (i % 2 === 0) sky += '<g transform="translate(' + x + ',' + (y - 2) + ')"><path d="M-8,0 Q-8,-8 0,-8 Q8,-8 8,0 Z" fill="#1E0824"/></g>';
  }
  /* fairy-light strings across the skyline */
  var strings = "";
  for (i = 0; i < 4; i++) { var sx = 120 + i * 420, ex = sx + 420, sy = 412 + (i % 2) * 18; strings += '<path d="M' + sx + " " + sy + " Q" + (sx + 210) + " " + (sy + 50) + " " + ex + " " + sy + '" stroke="rgba(255,244,214,.25)" stroke-width="1.4" fill="none"/>'; for (var b = 1; b < 12; b++) { var f = b / 12, bx = sx + f * 420, by = sy + 50 * 4 * f * (1 - f) * 0.5; strings += '<circle cx="' + bx.toFixed(0) + '" cy="' + (by + 3).toFixed(0) + '" r="3" fill="' + (b % 2 ? "#FFE39A" : "#FF9ACB") + '" class="bulb b' + (b % 3) + '"/>'; } }
  var ref = "";
  for (i = 0; i < 30; i++) { var rx = 10 + i * 60 + (i % 3) * 9; ref += '<rect x="' + rx + '" y="522" width="' + (4 + (i % 3) * 3) + '" height="' + (90 + (i % 5) * 36) + '" fill="url(#' + (i % 3 === 0 ? "rgp" : "rgg") + ')" class="refl r' + (i % 3) + '"/>'; }
  return '<svg viewBox="0 0 1800 810" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140826"/><stop offset=".55" stop-color="#3A0F4D"/><stop offset=".8" stop-color="#A1176A"/><stop offset="1" stop-color="#FF2E8C"/></linearGradient>' +
    '<linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A1142"/><stop offset=".3" stop-color="#2A0A2E"/><stop offset="1" stop-color="#160617"/></linearGradient>' +
    '<radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset=".4" stop-color="#FFF2CC"/><stop offset="1" stop-color="#FFF2CC" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="rgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8FC2" stop-opacity=".16"/><stop offset="1" stop-color="#FF2E8C" stop-opacity="0"/></linearGradient><linearGradient id="rgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE39A" stop-opacity=".14"/><stop offset="1" stop-color="#FFE39A" stop-opacity="0"/></linearGradient>' +
    '</defs><rect width="1800" height="520" fill="url(#sky)"/>' + stars +
    '<circle cx="1700" cy="118" r="150" fill="url(#moon)" opacity=".28"/><circle cx="1700" cy="118" r="46" fill="#FFF2CC"/><circle cx="1684" cy="108" r="7" fill="#F3E4C0" opacity=".5"/><circle cx="1712" cy="130" r="5" fill="#F3E4C0" opacity=".5"/>' +
    sky + strings + '<rect y="520" width="1800" height="290" fill="url(#pool)"/>' + ref +
    '<ellipse cx="1700" cy="560" rx="80" ry="9" fill="#FFF2CC" opacity=".07"/><ellipse cx="1700" cy="606" rx="52" ry="6" fill="#FFF2CC" opacity=".05"/>' +
    '<path d="M0 520 H1800" stroke="rgba(255,230,200,.35)" stroke-width="2"/></svg>';
}
function archSVG() {
  /* cusped jharokha arch along the top inside edge, with hanging bells */
  var out = '<svg viewBox="0 0 1800 150" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="agold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A8"/><stop offset=".5" stop-color="#D8AA52"/><stop offset="1" stop-color="#8F6520"/></linearGradient></defs>';
  var d = "M0 0 H1800 V40 ", n = 9, seg = 200;
  for (var i = n - 1; i >= 0; i--) { var x1 = i * seg, xm = x1 + seg / 2; d += "L" + (x1 + seg) + " 40 C" + (x1 + seg - 30) + " 40 " + (xm + 40) + " 120 " + xm + " 132 C" + (xm - 40) + " 120 " + (x1 + 30) + " 40 " + x1 + " 40 "; }
  out += '<path d="' + d + 'Z" fill="#2A0A2E"/><path d="' + d + 'Z" fill="none" stroke="url(#agold)" stroke-width="8" transform="translate(0,-4)"/>';
  for (var j = 0; j < n; j++) { var cx = j * seg + seg / 2; out += '<circle cx="' + cx + '" cy="134" r="7" fill="url(#agold)"/>'; }
  return out + "</svg>";
}
function bellStrand(n, len) {
  var out = '<svg class="strand" viewBox="-16 0 32 ' + len + '" width="32" height="' + len + '" aria-hidden="true"><defs><linearGradient id="bbr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCE4A4"/><stop offset=".5" stop-color="#D6A64B"/><stop offset="1" stop-color="#8E6524"/></linearGradient></defs><path d="M0,0 V' + (len - 30) + '" stroke="#B48A55" stroke-width="2.6" stroke-dasharray="5 2"/>';
  for (var i = 0; i < n; i++) {
    var y = 44 + i * ((len - 80) / Math.max(1, n - 1));
    out += '<g class="bell" transform="translate(0,' + y.toFixed(0) + ')"><rect x="-3" y="-4" width="6" height="5" rx="1" fill="#8E6524"/><path d="M-7,0 H7 L11,22 Q0,26 -11,22Z" fill="url(#bbr)"/><path d="M-7,0 H7" stroke="#FCE4A4" stroke-width="1.4"/><circle cy="25" r="3" fill="#6E4A18"/></g>';
  }
  return out + "</svg>";
}
function lotusPetal(rot, len, w) {
  var d = petalD(len, w);
  return '<g transform="rotate(' + rot + ')"><path d="' + d + '" fill="#E3BC6A" stroke="#F3C96B" stroke-width="3.2" stroke-linejoin="round"/><path d="' + d + '" transform="translate(0,-3) scale(.7)" fill="#FF2E8C"/></g>';
}
function lotusMark(cls) {
  var p = [[-62, 26, 11], [62, 26, 11], [-37, 33, 12], [37, 33, 12], [-15, 38, 11], [15, 38, 11], [0, 42, 11]];
  return '<svg class="' + (cls || "") + '" viewBox="-40 -44 80 62" aria-hidden="true"><g transform="translate(0,10)">' + p.map(function (q) { return lotusPetal(q[0], q[1], q[2]); }).join("") + '<path d="M-27,1 Q0,15 27,1 Q0,8 -27,1Z" fill="#E3BC6A"/><circle cy="-14" r="2" fill="#F6D995"/></g></svg>';
}
function ornament(len, size, kind) {
  var w = size, sc = size / 80, lotusH = 62 * sc, pearls = "", i, y = 14, np = Math.max(1, Math.floor(len / 7));
  for (i = 0; i < np; i++) pearls += '<circle cx="0" cy="' + (y + i * 7) + '" r="2.4" fill="#FFF6EC"/>';
  var top = 14 + np * 7, h = top + lotusH + 40;
  var bell = kind === "brass"
    ? '<g class="bell" transform="translate(0,' + (top + lotusH + 6) + ')"><circle r="2.2" cy="0" fill="#FFF6EC"/><path d="M-6,4 H6 L8.5,20 Q0,23 -8.5,20Z" fill="#D6A64B"/><path d="M-6,4 H6" stroke="#FCE4A4" stroke-width="1.2"/><circle cy="22" r="2.4" fill="#8E6524"/></g>'
    : '<g transform="translate(0,' + (top + lotusH + 4) + ')"><circle r="2.2" cy="0" fill="#FFF6EC"/><circle r="2.2" cy="6" fill="#FFF6EC"/><path d="M-6,15 Q-6,9 0,9 Q6,9 6,15 L7,17 H-7Z" fill="#E3BC6A"/><circle cy="22" r="5" fill="#FF2E8C"/><circle cy="22" r="5" fill="none" stroke="#FFB3D6" stroke-width="1" stroke-dasharray="1.5 2"/></g>';
  return '<svg class="orn" viewBox="' + (-w / 2) + ' 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><circle cx="0" cy="7" r="5.5" fill="none" stroke="#E3BC6A" stroke-width="2.2"/>' + pearls +
    '<g transform="translate(0,' + (top + lotusH * 0.72) + ') scale(' + sc.toFixed(3) + ')">' + [[-62, 26, 11], [62, 26, 11], [-37, 33, 12], [37, 33, 12], [-15, 38, 11], [15, 38, 11], [0, 42, 11]].map(function (q) { return lotusPetal(q[0], q[1], q[2]); }).join("") + '<path d="M-27,1 Q0,15 27,1 Q0,8 -27,1Z" fill="#E3BC6A"/></g>' + bell + "</svg>";
}
function hangers(count, small, cluster) {
  var out = "", lens = [6, 30, 14, 36, 4, 26, 10, 34, 6, 24, 18], sizes = [84, 62, 76, 58, 88, 64, 80, 60, 84, 66, 72];
  for (var i = 0; i < count; i++) {
    var f = (i + 0.5) / count, x = (cluster ? (f < 0.5 ? 1 + f * 2 * 20 : 79 + (f - 0.5) * 2 * 20) : f * 100).toFixed(2), L = lens[i % lens.length] * (small ? 0.6 : 1), z = sizes[i % sizes.length] * (small ? 0.6 : 1);
    out += '<div class="hang h' + (i % 4) + '" style="left:' + x + '%">' + ornament(L, Math.round(z), i % 3 === 1 ? "brass" : "jhumka") + "</div>";
  }
  return out;
}
function petals(n) {
  var out = "";
  for (var i = 0; i < n; i++) {
    var x = (4 + (i * 37) % 92), d = 16 + (i * 7) % 9, dl = -(i * 2.7).toFixed(1), sz = 12 + (i % 3) * 5, c = i % 2 ? "#FF2E8C" : "#FF8FC2";
    out += '<i style="left:' + x + "%;animation-duration:" + d + "s;animation-delay:" + dl + 's"><svg viewBox="-10 -14 20 28" width="' + sz + '" height="' + (sz * 1.4).toFixed(0) + '"><path d="M0,-13 C9,-7 9,6 0,13 C-9,6 -9,-7 0,-13Z" fill="' + c + '"/><path d="M0,-11 C3,-4 3,4 0,11" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/></svg></i>';
  }
  return out;
}
function glyph(w, k) { var i = (k != null) ? k : (window.P && P.me ? P.me.av : 4); return '<span class="glyph">' + lotus(i, w || 120, "", { ripples: false }) + "</span>"; }
function footlights(n) { var o = ""; for (var i = 0; i < n; i++) o += diya("fl d" + (i % 3)); return o; }
function floatingPetals(n) {
  var out = "", r = rng(5);
  for (var i = 0; i < n; i++) { var x = (3 + r() * 94).toFixed(1), y = (8 + r() * 80).toFixed(1), rot = (r() * 360).toFixed(0), sz = 10 + Math.floor(r() * 10); out += '<i class="fp" style="left:' + x + "%;top:" + y + "%;--d:" + (5 + r() * 5).toFixed(1) + "s;--dl:-" + (r() * 8).toFixed(1) + 's"><svg viewBox="-10 -14 20 28" width="' + sz + '" height="' + (sz * 1.4).toFixed(0) + '" style="transform:rotate(' + rot + 'deg)"><path d="M0,-13 C9,-7 9,6 0,13 C-9,6 -9,-7 0,-13Z" fill="' + (i % 2 ? "#FF2E8C" : "#FF8FC2") + '" opacity=".85"/></svg></i>'; }
  return out;
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
    if (S.view === "tv" && this.ctx) this.load();
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
  /* recorded effects (sfx/*.mp3), TV only; each falls back to the synth version if not loaded */
  buf: {}, loading: false, lastBoom: 0, lastWhistle: 0,
  NAMES: ["correct", "wrong", "timeup", "tick", "boom1", "boom2", "boom3", "boom4", "boom5", "whistle", "drumroll", "cheer", "cheer_small", "fanfare", "reveal", "aww", "join", "whoosh", "hit", "ravana"],
  load: function () {
    if (this.loading || !this.ctx || (window.RAVANA_CFG && window.RAVANA_CFG.noSfx)) return; this.loading = true; var me = this;
    this.NAMES.forEach(function (n) {
      try {
        fetch("sfx/" + n + ".mp3").then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (b) {
          me.ctx.decodeAudioData(b, function (buf) { me.buf[n] = buf; }, function () { });
        }).catch(function () { });
      } catch (e) { }
    });
  },
  play: function (n, vol, delay, dur) {
    if (!this.ok() || !this.buf[n]) return false;
    var c = this.ctx, s0 = c.createBufferSource(), g = c.createGain(), t = c.currentTime + (delay || 0), v = vol == null ? 0.8 : vol;
    s0.buffer = this.buf[n]; g.gain.setValueAtTime(v, t);
    if (dur) { g.gain.setValueAtTime(v, t + Math.max(0, dur - 0.2)); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
    s0.connect(g); g.connect(c.destination); s0.start(t); if (dur) s0.stop(t + dur + 0.05);
    return true;
  },
  ravana: function (d) { if (!this.play("ravana", 0.95, d)) { this.boo(d); } },
  cheer: function (big, d) { this.play(big ? "cheer" : "cheer_small", big ? 0.6 : 0.5, d, big ? 0 : 4.5); },
  aww: function (d) { if (!this.play("aww", 0.7, d)) this.boo(d); },
  reveal: function (d) { if (!this.play("reveal", 0.8, d)) this.chime(); },
  bigFanfare: function (d) { if (!this.play("fanfare", 0.7, d)) { this.fanfare(d); this.fanfare((d || 0) + 0.8); } },
  whistle: function () { var t = now(); if (t - this.lastWhistle < 700) return; this.lastWhistle = t; this.play("whistle", 0.32); },
  join: function () { if (this.play("join", 0.55)) return; this.bell(988); this.bell(1319, 0.09); },
  chime: function () { this.bell(1760); this.bell(2217, 0.08); this.bell(1760, 0.5); this.bell(2637, 0.58); },
  dhol: function (delay, big) {
    if (!this.ok()) return; var t = this.ctx.currentTime + (delay || 0);
    this.osc("sine", big ? 140 : 190, t, 0.004, big ? 0.7 : 0.45, 0.32, 48); this.noise(t, 0.06, 0.18, 2500);
  },
  tick: function (loud) { if (!this.ok()) return; if (this.play("tick", loud ? 0.95 : 0.6)) return; var t = this.ctx.currentTime; this.osc("square", 1500, t, 0.002, 0.05, 0.05); },
  roll: function (dur) { if (this.play("drumroll", 0.85, 0, dur || 2.3)) return; for (var i = 0; i < 14; i++) this.dhol(i * 0.1 * (1 - i * 0.025), i === 13); },
  fanfare: function (delay) { var d = delay || 0;[784, 988, 1175, 1568].forEach(function (f, i) { SND.bell(f, d + i * 0.12); }); },
  boo: function (delay) { if (!this.ok()) return; var t = this.ctx.currentTime + (delay || 0); this.osc("sawtooth", 220, t, 0.05, 0.12, 1.1, 90); this.osc("sawtooth", 233, t, 0.05, 0.08, 1.1, 95); },
  pop: function () {
    if (!this.ok()) return; var tm = now();
    if (this.buf.boom1) { if (tm - this.lastBoom < 220) return; this.lastBoom = tm; this.play("boom" + (1 + Math.floor(Math.random() * 5)), 0.35 + Math.random() * 0.3); return; }
    var t = this.ctx.currentTime; this.noise(t, 0.35, 0.25, 900 + Math.random() * 900);
  },
  ding: function () { if (this.play("correct", 0.9)) return; this.bell(1319); this.bell(1760, 0.1); this.bell(2637, 0.2); },
  timeup: function () { if (!this.play("timeup", 0.8)) this.buzz(); },
  buzz: function () { if (this.play("wrong", 0.8)) return; if (!this.ok()) return; var t = this.ctx.currentTime; this.osc("square", 160, t, 0.01, 0.1, 0.35, 120); this.osc("sawtooth", 165, t, 0.01, 0.06, 0.35, 118); }
};

/* ================= music: tanpura drone, dhol/tabla groove, santoor shimmer, bansuri melody, hall reverb ================= */
var MUS = {
  on: lsGet("ravana_music") !== false, mood: null, cfg: null, master: null, verb: null, timer: 0, next: 0, step: 0, prevF: 0,
  SA: 293.66, /* Sa = D4; raag Bhoopali (Sa Re Ga Pa Dha) */
  MOODS: {
    lobby: { vol: 0.9, tempo: 96, groove: "full", melody: 1, santoor: 1 },
    peek: { vol: 0.7, tempo: 96, groove: "light", melody: 0, santoor: 0.6 },
    clues: { vol: 0.6, tempo: 96, groove: "light", melody: 0, santoor: 0.5 },
    discuss: { vol: 0.65, tempo: 100, groove: "light", melody: 0, santoor: 0.55 },
    vote: { vol: 0.85, tempo: 116, groove: "tense", melody: 0, santoor: 0 },
    verdict: { vol: 0.55, tempo: 70, groove: "heart", melody: 0, santoor: 0 },
    guess: { vol: 0.7, tempo: 66, groove: "heart", melody: 0, santoor: 0 },
    reveal: { vol: 0.85, tempo: 104, groove: "full", melody: 1, santoor: 1, duck: 3.4 },
    skipped: { vol: 0.5, tempo: 96, groove: "light", melody: 0, santoor: 0.45 },
    final: { vol: 0.95, tempo: 108, groove: "full", melody: 1, santoor: 1, duck: 2.5 },
    zintro: { vol: 0.65, tempo: 100, groove: "light", melody: 0, santoor: 0.5 },
    zplay: { vol: 0.8, tempo: 124, groove: "tense", melody: 0, santoor: 0 },
    zturnend: { vol: 0.85, tempo: 104, groove: "full", melody: 1, santoor: 1, duck: 1.2 },
    heartonly: { vol: 0.55, tempo: 70, groove: "heart", melody: 0, santoor: 0, nodrone: 1 }
  },
  /* phrases in eighth notes: [semitones from Sa, length]. 16 eighths = 2 keherwa cycles */
  PH: {
    A: [[7, 1], [9, 1], [12, 2], [9, 1], [7, 1], [4, 2], [7, 1], [4, 1], [2, 1], [4, 1], [0, 4]],
    B: [[4, 1], [7, 1], [9, 2], [7, 1], [9, 1], [12, 1], [14, 1], [12, 2], [9, 1], [7, 1], [4, 2], [2, 2]],
    C: [[12, 1], [9, 1], [7, 1], [4, 1], [7, 2], [4, 1], [2, 1], [0, 2], [2, 1], [4, 1], [2, 2], [-5, 1], [0, 1]],
    D: [[0, 1], [2, 1], [4, 1], [7, 1], [9, 2], [12, 2], [14, 1], [12, 1], [9, 1], [7, 1], [9, 2], [7, 2]],
    E: [[9, 2], [12, 1], [9, 1], [7, 2], [4, 1], [7, 1], [9, 1], [7, 1], [4, 1], [2, 1], [4, 2], [0, 2]],
    F: [[12, 1], [14, 1], [16, 2], [14, 1], [12, 1], [9, 2], [12, 1], [9, 1], [7, 1], [9, 1], [7, 2], [4, 2]]
  },
  SONG: ["A", "B", "A", "C", "", "D", "C", "", "E", "F", "E", "C", "", ""],
  /* santoor arpeggios, one note per eighth */
  ARP: [[0, 7, 12, 16, 12, 7, 4, 7], [-5, 0, 4, 7, 12, 7, 4, 0], [2, 7, 9, 14, 9, 7, 2, 4], [0, 4, 7, 12, 19, 12, 7, 4]],
  setMood: function (name, force) {
    if (!this.on && name !== "off") name = "off";
    if (name !== "heartonly" && name !== "off") this.phase = name;
    if (name === this.mood && !force) return;
    if (name !== "off" && name !== "heartonly" && REC.ok() && SND.ctx) {
      this.mood = name; REC.set(name);
      var layer = "off";
      if (this.synthLayer === layer) return; this.synthLayer = layer;
      this.mood = null; this._nest = true; this.setMood(layer, true); this._nest = false; this.mood = name; return;
    }
    if (name === "off" && !this._nest) { REC.set("off"); this.synthLayer = "off"; }
    var prev = this.mood; this.mood = name;
    var cfg = this.MOODS[name] || null;
    if (!SND.ctx) return;
    var c = SND.ctx, t = c.currentTime;
    if (!this.master) {
      this.master = c.createGain(); this.master.gain.value = 0.0001;
      var comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
      this.bus = c.createGain(); this.bus.connect(this.master); this.master.connect(comp); comp.connect(c.destination);
      this.verb = c.createConvolver(); this.verb.buffer = this.impulse(c, 2.2); this.send = c.createGain(); this.send.gain.value = 0.9;
      this.send.connect(this.verb); this.verb.connect(this.master);
    }
    var g = this.master.gain; g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t);
    if (!cfg) { g.exponentialRampToValueAtTime(0.0001, t + 0.8); this.cfg = null; return; }
    var target = 0.5 * cfg.vol;
    if (cfg.duck) { g.exponentialRampToValueAtTime(target * 0.18, t + 0.3); g.setValueAtTime(target * 0.18, t + cfg.duck); g.exponentialRampToValueAtTime(target, t + cfg.duck + 1.2); }
    else g.exponentialRampToValueAtTime(target, t + (prev && prev !== "off" ? 0.8 : 2.2));
    this.cfg = cfg;
    if (!this.timer) { this.next = t + 0.1; var me = this; this.timer = setInterval(function () { me.tick(); }, 90); }
  },
  impulse: function (c, sec) {
    var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) { var x = i / n; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 3.2) * (i < 4000 && i % 1300 < 90 ? 1.8 : 1); } }
    return b;
  },
  tick: function () {
    var c = SND.ctx; if (!c || c.state !== "running") return;
    if (!this.cfg) { if (this.master && this.master.gain.value < 0.001) { clearInterval(this.timer); this.timer = 0; } return; }
    if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.3) { this.play(this.step, this.next); this.next += 30 / this.cfg.tempo; this.step++; }
  },
  f: function (semi, oct) { return this.SA * Math.pow(2, semi / 12 + (oct || 0)); },
  play: function (s, t) {
    var cfg = this.cfg, p = s % 8, sd = 30 / cfg.tempo, gr = cfg.groove, bar = Math.floor(s / 16);
    if (p % 2 === 0 && !cfg.nodrone) this.tanpura([this.f(7, -2), this.f(0, -1), this.f(0, -1), this.f(0, -2)][p / 2], t);
    if (gr === "full" || gr === "light") {
      /* keherwa: dha ge na ti | na ka dhi na */
      var bass = [1, 0.7, 0, 0, 0, 0, 0.9, 0][p], hi = [0.8, 0, 0.9, 0.5, 0.8, 0, 0.8, 0.9][p], tak = [0, 0.5, 0, 0.7, 0, 0.6, 0, 0.5][p];
      if (gr === "light") { hi *= 0.35; tak *= 0.5; }
      if (bass) this.dhol(t, bass);
      if (hi) this.tin(t, hi);
      if (tak) this.tak(t, tak);
      if (p === 5 && gr === "full") this.ka(t);
      if (gr === "full" && s % 32 === 31) { this.tin(t + sd / 2, 0.6); this.tin(t + sd * 0.75, 0.5); }
      if (gr === "light" && s % 16 === 0) this.chikari(t);
    } else if (gr === "tense") {
      if (p % 2 === 0) this.dhol(t, p === 0 ? 1 : 0.6);
      this.tin(t, p % 2 ? 0.35 : 0.55); this.tak(t + sd / 2, 0.35);
      if (s % 16 === 8) this.chikari(t);
    } else if (gr === "heart") {
      if (p % 4 === 0) { this.dhol(t, 0.9); this.dhol(t + sd * 0.55, 0.6); }
      if (s % 16 === 0) this.swell(t, sd * 16);
    }
    if (cfg.santoor) {
      var pat = this.ARP[bar % this.ARP.length], q = s % 8;
      if (gr === "full" || q % 2 === 0) this.santoor(this.f(pat[q], 1), t, cfg.santoor * (q === 0 ? 0.6 : 0.42), (q % 2 ? 0.45 : -0.45));
    }
    if (cfg.melody) {
      var ph = this.PH[this.SONG[bar % this.SONG.length]];
      if (ph) {
        var off = s % 16, acc = 0;
        for (var i = 0; i < ph.length; i++) { if (acc === off) { this.flute(this.f(ph[i][0], 0), t, ph[i][1] * sd); break; } acc += ph[i][1]; }
      }
    }
  },
  out: function () { return this.bus; },
  wet: function (node, amt) { node.connect(this.bus); if (amt && this.send) { var g = SND.ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(this.send); } },
  tanpura: function (f, t) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = f; o2.frequency.value = f * 1.003;
    lp.type = "lowpass"; lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 2.4); lp.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(lp); o2.connect(lp); lp.connect(g); this.wet(g, 0.25); o.start(t); o2.start(t); o.stop(t + 3.3); o2.stop(t + 3.3);
  },
  swell: function (t, dur) {
    var c = SND.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    [0, 7, 12].forEach(function (semi) { var o = c.createOscillator(); o.type = "triangle"; o.frequency.value = MUS.f(semi, -1); o.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); this.wet(g, 0.6);
  },
  dhol: function (t, v) {
    var c = SND.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.28);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.75 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.45);
    this.noise(t, 0.03, 0.08 * v, 700, 0);
  },
  tak: function (t, v) { this.noise(t, 0.05, 0.11 * v, 1100, 0.2); var c = SND.ctx, o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.05); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.1); },
  tin: function (t, v) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o2.type = "triangle"; o.frequency.value = 620; o2.frequency.value = 1245;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); o2.connect(g); this.wet(g, 0.3); o.start(t); o2.start(t); o.stop(t + 0.18); o2.stop(t + 0.18);
    this.noise(t, 0.035, 0.05 * v, 3200, 0.3);
  },
  ka: function (t) { this.noise(t, 0.06, 0.12, 1400, 0.15); },
  chikari: function (t) {
    var me = this; [[12, 0], [7, 0.07], [12, 0.14], [19, 0.21]].forEach(function (n) { me.pluck(me.f(n[0], 1), t + n[1], 0.09, 0.6); });
  },
  pluck: function (f, t, v, dur) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), hp = c.createBiquadFilter(), g = c.createGain();
    o.type = "sawtooth"; o2.type = "square"; o.frequency.value = f; o2.frequency.value = f * 2.003;
    hp.type = "highpass"; hp.frequency.value = 600;
    var g2 = c.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(hp); o2.connect(g2); g2.connect(hp); hp.connect(g); this.wet(g, 0.5); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  },
  santoor: function (f, t, v, pan) {
    var c = SND.ctx, o = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), g = c.createGain(), hp = c.createBiquadFilter(), out = g;
    o.type = "triangle"; o2.type = "triangle"; o3.type = "sine"; o.frequency.value = f * 0.9985; o2.frequency.value = f * 1.0015; o3.frequency.value = f * 2;
    var g3 = c.createGain(); g3.gain.value = 0.3; hp.type = "highpass"; hp.frequency.value = 350;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(hp); o2.connect(hp); o3.connect(g3); g3.connect(hp); hp.connect(g);
    if (c.createStereoPanner) { var pn = c.createStereoPanner(); pn.pan.value = pan || 0; g.connect(pn); out = pn; }
    this.wet(out, 0.55); o.start(t); o2.start(t); o3.start(t); o.stop(t + 0.9); o2.stop(t + 0.9); o3.stop(t + 0.9);
  },
  noise: function (t, d, peak, freq, wet) {
    var c = SND.ctx;
    if (!SND.noiseBuf) { var b = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = b.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; SND.noiseBuf = b; }
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = SND.noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); this.wet(g, wet || 0); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
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
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); this.wet(lp, 0.5);
    o.start(t); o2.start(t); lfo.start(t); o.stop(end + 0.15); o2.stop(end + 0.15); lfo.stop(end + 0.15);
    this.noise(t, 0.08, 0.025, 2200, 0);
    this.prevF = f;
  }
};

/* ================= game music: recorded tracks per game phase, crossfaded on the TV ================= */
var REC = {
  /* src, where looping restarts (from) and where it loops (end), seconds. Swap a track by replacing the file in music/. */
  TRACKS: {
    game_show: { n: "Happy Happy Game Show", src: "music/game_show.mp3", from: 3, end: 149 },
    monkeys: { n: "Monkeys Spinning Monkeys", src: "music/monkeys.mp3", from: 3, end: 122 },
    fluffing_duck: { n: "Fluffing a Duck", src: "music/fluffing_duck.mp3", from: 3, end: 59 },
    pixelland: { n: "Pixelland", src: "music/pixelland.mp3", from: 3, end: 230 },
    run_amok: { n: "Run Amok", src: "music/run_amok.mp3", from: 3, end: 100 },
    bit_shift: { n: "Bit Shift", src: "music/bit_shift.mp3", from: 3, end: 188 },
    voxel: { n: "Voxel Revolution", src: "music/voxel.mp3", from: 3, end: 121 },
    quirky_dog: { n: "Quirky Dog", src: "music/quirky_dog.mp3", from: 3, end: 143 },
    sneaky_snitch: { n: "Sneaky Snitch", src: "music/sneaky_snitch.mp3", from: 3, end: 129 },
    thinking: { n: "Thinking Music", src: "music/thinking.mp3", from: 3, end: 188 },
    investigations: { n: "Investigations", src: "music/investigations.mp3", from: 3, end: 89 },
    winner: { n: "Winner Winner!", src: "music/winner.mp3", from: 3, end: 190 }
  },
  ORDER: ["auto", "game_show", "monkeys", "fluffing_duck", "pixelland", "run_amok", "bit_shift", "voxel", "quirky_dog", "sneaky_snitch", "thinking", "investigations", "winner"],
  /* phase: [track used by "Auto mix", volume 0..1]. When the host picks one track, it plays everywhere at these volumes. */
  MAP: {
    lobby: ["game_show", 0.7], peek: ["sneaky_snitch", 0.5], clues: ["sneaky_snitch", 0.34], discuss: ["sneaky_snitch", 0.45], vote: ["thinking", 0.7],
    verdict: ["investigations", 0.32], guess: ["investigations", 0.38], reveal: ["winner", 0.85], skipped: ["sneaky_snitch", 0.4], final: ["winner", 1],
    zintro: ["pixelland", 0.5], zplay: ["pixelland", 0.7], zturnend: ["game_show", 0.8]
  },
  choice: "auto",
  label: function (c) { c = c || this.choice; return c === "auto" ? "Auto mix" : (this.TRACKS[c] ? this.TRACKS[c].n : "Auto mix"); },
  num: function (c) { c = c || this.choice; return this.ORDER.indexOf(c); },
  pick: function (c) { if (this.ORDER.indexOf(c) < 0) c = "auto"; this.choice = c; lsSet("ravana_track", c); if (this.phase) { var ph = this.phase; this.phase = ""; this.set(ph); } },
  step: function (d) { var i = this.ORDER.indexOf(this.choice); i = (i + d + this.ORDER.length) % this.ORDER.length; this.pick(this.ORDER[i]); },
  els: {}, cur: "", phase: "", failed: false, bus: null, timer: 0,
  init: function () { var c = lsGet("ravana_track"); this.choice = c && this.TRACKS[c] ? c : "auto"; },
  ok: function () { return !this.failed && !!SND.ctx && typeof Audio !== "undefined" && !(window.RAVANA_CFG && window.RAVANA_CFG.noRec); },
  setup: function () {
    if (this.bus || !SND.ctx) return;
    var c = SND.ctx, comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3;
    this.bus = c.createGain(); this.bus.gain.value = 1; this.bus.connect(comp); comp.connect(c.destination);
    var me = this; this.timer = setInterval(function () { me.watch(); }, 250);
  },
  track: function (k) {
    if (this.els[k]) return this.els[k];
    var T0 = this.TRACKS[k], c = SND.ctx, me = this, t = { k: k, cfg: T0, a: [], g: [], i: 0, vol: 0, pos: 0 };
    for (var n = 0; n < 2; n++) {
      var a = new Audio(); a.src = T0.src; a.preload = n === 0 ? "auto" : "none"; a.crossOrigin = "anonymous";
      a.addEventListener("error", function () { if (!me.failed) { me.failed = true; me.stopAll(); MUS.mood = null; if (S.view === "tv" && T.H) MUS.setMood(MUS.phase || T.H.phase, true); } });
      var src = c.createMediaElementSource(a), g = c.createGain(); g.gain.value = 0.0001; src.connect(g); g.connect(this.bus);
      t.a.push(a); t.g.push(g);
    }
    this.els[k] = t; return t;
  },
  fade: function (g, to, sec) { var c = SND.ctx, now0 = c.currentTime; g.gain.cancelScheduledValues(now0); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now0); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, to), now0 + sec); },
  play: function (t, vol, sec) {
    var a = t.a[t.i], g = t.g[t.i];
    if (a.paused) { try { if (t.pos) a.currentTime = t.pos; } catch (e) { } var pr = a.play(); if (pr && pr.catch) pr.catch(function () { }); }
    t.vol = vol; this.fade(g, vol, sec);
  },
  stop: function (t, sec) {
    var me = this; t.vol = 0;
    t.g.forEach(function (g) { me.fade(g, 0.0001, sec); });
    var stamp = (t.stopAt = now());
    setTimeout(function () { if (t.stopAt !== stamp || t.vol > 0) return; t.a.forEach(function (a, i) { if (i === t.i) t.pos = a.currentTime || 0; try { a.pause(); } catch (e) { } }); }, sec * 1000 + 120);
  },
  stopAll: function () { var me = this; Object.keys(this.els).forEach(function (k) { me.stop(me.els[k], 0.6); }); this.cur = ""; },
  set: function (phase) {
    if (!this.ok()) return false;
    this.setup();
    var m = phase === "off" ? null : this.MAP[phase];
    if (!m) { this.phase = ""; this.stopAll(); return true; }
    this.phase = phase;
    if (this.choice !== "auto" && this.TRACKS[this.choice]) m = [this.choice, m[1]];
    var t = this.track(m[0]), me = this;
    if (this.cur && this.cur !== m[0] && this.els[this.cur]) this.stop(this.els[this.cur], 1.4);
    this.cur = m[0];
    this.play(t, m[1], this.cur && t.vol > 0 ? 0.9 : 1.6);
    if (phase === "reveal" || phase === "final" || phase === "zturnend") { /* let the fanfare and bells land first */
      var g = t.g[t.i], c = SND.ctx, n0 = c.currentTime; g.gain.cancelScheduledValues(n0); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), n0);
      g.gain.exponentialRampToValueAtTime(m[1] * 0.25, n0 + 0.25); g.gain.setValueAtTime(m[1] * 0.25, n0 + 1.8); g.gain.exponentialRampToValueAtTime(m[1], n0 + 3.2);
    }
    return true;
  },
  watch: function () {
    /* seamless loop: before the end, start the twin element at the loop point and crossfade */
    var me = this; if (!this.cur) return;
    var t = this.els[this.cur]; if (!t || t.vol <= 0) return;
    var a = t.a[t.i]; if (a.paused || !(a.currentTime > 0)) return;
    if (a.currentTime >= t.cfg.end - 2.5 || a.ended) {
      var j = 1 - t.i, b = t.a[j]; b.preload = "auto";
      try { b.currentTime = t.cfg.from; } catch (e) { }
      var pr = b.play(); if (pr && pr.catch) pr.catch(function () { });
      this.fade(t.g[j], t.vol, 2.2); this.fade(t.g[t.i], 0.0001, 2.2);
      var old = t.i; t.i = j; setTimeout(function () { if (t.i !== old) { try { t.a[old].pause(); } catch (e) { } } }, 2500);
    }
  }
};

REC.init();
/* ================= fireworks: rockets + 3D bursts ================= */
var FX = {
  c: null, x: null, parts: [], rockets: [], flashes: [], raf: 0, until: 0, style: "joy", nextLaunch: 0, finale: false,
  PAL: [["#FF2E8C", "#FF8FB8", "#FFD36B"], ["#FFC21A", "#FFE9A8", "#FF7A1A"], ["#1FB6A8", "#8CEFE3", "#FFF1C9"], ["#9B4DFF", "#D9B3FF", "#FF6FB1"], ["#E8203C", "#FFD36B", "#FFFFFF"], ["#2E8BFF", "#9ED0FF", "#FFE9A8"]],
  EMB: [["#C8102E", "#FF6A2A", "#7A1E1E"], ["#8A1C2C", "#FF8C42", "#4A1015"]],
  KINDS: ["peony", "chrys", "ring", "willow", "lotus", "crackle", "peony", "chrys"],
  init: function () { this.c = document.getElementById("fx"); if (!this.c) return; this.x = this.c.getContext("2d"); this.size(); var me = this; window.addEventListener("resize", function () { me.size(); }); },
  size: function () { if (!this.c) return; this.c.width = window.innerWidth; this.c.height = window.innerHeight; },
  show: function (sec, style) {
    if (REDUCED || !this.x) return;
    var st = style || "joy";
    if (st !== this.style) for (var i = 0; i < this.parts.length; i++) this.parts[i].d = Math.max(this.parts[i].d, 0.035);
    this.until = now() + sec * 1000; this.style = st; this.nextLaunch = 0; this.finale = sec >= 5;
    if (st === "joy") { this.launch(); if (this.finale) this.launch(); this.nextLaunch = now() + 500; }
    if (!this.raf) this.loop();
  },
  launch: function () {
    var W = this.c.width, H = this.c.height;
    if (Math.random() < 0.4) SND.whistle();
    this.rockets.push({ x: W * (0.12 + Math.random() * 0.76), y: H + 10, vx: (Math.random() - 0.5) * 1.4, vy: -(Math.sqrt(H) * 0.3 + Math.random() * 2.2), ty: H * (0.1 + Math.random() * 0.38), pal: this.PAL[(Math.random() * this.PAL.length) | 0], kind: this.KINDS[(Math.random() * this.KINDS.length) | 0], t0x: 0, t0y: 0 });
  },
  burst: function (x, y, pal, kind) {
    var n = kind === "willow" ? 90 : kind === "crackle" ? 110 : (kind === "ring" || kind === "lotus") ? 84 : 120;
    if (this.parts.length > 1100) n = (n / 2) | 0;
    var base = (kind === "willow" ? 4.2 : kind === "ring" ? 6.2 : 5.4) * Math.min(1, this.c.width / 1400 + 0.35), e1, e2;
    if (kind === "ring" || kind === "lotus") {
      var a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * 1.3, nx = Math.cos(a) * Math.cos(b), ny = Math.sin(a) * Math.cos(b), nz = Math.sin(b);
      var ux = 0, uy = 1, uz = 0; if (Math.abs(ny) > 0.9) { ux = 1; uy = 0; }
      e1 = [uy * nz - uz * ny, uz * nx - ux * nz, ux * ny - uy * nx]; var L1 = Math.hypot(e1[0], e1[1], e1[2]) || 1; e1 = [e1[0] / L1, e1[1] / L1, e1[2] / L1];
      e2 = [ny * e1[2] - nz * e1[1], nz * e1[0] - nx * e1[2], nx * e1[1] - ny * e1[0]];
    }
    for (var i = 0; i < n; i++) {
      var dx, dy, dz, sp;
      if (e1) { var th = (i / n) * Math.PI * 2 + Math.random() * 0.04, rr = kind === "lotus" ? 0.5 + 0.5 * Math.abs(Math.cos(th * 4)) : 1; dx = (e1[0] * Math.cos(th) + e2[0] * Math.sin(th)) * rr; dy = (e1[1] * Math.cos(th) + e2[1] * Math.sin(th)) * rr; dz = (e1[2] * Math.cos(th) + e2[2] * Math.sin(th)) * rr; sp = base * (0.92 + Math.random() * 0.16); }
      else { var u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2, q = Math.sqrt(1 - u * u); dx = q * Math.cos(ph); dy = q * Math.sin(ph); dz = u; sp = base * (kind === "peony" ? 0.82 + Math.random() * 0.3 : 0.3 + Math.random() * 0.8); }
      this.parts.push({ cx: x, cy: y, ox: 0, oy: 0, oz: 0, vx: dx * sp, vy: dy * sp, vz: dz * sp, l: 1, d: (kind === "willow" ? 0.0055 : 0.0085) + Math.random() * 0.008, c: pal[i % pal.length], r: 1.5 + Math.random() * 2.1, tr: kind === "chrys" || kind === "willow" || kind === "ring", g: kind === "willow" ? 0.085 : 0.042, tw: kind === "crackle" ? 1 + Math.random() * 9 : 0, px: x, py: y, drag: kind === "willow" ? 0.975 : 0.985 });
    }
    this.flashes.push({ x: x, y: y, r: 12, l: 1, c: pal[0] });
    SND.pop();
  },
  ember: function () {
    var W = this.c.width, H = this.c.height, pal = this.EMB[(Math.random() * 2) | 0];
    for (var i = 0; i < 5; i++) this.parts.push({ cx: W * (0.04 + Math.random() * 0.92), cy: H + 6, ox: 0, oy: 0, oz: (Math.random() - 0.5) * 260, vx: (Math.random() - 0.5) * 0.6, vy: -(1.1 + Math.random() * 2.3), vz: 0, l: 1, d: 0.0035 + Math.random() * 0.006, c: pal[i % 3], r: 1.4 + Math.random() * 2.4, tr: false, g: -0.004, tw: 1 + Math.random() * 9, px: null, py: null, drag: 0.996, wob: Math.random() * 6.28 });
  },
  loop: function () {
    var me = this, x = this.x, W = this.c.width, H = this.c.height, t = now(), live = t < this.until, i;
    if (live) {
      if (this.style === "boo") { if (t > this.nextLaunch) { this.ember(); this.nextLaunch = t + 60; } }
      else if (t > this.nextLaunch) { this.launch(); if (this.finale && Math.random() < 0.55) this.launch(); this.nextLaunch = t + (this.finale ? 230 : 380) + Math.random() * 420; }
    }
    x.globalCompositeOperation = "destination-out"; x.fillStyle = "rgba(0,0,0," + (this.style === "boo" ? 0.16 : 0.2) + ")"; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over"; x.lineCap = "round";
    for (i = this.rockets.length - 1; i >= 0; i--) {
      var rk = this.rockets[i], ox = rk.x, oy = rk.y;
      rk.x += rk.vx; rk.y += rk.vy; rk.vy += 0.085; rk.vx += (Math.random() - 0.5) * 0.1;
      x.globalAlpha = 0.9; x.lineWidth = 2.6; x.strokeStyle = "#FFC56B"; x.beginPath(); x.moveTo(ox, oy + 10); x.lineTo(rk.x, rk.y); x.stroke();
      x.fillStyle = "#FFF6DC"; x.beginPath(); x.arc(rk.x, rk.y, 3, 0, 6.283); x.fill();
      if (Math.random() < 0.6) this.parts.push({ cx: rk.x, cy: rk.y, ox: 0, oy: 0, oz: 0, vx: (Math.random() - 0.5) * 1.2, vy: 1 + Math.random(), vz: 0, l: 0.5, d: 0.03, c: "#FFD36B", r: 1.2, tr: false, g: 0.05, tw: 0, px: null, py: null, drag: 0.98 });
      if (rk.y <= rk.ty || rk.vy >= -1.2) { this.rockets.splice(i, 1); this.burst(rk.x, rk.y, rk.pal, rk.kind); }
    }
    for (i = this.flashes.length - 1; i >= 0; i--) {
      var f = this.flashes[i]; f.l -= 0.09; f.r += 9; if (f.l <= 0) { this.flashes.splice(i, 1); continue; }
      var gr = x.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); gr.addColorStop(0, "rgba(255,255,255," + (0.7 * f.l).toFixed(3) + ")"); gr.addColorStop(0.4, hexA(f.c, 0.22 * f.l)); gr.addColorStop(1, hexA(f.c, 0));
      x.globalAlpha = 1; x.fillStyle = gr; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 6.283); x.fill();
    }
    var F = 720;
    for (i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i]; p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.vz *= p.drag; p.ox += p.vx; p.oy += p.vy; p.oz += p.vz; p.l -= p.d;
      if (p.l <= 0) { this.parts.splice(i, 1); continue; }
      if (p.wob != null) p.ox += Math.sin(t / 420 + p.wob) * 0.5;
      var k = F / (F + p.oz), sx = p.cx + p.ox * k, sy = p.cy + p.oy * k, rr = Math.max(0.6, p.r * k), al = Math.min(1, p.l * 1.4) * Math.min(1, k * 0.8 + 0.2);
      if (p.tw) al *= 0.35 + 0.65 * Math.abs(Math.sin(t / 55 + p.tw * 7));
      x.globalAlpha = al; x.fillStyle = p.c;
      if (p.tr && p.px != null) { x.strokeStyle = p.c; x.lineWidth = rr * 1.6; x.beginPath(); x.moveTo(p.px, p.py); x.lineTo(sx, sy); x.stroke(); }
      x.beginPath(); x.arc(sx, sy, rr, 0, 6.283); x.fill();
      if (rr > 2.2) { x.globalAlpha = al * 0.2; x.beginPath(); x.arc(sx, sy, rr * 2.8, 0, 6.283); x.fill(); }
      p.px = sx; p.py = sy;
    }
    x.globalAlpha = 1;
    if (this.parts.length || this.rockets.length || this.flashes.length || live) this.raf = requestAnimationFrame(function () { me.loop(); });
    else { this.raf = 0; x.clearRect(0, 0, W, H); }
  }
};
function hexA(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a.toFixed(3) + ")"; }

/* ================= phone tilt (gyro) ================= */
function gyroTilt() {
  if (REDUCED || typeof DeviceOrientationEvent === "undefined" || typeof DeviceOrientationEvent.requestPermission === "function") return;
  var gx = 0, gy = 0, tx = 0, ty = 0, on = false;
  function tick() { gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08; var st = document.documentElement.style; st.setProperty("--gx", gx.toFixed(2) + "deg"); st.setProperty("--gy", gy.toFixed(2) + "deg"); st.setProperty("--px", (gx * 1.5).toFixed(1) + "px"); requestAnimationFrame(tick); }
  window.addEventListener("deviceorientation", function (e) { if (e.gamma == null || e.beta == null) return; tx = Math.max(-9, Math.min(9, e.gamma * 0.35)); ty = Math.max(-9, Math.min(9, -(e.beta - 45) * 0.22)); if (!on) { on = true; tick(); } });
}

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
    var seen = live ? now() : (old ? old.seen : 0);
    if (!live && old && (st._ts || 0) > (old.st._ts || 0)) seen = Math.max(old.seen || 0, now() - CFG.awayMs + 15000); /* it published since we last heard: it's alive */
    self.peers[id] = { st: st, seen: seen, recv: now() };
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
    self.resumedAt = now();
    if (hiddenAt && now() - hiddenAt > 2500) self.restart();
    else clients.forEach(function (c) { if (c && !c.connected) { try { c.reconnect(); } catch (e) { } } });
    hiddenAt = 0;
    if (self.mine) self.publish(self.mine);
  }
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("online", function () { if (!self.stopped) { self.resumedAt = now(); self.restart(); } });
  window.addEventListener("pageshow", function (e) { if (e.persisted && !self.stopped) { self.resumedAt = now(); self.restart(); } });
  window.addEventListener("focus", function () { if (!self.stopped && clients.some(function (c) { return c && !c.connected; })) { self.resumedAt = now(); clients.forEach(function (c) { if (c && !c.connected) { try { c.reconnect(); } catch (e) { } } }); } });
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
function isRoundPhase(ph) { return ["peek", "clues", "discuss", "vote", "verdict", "guess", "zintro", "zplay", "zturnend"].indexOf(ph) >= 0; }
function isZoomPhase(ph) { return ph === "zintro" || ph === "zplay" || ph === "zturnend"; }
function minPlayers(h) { return (GAMES[(h || T.H).game] || GAMES.ravana).minP; }
function gameName(h) { return (GAMES[(h || T.H).game] || GAMES.ravana).name; }

function newHost() {
  return {
    app: "ravana", role: "host", id: "tv_" + rid(10), code: String(1000 + Math.floor(Math.random() * 9000)), sess: rid(10), created: now(),
    v: 0, game: "ravana", z: null, phase: "lobby", roster: {}, ghosts: {}, removed: {}, rejected: {}, scores: {}, settings: { rounds: 5, talk: 90, zturn: 60, zfood: "mix" },
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
  S.view = "tv"; setRoot(tvShell()); fitTV(); ssSet("ravana_tvtab", 1); SND.load();
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(function () { }); } catch (e) { }
  tvPub();
}
function tvAnnounce() {
  if (!T.lanKey || !T.net || !T.H) return;
  T.net.announce(ROOT + "lan/" + T.lanKey + "/" + T.H.id, { app: "ravana", code: T.H.code, created: T.H.created, n: Object.keys(T.H.roster).length, phase: T.H.phase });
}
function tvPub() {
  var h = T.H; h.v++;
  h.tv = { music: MUS.on, sfx: SND.on, fit: Math.round(T.fit.size * 100), track: REC.choice, trackName: REC.label() }; h.theme = S.theme;
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
  if (zIntake()) changed = true;
  if (changed) tvPub(); else tvRender();
}
function recomputeDerived() {
  var h = T.H, ch = false;
  var away = roster().filter(function (id) { return !online(id); });
  if (away.join() !== h.away.join()) { h.away = away; ch = true; }
  var vip = (h.admin && h.roster[h.admin] && online(h.admin)) ? h.admin : (roster().filter(online)[0] || "");
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
    if (h.result.guessOk) SND.ravana(); else SND.buzz();
    return true;
  }
  return false;
}

/* ---- commands from phones ---- */
function runCmd(id, c) {
  var h = T.H;
  if (c.type === "done") { if (h.phase === "clues" && c.rk === h.rk && c.idx === h.clueIdx && h.order[h.clueIdx] === id && !h.paused) nextSpeaker(); return; }
  if (c.type === "claim") { if (h.roster[id]) { h.admin = id; recomputeDerived(); SND.bell(880); } return; }
  if (id !== h.vip) return;
  var same = c.rk === h.rk, a = c.arg;
  /* TV settings work any time */
  if (c.type === "music") { ACT.music(); return; }
  if (c.type === "track") { ACT.track(a); return; }
  if (c.type === "sound") { ACT.sound(); return; }
  if (c.type === "fit") { var f = { plus: "fitplus", minus: "fitminus", up: "fitup", down: "fitdown" }[a]; if (f) ACT[f](); return; }
  if (c.type === "remove") { if (a && a !== id && h.roster[a]) removePlayer(a, "removed"); return; }
  if (c.type === "endgame") { playAgain(); return; }
  if (c.type === "pause") { doPause(); return; }
  if (c.type === "resume") { doResume(); return; }
  if (h.paused) return;
  if (c.type === "setGame" && h.phase === "lobby" && GAMES[a]) h.game = a;
  else if (c.type === "setZturn" && h.phase === "lobby" && [45, 60, 90].indexOf(+a) >= 0) h.settings.zturn = +a;
  else if (c.type === "setZfood" && h.phase === "lobby" && ["mix", "in", "w"].indexOf(a) >= 0) h.settings.zfood = a;
  else if (c.type === "skipturn" && h.phase === "zplay" && same) zEndTurn();
  else if (c.type === "setRounds" && h.phase === "lobby" && [0, 3, 5, 8].indexOf(+a) >= 0) h.settings.rounds = +a;
  else if (c.type === "setTalk" && h.phase === "lobby" && [60, 90, 120].indexOf(+a) >= 0) h.settings.talk = +a;
  else if (c.type === "start" && h.phase === "lobby") startGame();
  else if (c.type === "skip" && same) {
    if (h.phase === "zintro") zBeginTurn(); else if (h.phase === "zplay") { if (h.z.picked == null) zResolve(-2); else zNextFood(); } else if (h.phase === "zturnend") zNextTurn();
    else if (h.phase === "peek") toClues(); else if (h.phase === "clues") nextSpeaker(); else if (h.phase === "discuss") toVote();
    else if (h.phase === "vote") tally(); else if (h.phase === "verdict") afterVerdict();
    else if (h.phase === "guess") { if (h.result.guess == null) { h.result.guess = ""; h.result.guessOk = false; } finishRound(); }
  }
  else if (c.type === "votenow" && h.phase === "discuss" && same) toVote();
  else if (c.type === "addtime" && h.phase === "discuss" && same) { h.timerEnd += 30000; h.timerTot += 30000; }
  else if (c.type === "count" && h.phase === "vote" && same) tally();
  else if (c.type === "override" && h.phase === "guess" && same && h.result && h.result.guess != null) { h.result.guessOk = a === "1"; h.timerEnd = now() + CFG.afterGuessMs; h.timerTot = CFG.afterGuessMs; }
  else if (c.type === "next" && (h.phase === "reveal" || h.phase === "skipped") && same) nextRound();
  else if (c.type === "next" && h.phase === "zturnend" && same) zNextTurn();
  else if (c.type === "again" && h.phase === "final") playAgain();
}

/* ---- game flow ---- */
function startGame() {
  var h = T.H; if (roster().length < minPlayers(h)) return;
  if (h.game === "zoom") { zStartGame(); return; }
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
  if (ids.length < minPlayers(h)) { h.phase = "lobby"; h.notice = "Need at least " + minPlayers(h) + " players to keep going."; return; }
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
  if (h.result.caught) { h.phase = "guess"; h.timerEnd = now() + CFG.guessMs; h.timerTot = CFG.guessMs; if (!SND.play("hit", 0.7)) SND.dhol(0, true); }
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
function playAgain() { var h = T.H; roster().forEach(function (id) { h.scores[id] = 0; }); h.round = 0; h.phase = "lobby"; h.rk = ""; h.result = null; h.ghosts = {}; h.z = null; h.paused = false; h.pauseLeft = null; h.notice = ""; }
function skipRound(reason) { var h = T.H; h.phase = "skipped"; h.notice = reason; h.result = null; T.pend = null; }
function removePlayer(id, why) {
  var h = T.H; if (!h.roster[id]) return;
  h.ghosts = h.ghosts || {}; h.ghosts[id] = h.roster[id];
  delete h.roster[id]; delete h.scores[id];
  if (why === "removed") h.removed[id] = true;
  var inRound = h.players.indexOf(id) >= 0 && (isRoundPhase(h.phase));
  if (!inRound) { h.players = h.players.filter(function (x) { return x !== id; }); return; }
  if (h.z && isZoomPhase(h.phase)) { h.players = h.players.filter(function (x) { return x !== id; }); if (h.z.pid === id) { h.notice = rname(id) + " left, so their turn ends."; zEndTurn(); } return; }
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
function doResume() {
  var h = T.H; if (!h.paused) return; var pl = h.pauseLeft || { timer: 20000, turn: 15000 };
  if (h.z && isZoomPhase(h.phase)) {
    var z = h.z; h.timerEnd = now() + Math.max(1500, pl.timer); h.turnEnd = h.phase === "zplay" ? now() + Math.max(3000, pl.turn) : 0;
    if (h.phase === "zplay" && z.food) { if (z.picked == null) z.fStart = h.timerEnd - z.dur; else z.revealUntil = h.timerEnd; }
  } else { h.timerEnd = now() + Math.max(5000, pl.timer); h.turnEnd = now() + Math.max(5000, pl.turn); }
  h.paused = false; h.pauseLeft = null; T.pend = null;
}

/* ================= game 2: Pehchaan Kaun? (zoom-out food quiz) ================= */
var ZOOM = { ms: 10000, z0: 7, revealMs: 1600, introMs: 4000, endMs: 7000, minLeft: 2500, awayMs: 8000 };
function zTurnLabel(sec) { return sec === 60 ? "1 minute" : sec === 90 ? "1½ minutes" : sec === 120 ? "2 minutes" : sec + " seconds"; }
function zFoodByKey(k) { for (var i = 0; i < FOODS.length; i++) if (FOODS[i][0] === k) return FOODS[i]; return FOODS[0]; }
function zGroup(k) { return (FOOD_INFO[k] && FOOD_INFO[k].g) || ""; }
function zOptions(f) {
  /* 3 wrong answers of the same kind (sweet or snack) and, where possible, the same cuisine (Indian or world);
     never a lookalike of the answer or of each other */
  var used = {}, picks = [], g0 = zGroup(f[0]), c0 = f[3] || "in"; if (g0) used[g0] = true;
  var take = function (x) {
    if (picks.length >= 3 || picks.indexOf(x[1]) >= 0) return; var g = zGroup(x[0]); if (g && used[g]) return; if (g) used[g] = true; picks.push(x[1]);
  };
  var same = FOODS.filter(function (x) { return x[2] === f[2] && x[0] !== f[0]; });
  shuffle(same.filter(function (x) { return (x[3] || "in") === c0; })).forEach(take);
  if (picks.length < 3) shuffle(same).forEach(take);
  if (picks.length < 3) shuffle(FOODS.filter(function (x) { return x[0] !== f[0]; })).forEach(take);
  picks.push(f[1]);
  return shuffle(picks);
}
function zFoodMode(h) { var m = h.settings && h.settings.zfood; return m === "in" || m === "w" ? m : "mix"; }
function zFoodLabel(h) { var m = zFoodMode(h); return m === "in" ? "Indian" : m === "w" ? "world" : ""; }
function zRefill(h) {
  var m = zFoodMode(h), list = FOODS.filter(function (f) { return m === "mix" || (f[3] || "in") === m; });
  if (list.length < 8) list = FOODS;
  h.z.pool = shuffle(list.map(function (f) { return f[0]; }));
}
function zStartGame() {
  var h = T.H, ids = roster().filter(online); if (ids.length < minPlayers(h)) ids = roster();
  roster().forEach(function (id) { h.scores[id] = 0; });
  h.round = 0; h.ghosts = {}; h.players = ids;
  h.z = { order: ids, ti: -1, pid: "", pool: [], list: [], fi: -1, food: null, fk: "", fStart: 0, dur: ZOOM.ms, picked: null, ok: null, revealUntil: 0, got: 0, seen: 0, done: {}, awayAt: 0 };
  zRefill(h);
  h.word = ""; h.cat = ""; h.ravanaId = ""; h.order = []; h.clueIdx = 0; h.result = null; h.notice = ""; h.ack = { saw: [], ready: [], voted: [] };
  zNextTurn();
}
function zNextTurn() {
  var h = T.H, z = h.z; z.ti++;
  while (z.ti < z.order.length && !h.roster[z.order[z.ti]]) z.ti++;
  if (z.ti >= z.order.length) { h.phase = "final"; h.rk = rid(6); z.pid = ""; z.food = null; T.pend = null; return; }
  z.pid = z.order[z.ti]; z.got = 0; z.seen = 0; z.fi = -1; z.food = null; z.picked = null; z.ok = null; z.fk = ""; z.awayAt = 0; z.hist = [];
  var need = Math.round(h.settings.zturn / 7.5); z.list = [];
  while (z.list.length < need) { if (!z.pool.length) zRefill(h); z.list.push(z.pool.shift()); }
  h.round = z.ti + 1; h.rk = rid(6); h.notice = "";
  h.phase = "zintro"; h.timerEnd = now() + ZOOM.introMs; h.timerTot = ZOOM.introMs; h.turnEnd = 0; h.paused = false; h.pauseLeft = null; T.pend = null;
  z.list.forEach(function (k) { var im = new Image(); im.src = foodSrc(k); });
  SND.dhol(0, true);
}
function zBeginTurn() { var h = T.H; if (h.phase !== "zintro") return; h.phase = "zplay"; h.turnEnd = now() + h.settings.zturn * 1000; zNextFood(); }
function zNextFood() {
  var h = T.H, z = h.z;
  if (h.turnEnd - now() < ZOOM.minLeft || z.fi + 1 >= z.list.length) { h.notice = z.fi + 1 >= z.list.length ? "All " + z.list.length + " foods done!" : ""; zEndTurn(); return; }
  z.fi++; var f = zFoodByKey(z.list[z.fi]); z.seen++;
  var inf = FOOD_INFO[f[0]] || {}, fc = inf.f || [50, 50], jit = function (v) { return Math.max(22, Math.min(78, v + Math.round(Math.random() * 8 - 4))); };
  z.food = { k: f[0], n: f[1], aka: inf.aka || "", r: inf.r || "", opts: zOptions(f), fx: jit(fc[0]), fy: jit(fc[1]), ans: 0 };
  z.food.ans = z.food.opts.indexOf(f[1]);
  z.fk = rid(5); z.fStart = now(); z.picked = null; z.ok = null; z.revealUntil = 0;
  z.dur = Math.max(3000, Math.min(ZOOM.ms, h.turnEnd - now() - 800)); h.timerEnd = z.fStart + z.dur; h.timerTot = z.dur;
}
function zResolve(pick) {
  var h = T.H, z = h.z; if (!z.food || z.picked != null) return;
  z.picked = pick; z.ok = pick === z.food.ans; (z.hist = z.hist || []).push([z.food.k, z.ok ? 1 : 0]);
  if (z.ok) { z.got++; h.scores[z.pid] = (h.scores[z.pid] || 0) + 1; }
  z.revealUntil = now() + ZOOM.revealMs; h.timerEnd = z.revealUntil; h.timerTot = ZOOM.revealMs;
}
function zEndTurn() {
  var h = T.H, z = h.z; z.done[z.pid] = z.got; z.food = null; z.picked = null; z.fk = "";
  h.phase = "zturnend"; h.timerEnd = now() + ZOOM.endMs; h.timerTot = ZOOM.endMs; h.turnEnd = 0; T.pend = null;
}
function zIntake() {
  var h = T.H; if (!h || h.phase !== "zplay" || !h.z || !h.z.food || h.z.picked != null) return false;
  var p = pst(h.z.pid);
  if (p && p.ans && p.ans.fk === h.z.fk && p.ans.pick >= 0 && p.ans.pick < 4) { zResolve(+p.ans.pick); return true; }
  return false;
}
function zTick(t) {
  var h = T.H, z = h.z, ch = false; if (!z) return false;
  if (h.phase === "zintro") { if (t > h.timerEnd) { zBeginTurn(); ch = true; } }
  else if (h.phase === "zplay") {
    if (!online(z.pid)) { z.awayAt = z.awayAt || t; if (t - z.awayAt > ZOOM.awayMs) { h.notice = rname(z.pid) + " is away, so their turn ends."; zEndTurn(); return true; } } else z.awayAt = 0;
    if (!z.food) { zNextFood(); ch = true; }
    else if (z.picked == null && t > h.timerEnd) { zResolve(-1); ch = true; }
    else if (z.picked != null && t > z.revealUntil) { zNextFood(); ch = true; }
  }
  else if (h.phase === "zturnend") { if (t > h.timerEnd) { zNextTurn(); ch = true; } }
  return ch;
}
function zoomTick() {
  var h = T.H, el = document.querySelector(".zimg[data-zs]");
  if (!el || !h || !h.z || S.view !== "tv") { T.zraf = 0; return; }
  var z = h.z, zs = +el.getAttribute("data-zs"), dur = +el.getAttribute("data-zd") || ZOOM.ms, p;
  if (z.picked != null) p = 1;
  else if (h.paused && h.pauseLeft) p = 1 - Math.max(0, Math.min(1, h.pauseLeft.timer / dur));
  else p = Math.max(0, Math.min(1, (now() - zs) / dur));
  el.style.transform = "scale(" + Math.pow(ZOOM.z0, 1 - p).toFixed(4) + ")";
  T.zraf = requestAnimationFrame(zoomTick);
}
function zBoard(h, size) {
  var ids = roster().slice().sort(function (a, b) { return (h.scores[b] || 0) - (h.scores[a] || 0); });
  return '<div class="zboard">' + ids.map(function (id) { return '<div class="row' + (h.z && id === h.z.pid ? " cur" : "") + (online(id) ? "" : " away") + '">' + avOf(id, size || 40) + "<span>" + esc(rname(id)) + '</span><b class="disp">' + (h.scores[id] || 0) + "</b></div>"; }).join("") + "</div>";
}
function zSky(h) {
  var z = h.z, pl = h.paused ? h.pauseLeft : null, ph = h.phase;
  if (ph === "zintro") {
    return '<div class="talk"><div><h1 class="h1 dq">' + esc(rname(z.pid)) + ", you’re up!</h1><p class=\"sub\">" + zTurnLabel(h.settings.zturn) + ", " + z.list.length + " " + (zFoodLabel(h) ? zFoodLabel(h) + " " : "") + "foods. Each one zooms out on the TV. Tap its name on your phone, fast.</p>" +
      '<p class="sub small">Everyone else: no shouting.</p></div>' + tRing(h.timerEnd, h.timerTot, pl ? pl.timer : null) + "</div>";
  }
  if (ph === "zplay") {
    var f = z.food; if (!f) return "";
    var rev = z.picked != null, rem = pl ? pl.timer : (z.fStart + z.dur - now()), frac = Math.max(0, Math.min(1, rem / z.dur));
    var opts = f.opts.map(function (o, i) { var c = rev ? (i === f.ans ? " ok" : (i === z.picked ? " no" : " dim")) : ""; return '<li class="' + c + '"><span class="ltr">' + "ABCD"[i] + "</span>" + esc(o) + "</li>"; }).join("");
    var badge = rev ? '<div class="zbadge ' + (z.ok ? "ok" : "no") + '"><span>' + (z.ok ? ic("check") + " " + esc(f.n) : (z.picked === -1 ? "Time! It was " + esc(f.n) : (z.picked === -2 ? "Skipped: " + esc(f.n) : "It was " + esc(f.n)))) + "</span>" + (f.aka || f.r ? '<small>' + esc(f.aka ? "aka " + f.aka : f.r) + "</small>" : "") + "</div>" : "";
    return '<div class="zwrap"><div class="zframe' + (rev ? " rev" : "") + '"><img class="zimg" src="' + foodSrc(f.k) + '" alt="" draggable="false" style="transform-origin:' + f.fx + "% " + f.fy + '%;transform:scale(' + (rev ? 1 : ZOOM.z0) + ')"' + (rev ? "" : ' data-zs="' + z.fStart + '" data-zd="' + z.dur + '"') + ">" + badge +
      '<div class="zbar"><i style="transform:scaleX(' + frac.toFixed(3) + ')"' + (pl || rev ? "" : ' data-dl="' + (z.fStart + z.dur) + '" data-tot="' + z.dur + '" data-fmt="bar"') + "></i></div></div>" +
      '<aside class="zside"><div class="zwho">' + avOf(z.pid, 72) + '<div><span class="k">Guessing now</span><span class="nm">' + esc(rname(z.pid)) + "</span></div></div>" +
      '<div class="zclock">' + ic("clock") + "<b>" + tText(h.turnEnd, pl ? pl.turn : null) + "</b><span>left · food " + z.seen + " · <b class=\"got\">" + z.got + "</b> right</span></div>" +
      '<ol class="zopts">' + opts + "</ol>" + zBoard(h, 40) + "</aside></div>";
  }
  if (ph === "zturnend") {
    var g = z.done[z.pid] || 0, nxt = z.order.slice(z.ti + 1).filter(function (id) { return h.roster[id]; })[0];
    var recap = (z.hist || []).map(function (x) { var inf = FOOD_INFO[x[0]] || {}; return '<figure class="' + (x[1] ? "ok" : "no") + '"><img src="' + foodSrc(x[0]) + '" alt=""><figcaption>' + (x[1] ? ic("check") : ic("x")) + esc(inf.n || x[0]) + "</figcaption></figure>"; }).join("");
    return '<div class="zend"><h1 class="h1">' + esc(rname(z.pid)) + " got <span class=\"zbig disp\">" + g + "</span> right</h1>" + (recap ? '<div class="zrecap">' + recap + "</div>" : "") + "<p class=\"sub\">" + (h.notice ? esc(h.notice) + " " : "") + (nxt ? "Up next: <b>" + esc(rname(nxt)) + "</b>." : "That was the last turn.") + "</p></div>";
  }
  return "";
}
/* ---- clock: timers + auto steps ---- */
function tvTick() {
  var h = T.H; if (!h || S.view !== "tv") return;
  if (T.toast && now() > T.toast.until) { T.toast = null; patch("tvToast", ""); }
  var ch = recomputeDerived();
  if (!h.paused && h.z && isZoomPhase(h.phase)) {
    if (zTick(now())) ch = true;
    if (h.phase === "zplay" && h.z.food && h.z.picked == null) { var zs = Math.ceil((h.z.fStart + h.z.dur - now()) / 1000), zkey = h.z.fk + ":" + zs; if (zs <= 4 && zs >= 1 && T.zTickKey !== zkey) { T.zTickKey = zkey; SND.tick(zs <= 2); } }
  }
  else if (!h.paused) {
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
      if (sec <= 5 && sec >= 1 && sec !== T.lastTick) { T.lastTick = sec; SND.tick(sec <= 3); }
    }
  }
  if (ch) tvPub();
  updateTimers(0);
}

/* ---- TV views: the Ramlila stage ---- */
var STEPS = ["Cards", "Clues", "Talk", "Vote", "Reveal"];
var STEP_OF = { peek: 0, clues: 1, discuss: 2, vote: 3, verdict: 4, guess: 4, reveal: 4, skipped: 4 };
var ARCH_W = 1920;
function tvShell() {
  return '<div class="tv" id="tv">' +
    '<header class="top"><div class="brand"><img class="brand-lotus" src="art/lotus0.png" alt=""><span class="disp" id="tvBrand">Diwali Games</span></div><div class="mid" id="tvHead"></div><div class="tools" id="tvTools"></div></header>' +
    '<div class="glowbg"></div><div class="medal">' + mandala() + '</div><div class="sparks">' + sparks(26) + '</div><div class="frame"><i></i><i></i><i></i><i></i></div>' +
    '<div class="bells"><div class="bell l">' + bellSVG() + '<i class="gleam"></i></div><div class="bell r">' + bellSVG() + '<i class="gleam"></i></div></div><div class="ravbg" id="tvRav"></div>' +
    '<main class="sky" id="tvMain"></main><div class="cast" id="tvRail"></div>' +
    '<footer class="apron" id="tvFoot"></footer><div id="tvOv"></div><div id="tvToast"></div></div>';
}
function mandala() {
  /* fine line-work: rings of petals and dots, like a chalk rangoli */
  var out = '<svg viewBox="-500 -500 1000 1000" aria-hidden="true" fill="none" stroke="#FFE7A8" stroke-width="1.4">';
  var rings = [{ r: 70, n: 8, len: 60, w: 22 }, { r: 150, n: 12, len: 80, w: 26 }, { r: 250, n: 16, len: 90, w: 24 }, { r: 360, n: 24, len: 100, w: 22 }];
  rings.forEach(function (R, k) {
    out += '<circle r="' + (R.r - 8) + '" stroke-opacity=".5"/>';
    for (var i = 0; i < R.n; i++) {
      var a = i * 360 / R.n;
      out += '<path d="' + petalD(R.len, R.w) + '" transform="rotate(' + a + ') translate(0,' + (-R.r) + ')"/>';
      out += '<circle r="3" transform="rotate(' + (a + 180 / R.n) + ') translate(0,' + (-R.r - R.len * 0.55) + ')" fill="#FFE7A8" stroke="none"/>';
    }
  });
  out += '<circle r="470" stroke-opacity=".5"/><circle r="482" stroke-opacity=".3" stroke-dasharray="2 10"/><circle r="22" stroke-opacity=".6"/>';
  return out + "</svg>";
}
function bellSVG(cls) { return '<img class="bellsvg ' + (cls || "") + '" src="art/bell.png" alt="" draggable="false">'; }
function sparks(n) {
  var out = "", r = rng(3);
  for (var i = 0; i < n; i++) out += '<i style="left:' + (r() * 100).toFixed(1) + "%;top:" + (r() * 100).toFixed(1) + "%;--d:" + (6 + r() * 8).toFixed(1) + "s;--dl:-" + (r() * 10).toFixed(1) + "s;--sz:" + (2 + r() * 3).toFixed(1) + 'px"></i>';
  return out;
}
function fitTV() {
  var el = document.getElementById("tv"); if (!el) return;
  var vw = window.innerWidth, vh = window.innerHeight, f = T.fit;
  var s = Math.min(vw / 1920, vh / 1080) * f.size;
  el.style.transform = "translate(-50%,-50%) translateY(" + Math.round(f.y * vh) + "px) scale(" + s.toFixed(4) + ")";
}
function castIds(h) { return roster(); }
function castLayout(h) {
  var ids = castIds(h), n = ids.length, nSlots = h.phase === "lobby" ? Math.max(minPlayers(h), Math.min(n + 1, CFG.maxP)) : n;
  var slot = nSlots ? Math.min(220, 1500 / nSlots) : 0, x0 = ARCH_W / 2 - slot * nSlots / 2 + slot / 2, pos = {};
  ids.forEach(function (id, i) { pos[id] = Math.round(x0 + i * slot); });
  return { ids: ids, slot: slot, x0: x0, nSlots: nSlots, pos: pos, w: Math.min(150, Math.max(110, slot - 40)) };
}
function spotTarget(h) {
  if (h.paused) return "";
  if (isZoomPhase(h.phase)) return h.phase === "zplay" ? "" : (h.z ? h.z.pid : "");
  if (h.phase === "clues") return h.order[h.clueIdx] || "";
  if (h.phase === "verdict") return h.result && h.result.picked || "";
  if (h.phase === "guess") return h.ravanaId;
  if (h.phase === "reveal") return h.result && !h.result.caught ? h.ravanaId : "";
  if (h.phase === "final") { var ids = roster().sort(function (a, b) { return (h.scores[b] || 0) - (h.scores[a] || 0); }); return ids[0] || ""; }
  return "";
}
function tvRender() {
  var h = T.H; if (!h || S.view !== "tv") return;
  if (!document.getElementById("tvMain")) { setRoot(tvShell()); fitTV(); }
  patch("tvHead", tvSign(h)); patch("tvTools", tvTools(h)); patch("tvBrand", h.phase === "lobby" ? "Diwali Games" : esc(gameName(h)));
  var mainKey = h.phase + "|" + h.rk + "|" + h.clueIdx + (h.z ? "|" + h.z.fk : "");
  if (S.lastMainKey !== mainKey && h.phase + "|" + h.rk !== String(S.lastMainKey).split("|").slice(0, 2).join("|")) T.phaseAt = now();
  var phaseChanged = patch("tvMain", tvSky(h), mainKey) && S.lastMainKey !== mainKey;
  S.lastMainKey = mainKey;
  patch("tvRail", tvCast(h));
  patch("tvFoot", tvApron(h));
  var ovChanged = patch("tvOv", tvOverlay(h));
  var showRav = (h.phase === "verdict" && h.result && h.result.picked && !h.result.caught) || h.phase === "guess" || (h.phase === "reveal" && h.result && !h.result.caught);
  patch("tvRav", showRav ? ravanaSVG() : "");
  var tvel = document.getElementById("tv"); if (tvel) { tvel.classList.toggle("rav-on", !!showRav); tvel.classList.toggle("ring", h.phase === "verdict" || h.phase === "reveal" || h.phase === "final" || h.phase === "zturnend"); tvel.classList.toggle("zoomg", h.phase === "zplay"); }
  if (h.phase === "zplay" && !T.zraf) T.zraf = requestAnimationFrame(zoomTick);
  if (h.z && h.phase === "zplay" && h.z.food && h.z.picked != null) { var zk = h.z.fk + ":" + h.z.picked; if (T.zKey !== zk) { T.zKey = zk; if (h.z.ok) SND.ding(); else if (h.z.picked === -1) SND.timeup(); else if (h.z.picked === -2) SND.play("whoosh", 0.5); else SND.buzz(); } }
  if (h.z && h.phase === "zplay" && h.z.food && h.z.picked == null && T.zNewKey !== h.z.fk) { T.zNewKey = h.z.fk; SND.play("whoosh", 0.35); }
  if (h.phase === "zturnend" && T.zEndKey !== h.rk) { T.zEndKey = h.rk; var gg = h.z ? (h.z.done[h.z.pid] || 0) : 0; if (gg >= 5) { FX.show(3, "joy"); SND.reveal(); SND.cheer(false, 0.2); } else if (gg >= 1) { SND.reveal(); SND.cheer(false, 0.2); } else SND.aww(); }
  tvSpot(h);
  patch("tvToast", T.toast && now() < T.toast.until ? '<div class="toast">' + ic("note") + "<span>" + esc(T.toast.t) + "</span></div>" : "");
  T.newIds = {};
  var rk = (h.phase === "reveal" || h.phase === "verdict" || h.phase === "final") ? h.phase + h.rk : "";
  if (rk && rk !== T.revealKey) {
    T.revealKey = rk;
    var R = h.result;
    SND.chime();
    if (h.phase === "verdict") {
      if (R.picked) { SND.roll(2.3); setTimeout(function () { if (R.caught) { FX.show(3.5, "joy"); SND.reveal(); SND.cheer(false, 0.15); } else { FX.show(2, "boo"); SND.ravana(); } }, 2300); }
      else SND.aww(0.2);
    } else if (h.phase === "reveal") {
      if (R.caught) { setTimeout(function () { if (R.guessOk) { FX.show(2, "boo"); SND.ravana(); } else { FX.show(3, "joy"); SND.reveal(); SND.cheer(false, 0.1); } }, 500); }
      else { SND.roll(1.5); setTimeout(function () { FX.show(2.5, "boo"); SND.ravana(); }, 1550); }
    } else { FX.show(7, "joy"); SND.bigFanfare(); SND.cheer(true, 0.6); }
  }
  ensureFocus(phaseChanged || ovChanged);
  MUS.setMood(h.paused ? "off" : (T.showSet ? (MUS.phase || h.phase) : h.phase));
  updateTimers(0);
}
function tvSpot(h) {
  var el = document.getElementById("tvSpot"), cast = document.getElementById("tvRail"); if (!el) return;
  var t = spotTarget(h), L = castLayout(h);
  if (!t || L.pos[t] == null) { el.classList.remove("on", "sweep"); if (cast) cast.classList.remove("focus"); T.spotAt = ""; return; }
  var key = h.phase + h.rk + t;
  el.style.setProperty("--x", L.pos[t] + "px");
  if (h.phase === "verdict" && T.spotAt !== key) { el.classList.remove("sweep"); void el.offsetWidth; el.classList.add("sweep"); }
  el.classList.add("on"); if (cast) cast.classList.add("focus");
  T.spotAt = key;
}
function tvSign(h) {
  if (h.phase === "lobby") return '<span class="k">Room</span><span class="code disp">' + h.code + "</span>";
  if (h.phase === "final") return '<span class="k">Final results</span>';
  if (isZoomPhase(h.phase)) return '<span class="k">Turn ' + h.round + " of " + (h.z ? h.z.order.filter(function (id) { return h.roster[id]; }).length : "?") + "</span>";
  var cur = STEP_OF[h.phase];
  return '<span class="k">Round ' + h.round + (h.settings.rounds ? " of " + h.settings.rounds : "") + '</span><ol class="track">' +
    STEPS.map(function (n, i) { return '<li class="' + (i < cur ? "done" : (i === cur ? "cur" : "")) + '">' + n + "</li>"; }).join("") + "</ol>";
}
function tvTools(h) {
  var conn = T.net && T.net.connected > 0;
  return (h.phase !== "lobby" ? '<span class="roomchip"><span class="dot ' + (conn ? "on" : "off") + '"></span>Room <b>' + h.code + "</b></span>" : '<span class="roomchip"><span class="dot ' + (conn ? "on" : "off") + '"></span>' + (conn ? "Live" : "Reconnecting") + "</span>") +
    (isRoundPhase(h.phase) ? IB(h.paused ? "resume" : "pause", h.paused ? "play" : "pause", h.paused ? "Resume" : "Pause") : "") + IB("settings", "gear", "Settings");
}
function plateStatus(h, id) {
  if (!online(id)) return '<span class="ps away">' + ic("moon") + "</span>";
  if (h.players.indexOf(id) < 0 && isRoundPhase(h.phase)) return '<span class="ps wait">next round</span>';
  return "";
}
function tvCast(h) {
  var L = castLayout(h), tgt = spotTarget(h), R = h.result, out = "", winner = h.phase === "final" ? tgt : "";
  L.ids.forEach(function (id, i) {
    var cls = ["pup"], inRound = h.players.indexOf(id) >= 0, isRav = (h.phase === "reveal" || h.phase === "guess") && id === h.ravanaId;
    if (!online(id)) cls.push("away");
    if (T.newIds[id]) cls.push("new");
    if (id === tgt) cls.push("lit");
    if (h.phase === "clues" && id === tgt && online(id)) cls.push("speaking");
    if (isRoundPhase(h.phase) && !inRound) cls.push("out");
    if ((h.phase === "peek" && h.ack.saw.indexOf(id) >= 0) || (h.phase === "discuss" && h.ack.ready.indexOf(id) >= 0) || (h.phase === "vote" && h.ack.voted.indexOf(id) >= 0)) cls.push("lamp");
    if (isRav) cls.push("ravana");
    if (winner && id === winner) cls.push("winner");
    var d = h.phase === "reveal" && R ? (R.delta[id] || 0) : 0, num = h.phase === "clues" ? h.order.indexOf(id) + 1 : 0;
    var av = h.roster[id].av, fig = lotus(av, L.w, "", { uid: id.slice(-6) + "a", dark: isRav, crown: !!winner && id === winner, refl: true });
    out += '<div class="' + cls.join(" ") + '" style="left:' + L.pos[id] + "px;--sw:" + (4.2 + (i % 4) * 0.55).toFixed(2) + "s;--sd:-" + (i * 0.9).toFixed(1) + 's">' +
      '<div class="fig"><div class="tilt">' + fig + "</div></div>" +
      (num ? '<span class="num">' + num + "</span>" : "") + '<div class="lampi">' + ic("check") + "</div>" +
      '<div class="plate">' + (isRav ? '<span class="ravtag">Ravana</span>' : "") + '<span class="pn">' + esc(rname(id)) + (id === h.vip ? '<span class="crown">' + ic("crown") + "</span>" : "") + plateStatus(h, id) + "</span>" +
      (h.phase !== "lobby" ? '<span class="sc disp">' + (h.scores[id] || 0) + "</span>" : "") + (d ? '<span class="delta">+' + d + "</span>" : "") + "</div></div>";
  });
  if (h.phase === "lobby") for (var k = L.ids.length; k < L.nSlots; k++) {
    out += '<div class="pup empty" style="left:' + Math.round(L.x0 + k * L.slot) + 'px"><div class="fig"><div class="ghostp" style="width:' + L.w + 'px;height:' + Math.round(L.w * 0.94) + 'px"></div></div><div class="plate dim"><span class="pn">Open seat</span></div></div>';
  }
  return out;
}
function tvSky(h) {
  var ph = h.phase, pl = h.paused ? h.pauseLeft : null;
  if (isZoomPhase(ph)) return zSky(h);
  if (ph === "lobby") {
    return '<div class="lobbysky"><div class="qrcard"><div class="qr">' + qrSvg(JOIN_URL + "#join-" + h.code) + '</div></div>' +
      '<div class="lobbytxt"><h1 class="h1">Scan to join</h1><p class="joinat">or go to <b>' + CFG.short + '</b> and enter <b class="codeinline disp">' + h.code + "</b></p>" +
      '<p class="note">' + (roster().length < minPlayers(h) ? "Need at least " + minPlayers(h) + " players." : (h.notice ? esc(h.notice) : "The host (crown) can run the game from their phone.")) + "</p>" +
      '<div class="lobbyopts">' + optRow("Game", [["ravana", "Find the Ravana"], ["zoom", "Pehchaan Kaun?"]], h.game, "setGame") + "</div>" +
      '<p class="gblurb">' + esc(GAMES[h.game].blurb) + "</p>" +
      '<div class="lobbyopts">' + (h.game === "zoom" ? optRow("Each turn", [[45, "45 sec"], [60, "1 min"], [90, "1½ min"]], h.settings.zturn, "setZturn") + optRow("Foods", ZFOOD, zFoodMode(h), "setZfood") : optRow("Rounds", [[3, "3"], [5, "5"], [8, "8"], [0, "No limit"]], h.settings.rounds, "setRounds") + optRow("Talk time", [[60, "1 min"], [90, "1½ min"], [120, "2 min"]], h.settings.talk, "setTalk")) + "</div></div></div>";
  }
  if (ph === "peek") {
    var el = now() - (T.phaseAt || 0);
    var rc = el < 2300 ? '<div class="roundcard" style="animation-delay:-' + (el / 1000).toFixed(2) + 's"><span class="disp">Round ' + h.round + "</span><small>Check your phones</small></div>" : "";
    return rc + '<h1 class="h1">Check your phones</h1><p class="sub">Everyone gets the same secret word, except one player. They’re the Ravana, and they only get a hint.</p>' +
      '<p class="sub small">Ready: <b>' + h.ack.saw.length + " of " + onlinePlayers().length + "</b></p>";
  }
  if (ph === "clues") {
    var cur = h.order[h.clueIdx], away = !online(cur);
    return '<h1 class="h1 sname">' + esc(rname(cur)) + '</h1><p class="sub">' + (away ? "is away, skipping their turn" : "say one word") + "</p>" + tBar(h.turnEnd, CFG.turnMs, pl ? pl.turn : null);
  }
  if (ph === "discuss") {
    return '<div class="talk"><div><h1 class="h1 dq">Who doesn’t know the word?</h1><p class="sub">Ready to vote: <b>' + h.ack.ready.length + " of " + onlinePlayers().length + "</b></p></div>" + tRing(h.timerEnd, h.timerTot, pl ? pl.timer : null) + "</div>";
  }
  if (ph === "vote") {
    return '<div class="talk"><div><h1 class="h1 dq">Vote on your phones</h1><p class="sub"><b>' + h.ack.voted.length + " of " + onlinePlayers().length + "</b> voted. Lamps light up as votes come in.</p></div>" + tRing(h.timerEnd, h.timerTot, pl ? pl.timer : null) + "</div>";
  }
  if (ph === "verdict") {
    var V = h.result;
    if (!V.picked) return '<h1 class="h1">' + (V.none ? "Nobody voted" : "The votes were split") + '</h1><p class="sub">No one was picked, so the Ravana gets away.</p>';
    return '<div class="verdict-s ' + (V.caught ? "good" : "bad") + '"><p class="r1">The group picked</p><h1 class="h1 rname disp">' + esc(rname(V.picked)) + '</h1><div class="stamp disp">' + (V.caught ? "The Ravana!" : "Not the Ravana") + "</div></div>";
  }
  if (ph === "guess") {
    var r = h.result, g = r.guess;
    var box = g == null ? '<div class="gbox wait"><span class="typing">Waiting for a guess<i>.</i><i>.</i><i>.</i></span></div>'
      : '<div class="gbox"><span class="gtext disp">' + (g ? esc(g) : "No guess") + '</span><span class="verdict ' + (r.guessOk ? "ok" : "no") + '">' + (r.guessOk ? "That’s the word!" : "Not the word") + "</span></div>";
    return '<h1 class="h1">' + esc(rname(h.ravanaId)) + "’s last chance</h1><p class=\"sub\">Guess the secret word to steal 2 points.</p>" + box;
  }
  if (ph === "reveal") {
    var R = h.result, rn = esc(rname(h.ravanaId)), out;
    if (R.caught) {
      out = R.guessOk ? rn + " guessed it and steals 2 points. Everyone who caught them still gets 1."
        : (R.guess ? rn + "’s guess, “" + esc(R.guess) + "”, was wrong. Everyone who caught them gets a point." : rn + " didn’t guess. Everyone who caught them gets a point.");
      return '<div class="reveal quick ' + (R.guessOk ? "bad" : "good") + '"><p class="r1">The secret word was</p><p class="r3 big"><span class="rword disp">' + esc(h.word) + "</span></p><p class=\"r4\">" + out + "</p></div>";
    }
    if (R.none) out = "Nobody voted, so the Ravana escapes with 2 points.";
    else if (R.tie) out = "The votes were split, so the Ravana escapes with 2 points.";
    else out = "The group picked the wrong person. The Ravana escapes with 2 points.";
    return '<div class="reveal bad"><p class="r1">The real Ravana was</p><h1 class="h1 rname disp r2">' + rn + '</h1><p class="r3">The word was <span class="rword disp">' + esc(h.word) + "</span></p><p class=\"r4\">" + out + "</p></div>";
  }
  if (ph === "skipped") return '<h1 class="h1">Round skipped</h1><p class="sub">' + esc(h.notice) + "</p>";
  if (ph === "final") {
    var ids = roster().sort(function (a, b) { return (h.scores[b] || 0) - (h.scores[a] || 0); });
    var top = (h.scores[ids[0]] || 0), winners = ids.filter(function (id) { return (h.scores[id] || 0) === top; });
    var title = !ids.length ? "Happy Diwali!" : (winners.length === 1 ? esc(rname(winners[0])) + " wins!" : (winners.length === 2 ? esc(rname(winners[0])) + " and " + esc(rname(winners[1])) + " tie!" : "A " + winners.length + "-way tie!"));
    return '<h1 class="h1 ftitle">' + title + '</h1><p class="sub">' + top + " point" + (top === 1 ? "" : "s") + ". Happy Diwali, everyone.</p>";
  }
  return "";
}
function optRow(label, opts, val, act) {
  return '<div class="optrow"><span class="lbl">' + label + '</span><div class="seg">' + opts.map(function (o) { return B(o[1], act, o[0], "chip" + (o[0] === val ? " sel" : "")); }).join("") + "</div></div>";
}
function tvApron(h) {
  var ph = h.phase, pl = h.paused ? h.pauseLeft : null, n = roster().length, acts = "", cap = "";
  if (ph === "lobby") {
    acts = B("Start " + gameName(h), "start", null, "big", "data-primary" + (n < minPlayers(h) ? " disabled" : ""));
    cap = "Edges cut off on your TV? Settings " + ic("gear") + " has screen size.";
  } else if (ph === "zintro") { acts = B("Start now", "skip", null, "", "data-primary"); cap = rname(h.z.pid) + " picks the answers on their phone."; }
  else if (ph === "zplay") { acts = B("Skip this food", "skip", null, "ghost") + B("End this turn", "skipturn", null, "ghost"); cap = "Only " + rname(h.z.pid) + " answers. Everyone else, no shouting."; }
  else if (ph === "zturnend") { var lastT = !h.z.order.slice(h.z.ti + 1).some(function (id) { return h.roster[id]; }); acts = B(lastT ? "See final results" : "Next player", "next", null, "big", "data-primary") + '<span class="tchip">' + ic("clock") + tText(h.timerEnd, pl ? pl.timer : null) + "</span>"; cap = lastT ? "" : "Next turn starts by itself in a moment.";
  } else if (ph === "peek") { acts = B("Start the clues", "skip", null, "", "data-primary") + '<span class="tchip">' + ic("clock") + tText(h.timerEnd, pl ? pl.timer : null) + "</span>"; cap = "Hold your card to see it, then tap Got it."; }
  else if (ph === "clues") { acts = B("Next speaker", "skip", null, "", "data-primary"); cap = "Say one word that hints at the secret word. Not too obvious, the Ravana is listening."; }
  else if (ph === "discuss") { acts = B("Start the vote", "votenow", null, "", "data-primary") + B("Add 30 seconds", "addtime", null, "ghost"); cap = "Talk it out. Who doesn’t seem to know the word?"; }
  else if (ph === "vote") { acts = B("Count the votes", "count", null, "", "data-primary"); cap = "Vote on your phone. You can change your vote until time runs out."; }
  else if (ph === "verdict") { acts = B("Continue", "verdictnext", null, "", "data-primary"); cap = "The votes are in."; }
  else if (ph === "guess") { var g = h.result.guess; acts = (g == null ? B("Skip the guess", "continue", null, "ghost") : B("Show the results", "continue", null, "", "data-primary") + B(h.result.guessOk ? "Don’t count it" : "Count it", "override", h.result.guessOk ? "0" : "1", "ghost")) + '<span class="tchip">' + ic("clock") + tText(h.timerEnd, pl ? pl.timer : null) + "</span>"; cap = "If the Ravana guesses the word, they steal 2 points."; }
  else if (ph === "reveal" || ph === "skipped") { var last = h.settings.rounds && h.round >= h.settings.rounds; acts = B(last ? "See final results" : "Next round", "next", null, "big", "data-primary"); cap = h.vip ? rname(h.vip) + " can start the next round from their phone." : "Start the next round when you’re ready."; }
  else if (ph === "final") { acts = B("Play again", "again", null, "big", "data-primary"); cap = "Play again goes back to the lobby, where you can pick the next game."; }
  var warn = !T.net || T.net.connected === 0 ? '<span class="warn">Reconnecting to the internet…</span>' : "";
  return '<div class="actrow">' + acts + '</div><p class="cap2">' + cap + "</p>" + warn;
}
function tvOverlay(h) {
  if (T.showSet) {
    var plist = roster().map(function (id) { return B(avOf(id, 40) + "<span>" + esc(rname(id)) + "</span>", "remove", id, "ghost chip pchip"); }).join("") || '<span class="muted">No players yet</span>';
    return '<div class="ov open"><div class="ovin set"><h2 class="h2 disp">Settings</h2>' +
      '<div class="setrow"><span class="lbl">Screen size</span>' + IB("fitminus", "minus", "Smaller") + '<b class="val">' + Math.round(T.fit.size * 100) + "%</b>" + IB("fitplus", "plus", "Bigger") + '<span class="muted">Make it smaller if the edges are cut off</span></div>' +
      '<div class="setrow"><span class="lbl">Move screen</span>' + IB("fitup", "up", "Move up") + IB("fitdown", "down", "Move down") + '<span class="muted">Move it down if the browser bar covers the top</span></div>' +
      '<div class="setrow"><span class="lbl">Sound</span>' + B(MUS.on ? "Music on" : "Music off", "music", null, "chip" + (MUS.on ? " sel" : "")) + B(SND.on ? "Effects on" : "Effects off", "sound", null, "chip" + (SND.on ? " sel" : "")) + B("Full screen", "full", null, "chip") + "</div>" +
      '<div class="setrow"><span class="lbl">Song</span>' + IB("track", "prev", "Previous song", "prev") + '<b class="val song">' + (REC.choice === "auto" ? "" : "#" + REC.num() + " ") + esc(REC.label()) + "</b>" + IB("track", "next", "Next song", "next") + '<span class="muted">' + (REC.choice === "auto" ? "Changes with the game" : "Plays all game, louder for reveals") + "</span></div>" +
      '<div class="setrow wrap"><span class="lbl">Remove</span>' + plist + "</div>" +
      '<div class="setrow"><span class="lbl">Game</span>' + B("End game, back to lobby", "endgame", null, "ghost chip") + B(T.confirmNew ? "Press again to confirm" : "New room code", "newroom", null, "ghost chip" + (T.confirmNew ? " danger" : "")) + "</div>" +
      '<div class="actrow">' + B("Done", "closeset", null, "", "data-primary") + "</div></div></div>";
  }
  if (h.paused) {
    return '<div class="ov open"><div class="ovin">' + glyph(170, 4) + '<h1 class="h1">Paused</h1><p class="sub">Timers are stopped on every screen.</p>' +
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
    if (H2 && H2.phase === "zintro" && H2.z && H2.z.pid === P.me.id) { var kz = H2.rk + ":zi"; if (P.lastTurn !== kz) { P.lastTurn = kz; vibrate([120, 60, 120]); } }
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
  if (h.z && h.phase === "zplay" && h.z.pid === P.me.id && P.st.ans && P.st.ans.fk === h.z.fk && h.z.picked == null) need = true;
  if (need && (!P.lastResend || now() - P.lastResend > 3000)) { P.lastResend = now(); P.net.publish(P.st); }
}
function goPhone() {
  var h = HS(); if (!h) return;
  var saved = lsGet("ravana_pst");
  var base = { app: "ravana", role: "player", id: P.me.id, code: P.code, sess: h.sess, name: P.me.name, av: P.me.av, left: false, joinedAt: now(), saw: "", ready: "", vote: null, guess: null, ans: null, cmd: null };
  if (saved && saved.id === P.me.id && saved.sess === h.sess && saved.code === P.code) base = Object.assign(base, { saw: saved.saw || "", ready: saved.ready || "", vote: saved.vote || null, guess: saved.guess || null, joinedAt: saved.joinedAt || base.joinedAt });
  P.st = base;
  lsSet("ravana_room", { code: P.code, sess: h.sess, ts: now() });
  ssSet("ravana_inroom", P.code); setHash("#join-" + P.code);
  requestWake();
  setView("phone");
  phPub();
}
/* Phones: a silent looping track keeps the browser running this page while you use another app,
   so the connection to the TV stays up. Starts on your first tap after joining; stops when you leave. */
var KEEP = {
  el: null, want: false,
  start: function () {
    if (S.view !== "phone" && S.view !== "join2" && S.view !== "finding") return;
    this.want = true;
    try {
      if (!this.el) { var a = new Audio("sfx/silence.mp3"); a.loop = true; a.preload = "auto"; a.setAttribute("playsinline", ""); a.setAttribute("webkit-playsinline", ""); this.el = a; }
      if (this.el.paused) { var pr = this.el.play(); if (pr && pr.catch) pr.catch(function () { }); }
      if (navigator.mediaSession && window.MediaMetadata) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: "Diwali Games", artist: "Connected to room " + (P.code || ""), artwork: [{ src: "art/lotus0.png", sizes: "600x600", type: "image/png" }] });
      }
    } catch (e) { }
  },
  stop: function () { this.want = false; try { if (this.el) this.el.pause(); if (navigator.mediaSession) navigator.mediaSession.metadata = null; } catch (e) { } },
  playing: function () { return !!(this.el && !this.el.paused); }
};
function setHash(hsh) { try { if ((location.hash || "") !== hsh) history.replaceState(null, "", location.pathname + location.search + hsh); } catch (e) { } }
function phPub() { if (!P.st || !P.net) return; P.net.publish(P.st); lsSet("ravana_pst", P.st); var r = savedRoom(); if (r) { r.ts = now(); lsSet("ravana_room", r); } phRender(); }
function phCmd(type, arg) { var h = HS(); if (!h) return; P.st.cmd = { seq: now(), type: type, rk: h.rk, idx: h.clueIdx, arg: arg == null ? "" : String(arg) }; phPub(); }
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
    '<span class="room"><span class="dot ' + (conn ? "on" : "off") + '"></span>Room ' + esc(P.code) + "</span>" + (vip ? IB("host", "gear", "Host controls", null, "hostbtn") : "") + IB("menu", "dots", "Menu");
}
function card(h, small) {
  var mine = h.ravanaId === P.me.id;
  var back = mine
    ? '<div class="face back rav"><span class="kick">You are the</span><span class="cw disp">Ravana</span><span class="ct">You don\'t know the word. Your hint: it\'s about <b>' + esc(h.cat) + "</b>. Blend in.</span></div>"
    : '<div class="face back"><span class="kick">The secret word</span><span class="cw disp">' + esc(h.word) + '</span><span class="ct">Give clues that fit it, without saying it.</span></div>';
  var word = mine ? '<span class="kick">You are the</span><span class="cw disp">Ravana</span><span class="ct">You don\'t know the word. Your hint: it\'s about <b>' + esc(h.cat) + "</b>. Blend in.</span>"
    : '<span class="kick">The secret word</span><span class="cw disp">' + esc(h.word) + '</span><span class="ct">Give clues that fit it, without saying it.</span>';
  return '<div class="card3d' + (small ? " small" : "") + '" data-hold="1"><div class="budwrap' + (mine ? " rav" : "") + '"><div class="word">' + word + '</div><div class="budlotus">' + lotus(P.me.av, 300, "fluid", { dark: mine, ripples: false }) + '</div><span class="hold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5a1.5 1.5 0 0 1 3 0V12"/><path d="M15 11.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4 15.5a1.4 1.4 0 0 1 2.1-1.8L9 16.5"/></svg>Hold to see your card</span></div></div>';
}
function zPhone(h, stt, vipC) {
  var z = h.z, me = P.me.id, mine = z.pid === me, pl = h.paused ? h.pauseLeft : null;
  if (stt === "zintro") {
    if (mine) return '<div class="center">' + glyph(120) + '<h2 class="h2 disp">You’re up, ' + esc(P.me.name) + '!</h2><p class="sub">' + zTurnLabel(h.settings.zturn) + ', ' + z.list.length + ' ' + (zFoodLabel(h) ? zFoodLabel(h) + ' ' : '') + 'foods. Tap the name of the food on the TV as soon as you know it.</p><div class="zcount disp">' + tText(h.timerEnd, pl ? pl.timer : null) + "</div>" + (vipC ? '<div class="acts">' + B("Start now", "cmd", "skip", "ghost") + "</div>" : "") + "</div>";
    return '<div class="center">' + pAv(h, z.pid, 110, "pop") + '<h2 class="h2 disp">' + esc(pName(h, z.pid)) + ' is up next</h2><p class="sub">Watch the TV. No shouting the answers!</p>' + zPhBoard(h) + "</div>";
  }
  if (stt === "zplay") {
    var f = z.food;
    if (!mine) return '<div class="center">' + pAv(h, z.pid, 110) + '<h2 class="h2 disp">' + esc(pName(h, z.pid)) + ' is guessing</h2><p class="sub">Food ' + z.seen + " · <b>" + z.got + "</b> right so far</p>" + zPhBoard(h) + (vipC ? '<div class="acts">' + B("Skip this food", "cmd", "skip", "ghost") + B("End this turn", "cmd", "skipturn", "ghost") + "</div>" : "") + "</div>";
    if (!f) return '<div class="center">' + glyph(120) + '<h2 class="h2 disp">Get ready…</h2></div>';
    var rev = z.picked != null, sent = P.st.ans && P.st.ans.fk === z.fk, rem = pl ? pl.timer : (z.fStart + z.dur - now()), frac = Math.max(0, Math.min(1, rem / z.dur));
    var btns = f.opts.map(function (o, i) {
      var c = rev ? (i === f.ans ? " ok" : (i === z.picked ? " no" : " dim")) : (sent && P.st.ans.pick === i ? " sel" : "");
      return '<button type="button" class="zbtn' + c + '" data-act="zans" data-arg="' + i + '" data-k="zans:' + i + '"' + (rev || sent ? " disabled" : "") + ">" + esc(o) + "</button>";
    }).join("");
    var st = rev ? '<p class="zres ' + (z.ok ? "ok" : "no") + '">' + (z.ok ? "Correct! +1" : (z.picked === -1 ? "Time’s up. It was " + esc(f.n) : "It was " + esc(f.n))) + "</p>" : (sent ? '<p class="status">Sending…</p>' : '<p class="status">What’s on the TV?</p>');
    return '<div class="zph"><div class="zhead"><span>Food ' + z.seen + "</span><span>" + tText(h.turnEnd, pl ? pl.turn : null) + "s left</span><span><b>" + z.got + "</b> right</span></div>" +
      '<div class="tbar zpb"><i style="transform:scaleX(' + frac.toFixed(3) + ')"' + (pl || rev ? "" : ' data-dl="' + (z.fStart + z.dur) + '" data-tot="' + z.dur + '" data-fmt="bar"') + "></i></div>" +
      '<div class="zgrid">' + btns + "</div>" + st + "</div>";
  }
  var g = z.done[z.pid] || 0;
  return '<div class="center">' + pAv(h, z.pid, 110, "pop") + '<h2 class="h2 disp">' + (mine ? "You got " : esc(pName(h, z.pid)) + " got ") + '<span class="pts2 disp">' + g + "</span> right</h2>" + zPhBoard(h) + (vipC ? '<div class="acts">' + B("Next player", "cmd", "next", "big") + "</div>" : "") + "</div>";
}
function zPhBoard(h) {
  var ids = Object.keys(h.roster).sort(function (a, b) { return (h.scores[b] || 0) - (h.scores[a] || 0); });
  return '<div class="zpboard">' + ids.map(function (id) { return '<span class="zpr' + (h.z && id === h.z.pid ? " cur" : "") + '">' + pAv(h, id, 26) + esc(pName(h, id)) + " <b>" + (h.scores[id] || 0) + "</b></span>"; }).join("") + "</div>";
}
function phMain(h, stt) {
  var me = P.me.id, vipC = h && h.vip === me && !h.paused;
  if (stt === "nohost") return '<div class="center">' + glyph(120) + '<h2 class="h2 disp">Looking for the TV</h2><p class="sub">Make sure the TV page is still open.</p></div>';
  if (stt === "joining") return '<div class="center">' + glyph(120) + '<h2 class="h2 disp">Joining room ' + esc(P.code) + '</h2><p class="sub">Hang on a second…</p></div>';
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
      (vipC ? '<div class="hostbox"><span class="hb-t">' + ic("crown") + " You're the host</span>" +
        '<div class="hrow"><span>Game</span><div class="seg">' + [["ravana", "Find the Ravana"], ["zoom", "Pehchaan Kaun?"]].map(function (o) { return B(o[1], "cmd", "setGame|" + o[0], "chip" + (h.game === o[0] ? " sel" : "")); }).join("") + "</div></div>" +
        (h.game === "zoom" ? '<div class="hrow"><span>Each turn</span><div class="seg">' + [[45, "45s"], [60, "1 min"], [90, "1½ min"]].map(function (o) { return B(o[1], "cmd", "setZturn|" + o[0], "chip" + (h.settings.zturn === o[0] ? " sel" : "")); }).join("") + "</div></div>" +
          '<div class="hrow"><span>Foods</span><div class="seg">' + ZFOOD.map(function (o) { return B(o[1], "cmd", "setZfood|" + o[0], "chip" + (zFoodMode(h) === o[0] ? " sel" : "")); }).join("") + "</div></div>" :
        '<div class="hrow"><span>Rounds</span><div class="seg">' + [[3, "3"], [5, "5"], [8, "8"], [0, "No limit"]].map(function (o) { return B(o[1], "cmd", "setRounds|" + o[0], "chip" + (h.settings.rounds === o[0] ? " sel" : "")); }).join("") + "</div></div>" +
        '<div class="hrow"><span>Talk time</span><div class="seg">' + [[60, "1 min"], [90, "1½ min"], [120, "2 min"]].map(function (o) { return B(o[1], "cmd", "setTalk|" + o[0], "chip" + (h.settings.talk === o[0] ? " sel" : "")); }).join("") + "</div></div>") +
        B("Start " + gameName(h), "cmd", "start", "big", n < minPlayers(h) ? "disabled" : "") + '<p class="note">' + (n < minPlayers(h) ? "Need at least " + minPlayers(h) + " players." : (h.game === "zoom" ? "Everyone takes a turn, one at a time." : "Everyone's phone will light up.")) + "</p></div>"
        : '<p class="sub">Waiting for ' + (h.vip ? esc(pName(h, h.vip)) : "the host") + ' to start the game.</p><button type="button" class="linkbtn" data-act="cmd" data-arg="claim" data-k="claim">Want to run the game? Become the host</button>') + "</div>";
  }
  if (stt === "waiting") return '<div class="center">' + glyph(120) + '<h2 class="h2 disp">' + (h.game === "zoom" ? "Game in progress" : "Round " + h.round + " is on") + "</h2><p class=\"sub\">" + (h.game === "zoom" ? "You'll be in the next game. Watch the TV for now." : "You'll be dealt in next round. Watch the TV and enjoy the chaos.") + "</p></div>";
  if (stt === "zintro" || stt === "zplay" || stt === "zturnend") return zPhone(h, stt, vipC);
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
      '<div class="acts">' + B(ready ? "Ready ✓ (tap to undo)" : "I'm ready to vote", "ready", null, ready ? "ghost big" : "big") + (vipC ? '<div class="hrow2">' + B("Start the vote now", "cmd", "votenow", "ghost") + B("+30 sec", "cmd", "addtime", "ghost") + "</div>" : "") + "</div>";
  }
  if (stt === "vote") {
    var my = P.st.vote && P.st.vote.rk === h.rk ? P.st.vote.t : "", ok = h.ack.voted.indexOf(me) >= 0, pl2 = h.paused ? h.pauseLeft.timer : null;
    var opts = h.players.filter(function (id) { return id !== me; }).map(function (id) { return '<button type="button" class="vbtn' + (my === id ? " sel" : "") + '" data-act="vote" data-arg="' + id + '" data-k="vote:' + id + '">' + pAv(h, id, 46) + '<span class="vnm">' + esc(pName(h, id)) + "</span>" + (my === id ? ic("check") : "") + "</button>"; }).join("");
    return '<h2 class="h2 disp">Who is the Ravana?</h2><p class="sub">' + tText(h.timerEnd, pl2) + "s left to vote</p>" + '<div class="vlist">' + opts + "</div>" +
      '<p class="status">' + (my ? (ok ? ic("check") + " The TV has your vote. You can change it." : "Sending your vote…") : "Tap a name to vote.") + "</p>" +
      (vipC ? '<div class="acts">' + B("Count the votes now (" + h.ack.voted.length + " of " + h.players.length + ")", "cmd", "count", "ghost") + "</div>" : "");
  }
  if (stt === "verdict") return '<div class="center">' + glyph(120) + '<h2 class="h2 disp">Look at the TV!</h2><p class="sub">The votes are in.</p>' + (vipC ? '<div class="acts">' + B("Continue", "cmd", "skip", "ghost") + "</div>" : "") + "</div>";
  if (stt === "guess") {
    if (h.ravanaId === me) {
      var sent = P.st.guess && P.st.guess.rk === h.rk;
      if (h.result && h.result.guess != null) return '<div class="center"><h2 class="h2 disp">' + (h.result.guessOk ? "You got it!" : "Not quite") + '</h2><p class="sub">Your guess: <b>' + esc(h.result.guess || "none") + "</b></p></div>";
      return '<div class="center"><h2 class="h2 disp">You were caught!</h2><p class="sub">Guess the secret word to steal 2 points. Your hint was <b>' + esc(h.cat) + "</b></p>" +
        '<form class="gform" data-form="guess"><input id="guessIn" class="field" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="Your guess" value="' + esc(P.guessDraft) + '">' +
        '<button class="btn big" type="submit"' + (sent ? " disabled" : "") + ">" + (sent ? "Sent" : "Submit my guess") + "</button></form></div>";
    }
    var G = h.result || {};
    return '<div class="center">' + pAv(h, h.ravanaId, 110, "red") + '<h2 class="h2 disp">' + esc(pName(h, h.ravanaId)) + "'s last chance</h2>" +
      (G.guess == null ? '<p class="sub">They\'re guessing the word on their phone.</p>' : '<p class="sub">They guessed <b>' + esc(G.guess || "nothing") + "</b>. " + (G.guessOk ? "That counts as the word." : "That doesn't count.") + "</p>") +
      (vipC ? '<div class="acts">' + (G.guess == null ? B("Skip the guess", "cmd", "skip", "ghost") : B("Show the results", "cmd", "skip", "") + B(G.guessOk ? "Don't count it" : "Count it", "cmd", "override|" + (G.guessOk ? "0" : "1"), "ghost")) + "</div>" : "") + "</div>";
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
    out += '<div class="dimmer" data-act="closemenu"></div><div class="sheet"><h3 class="disp">Room ' + esc(P.code) + "</h3>" +
      (vip ? B(ic("crown") + " Host controls", "host", null, "") : '<p class="shnote">' + (h && h.vip ? esc(pName(h, h.vip)) + " is the host right now. The host runs the game from their phone." : "The host runs the game from their phone.") + "</p>" + B(ic("crown") + " Become the host", "cmd", "claim", "")) +
      (P.confirmLeave ? B("Yes, leave the game", "leaveyes", null, "danger") : B("Leave the game", "leave", null, "ghost")) +
      B("Close", "closemenu", null, "ghost") + "</div>";
  }
  if (P.host && h && h.vip === P.me.id) out += phHostSheet(h);
  if (h && h.paused && stt !== "joining") out += '<div class="pov">' + glyph(120) + '<h2 class="h2 disp">Paused</h2><p class="sub">The game is paused on the TV.</p>' + (h.vip === P.me.id ? B("Resume", "cmd", "resume", "big") : "") + "</div>";
  var b = hostOf();
  var woke = now() - (P.net && P.net.resumedAt || 0) < 15000;
  if (P.net && P.net.connected > 0 && (!b || !b.seen || now() - b.seen > 35000) && now() - P.net.started > 15000 && !woke && stt !== "removed") {
    out += '<div class="pov">' + glyph(120) + '<h2 class="h2 disp">Can\'t reach the TV</h2><p class="sub">Is the game still open on the TV? We\'ll reconnect automatically when it\'s back.</p>' + B("Join with a different code", "newcode", null, "ghost") + "</div>";
  } else if (P.net && P.net.connected === 0 && now() - P.net.started > 4000 && now() - (P.net.resumedAt || 0) > 3000) {
    out += '<div class="netbar">Reconnecting…</div>';
  }
  return out;
}

function phHostSheet(h) {
  var ph = h.phase, last = h.settings.rounds && h.round >= h.settings.rounds;
  var step = {
    lobby: ["Start " + gameName(h), "start"], zintro: ["Start now", "skip"], zplay: ["Skip this food", "skip"], zturnend: ["Next player", "next"], peek: ["Start the clues", "skip"], clues: ["Next speaker", "skip"], discuss: ["Start the vote", "skip"],
    vote: ["Count the votes", "skip"], verdict: ["Continue", "skip"], guess: [h.result && h.result.guess != null ? "Show the results" : "Skip the guess", "skip"],
    reveal: [last ? "See final results" : "Next round", "next"], skipped: ["Next round", "next"], final: ["Play again", "again"]
  }[ph];
  var tv = h.tv || {}, me = P.me.id;
  var players = Object.keys(h.roster).filter(function (id) { return id !== me; }).map(function (id) { return '<span class="rmchip">' + pAv(h, id, 30) + "<span>" + esc(pName(h, id)) + '</span><button type="button" class="rmx" data-act="cmd" data-arg="remove|' + id + '" data-k="rm:' + id + '" aria-label="Remove ' + esc(pName(h, id)) + '">' + ic("x") + "</button></span>"; }).join("");
  return '<div class="dimmer" data-act="closehost"></div><div class="sheet host"><h3 class="disp">' + ic("crown") + " Host controls</h3>" +
    '<div class="hsec"><span class="hl">Game</span><div class="hgrid">' +
    (step && !h.paused ? B(step[0], "cmd", step[1], "", ph === "lobby" && Object.keys(h.roster).length < minPlayers(h) ? "disabled" : "") : "") +
    (ph === "zplay" && !h.paused ? B("End this turn", "cmd", "skipturn", "ghost") : "") +
    (isRoundPhase(ph) ? B(h.paused ? "Resume" : "Pause", "cmd", h.paused ? "resume" : "pause", "ghost") : "") +
    (ph === "discuss" && !h.paused ? B("+30 seconds", "cmd", "addtime", "ghost") : "") + "</div></div>" +
    '<div class="hsec"><span class="hl">TV</span><div class="hgrid">' +
    B(tv.music === false ? "Music off" : "Music on", "cmd", "music", "chip" + (tv.music === false ? "" : " sel")) + B(tv.sfx === false ? "Effects off" : "Effects on", "cmd", "sound", "chip" + (tv.sfx === false ? "" : " sel")) + "</div>" +
    '<div class="hrow"><span>Song</span><div class="stepper">' + IB("cmd", "prev", "Previous song", "track|prev") + '<b class="song">' + esc(tv.trackName || "Auto mix") + "</b>" + IB("cmd", "next", "Next song", "track|next") + "</div></div>" +
    '<div class="songs">' + REC.ORDER.map(function (k, i) { return B((i ? i + ". " : "") + esc(REC.label(k)), "cmd", "track|" + k, "chip" + ((tv.track || "auto") === k ? " sel" : "")); }).join("") + "</div>" +
    '<div class="hrow"><span>Screen size</span><div class="stepper">' + IB("cmd", "minus", "Smaller", "fit|minus") + "<b>" + (tv.fit || 92) + "%</b>" + IB("cmd", "plus", "Bigger", "fit|plus") + "</div></div>" +
    '<div class="hrow"><span>Move screen</span><div class="stepper">' + IB("cmd", "up", "Move up", "fit|up") + IB("cmd", "down", "Move down", "fit|down") + "</div></div></div>" +
    (players ? '<div class="hsec"><span class="hl">Remove a player</span><div class="rmlist">' + players + "</div></div>" : "") +
    (ph !== "lobby" ? '<div class="hsec">' + B("End game, back to lobby", "cmd", "endgame", "ghost") + "</div>" : "") +
    B("Done", "closehost", null, "ghost") + "</div>";
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
  setRoot('<div class="home"><div class="hpool">' + [0, 4, 2].map(function (i, k) { return '<div class="hl p' + k + '">' + lotus(i, k === 1 ? 170 : 130, "", { ripples: false, refl: true }) + "</div>"; }).join("") + "</div>" +
    '<div class="hero"><h1 class="title disp">Diwali Games</h1><p class="tag">Find the Ravana · Pehchaan Kaun? The TV is the stage, your phones are the controllers.</p></div>' +
    '<div class="choices"><div id="homeLan">' + homeLan() + "</div>" +
    (sr && P.me.name ? B("Rejoin room " + esc(sr.code) + " as " + esc(P.me.name), "rejoin", sr.code, "rani big") : "") +
    B("Join a game", "join1", null, "big", IS_TOUCH ? "data-primary" : "") +
    B("Use this screen as the TV", "tvnew", null, "ghost big", IS_TOUCH ? "" : "data-primary") +
    (sh ? B("Resume the TV game (room " + esc(sh.code) + ")", "tvresume", null, "ghost") : "") +
    '</div><p class="foot">For 2 to 8 players, all in one room.</p></div>');
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
  setRoot('<div class="ph"><main class="phm"><div class="center">' + glyph(120) + '<h2 class="h2 disp">Finding room ' + esc(P.code) + '</h2><p class="sub" id="findMsg">Connecting to the TV…</p><div class="acts">' + B("Use a different code", "join1", null, "ghost") + "</div></div></main></div>");
}
function avGrid(h) {
  var used = {}, names = [];
  if (h) Object.keys(h.roster).forEach(function (id) { if (id !== P.me.id) used[h.roster[id].av] = true; });
  if (P.sel < 0 || used[P.sel]) { P.sel = P.me.av >= 0 && !used[P.me.av] ? P.me.av : -1; if (P.sel < 0) for (var i = 0; i < AVATARS.length; i++) if (!used[i]) { P.sel = i; break; } }
  return AVATARS.map(function (a, i) { return '<button type="button" class="avpick' + (P.sel === i ? " sel" : "") + '" data-act="pickav" data-arg="' + i + '" data-k="pickav:' + i + '"' + (used[i] ? " disabled" : "") + ">" + avHTML(P.me.name || "?", i, 64) + "</button>"; }).join("");
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
  setGame: function (v) { if (GAMES[v] && T.H.phase === "lobby") { T.H.game = v; tvPub(); } },
  setZturn: function (v) { T.H.settings.zturn = +v; tvPub(); },
  setZfood: function (v) { if (["mix", "in", "w"].indexOf(v) >= 0) { T.H.settings.zfood = v; if (T.H.z) zRefill(T.H); tvPub(); } },
  skipturn: function () { if (T.H.phase === "zplay") { zEndTurn(); tvPub(); } },
  zans: function (i) { var h = HS(); if (!h || h.phase !== "zplay" || !h.z || h.z.pid !== P.me.id || h.z.picked != null) return; P.st.ans = { fk: h.z.fk, pick: +i }; vibrate(15); phPub(); },
  setTalk: function (v) { T.H.settings.talk = +v; tvPub(); },
  start: function () { startGame(); tvPub(); },
  skip: function () { var ph = T.H.phase; if (ph === "zintro") zBeginTurn(); else if (ph === "zplay") { if (T.H.z.picked == null) zResolve(-2); else zNextFood(); } else if (ph === "zturnend") zNextTurn(); else if (ph === "peek") toClues(); else if (ph === "clues") nextSpeaker(); tvPub(); },
  votenow: function () { toVote(); tvPub(); },
  addtime: function () { T.H.timerEnd += 30000; T.H.timerTot += 30000; tvPub(); },
  count: function () { tally(); tvPub(); },
  verdictnext: function () { if (T.H.phase === "verdict") { afterVerdict(); tvPub(); } },
  "continue": function () { var r = T.H.result; if (r && r.guess == null) { r.guess = ""; r.guessOk = false; } finishRound(); tvPub(); },
  override: function (v) { var r = T.H.result; r.guessOk = v === "1"; T.H.timerEnd = now() + CFG.afterGuessMs; T.H.timerTot = CFG.afterGuessMs; tvPub(); },
  next: function () { if (T.H.phase === "zturnend") zNextTurn(); else nextRound(); tvPub(); },
  again: function () { playAgain(); tvPub(); },
  pause: function () { doPause(); tvPub(); },
  resume: function () { doResume(); tvPub(); },
  music: function () { MUS.on = !MUS.on; lsSet("ravana_music", MUS.on); SND.unlock(); if (!MUS.on) MUS.setMood("off", true); else { MUS.mood = null; } if (S.view === "tv") { S.cache.tvHead = S.cache.tvOv = null; tvRender(); } },
  track: function (a) {
    if (a === "next") REC.step(1); else if (a === "prev") REC.step(-1); else REC.pick(a);
    if (!MUS.on) { MUS.on = true; lsSet("ravana_music", true); }
    SND.unlock(); MUS.mood = null;
    T.toast = { t: (REC.choice === "auto" ? "Music: Auto mix" : "Now playing: " + REC.label()), until: now() + 2600 };
    if (S.view === "tv") { S.cache.tvOv = null; tvPub(); }
  },
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
  cmd: function (a) { var i = String(a).indexOf("|"), type = i < 0 ? a : a.slice(0, i), arg = i < 0 ? "" : a.slice(i + 1); if (["fit", "music", "sound", "track", "setRounds", "setTalk", "setGame", "setZturn", "remove"].indexOf(type) < 0) { P.menu = false; P.confirmLeave = false; P.host = false; } phCmd(type, arg); },
  host: function () { P.host = true; P.menu = false; phRender(); },
  closehost: function () { P.host = false; phRender(); },
  menu: function () { P.menu = true; P.confirmLeave = false; phRender(); },
  closemenu: function () { P.menu = false; P.confirmLeave = false; phRender(); },
  leave: function () { P.confirmLeave = true; phRender(); },
  leaveyes: function () {
    if (P.st && P.net) { P.st.left = true; P.net.publish(P.st); }
    var n = P.net; P.net = null; setTimeout(function () { if (n) n.stop(false); }, 1500);
    lsDel("ravana_room"); lsDel("ravana_pst"); ssSet("ravana_inroom", ""); setHash(""); KEEP.stop(); P.menu = false; P.confirmLeave = false; P.st = null; setView("home");
  },
  newcode: function () { KEEP.stop(); if (P.net) { P.net.stop(false); P.net = null; } lsDel("ravana_room"); ssSet("ravana_inroom", ""); setHash(""); P.code = ""; setView("join1"); },
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
  if (S.view === "phone" && !KEEP.playing()) KEEP.start();
  var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
  if (!t || t.disabled) return;
  SND.unlock();
  var f = ACT[t.getAttribute("data-act")];
  if (f) { e.preventDefault(); f(t.getAttribute("data-arg"), t); }
});
document.addEventListener("submit", function (e) { e.preventDefault(); if (e.target.getAttribute("data-form") === "name") KEEP.start(); var f = FORMS[e.target.getAttribute("data-form")]; if (f) f(); });
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
  if (on) { c.classList.add("flip"); S.holding = true; vibrate(8); SND.unlock(); SND.bell(1319); }
  else { c.classList.remove("flip"); S.holding = false; if (S.view === "phone") setTimeout(phRender, 50); }
}
document.addEventListener("pointerdown", function (e) { if (e.target.closest && e.target.closest("[data-hold]")) { e.preventDefault(); onHold(true); } });
document.addEventListener("touchend", function () { if (S.view === "phone" && !KEEP.playing()) KEEP.start(); }, { passive: true });
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
window.addEventListener("load", function () { FX.init(); gyroTilt(); });
function applyTheme(t) { if (["velvet", "ivory", "rose"].indexOf(t) < 0) t = "velvet"; if (document.documentElement.getAttribute("data-theme") !== t) document.documentElement.setAttribute("data-theme", t); return t; }
(function boot() {
  S.theme = "ramlila";
  S.emoji = emojiSupport();
  loadMe();
  FX.init();
  if (route()) return;
  var sr = savedRoom(), inroom = ssGet("ravana_inroom");
  if (ssGet("ravana_tvtab") && savedHost()) { tvStart(true); return; }      /* the TV tab was reloaded: carry on */
  if (inroom && sr && sr.code === inroom && P.me.name) { startJoin(inroom); return; } /* this phone tab was reloaded mid-game */
  setView("home");
})();
window.RV = { S: S, T: T, P: P, ACT: ACT, FORMS: FORMS, HS: HS, CFG: CFG, FX: FX, SND: SND, MUS: MUS, FOODS: FOODS, ZOOM: ZOOM, FOOD_INFO: FOOD_INFO, zOptions: zOptions, zRefill: zRefill, REC: REC, KEEP: KEEP };
