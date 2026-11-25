// PixelArk – jeu de survie / capture de dinosaures en pixel art (canvas, sans dépendance)
const cv = document.getElementById('c'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const W = 480, H = 270, T = 16, N = 120, WS = N * T;

// ---------- Outils ----------
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ h >> 13, 1274126177); return ((h ^ h >> 16) >>> 0) / 4294967295; };
const noise = (x, y) => Math.sin(x * .11) + Math.cos(y * .13) + Math.sin((x + y) * .07);
const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; };
const R = (k, col, x, y, w, h) => { k.fillStyle = col; k.fillRect(x, y, w, h); };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Sprites pixel art ----------
const bg = mk(WS, WS, b => {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dirt = noise(x, y) > 1.15, h = hash(x, y);
    R(b, dirt ? (h < .5 ? '#7a5a3a' : '#6e5033') : (h < .5 ? '#3f7a35' : '#3a7031'), x * T, y * T, T, T);
    if (h > .9) R(b, dirt ? '#8d6b46' : '#4c8f40', x * T + (h * 997 % 12 | 0), y * T + (h * 313 % 12 | 0), 2, 2);
    if (!dirt && h < .03) R(b, '#fff', x * T + 5, y * T + 5, 2, 2);
  }
});
const treeS = mk(24, 30, k => {
  R(k, '#5a3a1e', 10, 18, 5, 12); R(k, '#3e2814', 13, 18, 2, 12);
  R(k, '#245a24', 1, 12, 22, 5); R(k, '#245a24', 3, 8, 18, 10);
  R(k, '#2f7a2f', 5, 3, 14, 12); R(k, '#3f9a3a', 8, 0, 8, 8); R(k, '#4fb046', 9, 2, 3, 2);
});
const rockS = mk(16, 12, k => {
  R(k, '#555b63', 2, 3, 12, 8); R(k, '#7b838d', 3, 2, 9, 6); R(k, '#a9b1ba', 4, 3, 4, 2); R(k, '#3b4046', 2, 9, 12, 2);
});
const playerS = mk(10, 14, k => {
  R(k, '#e8b98a', 2, 0, 6, 5); R(k, '#4a2c12', 2, 0, 6, 2); R(k, '#2b6cb0', 1, 5, 8, 5);
  R(k, '#e8b98a', 0, 5, 1, 4); R(k, '#e8b98a', 9, 5, 1, 4); R(k, '#333', 2, 10, 2, 4); R(k, '#333', 6, 10, 2, 4);
  R(k, '#000', 3, 3, 1, 1); R(k, '#000', 6, 3, 1, 1);
});
const cageS = mk(8, 8, k => { R(k, '#c9a227', 0, 0, 8, 8); R(k, '#5a3a1e', 1, 1, 6, 6); R(k, '#c9a227', 3, 0, 2, 8); R(k, '#c9a227', 0, 3, 8, 2); });
const DINO = [
  "........xxxx..", ".......xxxxxx.", ".......xwxxxxx", ".......xxxxxx.", "..x....xxxxx..",
  ".xxx..xxxxxx..", "xxxxxxxxxxxx..", ".xxxxxxxxxxx..", "..xxxdddddx...", "...xx...xx....", "...dd...dd....",
];
const SP = {
  raptor: { n: 'Raptor', c: '#4aa34a', d: '#2d6a2d', hp: 30, sp: 55, dmg: 6, s: 1, aggr: 1 },
  trike:  { n: 'Tricératops', c: '#7a8fc4', d: '#4a5a8a', hp: 70, sp: 30, dmg: 10, s: 1.4, aggr: 0 },
  rex:    { n: 'T-Rex', c: '#c44a3a', d: '#7a2a20', hp: 140, sp: 40, dmg: 18, s: 2, aggr: 1 },
};
for (const k in SP) {
  const s = SP[k], pal = { x: s.c, d: s.d, w: '#fff' };
  s.img = mk(14, 11, c => DINO.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) R(c, pal[ch], x, y, 1, 1); })));
}

// ---------- Monde ----------
const trees = [], rocks = [], dinos = [], shots = [], toasts = [];
const far = (x, y) => Math.hypot(x - WS / 2, y - WS / 2) > 80;
for (let i = 0; i < 260; i++) { const x = rnd() * WS, y = rnd() * WS; if (far(x, y)) trees.push({ x, y, hp: 3 }); }
for (let i = 0; i < 110; i++) { const x = rnd() * WS, y = rnd() * WS; if (far(x, y)) rocks.push({ x, y, hp: 3 }); }
const P = { x: WS / 2, y: WS / 2, hp: 100, wood: 0, stone: 0, cages: 2, face: 1, cd: 0, hurt: 0 };
const say = t => toasts.push({ t, life: 2.5 });

