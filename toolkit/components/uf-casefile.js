/*!
 * Unfiction GFX Toolkit — Case File
 * The recurring investigation board: one case, many returns, always the same board.
 *
 * Three pieces:
 *
 *   UF.CaseFile       the board's contents, written once per episode (usually in case-file.js).
 *                     Every element names the script line it appears at, so any board scene can
 *                     render the board exactly as it stands at that line.
 *   UF.CaseFileBoard  one board beat: the slate board full-screen, with camera, focus, pulses,
 *                     the CASE FILE counter, THE MONEY ledger, the thread legend and the portal
 *                     (dive into a card / shrink back into it).
 *   UF.CaseFileWall   the same board drawn small on the narrator room's wall, for wide shots.
 *
 *   const CASE = new UF.CaseFile({
 *     title: 'CASE FILE · COSMOS BANK',
 *     width: 3400, height: 1500,
 *     columns: [{ label: 'THE KEYBOARD' }, ...], rows: [{ label: 'DIGITAL' }, ...],
 *     slots: [
 *       { id: '06', col: 2, row: 1, kind: 'figure', figures: 1, at: 'L28', question: 'WHO RAN THE CREWS ABROAD?',
 *         label: 'FIXER', title: 'BIG BOSS', sub: 'DARK-WEB FORUM · 2018',
 *         stamps: [{ text: 'PLEADED GUILTY\n11 YRS 8 MO', tone: 'guilty', at: 'L68' }],
 *         clips:  [{ text: 'ORDERED ≠ RECOVERED', tone: 'red', at: 'L68' }],
 *         flip:   { at: 'L68', title: 'GHALEB ALAUMARY', sub: 'CANADA' },
 *         fan:    { at: 'L64', until: 'L68', items: [{ title: 'G', dx: -300, dy: -120 }, ...], note: { title: 'SAME EMAIL', dx: 0, dy: 230 } } },
 *     ],
 *     threads: [{ id: 'bb-crews', from: '06', to: '09', type: 'people', at: 'L46', label: 'CREWS · US + CANADA' }],
 *     ledger:  { title: 'THE MONEY', rows: [{ id: 'visa', label: 'VISA ATMS ABROAD', value: '₹78.00 CR', at: 'L46' }] },
 *   });
 *
 *   new UF.CaseFileBoard({ file: CASE, line: 'L28',
 *     cues:   { '06': 1.2, 'bb-loose': 2.6 },          // when this line's new elements land (scene seconds)
 *     camera: [{ t: 0, center: 'all' }, { t: 1, center: '06', dur: 1.6 }],
 *     focus:  [{ at: 3, dur: 4, ids: ['06'] }],
 *     pulses: [{ at: 5, path: ['01', '08', '07'] }],
 *     portal: { dir: 'in', slot: '01', at: 8, image: 'atm-still' } })
 *
 * Timing model
 *   An element whose line is before the scene's line is already on the board; one at a later line is not
 *   there yet (a counted slot shows as a blank outline with its question). Elements introduced at the
 *   scene's own line animate in at their cue, or every `autoStep` seconds from `autoStart` when uncued.
 *   `until` removes an element; cue its exit with 'id:out'. Clips take 'id:strike', threads 'id:mute'.
 *   Lines are 'L28', or 'L28b' for a second board beat on the same line.
 *
 * Slot kinds: 'doc' (paper file), 'photo' (16:9 still or placeholder glyph), 'figure' (silhouettes,
 * never faces), 'tag' (a figure such as an amount), 'note' (a small charcoal or paper card).
 * Thread types: 'data' (blue), 'people' (gold), 'money' (red), 'alleged' (grey, dashed).
 * Stamp and clip tones: convicted, guilty, charged, wanted, alleged, victim, frozen, returned, neutral,
 * or a colour name (red, blue, gold, green, grey).
 */
