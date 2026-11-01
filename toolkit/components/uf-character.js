/*!
 * Unfiction GFX Toolkit — Character
 * The channel's recurring faceless figure: one jointed rig, drawn flat under a soft key light, reused in
 * every dramatised scene. A role sets the clothes; a pose sets the body; timed actions move it.
 *
 *   new UF.Character({
 *     role: 'mule', x: 300, y: 900, scale: 2.6,           // y is the floor line, scale is px per cm
 *     actions: [
 *       { at: 0.5, to: 1100, dur: 3 },                     // walks there, facing the way it goes
 *       { at: 3.6, pose: 'reach', target: atm.point('slot'), hold: 'card' },
 *       { at: 6.0, facing: -1 },                           // turns round
 *     ],
 *   })
 *
 * Views: 'side' (profile, the main one), 'front' and 'back'. A change of view or facing plays a quick turn.
 * Anything a character holds is drawn by uf-props.js, so load it too.
 * A scene with a character needs a DramaLabel; the editorial check warns without one.
 */
(function (UF) {
  'use strict';

  const { clamp, lerp, seg, ease } = UF;
  const D = UF.draw;
  const PI = Math.PI, TAU = PI * 2;

  /** Unit vector `a` radians forward of straight down: 0 is down, PI/2 forward, PI up. */
  const dn = a => [Math.sin(a), Math.cos(a)];
  const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
  const bump = (q, c, w) => { const d = (((q - c) % 1) + 1.5) % 1 - 0.5; return Math.exp(-(d / w) * (d / w)); };

  /* ------------------------------------------------------------------ */
  /* Body, roles and poses                                               */
  /* ------------------------------------------------------------------ */
  /** Measurements in cm for a 175 cm figure. */
  const B = {
    hip: 93, torso: 50, neck: 6.5, upper: 29, fore: 26, hand: 4.2,
    thigh: 44, shin: 43, ankle: 6.5, shoulderDrop: 7, shoulderX: 15, hipX: 9,
  };
  const BUILD = { slim: 0.9, average: 1, heavy: 1.2 };
  const SKIN = { mannequin: '#9a948a', light: '#d6b296', medium: '#b4876a', brown: '#8a6248', dark: '#5b3f30' };
  const HAIR = ['short', 'crop', 'long', 'bun', 'bald', 'cap', 'peak', 'hood'];

  /** Outfits. Any key can be overridden with `look`. */
  const ROLES = {
    main:     { top: '#2b3440', bottom: '#191c22', shoes: '#0c0d0f', hair: 'short', hairColor: '#15120e', collar: 'red' },
    mule:     { top: '#56606b', bottom: '#283040', shoes: '#191919', hair: 'short', hairColor: '#17130f', sleeves: 'short', backpack: '#363c33' },
    handler:  { top: '#1c1f24', bottom: '#121418', shoes: '#09090a', hair: 'crop', hairColor: '#0f0d0b' },
    staff:    { top: '#c4c8cb', bottom: '#2a2f38', shoes: '#131313', hair: 'short', hairColor: '#1b1712', lanyard: 'blue', tuck: true },
    police:   { top: '#9a8255', bottom: '#86714a', shoes: '#1c1915', hair: 'peak', hairColor: '#15120e', hat: '#86714a', belt: '#3b2c1c', tuck: true },
    hacker:   { top: '#161a20', bottom: '#101216', shoes: '#0a0b0c', hair: 'hood' },
    suit:     { top: '#22262d', bottom: '#1c1f25', shoes: '#0a0a0b', hair: 'short', hairColor: '#15120e', shirt: '#d6d3cb', tie: 'red' },
    civilian: { top: '#6e5446', bottom: '#2d3036', shoes: '#1b1b1b', hair: 'long', hairColor: '#1a140f' },
    dealer:   { top: '#e4e1d9', bottom: '#15171a', shoes: '#0a0a0b', hair: 'short', hairColor: '#15120e', vest: '#17181c', bow: '#0b0b0c', tuck: true },
  };

  /*
   * Side-view joints, in radians. s/e: shoulder and elbow, h/k/f: hip, knee and foot pitch, for the near (N)
   * and far (F) limbs. Positive shoulder and hip swing forward; positive elbow folds the forearm forward and up;
   * positive knee bends the shin back. lean tilts the torso forward, head nods forward, raise lifts the
   * shoulders (cm), sit (0..1) puts the hips on the seat, y lifts the whole body (cm).
   * ik / ikFar put a hand on a point instead: [forward cm, height cm (negative is up)] from the feet,
   * or 'ear' / 'chin'.
   */
  const ZS = { lean: 0, head: 0, raise: 0, sN: 0, eN: 0, sF: 0, eF: 0, hN: 0, kN: 0, fN: 0, hF: 0, kF: 0, fF: 0, sit: 0, y: 0 };
  const LEGS = { hN: 0.03, kN: 0.03, hF: -0.04, kF: 0.05 };
  const SEAT = { hN: 1.4, kN: 1.2, fN: 0.05, hF: 1.36, kF: 1.05, fF: 0.05, sit: 1 };
  const SIDE = {
    stand:     Object.assign({ lean: 0.02, head: 0.03, sN: 0.06, eN: 0.14, sF: -0.05, eF: 0.18 }, LEGS),
    wait:      Object.assign({ lean: 0.01, head: 0.08, sN: 0.02, eN: 0.6, sF: 0.0, eF: 0.62, gesture: 'look' }, LEGS),
    reach:     Object.assign({ lean: 0.07, head: 0.12, sF: 0.02, eF: 0.22, ik: [44, -121] }, LEGS, { hN: 0.06, hF: -0.06 }),
    type:      Object.assign({ lean: 0.07, head: 0.16, sF: 0.2, eF: 0.9, ik: [38, -108], gesture: 'type' }, LEGS),
    handOver:  Object.assign({ lean: 0.06, head: 0.08, sF: -0.05, eF: 0.2, ik: [52, -112] }, LEGS, { hN: 0.06, hF: -0.06 }),
    receive:   Object.assign({ lean: 0.04, head: 0.16, sF: -0.04, eF: 0.22, ik: [40, -106] }, LEGS),
    point:     Object.assign({ lean: 0.03, head: -0.04, sN: 1.5, eN: 0.04, sF: -0.05, eF: 0.15 }, LEGS),
    pocket:    Object.assign({ lean: 0.03, head: 0.3, sF: -0.04, eF: 0.2, ik: [9, -88] }, LEGS),
    lookDown:  Object.assign({ lean: 0.09, head: 0.42, sN: 0.12, eN: 0.35, sF: 0.0, eF: 0.3 }, LEGS),
    lookUp:    Object.assign({ lean: -0.04, head: -0.3, sN: 0.02, eN: 0.12, sF: -0.06, eF: 0.15 }, LEGS),
    phone:     Object.assign({ lean: 0.02, head: 0.12, sF: -0.05, eF: 0.2, ik: 'ear' }, LEGS),
    carry:     Object.assign({ lean: -0.03, head: 0.02, sN: -0.02, eN: 0.04, sF: -0.06, eF: 0.18 }, LEGS),
    shrug:     Object.assign({ lean: -0.02, head: -0.06, raise: 4, sN: 0.3, eN: 1.35, sF: 0.25, eF: 1.3 }, LEGS),
    think:     Object.assign({ lean: 0.03, head: 0.14, sF: 0.35, eF: 1.5, ik: 'chin' }, LEGS),
    talk:      Object.assign({ lean: 0.03, head: 0.02, sN: 0.45, eN: 1.15, sF: 0.1, eF: 0.4, gesture: 'talk' }, LEGS),
    count:     Object.assign({ lean: 0.08, head: 0.35, sN: 0.55, eN: 1.05, sF: 0.5, eF: 1.15, gesture: 'count' }, LEGS),
    handsUp:   Object.assign({ lean: -0.03, head: -0.06, raise: 3, sN: 2.75, eN: 0.25, sF: 2.65, eF: 0.3 }, LEGS),
    sit:       Object.assign({ lean: -0.03, head: 0.05, sN: 0.28, eN: 0.95, sF: 0.3, eF: 0.9 }, SEAT),
    sitType:   Object.assign({ lean: 0.14, head: 0.2, ik: [46, -79], ikFar: [41, -79], gesture: 'type' }, SEAT),
    sitLaptop: Object.assign({ lean: 0.18, head: 0.34, ik: [44, -80], ikFar: [39, -80], gesture: 'type' }, SEAT),
    sitLean:   Object.assign({ lean: -0.14, head: -0.02, sN: 0.12, eN: 0.7, sF: 0.1, eF: 0.75 }, SEAT, { hN: 1.38, kN: 1.12, fN: 0.15, hF: 1.3, kF: 1.05 }),
    sitPhone:  Object.assign({ lean: 0.04, head: 0.12, sF: 0.3, eF: 0.9, ik: 'ear' }, SEAT),
    sitThink:  Object.assign({ lean: 0.1, head: 0.2, sF: 0.3, eF: 0.9, ik: 'chin' }, SEAT),
    sitDesk:   Object.assign({ lean: 0.1, head: 0.14, ik: [44, -78], ikFar: [39, -78] }, SEAT),
    press:     Object.assign({ lean: 0.07, head: 0.2, sF: 0.02, eF: 0.22, ik: [40, -118], gesture: 'tap' }, LEGS, { hN: 0.06, hF: -0.06 }),
    lift:      Object.assign({ lean: 0.34, head: 0.22, ik: [42, -76], ikFar: [37, -78] }, LEGS, { hN: 0.32, kN: 0.48, fN: 0.16, hF: 0.2, kF: 0.4, fF: 0.2 }),
  };

  /*
   * Front and back joints. a/e: arm out from the side and elbow fold, f: how far the arm points towards
   * (front view) or away from (back view) the camera, 0..1. A is the arm on screen left, B on screen right.
   * l: leg spread, lift: knee lift (walking), tilt: body tilt, nod: head nod, raise: shoulders (cm).
   * ikA / ikB: [x cm, height cm] from the feet, or 'ear' / 'chin' / 'hip'.
   */
  const ZF = { tilt: 0, nod: 0, raise: 0, aA: 0, eA: 0, fA: 0, aB: 0, eB: 0, fB: 0, lA: 0, lB: 0, liftA: 0, liftB: 0, sit: 0, y: 0 };
  const FRONT = {
    stand:    { aA: 0.1, eA: 0.12, aB: 0.1, eB: 0.12, lA: 0.035, lB: 0.035 },
    wait:     { aA: 0.1, eA: 0.12, aB: 0.1, eB: 0.12, lA: 0.035, lB: 0.035, nod: 0.12, gesture: 'look' },
    crossed:  { aA: 0.08, eA: 1.66, fA: 0.45, aB: 0.08, eB: 1.6, fB: 0.45, lA: 0.05, lB: 0.05 },
    hips:     { lA: 0.06, lB: 0.06, ikA: 'hip', ikB: 'hip' },
    phone:    { aA: 0.1, eA: 0.12, lA: 0.035, lB: 0.035, nod: 0.1, ikB: 'ear' },
    think:    { aA: 0.1, eA: 0.12, fB: 0.3, lA: 0.035, lB: 0.035, nod: 0.12, ikB: 'chin' },
    shrug:    { aA: 0.3, eA: -0.85, aB: 0.3, eB: -0.85, lA: 0.035, lB: 0.035, raise: 4, nod: -0.06 },
    point:    { aA: 0.1, eA: 0.12, aB: 1.5, eB: 0.03, lA: 0.035, lB: 0.035 },
    talk:     { aA: 0.12, eA: 0.2, aB: 0.35, eB: 1.25, fB: 0.3, lA: 0.035, lB: 0.035, gesture: 'talk' },
    handsUp:  { aA: 2.75, eA: -0.35, aB: 2.75, eB: -0.35, lA: 0.05, lB: 0.05, raise: 3 },
    reach:    { aA: 0.3, eA: 0.45, fA: 0.85, aB: 0.26, eB: 0.5, fB: 0.85, lA: 0.035, lB: 0.035, nod: 0.06 },
    type:     { aA: 0.3, eA: 0.7, fA: 0.8, aB: 0.28, eB: 0.75, fB: 0.8, lA: 0.035, lB: 0.035, nod: 0.18, gesture: 'type' },
    lookDown: { aA: 0.1, eA: 0.3, fA: 0.2, aB: 0.1, eB: 0.3, fB: 0.2, lA: 0.035, lB: 0.035, nod: 0.4 },
    sit:      { aA: 0.14, eA: 0.95, fA: 0.55, aB: 0.14, eB: 0.95, fB: 0.55, lA: 0.08, lB: 0.08, sit: 1 },
    sitType:  { aA: 0.22, eA: 0.9, fA: 0.85, aB: 0.22, eB: 0.9, fB: 0.85, lA: 0.08, lB: 0.08, sit: 1, nod: 0.2, gesture: 'type' },
    sitTable: { aA: 0.22, eA: 0.9, fA: 0.85, aB: 0.22, eB: 0.9, fB: 0.85, lA: 0.08, lB: 0.08, sit: 1, nod: 0.14 },
    deal:     { aA: 0.3, eA: 0.75, fA: 0.8, aB: 0.3, eB: 0.75, fB: 0.8, lA: 0.035, lB: 0.035, nod: 0.25, gesture: 'deal' },
  };

  /** Small motions layered on a pose, as a pure function of time. */
  const GESTURE = {
    type(j, t, side) {
      if (side) { j.eN += 0.06 * Math.sin(t * 19); j.eF += 0.06 * Math.sin(t * 16 + 1.3); j.sN += 0.02 * Math.sin(t * 7); }
      else { j.eA += 0.06 * Math.sin(t * 19); j.eB += 0.06 * Math.sin(t * 16 + 1.3); }
    },
    talk(j, t, side) {
      if (side) { j.sN += 0.12 * Math.sin(t * 2.1); j.eN += 0.22 * Math.sin(t * 2.7 + 0.5); j.head += 0.04 * Math.sin(t * 3.1); }
      else { j.aB += 0.1 * Math.sin(t * 2.1); j.eB += 0.25 * Math.sin(t * 2.7 + 0.5); j.nod += 0.04 * Math.sin(t * 3.1); }
    },
    count(j, t, side) { if (side) { j.eN += 0.16 * Math.max(0, Math.sin(t * 8)); j.sN += 0.03 * Math.sin(t * 8); } },
    look(j, t, side) { if (side) j.head += 0.08 * Math.sin(t * 0.9); else j.nod += 0.05 * Math.sin(t * 0.9); },
    tap(j, t, side) { if (side) j.eN += 0.12 * Math.max(0, Math.sin(t * 9)); else j.eB += 0.12 * Math.max(0, Math.sin(t * 9)); },
    deal(j, t, side) {
      const k = Math.pow(Math.max(0, Math.sin(t * 3.4)), 3);
      if (side) { j.sN += 0.3 * k; j.eN -= 0.3 * k; } else { j.aB += 0.45 * k; j.eB -= 0.35 * k; j.fB -= 0.3 * k; }
    },
  };

  const CYCLE = { walk: 134, run: 250 };          // cm travelled per full stride cycle
  const SPEED = { walk: 130, run: 380 };          // cm per second when an action gives no dur

  function gait(p, run) {
    const A = run ? 0.62 : 0.4, K = run ? 1.55 : 1.05;
    const leg = q => [A * Math.cos(TAU * q), 0.08 + 0.1 * bump(q, 0.12, 0.08) + K * bump(q, run ? 0.66 : 0.7, run ? 0.16 : 0.13),
      0.22 * bump(q, 0.02, 0.06) - 0.5 * bump(q, 0.55, 0.07)];
    const [hN, kN, fN] = leg(p), [hF, kF, fF] = leg(p + 0.5);
    const arm = q => -(run ? 0.75 : 0.32) * Math.cos(TAU * q);
    const sN = arm(p), sF = arm(p + 0.5), eb = run ? 1.45 : 0.25, ek = run ? 0.1 : 0.4;
    return Object.assign({}, ZS, { lean: run ? 0.2 : 0.05, head: run ? -0.05 : 0.02, hN, kN, fN, hF, kF, fF,
      sN, sF, eN: eb + ek * Math.max(0, sN), eF: eb + ek * Math.max(0, sF) });
  }
  function gaitFront(p, run) {
    const lift = q => bump(q, 0.72, 0.15), sw = q => (run ? 0.5 : 0.3) * Math.cos(TAU * q);
    return Object.assign({}, ZF, { liftA: lift(p), liftB: lift(p + 0.5), fA: sw(p + 0.5), fB: sw(p),
      aA: 0.1, aB: 0.1, eA: run ? 1.3 : 0.25, eB: run ? 1.3 : 0.25, lA: 0.03, lB: 0.03 });
  }

  /** Torso side profile: [u, front, back] in cm; u is 0 at the hip joint and 1 at the base of the neck. */
  const PROFILE = [[-0.2, 6.2, -8.6], [0, 9.6, -12.6], [0.18, 9.8, -11.8], [0.36, 9.6, -9.4], [0.56, 10.6, -9.8],
    [0.74, 12, -11.2], [0.88, 10.8, -10.6], [0.95, 9.2, -9.4], [1, 6.2, -6.2]];
  /** Torso front width: [u, half width] in cm. */
  const WIDTH = [[-0.2, 16.2], [0, 17.2], [0.2, 16.1], [0.38, 15.1], [0.6, 16.6], [0.8, 18.6], [0.88, 19.2], [0.95, 16.6], [1, 7.4]];
  const interp = (rows, u, col) => {
    if (u <= rows[0][0]) return rows[0][col];
    for (let i = 1; i < rows.length; i++) {
      if (u <= rows[i][0]) { const [a, b] = [rows[i - 1], rows[i]]; return lerp(a[col], b[col], (u - a[0]) / (b[0] - a[0])); }
    }
    return rows[rows.length - 1][col];
  };

  /* ------------------------------------------------------------------ */
  /* Drawing helpers                                                     */
  /* ------------------------------------------------------------------ */
  /** A paint: base colour plus the lit and shadow ends of its gradient. far darkens limbs on the far side. */
  function paint(hex, o, far) {
    let base = D.shade(hex, far ? -0.24 : 0);
    if (o.dim) base = D.hexMix(base, '#07080a', o.dim);
    if (o.silhouette) return { base: D.hexMix('#0a0c0f', base, 0.1), lit: o.rim, dark: '#040506', mid: 0.16 };
    return { base, lit: D.shade(base, 0.2), dark: D.shade(base, -0.4), mid: 0.45 };
  }

  /** A second light the figure is facing (a screen), set only while a figure with `glow` draws. */
  let GLOW = null;

  /** Fills the current path with a gradient from p0 to p1, brightest at whichever end faces the light L. */
  function shaded(ctx, m, p0, p1, L) {
    const lit = (p0[0] - p1[0]) * L[0] + (p0[1] - p1[1]) * L[1] >= 0;
    const a = lit ? p0 : p1, b = lit ? p1 : p0;
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-3) { ctx.fillStyle = m.base; ctx.fill(); return; }
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, m.lit);
    g.addColorStop(m.mid, m.base);
    g.addColorStop(1, m.dark);
    ctx.fillStyle = g;
    ctx.fill();
    if (!GLOW) return;
    const toward = (p0[0] - p1[0]) * GLOW.dir[0] + (p0[1] - p1[1]) * GLOW.dir[1] >= 0;
    const ga = toward ? p0 : p1, gb = toward ? p1 : p0;
    const gg = ctx.createLinearGradient(ga[0], ga[1], gb[0], gb[1]);
    gg.addColorStop(0, GLOW.c0);
    gg.addColorStop(0.75, GLOW.c1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.restore();
  }

  /** Path of two circles joined by their outer tangents (a tapered limb). */
  function capsule(ctx, a, b, ra, rb) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    ctx.beginPath();
    if (d <= Math.abs(ra - rb) + 1e-3) { const big = ra >= rb ? a : b; ctx.arc(big[0], big[1], Math.max(ra, rb), 0, TAU); return; }
    const ang = Math.atan2(dy, dx), off = Math.acos((ra - rb) / d);
    ctx.arc(a[0], a[1], ra, ang + off, ang - off + TAU);
    ctx.arc(b[0], b[1], rb, ang - off, ang + off);
    ctx.closePath();
  }
  function limb(ctx, a, b, ra, rb, m, L) {
    capsule(ctx, a, b, ra, rb);
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    const n = d > 1e-3 ? [-dy / d, dx / d] : [1, 0], c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], r = Math.max(ra, rb);
    shaded(ctx, m, add(c, n, r), add(c, n, -r), L);
  }
  /** Smooth closed path through the points (quadratic curves through the midpoints). */
  function blob(ctx, pts) {
    const n = pts.length, mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    ctx.beginPath();
    const s = mid(pts[n - 1], pts[0]);
    ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % n]);
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  }
  function ellipse(ctx, c, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, rot, 0, TAU); }
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

  /** Two-bone IK in the side plane. Returns the absolute upper-arm angle and the elbow fold. */
  function ik2(S, T, L1, L2) {
    const d = [T[0] - S[0], T[1] - S[1]];
    const dist = clamp(Math.hypot(d[0], d[1]), Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.05);
    const th = Math.atan2(d[0], d[1]);
    const al = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
    const be = Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
    return { upper: th - al, elbow: PI - be };
  }

  /* Hair shapes in head space: x forward (side) or right (front/back), y down, head centre at 0, 0. */
  const HAIR_SIDE = {
    short: [[8.4, -7.6], [5.2, -11.8], [0, -13.2], [-5.6, -12.4], [-9.9, -8.7], [-11.5, -3], [-11.3, 2.6], [-9.7, 6.8], [-7.3, 8.8],
      [-5.4, 6.6], [-4.9, 2.8], [-4.4, -1.2], [-2, -4.4], [1.8, -6.4], [5.6, -6.5], [7.8, -6]],
    crop: [[7.6, -8.4], [4.6, -11.9], [0, -12.6], [-5.4, -11.9], [-9.4, -8.4], [-10.9, -3], [-10.7, 2.4], [-9.2, 6.4], [-7, 8.2],
      [-5.4, 6.2], [-4.9, 2.6], [-4.5, -1.6], [-2.2, -5], [1.8, -7.4], [5.4, -7.6], [7.2, -7.2]],
    long: [[8.4, -7.6], [5.2, -12], [0, -13.4], [-5.8, -12.6], [-10.2, -8.8], [-12, -3], [-12.4, 6], [-12, 14], [-10, 17.6], [-6, 18],
      [-4.6, 13], [-4.9, 2.8], [-4.4, -1.2], [-2, -4.4], [1.8, -6.6], [5.6, -6.8], [7.8, -6.2]],
    nape: [[-11, -3], [-11.2, 3], [-9.6, 6.8], [-7.3, 8.8], [-5.4, 6.6], [-4.9, 2.8], [-4.4, -1.2], [-3, -3]],
  };
  const HAIR_FRONT = {
    short: [[-9.2, -1.2], [-9.4, -7.6], [-5.5, -11.8], [0, -12.6], [5.5, -11.8], [9.4, -7.6], [9.2, -1.2], [8, -4.6], [6.4, -7.4], [3, -8.4], [0, -8.2], [-3, -8.4], [-6.4, -7.4], [-8, -4.6]],
    crop: [[-9, -2.4], [-9.1, -8], [-5.4, -11.9], [0, -12.4], [5.4, -11.9], [9.1, -8], [9, -2.4], [7.8, -5.8], [6, -8.6], [3, -9.4], [0, -9.2], [-3, -9.4], [-6, -8.6], [-7.8, -5.8]],
    long: [[-9.6, -1], [-9.8, -7.8], [-5.6, -12], [0, -12.9], [5.6, -12], [9.8, -7.8], [9.8, 4], [10.6, 14], [7.6, 15.6], [7.6, 2], [6.6, -6.8], [3, -8.2], [0, -8], [-3, -8.2], [-6.6, -6.8], [-7.6, 2], [-7.6, 15.6], [-10.6, 14], [-9.8, 4]],
    backShort: [[-9.4, -1], [-9.4, -7.6], [-5.5, -11.8], [0, -12.6], [5.5, -11.8], [9.4, -7.6], [9.4, -1], [8.6, 4.6], [6, 7.6], [0, 8.4], [-6, 7.6], [-8.6, 4.6]],
    backLong: [[-10, -1], [-9.8, -7.8], [-5.6, -12], [0, -12.9], [5.6, -12], [9.8, -7.8], [10, 4], [10.8, 15], [0, 17], [-10.8, 15], [-10, 4]],
    nape: [[-8.8, 2], [-8.4, 5.2], [-5.6, 7.8], [0, 8.6], [5.6, 7.8], [8.4, 5.2], [8.8, 2], [0, 3]],
  };
  const HEAD_FRONT = [[0, -11.6], [6.2, -10.2], [8.8, -4], [8.4, 3.4], [6, 8.6], [0, 11.4], [-6, 8.6], [-8.4, 3.4], [-8.8, -4], [-6.2, -10.2]];
  const HOOD_FRONT = [[0, -15], [8.5, -12.5], [12.4, -4], [12.6, 6], [10, 13.4], [5, 15.6], [-5, 15.6], [-10, 13.4], [-12.6, 6], [-12.4, -4], [-8.5, -12.5]];

  /* ------------------------------------------------------------------ */
  /* Character                                                           */
  /* ------------------------------------------------------------------ */
  class Character extends UF.Component {
    constructor(o) {
      super({
        role: 'main', x: 960, y: 920, height: 175, scale: 2.6, facing: 1, view: 'side', start: 'stand',
        build: 'average', skin: 'mannequin', look: null, backpack: undefined, light: 'left',
        silhouette: false, rim: '#9aa6b8', dim: 0, hold: null, holdFar: null, actions: [], seat: 47,
        breathe: true, shadow: true, blend: 0.35, turnDur: 0.32, seed: 1, glow: null,
      }, o);
      const role = ROLES[this.role];
      if (!role) throw new Error(`Character: unknown role "${this.role}" — use ${Object.keys(ROLES).join(', ')}.`);
      this.style = Object.assign({}, role, this.look || {});
      if (this.backpack !== undefined) this.style.backpack = this.backpack === true ? '#3a4048' : this.backpack || null;
      if (!HAIR.includes(this.style.hair)) throw new Error(`Character: unknown hair "${this.style.hair}" — use ${HAIR.join(', ')}.`);
      if (!BUILD[this.build]) throw new Error(`Character: build is ${Object.keys(BUILD).join(', ')}.`);
      this.bf = BUILD[this.build];
      this.L = this.light === 'right' ? [0.55, -0.83] : [-0.55, -0.83];
      this.mats = this.makePaints(SKIN[this.skin] || this.skin);
      this.track = this.buildTrack();
    }

    makePaints(skin) {
      const s = this.style, o = { dim: this.dim, silhouette: this.silhouette, rim: this.rim };
      const pair = v => {
        if (!v) return null;
        const hex = UF.theme.colors[v] || v;
        return { near: paint(hex, o, false), far: paint(hex, o, true) };
      };
      return {
        top: pair(s.top), bottom: pair(s.bottom), shoes: pair(s.shoes), skin: pair(skin), hair: pair(s.hairColor || '#15120e'),
        hat: pair(s.hat || s.top), pack: pair(s.backpack), collar: pair(s.collar), shirt: pair(s.shirt), tie: pair(s.tie),
        lanyard: pair(s.lanyard), belt: pair(s.belt), vest: pair(s.vest), bow: pair(s.bow), void: pair('#0a0b0d'),
      };
    }

    /* ---------------- Timeline ---------------- */
    poseTable(view) { return view === 'side' ? SIDE : FRONT; }
    checkPose(pose, view) {
      if (pose === 'walk' || pose === 'run') return;
      const table = this.poseTable(view);
      if (!table[pose]) throw new Error(`Character: no pose "${pose}" in the ${view} view — use walk, run, ${Object.keys(table).join(', ')}.`);
    }

    /** Resolves the actions into a sorted list of states: where, which way, which pose, holding what. */
    buildTrack() {
      const k0 = this.scale * this.height / 175;
      if (!['side', 'front', 'back'].includes(this.view)) throw new Error('Character: view is side, front or back.');
      this.checkPose(this.start, this.view);
      const first = { at: -1e9, dur: 0, x0: this.x, y0: this.y, x1: this.x, y1: this.y, z0: 1, z1: 1, ph0: 0.15,
        facing: this.facing < 0 ? -1 : 1, view: this.view, pose: this.start, hold: this.hold, holdFar: this.holdFar,
        target: null, targetFar: null, blend: 0, seat: this.seat };
      const track = [first];
      const acts = (this.actions || []).map((a, i) => Object.assign({ _i: i }, a)).sort((p, q) => p.at - q.at || p._i - q._i);
      let pending = null;
      for (const a of acts) {
        if (typeof a.at !== 'number' || !isFinite(a.at)) throw new Error('Character: every action needs a number `at`.');
        if (pending && a.at < pending.at) {
          // The next action interrupts a walk before it arrives: stop where the figure is.
          const w = track[track.length - 1];
          const u = w.dur > 0 ? clamp((a.at - w.at) / w.dur) : 1;
          w.x1 = lerp(w.x0, w.x1, u); w.y1 = lerp(w.y0, w.y1, u); w.z1 = lerp(w.z0, w.z1, u); w.dur = Math.max(0, a.at - w.at);
          pending = null;
        }
        if (pending) { track.push(pending); pending = null; }
        const p = track[track.length - 1];
        const moving = p.pose === 'walk' || p.pose === 'run';
        const e = { at: a.at, dur: 0, x0: p.x1, y0: p.y1, x1: p.x1, y1: p.y1, z0: p.z1, z1: p.z1, ph0: 0.15,
          facing: p.facing, view: a.view || p.view, pose: a.pose || (moving ? 'stand' : p.pose),
          hold: 'hold' in a ? a.hold : p.hold, holdFar: 'holdFar' in a ? a.holdFar : p.holdFar,
          target: a.target || (a.pose || a.to !== undefined ? null : p.target),
          targetFar: a.targetFar || (a.pose || a.to !== undefined ? null : p.targetFar),
          blend: a.blend ?? this.blend, seat: a.seat ?? p.seat };
        if (!['side', 'front', 'back'].includes(e.view)) throw new Error(`Character: action at ${a.at}s has view "${a.view}" — use side, front or back.`);
        if (a.to !== undefined) {
          const to = Array.isArray(a.to) ? a.to : [a.to, e.y0];
          e.x1 = to[0]; e.y1 = to[1];
          if (a.zoom) e.z1 = a.zoom;
          if (!a.pose) e.pose = 'walk';
          const gaitName = e.pose === 'run' ? 'run' : 'walk';
          const distCm = Math.hypot(e.x1 - e.x0, e.y1 - e.y0) / (k0 * (e.z0 + e.z1) / 2);
          e.dur = a.dur ?? distCm / SPEED[gaitName];
          if (a.facing === undefined && e.view === 'side' && Math.abs(e.x1 - e.x0) > 0.5) e.facing = Math.sign(e.x1 - e.x0);
          if (moving && (e.pose === 'walk' || e.pose === 'run')) {
            const prevCm = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) / (k0 * (p.z0 + p.z1) / 2);
            e.ph0 = p.ph0 + prevCm / CYCLE[p.pose];
          }
        }
        if (a.facing !== undefined) e.facing = a.facing < 0 ? -1 : 1;
        this.checkPose(e.pose, e.view);
        track.push(e);
        if (a.to !== undefined && (e.pose === 'walk' || e.pose === 'run')) {
          this.checkPose(a.then || 'stand', e.view);
          pending = Object.assign({}, e, { at: e.at + e.dur, dur: 0, x0: e.x1, y0: e.y1, z0: e.z1, pose: a.then || 'stand',
            target: null, targetFar: null, blend: 0.3 });
        }
      }
      if (pending) track.push(pending);
      return track;
    }

    /** Position and scale of a track entry at time t, plus the distance walked (body cm). */
    travel(e, t) {
      const u = e.dur > 0 ? clamp((t - e.at) / e.dur) : 1;
      const m = lerp(u, ease.inOutSine(u), 0.3);
      const x = lerp(e.x0, e.x1, m), y = lerp(e.y0, e.y1, m), z = lerp(e.z0, e.z1, m);
      const k = this.scale * this.height / 175 * z;
      return { x, y, k, dist: Math.hypot(x - e.x0, y - e.y0) / k };
    }

    /** The pose of one track entry at time t, with gestures and hand targets resolved. */
    poseOf(e, t) {
      const side = e.view === 'side';
      const tv = this.travel(e, t);
      let j;
      if (e.pose === 'walk' || e.pose === 'run') {
        const ph = e.ph0 + tv.dist / CYCLE[e.pose];
        j = side ? gait(ph, e.pose === 'run') : gaitFront(ph, e.pose === 'run');
      } else {
        j = Object.assign({}, side ? ZS : ZF, this.poseTable(e.view)[e.pose]);
      }
      if (side) this.solveSide(j, e, tv); else this.solveFront(j, e, tv);
      const g = GESTURE[j.gesture];
      if (g) g(j, t + this.seed * 1.7, side);
      return j;
    }

    solveSide(j, e, tv) {
      const want = [['N', e.target, true], ['N', j.ik, false], ['F', e.targetFar, true], ['F', j.ikFar, false]];
      const done = {};
      let S = null;
      for (const [w, tgt, world] of want) {
        if (!tgt || done[w]) continue;
        S = S || this.sideFrame(j);
        let T;
        if (tgt === 'ear') T = add(add(S.ear, S.fh, 2.4), S.uh, -1);
        else if (tgt === 'chin') T = add(add(S.chin, S.fh, 2.6), S.uh, -2.4);
        else if (world) T = [(tgt[0] - tv.x) / (tv.k * e.facing), (tgt[1] - tv.y) / tv.k];
        else T = tgt;
        if (world) {
          // Out of reach: bend forward from the hips, up to about 35 degrees.
          const reach = B.upper + B.fore + B.hand - 1;
          for (let n = 0; n < 4 && j.lean < 0.6; n++) {
            const sh = w === 'N' ? S.shN : S.shF;
            const over = Math.hypot(T[0] - sh[0], T[1] - sh[1]) - reach;
            if (over <= 0) break;
            j.lean = Math.min(0.6, j.lean + over / B.torso);
            S = this.sideFrame(j);
          }
        }
        const r = ik2(w === 'N' ? S.shN : S.shF, T, B.upper, B.fore + B.hand);
        j['s' + w] = r.upper - j.lean;
        j['e' + w] = r.elbow;
        done[w] = true;
      }
    }

    solveFront(j, e, tv) {
      const want = [['B', e.target, true], ['B', j.ikB, false], ['A', e.targetFar, true], ['A', j.ikA, false]];
      const done = {};
      let F = null;
      for (const [w, tgt, world] of want) {
        if (!tgt || done[w]) continue;
        F = F || this.frontFrame(j);
        const s = w === 'A' ? -1 : 1;
        let T;
        if (tgt === 'ear') T = [F.headC[0] + s * 7, F.headC[1] + 2];
        else if (tgt === 'chin') T = [F.headC[0] + s * 2.5, F.headC[1] + 12];
        else if (tgt === 'hip') T = [s * 14.5 * this.bf, F.hipY - 5];
        else if (world) T = [(tgt[0] - tv.x) / tv.k, (tgt[1] - tv.y) / tv.k];
        else T = tgt;
        if (world) j['f' + w] = Math.min(j['f' + w] || 0, 0.35);
        j['ik' + w + 'on'] = 1;
        const S = w === 'A' ? F.shA : F.shB;
        const d = [T[0] - S[0], T[1] - S[1]];
        const g = 1 - 0.6 * Math.abs(j['f' + w] || 0);
        const L1 = B.upper * g, L2 = (B.fore + B.hand) * g;
        const dist = clamp(Math.hypot(d[0], d[1]), Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.05);
        const th = Math.atan2(s * d[0], d[1]);
        const al = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
        const be = Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
        // Of the two solutions keep the elbow further out from the body, or lower for a hand at the chin.
        const out = tgt === 'chin' ? Math.cos(th + al) >= Math.cos(th - al) : Math.sin(th + al) >= Math.sin(th - al);
        j['a' + w] = out ? th + al : th - al;
        j['e' + w] = out ? PI - be : -(PI - be);
        done[w] = true;
      }
    }

    /** Pose at time t for track entry i, blended from the entries before it. */
    poseAt(i, t, depth = 0) {
      const e = this.track[i];
      const own = this.poseOf(e, t);
      if (i === 0 || depth > 3) return own;
      const p = this.track[i - 1];
      if (p.view !== e.view) return own;
      const w = e.blend > 0 ? ease.inOutSine(seg(t, e.at, e.blend)) : 1;
      if (w >= 1) return own;
      const prev = this.poseAt(i - 1, t, depth + 1);
      const out = Object.assign({}, own);
      for (const key of Object.keys(e.view === 'side' ? ZS : ZF)) out[key] = lerp(prev[key] ?? 0, own[key] ?? 0, w);
      return out;
    }

    /** Everything needed to draw the figure at time t. */
    stateAt(t) {
      const tr = this.track;
      let i = 0;
      for (let n = 1; n < tr.length; n++) if (tr[n].at <= t) i = n;
      const e = tr[i], p = tr[Math.max(0, i - 1)];
      const tv = this.travel(e, t);
      let cur = i, squash = 1;
      if (i > 0 && (p.facing !== e.facing || p.view !== e.view)) {
        const tu = seg(t, e.at, this.turnDur);
        if (tu < 1) {
          squash = Math.max(0.04, Math.abs(Math.cos(PI * tu)));
          if (tu < 0.5) cur = i - 1;
        }
      }
      const ce = tr[cur];
      const j = this.poseAt(cur, t);
      const holdSwap = e.blend > 0 ? seg(t, e.at, e.blend) >= 0.5 : true;
      const he = cur === i && !holdSwap ? p : ce;
      return { x: tv.x, y: tv.y, k: tv.k, facing: ce.facing, view: ce.view, squash, j, hold: he.hold, holdFar: he.holdFar,
        moving: ce.pose === 'walk' || ce.pose === 'run', seat: ce.seat };
    }

    /* ---------------- Skeletons ---------------- */
    sideFrame(j, seat = this.seat) {
      const leg = (h, kn, fp) => {
        const knee = dn(h).map(v => v * B.thigh);
        const sA = h - kn;
        const ankle = add(knee, dn(sA), B.shin);
        const fd = dn(sA + PI / 2 + fp), nr = [-fd[1], fd[0]];
        return { knee, ankle, sA, fd, nr, heel: add(add(ankle, fd, -5.5), nr, B.ankle), toe: add(add(ankle, fd, 18), nr, B.ankle) };
      };
      let lN = leg(j.hN, j.kN, j.fN), lF = leg(j.hF, j.kF, j.fF);
      const standY = -Math.max(lN.heel[1], lN.toe[1], lF.heel[1], lF.toe[1]);
      const hipY = lerp(standY, -(seat + 9), j.sit) - j.y;
      if (j.sit > 0) {
        // Bend the knees so the feet reach the floor from the seat.
        const reachFloor = (h, kn, fp) => {
          const ky = hipY + Math.cos(h) * B.thigh, c = (-B.ankle - ky) / B.shin;
          if (Math.abs(c) > 1) return leg(h, kn, fp);
          return leg(h, lerp(kn, h - Math.acos(c) * 0.98, j.sit), fp);
        };
        lN = reachFloor(j.hN, j.kN, j.fN);
        lF = reachFloor(j.hF, j.kF, j.fF);
      }
      const hip = [0, hipY];
      for (const l of [lN, lF]) for (const key of ['knee', 'ankle', 'heel', 'toe']) l[key] = add(l[key], hip);
      const up = [Math.sin(j.lean), -Math.cos(j.lean)], fw = [Math.cos(j.lean), Math.sin(j.lean)];
      const neck = add(hip, up, B.torso);
      const shN = add(add(neck, up, -B.shoulderDrop + j.raise), fw, -0.8);
      const shF = add(add(shN, fw, -1.6), up, 0.6);
      const nA = j.lean + j.head * 0.35;
      const neckTop = add(neck, [Math.sin(nA), -Math.cos(nA)], B.neck);
      const hA = j.lean + j.head, uh = [Math.sin(hA), -Math.cos(hA)], fh = [Math.cos(hA), Math.sin(hA)];
      const headC = add(add(neckTop, uh, 10.5), fh, 0.8);
      const arm = (sh, s, e) => {
        const ua = j.lean + s, fa = ua + e;
        const el = add(sh, dn(ua), B.upper), wr = add(el, dn(fa), B.fore);
        return { sh, el, wr, hand: add(wr, dn(fa), B.hand), ua, fa };
      };
      return { hip, up, fw, neck, neckTop, headC, hA, uh, fh, shN, shF, lN, lF,
        ear: add(add(headC, fh, -1.8), uh, -0.8), chin: add(add(headC, uh, -9), fh, 5),
        aN: arm(shN, j.sN, j.eN), aF: arm(shF, j.sF, j.eF) };
    }

    frontFrame(j, seat = this.seat) {
      const bf = this.bf;
      const legs = [-1, 1].map(s => {
        const lift = s < 0 ? j.liftA : j.liftB, spread = s < 0 ? j.lA : j.lB;
        const hx = s * B.hipX * bf, thighL = B.thigh * (1 - 0.72 * j.sit) * (1 - 0.3 * lift);
        const knee = [hx + s * Math.sin(spread) * thighL + s * j.sit * 2.5, Math.cos(spread) * thighL];
        const shinL = B.shin * (1 - 0.12 * lift);
        return { s, hip: [hx, 0], knee, ankle: [knee[0] + s * Math.sin(spread) * 0.4 * shinL, knee[1] + shinL], lift };
      });
      const standY = -Math.max(...legs.map(l => l.ankle[1] + B.ankle));
      const hipY = lerp(standY, -(seat + 9), j.sit) - j.y;
      for (const l of legs) {
        for (const key of ['hip', 'knee', 'ankle']) l[key] = add(l[key], [0, hipY]);
        if (j.sit > 0) l.ankle[1] = lerp(l.ankle[1], -B.ankle, j.sit);
      }
      const neck = [Math.sin(j.tilt) * B.torso, hipY - Math.cos(j.tilt) * B.torso];
      const shY = neck[1] + B.shoulderDrop - j.raise;
      const shA = [neck[0] - B.shoulderX * bf, shY], shB = [neck[0] + B.shoulderX * bf, shY];
      const headC = [neck[0], neck[1] - B.neck - 10.6 + j.nod * 2.4];
      const out = (s, a) => [s * Math.sin(a), Math.cos(a)];
      const arm = (s, sh, a, e, f) => {
        const g = 1 - 0.6 * Math.abs(f), fa = a - e;
        const el = add(sh, out(s, a), B.upper * g), wr = add(el, out(s, fa), B.fore * g);
        return { s, sh, el, wr, hand: add(wr, out(s, fa), B.hand * g), f, fa };
      };
      return { hipY, neck, shA, shB, headC, legs, aA: arm(-1, shA, j.aA, j.eA, j.fA), aB: arm(1, shB, j.aB, j.eB, j.fB) };
    }

    /* ---------------- Draw ---------------- */
    draw(ctx, t, fx, scene) {
      const a = this.vis(t);
      if (a <= 0) return;
      const st = this.stateAt(t);
      const j = st.j;
      if (this.breathe && !st.moving) {
        const b = Math.sin(t * 1.55 + this.seed * 2.1);
        if (st.view === 'side') { j.lean += 0.006 * b; j.raise += 0.35 * (b + 1); }
        else j.raise += 0.35 * (b + 1);
      }
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(st.x, st.y);
      const g = this.glow;
      const amount = g ? (typeof g.amount === 'function' ? g.amount(t) : g.amount ?? 0.45) : 0;
      GLOW = g && st.view === 'side' && amount > 0
        ? { dir: g.dir || [1, 0.1], c0: UF.c(g.color || '#9fc0e8', amount), c1: UF.c(g.color || '#9fc0e8', 0) }
        : null;
      try {
        if (st.view === 'side') {
          ctx.scale(st.k * st.facing * st.squash, st.k);
          this.drawSide(ctx, j, st, t);
        } else {
          ctx.scale(st.k * st.squash, st.k);
          this.drawFront(ctx, j, st, t, st.view === 'back');
        }
      } finally {
        GLOW = null;
        ctx.restore();
      }
    }

    groundShadow(ctx, cx, rx) {
      if (!this.shadow) return;
      ctx.save();
      ctx.translate(cx, 0);
      ctx.scale(1, 0.2);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(0,0,0,${0.46 * (1 - this.dim * 0.5)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    /* ----- side view ----- */
    drawSide(ctx, j, st, t) {
      const S = this.sideFrame(j, st.seat);
      const M = this.mats, sy = this.style;
      const L = [this.L[0] * st.facing, this.L[1]];
      const cx = (S.lN.ankle[0] + S.lF.ankle[0]) / 2 + 5;
      this.groundShadow(ctx, cx, 30 + Math.abs(S.lN.ankle[0] - S.lF.ankle[0]) / 2);

      this.armSide(ctx, S.aF, 'far', L, st.holdFar, t);
      this.legSide(ctx, S.lF, S.hip, 'far', L);
      if (M.pack) this.packSide(ctx, S, L);
      this.legSide(ctx, S.lN, S.hip, 'near', L);
      this.torsoSide(ctx, S, j, L);
      const G0 = GLOW;
      if (G0) GLOW = Object.assign({}, G0, { dir: rot(G0.dir, -S.hA) });
      this.headSide(ctx, S, L);
      GLOW = G0;
      if (M.pack) this.strapSide(ctx, S);
      this.armSide(ctx, S.aN, 'near', L, st.hold, t);
    }

    tp(S, u, off) { return add(add(S.hip, S.up, u * B.torso), S.fw, off); }

    torsoPath(ctx, S, u0, u1) {
      const bf = this.bf, pts = [], N = 12;
      const belly = u => bf + (bf - 1) * 1.2 * Math.exp(-(((u - 0.32) / 0.2) ** 2));
      for (let i = 0; i <= N; i++) { const u = lerp(u0, u1, i / N); pts.push(this.tp(S, u, interp(PROFILE, u, 1) * belly(u))); }
      for (let i = N; i >= 0; i--) { const u = lerp(u0, u1, i / N); pts.push(this.tp(S, u, interp(PROFILE, u, 2) * bf)); }
      blob(ctx, pts);
    }

    torsoSide(ctx, S, j, L) {
      const M = this.mats, sy = this.style;
      const across = [this.tp(S, 0.5, 12), this.tp(S, 0.5, -11)];
      this.torsoPath(ctx, S, -0.2, 0.26);
      shaded(ctx, M.bottom.near, across[0], across[1], L);
      const hem = sy.tuck ? 0.07 : sy.hair === 'hood' ? -0.08 : -0.02;
      this.torsoPath(ctx, S, hem, 1);
      shaded(ctx, M.top.near, across[0], across[1], L);
      if (M.belt) { this.torsoPath(ctx, S, 0.07, 0.125); ctx.fillStyle = M.belt.near.base; ctx.fill(); }
      if (M.vest) {
        this.torsoPath(ctx, S, hem + 0.01, 0.93);
        shaded(ctx, M.vest.near, across[0], across[1], L);
        ctx.save();
        this.torsoPath(ctx, S, 0.5, 1);
        ctx.clip();
        ctx.beginPath();
        for (const p of [this.tp(S, 1.02, 14), this.tp(S, 1.02, 3.2), this.tp(S, 0.6, 9.6), this.tp(S, 0.56, 14)]) ctx.lineTo(p[0], p[1]);
        ctx.closePath();
        ctx.fillStyle = M.top.near.base;
        ctx.fill();
        ctx.restore();
      }
      if (sy.hair === 'hood') {
        // hood gathered on the back of the neck
        blob(ctx, [this.tp(S, 0.86, -6), this.tp(S, 1.06, -9.5), this.tp(S, 1.12, -4), this.tp(S, 0.98, 1)]);
        shaded(ctx, M.top.near, this.tp(S, 1, 0), this.tp(S, 1, -10), L);
      }
      // neck
      const neckM = sy.hair === 'hood' ? M.top.near : M.skin.near;
      limb(ctx, add(S.neck, S.fw, 0.6), S.neckTop, 5.2, 4.7, neckM, L);
      if (M.shirt) {
        blob(ctx, [this.tp(S, 0.94, 6.8), this.tp(S, 1.03, 5.2), this.tp(S, 1.0, -2), this.tp(S, 0.95, -1)]);
        ctx.fillStyle = M.shirt.near.base; ctx.fill();
      }
      if (M.tie) {
        ctx.beginPath();
        const p = [this.tp(S, 0.95, 5.6), this.tp(S, 0.95, 7.6), this.tp(S, 0.44, 11.8), this.tp(S, 0.42, 10)];
        ctx.moveTo(...p[0]); for (const q of p.slice(1)) ctx.lineTo(...q); ctx.closePath();
        ctx.fillStyle = M.tie.near.base; ctx.fill();
      }
      if (M.collar) {
        blob(ctx, [this.tp(S, 0.95, -7.2), this.tp(S, 1.02, -5.8), this.tp(S, 1.0, 1), this.tp(S, 0.98, 6.6), this.tp(S, 0.93, 7.4), this.tp(S, 0.96, 0)]);
        shaded(ctx, M.collar.near, this.tp(S, 1, 0), this.tp(S, 0.92, 0), L);
      }
      if (M.bow) {
        const c = this.tp(S, 0.975, 7.2);
        blob(ctx, [add(c, S.up, 2.2), add(add(c, S.fw, 1.6), S.up, 0.4), add(c, S.up, -2.2), add(add(c, S.fw, -1.2), S.up, 0)]);
        ctx.fillStyle = M.bow.near.base;
        ctx.fill();
      }
      if (M.lanyard) {
        const badge = this.tp(S, 0.58, 11.6);
        ctx.strokeStyle = M.lanyard.near.base;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(...this.tp(S, 0.99, 3.5));
        ctx.quadraticCurveTo(...this.tp(S, 0.8, 12.5), badge[0], badge[1]);
        ctx.stroke();
        ctx.save();
        ctx.translate(badge[0], badge[1]);
        ctx.rotate(j.lean);
        ctx.fillStyle = paint('#e8e4da', this, false).base;
        ctx.fillRect(-0.4, 0, 1.6, 6.4);
        ctx.fillStyle = M.lanyard.near.base;
        ctx.fillRect(-0.4, 0, 1.6, 1.4);
        ctx.restore();
      }
    }

    headSide(ctx, S, L) {
      const M = this.mats, hair = this.style.hair;
      ctx.save();
      ctx.translate(S.headC[0], S.headC[1]);
      ctx.rotate(S.hA);
      const Lh = rot(L, -S.hA);
      const fillPts = (pts, m, p0 = [-11, -6], p1 = [11, 6]) => { blob(ctx, pts); shaded(ctx, m, p0, p1, Lh); };
      if (hair === 'hood') {
        fillPts([[9.5, -6], [5.5, -13.6], [-4, -15], [-12.6, -9], [-13.8, 1], [-12.4, 10], [-8, 15.4], [-2, 12], [3, 9.5], [8.6, 6]], M.top.near);
        ellipse(ctx, [5.4, 1.4], 5.2, 8.6);
        ctx.fillStyle = M.void.near.base;
        ctx.fill();
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 11.6, 0, 0, TAU);
      ctx.moveTo(9.8, 5.4);
      ctx.ellipse(3.6, 5.4, 6.2, 5.4, 0, 0, TAU);
      ctx.moveTo(11.5, 0.8);
      ctx.ellipse(9.9, 0.8, 1.6, 2.3, 0.2, 0, TAU);
      shaded(ctx, M.skin.near, [-10, -4], [10, 4], Lh);
      ctx.strokeStyle = M.skin.near.dark;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(-3, 1.2, 1.6, 2.6, 0.15, -1.3, 1.9);
      ctx.stroke();
      if (hair === 'short' || hair === 'crop' || hair === 'long') fillPts(HAIR_SIDE[hair], M.hair.near);
      else if (hair === 'bun') { fillPts(HAIR_SIDE.short, M.hair.near); ellipse(ctx, [-8.8, -9.6], 4.4, 4.2); shaded(ctx, M.hair.near, [-13, -14], [-4, -5], Lh); }
      else if (hair === 'cap') {
        fillPts(HAIR_SIDE.nape, M.hair.near);
        fillPts([[9.2, -4.8], [7.6, -10.4], [0, -14], [-8.2, -11.2], [-11.6, -4.6], [-11, -2.2]], M.hat.near);
        ctx.beginPath(); ctx.moveTo(7.5, -5.6); ctx.lineTo(17.5, -4.2); ctx.lineTo(17.8, -2.8); ctx.lineTo(7.8, -3.4); ctx.closePath();
        ctx.fillStyle = M.hat.near.dark; ctx.fill();
      } else if (hair === 'peak') {
        fillPts(HAIR_SIDE.nape, M.hair.near);
        ctx.beginPath(); ctx.moveTo(-10.4, -4.2); ctx.lineTo(-11.6, -14.6); ctx.quadraticCurveTo(0, -16.4, 9.8, -15.2); ctx.lineTo(9.4, -4.4); ctx.closePath();
        shaded(ctx, M.hat.near, [-11, -10], [10, -10], Lh);
        ctx.fillStyle = M.hat.near.dark; ctx.fillRect(-10.6, -7.2, 20.2, 2.9);
        ctx.beginPath(); ctx.moveTo(7.8, -5.2); ctx.lineTo(16.6, -3.2); ctx.lineTo(16.4, -2.2); ctx.lineTo(7.8, -3.6); ctx.closePath();
        ctx.fillStyle = '#0b0c0e'; ctx.fill();
        ellipse(ctx, [9.2, -10.6], 1.3, 1.6); ctx.fillStyle = D.hexMix('#d9a441', '#07080a', this.dim); ctx.fill();
      }
      ctx.restore();
    }

    armSide(ctx, A, depth, L, item, t) {
      const M = this.mats, sy = this.style, bfa = 1 + (this.bf - 1) * 0.6;
      const top = M.top[depth], skin = M.skin[depth];
      const jacket = sy.sleeves !== 'short';
      if (jacket) {
        limb(ctx, A.sh, A.el, 5.3 * bfa, 4.7 * bfa, top, L);
        limb(ctx, A.el, A.wr, 4.6 * bfa, 3.7 * bfa, top, L);
        if (M.shirt) limb(ctx, add(A.wr, dn(A.fa), -1.6), A.wr, 3.7, 3.5, M.shirt[depth], L);
      } else {
        limb(ctx, A.sh, A.el, 4.9 * bfa, 4.3 * bfa, skin, L);
        limb(ctx, A.el, A.wr, 4.2 * bfa, 3.3 * bfa, skin, L);
        limb(ctx, A.sh, add(A.sh, dn(A.ua), B.upper * 0.55), 5.9 * bfa, 5.5 * bfa, top, L);
      }
      const ang = Math.atan2(Math.cos(A.fa), Math.sin(A.fa));
      if (item && UF.props) {
        ctx.save();
        ctx.translate(A.hand[0], A.hand[1]);
        UF.props.drawHeld(ctx, item, ang, t, this);
        ctx.restore();
      }
      const c = add(A.hand, dn(A.fa), -0.4);
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], 5, 3.8, ang, 0, TAU);
      const th = add(c, rot([-1.4, -2.9], ang));
      ctx.moveTo(th[0] + 2.4, th[1]);
      ctx.ellipse(th[0], th[1], 2.4, 1.5, ang - 0.5, 0, TAU);
      shaded(ctx, skin, add(A.hand, [-3, -3]), add(A.hand, [3, 3]), L);
    }

    legSide(ctx, l, hip, depth, L) {
      const M = this.mats, bfl = 1 + (this.bf - 1) * 0.7;
      const pants = M.bottom[depth], shoe = M.shoes[depth];
      limb(ctx, hip, l.knee, 8.2 * bfl, 6.4 * bfl, pants, L);
      limb(ctx, l.knee, add(l.ankle, dn(l.sA), -1), 6.3 * bfl, 4.6, pants, L);
      const { ankle: a, fd, nr } = l;
      const P = (f, n) => add(add(a, fd, f), nr, n);
      blob(ctx, [P(-6.4, 4.4), P(-4.8, -0.8), P(5, -1.9), P(15, 2.1), P(19.4, 4.6), P(18.4, 6.6), P(-5.4, 6.6)]);
      shaded(ctx, shoe, P(0, -2), P(0, 7), L);
      ctx.strokeStyle = shoe.dark;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(...P(-5.6, 6)); ctx.lineTo(...P(18.4, 6)); ctx.stroke();
    }

    packSide(ctx, S, L) {
      const m = this.mats.pack.near;
      blob(ctx, [this.tp(S, 0.92, -9), this.tp(S, 0.95, -19.5), this.tp(S, 0.66, -24.5), this.tp(S, 0.36, -23), this.tp(S, 0.3, -12)]);
      shaded(ctx, m, this.tp(S, 0.62, -9), this.tp(S, 0.62, -25), L);
      blob(ctx, [this.tp(S, 0.58, -22.5), this.tp(S, 0.55, -27), this.tp(S, 0.38, -26.4), this.tp(S, 0.38, -22)]);
      shaded(ctx, { base: m.base, lit: m.base, dark: m.dark, mid: 0.3 }, this.tp(S, 0.5, -22), this.tp(S, 0.5, -27), L);
    }
    strapSide(ctx, S) {
      ctx.strokeStyle = this.mats.pack.near.dark;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(...this.tp(S, 0.86, -9.5));
      ctx.quadraticCurveTo(...this.tp(S, 1.06, -1), ...this.tp(S, 0.94, 8.2));
      ctx.lineTo(...this.tp(S, 0.62, 10));
      ctx.stroke();
    }

    /* ----- front and back views ----- */
    drawFront(ctx, j, st, t, back) {
      const F = this.frontFrame(j, st.seat);
      const M = this.mats, sy = this.style;
      const L = this.L;
      this.groundShadow(ctx, 0, 34);
      const arms = [F.aA, F.aB];
      const items = { [-1]: st.holdFar, 1: st.hold };
      const behind = a => back && (a.f > 0.5 || j[(a.s < 0 ? 'ikAon' : 'ikBon')] === 1);
      for (const a of arms) if (behind(a)) this.armFront(ctx, a, L, items[a.s], t, true);
      for (const l of F.legs) this.legFront(ctx, l, L, back);
      this.torsoFront(ctx, F, L, back);
      if (back && M.pack) this.packBack(ctx, F, L);
      this.headFront(ctx, F, L, back);
      if (!back && M.pack) this.strapsFront(ctx, F);
      const across = [[-20 * this.bf, F.hipY - 25], [20 * this.bf, F.hipY - 25]];
      for (const a of arms) {
        if (behind(a)) continue;
        this.armFront(ctx, a, L, items[a.s], t, false);
        // shoulder cap in the torso's own gradient, so the arm grows out of the body rather than sitting on it
        ellipse(ctx, [a.sh[0] - a.s * 0.6, a.sh[1] - 0.4], 5.9 * (1 + (this.bf - 1) * 0.6), 5.4);
        shaded(ctx, M.top.near, across[0], across[1], L);
      }
    }

    torsoFront(ctx, F, L, back) {
      const M = this.mats, sy = this.style, bf = this.bf;
      const hip = [0, F.hipY], nk = F.neck;
      const at = (u, s) => { const c = [lerp(hip[0], nk[0], u), lerp(hip[1], nk[1], u)]; return [c[0] + s * interp(WIDTH, u, 1) * bf, c[1]]; };
      const path = (u0, u1) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) pts.push(at(lerp(u0, u1, i / 10), -1));
        for (let i = 10; i >= 0; i--) pts.push(at(lerp(u0, u1, i / 10), 1));
        blob(ctx, pts);
      };
      const across = [[-20 * bf, F.hipY - 25], [20 * bf, F.hipY - 25]];
      path(-0.2, 0.24);
      shaded(ctx, M.bottom.near, across[0], across[1], L);
      const hem = sy.tuck ? 0.07 : sy.hair === 'hood' ? -0.08 : -0.02;
      path(hem, 1);
      shaded(ctx, M.top.near, across[0], across[1], L);
      if (M.belt) { path(0.07, 0.125); ctx.fillStyle = M.belt.near.base; ctx.fill(); }
      if (M.vest) { path(hem + 0.01, back ? 0.95 : 0.92); shaded(ctx, M.vest.near, across[0], across[1], L); }
      const neckM = sy.hair === 'hood' ? M.top.near : M.skin.near;
      limb(ctx, [nk[0], nk[1] + 2], [F.headC[0], F.headC[1] + 8], 5, 4.6, neckM, L);
      const ny = nk[1];
      if (back) {
        if (M.collar) { ctx.strokeStyle = M.collar.near.base; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-6.2, ny + 0.6); ctx.quadraticCurveTo(0, ny + 2.6, 6.2, ny + 0.6); ctx.stroke(); }
        return;
      }
      if (M.vest) {
        ctx.beginPath(); ctx.moveTo(-6.4, ny + 0.4); ctx.lineTo(6.4, ny + 0.4); ctx.lineTo(0, ny + 24); ctx.closePath();
        ctx.fillStyle = M.top.near.base; ctx.fill();
        ctx.fillStyle = M.vest.near.lit;
        for (let i = 0; i < 3; i++) { ellipse(ctx, [0, ny + 27 + i * 5], 0.7, 0.7); ctx.fill(); }
      }
      if (M.bow) {
        ctx.beginPath();
        ctx.moveTo(0, ny + 2.6); ctx.lineTo(-4.4, ny + 0.6); ctx.lineTo(-4.4, ny + 4.6); ctx.closePath();
        ctx.moveTo(0, ny + 2.6); ctx.lineTo(4.4, ny + 0.6); ctx.lineTo(4.4, ny + 4.6); ctx.closePath();
        ctx.fillStyle = M.bow.near.base; ctx.fill();
        ellipse(ctx, [0, ny + 2.6], 1.1, 1.1); ctx.fill();
      }
      if (M.shirt) {
        ctx.beginPath(); ctx.moveTo(-5.4, ny + 0.4); ctx.lineTo(5.4, ny + 0.4); ctx.lineTo(0, ny + 14); ctx.closePath();
        ctx.fillStyle = M.shirt.near.base; ctx.fill();
      }
      if (M.tie) {
        ctx.beginPath();
        ctx.moveTo(-1.5, ny + 1.6); ctx.lineTo(1.5, ny + 1.6); ctx.lineTo(1.1, ny + 4.4); ctx.lineTo(2.5, ny + 26); ctx.lineTo(0, ny + 29.5);
        ctx.lineTo(-2.5, ny + 26); ctx.lineTo(-1.1, ny + 4.4); ctx.closePath();
        shaded(ctx, M.tie.near, [-2.5, ny], [2.5, ny], L);
      }
      if (M.collar) { ctx.strokeStyle = M.collar.near.base; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-7, ny + 0.4); ctx.lineTo(0, ny + 6.6); ctx.lineTo(7, ny + 0.4); ctx.stroke(); }
      if (M.lanyard) {
        ctx.strokeStyle = M.lanyard.near.base; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-5.4, ny + 0.6); ctx.lineTo(0, ny + 20); ctx.lineTo(5.4, ny + 0.6); ctx.stroke();
        ctx.fillStyle = paint('#e8e4da', this, false).base; ctx.fillRect(-2.8, ny + 20, 5.6, 7.4);
        ctx.fillStyle = M.lanyard.near.base; ctx.fillRect(-2.8, ny + 20, 5.6, 1.6);
      }
      if (this.role === 'police') {
        ctx.strokeStyle = M.top.near.dark; ctx.lineWidth = 0.5;
        for (const s of [-1, 1]) ctx.strokeRect(s * 9.5 - 3, ny + 13, 6, 5.5);
      }
    }

    headFront(ctx, F, L, back) {
      const M = this.mats, hair = this.style.hair;
      ctx.save();
      ctx.translate(F.headC[0], F.headC[1]);
      const fill = (pts, m) => { blob(ctx, pts); shaded(ctx, m, [-11, -4], [11, 4], L); };
      if (hair === 'hood') {
        fill(HOOD_FRONT, M.top.near);
        if (!back) { ellipse(ctx, [0, 1.8], 6.6, 9.4); ctx.fillStyle = M.void.near.base; ctx.fill(); }
        else { ctx.strokeStyle = M.top.near.dark; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, -14.6); ctx.lineTo(0, 15); ctx.stroke(); }
        ctx.restore();
        return;
      }
      for (const s of [-1, 1]) { ellipse(ctx, [s * 8.9, 0.8], 1.8, 3); ctx.fillStyle = M.skin.near.dark; ctx.fill(); }
      fill(HEAD_FRONT, M.skin.near);
      if (hair === 'short' || hair === 'crop') fill(back ? HAIR_FRONT.backShort : HAIR_FRONT[hair], M.hair.near);
      else if (hair === 'long') fill(back ? HAIR_FRONT.backLong : HAIR_FRONT.long, M.hair.near);
      else if (hair === 'bun') {
        fill(back ? HAIR_FRONT.backShort : HAIR_FRONT.short, M.hair.near);
        ellipse(ctx, back ? [0, -8.4] : [0, -13.6], 4.2, 4); shaded(ctx, M.hair.near, [-4, -16], [4, -9], L);
      } else if (hair === 'cap' || hair === 'peak') {
        if (back) fill(HAIR_FRONT.nape, M.hair.near);
        if (hair === 'cap') {
          fill([[-9.6, -3], [-9.2, -9], [-5, -12.8], [0, -13.8], [5, -12.8], [9.2, -9], [9.6, -3]], M.hat.near);
          if (!back) { ellipse(ctx, [0, -3.4], 10.6, 2.6); ctx.fillStyle = M.hat.near.dark; ctx.fill(); }
        } else {
          ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-11.8, -14.2); ctx.quadraticCurveTo(0, -16, 11.8, -14.2); ctx.lineTo(10, -4); ctx.closePath();
          shaded(ctx, M.hat.near, [-12, -9], [12, -9], L);
          ctx.fillStyle = M.hat.near.dark; ctx.fillRect(-10.3, -7, 20.6, 3);
          if (!back) {
            ellipse(ctx, [0, -3.6], 9.8, 2.4); ctx.fillStyle = '#0b0c0e'; ctx.fill();
            ellipse(ctx, [0, -10.4], 1.6, 1.9); ctx.fillStyle = D.hexMix('#d9a441', '#07080a', this.dim); ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    armFront(ctx, A, L, item, t, behind) {
      const M = this.mats, sy = this.style, bfa = 1 + (this.bf - 1) * 0.6;
      const depth = behind ? 'far' : 'near';
      const top = M.top[depth], skin = M.skin[depth];
      if (sy.sleeves !== 'short') {
        limb(ctx, A.sh, A.el, 5.4 * bfa, 4.7 * bfa, top, L);
        limb(ctx, A.el, A.wr, 4.7 * bfa, 3.8 * bfa, top, L);
        if (M.shirt) limb(ctx, [lerp(A.el[0], A.wr[0], 0.9), lerp(A.el[1], A.wr[1], 0.9)], A.wr, 3.8, 3.6, M.shirt[depth], L);
      } else {
        limb(ctx, A.sh, A.el, 5 * bfa, 4.4 * bfa, skin, L);
        limb(ctx, A.el, A.wr, 4.2 * bfa, 3.3 * bfa, skin, L);
        limb(ctx, A.sh, [lerp(A.sh[0], A.el[0], 0.55), lerp(A.sh[1], A.el[1], 0.55)], 6.2 * bfa, 5.7 * bfa, top, L);
      }
      const dir = [A.hand[0] - A.wr[0], A.hand[1] - A.wr[1]];
      const ang = Math.atan2(dir[1], dir[0]);
      if (item && UF.props) {
        ctx.save();
        ctx.translate(A.hand[0], A.hand[1]);
        UF.props.drawHeld(ctx, item, ang, t, this);
        ctx.restore();
      }
      const g = 1 - 0.35 * Math.abs(A.f);
      ellipse(ctx, A.hand, 4.7 * g, 4, ang);
      shaded(ctx, skin, add(A.hand, [-3, -3]), add(A.hand, [3, 3]), L);
    }

    legFront(ctx, l, L, back) {
      const M = this.mats, bfl = 1 + (this.bf - 1) * 0.7;
      limb(ctx, l.hip, l.knee, 8.2 * bfl, 6.6 * bfl, M.bottom.near, L);
      limb(ctx, l.knee, l.ankle, 6.4 * bfl, 4.8, M.bottom.near, L);
      const c = add(l.ankle, [l.s * 0.8, back ? 4.4 : 4.8]);
      ellipse(ctx, c, back ? 4.8 : 5.4, back ? 4.2 : 3.8);
      shaded(ctx, M.shoes.near, add(c, [-5, -4]), add(c, [5, 4]), L);
    }

    packBack(ctx, F, L) {
      const m = this.mats.pack.near, y0 = F.neck[1] + 8, y1 = F.hipY - 6;
      ctx.beginPath();
      D.roundRect(ctx, -15, y0, 30, y1 - y0, 6);
      shaded(ctx, m, [-15, y0], [15, y1], L);
      ctx.beginPath();
      D.roundRect(ctx, -11, lerp(y0, y1, 0.5), 22, (y1 - y0) * 0.38, 4);
      ctx.fillStyle = m.dark; ctx.globalAlpha *= 0.55; ctx.fill(); ctx.globalAlpha /= 0.55;
      ctx.strokeStyle = m.lit; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(-10, lerp(y0, y1, 0.16)); ctx.quadraticCurveTo(0, lerp(y0, y1, 0.08), 10, lerp(y0, y1, 0.16)); ctx.stroke();
      ctx.strokeStyle = m.dark; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-6, y0 + 1); ctx.quadraticCurveTo(-4, y0 - 6, 0, y0 - 7); ctx.quadraticCurveTo(4, y0 - 6, 6, y0 + 1); ctx.stroke();
    }
    strapsFront(ctx, F) {
      ctx.strokeStyle = this.mats.pack.near.dark;
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 10.5, F.neck[1] + 2.5);
        ctx.quadraticCurveTo(s * 12.5, F.neck[1] + 16, s * 12, F.neck[1] + 28);
        ctx.stroke();
      }
    }

    editorial() { return { illustration: true }; }
  }

  Character.roles = Object.keys(ROLES);
  Character.poses = { side: ['walk', 'run', ...Object.keys(SIDE)], front: ['walk', 'run', ...Object.keys(FRONT)] };
  Character.hair = HAIR;
  UF.Character = Character;
})(window.UF);
