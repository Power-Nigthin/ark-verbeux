// PixelArk v2 – survie et apprivoisement de dinos en pixel art (canvas, aucune dépendance)
const $ = id => document.getElementById(id);
const cv = $('c'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
if (document.fonts) document.fonts.load('8px "Press Start 2P"');
const W = 480, H = 270, T = 16, N = 120, WS = N * T;

// ---------- Outils ----------
let seed = 7;
const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const hash = (x, y) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h = Math.imul(h ^ (h >>> 16), 2246822519); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
const noise = (x, y) => Math.sin(x * .11) + Math.cos(y * .13) + Math.sin((x + y) * .07);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; };
const R = (k, col, x, y, w, h) => { k.fillStyle = col; k.fillRect(x, y, w, h); };
const sh = (h, a) => '#' + [1, 3, 5].map(i => clamp(parseInt(h.substr(i, 2), 16) + a, 0, 255).toString(16).padStart(2, '0')).join('');

// Contour sombre de 1 px autour d'un sprite : donne le rendu "pixel art" propre
function outline(c, oc = '#1a1210') {
  const w = c.width + 2, h = c.height + 2, o = mk(w, h, k => k.drawImage(c, 1, 1)), k = o.getContext('2d');
  const s = k.getImageData(0, 0, w, h).data, a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && s[(y * w + x) * 4 + 3] > 0, pts = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) pts.push(x, y);
  k.fillStyle = oc; for (let i = 0; i < pts.length; i += 2) k.fillRect(pts[i], pts[i + 1], 1, 1);
  return o;
}

// ---------- Création de personnage (inspirée d'ARK : sexe, corpulence, couleurs, coiffure) ----------
const SKIN = ['#f2cfa8', '#e8b98a', '#c98f5f', '#a56a3f', '#7a4a2a', '#4a2c1a'];
const HAIR = ['#1a1410', '#4a2c12', '#8a5a2b', '#d2a94a', '#cfcfcf', '#b5361f', '#2b6cb0', '#7a3fb0'];
const EYE = ['#3b2a1a', '#2b6cb0', '#3f9a3a', '#7a8a99', '#c9a227'];
const BUILD = [
  { hp: 90, sp: 1.1, dm: .9, n: 'Mince : +10% vitesse, moins de vie' },
  { hp: 100, sp: 1, dm: 1, n: 'Normale : équilibrée' },
  { hp: 120, sp: .92, dm: 1.2, n: 'Costaud : +vie, +dégâts, plus lent' },
];
let C = { name: 'Survivant', sex: 0, build: 1, hair: 1, beard: 0, skin: 1, hairc: 1, eyec: 0 };
const IDS = ['sex', 'build', 'hair', 'beard', 'skin', 'hairc', 'eyec'];

function charSprite(C, dir, fr) {
  const sk = SKIN[C.skin], hc = HAIR[C.hairc], ec = EYE[C.eyec], w = [6, 8, 10][C.build], x0 = 8 - w / 2, up = dir === 'u';
  return outline(mk(16, 24, k => {
    R(k, '#6b4a2a', 5, 17, 2, 6 - fr); R(k, '#6b4a2a', 9, 17, 2, 5 + fr);
    R(k, '#3a2a1a', 5, 22 - fr, 2, 1); R(k, '#3a2a1a', 9, 21 + fr, 2, 1);
    R(k, '#8a6a3a', x0, 9, w, 9); R(k, '#6e5230', x0, 15, w, 3); R(k, '#4a3220', x0, 14, w, 1);
    if (C.sex === 0) R(k, sk, x0 + 1, 9, w - 2, 4);
    R(k, sk, x0 - 1, 10 + fr, 1, 5); R(k, sk, x0 + w, 11 - fr, 1, 5);
    R(k, sk, 7, 8, 2, 1); R(k, sk, 5, 2, 6, 6); R(k, 'rgba(0,0,0,.18)', 5, 7, 6, 1);
    const hs = C.hair;
    if (hs === 1) { R(k, hc, 5, 1, 6, 2); R(k, hc, 5, 3, 1, 2); R(k, hc, 10, 3, 1, 2); if (up) R(k, hc, 5, 1, 6, 6); }
    if (hs === 2) { R(k, hc, 4, 1, 8, 2); R(k, hc, 4, 3, 1, 6); R(k, hc, 11, 3, 1, 6); if (up) R(k, hc, 4, 1, 8, 9); }
    if (hs === 3) { R(k, hc, 5, 1, 6, 2); R(k, hc, 5, 3, 1, 2); R(k, hc, 10, 3, 1, 2); R(k, hc, 11, 3, 2, 5); if (up) { R(k, hc, 5, 1, 6, 6); R(k, hc, 7, 7, 2, 4); } }
    if (hs === 4) { R(k, hc, 7, 0, 2, 4); R(k, hc, 6, 1, 4, 1); if (up) R(k, hc, 7, 4, 2, 4); }
    if (!up) {
      R(k, '#fff', 6, 4, 2, 2); R(k, '#fff', 9, 4, 2, 2); R(k, ec, 7, 5, 1, 1); R(k, ec, 10, 5, 1, 1);
      if (C.beard === 1) R(k, hc, 6, 6, 4, 1);
      else if (C.beard === 2) { R(k, hc, 5, 6, 6, 3); R(k, sh(hc, 25), 6, 6, 4, 1); }
      else R(k, 'rgba(0,0,0,.3)', 7, 7, 2, 1);
    }
  }));
}
function preview() {
  readC(); const s = charSprite(C, 'd', 0), p = $('pv'), k = p.getContext('2d');
  k.imageSmoothingEnabled = false; k.fillStyle = '#3a7031'; k.fillRect(0, 0, p.width, p.height);
  k.drawImage(s, 0, 0, s.width * 4, s.height * 4); $('info').textContent = BUILD[C.build].n;
}
function readC() { C.name = ($('name').value.trim() || 'Survivant').slice(0, 16); IDS.forEach(i => C[i] = +$(i).value); }
[...IDS, 'name'].forEach(i => $(i).addEventListener('input', preview));
$('rnd').onclick = () => { IDS.forEach(i => { const e = $(i), m = e.tagName === 'SELECT' ? e.options.length - 1 : +e.max; e.value = Math.round(Math.random() * m); }); preview(); };
$('go').onclick = start;
preview();

