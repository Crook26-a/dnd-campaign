// uses: kal
// Ships that jumped (Joseph, 2026-11-05: "ships are getting to a port, disappearing, and then appearing somewhere
// else"): some lanes were saved backwards, so ships started at the far end. Day by day from the day box, every ship's
// spot on the chart: no jumps further than a day's sailing, no vanishing; then again with lanes saved backwards, as an
// older save has them.
const fjRun = async () => {
  const ppm = root.ppm || 10, last = {}, odd = [], ends = [];
  for (let d = 0; d < 40; d++) {
    const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 1); dn.dispatchEvent(new Event("change")); await wait(20);
    for (const s of root.fleet) { const p = fleetPos(s, fleetT()), speed = (FLEET_KINDS[s.kind] || FLEET_KINDS.merchant)[1];
      if (!p) { odd.push(`day ${campaignDay()} ${s.name} GONE (at ${s.at}, leg ${!!s.leg}, pos ${JSON.stringify(s.pos)})`); continue; }
      const q = last[s.id]; if (q) { const mi = Math.hypot(p.x - q.p.x, p.y - q.p.y) / ppm;
        if (mi > speed * 1.6 + 2) odd.push(`day ${campaignDay()} ${s.name} (${s.kind}, ${speed} mi/day) jumped ${Math.round(mi)} mi: was ${q.how}, now ${s.leg ? `at sea ${s.leg.from ? repPlaceName(s.leg.from) : "?"}->${repPlaceName(s.leg.to)} left ${s.leg.left} arrive ${s.leg.arrive}` : s.at ? `in ${repPlaceName(s.at)}` : "lurking"}`); }
      if (s.leg && s.leg.pts && s.leg.pts.length) { const a = s.leg.pts[0], b = s.leg.pts[s.leg.pts.length - 1], A = s.leg.from ? repNode(s.leg.from) : null, B = s.leg.to ? repNode(s.leg.to) : null;
        if (A && Math.hypot(a.x - A.x, a.y - A.y) / ppm > 5) ends.push(`${s.name}: leg starts ${Math.round(Math.hypot(a.x - A.x, a.y - A.y) / ppm)} mi from ${A.name}`);
        if (B && Math.hypot(b.x - B.x, b.y - B.y) / ppm > 5) ends.push(`${s.name}: leg ends ${Math.round(Math.hypot(b.x - B.x, b.y - B.y) / ppm)} mi from ${B.name}`); }
      last[s.id] = { p, how: s.leg ? `at sea to ${repPlaceName(s.leg.to)} (left ${s.leg.left}, arrive ${s.leg.arrive})` : s.at ? `in ${repPlaceName(s.at)}` : "lurking" }; } }
  return `odd moves ${odd.length}${odd.length ? ": " + odd.slice(0, 6).join(" || ") : ""} | leg ends off their ports ${new Set(ends).size}${ends.length ? ": " + [...new Set(ends)].slice(0, 4).join(" || ") : ""}`;
};
step("forty days, one at a time: each ship's spot each morning", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll(); render(); await wait(30);
  return await fjRun();
});
step("lanes saved backwards (an older save): forty more days", async () => {
  repOf().lanes.forEach((l, i) => { if (i % 2 && l.pts) l.pts.reverse(); });
  for (const s of root.fleet) if (s.leg && !s.leg.lurk && s.leg.pts) { s.leg.pts.reverse(); delete s.leg.ok; }     // and voyages under way on them, as they were saved
  return (await fjRun()) + ` | page errors ${__KIT.errors.length}`;
});