function spawn(type, x, y) {
  const s = SP[type];
  const d = { s, type, x, y, hp: s.hp, max: s.hp, vx: 0, vy: 0, wt: 0, face: 1, tame: false, cd: 0, aggro: false, flash: 0 };
  dinos.push(d); return d;
}
function spawnWild() {
  const r = rnd(), type = r < .5 ? 'raptor' : r < .85 ? 'trike' : 'rex';
  let x, y; do { x = rnd() * WS; y = rnd() * WS; } while (Math.hypot(x - P.x, y - P.y) < 200);
  spawn(type, x, y);
}
for (let i = 0; i < 40; i++) spawnWild();

const blocked = (x, y) =>
  trees.some(t => Math.abs(t.x - x) < 7 && Math.abs(t.y - y) < 6) ||
  rocks.some(r => Math.abs(r.x - x) < 8 && Math.abs(r.y - y) < 5);

// ---------- Entrées ----------
const K = {}; let mx = W / 2, my = H / 2;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); K[k] = 1;
  if (k === 'c') craft();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { K[e.key.toLowerCase()] = 0; });
cv.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) * W / r.width; my = (e.clientY - r.top) * H / r.height; });
cv.addEventListener('mousedown', () => throwCage());

function craft() {
  if (P.wood >= 3 && P.stone >= 2) { P.wood -= 3; P.stone -= 2; P.cages++; say('Cage fabriquée !'); }
  else say('Il faut 3 bois et 2 pierres');
}
function throwCage() {
  if (P.cages <= 0) return say('Plus de cages (C pour en fabriquer)');
  P.cages--;
  const tx = cam.x + mx, ty = cam.y + my, a = Math.atan2(ty - P.y, tx - P.x);
  shots.push({ x: P.x, y: P.y - 6, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, life: .8 });
}
function act() {
  if (P.cd > 0) return; P.cd = .35;
  const near = (arr, r) => arr.filter(o => dist(o, P) < r).sort((a, b) => dist(a, P) - dist(b, P))[0];
  const d = near(dinos.filter(d => !d.tame), 26 + 6);
  if (d) { hit(d, 10); return; }
  const t = near(trees, 24); if (t) { t.hp--; P.wood++; if (t.hp <= 0) trees.splice(trees.indexOf(t), 1); return; }
  const r = near(rocks, 24); if (r) { r.hp--; P.stone++; if (r.hp <= 0) rocks.splice(rocks.indexOf(r), 1); }
}
function hit(d, dmg) {
  d.hp -= dmg; d.flash = .15; d.aggro = true;
  if (d.hp <= 0) { dinos.splice(dinos.indexOf(d), 1); spawnWild(); if (!d.tame) say(d.s.n + ' vaincu'); }
}

// ---------- Mise à jour ----------
const cam = { x: 0, y: 0 };
function update(dt) {
  // joueur
  let dx = (K.d || K.arrowright ? 1 : 0) - (K.a || K.q || K.arrowleft ? 1 : 0);
  let dy = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.z || K.arrowup ? 1 : 0);
  const l = Math.hypot(dx, dy) || 1, sp = 80 * dt;
  const nx = P.x + dx / l * sp, ny = P.y + dy / l * sp;
  if (!blocked(nx, P.y)) P.x = clamp(nx, 8, WS - 8);
  if (!blocked(P.x, ny)) P.y = clamp(ny, 8, WS - 8);
  if (dx) P.face = dx;
  P.cd -= dt; P.hurt -= dt;
  if (K[' ']) act();
  P.hp = Math.min(100, P.hp + dt * 1.5);
  if (P.hp <= 0) { P.x = P.y = WS / 2; P.hp = 100; say('Vous êtes tombé… retour au camp'); }

  // cages lancées
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    const d = dinos.find(d => !d.tame && Math.hypot(d.x - s.x, d.y - 6 * d.s - s.y) < 8 * d.s + 4);
    if (d) {
      shots.splice(i, 1);
      const chance = .12 + .8 * (1 - d.hp / d.max);
      if (Math.random() < chance) { d.tame = true; d.aggro = false; say(d.s.n + ' capturé !'); }
      else { d.aggro = true; say('Il s\'est échappé ! (affaiblissez-le d\'abord)'); }
    } else if (s.life <= 0) shots.splice(i, 1);
  }

  // dinosaures
  for (const d of dinos.slice()) {
    d.cd -= dt; d.flash -= dt; d.wt -= dt;
    let tx = null, ty = null, spd = d.s.sp;
    if (d.tame) {
      const foe = dinos.find(o => !o.tame && dist(o, d) < 90);
      if (foe) {
        tx = foe.x; ty = foe.y;
        if (dist(foe, d) < 12 * d.s && d.cd <= 0) { d.cd = .9; hit(foe, d.s.dmg); }
      } else if (dist(d, P) > 36) { tx = P.x + (d.x < P.x ? -20 : 20); ty = P.y; }
    } else {
      const pd = dist(d, P);
      if (d.aggro || (d.s.aggr && pd < 100)) {
        tx = P.x; ty = P.y; if (pd > 220) d.aggro = false;
        if (pd < 10 * d.s + 6 && d.cd <= 0) { d.cd = 1; P.hp -= d.s.dmg; P.hurt = .2; }
      } else {
        if (d.wt <= 0) { d.wt = 1 + Math.random() * 3; const a = Math.random() * 6.28, m = Math.random() < .4 ? 0 : 1; d.vx = Math.cos(a) * m; d.vy = Math.sin(a) * m; }
        spd *= .4; tx = d.x + d.vx * 10; ty = d.y + d.vy * 10;
      }
    }
    if (tx !== null) {
      const a = Math.atan2(ty - d.y, tx - d.x), vx = Math.cos(a), vy = Math.sin(a);
      if (Math.hypot(tx - d.x, ty - d.y) > 4) {
        const nx = d.x + vx * spd * dt, ny = d.y + vy * spd * dt;
        if (!blocked(nx, ny)) { d.x = clamp(nx, 8, WS - 8); d.y = clamp(ny, 8, WS - 8); }
        if (Math.abs(vx) > .2) d.face = vx > 0 ? 1 : -1;
      }
    }
  }
  while (dinos.filter(d => !d.tame).length < 40) spawnWild();

  cam.x = clamp(P.x - W / 2, 0, WS - W); cam.y = clamp(P.y - H / 2, 0, WS - H);
  for (let i = toasts.length - 1; i >= 0; i--) if ((toasts[i].life -= dt) <= 0) toasts.splice(i, 1);
}