// ---------- Terrain (style PokéSurvivor : herbe bruitée, terre en taches, plateau de pierre, mares) ----------
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, y) => vn(x, y) * .55 + vn(x * 2.1 + 5, y * 2.1 + 9) * .3 + vn(x * 4.3 + 11, y * 4.3 + 3) * .15;
const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const PG = ['#234e24', '#2a5a28', '#31672d', '#397432', '#418036'].map(rgb), PD = ['#654a2e', '#6f5234', '#7b5b3a', '#84633f'].map(rgb);
const PS = ['#4a5742', '#52604a', '#5a6850', '#657459'].map(rgb), PW = ['#2f63a8', '#3470b8', '#3b7cc6'].map(rgb);
const tw = new Uint8Array(N * N), tp = new Uint8Array(N * N);   // tw = eau (bloque), tp = plateau de pierre
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const away = Math.hypot(x - 60, y - 60) > 9;
  tw[y * N + x] = away && fbm(x * .09 + 40, y * .09 + 7) > .72 ? 1 : 0;
  tp[y * N + x] = !tw[y * N + x] && away && fbm(x * .07 + 90, y * .07 + 30) > .685 ? 1 : 0;
}
const isW = (x, y) => tw[clamp(y / T | 0, 0, N - 1) * N + clamp(x / T | 0, 0, N - 1)];
const gw = (x, y) => x >= 0 && y >= 0 && x < N && y < N && tw[y * N + x], gp = (x, y) => x >= 0 && y >= 0 && x < N && y < N && tp[y * N + x];
// champs de bruit précalculés sur une grille (puis interpolés) : démarrage rapide
const G = 4, GN = WS / G + 2, dG = new Float32Array(GN * GN), sG = new Float32Array(GN * GN);
for (let gy = 0; gy < GN; gy++) for (let gx = 0; gx < GN; gx++) { dG[gy * GN + gx] = fbm(gx * G * .011 + 3, gy * G * .011 + 8); sG[gy * GN + gx] = fbm(gx * G * .006 + 20, gy * G * .006 + 2); }
const samp = (A, px, py) => { const fx = px / G, fy = py / G, x0 = fx | 0, y0 = fy | 0, u = fx - x0, v = fy - y0, i = y0 * GN + x0; return A[i] * (1 - u) * (1 - v) + A[i + 1] * u * (1 - v) + A[i + GN] * (1 - u) * v + A[i + GN + 1] * u * v; };
const bg = mk(WS, WS, b => {
  const img = b.createImageData(WS, WS), d = img.data;
  for (let py = 0; py < WS; py++) for (let px = 0; px < WS; px++) {
    const tx = px >> 4, ty = py >> 4, lx = px & 15, ly = py & 15, r = hash(px * 7 + 1, py * 13 + 3);
    let c;
    if (tw[ty * N + tx]) {
      const L = !gw(tx - 1, ty), Rr = !gw(tx + 1, ty), U = !gw(tx, ty - 1), D = !gw(tx, ty + 1);
      c = (lx < 1 && L) || (lx > 14 && Rr) || (ly < 1 && U) || (ly > 14 && D) ? [24, 52, 96]
        : (lx < 3 && L) || (lx > 12 && Rr) || (ly < 3 && U) || (ly > 12 && D) ? [143, 199, 242]
        : r > .985 ? [170, 212, 245] : PW[r * 3 | 0];
    } else if (tp[ty * N + tx]) {
      c = ly > 10 && !gp(tx, ty + 1) ? [47, 58, 42] : ly < 2 && !gp(tx, ty - 1) ? [120, 134, 104] : PS[r * 4 | 0];
    } else {
      const s = samp(sG, px, py), dm = samp(dG, px, py) + (r - .5) * .08;
      c = dm > .64 ? PD[r * 4 | 0] : PG[clamp(Math.floor((.5 + (r - .5) * .8 - (s - .5) * 1.3) * 5), 0, 4)];
    }
    const i = (py * WS + px) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  b.putImageData(img, 0, 0);
  // petites fleurs / étincelles en croix
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const h = hash(x * 3 + 1, y * 5 + 2); if (tw[y * N + x] || tp[y * N + x] || h > .09) continue;
    const cx = x * T + 3 + (h * 997 % 10 | 0), cy = y * T + 3 + (h * 313 % 10 | 0), col = ['#e8f4e0', '#ffb3cf', '#ffe27a'][h * 3333 % 3 | 0];
    R(b, col, cx, cy - 1, 1, 1); R(b, col, cx, cy + 1, 1, 1); R(b, col, cx - 1, cy, 1, 1); R(b, col, cx + 1, cy, 1, 1);
  }
});

// ---------- Sprites du décor ----------
const blob = (k, cx, cy, rx, ry, f) => { for (let y = 0; y <= cy * 2; y++) for (let x = 0; x <= cx * 2; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d <= 1) R(k, f(x, y, d), x, y, 1, 1); } };
const makeTree = pal => outline(mk(28, 34, k => {
  R(k, '#5e3b1e', 11, 22, 6, 12); R(k, '#3f2812', 15, 22, 2, 12); R(k, '#3f2812', 9, 32, 10, 2);
  blob(k, 14, 13, 13, 12, (x, y) => { const t = (14 - x) * .5 + (13 - y) * .8, n = hash(x * 3, y * 5); return t > 6 ? pal[0] : t > 1 ? (n > .85 ? pal[0] : pal[1]) : t > -4 ? (n > .85 ? pal[1] : pal[2]) : pal[3]; });
}), '#10281a');
const treeS = [makeTree(['#6cc45a', '#4ea840', '#38893a', '#276b2c']), makeTree(['#8ccf5a', '#6cb04a', '#4f9640', '#357a36'])];
const rockS = outline(mk(18, 12, k => {
  blob(k, 9, 5, 8, 5, (x, y) => { const t = (9 - x) * .4 + (5 - y); return t > 2.5 ? '#c3cad3' : t > .5 ? '#9aa3ad' : t > -2 ? '#7b838d' : '#5b626b'; });
}));
const bushS = [0, 1].map(e => outline(mk(16, 12, k => {
  blob(k, 8, 6, 7, 5, (x, y) => { const t = (8 - x) * .4 + (6 - y); return t > 1.5 ? '#4aa040' : t > -1.5 ? '#2f7d34' : '#215f28'; });
  if (!e) [[4, 4], [9, 3], [7, 6], [11, 6], [5, 8]].forEach(p => R(k, '#9a5ce0', p[0], p[1], 2, 2));
}), '#10281a'));
const tuftS = mk(16, 16, k => {   // touffe d'herbe haute
  [[1, 9], [3, 12], [5, 8], [7, 14], [9, 10], [11, 13], [13, 9]].forEach(a => { R(k, '#1d4a22', a[0], 15 - a[1], 2, a[1]); R(k, '#2f7a2f', a[0], 17 - a[1], 1, a[1] - 2); R(k, '#5cc050', a[0], 15 - a[1], 1, 2); });
});
const dartS = mk(6, 2, k => { R(k, '#cfd8dc', 0, 0, 4, 1); R(k, '#4fc3f7', 4, 0, 2, 2); });
const ICON = {
  club: mk(8, 8, k => { R(k, '#6b4423', 3, 3, 2, 5); R(k, '#a87a42', 2, 0, 4, 4); R(k, '#c99a5a', 2, 0, 2, 2); }),
  dart: mk(8, 8, k => { R(k, '#cfd8dc', 0, 4, 5, 1); R(k, '#4fc3f7', 5, 3, 3, 3); R(k, '#fff', 0, 3, 1, 3); }),
  berry: mk(8, 8, k => { R(k, '#8a4fd0', 1, 3, 3, 3); R(k, '#a870e8', 4, 4, 3, 3); R(k, '#3f9a3a', 3, 1, 2, 2); }),
  meat: mk(8, 8, k => { R(k, '#c8443f', 1, 2, 6, 5); R(k, '#f08a80', 2, 3, 2, 2); R(k, '#eee', 6, 5, 2, 2); }),
  wood: mk(8, 8, k => { R(k, '#8a5a2b', 0, 1, 8, 3); R(k, '#6b4423', 0, 4, 8, 3); R(k, '#c9a56a', 0, 1, 1, 3); R(k, '#c9a56a', 0, 4, 1, 3); }),
  stone: mk(8, 8, k => { R(k, '#7b838d', 1, 2, 6, 5); R(k, '#a9b1ba', 2, 2, 3, 2); R(k, '#555b63', 1, 6, 6, 1); }),
};

