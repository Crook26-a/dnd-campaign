// uses: kal
// Feuds at sea (Joseph, 2026-11-06): −100 to +100 (old ×10); waters by quadrant from Kalatecha; 5% of voyages a stray
// some 50 miles into another's waters, 70% a fight if one of theirs is within 10 miles; fights −5 and −1 a death; at −60
// hunting (a quarter of voyages), −80 war (half), −95 extermination (all); pirates rob ships sailing by (mostly
// robbed, a fifth taken); tempers cool by exhaustion, parley, blood money, a common enemy; ceilings.
const fwMk = (id, name, al, waters) => { const L = lib(); L.factions = (L.factions || []).filter(f => f.id !== id); L.factions.push({ id, name, align: al, standing: 0, repDie: 12, ...(waters ? { waters } : {}) }); return factionById(id); };
const fwKal = () => root.nodes.find(n => n.name === "Kalatecha");
step("the old scale times ten; waters; an isle pirate's voyages: her own quadrant, now and then a stray", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.world; delete root.fleet; seaLanesFromMap(); fleetRoll();
  const L = lib(); L.facRel = { "fw_i|fw_t": { s: -4, log: [] } }; delete L.facRelScale;
  fwMk("fw_t", "Tripolitania", "Neutral Evil", ["NW", "NE", "SW"]); fwMk("fw_i", "The Isle Crews", "Chaotic Neutral", ["SE"]); fwMk("fw_j", "The Ledger Men", "Lawful Evil", ["SE"]);
  const migrated = facRelOf("fw_i", "fw_t"); facRelAll()["fw_i|fw_t"].cap = -50; facRelSet("fw_i", "fw_t", -40, "set");
  const K = fwKal(), P = repPorts(), q = n => quadOf(n.x, n.y), se = P.filter(n => q(n) === "SE" && n !== K), nw = P.filter(n => q(n) !== "SE" && n !== K);
  const isle = fleetAdd({ kind: "pirate", home: se[0].id, faction: "fw_i" }), trip = fleetAdd({ kind: "pirate", home: nw[0].id, faction: "fw_t" });
  let own = 0, strays = 0, other = 0, depth = []; for (let i = 0; i < 400; i++) { isle.at = isle.home; delete isle.pos; const g = fleetNext(isle); if (!g || !g.lurk) continue;
    if (g.stray) { strays++; const c = watersCentre(); depth.push(Math.round(Math.min(g.lurk.x > c.x ? 1e9 : (c.x - g.lurk.x), g.lurk.y > c.y ? 1e9 : (c.y - g.lurk.y)) / root.ppm)); } else if (quadOf(g.lurk.x, g.lurk.y) === "SE") own++; else other++; }
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `old −4 now ${migrated}; held to its ceiling: set −40, kept ${facRelOf("fw_i", "fw_t")} | measured from ${watersCentre().name}; ${se.length} ports south-east, ${nw.length} elsewhere | 400 voyages of ${isle.name}: ${own} in her own waters, ${strays} strays (miles over the line: ${depth.slice(0, 8).join(", ")}), ${other} elsewhere`;
});
step("a stray met within 10 miles: 70% a fight; a fight: dead marked in the Library, −5 and −1 a death, the hold taken", async () => {
  const isle = root.fleet.find(s => s.faction === "fw_i"), trip = root.fleet.find(s => s.faction === "fw_t"), d = campaignDay();
  let fights = 0, lets = 0; const n0 = bgLogList().length;
  for (let i = 0; i < 40; i++) { for (const s of [isle, trip]) { delete s.leg; s.at = null; s.pos = { x: 1000, y: 1000 }; } isle.stray = "fw_t"; delete isle.strayMet; isle.captain = isle.captain || null;
    const before = facRelOf("fw_i", "fw_t"); facRelAll()["fw_i|fw_t"].s = -40; fleetMeetings(d); if (facRelOf("fw_i", "fw_t") !== -40) fights++; else lets++;
    if (!root.fleet.includes(isle) || !root.fleet.includes(trip)) break; }
  const fightLines = bgLogList().slice(n0).filter(e => / beat /.test(e.text)), last = fightLines.slice(-1)[0], rel = facRelAll()["fw_i|fw_t"];
  const dead = lib().npcs.filter(p => p.dead).slice(0, 2).map(p => `${p.name}: ${p.where}`);
  return `of ${fights + lets} meetings: ${fights} fights, ${lets} let go | e.g. "${last && last.text}" | its change: ${(rel.log.slice(-2)).map(x => `${sgn(x.from)} → ${sgn(x.to)}: ${x.why}`).join(" ; ")} | the dead: ${dead.join(" / ")} | page errors ${__KIT.errors.length}`;
});
step("pirates rob ships sailing by: mostly robbed, a fifth taken; an escort scares them off", async () => {
  const d = campaignDay(), pir = root.fleet.find(s => s.kind === "pirate" && !s.faction) || root.fleet.find(s => s.kind === "pirate");
  let robbed = 0, taken = 0, scared = 0;
  for (let i = 0; i < 60; i++) { const v = fleetAdd({ kind: "merchant" }); v.cargo = { wine: { n: 10, paid: 12, from: v.home } };
    v.leg = { pts: [{ x: 0, y: 0 }, { x: 4000, y: 0 }], from: v.home, to: v.home, left: d - 1, arrive: d + 1, miles: 400 }; const at = fleetPos(v, d);
    delete pir.leg; pir.at = null; pir.pos = { x: at.x + 30, y: at.y }; delete pir.hunting; delete pir.robbed; const n0 = bgLogList().length; fleetMeetings(d);
    const t = bgLogList().slice(n0).map(e => e.text).join(" "); if (/as a prize/.test(t)) taken++; else if (/robbed/.test(t)) robbed++; if (root.fleet.includes(v)) { root.fleet = root.fleet.filter(x => x !== v); fleetForget(v); } }
  const rich = fleetAdd({ kind: "packet", tier: "rich" }); rich.leg = { pts: [{ x: 0, y: 0 }, { x: 4000, y: 0 }], from: rich.home, to: rich.home, left: d - 1, arrive: d + 1, miles: 400 }; fleetEscortSync(fleetEscortOf(rich));
  for (let i = 0; i < 40; i++) { const at = fleetPos(rich, d); delete pir.leg; pir.at = null; pir.pos = { x: at.x + 30, y: at.y }; delete pir.robbed; const n0 = bgLogList().length; fleetMeetings(d); if (/sheered off/.test(bgLogList().slice(n0).map(e => e.text).join(" "))) scared++; if (!root.fleet.includes(rich)) break; }
  return `60 merchants passing ${pir.name}: ${robbed} robbed, ${taken} taken as prizes, ${60 - robbed - taken} slipped by | a rich passenger ship with her escort, 40 times: scared off ${scared} | replacements due ${worldOf().replace.length} | page errors ${__KIT.errors.length}`;
});
step("hunting at −60, war at −80, extermination at −95: the share of voyages hunting; tempers cooling; ceilings", async () => {
  const trip = root.fleet.find(s => s.faction === "fw_t") || fleetAdd({ kind: "pirate", faction: "fw_t", home: repPorts().find(n => quadOf(n.x, n.y) === "NW").id });
  facRelAll()["fw_i|fw_t"].cap = 100; const out = [];
  for (const v of [-60, -80, -95]) { facRelAll()["fw_i|fw_t"].s = v; let h = 0, n = 0; for (let i = 0; i < 200; i++) { trip.at = trip.home; delete trip.pos; const g = fleetNext(trip); if (!g || !g.lurk) continue; n++; if (g.hunt) h++; } out.push(`${v}: ${Math.round(h / Math.max(1, n) * 100)}% hunting`); }
  const e = facRelAll()["fw_i|fw_t"]; e.s = -70; e.clashes = [{ day: campaignDay(), dead: { fw_i: 12 } }]; const n0 = bgLogList().length;
  for (let w = 0; w < 12; w++) facCoolWeek(campaignDay());
  const cools = bgLogList().slice(n0).filter(x => x.kind === "factions").map(x => x.text.replace(/^.*?: /, "")).slice(0, 4);
  facRelSet("fw_i", "fw_j", -45, "set"); facRelAll()["fw_i|fw_j"].cap = -40; facRelSet("fw_i", "fw_j", 10, "a gift"); const capped = facRelOf("fw_i", "fw_j");
  return `${out.join(", ")} | twelve weeks from −70 with 12 of the isles' dead: now ${sgn(facRelOf("fw_i", "fw_t"))}: ${cools.join(" || ")} | isles pair, ceiling −40, a +55 gift: ${capped} | page errors ${__KIT.errors.length}`;
});
step("ninety days with it all running: what happened at sea", async () => {
  facRelAll()["fw_i|fw_t"].s = -65; worldOf().day = campaignDay(); root.fday = campaignDay(); const n0 = bgLogList().length;
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 90); dn.dispatchEvent(new Event("change")); await wait(80);
  const L = bgLogList().slice(n0), c = r => L.filter(e => r.test(e.text)).length;
  return `fights ${c(/ beat /)}, robbed ${c(/ robbed /)}, prizes ${c(/as a prize/)}, scared off ${c(/sheered off/)}, strays ${c(/strayed into/)}, hunting ${c(/hunting ships of/)}, parleys ${c(/parley/)}, peace sued ${c(/sue for peace/)}, blood money ${c(/blood money/)} | Isles–Tripolitania now ${sgn(facRelOf("fw_i", "fw_t"))} | dead in the Library ${lib().npcs.filter(p => p.dead).length} | ships ${root.fleet.length} | page errors ${__KIT.errors.length}`;
});