(function (UF) {
  'use strict';

  const { c, clamp, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const RAD = Math.PI / 180;

  const PAPER = '#e9e3d6', INK = '#1d1b18';
  const CHALK = a => `rgba(232,228,218,${a})`;
  const THREADS = {
    data:    { color: '#5b9ae0', dash: null, label: 'DATA · COMMANDS' },
    people:  { color: '#d9a441', dash: null, label: 'PEOPLE · RECRUITED' },
    money:   { color: '#dd4b4b', dash: null, label: 'MONEY' },
    alleged: { color: '#9aa3b0', dash: [11, 9], label: 'ALLEGED · NOT PROVEN' },
  };
  const TONES = {
    convicted: '#dd4b4b', guilty: '#dd4b4b', charged: '#d9a441', wanted: '#d9a441', alleged: '#9aa3b0',
    victim: '#5b9ae0', frozen: '#5b9ae0', returned: '#4caf7a', neutral: PAPER,
    red: '#dd4b4b', blue: '#5b9ae0', gold: '#d9a441', green: '#4caf7a', grey: '#9aa3b0', paper: PAPER,
  };
  const tone = n => TONES[n] || c(n || 'paper');
  const SIZES = { doc: [290, 196], photo: [320, 250], figure: [300, 250], tag: [270, 150], note: [250, 104] };
  const PARTS = ['out', 'strike', 'mute'];

  function lineNum(v) {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    const m = /^L?(\d+)([a-z]?)$/i.exec(String(v).trim());
    if (!m) throw new Error(`CaseFile: "${v}" is not a script line — use 'L28', or 'L28b' for a second beat on L28.`);
    return +m[1] + (m[2] ? (m[2].toLowerCase().charCodeAt(0) - 96) / 10 : 0);
  }
  const lineName = n => (n == null ? 'the start' : `L${Math.floor(n)}${n % 1 ? String.fromCharCode(96 + Math.round((n % 1) * 10)) : ''}`);

  function imageReady(img) { return !!img && img.complete && img.naturalWidth > 0; }

  /**
   * An impact cue: same time and shake as before, with the colour split cut to a quarter. The board
   * keeps its punch through light and motion, not through chromatic aberration.
   */
  function kick(fx, t, at, o) {
    return fx.kick(t, at, Object.assign({}, o, { rgb: (o.rgb || 0) * 0.25 }));
  }

  /** Stamps whose status is final. Only these close a card with a solid rule. */
  const SOLVED = ['convicted', 'guilty', 'returned'];

  function drawCover(x, img, rx, ry, rw, rh, ay = 0.5) {
    const s = Math.max(rw / img.naturalWidth, rh / img.naturalHeight);
    const sw = rw / s, sh = rh / s;
    x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * ay, sw, sh, rx, ry, rw, rh);
  }

  /** Where the ray from the card's centre towards (tx, ty) leaves the card, `pad` px outside it. */
  function edgePoint(s, tx, ty, pad = 7) {
    const dx = tx - s.x, dy = ty - s.y;
    if (!dx && !dy) return [s.x, s.y];
    const k = Math.min((s.w / 2 + pad) / Math.abs(dx || 1e-9), (s.h / 2 + pad) / Math.abs(dy || 1e-9));
    return [s.x + dx * k, s.y + dy * k];
  }

  /** The 16:9 picture window of a photo or figure card, in board units. */
  function windowRect(s) {
    const ww = s.w - 20;
    return [s.x - ww / 2, s.y - s.h / 2 + 10, ww, ww * 9 / 16];
  }

  /* ================================================================== */
  /* Shared bitmaps                                                      */
  /* ================================================================== */
  let slateTile = null, vignetteSprite = null;

  /**
   * The board itself: a matte, dark fibreboard. Fine grain only (no clouds, no smears), so the
   * surface reads as a physical material and lets the cards and threads be the sharp things.
   */
  function slate() {
    if (slateTile) return slateTile;
    const S = 1024, cv = UF.canvas(S, S), x = cv.getContext('2d'), r = UF.rng(4127);
    x.fillStyle = '#16191e';
    x.fillRect(0, 0, S, S);
    // Long, faint fibre streaks along the board's grain, a few px tall, wrapped at the tile edge.
    x.lineCap = 'butt';
    // Few, broken and irregular, so they read as the grain of the board rather than as lines across the frame.
    for (let i = 0; i < 180; i++) {
      const py = r() * S, px = r() * S, len = 90 + r() * 300, light = r() < 0.45;
      x.strokeStyle = light ? `rgba(210,220,232,${0.006 + r() * 0.01})` : `rgba(0,0,0,${0.05 + r() * 0.06})`;
      x.lineWidth = 0.5 + r() * 0.9;
      for (const ox of [0, -S, S]) {
        x.beginPath();
        x.moveTo(px + ox, py);
        x.lineTo(px + ox + len * 0.5, py + (r() - 0.5) * 1.6);
        x.lineTo(px + ox + len, py + (r() - 0.5) * 2.2);
        x.stroke();
      }
    }
    // Fine tooth: single pixels, so the surface is not flat without looking noisy.
    for (let i = 0; i < 5200; i++) {
      x.fillStyle = r() < 0.6 ? `rgba(222,228,236,${0.012 + r() * 0.02})` : `rgba(0,0,0,${0.08 + r() * 0.08})`;
      x.fillRect(r() * S, r() * S, 1, 1);
    }
    return (slateTile = cv);
  }

  /**
   * Light and falloff, drawn once at quarter resolution. A warm key from the top left, a cool rim on the
   * right edge, and a darker frame so the cards separate from the board. Light only: nothing blurs.
   */
  function vignette() {
    if (vignetteSprite) return vignetteSprite;
    const cv = UF.canvas(W / 4, H / 4), x = cv.getContext('2d');
    const cx = W / 8, cy = H / 8;
    const g = x.createRadialGradient(cx, cy, W * 0.16, cx, cy, W * 0.36);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, 'rgba(0,0,0,.42)');
    g.addColorStop(1, 'rgba(0,0,0,.72)');
    x.fillStyle = g;
    x.fillRect(0, 0, cv.width, cv.height);
    const key = x.createRadialGradient(0, -H * 0.05 / 4, 2, 0, -H * 0.05 / 4, W * 0.42 / 4);
    key.addColorStop(0, 'rgba(255,214,160,.085)');
    key.addColorStop(1, 'rgba(255,214,160,0)');
    x.fillStyle = key;
    x.fillRect(0, 0, cv.width, cv.height);
    const rim = x.createRadialGradient(cv.width, cv.height * 0.3, 2, cv.width, cv.height * 0.3, W * 0.2 / 4);
    rim.addColorStop(0, 'rgba(150,190,240,.07)');
    rim.addColorStop(1, 'rgba(150,190,240,0)');
    x.fillStyle = rim;
    x.fillRect(0, 0, cv.width, cv.height);
    return (vignetteSprite = cv);
  }

  /**
   * A card's shadow: a tight contact line under the edge plus a longer ambient falloff. Both are sharp
   * enough to read as a physical card lying on a surface, not a glow.
   */
  const shadows = {};
  function shadowSprite(w, h) {
    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (shadows[key]) return shadows[key];
    const m = 48, cv = UF.canvas(w + m * 2, h + m * 2), x = cv.getContext('2d');
    x.filter = 'blur(12px)';
    x.fillStyle = 'rgba(0,0,0,.42)';
    D.roundRect(x, m, m + 10, w, h, 3);
    x.fill();
    x.filter = 'blur(2.5px)';
    x.fillStyle = 'rgba(0,0,0,.8)';
    D.roundRect(x, m + 1, m + 3, w - 2, h, 2);
    x.fill();
    x.filter = 'none';
    return (shadows[key] = cv);
  }

  /* ================================================================== */
  /* Card faces                                                          */
  /* ================================================================== */
  /** Glyphs drawn in a 100-unit box, for things the shared icon set has no clean shape for. */
  const GLYPHS = {
    card(x) {
      D.roundRect(x, 8, 22, 84, 56, 7); x.stroke();
      x.strokeRect(18, 38, 18, 14);
      x.beginPath(); x.moveTo(18, 64); x.lineTo(58, 64); x.moveTo(64, 64); x.lineTo(80, 64); x.stroke();
    },
    atm(x) {
      x.strokeRect(18, 8, 64, 84);
      x.strokeRect(28, 18, 44, 28);
      x.beginPath(); x.moveTo(34, 58); x.lineTo(66, 58); x.stroke();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) x.strokeRect(36 + i * 10, 64 + j * 8, 5, 4);
    },
    switch(x) {
      x.strokeRect(10, 34, 80, 32);
      for (const px of [24, 38, 52]) { x.beginPath(); x.arc(px, 50, 4, 0, Math.PI * 2); x.stroke(); }
      x.beginPath(); x.moveTo(64, 44); x.lineTo(80, 44); x.moveTo(64, 56); x.lineTo(80, 56);
      x.moveTo(50, 34); x.lineTo(50, 16); x.moveTo(50, 66); x.lineTo(50, 84); x.stroke();
    },
  };
  function glyph(x, name, cx, cy, size, color, width = 3) {
    if (!GLYPHS[name]) { D.icon(x, name, cx, cy, size, { color, width }); return; }
    x.save();
    x.translate(cx - size / 2, cy - size / 2);
    x.scale(size / 100, size / 100);
    x.strokeStyle = color;
    x.lineWidth = width * 100 / size;
    x.lineJoin = 'round';
    x.lineCap = 'round';
    GLYPHS[name](x);
    x.restore();
  }

  function charcoal(x, w, h, accent) {
    const g = x.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, '#2a3038');
    g.addColorStop(1, '#171a20');
    x.fillStyle = g;
    D.roundRect(x, -w / 2, -h / 2, w, h, 3);
    x.fill();
    // Bevel: a lit top edge and a shadowed bottom edge, as a cut card would catch the key light.
    x.strokeStyle = 'rgba(255,240,215,.16)';
    x.lineWidth = 1;
    D.roundRect(x, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, 3);
    x.stroke();
    x.fillStyle = 'rgba(0,0,0,.4)';
    x.fillRect(-w / 2 + 2, h / 2 - 2, w - 4, 2);
    if (accent) { x.fillStyle = accent; x.fillRect(-w / 2, -h / 2, w, 3); }
  }

  /**
   * Paper stock: warm off-white with fine fibres, a worn edge that has darkened with handling, and
   * sometimes a single soft fold. Cached per card, so the work is paid once.
   */
  const sheets = new Map();
  function paperSheet(w, h, seed, tone) {
    const key = `${Math.round(w)}x${Math.round(h)}:${seed}:${tone}`;
    if (sheets.has(key)) return sheets.get(key);
    const cv = UF.canvas(Math.round(w), Math.round(h)), x = cv.getContext('2d'), r = UF.rng(seed * 13 + 5);
    const W0 = cv.width, H0 = cv.height;
    x.fillStyle = tone;
    x.fillRect(0, 0, W0, H0);
    // Fibres: short, faint, directional, sharp at the pixel level.
    for (let i = 0; i < W0 * H0 / 520; i++) {
      const px = r() * W0, py = r() * H0, a = (r() - 0.5) * 0.6 + (r() < 0.5 ? 0 : Math.PI / 2);
      const len = 2 + r() * 6;
      x.strokeStyle = r() < 0.7 ? 'rgba(90,76,56,.07)' : 'rgba(255,255,255,.22)';
      x.lineWidth = 0.6;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke();
    }
    // Handled edges: a thin darker band that fades inward.
    const band = (x0, y0, x1, y1) => {
      const g = x.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(96,74,44,.16)');
      g.addColorStop(1, 'rgba(96,74,44,0)');
      return g;
    };
    x.fillStyle = band(0, 0, 0, 9); x.fillRect(0, 0, W0, 9);
    x.fillStyle = band(0, H0, 0, H0 - 12); x.fillRect(0, H0 - 12, W0, 12);
    x.fillStyle = band(0, 0, 10, 0); x.fillRect(0, 0, 10, H0);
    x.fillStyle = band(W0, 0, W0 - 9, 0); x.fillRect(W0 - 9, 0, 9, H0);
    // One soft fold on half the sheets: a light ridge with a shadow beside it.
    if (r() < 0.5) {
      const fy = H0 * (0.3 + r() * 0.4);
      x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, fy, W0, 1.2);
      x.fillStyle = 'rgba(70,56,36,.1)'; x.fillRect(0, fy + 1.2, W0, 1.4);
    }
    sheets.set(key, cv);
    return cv;
  }

  /**
   * Physical attachments drawn on the card's face: paper cards are held by tape at two top corners;
   * pictures, figures and tags by a drawing pin. Chosen per card from its seed, so each card keeps its own.
   */
  function attachment(ctx, s, back) {
    const kind = back ? s.flip.kind : s.kind;
    const paper = kind === 'doc' || (kind === 'note' && !!(back ? s.flip.paper : s.paper));
    const { w, h } = s;
    const sd = (s.seed * 9301 + 49297) % 233280;
    if (paper) {
      const tapes = [[-w / 2 + 30, -h / 2 + 2, -0.42], [w / 2 - 30, -h / 2 + 2, 0.38]];
      for (const [tx, ty, ang] of (sd % 3 === 0 ? [tapes[0]] : tapes)) {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(40,34,24,.18)';
        ctx.fillRect(-32 + 1, -10 + 2, 64, 20);
        ctx.fillStyle = 'rgba(236,228,200,.62)';
        ctx.fillRect(-32, -10, 64, 20);
        ctx.fillStyle = 'rgba(255,255,255,.14)';
        ctx.fillRect(-32, -10, 64, 2);
        ctx.restore();
      }
    } else {
      const brass = sd % 2 === 0;
      const hx = 0, hy = -h / 2 + 5;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.beginPath(); ctx.arc(hx + 1.5, hy + 2.5, 5.5, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(hx - 1.5, hy - 1.5, 0.5, hx, hy, 5.5);
      if (brass) { g.addColorStop(0, '#f2dca6'); g.addColorStop(0.6, '#b8914a'); g.addColorStop(1, '#6e5426'); }
      else { g.addColorStop(0, '#f08a7c'); g.addColorStop(0.6, '#b8453a'); g.addColorStop(1, '#6a2620'); }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function header(x, f, w, h, index, dark) {
    const col = dark ? CHALK(0.5) : 'rgba(29,27,24,.55)';
    x.font = UF.font.mono(12, 'bold');
    if (index) D.text(x, index, -w / 2 + 16, -h / 2 + 25, { color: col, spacing: 2 });
    if (f.label) D.text(x, D.fit(x, f.label.toUpperCase(), w - 80, 2), w / 2 - 16, -h / 2 + 25, { color: col, spacing: 2, align: 'right' });
    x.fillStyle = dark ? CHALK(0.1) : 'rgba(29,27,24,.16)';
    x.fillRect(-w / 2 + 16, -h / 2 + 35, w - 32, 1);
  }

  /** Largest of `sizes` at which `text` fits on at most `maxLines` lines. */
  function fitLines(x, text, maxW, sizes, maxLines, font = UF.font.display) {
    for (const s of sizes) {
      x.font = font(s);
      const lines = D.wrapBalanced(x, text, maxW);
      if (lines.length <= maxLines && lines.every(l => x.measureText(l).width <= maxW)) return { lines, size: s };
    }
    const s = sizes[sizes.length - 1];
    x.font = font(s);
    return { lines: D.wrapBalanced(x, text, maxW).slice(0, maxLines).map(l => D.fit(x, l, maxW)), size: s };
  }

  function silhouette(x, cx, base, r, k) {
    const g = x.createLinearGradient(cx, base - r * 5, cx, base);
    g.addColorStop(0, UF.mix('#5d6876', '#46505c', k));
    g.addColorStop(1, '#262c34');
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, base - r * 3.55, r, 0, Math.PI * 2);
    x.moveTo(cx - r * 2.7, base + 2);
    x.bezierCurveTo(cx - r * 2.7, base - r * 1.5, cx - r * 1.5, base - r * 2.3, cx, base - r * 2.35);
    x.bezierCurveTo(cx + r * 1.5, base - r * 2.3, cx + r * 2.7, base - r * 1.5, cx + r * 2.7, base + 2);
    x.closePath();
    x.fill();
    x.strokeStyle = 'rgba(225,235,250,.4)';
    x.lineWidth = 1.4;
    x.beginPath(); x.arc(cx, base - r * 3.55, r - 0.8, -1.25, 0.55); x.stroke();
    x.beginPath(); x.moveTo(cx + r * 0.6, base - r * 2.33); x.bezierCurveTo(cx + r * 1.6, base - r * 2.2, cx + r * 2.5, base - r * 1.5, cx + r * 2.62, base - r * 0.6); x.stroke();
  }

  function picture(x, f, s, kind, wx, wy, ww, wh) {
    x.save();
    x.beginPath(); x.rect(wx, wy, ww, wh); x.clip();
    // A studio backdrop: a hard-edged key beam from the top left over a dark, even ground.
    const bg = x.createLinearGradient(wx, wy, wx + ww * 0.35, wy + wh);
    bg.addColorStop(0, kind === 'figure' ? '#434d5b' : '#303843');
    bg.addColorStop(1, '#0c0f13');
    x.fillStyle = bg;
    x.fillRect(wx, wy, ww, wh);
    const beam = x.createLinearGradient(wx + ww * 0.2, wy, wx + ww * 0.6, wy + wh);
    beam.addColorStop(0, 'rgba(255,226,180,.07)');
    beam.addColorStop(1, 'rgba(255,226,180,0)');
    x.fillStyle = beam;
    x.beginPath();
    x.moveTo(wx + ww * 0.1, wy); x.lineTo(wx + ww * 0.42, wy);
    x.lineTo(wx + ww * 0.8, wy + wh); x.lineTo(wx + ww * 0.36, wy + wh);
    x.closePath(); x.fill();
    const img = f.image ? UF.images[f.image] : null;
    if (kind === 'photo' && imageReady(img)) {
      x.filter = 'grayscale(.85) contrast(1.06) brightness(.92)';
      drawCover(x, img, wx, wy, ww, wh, f.imageY ?? 0.5);
      x.filter = 'none';
    } else if (kind === 'figure') {
      const n = clamp(f.figures || 1, 1, 3), r = wh * 0.13;
      const spots = n === 1 ? [[0, 1]] : n === 2 ? [[-0.17, 0.92], [0.17, 1]] : [[-0.27, 0.86], [0.27, 0.9], [0, 1]];
      spots.forEach(([dx, sc], i) => silhouette(x, wx + ww / 2 + dx * ww, wy + wh + 4, r * sc, i / 3));
    } else {
      glyph(x, f.icon || 'atm', wx + ww / 2, wy + wh / 2, wh * 0.5, CHALK(0.32), 3);
    }
    const shade = x.createLinearGradient(0, wy, 0, wy + wh);
    shade.addColorStop(0, 'rgba(0,0,0,.25)');
    shade.addColorStop(0.3, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.35)');
    x.fillStyle = shade;
    x.fillRect(wx, wy, ww, wh);
    x.restore();
    x.strokeStyle = 'rgba(255,255,255,.07)';
    x.lineWidth = 1;
    x.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);
    const chip = (text, right) => {
      x.font = UF.font.mono(11, 'bold');
      const tw = D.measure(x, text, 2) + 14;
      const cx = right ? wx + ww - 8 - tw : wx + 8;
      x.fillStyle = 'rgba(8,10,13,.72)';
      x.fillRect(cx, wy + 8, tw, 20);
      D.text(x, text, cx + 7, wy + 22, { color: CHALK(0.78), spacing: 2 });
    };
    if (s.index) chip(s.index, false);
    if (f.label) chip(f.label.toUpperCase(), true);
  }

  /** One face of a card, drawn once at `res` canvas pixels per board unit. */
  function renderFace(s, f, kind, res) {
    const { w, h } = s;
    const cv = UF.canvas(w * res, h * res), x = cv.getContext('2d');
    x.scale(res, res);
    x.translate(w / 2, h / 2);
    const dark = kind !== 'doc' && !(kind === 'note' && f.paper);
    if (!dark) {
      x.save();
      D.roundRect(x, -w / 2, -h / 2, w, h, 3);
      x.clip();
      x.drawImage(paperSheet(w, h, s.seed, PAPER), -w / 2, -h / 2, w, h);
      x.restore();
    } else {
      charcoal(x, w, h, kind === 'tag' || kind === 'note' ? (f.tone ? tone(f.tone) : null) : null);
    }

    if (kind === 'photo' || kind === 'figure') {
      const [wx, wy, ww, wh] = windowRect({ x: 0, y: 0, w, h });
      picture(x, f, s, kind, wx, wy, ww, wh);
      const base = wy + wh;
      const t = fitLines(x, (f.title || '').toUpperCase(), w - 32, [28, 25, 22], 1);
      x.font = UF.font.display(t.size);
      D.text(x, t.lines[0] || '', -w / 2 + 16, base + 34, { color: PAPER, spacing: 1 });
      if (f.sub) {
        x.font = UF.font.mono(12, 'bold');
        D.text(x, D.fit(x, f.sub.toUpperCase(), w - 32, 1.5), -w / 2 + 16, base + 55, { color: CHALK(0.7), spacing: 1.5 });
      }
    } else if (kind === 'doc') {
      header(x, f, w, h, s.index, false);
      let tx = -w / 2 + 18;
      if (f.icon) { glyph(x, f.icon, -w / 2 + 44, -h / 2 + 80, 40, 'rgba(29,27,24,.72)', 3); tx = -w / 2 + 78; }
      const t = fitLines(x, (f.title || '').toUpperCase(), w / 2 - 18 - tx, [32, 29, 26, 23, 20], 2);
      x.font = UF.font.display(t.size);
      const lh = t.size * 1.02, y0 = -h / 2 + 80 - (t.lines.length - 1) * lh / 2 + t.size * 0.36;
      t.lines.forEach((ln, i) => D.text(x, ln, tx, y0 + i * lh, { color: INK, spacing: 1 }));
      // Typed-out lines: thin, dark, with a ragged end, like a document rather than a placeholder bar.
      const r = UF.rng(s.seed * 7 + 3);
      for (let ly = -h / 2 + 124; ly <= h / 2 - 44; ly += 12) {
        x.fillStyle = 'rgba(29,27,24,.2)';
        x.fillRect(-w / 2 + 18, ly, (w - 36) * (0.45 + r() * 0.55), 2);
      }
      if (f.sub) {
        x.font = UF.font.mono(12, 'bold');
        D.text(x, D.fit(x, f.sub.toUpperCase(), w - 36, 1.5), -w / 2 + 18, h / 2 - 18, { color: 'rgba(29,27,24,.78)', spacing: 1.5 });
      }
    } else if (kind === 'tag') {
      header(x, f, w, h, s.index, true);
      if (f.title) {
        x.font = UF.font.mono(12, 'bold');
        D.text(x, D.fit(x, f.title.toUpperCase(), w - 32, 1.5), 0, -h / 2 + 58, { color: CHALK(0.88), spacing: 1.5, align: 'center' });
      }
      const v = fitLines(x, f.value || '', w - 36, [52, 46, 40, 34], 1);
      x.font = UF.font.display(v.size);
      D.text(x, v.lines[0] || '', 0, h / 2 - 34, { color: f.tone ? tone(f.tone) : PAPER, spacing: 1, align: 'center' });
      if (f.sub) {
        x.font = UF.font.mono(11, 'bold');
        D.text(x, D.fit(x, f.sub.toUpperCase(), w - 32, 1.5), 0, h / 2 - 13, { color: CHALK(0.62), spacing: 1.5, align: 'center' });
      }
    } else {
      const ink = dark ? PAPER : INK;
      const t = fitLines(x, (f.title || '').toUpperCase(), w - 36, [28, 25, 22, 19], 2);
      x.font = UF.font.display(t.size);
      const lh = t.size * 1.02, mid = f.sub ? -10 : 2;
      const y0 = mid - (t.lines.length - 1) * lh / 2 + t.size * 0.36;
      t.lines.forEach((ln, i) => D.text(x, ln, 0, y0 + i * lh, { color: ink, spacing: 1, align: 'center' }));
      if (f.sub) {
        x.font = UF.font.mono(11, 'bold');
        D.text(x, D.fit(x, f.sub.toUpperCase(), w - 30, 1.5), 0, h / 2 - 15, { color: dark ? CHALK(0.66) : 'rgba(29,27,24,.78)', spacing: 1.5, align: 'center' });
      }
    }
    return cv;
  }

  /** A stamp as a sprite with worn ink, so it reads as pressed rather than typeset. */
  const stampCache = new Map();
  function stampSprite(st, res) {
    const key = `${st.id}:${res}`;
    if (stampCache.has(key)) return stampCache.get(key);
    const lines = String(st.text).split('\n');
    const m = UF.canvas(4, 4).getContext('2d');
    const head = 24, small = 12;
    m.font = UF.font.display(head);
    let tw = D.measure(m, lines[0], 2.5);
    m.font = UF.font.mono(small, 'bold');
    for (const l of lines.slice(1)) tw = Math.max(tw, D.measure(m, l, 2));
    const bw = Math.ceil(tw + 28), bh = Math.ceil(head + 18 + (lines.length - 1) * (small + 6));
    const pad = 6, cv = UF.canvas((bw + pad * 2) * res, (bh + pad * 2) * res), x = cv.getContext('2d');
    x.scale(res, res);
    x.translate(pad, pad);
    const col = tone(st.tone || 'red');
    x.strokeStyle = col;
    x.lineWidth = 2.5;
    D.roundRect(x, 1.5, 1.5, bw - 3, bh - 3, 3);
    x.stroke();
    x.lineWidth = 1;
    D.roundRect(x, 5, 5, bw - 10, bh - 10, 2);
    x.stroke();
    x.font = UF.font.display(head);
    D.text(x, lines[0], bw / 2, 9 + head * 0.86, { color: col, spacing: 2.5, align: 'center' });
    x.font = UF.font.mono(small, 'bold');
    lines.slice(1).forEach((l, i) => D.text(x, l, bw / 2, 9 + head + 4 + (i + 1) * (small + 6) - 6, { color: col, spacing: 2, align: 'center' }));
    const r = UF.rng(String(st.id).split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < bw * bh / 26; i++) {
      x.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.65})`;
      const s = 0.5 + r() * 1.6;
      x.fillRect(r() * bw, r() * bh, s, s);
    }
    const sprite = { cv, w: bw + pad * 2, h: bh + pad * 2 };
    stampCache.set(key, sprite);
    return sprite;
  }

  /* ================================================================== */
  /* CaseFile — the board's contents                                     */
  /* ================================================================== */
  class CaseFile {
    constructor(o) {
      Object.assign(this, {
        title: 'CASE FILE', width: 3400, height: 1500, margin: {}, columns: [], rows: [],
        slots: [], threads: [], ledger: null, footnote: null,
      }, o);
      this.margin = Object.assign({ top: 240, left: 120, right: 60, bottom: 60 }, this.margin);
      this.byId = {};
      this.faces = new Map();
      const reg = (type, el, owner) => {
        if (!el.id) throw new Error(`CaseFile: a ${type} has no id.`);
        if (this.byId[el.id]) throw new Error(`CaseFile: two elements share the id "${el.id}".`);
        el._type = type;
        if (owner) el.slot = owner;
        el.line = lineNum(el.at);
        el.untilLine = lineNum(el.until);
        this.byId[el.id] = el;
      };
      let n = 0;
      this.slots.forEach((s, i) => {
        reg('slot', s);
        s.kind = s.kind || 'doc';
        if (!SIZES[s.kind]) throw new Error(`CaseFile: slot "${s.id}" has unknown kind "${s.kind}" — use ${Object.keys(SIZES).join(', ')}.`);
        if (s.image && !UF.images[s.image]) throw new Error(`CaseFile: slot "${s.id}" uses image "${s.image}", which is not loaded — run tools/embed_images.py.`);
        s.count = s.count !== false;
        s.blank = s.blank ?? s.count;
        if (s.count) n++;
        s.index = s.index ?? (s.count ? String(n).padStart(2, '0') : null);
        s.w = s.w || SIZES[s.kind][0];
        s.h = s.h || SIZES[s.kind][1];
        s.seed = s.seed ?? i * 37 + 11;
        if (s.x == null || s.y == null) {
          if (s.col == null || s.row == null) throw new Error(`CaseFile: slot "${s.id}" needs x / y or col / row.`);
          const [cx, cy] = this.cell(s.col, s.row);
          s.x = cx + (s.dx || 0);
          s.y = cy + (s.dy || 0);
        }
        s.stamps = (s.stamps || []).map((st, k) => Object.assign({ id: `${s.id}.stamp${k + 1}` }, st));
        s.clips = (s.clips || []).map((cl, k) => Object.assign({ id: `${s.id}.clip${k + 1}` }, cl));
        s.stamps.forEach(st => reg('stamp', st, s));
        s.clips.forEach(cl => { reg('clip', cl, s); cl.strikeLine = lineNum(cl.strike); });
        if (s.flip) {
          s.flip = Object.assign({ id: `${s.id}.flip` }, s.flip);
          reg('flip', s.flip, s);
          s.flip.kind = s.flip.kind || s.kind;
          if (s.flip.at == null) throw new Error(`CaseFile: slot "${s.id}" flips but its flip has no line (at).`);
        }
        if (s.fan) {
          s.fan = Object.assign({ id: `${s.id}.fan`, items: [] }, s.fan);
          reg('fan', s.fan, s);
          s.fan.items.forEach((it, k) => Object.assign(it, { w: it.w || 210, h: it.h || 88, seed: s.seed + k + 1 }));
          if (s.fan.note) Object.assign(s.fan.note, { w: s.fan.note.w || 260, h: s.fan.note.h || 96, seed: s.seed + 50 });
        }
      });
      for (const s of this.slots) for (const st of s.stamps) st.back = !!(s.flip && st.line != null && st.line >= s.flip.line);
      this.threads.forEach(th => {
        reg('thread', th);
        th.type = th.type || 'data';
        if (!THREADS[th.type]) throw new Error(`CaseFile: thread "${th.id}" has unknown type "${th.type}" — use ${Object.keys(THREADS).join(', ')}.`);
        for (const end of th.loose ? ['from'] : ['from', 'to']) {
          const s = this.byId[th[end]];
          if (!s || s._type !== 'slot') throw new Error(`CaseFile: thread "${th.id}" ${end} "${th[end]}" is not a slot.`);
        }
        th.muteLine = lineNum(th.mute);
      });
      if (this.ledger) {
        this.ledger = Object.assign({ title: 'THE MONEY', rows: [], showEmpty: false }, this.ledger);
        this.ledger.rows.forEach((r, k) => { r.id = r.id || `ledger${k + 1}`; reg('ledger', r); });
      }
      this.total = n;
    }

    /** Board point at the centre of column `col`, row `row` (0-based indices, or the column / row id). */
    cell(col, row) {
      const m = this.margin;
      const ci = typeof col === 'number' ? col : this.columns.findIndex(k => k.id === col);
      const ri = typeof row === 'number' ? row : this.rows.findIndex(k => k.id === row);
      if (ci < 0 || ci >= this.columns.length) throw new Error(`CaseFile: no column "${col}".`);
      if (ri < 0 || ri >= this.rows.length) throw new Error(`CaseFile: no row "${row}".`);
      const cw = (this.width - m.left - m.right) / this.columns.length;
      const rh = (this.height - m.top - m.bottom) / this.rows.length;
      return [m.left + cw * (ci + 0.5), m.top + rh * (ri + 0.5)];
    }

    columnBox(col) {
      const m = this.margin, ci = typeof col === 'number' ? col : this.columns.findIndex(k => k.id === col);
      if (ci < 0) throw new Error(`CaseFile: no column "${col}".`);
      const cw = (this.width - m.left - m.right) / this.columns.length;
      return [m.left + cw * ci, m.top - 70, cw, this.height - m.top - m.bottom + 70];
    }

    /** Bounding box [x, y, w, h] of the named slots. */
    box(ids) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const id of ids) {
        const s = this.byId[id];
        if (!s || s._type !== 'slot') throw new Error(`CaseFile: "${id}" is not a slot.`);
        x0 = Math.min(x0, s.x - s.w / 2); y0 = Math.min(y0, s.y - s.h / 2);
        x1 = Math.max(x1, s.x + s.w / 2); y1 = Math.max(y1, s.y + s.h / 2 + (s.clips.length ? 40 : 0));
      }
      return [x0, y0, x1 - x0, y1 - y0];
    }

    /**
     * Camera keyframes for a recap glide: the camera travels the slots in order, `step` seconds apart.
     * new UF.CaseFileBoard({ camera: [{ t: 0, center: 'all' }, ...CASE.glide(['01', '08', '07'], 0.4, 0.7)] })
     */
    glide(ids, at, step = 0.7, o = {}) {
      return ids.map((id, i) => ({ t: at + i * step, center: id, zoom: o.zoom ?? 1.45, dur: step * (o.overlap ?? 1.15), ease: i ? 'inOutSine' : 'inOutCubic' }));
    }

    /** A card face bitmap, shared by every scene that shows this case. */
    face(s, back, res) {
      const key = `${s.id}:${back ? 'b' : 'f'}:${res}`;
      if (!this.faces.has(key)) {
        const f = back ? Object.assign({ label: s.label, icon: s.icon, figures: s.figures, image: s.image, tone: s.tone }, s.flip) : s;
        this.faces.set(key, renderFace(s, f, back ? s.flip.kind : s.kind, res));
      }
      return this.faces.get(key);
    }

    itemFace(it, res, dark = true) {
      const key = `item:${it.seed}:${it.title}:${res}`;
      if (!this.faces.has(key)) this.faces.set(key, renderFace(it, Object.assign({ paper: !dark }, it), 'note', res));
      return this.faces.get(key);
    }
  }

  /* ================================================================== */
  /* CaseFileBoard — one board beat                                      */
  /* ================================================================== */
  class CaseFileBoard extends UF.Component {
    constructor(o) {
      super({
        file: null, line: null, cues: {}, camera: null, focus: [], pulses: [], glows: [], portal: null,
        hud: true, hudAt: null, legend: null, drift: 1, autoStart: 0.8, autoStep: 0.9, quiet: false,
      }, o);
      if (!(this.file instanceof CaseFile)) throw new Error('CaseFileBoard: pass file: a UF.CaseFile.');
      if (this.line == null) throw new Error("CaseFileBoard: pass line: the script line of this board beat, e.g. 'L28'.");
      this.lineN = lineNum(this.line);
      this.camera = this.camera || [{ t: 0, center: 'all' }];
      if (this.portal) this.portal = Object.assign({ dur: 1.7 }, this.portal);
      if (this.portal && !this.file.byId[this.portal.slot]) throw new Error(`CaseFileBoard ${this.line}: portal slot "${this.portal.slot}" is not in the case file.`);
      if (this.portal && this.portal.image && !UF.images[this.portal.image]) throw new Error(`CaseFileBoard ${this.line}: portal image "${this.portal.image}" is not loaded.`);
      for (const f of [...this.focus, ...this.glows]) for (const id of f.ids || []) this.known(id);
      for (const p of this.pulses) for (const id of p.path || []) this.known(id);
      this.resolve();
      this.states = this.camera.map(f => this.target(f));
      this.maxZoom = Math.max(...this.states.map(s => s.z));
      this.res = 2;
    }

    known(id) {
      const s = this.file.byId[id];
      if (!s || s._type !== 'slot') throw new Error(`CaseFileBoard ${this.line}: "${id}" is not a slot in the case file.`);
      return s;
    }

    /** Scene-local times for every element: T[id] = { in, out, strike, mute }, -Infinity = already done. */
    resolve() {
      const F = this.file, L = this.lineN, cues = this.cues;
      for (const k of Object.keys(cues)) {
        const [id, part] = k.split(':');
        const el = F.byId[id];
        if (!el) throw new Error(`CaseFileBoard ${this.line}: cue "${k}" names nothing in the case file.`);
        if (part && !PARTS.includes(part)) throw new Error(`CaseFileBoard ${this.line}: cue "${k}" — the part after ':' must be ${PARTS.join(', ')}.`);
        const ln = part === 'out' ? el.untilLine : part === 'strike' ? el.strikeLine : part === 'mute' ? el.muteLine : el.line;
        if (ln !== L) throw new Error(`CaseFileBoard ${this.line}: cue "${k}" — that happens at ${lineName(ln)}, not ${this.line}.`);
        if (typeof cues[k] !== 'number') throw new Error(`CaseFileBoard ${this.line}: cue "${k}" must be a number of seconds.`);
      }
      let auto = this.autoStart;
      const when = (id, ln, part, absent) => {
        if (ln == null) return absent;
        if (ln < L) return -Infinity;
        if (ln > L) return Infinity;
        const k = part ? `${id}:${part}` : id;
        if (k in cues) return cues[k];
        const v = auto;
        auto += this.autoStep;
        return v;
      };
      const order = [
        ...F.slots, ...F.threads,
        ...F.slots.map(s => s.flip).filter(Boolean), ...F.slots.map(s => s.fan).filter(Boolean),
        ...F.slots.flatMap(s => s.stamps), ...F.slots.flatMap(s => s.clips),
        ...(F.ledger ? F.ledger.rows : []),
      ];
      const T = (this.T = {});
      for (const el of order) {
        T[el.id] = {
          in: when(el.id, el.line, null, -Infinity),
          out: when(el.id, el.untilLine, 'out', Infinity),
          strike: when(el.id, el.strikeLine, 'strike', Infinity),
          mute: when(el.id, el.muteLine, 'mute', Infinity),
        };
      }
    }

    /* ---------------- camera ---------------- */
    target(f) {
      const F = this.file, cen = f.center ?? 'all';
      let box;
      if (cen === 'all') box = [0, 0, F.width, F.height];
      else if (typeof cen === 'string' && cen.startsWith('col:')) box = F.columnBox(cen.slice(4));
      else if (typeof cen === 'string') box = F.box([this.known(cen).id]);
      else if (Array.isArray(cen) && typeof cen[0] === 'string') box = F.box(cen);
      else return { c: cen, z: f.zoom || 1 };
      const single = typeof cen === 'string' && cen !== 'all' && !cen.startsWith('col:');
      const pad = f.pad ?? (cen === 'all' ? 1.03 : single ? 2.1 : 1.25);
      // The wide shot keeps the board clear of the HUD band and ledger at the top of frame.
      const top = cen === 'all' ? (f.safeTop ?? (this.hud ? 290 : 0)) : 0;
      const fit = Math.min(W / (box[2] * pad), (H - top) / (box[3] * pad));
      const z = f.zoom ?? Math.min(fit, f.maxZoom ?? 2.6);
      return { c: [box[0] + box[2] / 2, box[1] + box[3] / 2 - top / 2 / z], z };
    }

    /** Zoom in log space; the centre moves so the target point travels evenly across the screen. */
    static blend(a, b, e) {
      const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), e));
      const d = 1 / a.z - 1 / b.z;
      const w = Math.abs(d) > 1e-6 ? (1 / a.z - 1 / z) / d : e;
      return { c: [lerp(a.c[0], b.c[0], w), lerp(a.c[1], b.c[1], w)], z };
    }

    baseCam(t) {
      let cur = this.states[0];
      for (let i = 1; i < this.camera.length; i++) {
        const f = this.camera[i];
        if (t < f.t) break;
        cur = CaseFileBoard.blend(cur, this.states[i], UF.easeFn(f.ease || 'inOutCubic')(seg(t, f.t, f.dur ?? 1.6)));
      }
      if (this.drift) {
        const k = this.drift;
        cur = { c: [cur.c[0] + Math.sin(t * 0.37) * 3.2 * k / cur.z, cur.c[1] + Math.sin(t * 0.29 + 1.3) * 2.2 * k / cur.z], z: cur.z * (1 + 0.004 * k * Math.sin(t * 0.21)) };
      }
      return cur;
    }

    portalTarget() {
      const s = this.file.byId[this.portal.slot];
      const r = s.kind === 'photo' || s.kind === 'figure' ? windowRect(s) : [s.x - s.w / 2, s.y - s.h / 2, s.w, s.h];
      return { c: [r[0] + r[2] / 2, r[1] + r[3] / 2], z: Math.max(W / r[2], H / r[3]) };
    }

    camAt(t) {
      const cur = this.baseCam(t), P = this.portal;
      if (!P) return cur;
      const e = UF.easeFn(P.ease || 'inOutCubic')(seg(t, P.at, P.dur));
      const tgt = this.portalTarget();
      return P.dir === 'out' ? CaseFileBoard.blend(tgt, cur, e) : CaseFileBoard.blend(cur, tgt, e);
    }

    /** k: full-frame picture over the board; hud: how far the screen furniture has faded out. */
    portalState(t) {
      const P = this.portal;
      if (!P) return { k: 0, hud: 0 };
      const p = seg(t, P.at, P.dur);
      return P.dir === 'out'
        ? { k: 1 - ease.inOutSine(seg(p, 0, 0.4)), hud: 1 - seg(p, 0.55, 0.45) }
        : { k: ease.inOutSine(seg(p, 0.62, 0.38)), hud: seg(p, 0, 0.35) };
    }

    /* ---------------- per-element state ---------------- */
    cardIn(s, t) { return seg(t, this.T[s.id].in, 0.55); }
    cardAlpha(s, t) { return clamp(this.cardIn(s, t) * 2.2) * (1 - seg(t, this.T[s.id].out, 0.5)); }
    blankAlpha(s, t) { return s.blank ? (1 - seg(t, this.T[s.id].in, 0.3)) * (1 - seg(t, this.T[s.id].out, 0.5)) : 0; }
    /** A thread may end on a blank slot: it points at the question. */
    present(s, t) { return Math.max(this.cardAlpha(s, t), this.blankAlpha(s, t)); }

    dimOf(id, t) {
      let k = 0;
      for (const f of this.focus) if (!(f.ids || []).includes(id)) k = Math.max(k, UF.win(t, f.at, f.at + (f.dur ?? 3), 0.45, 0.5));
      return 1 - 0.7 * k;
    }

    /* ---------------- drawing ---------------- */
    setup(stage) {
      slate();
      vignette();
      const scale = stage && stage.scale ? stage.scale : 1;
      const res = this.pickRes(scale);
      for (const s of this.file.slots) {
        if (this.T[s.id].in === Infinity) continue;
        this.file.face(s, false, res);
        if (s.flip && this.T[s.flip.id].in !== Infinity) this.file.face(s, true, res);
      }
    }

    pickRes(scale) {
      const P = this.portal ? Math.min(3, this.portalTarget().z) : 0;
      return clamp(Math.ceil(scale * Math.max(this.maxZoom, P) * 1.25 * 2) / 2, 1, 3);
    }

    draw(ctx, t, fx, scene) {
      // The board is a sharp physical surface: a fifth of the channel's grain and no scanline.
      if (fx) { fx.grain *= 0.2; fx.scan = 0; }
      const a = this.vis(t);
      if (a <= 0) return;
      const key = !!(scene && scene.key);
      const m = ctx.getTransform();
      this.res = this.pickRes(Math.hypot(m.a, m.b));
      const cam = this.camAt(t);
      const por = this.portalState(t);
      const view = [cam.c[0] - W / 2 / cam.z, cam.c[1] - H / 2 / cam.z, W / cam.z, H / cam.z];
      ctx.save();
      ctx.globalAlpha = a;
      if (por.k < 1) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(cam.z, cam.z);
        ctx.translate(-cam.c[0], -cam.c[1]);
        if (!key) this.surface(ctx, view);
        this.drawBoard(ctx, t, fx, cam.z, key);
        ctx.restore();
        if (!key) ctx.drawImage(vignette(), 0, 0, W, H);
        const ha = 1 - por.hud;
        if (ha > 0) {
          if (this.hud && !key) this.drawBand(ctx, t, ha);
          this.drawHud(ctx, t, ha);
          this.drawLedger(ctx, t, ha, fx);
          this.drawLegend(ctx, t, ha);
          this.drawFootnote(ctx, t, ha);
        }
      }
      if (por.k > 0) this.drawPortal(ctx, t, fx, por.k);
      ctx.restore();
    }

    surface(ctx, view) {
      if (!this._pat || this._patCtx !== ctx) {
        this._pat = ctx.createPattern(slate(), 'repeat');
        this._pat.setTransform(new DOMMatrix([0.8, 0, 0, 0.8, 0, 0]));
        this._patCtx = ctx;
      }
      ctx.fillStyle = this._pat;
      ctx.fillRect(view[0] - 40, view[1] - 40, view[2] + 80, view[3] + 80);
    }

    drawBoard(ctx, t, fx, z, key) {
      const F = this.file;
      this.drawGrid(ctx, z);
      for (const s of F.slots) {
        const ba = this.blankAlpha(s, t);
        if (ba > 0) this.drawBlank(ctx, t, s, ba * this.dimOf(s.id, t));
      }
      for (const th of F.threads) this.drawThread(ctx, t, th, key);
      for (const s of F.slots) this.drawCard(ctx, t, fx, s);
      for (const s of F.slots) if (s.fan) this.drawFan(ctx, t, fx, s, key);
      for (const th of F.threads) this.drawThreadLabel(ctx, t, th);
      for (const g of this.glows) for (const id of g.ids) this.drawGlow(ctx, F.byId[id], UF.win(t, g.at, g.at + (g.dur ?? 1.6), 0.3, 0.6), g.color);
      for (const p of this.pulses) this.drawPulse(ctx, t, p, key);
    }

    drawGrid(ctx, z) {
      const F = this.file, m = F.margin;
      const cw = (F.width - m.left - m.right) / Math.max(1, F.columns.length);
      const rh = (F.height - m.top - m.bottom) / Math.max(1, F.rows.length);
      const lw = Math.max(1, 1.2 / z);
      ctx.save();
      ctx.lineWidth = lw;
      F.columns.forEach((col, i) => {
        const x = m.left + i * cw;
        ctx.font = UF.font.mono(18, 'bold');
        const code = col.code || `C${i + 1}`;
        D.text(ctx, code, x + 26, m.top - 58, { color: CHALK(0.72), spacing: 3 });
        D.text(ctx, col.label, x + 26 + D.measure(ctx, code, 3) + 18, m.top - 58, { color: CHALK(0.46), spacing: 4 });
        ctx.fillStyle = CHALK(0.13);
        ctx.fillRect(x + 26, m.top - 40, cw - 52, lw);
        ctx.fillStyle = CHALK(0.5);
        ctx.fillRect(x + 26, m.top - 40 - lw, 34, lw * 3);
        if (i) {
          ctx.strokeStyle = CHALK(0.06);
          ctx.setLineDash([2, 12]);
          ctx.beginPath(); ctx.moveTo(x, m.top - 20); ctx.lineTo(x, F.height - m.bottom); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      F.rows.forEach((row, i) => {
        const y = m.top + i * rh;
        ctx.save();
        ctx.translate(m.left - 52, y + rh / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = UF.font.mono(13, 'bold');
        D.text(ctx, row.label, 0, 0, { color: CHALK(0.34), spacing: 6, align: 'center' });
        ctx.restore();
        if (i) {
          ctx.strokeStyle = CHALK(0.05);
          ctx.setLineDash([2, 12]);
          ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(F.width - m.right, y); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      ctx.restore();
    }

    drawBlank(ctx, t, s, a) {
      const { w, h } = s;
      const closing = seg(t, this.T[s.id].in, 0.3);
      const breathe = 0.82 + 0.18 * Math.sin(t * 1.6 + s.seed);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = CHALK(0.24);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.setLineDash([]);
      const k = 12 * ease.inCubic(closing), L = 22;
      ctx.strokeStyle = CHALK(0.6 * breathe);
      ctx.lineWidth = 2;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const cx = sx * (w / 2 - k), cy = sy * (h / 2 - k);
        ctx.beginPath(); ctx.moveTo(cx, cy - sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx - sx * L, cy); ctx.stroke();
      }
      ctx.font = UF.font.display(150);
      D.text(ctx, '?', 0, 52, { color: CHALK(0.05), align: 'center' });
      if (s.index) {
        ctx.font = UF.font.mono(12, 'bold');
        D.text(ctx, s.index, -w / 2 + 16, -h / 2 + 26, { color: CHALK(0.36), spacing: 2 });
      }
      if (s.question) {
        ctx.font = UF.font.mono(19, 'bold');
        const lines = D.wrapBalanced(ctx, s.question.toUpperCase(), w - 60);
        lines.forEach((ln, i) => D.text(ctx, ln, 0, (i - (lines.length - 1) / 2) * 27 + 7,
          { color: CHALK(0.72 * breathe), spacing: 1, align: 'center' }));
      }
      ctx.restore();
    }

    drawCard(ctx, t, fx, s) {
      const T = this.T[s.id];
      const p = this.cardIn(s, t), alpha = this.cardAlpha(s, t), dim = this.dimOf(s.id, t);
      if (p <= 0 || alpha <= 0) return;
      const e = ease.outCubic(p);
      const fp = s.flip ? seg(t, this.T[s.flip.id].in, 0.7) : 0;
      const back = fp >= 0.5;
      const lift = Math.sin(Math.PI * fp);
      const sc = lerp(1.05, 1, e) * (1 + 0.06 * lift);
      const sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * ease.inOutCubic(fp))));
      const { w, h } = s;
      ctx.save();
      ctx.globalAlpha *= alpha;
      const sh = shadowSprite(w, h), off = lerp(24, 8, e) + lift * 14;
      ctx.save();
      ctx.globalAlpha *= lerp(0.3, 0.62, e);
      ctx.translate(s.x + off * 0.25, s.y + off);
      ctx.scale(sc * sx, sc);
      ctx.drawImage(sh, -w / 2 - 48, -h / 2 - 48);
      ctx.restore();
      ctx.translate(s.x, s.y);
      ctx.scale(sc * sx, sc);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.file.face(s, back, this.res), -w / 2, -h / 2, w, h);
      // Key light on every card; it brightens for the moment a card lands, the way a lit exhibit does.
      const land = UF.pulse(t, T.in + 0.2, 1.6);
      this.keyLight(ctx, w, h, 0.05 + 0.1 * land);
      attachment(ctx, s, back);
      const sp = seg(t, T.in + 0.2, 0.75);
      if (sp > 0 && sp < 1) this.sheen(ctx, w, h, sp);
      if (fp > 0 && fp < 1) this.sheen(ctx, w, h, fp);
      this.drawStamps(ctx, t, fx, s, back);
      this.drawSolved(ctx, t, s, back);
      if (dim < 1) {
        // A veil rather than transparency, so a card out of focus stays solid and threads never show through it.
        ctx.fillStyle = `rgba(11,13,17,${(1 - dim).toFixed(3)})`;
        D.roundRect(ctx, -w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 3);
        ctx.fill();
      }
      ctx.restore();
      this.drawClips(ctx, t, s, alpha * dim);
      if (!this.quiet && T.in > -Infinity && T.in < Infinity) kick(fx, t, T.in + 0.32, { rgb: 0.12, decay: 12 });
    }

    /** Warm key light falling across the card from the top left, clipped to the card's edge. */
    keyLight(ctx, w, h, k) {
      if (k <= 0) return;
      ctx.save();
      D.roundRect(ctx, -w / 2, -h / 2, w, h, 3);
      ctx.clip();
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w * 0.15, h * 0.35);
      g.addColorStop(0, `rgba(255,226,180,${k.toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,226,180,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    /** A card whose outcome is final closes with a solid rule in its status colour, drawn in from the left. */
    drawSolved(ctx, t, s, back) {
      let st = null;
      for (const x of s.stamps) if (x.back === back && SOLVED.includes(x.tone) && this.T[x.id].in <= t) st = x;
      if (!st) return;
      const T = this.T[st.id];
      const p = seg(t, T.in + 0.2, 0.5) * (1 - seg(t, T.out, 0.4));
      if (p <= 0) return;
      ctx.save();
      ctx.fillStyle = tone(st.tone);
      ctx.globalAlpha *= 0.95 * p;
      ctx.fillRect(-s.w / 2, s.h / 2 - 3, s.w * ease.outCubic(p), 3);
      ctx.restore();
    }

    sheen(ctx, w, h, p) {
      const x = lerp(-w * 1.1, w * 1.1, ease.inOutSine(p));
      ctx.save();
      D.roundRect(ctx, -w / 2, -h / 2, w, h, 3);
      ctx.clip();
      const g = ctx.createLinearGradient(x - 90, -h / 2, x + 90, h / 2);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${0.06 * Math.sin(Math.PI * p)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    drawStamps(ctx, t, fx, s, back) {
      const list = s.stamps.filter(st => st.back === back && this.T[st.id].in !== Infinity);
      list.forEach((st, i) => {
        const T = this.T[st.id];
        const p = seg(t, T.in, 0.16);
        if (p <= 0) return;
        const next = list[i + 1] ? this.T[list[i + 1].id].in : Infinity;
        const a = p * (1 - seg(t, next, 0.25)) * (1 - seg(t, T.out, 0.4));
        if (a <= 0) return;
        const sp = stampSprite(st, this.res);
        const k = lerp(1.55, 1, ease.outCubic(p));
        const kind = back ? s.flip.kind : s.kind;
        const pictured = kind === 'photo' || kind === 'figure';
        const wb = -s.h / 2 + 10 + (s.w - 20) * 9 / 16;
        ctx.save();
        ctx.globalAlpha *= a * 0.94;
        ctx.translate(s.w / 2 - sp.w / 2 - 14, pictured ? wb - sp.h / 2 - 4 : s.h / 2 - sp.h / 2 - 8);
        ctx.rotate((st.angle ?? -4) * RAD);
        ctx.scale(k, k);
        ctx.drawImage(sp.cv, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
        ctx.restore();
        if (!this.quiet && T.in > -Infinity) kick(fx, t, T.in + 0.12, { shake: 0.006, rgb: 0.35, flash: 0.04, decay: 11 });
      });
    }

    drawClips(ctx, t, s, alpha) {
      const maxW = s.w + 80;
      let k = 0;
      for (const cl of s.clips) {
        const T = this.T[cl.id];
        const p = seg(t, T.in, 0.45), o = seg(t, T.out, 0.4);
        if (p <= 0 || o >= 1) continue;
        const e = ease.outCubic(p);
        const x = s.x - s.w / 2 + 8, y = s.y + s.h / 2 + 12 + k * 34 - (1 - e) * 14;
        const col = tone(cl.tone || 'grey');
        ctx.save();
        ctx.globalAlpha *= alpha * e * (1 - o);
        ctx.font = UF.font.mono(12, 'bold');
        const iw = cl.icon ? 22 : 0;
        const txt = D.fit(ctx, String(cl.text).toUpperCase(), maxW - 26 - iw, 1.5);
        const bw = D.measure(ctx, txt, 1.5) + 26 + iw;
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillRect(x + 2, y + 4, bw, 26);
        ctx.fillStyle = '#10141a';
        ctx.fillRect(x, y, bw, 26);
        ctx.strokeStyle = 'rgba(255,255,255,.09)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, 25);
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 3, 26);
        if (cl.icon) glyph(ctx, cl.icon, x + 21, y + 13, 15, col, 2);
        D.text(ctx, txt, x + 13 + iw, y + 17.5, { color: CHALK(0.88), spacing: 1.5 });
        const st = ease.inOutCubic(seg(t, T.strike, 0.5));
        if (st > 0) { ctx.fillStyle = TONES.red; ctx.fillRect(x + 10 + iw, y + 12, (bw - 20 - iw) * st, 2.5); }
        ctx.restore();
        k++;
      }
    }

    threadPts(th, t) {
      const F = this.file, A = F.byId[th.from];
      if (th.loose) {
        // Pinned to the card's lower edge and hanging free, swaying slightly: a thread that leads nowhere yet.
        const [lx, ly] = th.loose;
        const sway = Math.sin(t * 1.1 + A.seed) * 9, sway2 = Math.sin(t * 1.7 + A.seed * 2) * 4;
        const p0 = [A.x + Math.sign(lx) * A.w * 0.32, A.y + A.h / 2 + 7];
        const ex = p0[0] + lx + sway, ey = p0[1] + ly;
        return D.cubicPoints(p0[0], p0[1], p0[0] + lx * 0.15, p0[1] + ly * 0.55, ex - lx * 0.25 + sway2, ey - ly * 0.12, ex, ey, 36);
      }
      if (!this._pts) this._pts = {};
      if (this._pts[th.id]) return this._pts[th.id];
      const B = F.byId[th.to];
      const p0 = edgePoint(A, B.x, B.y), p1 = edgePoint(B, A.x, A.y);
      let pts = [p0, p1];
      if (th.bend) {
        const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, dx = p1[0] - p0[0], dy = p1[1] - p0[1];
        pts = D.quadPoints(p0[0], p0[1], mx - dy * th.bend, my + dx * th.bend, p1[0], p1[1], 40);
      }
      return (this._pts[th.id] = pts);
    }

    threadState(th, t) {
      const F = this.file, T = this.T[th.id];
      const A = F.byId[th.from], B = th.loose ? null : F.byId[th.to];
      const vis = Math.min(this.present(A, t), B ? this.present(B, t) : 1) * (1 - seg(t, T.out, 0.5));
      const dur = th.dur ?? 0.9;
      const p = ease.inOutCubic(seg(t, T.in, dur));
      const dim = Math.min(this.dimOf(th.from, t), B ? this.dimOf(th.to, t) : 1);
      const mute = ease.inOutCubic(seg(t, T.mute, 0.8));
      return { T, vis: vis * dim, p, dur, mute };
    }

    drawThread(ctx, t, th, key) {
      const { T, vis, p, dur, mute } = this.threadState(th, t);
      if (p <= 0 || vis <= 0) return;
      const st = THREADS[th.type];
      const base = th.color ? tone(th.color) : st.color;
      const col = mute > 0 ? D.hexMix(base, THREADS.alleged.color, mute) : base;
      const pts = this.threadPts(th, t);
      const land = T.in > -Infinity ? UF.pulse(t, T.in + dur, 2.6) : 0;
      const glow = 1 - mute * 0.7;
      ctx.save();
      ctx.globalAlpha *= vis;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const dash = st.dash || (mute > 0.5 ? THREADS.alleged.dash : null);
      if (dash) ctx.setLineDash(dash);
      // One stroke of the string at an offset and colour: the shadow, the string, and its highlight.
      const stroke = (style, width, ox = 0, oy = 0) => {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        D.partialPath(ctx, pts, p);
        ctx.stroke();
        ctx.restore();
      };
      if (!key) stroke('rgba(0,0,0,.5)', 4, 2.5, 4);           // the string lies on the board, so it casts a short shadow
      if (!key && land > 0) {                                  // a new thread catches a little light, and only that
        ctx.globalCompositeOperation = 'lighter';
        stroke(c(col, (0.06 + land * 0.12) * glow), 5);
        ctx.globalCompositeOperation = 'source-over';
      }
      stroke(c(col, 0.96), 2.8);
      stroke('rgba(255,255,255,.28)', 0.9, -0.5, -0.7);        // highlight on the upper side of the string
      ctx.setLineDash([]);
      const dot = ([x, y], r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
      dot(pts[0], 3.6);
      if (p >= 1 && !th.loose) dot(pts[pts.length - 1], 3.6);
      if (p > 0 && p < 1 && !key) {
        const [hx, hy] = D.pointAt(pts, p);
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10);
        g.addColorStop(0, 'rgba(255,255,255,.85)');
        g.addColorStop(0.35, c(col, 0.5));
        g.addColorStop(1, c(col, 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.fillRect(hx - 10, hy - 10, 20, 20);
      }
      ctx.restore();
    }

    drawThreadLabel(ctx, t, th) {
      if (!th.label) return;
      const { vis, p } = this.threadState(th, t);
      const lp = seg(p, 0.55, 0.45);
      if (lp <= 0 || vis <= 0) return;
      const pts = this.threadPts(th, t);
      const [lx, ly] = D.pointAt(pts, th.labelAt ?? 0.5);
      const col = th.color ? tone(th.color) : THREADS[th.type].color;
      ctx.save();
      ctx.globalAlpha *= vis * ease.outCubic(lp);
      ctx.font = UF.font.mono(12, 'bold');
      const text = th.label.toUpperCase(), tw = D.measure(ctx, text, 2) + 22;
      ctx.translate(lx, ly);
      ctx.fillStyle = '#0f1318';
      ctx.fillRect(-tw / 2, -13, tw, 26);
      ctx.strokeStyle = c(col, 0.55);
      ctx.lineWidth = 1;
      ctx.strokeRect(-tw / 2 + 0.5, -12.5, tw - 1, 25);
      D.text(ctx, text, 0, 4.5, { color: UF.mix(col, '#ffffff', 0.45), spacing: 2, align: 'center' });
      ctx.restore();
    }

    drawFan(ctx, t, fx, s, key) {
      const f = s.fan, T = this.T[f.id];
      if (T.in === Infinity || t < T.in || seg(t, T.out, 0.9) >= 1) return;
      const items = f.items, n = items.length;
      const dim = this.dimOf(s.id, t);
      const outAt = i => T.out + (n - 1 - i) * 0.06;
      const place = (it, at, i) => {
        const pi = ease.outCubic(seg(t, at, 0.6)), po = ease.inCubic(seg(t, outAt(i), 0.55));
        const k = pi * (1 - po);
        return { k, x: s.x + it.dx * k, y: s.y + it.dy * k };
      };
      const noteAt = T.in + n * 0.28 + 0.2;
      const note = f.note ? place(f.note, noteAt, n) : null;
      ctx.save();
      ctx.globalAlpha *= dim;
      if (note) {
        items.forEach((it, i) => {
          const q = place(it, T.in + i * 0.28, i);
          const lp = ease.inOutCubic(seg(t, noteAt + 0.4 + i * 0.14, 0.6)) * Math.min(q.k, note.k);
          if (lp <= 0) return;
          const a = edgePoint(Object.assign({}, it, { x: q.x, y: q.y }), note.x, note.y);
          const b = edgePoint(Object.assign({}, f.note, { x: note.x, y: note.y }), q.x, q.y);
          ctx.save();
          ctx.strokeStyle = THREADS[f.thread || 'alleged'].color;
          ctx.lineWidth = 2;
          ctx.setLineDash(THREADS[f.thread || 'alleged'].dash || []);
          D.partialPath(ctx, [a, b], lp);
          ctx.stroke();
          ctx.restore();
        });
      }
      const card = (it, q, dark) => {
        if (q.k <= 0) return;
        ctx.save();
        ctx.globalAlpha *= clamp(q.k * 1.6);
        ctx.translate(q.x, q.y);
        ctx.scale(lerp(0.4, 1, q.k), lerp(0.4, 1, q.k));
        ctx.drawImage(shadowSprite(it.w, it.h), -it.w / 2 - 48, -it.h / 2 - 48 + 8);
        ctx.drawImage(this.file.itemFace(it, this.res, dark), -it.w / 2, -it.h / 2, it.w, it.h);
        ctx.restore();
      };
      items.forEach((it, i) => {
        card(it, place(it, T.in + i * 0.28, i), true);
        if (!this.quiet) kick(fx, t, T.in + i * 0.28 + 0.45, { rgb: 0.1, decay: 12 });
      });
      if (note) card(f.note, note, f.note.paper === false);
      ctx.restore();
    }

    drawGlow(ctx, s, k, color) {
      if (!s || k <= 0) return;
      const col = color ? tone(color) : PAPER;
      ctx.save();
      ctx.globalAlpha *= k;
      // A lit edge, not a halo: a fine outer rule and a crisper inner one, both hard against the card.
      ctx.strokeStyle = c(col, 0.3);
      ctx.lineWidth = 1.2;
      D.roundRect(ctx, s.x - s.w / 2 - 6, s.y - s.h / 2 - 6, s.w + 12, s.h + 12, 6);
      ctx.stroke();
      ctx.strokeStyle = c(col, 0.9);
      ctx.lineWidth = 2;
      D.roundRect(ctx, s.x - s.w / 2 - 3, s.y - s.h / 2 - 3, s.w + 6, s.h + 6, 4);
      ctx.stroke();
      ctx.restore();
    }

    /** A spark of light travelling the chain card to card, lighting each card as it arrives. */
    drawPulse(ctx, t, p, key) {
      const F = this.file, ids = p.path || [], hop = p.hop ?? 0.42;
      const col = p.color ? tone(p.color) : PAPER;
      for (let i = 0; i < ids.length; i++) {
        const s = F.byId[ids[i]];
        this.drawGlow(ctx, s, UF.pulse(t, p.at + i * hop, 2.2) * (t >= p.at + i * hop ? 1 : 0), p.color);
        if (i === ids.length - 1) break;
        const q = seg(t, p.at + i * hop, hop);
        if (q <= 0 || q >= 1) continue;
        const B = F.byId[ids[i + 1]];
        const a = edgePoint(s, B.x, B.y), b = edgePoint(B, s.x, s.y);
        const e = ease.inOutSine(q);
        const hx = lerp(a[0], b[0], e), hy = lerp(a[1], b[1], e);
        const tx = lerp(a[0], b[0], Math.max(0, e - 0.22)), ty = lerp(a[1], b[1], Math.max(0, e - 0.22));
        ctx.save();
        if (!key) ctx.globalCompositeOperation = 'lighter';
        const tr = ctx.createLinearGradient(tx, ty, hx, hy);
        tr.addColorStop(0, c(col, 0));
        tr.addColorStop(1, c(col, 0.85));
        ctx.strokeStyle = tr;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        // A small, hard-edged head: a clean point of light rather than a bloom.
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c(col, 0.35);
        ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    /* ---------------- screen furniture ---------------- */
    /** A soft dark band under the counter and ledger, so they read cleanly over any part of the board. */
    drawBand(ctx, t, a) {
      const hin = this.hudAt == null ? 1 : ease.outCubic(seg(t, this.hudAt, 0.7));
      if (hin <= 0) return;
      if (!this._band) {
        const g = ctx.createLinearGradient(0, 0, 0, 250);
        g.addColorStop(0, 'rgba(9,11,14,.86)');
        g.addColorStop(0.62, 'rgba(9,11,14,.55)');
        g.addColorStop(1, 'rgba(9,11,14,0)');
        this._band = g;
      }
      ctx.save();
      ctx.globalAlpha *= a * hin;
      ctx.fillStyle = this._band;
      ctx.fillRect(0, 0, W, 250);
      ctx.restore();
    }

    /** A dark label plate behind the counter and the ledger: a physical tab with a lit top edge. */
    plate(ctx, x, y, w, h) {
      ctx.fillStyle = 'rgba(12,14,18,.8)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,240,215,.2)';
      ctx.fillRect(x, y, w, 1);
      ctx.strokeStyle = 'rgba(255,255,255,.07)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    /** CASE FILE · 06 / 12 with a segment bar; the number rolls when a counted slot lands. */
    drawHud(ctx, t, a) {
      if (!this.hud) return;
      const F = this.file;
      const hin = this.hudAt == null ? 1 : ease.outCubic(seg(t, this.hudAt, 0.7));
      if (hin <= 0) return;
      let n = 0, last = -Infinity;
      for (const s of F.slots) {
        if (!s.count) continue;
        const T = this.T[s.id], land = T.in + 0.32;
        if (t >= land && t < T.out) { n++; last = Math.max(last, land); }
      }
      const tick = seg(t, last, 0.45);
      const x0 = 72, y0 = 66;
      ctx.save();
      ctx.globalAlpha *= a * hin;
      this.plate(ctx, 48, 36, 380, 140);
      ctx.font = UF.font.mono(13, 'bold');
      D.text(ctx, F.title, x0, y0, { color: CHALK(0.72), spacing: 4 });
      ctx.fillStyle = CHALK(0.16);
      ctx.fillRect(x0, y0 + 12, 300, 1);
      const pad = v => String(Math.max(0, v)).padStart(2, '0');
      ctx.save();
      ctx.beginPath(); ctx.rect(x0 - 4, y0 + 16, 120, 70); ctx.clip();
      ctx.font = UF.font.display(64);
      if (tick < 1) {
        const e = ease.inOutCubic(tick);
        D.text(ctx, pad(n - 1), x0, y0 + 76 - e * 64, { color: CHALK(0.9 * (1 - e)), spacing: 2 });
        D.text(ctx, pad(n), x0, y0 + 76 + (1 - e) * 64, { color: UF.mix('#d9a441', PAPER, e), spacing: 2 });
      } else {
        D.text(ctx, pad(n), x0, y0 + 76, { color: PAPER, spacing: 2 });
      }
      ctx.restore();
      ctx.font = UF.font.display(64);
      const nw = D.measure(ctx, pad(n), 2);
      ctx.font = UF.font.mono(20, 'bold');
      D.text(ctx, `/ ${pad(F.total)}`, x0 + nw + 12, y0 + 74, { color: CHALK(0.45), spacing: 2 });
      const sw = 300 / F.total - 4;
      for (let i = 0; i < F.total; i++) {
        const lit = i < n, fresh = lit && i === n - 1 && tick < 1;
        ctx.fillStyle = fresh ? UF.mix('#d9a441', PAPER, tick) : lit ? CHALK(0.85) : CHALK(0.13);
        ctx.fillRect(x0 + i * (sw + 4), y0 + 94, sw, 4);
      }
      ctx.restore();
    }

    /** THE MONEY: rows land with their figures resolving digit by digit. */
    drawLedger(ctx, t, a, fx) {
      const L = this.file.ledger;
      if (!L || !this.hud) return;
      const rows = L.rows.filter(r => seg(t, this.T[r.id].in, 0.01) > 0);
      if (!rows.length && !L.showEmpty) return;
      const hin = this.hudAt == null ? 1 : ease.outCubic(seg(t, this.hudAt + 0.25, 0.7));
      const w = 420, x = W - 72 - w, y0 = 66;
      ctx.save();
      ctx.globalAlpha *= a * hin;
      if (rows.length) this.plate(ctx, x - 24, 36, w + 48, 340);
      ctx.font = UF.font.mono(13, 'bold');
      D.text(ctx, L.title, x + w, y0, { color: CHALK(0.72), spacing: 4, align: 'right' });
      ctx.fillStyle = CHALK(0.16);
      ctx.fillRect(x, y0 + 12, w, 1);
      let y = y0 + 44;
      if (!rows.length) {
        ctx.font = UF.font.mono(15, 'bold');
        D.text(ctx, '—', x + w, y, { color: CHALK(0.3), align: 'right' });
      }
      for (const r of rows) {
        const T = this.T[r.id], p = seg(t, T.in, 0.5), e = ease.outCubic(p);
        const big = !!r.total;
        if (big) {
          ctx.fillStyle = CHALK(0.25 * e);
          ctx.fillRect(x + w * (1 - e), y - 18, w * e, 1);
          y += 14;
        }
        ctx.save();
        ctx.globalAlpha *= e;
        ctx.translate((1 - e) * 18, 0);
        const col = r.tone ? tone(r.tone) : PAPER;
        const val = p < 1 ? D.scramble(r.value, seg(t, T.in + 0.1, 0.6), Math.floor(t * 30), '0123456789') : r.value;
        ctx.font = UF.font.mono(13, 'bold');
        D.text(ctx, r.label.toUpperCase(), x, y + (big ? 2 : 0), { color: CHALK(big ? 0.7 : 0.5), spacing: 1.5 });
        ctx.font = big ? UF.font.display(36) : UF.font.mono(19, 'bold');
        D.text(ctx, val, x + w, y + (big ? 6 : 1), { color: col, spacing: big ? 1 : 0.5, align: 'right' });
        ctx.restore();
        if (!this.quiet && T.in > -Infinity) kick(fx, t, T.in + 0.6, { rgb: 0.08, decay: 14 });
        y += big ? 50 : 32;
      }
      ctx.restore();
    }

    drawLegend(ctx, t, a) {
      const lg = this.legend;
      if (!lg) return;
      const at = lg.at ?? 0, out = lg.out ?? Infinity;
      const types = lg.types || Object.keys(THREADS);
      const x = 72, y = H - 64 - types.length * 28;
      ctx.save();
      ctx.globalAlpha *= a;
      types.forEach((ty, i) => {
        const k = UF.win(t, at + i * 0.12, out, 0.4, 0.5);
        if (k <= 0) return;
        const st = THREADS[ty], yy = y + i * 28;
        ctx.globalAlpha = a * k;
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 2.2;
        ctx.setLineDash(st.dash || []);
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 40 * ease.outCubic(k), yy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = UF.font.mono(12, 'bold');
        D.text(ctx, st.label, x + 56, yy + 4.5, { color: CHALK(0.7), spacing: 2 });
      });
      ctx.restore();
    }

    drawFootnote(ctx, t, a) {
      const note = this.file.footnote;
      if (!note || !this.hud) return;
      ctx.save();
      ctx.globalAlpha *= a * 0.9;
      ctx.font = UF.font.mono(11, 'bold');
      D.text(ctx, note.toUpperCase(), W - 72, H - 44, { color: CHALK(0.36), spacing: 2, align: 'right' });
      ctx.restore();
    }

    /** The full-frame picture the card dives into (or comes out of): colour returns as it fills the frame. */
    drawPortal(ctx, t, fx, k) {
      const P = this.portal;
      const img = P.image ? UF.images[P.image] : null;
      ctx.save();
      ctx.globalAlpha *= k;
      if (imageReady(img)) {
        ctx.filter = `grayscale(${(0.85 * (1 - k)).toFixed(3)})`;
        drawCover(ctx, img, 0, 0, W, H, P.imageY ?? 0.5);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = P.color || '#07080a';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      if (!this.quiet) kick(fx, t, P.at + P.dur * (P.dir === 'out' ? 0.15 : 0.8), { rgb: 0.4, decay: 8 });
    }

    editorial() {
      const L = this.lineN, F = this.file;
      const stamps = [];
      for (const s of F.slots) for (const st of s.stamps) if (st.line == null || st.line <= L) stamps.push(String(st.text).split('\n')[0]);
      return { factual: true, sourced: !!F.footnote, cardStamps: stamps };
    }
  }

  /* ================================================================== */
  /* CaseFileWall — the same board on the narrator room's wall           */
  /* ================================================================== */
  class CaseFileWall extends CaseFileBoard {
    constructor(o) {
      super(Object.assign({ x: 560, y: 420, w: 760, hud: false, drift: 0, quiet: true, camera: [{ t: 0, center: 'all' }] }, o));
      this.hgt = this.w * this.file.height / this.file.width;
      this.k = this.w / this.file.width;
    }

    /** Room coordinates of a slot's centre, for a Character's hand target. */
    point(id, dx = 0, dy = 0) {
      const s = this.known(id);
      return [this.x - this.w / 2 + (s.x + dx) * this.k, this.y - this.hgt / 2 + (s.y + dy) * this.k];
    }

    pickRes(scale) { return clamp(Math.ceil(scale * this.k * 2.5 * 4) / 4, 0.5, 2); }

    setup(stage) {
      slate();
      const res = this.pickRes(stage && stage.scale ? stage.scale : 1);
      for (const s of this.file.slots) if (this.T[s.id].in !== Infinity) this.file.face(s, false, res);
    }

    draw(ctx, t, fx, scene) {
      if (fx) { fx.grain *= 0.2; fx.scan = 0; }
      const a = this.vis(t);
      if (a <= 0) return;
      const F = this.file, w = this.w, h = this.hgt, x0 = this.x - w / 2, y0 = this.y - h / 2;
      const m = ctx.getTransform();
      this.res = this.pickRes(Math.hypot(m.a, m.b));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.drawImage(shadowSprite(w + 28, h + 28), x0 - 14 - 48, y0 - 14 - 48 + 10, w + 28 + 96, h + 28 + 96);
      const fr = ctx.createLinearGradient(0, y0 - 14, 0, y0 + h + 14);
      fr.addColorStop(0, '#3a3f46');
      fr.addColorStop(1, '#1f2329');
      ctx.fillStyle = fr;
      ctx.fillRect(x0 - 14, y0 - 14, w + 28, h + 28);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(x0 - 14, y0 - 14, w + 28, 1.5);
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      ctx.translate(x0, y0);
      ctx.scale(this.k, this.k);
      this.surface(ctx, [0, 0, F.width, F.height]);
      this.drawBoard(ctx, t, fx, this.k, false);
      ctx.restore();
      const gl = ctx.createLinearGradient(x0, y0, x0 + w * 0.6, y0 + h);
      gl.addColorStop(0, 'rgba(255,255,255,.05)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(x0, y0, w, h);
      ctx.restore();
    }
  }

  UF.CaseFile = CaseFile;
  UF.CaseFileBoard = CaseFileBoard;
  UF.CaseFileWall = CaseFileWall;
  UF.CaseFile.THREADS = THREADS;
  UF.CaseFile.TONES = TONES;
})(window.UF);