// ---------- Rendu ----------
const text = (s, x, y, col = '#fff') => { g.font = '8px monospace'; g.fillStyle = '#000'; g.fillText(s, x + 1, y + 1); g.fillStyle = col; g.fillText(s, x, y); };
function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - w / 2 | 0, y - 1 | 0, w, 3); }
function bar(x, y, w, v, col) { R(g, '#000', x - 1, y - 1, w + 2, 4); R(g, col, x, y, w * clamp(v, 0, 1), 2); }

function draw() {
  const cx = cam.x | 0, cy = cam.y | 0;
  g.drawImage(bg, cx, cy, W, H, 0, 0, W, H);
  const items = [];
  const vis = o => o.x > cx - 40 && o.x < cx + W + 40 && o.y > cy - 20 && o.y < cy + H + 60;
  trees.filter(vis).forEach(t => items.push([t.y, () => { shadow(t.x - cx, t.y - cy, 14); g.drawImage(treeS, t.x - 12 - cx | 0, t.y - 30 - cy | 0); }]));
  rocks.filter(vis).forEach(r => items.push([r.y, () => { shadow(r.x - cx, r.y - cy, 14); g.drawImage(rockS, r.x - 8 - cx | 0, r.y - 11 - cy | 0); }]));
  dinos.filter(vis).forEach(d => items.push([d.y, () => {
    const w = 14 * d.s, h = 11 * d.s, x = d.x - cx | 0, y = d.y - cy | 0;
    shadow(x, y, w * .8);
    g.save(); g.translate(x, y - h | 0); g.scale(d.face, 1);
    if (d.flash > 0) g.globalAlpha = .5;
    g.drawImage(d.s.img, -w / 2, 0, w, h); g.restore();
    if (d.hp < d.max || d.tame) bar(x - 8, y - h - 5, 16, d.hp / d.max, d.tame ? '#5ad45a' : '#e04848');
    if (d.tame) text('♥', x - 3, y - h - 8, '#ff6b9a');
  }]));
  items.push([P.y, () => {
    const x = P.x - cx | 0, y = P.y - cy | 0;
    shadow(x, y, 10); g.save(); g.translate(x, y - 14); g.scale(P.face, 1);
    if (P.hurt > 0) g.globalAlpha = .5; g.drawImage(playerS, -5, 0); g.restore();
  }]);
  items.sort((a, b) => a[0] - b[0]).forEach(i => i[1]());
  shots.forEach(s => g.drawImage(cageS, s.x - 4 - cx | 0, s.y - 4 - cy | 0));

  // ATH
  text('Explorateur', 8, 14);
  R(g, '#000', 7, 18, 102, 8); R(g, '#e8505b', 8, 19, 100 * P.hp / 100, 6);
  text(`${Math.ceil(P.hp)}/100`, 40, 25);
  text(`Bois ${P.wood}  Pierre ${P.stone}  Cages ${P.cages}`, 8, 40, '#ffe08a');
  text(`Dinos apprivoisés : ${dinos.filter(d => d.tame).length}`, 8, 52, '#9be59b');
  text('ZQSD/WASD bouger · Espace frapper/récolter · Clic lancer cage · C fabriquer', 8, H - 6, '#cfd8c8');
  toasts.forEach((t, i) => { g.globalAlpha = Math.min(1, t.life); text(t.t, W / 2 - t.t.length * 2.4, 40 + i * 11); g.globalAlpha = 1; });
  // visée
  g.strokeStyle = '#fff'; g.strokeRect(mx - 3, my - 3, 6, 6);
}

let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
say('Affaiblissez un dino, puis lancez une cage !');
requestAnimationFrame(loop);