// ---------- Dinosaures ----------
// ---- rendu des dinos : rampes de couleurs "pixel art" (ombres bleutées, lumières chaudes) + ombrage à 5 tons avec tramage ----
const hsl = h => { const [r, g, b] = rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  return [d ? (mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 : 0, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l]; };
const hex = (h, s, l) => { s = clamp(s, 0, 1); l = clamp(l, 0, 1); const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
const toward = (h, t, m) => { const d = ((t - h + 540) % 360) - 180; return (h + Math.sign(d) * Math.min(Math.abs(d), m) + 360) % 360; };
const ramp = (c, lift = 0, sat = 1) => { const [h, s0, l0] = hsl(c), s = s0 * sat, l = clamp(l0 + lift, 0, .9);
  return [hex(toward(h, 250, 30), s * .95, l * .36), hex(toward(h, 250, 16), s, l * .64), hex(h, s, l), hex(toward(h, 60, 14), s * .9, Math.min(.92, l * 1.2 + .05)), hex(toward(h, 60, 24), s * .65, Math.min(.96, l * 1.42 + .1))]; };
const mkp = c => { const t = ramp(c), bt = ramp(c, .1, .8); return { t, bt, dk: t[0], lo: t[1], mid: t[2], hi: t[3], bel: bt[2] }; };
const BAYER = [0, .5, .75, .25];
// ellipse volumique : normale de sphère + lumière en haut à gauche, tramage, ligne sombre de séparation entre les parties du corps
const ell = (k, cx, cy, rx, ry, p, bel) => {
  const W = k.canvas.width, Hh = k.canvas.height, o = k.__o || (k.__o = new Uint8Array(W * Hh)), T = p.t || [p.dk, p.lo, p.mid, p.hi, p.hi], BT = p.bt || T;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    if (x < 0 || y < 0 || x >= W || y >= Hh) continue;
    const nx = (x - cx) / rx, ny = (y - cy) / ry, d = nx * nx + ny * ny; if (d > 1) continue;
    const v = (-nx * .45 - ny * .65 + Math.sqrt(1 - d) * .6) * .5 + .28 + (BAYER[(x & 1) + (y & 1) * 2] - .375) * .12;
    let col = (bel && ny > .2 ? BT : T)[v > .78 ? 4 : v > .66 ? 3 : v > .38 ? 2 : v > .2 ? 1 : 0];
    if (d > .72 && o[y * W + x]) col = T[0];
    R(k, col, x, y, 1, 1); o[y * W + x] = 1;
  }
};
const atop = (k, fn) => { k.globalCompositeOperation = 'source-atop'; fn(); k.globalCompositeOperation = 'source-over'; };   // dessine seulement sur le corps (rayures, taches)
const eye = (k, x, y) => { R(k, '#fff3b0', x, y, 2, 2); R(k, '#111', x + 1, y, 1, 2); };
const claws = (k, x, y, n) => { for (let i = 0; i < n; i++) R(k, '#f1ead2', x + i * 2, y, 1, 1); };
// finition pixel art : lumière sur le haut du corps + grain de peau
function polish(c, sd) {
  const k = c.getContext('2d'), w = c.width, h = c.height, im = k.getImageData(0, 0, w, h), d = im.data, o = d.slice(), a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && o[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (!o[i + 3]) continue;
    let m = a(x, y - 1) ? 0 : 16;
    for (let ch = 0; ch < 3; ch++) d[i + ch] = clamp(o[i + ch] + m, 0, 255);
  }
  k.putImageData(im, 0, 0); return c;
}
// grand carnivore bipède (T-Rex, Carnotaure, Giganotosaure) : même dessin à des échelles différentes
function thero(k, p, f, u, ho) {
  const o = f ? 1 : -1, E = (cx, cy, rx, ry, b) => ell(k, cx * u, cy * u, rx * u, ry * u, p, b), Q = (c, x, y, w, h) => R(k, c, Math.round(x * u), Math.round(y * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u)));
  E(4, 17, 5, 2.6); E(11, 16, 6, 4.5);
  [[19, o], [25, -o]].forEach(l => { E(l[0], 22, 5, 5); Q(p.lo, l[0] + l[1] - 2, 25, 4, 6); Q(p.dk, l[0] + l[1] - 4, 31, 8, 2); Q('#f1ead2', l[0] + l[1] + 2, 31, 1, 1); Q('#f1ead2', l[0] + l[1] + 4, 31, 1, 1); });
  E(22, 16, 10, 7.5, true); atop(k, () => [13, 16, 19, 22, 25].forEach(x => { Q(p.lo, x, 9, 1, 5); Q(p.dk, x, 9, 1, 2); }));
  E(30, 10, 4, 6); E(36, 8, 6, 4.5); Q(p.mid, 38, 7, 8, 4); Q('#1a1210', 38, 11, 8, 1); Q(p.lo, 37, 12, 8, 2);
  for (let i = 0; i < 4; i++) { Q('#fff', 39 + i * 2, 11, 1, 1); Q('#fff', 40 + i * 2, 12, 1, 1); }
  Q('#fff3b0', 38, 5, 2, 2); Q('#111', 39, 5, 1, 2); Q(p.dk, 37, 4, 5, 1); Q(p.dk, 44, 7, 1, 1);
  Q(p.lo, 30, 16, 3, 2); Q('#f1ead2', 33, 16, 1, 1); Q('#f1ead2', 33, 17, 1, 1);
  if (ho) { Q('#f1ead2', 36, 1, 1, 3); Q('#f1ead2', 40, 1, 1, 3); }
}
const SP = {
  dodo: { n: 'Dodo', c: '#b8935a', hp: 20, tor: 30, sp: 35, dmg: 2, s: .8, aggr: 0, diet: 'b', w: 3, W: 20, H: 19, draw(k, p, f) {
    const o = f ? 1 : -1;
    R(k, '#d89a3a', 7 + o, 15, 1, 3); R(k, '#d89a3a', 10 - o, 15, 1, 3); R(k, '#b87a20', 6 + o, 18, 3, 1); R(k, '#b87a20', 9 - o, 18, 3, 1);
    ell(k, 3, 9, 2, 2.5, { hi: p.mid, mid: p.lo, lo: p.dk, dk: p.dk }); R(k, p.dk, 1, 6, 2, 2);
    ell(k, 9, 10, 6, 5.5, p, true); ell(k, 8, 10, 3, 2.5, { hi: p.mid, mid: p.lo, lo: p.dk, dk: p.dk });
    ell(k, 14, 5, 3, 3, p); R(k, '#e8b840', 16, 4, 4, 2); R(k, '#c08020', 18, 6, 2, 1); R(k, '#fff3b0', 14, 3, 1, 1); R(k, '#111', 15, 3, 1, 1);
  } },
  raptor: { n: 'Raptor', c: '#4f9f45', hp: 30, tor: 40, sp: 55, dmg: 6, s: 1, aggr: 1, diet: 'm', w: 3, W: 30, H: 20, draw(k, p, f) {
    const o = f ? 1 : -1;
    ell(k, 6, 9, 6, 2.2, p); ell(k, 2, 8, 3, 1.3, p);
    [[12, o], [17, -o]].forEach(l => { ell(k, l[0], 13, 3, 3, p); R(k, p.lo, l[0] + l[1] - 1, 15, 2, 3); R(k, p.dk, l[0] + l[1] - 2, 18, 4, 1); claws(k, l[0] + l[1] + 2, 18, 1); });
    ell(k, 15, 10, 7, 4.5, p, true); atop(k, () => [9, 12, 15].forEach(x => { R(k, p.lo, x, 6, 1, 5); R(k, p.dk, x, 6, 1, 2); }));
    ell(k, 21, 6, 3, 4, p); ell(k, 24, 4, 4, 3, p); R(k, p.mid, 26, 4, 4, 3); R(k, p.lo, 25, 7, 4, 1);
    R(k, '#fff', 26, 7, 1, 1); R(k, '#fff', 28, 7, 1, 1); eye(k, 24, 3); R(k, p.lo, 20, 11, 2, 1); claws(k, 22, 11, 1);
  } },
  trike: { n: 'Tricératops', c: '#6f8fb8', hp: 70, tor: 70, sp: 30, dmg: 10, s: 1.4, aggr: 0, diet: 'b', w: 2, W: 40, H: 24, draw(k, p, f) {
    const o = f ? 1 : -1, fr = { hi: '#e0805a', mid: '#c0583a', lo: '#8a3a2a', dk: '#5a2418' };
    ell(k, 4, 14, 4, 2.4, p);
    [[9, o], [14, -o], [25, -o], [30, o]].forEach((l, i) => { R(k, i % 2 ? p.lo : p.dk, l[0] + l[1] - 1, 17, 3, 6); R(k, p.dk, l[0] + l[1] - 2, 22, 5, 2); });
    ell(k, 18, 13, 11, 6.5, p, true); [11, 15, 19, 23].forEach(x => R(k, p.lo, x, 8, 1, 3));
    ell(k, 29, 9, 5.5, 6, fr); [[26, 6], [29, 4], [32, 6]].forEach(a => R(k, '#f1ead2', a[0], a[1], 1, 1));
    ell(k, 33, 13, 4, 3.5, p); R(k, '#e8dfc0', 36, 14, 3, 3); R(k, '#b8ad88', 38, 16, 1, 1);
    R(k, '#f4eed0', 34, 7, 1, 5); R(k, '#f4eed0', 36, 8, 1, 4); R(k, '#f4eed0', 37, 11, 2, 2); eye(k, 33, 12);
  } },
  rex: { n: 'T-Rex', c: '#b5473a', hp: 160, tor: 100, sp: 40, dmg: 18, s: 2.2, aggr: 1, diet: 'm', w: 1, W: 56, H: 40, draw(k, p, f) { thero(k, p, f, 1.15); } },
  carno: { n: 'Carnotaure', c: '#c0702f', hp: 80, tor: 70, sp: 50, dmg: 12, s: 1.5, aggr: 1, diet: 'm', w: 2, W: 41, H: 29, draw(k, p, f) { thero(k, p, f, .85, true); } },
  giga: { n: 'Giganotosaure', c: '#8d8a68', hp: 260, tor: 160, sp: 38, dmg: 28, s: 3, aggr: 1, diet: 'm', w: 1, W: 73, H: 52, draw(k, p, f) { thero(k, p, f, 1.5); } },
  compy: { n: 'Compy', c: '#5fb8a0', hp: 10, tor: 15, sp: 70, dmg: 1, s: .5, aggr: 1, diet: 'm', w: 3, W: 14, H: 10, draw(k, p, f) {
    const o = f ? 1 : -1;
    R(k, p.dk, 5 + o, 7, 1, 2); R(k, p.dk, 8 - o, 7, 1, 2); ell(k, 2, 5, 2, 1, p); ell(k, 6, 5, 3.5, 2.5, p, true); ell(k, 10, 3, 2, 1.8, p);
    R(k, p.mid, 11, 3, 2, 1); R(k, '#111', 10, 2, 1, 1); R(k, '#ffd54a', 9, 2, 1, 1);
  } },
  parasaur: { n: 'Parasaure', c: '#6aa05a', hp: 50, tor: 60, sp: 45, dmg: 4, s: 1.2, aggr: 0, diet: 'b', w: 3, W: 38, H: 32, draw(k, p, f) {
    const o = f ? 1 : -1, cr = '#e0883a';
    ell(k, 5, 18, 6, 3, p); ell(k, 1, 17, 3, 1.6, p);
    [[13, o], [18, -o]].forEach(l => { ell(k, l[0], 22, 3, 4, p); R(k, p.lo, l[0] + l[1] - 1, 25, 3, 5); R(k, p.dk, l[0] + l[1] - 2, 30, 5, 1); });
    ell(k, 15, 18, 8, 5, p, true); [10, 13, 16, 19].forEach(x => R(k, p.dk, x, 14, 1, 2));
    ell(k, 23, 12, 3, 6, p); ell(k, 27, 7, 4, 3, p); R(k, p.mid, 29, 7, 5, 3); R(k, p.lo, 29, 10, 5, 1);
    R(k, cr, 22, 3, 6, 2); R(k, cr, 19, 4, 4, 2); R(k, cr, 17, 5, 3, 2); R(k, sh(cr, -40), 17, 6, 2, 1);
    R(k, '#fff3b0', 27, 6, 2, 2); R(k, '#111', 28, 6, 1, 2); R(k, p.lo, 21, 19, 2, 2);
  } },
  stego: { n: 'Stégosaure', c: '#7a9a5a', hp: 90, tor: 80, sp: 30, dmg: 12, s: 1.5, aggr: 0, diet: 'b', w: 2, W: 46, H: 28, draw(k, p, f) {
    const o = f ? 1 : -1, pl = '#e0883a';
    [[9, o], [14, -o], [28, -o], [33, o]].forEach((l, i) => { R(k, i % 2 ? p.lo : p.dk, l[0] + l[1] - 1, 19, 3, 6); R(k, p.dk, l[0] + l[1] - 2, 24, 5, 2); });
    ell(k, 8, 17, 7, 3.5, p); [[1, 12], [3, 14], [5, 12]].forEach(a => R(k, '#f1ead2', a[0], a[1], 1, 4));
    ell(k, 22, 15, 13, 7, p, true);
    for (let i = 0; i < 7; i++) { const h = 3 + Math.min(i, 6 - i) * 2; R(k, pl, 11 + i * 3, 9 - h, 2, h + 1); R(k, sh(pl, 50), 11 + i * 3, 9 - h, 1, h); }
    ell(k, 36, 18, 3, 2.5, p); R(k, p.mid, 38, 19, 4, 2); R(k, '#fff3b0', 37, 17, 1, 1); R(k, '#111', 38, 17, 1, 1);
  } },
  ankylo: { n: 'Ankylosaure', c: '#8a7a5a', hp: 110, tor: 90, sp: 25, dmg: 14, s: 1.5, aggr: 0, diet: 'b', w: 2, W: 44, H: 22, draw(k, p, f) {
    const o = f ? 1 : -1, bn = '#d8d0b0';
    [[10, o], [16, -o], [26, -o], [31, o]].forEach((l, i) => { R(k, i % 2 ? p.lo : p.dk, l[0] + l[1] - 1, 14, 4, 6); R(k, p.dk, l[0] + l[1] - 2, 19, 6, 2); });
    ell(k, 6, 13, 5, 2, p); ell(k, 3, 13, 3.5, 3.4, { hi: '#b8a888', mid: '#8a7a60', lo: '#5e5240', dk: '#3a3228' });
    ell(k, 20, 11, 13, 6.5, p, true); for (let x = 9; x <= 30; x += 3) { R(k, p.dk, x, 6 + (x % 2), 2, 1); R(k, p.hi, x + 1, 8, 1, 1); }
    for (let x = 8; x <= 32; x += 4) R(k, bn, x, 3 + (x % 3), 1, 2);
    ell(k, 35, 14, 4, 3.5, p); R(k, bn, 32, 10, 2, 2); R(k, bn, 36, 10, 2, 2); R(k, '#fff3b0', 36, 13, 1, 1); R(k, '#111', 37, 13, 1, 1);
  } },
  therizino: { n: 'Thérizinosaure', c: '#9a6a8a', hp: 150, tor: 110, sp: 30, dmg: 20, s: 2, aggr: 0, diet: 'b', w: 1, W: 42, H: 42, draw(k, p, f) {
    const o = f ? 1 : -1, bn = '#f1ead2';
    ell(k, 6, 24, 6, 3, p);
    [[14, o], [20, -o]].forEach(l => { ell(k, l[0], 28, 4, 5, p); R(k, p.lo, l[0] + l[1] - 1, 31, 3, 8); R(k, p.dk, l[0] + l[1] - 3, 39, 7, 2); });
    ell(k, 17, 22, 8, 7, p, true); for (let x = 10; x < 22; x++) R(k, p.hi, x, 15 + (x % 2), 1, 2);
    ell(k, 24, 12, 3, 8, p); ell(k, 28, 5, 3, 2.5, p); R(k, '#e8b840', 30, 5, 3, 2); R(k, '#fff3b0', 28, 4, 1, 1); R(k, '#111', 29, 4, 1, 1);
    R(k, p.lo, 22, 19, 5, 2); for (let i = 0; i < 3; i++) for (let j = 0; j < 9; j++) R(k, bn, 26 + j, 19 + i * 2 + (j >> 2), 1, 1);
  } },
  diplo: { n: 'Diplodocus', c: '#a89060', hp: 300, tor: 200, sp: 20, dmg: 10, s: 3.4, aggr: 0, diet: 'b', w: 1, W: 76, H: 51, draw(k, p, f) {
    const o = f ? 1 : -1;
    [[22, o], [28, -o], [41, -o], [47, o]].forEach((l, i) => { R(k, i % 2 ? p.lo : p.dk, l[0] + l[1] - 2, 36, 6, 12); R(k, p.dk, l[0] + l[1] - 3, 47, 8, 3); });
    ell(k, 15, 34, 9, 5, p); ell(k, 6, 36, 7, 3, p); ell(k, 1, 38, 3, 1.4, p); ell(k, 35, 30, 16, 9, p, true);
    for (let i = 0; i < 9; i++) ell(k, 48 + i * 2.2, 25 - i * 2.1, 3.3 - i * .13, 3.3 - i * .13, p);
    ell(k, 69, 6, 4, 3, p); R(k, p.mid, 72, 6, 3, 3); R(k, '#fff3b0', 68, 4, 2, 2); R(k, '#111', 69, 4, 1, 2); R(k, p.lo, 32, 24, 9, 2);
  } },
};
const POOL = []; for (const k in SP) for (let i = 0; i < SP[k].w; i++) POOL.push(k);
for (const k in SP) { const s = SP[k], p = mkp(s.c); s.fr = [0, 1].map(f => outline(polish(mk(s.W, s.H, c => s.draw(c, p, f)), 0), sh(p.dk, -30))); }

