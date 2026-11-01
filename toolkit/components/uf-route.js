/*!
 * Unfiction GFX Toolkit — RouteMap
 * A dated trail across the WorldMap: the camera follows a traveller (a person, a shipment,
 * a transfer) from stop to stop, each leg drawn as a dashed line, with a date chip in the corner.
 *
 *   new UF.RouteMap({
 *     stops: [
 *       { place: 'LONDON',    date: 'DAY 1', sub: 'Departs', icon: 'jet' },
 *       { place: 'SINGAPORE', date: 'DAY 2', sub: 'Meets courier', side: 'left' },
 *       { place: 'MANILA',    date: 'DAY 4', sub: 'Cash withdrawn', icon: 'cash' },
 *       { place: 'MACAU',     date: 'DAY 6', sub: 'Casino', side: 'left' },
 *     ],
 *     vehicle: 'jet',
 *   })
 *
 * A stop's label sits on the side away from the line arriving at it unless `side` says otherwise.
 * Stops without `at` follow each other: `hold` seconds at a stop, then `travel` seconds to the
 * next (both can be set per stop). The camera starts on the whole route, pushes in to the first
 * stop, follows every leg (pulling out mid-leg when both ends do not fit at `zoom`) and ends on
 * the whole route again unless overview is false. Set follow: false to drive `camera` yourself.
 * Extra `pins` and `arcs` work exactly as on WorldMap and are drawn alongside the route.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease } = UF;
  const D = UF.draw;
  const G = UF.geo;
  const W = UF.W, H = UF.H;

  const STOP_KEYS = ['place', 'label', 'sub', 'date', 'at', 'travel', 'hold', 'side', 'icon', 'lift', 'color', 'legLabel'];

  class RouteMap extends UF.WorldMap {
    constructor(o = {}) {
      super(Object.assign({
        stops: [], travel: 1.6, hold: 1.4, startAt: null, zoom: 2.2, minZoom: 0.8,
        follow: true, overview: true, color: 'amber', dashed: true, lift: 0.22, vehicle: null,
        chip: 'tl', pinDates: false,
      }, o));
      if (this.stops.length < 2) throw new Error('RouteMap: needs at least two stops.');
      if (this.chip && !['tl', 'tr', 'bl', 'br'].includes(this.chip)) throw new Error(`RouteMap: chip must be 'tl', 'tr', 'bl', 'br' or false, not "${this.chip}".`);
      for (const name of [this.vehicle, ...this.stops.map(s => s.icon)]) {
        if (name && !D.iconNames.includes(name)) throw new Error(`RouteMap: unknown icon "${name}" — use one of ${D.iconNames.join(', ')}.`);
      }

      const first = this.startAt ?? (this.reveal ? (this.reveal.at ?? 0) + (this.reveal.dur ?? 1.4) : 0) + 0.4;
      this.route = this.stops.map((s, i) => {
        const unknown = Object.keys(s).filter(k => !STOP_KEYS.includes(k));
        if (unknown.length) throw new Error(`RouteMap: stop ${i + 1} has unknown key "${unknown[0]}" — use ${STOP_KEYS.join(', ')}.`);
        if (s.place == null) throw new Error(`RouteMap: stop ${i + 1} needs a place.`);
        G.place(s.place);
        return Object.assign({}, s, { label: s.label ?? (typeof s.place === 'string' ? s.place.toUpperCase() : '') });
      });
      this.route.forEach((s, i) => {
        if (i === 0) { s.arrive = s.at ?? first; return; }
        const prev = this.route[i - 1];
        s.travelDur = s.travel ?? this.travel;
        s.arrive = s.at ?? prev.arrive + (prev.hold ?? this.hold) + s.travelDur;
        s.depart = s.arrive - s.travelDur;
        if (s.depart < prev.arrive + 0.3) throw new Error(`RouteMap: stop ${i + 1} arrives at ${s.arrive}s, too soon after stop ${i} — leave at least travel + 0.3 s.`);
      });

      const awaySide = i => {
        const lon = G.place(this.route[i].place)[0];
        const other = G.place(this.route[i > 0 ? i - 1 : 1].place)[0];
        return other <= lon ? 'right' : 'left';
      };
      const stopPins = this.route.map((s, i) => ({
        place: s.place, label: s.label, side: s.side || awaySide(i), icon: s.icon, color: s.color || 'red',
        sub: this.pinDates ? [s.date, s.sub].filter(Boolean).join('  ·  ') : s.sub,
        at: i === 0 ? s.arrive : s.arrive - 0.3,
      }));
      const legArcs = this.route.slice(1).map((s, i) => ({
        from: this.route[i].place, to: s.place, at: s.depart, dur: s.travelDur, lift: s.lift ?? this.lift,
        dashed: this.dashed, flow: false, color: this.color, label: s.legLabel,
      }));
      this.pins = [...stopPins, ...this.pins];
      this.arcs = [...legArcs, ...this.arcs];
      this.legs = legArcs;
      if (this.follow) this.camera = this.followCamera();
    }

    /** Camera centre ([lon, lat]) and zoom that fit the given places. */
    fit(places) {
      const ll = places.map(p => G.place(p));
      const lons = ll.map(p => p[0]), lats = ll.map(p => p[1]);
      const bw = (Math.max(...lons) - Math.min(...lons)) * this.k, bh = (Math.max(...lats) - Math.min(...lats)) * this.k;
      const zoom = Math.min(W * 0.62 / Math.max(bw, 1), H * 0.5 / Math.max(bh, 1));
      return {
        center: [(Math.max(...lons) + Math.min(...lons)) / 2, (Math.max(...lats) + Math.min(...lats)) / 2],
        zoom: Math.max(this.minZoom, Math.min(this.zoom, zoom)),
      };
    }

    followCamera() {
      const r = this.route, Z = this.zoom;
      const all = this.fit(r.map(s => s.place));
      const cam = [{ t: 0, center: all.center, zoom: all.zoom }];
      cam.push({ t: Math.max(0.01, r[0].arrive - 0.6), center: r[0].place, zoom: Z, dur: 1.2 });
      for (let i = 1; i < r.length; i++) {
        const s = r[i], pair = this.fit([r[i - 1].place, s.place]);
        if (pair.zoom < Z * 0.95) {
          cam.push({ t: s.depart, center: pair.center, zoom: pair.zoom, dur: s.travelDur * 0.5, ease: 'inOutSine' });
          cam.push({ t: s.depart + s.travelDur * 0.5, center: s.place, zoom: Z, dur: s.travelDur * 0.5 + 0.35, ease: 'inOutSine' });
        } else {
          cam.push({ t: s.depart, center: s.place, zoom: Z, dur: s.travelDur + 0.2 });
        }
      }
      const last = r[r.length - 1];
      if (this.overview) cam.push({ t: last.arrive + (last.hold ?? this.hold), center: all.center, zoom: all.zoom, dur: 1.6 });
      return cam;
    }

    draw(ctx, t, fx) {
      super.draw(ctx, t, fx);
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      if (this.vehicle) this.drawVehicle(ctx, t);
      if (this.chip) this.drawChip(ctx, t);
      ctx.restore();
    }

    drawVehicle(ctx, t) {
      const cam = this.camAt(t), z = cam.z;
      const tx = p => [(p[0] - cam.c[0]) * z + W / 2, (p[1] - cam.c[1]) * z + H / 2];
      for (const leg of this.legs) {
        if (t < leg.at || t >= leg.at + leg.dur) continue;
        const { p } = this.arcState(t, leg);
        const [x, y] = D.pointAt(this.arcPoints(leg).map(tx), p);
        const k = Math.min(seg(t, leg.at, 0.2), 1 - seg(t, leg.at + leg.dur - 0.2, 0.2));
        ctx.save();
        ctx.globalAlpha *= k;
        ctx.fillStyle = c('black', 0.85);
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c(this.color);
        ctx.lineWidth = 2.5;
        ctx.stroke();
        D.icon(ctx, this.vehicle, x, y, 30, { color: c('paper'), width: 6 });
        ctx.restore();
      }
    }

    drawChip(ctx, t) {
      let cur = -1;
      this.route.forEach((s, i) => { if (t >= s.arrive) cur = i; });
      if (cur < 0 || !this.route.some(s => s.date)) return;
      const right = this.chip.includes('r'), bottom = this.chip.includes('b');
      const w = 330, h = 92, x = right ? W - 96 - w : 96, y = bottom ? H - 96 - h : 96;
      const k = ease.outExpo(seg(t, this.route[0].arrive, 0.5));
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.fillStyle = c('black', 0.8);
      D.roundRect(ctx, x, y, w, h, 3);
      ctx.fill();
      ctx.fillStyle = c(this.color);
      ctx.fillRect(x, y, 4, h);
      ctx.font = UF.font.mono(13, 'bold');
      D.text(ctx, `STOP ${cur + 1} OF ${this.route.length}`, x + w - 16, y + 26, { color: c('dim'), spacing: 2, align: 'right' });
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      const swap = cur > 0 ? ease.inOutCubic(seg(t, this.route[cur].arrive, 0.4)) : 1;
      const base = ctx.globalAlpha;
      const line = (s, dy, alpha) => {
        if (alpha <= 0) return;
        ctx.globalAlpha = base * alpha;
        ctx.font = UF.font.mono(30, 'bold');
        D.text(ctx, D.fit(ctx, s.date || '', w - 40), x + 22, y + 52 + dy, { color: c('paper') });
        ctx.font = UF.font.mono(15);
        D.text(ctx, D.fit(ctx, s.label, w - 40, 2), x + 22, y + 78 + dy, { color: c(this.color), spacing: 2 });
      };
      if (swap < 1) line(this.route[cur - 1], -swap * 40, 1 - swap);
      line(this.route[cur], (1 - swap) * 40, swap);
      ctx.restore();
    }

    editorial() {
      return { factual: true };
    }
  }

  UF.RouteMap = RouteMap;
})(window.UF);