// ---------- Monde ----------
const trees = [], rocks = [], bushes = [], dinos = [], shots = [], toasts = [], P = {};
const okSpot = (x, y) => Math.hypot(x - WS / 2, y - WS / 2) > 80 && !isW(x, y);
for (let i = 0; i < 300; i++) { const x = rnd() * WS, y = rnd() * WS; if (okSpot(x, y)) trees.push({ x, y, hp: 3 }); }
for (let i = 0; i < 110; i++) { const x = rnd() * WS, y = rnd() * WS; if (okSpot(x, y)) rocks.push({ x, y, hp: 3 }); }
for (let i = 0; i < 80; i++) { const x = rnd() * WS, y = rnd() * WS; if (!isW(x, y)) bushes.push({ x, y, t: 0 }); }
const tufts = []; for (let i = 0; i < 6000 && tufts.length < 1000; i++) { const x = rnd() * WS, y = rnd() * WS; if (fbm(x * .012 + 70, y * .012 + 15) > .57 && okSpot(x, y)) tufts.push({ x, y }); }
const say = t => toasts.push({ t, life: 2.8 });
const blocked = (x, y) => isW(x, y) || trees.some(t => Math.abs(t.x - x) < 7 && Math.abs(t.y - y) < 6) || rocks.some(r => Math.abs(r.x - x) < 8 && Math.abs(r.y - y) < 5);

function spawnWild() {
  const s = SP[POOL[rnd() * POOL.length | 0]], lvl = 1 + (rnd() * 9 | 0), m = 1 + .1 * (lvl - 1);
  let x, y; do { x = rnd() * WS; y = rnd() * WS; } while (Math.hypot(x - P.x, y - P.y) < 200 || isW(x, y));
  dinos.push({ s, x, y, lvl, hp: s.hp * m, max: s.hp * m, tor: 0, torMax: s.tor * m, prog: 0, ko: false, tame: false,
    vx: 0, vy: 0, wt: 0, face: 1, cd: 0, aggro: false, flash: 0, anim: 0, mv: false });
}

// ---------- Entrées ----------
const K = {}; let mx = W / 2, my = H / 2, state = 'menu', clock = .6, last = 0, paused = false;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); K[k] = 1;
  if (state !== 'play') return;
  if (k === 'p' || k === 'escape') paused = !paused;
  if (paused) return;
  if (k === 'c') craft(); if (k === 'e') useE(); if (k === 'r') narco();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { K[e.key.toLowerCase()] = 0; });
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) * W / r.width; my = (e.clientY - r.top) * H / r.height; });
cv.addEventListener('mousedown', e => {
  if (state !== 'play') return;
  const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) * W / r.width; my = (e.clientY - r.top) * H / r.height;
  if (mx > W - 36 && my < 36) { paused = !paused; return; }
  if (!paused) throwDart();
});

// ---------- Actions ----------
const near = (arr, r) => arr.filter(o => dist(o, P) < r).sort((a, b) => dist(a, P) - dist(b, P))[0];
function gain(x) { P.xp += x; while (P.xp >= P.lv * 50) { P.xp -= P.lv * 50; P.lv++; P.max += 10; P.hp = P.max; say('Niveau ' + P.lv + ' !'); } }
function craft() {
  if (P.wood >= 1 && P.stone >= 1 && P.berry >= 1) { P.wood--; P.stone--; P.berry--; P.darts += 3; say('+3 fléchettes tranquillisantes'); }
  else say('Fléchettes : 1 bois + 1 pierre + 1 baie');
}
function throwDart() {
  if (P.darts <= 0) return say('Plus de fléchettes (C pour en fabriquer)');
  P.darts--; const a = Math.atan2(cam.y + my - P.y, cam.x + mx - P.x);
  shots.push({ x: P.x, y: P.y - 8, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, a, life: .7 });
}
function addTor(d, v) {
  d.tor = Math.min(d.torMax, d.tor + v);
  if (d.tor >= d.torMax && !d.ko) { d.ko = true; d.prog = 0; d.aggro = false; say(d.s.n + ' endormi ! Nourris-le (E)'); }
}
function hit(d, dmg, tor) {
  if (d.tame) return; d.hp -= dmg; d.flash = .15;
  if (d.ko) d.prog = Math.max(0, d.prog - 8); else d.aggro = true;   // frapper un dino endormi ruine l'apprivoisement
  addTor(d, tor); if (d.hp <= 0) { dinos.splice(dinos.indexOf(d), 1); P.meat += 2; gain(10 + d.lvl * 3); say(d.s.n + ' tué (+2 viande)'); spawnWild(); }
}
function act() {
  if (P.cd > 0) return; P.cd = .35;
  const d = near(dinos.filter(d => !d.tame), 28); if (d) return hit(d, 5 * P.dm * (1 + .06 * (P.lv - 1)), 12);
  const t = near(trees, 24); if (t) { t.hp--; P.wood++; if (t.hp <= 0) trees.splice(trees.indexOf(t), 1); return; }
  const r = near(rocks, 24); if (r) { r.hp--; P.stone++; if (r.hp <= 0) rocks.splice(rocks.indexOf(r), 1); }
}
function useE() {
  const d = near(dinos.filter(d => d.ko && !d.tame), 30);
  if (d) {
    const k = d.s.diet === 'm' ? 'meat' : 'berry';
    if (P[k] <= 0) return say(d.s.diet === 'm' ? 'Il lui faut de la viande' : 'Il lui faut des baies');
    P[k]--; d.prog += Math.max(8, 28 / (1 + .1 * (d.lvl - 1)));
    if (d.prog >= 100) { d.tame = true; d.ko = false; d.hp = d.max; d.tor = 0; gain(30 + d.lvl * 8); say(d.s.n + ' apprivoisé !'); }
    return;
  }
  const b = bushes.find(b => b.t <= 0 && dist(b, P) < 22);
  if (b) { b.t = 20; P.berry += 2; return; }
  say('Rien à faire ici');
}
function narco() {
  const d = near(dinos.filter(d => d.ko && !d.tame), 30);
  if (d && P.berry > 0) { P.berry--; addTor(d, 25); say('Baie narcotique : il dort plus longtemps'); }
}

// ---------- Mise à jour ----------
const cam = { x: 0, y: 0 };
function update(dt) {
  clock += dt * .035;
  const dx = (K.d || K.arrowright ? 1 : 0) - (K.a || K.q || K.arrowleft ? 1 : 0), dy = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.z || K.arrowup ? 1 : 0);
  const l = Math.hypot(dx, dy) || 1, sp = P.sp * (P.hp <= 30 ? .6 : 1) * dt;
  P.mv = !!(dx || dy);
  if (P.mv) { P.anim += dt * 8; if (dx) P.face = dx; if (dy) P.dir = dy < 0 ? 'u' : 'd'; }
  const nx = P.x + dx / l * sp, ny = P.y + dy / l * sp;
  if (!blocked(nx, P.y)) P.x = clamp(nx, 8, WS - 8);
  if (!blocked(P.x, ny)) P.y = clamp(ny, 8, WS - 8);
  P.cd -= dt; P.hurt -= dt; if (K[' ']) act();
  P.hp = Math.min(P.max, P.hp + dt * 1.2);
  if (P.hp <= 0) { P.x = P.y = WS / 2; P.hp = P.max; say('Tu es tombé… retour au camp'); }
  bushes.forEach(b => b.t -= dt);

  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    const d = dinos.find(d => !d.tame && Math.hypot(d.x - s.x, d.y - 6 * d.s.s - s.y) < 8 * d.s.s + 3);
    if (d) { shots.splice(i, 1); hit(d, 1, 30); } else if (s.life <= 0 || blocked(s.x, s.y + 8)) shots.splice(i, 1);
  }

  for (const d of dinos.slice()) {
    d.cd -= dt; d.flash -= dt; d.wt -= dt; d.mv = false;
    if (d.ko) { d.tor -= 2 * dt; if (d.tor <= 0) { d.ko = false; d.tor = 0; d.prog = 0; d.aggro = true; say(d.s.n + ' se réveille !'); } continue; }
    if (!d.tame) d.tor = Math.max(0, d.tor - 3 * dt);
    let tx = null, ty = null, spd = d.s.sp;
    if (d.tame) {
      const foe = dinos.find(o => !o.tame && dist(o, d) < 90);
      if (foe) { tx = foe.x; ty = foe.y; if (dist(foe, d) < 12 * d.s.s && d.cd <= 0) { d.cd = .9; hit(foe, d.s.dmg, 6); } }
      else if (dist(d, P) > 36) { tx = P.x + (d.x < P.x ? -20 : 20); ty = P.y; spd *= 1.3; }
    } else {
      const pd = dist(d, P);
      if (d.aggro || (d.s.aggr && pd < 100)) {
        tx = P.x; ty = P.y; if (pd > 220) d.aggro = false;
        if (pd < 10 * d.s.s + 6 && d.cd <= 0) { d.cd = 1; P.hp -= d.s.dmg; P.hurt = .2; }
      } else {
        if (d.wt <= 0) { d.wt = 1 + Math.random() * 3; const a = Math.random() * 6.28, m = Math.random() < .4 ? 0 : 1; d.vx = Math.cos(a) * m; d.vy = Math.sin(a) * m; }
        spd *= .4; tx = d.x + d.vx * 10; ty = d.y + d.vy * 10;
      }
    }
    if (tx !== null && Math.hypot(tx - d.x, ty - d.y) > 4) {
      const a = Math.atan2(ty - d.y, tx - d.x), vx = Math.cos(a), vy = Math.sin(a), nx = d.x + vx * spd * dt, ny = d.y + vy * spd * dt;
      if (!blocked(nx, ny)) { d.x = clamp(nx, 8, WS - 8); d.y = clamp(ny, 8, WS - 8); d.mv = true; d.anim += dt * 7; }
      if (Math.abs(vx) > .2) d.face = vx > 0 ? 1 : -1;
    }
    if (d.tame && d.hp <= 0) dinos.splice(dinos.indexOf(d), 1);
  }
  while (dinos.filter(d => !d.tame).length < 45) spawnWild();
  cam.x = clamp(P.x - W / 2, 0, WS - W); cam.y = clamp(P.y - H / 2, 0, WS - H);
  for (let i = toasts.length - 1; i >= 0; i--) if ((toasts[i].life -= dt) <= 0) toasts.splice(i, 1);
}

// ---------- Rendu ----------
const FONT = '"Press Start 2P", "Courier New", monospace';
const hud = $('hud'), g2 = hud.getContext('2d');
function hudBegin() {   // le texte est dessiné à la vraie résolution de l'écran : net et lisible
  const r = cv.getBoundingClientRect(), dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, w = Math.max(1, Math.round(r.width * dpr));
  if (hud.width !== w) { hud.width = w; hud.height = Math.round(w * H / W); }
  g2.setTransform(hud.width / W, 0, 0, hud.width / W, 0, 0); g2.clearRect(0, 0, W, H);
}
const text = (s, x, y, col = '#fff', sz = 8) => {
  g2.font = sz + 'px ' + FONT; g2.globalAlpha = g.globalAlpha; g2.lineJoin = 'round'; g2.lineWidth = Math.max(1.6, sz * .34);
  g2.strokeStyle = '#0a0d18'; g2.strokeText(s, x, y); g2.fillStyle = col; g2.fillText(s, x, y); g2.globalAlpha = 1;
};
const textC = (s, x, y, col, sz = 8) => { g2.font = sz + 'px ' + FONT; text(s, x - g2.measureText(s).width / 2, y, col, sz); };
const rb = (x, y, w, h, c) => { if (w <= 2) return; g.fillStyle = c; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2); };
const shadow = (x, y, w) => { g.fillStyle = 'rgba(0,0,0,.28)'; const a = w / 2 | 0; g.fillRect(x - a + 2 | 0, y - 2 | 0, w - 4, 1); g.fillRect(x - a | 0, y - 1 | 0, w, 2); g.fillRect(x - a + 2 | 0, y + 1 | 0, w - 4, 1); };
const bar = (x, y, w, v, col) => { R(g, '#000', x - 1, y - 1, w + 2, 4); R(g, col, x, y, w * clamp(v, 0, 1), 2); };
const sprite = (img, x, y, face, sc = 1, alpha = 1) => {
  g.save(); g.globalAlpha = alpha; g.translate(x | 0, y | 0); g.scale(face, 1);
  g.drawImage(img, -Math.round(img.width * sc / 2), -Math.round(img.height * sc), Math.round(img.width * sc), Math.round(img.height * sc)); g.restore();
};

function draw() {
  hudBegin();
  const cx = cam.x | 0, cy = cam.y | 0;
  g.drawImage(bg, cx, cy, W, H, 0, 0, W, H);
  const vis = o => o.x > cx - 40 && o.x < cx + W + 40 && o.y > cy - 20 && o.y < cy + H + 60, items = [];
  const focus = near(dinos.filter(d => !d.tame), 80);
  tufts.filter(vis).forEach(t => items.push([t.y, () => g.drawImage(tuftS, t.x - 8 - cx | 0, t.y - 15 - cy | 0)]));
  trees.filter(vis).forEach(t => items.push([t.y, () => { shadow(t.x - cx, t.y - cy, 18); g.drawImage(treeS[(t.x | 0) & 1], t.x - 15 - cx | 0, t.y - 35 - cy | 0); }]));
  rocks.filter(vis).forEach(r => items.push([r.y, () => { shadow(r.x - cx, r.y - cy, 16); g.drawImage(rockS, r.x - 10 - cx | 0, r.y - 12 - cy | 0); }]));
  bushes.filter(vis).forEach(b => items.push([b.y, () => { shadow(b.x - cx, b.y - cy, 14); g.drawImage(bushS[b.t > 0 ? 1 : 0], b.x - 9 - cx | 0, b.y - 12 - cy | 0); }]));
  dinos.filter(vis).forEach(d => items.push([d.y, () => {
    const sc = 1, x = d.x - cx, y = d.y - cy, im = d.s.fr[d.mv ? Math.floor(d.anim) & 1 : 0], h = im.height * sc;
    shadow(x, y, im.width * sc * .8);
    if (d.ko) { g.save(); g.translate(x | 0, y | 0); g.scale(d.face, -1); g.globalAlpha = .85; g.drawImage(im, -Math.round(im.width * sc / 2), 0, Math.round(im.width * sc), Math.round(h)); g.restore(); text('Zz', x - 5, y - h - 2, '#b9a0ff'); }
    else sprite(im, x, y - (d.mv && (Math.floor(d.anim) & 1) ? 1 : 0), d.face, sc, d.flash > 0 ? .5 : 1);
    if (d.tame) text('♥', x - 3, y - h - 6, '#ff6b9a');
    if (d === focus || d.hp < d.max) { bar(x - 10, y - h - 14, 20, d.hp / d.max, '#e04848'); bar(x - 10, y - h - 10, 20, d.tor / d.torMax, '#a070ff'); }
    if (d === focus) { textC(d.s.n + ' Niv.' + d.lvl, x, y - h - 18, '#fff', 7); if (d.ko) bar(x - 10, y - h - 6, 20, d.prog / 100, '#5ad45a'); }
  }]));
  items.push([P.y, () => {
    const im = P.spr[P.dir][P.mv ? Math.floor(P.anim) & 1 : 0], x = P.x - cx, y = P.y - cy;
    shadow(x, y, 10); sprite(im, x, y + 1, P.face, 1, P.hurt > 0 ? .5 : 1);
  }]);
  items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
  shots.forEach(s => { g.save(); g.translate(s.x - cx | 0, s.y - cy | 0); g.rotate(s.a); g.drawImage(dartS, -3, -1); g.restore(); });

  // cycle jour / nuit (le temps passe comme dans ARK)
  const night = clamp(-Math.sin(clock) * .9, 0, .55); if (night > 0) { g.fillStyle = `rgba(8,16,60,${night})`; g.fillRect(0, 0, W, H); }

  // ATH (style PokéSurvivor)
  const hh = (6 + clock / 6.283 * 24) % 24 | 0, mm = (clock / 6.283 * 24 * 60) % 60 | 0, day = Math.floor(clock / 6.283) + 1, hpw = Math.round(120 * clamp(P.hp / P.max, 0, 1));
  text(C.name, 10, 14); text('Niv. ' + P.lv, 10, 30, '#ffd54a', 7);
  rb(61, 18, 122, 14, '#2a1020'); rb(62, 19, hpw, 12, '#f0606c'); if (hpw > 4) R(g, 'rgba(255,255,255,.28)', 64, 20, hpw - 4, 1);
  textC(`${Math.ceil(P.hp)} / ${P.max}`, 122, 29, '#fff', 7);
  R(g, '#10182a', 62, 34, 120, 3); R(g, '#4fc3f7', 62, 34, 120 * P.xp / (P.lv * 50), 3);
  textC(`${hh}:${String(mm).padStart(2, '0')}`, W / 2, 24, '#fff', 16);
  textC(`JOUR ${day} · ${dinos.filter(d => d.tame).length} APPRIVOISÉS${night > .2 ? ' · NUIT' : ''}`, W / 2, 38, '#a9bcff', 7);
  rb(W - 34, 8, 26, 26, '#e8f0ff'); rb(W - 33, 9, 24, 24, '#12162a'); R(g, '#e8f0ff', W - 26, 15, 4, 12); R(g, '#e8f0ff', W - 19, 15, 4, 12);
  const keys = ['club', 'dart', 'berry', 'meat', 'wood', 'stone'], cnt = ['', P.darts, P.berry, P.meat, P.wood, P.stone], x0 = (W - 159) / 2 | 0;
  textC('Gourdin', x0 + 12, H - 42, '#ffa24d', 7);
  keys.forEach((k, i) => { const x = x0 + i * 27, y = H - 38; rb(x - 1, y - 1, 26, 26, i === 0 ? '#f08a3c' : '#3a4458'); rb(x + 1, y + 1, 22, 22, '#12162a'); g.drawImage(ICON[k], x + 4, y + 5, 16, 16); if (i) text(String(cnt[i]), x + 3, y + 10, '#fff', 7); });
  g.globalAlpha = .85; ['ZQSD bouger', 'Espace frapper', 'Clic tirer', 'E nourrir', 'R baie narco', 'C fabriquer', 'P pause'].forEach((t, k) => text(t, 8, H - 68 + k * 10, '#e9f0e2', 7)); g.globalAlpha = 1;
  toasts.forEach((t, i) => { g.globalAlpha = Math.min(1, t.life); textC(t.t, W / 2, 58 + i * 12, '#fff', 8); g.globalAlpha = 1; });
  g.strokeStyle = '#fff'; g.strokeRect(mx - 3, my - 3, 6, 6);
  if (paused) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, H); textC('PAUSE', W / 2, H / 2, '#fff', 16); }
}

function start() {
  readC(); const B = BUILD[C.build];
  Object.assign(P, { x: WS / 2, y: WS / 2, hp: B.hp, max: B.hp, sp: 80 * B.sp, dm: B.dm, lv: 1, xp: 0, wood: 0, stone: 0, berry: 3, meat: 0, darts: 6, face: 1, dir: 'd', anim: 0, cd: 0, hurt: 0, mv: false,
    spr: { d: [charSprite(C, 'd', 0), charSprite(C, 'd', 1)], u: [charSprite(C, 'u', 0), charSprite(C, 'u', 1)] } });
  dinos.length = 0; for (let i = 0; i < 45; i++) spawnWild();
  $('creator').classList.add('hide'); state = 'play'; last = performance.now();
  say('Frappe un dino pour l\'endormir, puis nourris-le (E)'); requestAnimationFrame(loop);
}
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (!paused) update(dt); draw(); requestAnimationFrame(loop); }
