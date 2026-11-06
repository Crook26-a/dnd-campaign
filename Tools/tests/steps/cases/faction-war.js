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
    const before = facRelOf("fw_i", "fw_t"); facRelAll()["fw_i|fw_t"].s = -40; delete worldOf().lastClash; worldOf().clashDays = []; fleetMeetings(d); if (facRelOf("fw_i", "fw_t") !== -40) fights++; else lets++;
    if (!root.fleet.includes(isle) || !root.fleet.includes(trip)) break; }
  const fightLines = bgLogList().slice(n0).filter(e => / beat /.test(e.text)), last = fightLines.slice(-1)[0], rel = facRelAll()["fw_i|fw_t"];
  const dead = lib().npcs.filter(p => p.dead).slice(0, 2).map(p => `${p.name}: ${p.where}`);
  return `a fight costs: no dead ${FIGHT_COST(0)}, 4 dead ${FIGHT_COST(4)}, 10 dead ${FIGHT_COST(10)} | of ${fights + lets} meetings: ${fights} fights, ${lets} let go | e.g. "${last && last.text}" | its change: ${(rel.log.slice(-2)).map(x => `${sgn(x.from)} → ${sgn(x.to)}: ${x.why}`).join(" ; ")} | the dead: ${dead.join(" / ")} | page errors ${__KIT.errors.length}`;
});
step("ship against ship at the odds of their strength: a pirate and merchants; a rich passenger ship with guards and escort", async () => {
  const d = campaignDay(), mkPir = () => { const p = fleetAdd({ kind: "pirate" }); delete p.leg; p.at = null; return p; };
  const sail = v => { v.leg = { pts: [{ x: 0, y: 0 }, { x: 4000, y: 0 }], from: v.home, to: v.home, left: d - 1, arrive: d + 1, miles: 400 }; const e = fleetEscortOf(v); if (e) fleetEscortSync(e); return fleetPos(v, d); };
  const tally = (mk, n) => { const c = { robbed: 0, prize: 0, beaten: 0, off: 0, slipped: 0, odds: [] };
    for (let i = 0; i < n; i++) { const p = mkPir(), v = mk(), at = sail(v); p.pos = { x: at.x + 30, y: at.y }; const n0 = bgLogList().length; fleetMeetings(d);
      const t = bgLogList().slice(n0).map(e => e.text).join(" "), o = t.match(/odds of (\d+)%/); if (o) c.odds.push(+o[1]);
      if (/as a prize/.test(t)) c.prize++; else if (/ robbed /.test(t)) c.robbed++; else if (/beat off/.test(t)) c.beaten++; else if (/sheered off/.test(t)) c.off++; else c.slipped++;
      for (const s of [p, v, fleetEscortOf(v)]) if (s && root.fleet.includes(s)) { root.fleet = root.fleet.filter(x => x !== s); fleetForget(s); } }
    return `${c.robbed} robbed, ${c.prize} taken, ${c.beaten} beat her off, ${c.off} she sheered off, ${c.slipped} never tried (odds given: ${c.odds.slice(0, 6).join(", ")}%)`; };
  const P0 = mkPir(), M0 = fleetAdd({ kind: "merchant" }), R0 = fleetAdd({ kind: "packet", tier: "rich" }), E0 = fleetEscortOf(R0);
  const powers = `a pirate ${Math.round(shipPower(P0))} XP (${shipFighters(P0).length} fighting), a merchant ${Math.round(shipPower(M0))} (${shipFighters(M0).length}), a rich passenger ship ${Math.round(shipPower(R0))} (${shipFighters(R0).length}, her guards among them) and her escort ${Math.round(shipPower(E0))} (${shipFighters(E0).length})`;
  for (const s of [P0, M0, R0, E0]) { root.fleet = root.fleet.filter(x => x !== s); fleetForget(s); }
  return `${powers} | 40 merchants: ${tally(() => fleetAdd({ kind: "merchant" }), 40)} | 30 rich passenger ships with escorts: ${tally(() => fleetAdd({ kind: "packet", tier: "rich" }), 30)} | page errors ${__KIT.errors.length}`;
});
step("merchants' defences: a ship's mage of level 3, 4 or 5, a large one's guards; never worse than 30% against a pirate; old crews topped up", async () => {
  const P = fleetAdd({ kind: "pirate" }), pp = shipPower(P), lv = {}, odds = [];
  for (let i = 0; i < 60; i++) { const m = fleetAdd({ kind: "merchant", size: i % 3 === 0 ? "large" : i % 3 === 1 ? "small" : "" });
    const mage = m.crew.map(libNpcById).find(p => /ship's mage/.test(p.role || "")); lv[mage ? `${mage.cls} ${mage.level}`.replace(/^(\w+) /, "") : "none"] = (lv[mage ? mage.level : "none"] || 0) + 1;
    odds.push(Math.round(shipPower(m) / (shipPower(m) + pp) * 100)); root.fleet = root.fleet.filter(x => x !== m); fleetForget(m); }
  const old = fleetAdd({ kind: "merchant" }), mageId = old.crew.find(id => /ship's mage/.test(libNpcById(id).role || "")); old.crew = old.crew.filter(id => id !== mageId); delete old.defended;
  const before = shipFighters(old).length; fleetCatchUp(); const after = old.crew.map(libNpcById).filter(p => /ship's mage/.test(p.role || "")).map(p => `${p.name} (${p.cls} ${p.level})`);
  root.fleet = root.fleet.filter(x => x !== P && x !== old); fleetForget(P); fleetForget(old);
  odds.sort((a, b) => a - b);
  return `a pirate ${Math.round(pp)} | 60 merchants' mages by level: ${JSON.stringify(lv)} | a merchant's chance against her: lowest ${odds[0]}%, middle ${odds[30]}%, highest ${odds[59]}% | an old merchant with no mage: ${before} fighters, topped up with ${after.join(", ")} | page errors ${__KIT.errors.length}`;
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
step("a pair sinking into a worse stage waits on the DM: the pop-up, held off, then approved; a ceiling's own stage unasked", async () => {
  const e = facRelAll()["fw_i|fw_t"]; e.cap = 100; e.s = -55; delete e.held; worldOf().stateAsk = []; const d = campaignDay();
  facRelSet("fw_i", "fw_t", -66, "A fight at sea", d); await wait(20);
  const el = document.getElementById("stateAsk"), shown = el && !el.hidden ? el.innerText.replace(/\s+/g, " ").slice(0, 170) : "not shown", held1 = facRelOf("fw_i", "fw_t");
  el.querySelector('[data-stateask="no"]').click(); await wait(20);
  facRelSet("fw_i", "fw_t", -70, "Another fight", d); const afterHold = `${facRelOf("fw_i", "fw_t")}, asks ${facStateAsks().length}, pop-up ${el.hidden ? "gone" : "up"}`;
  delete e.held; facRelSet("fw_i", "fw_t", -66, "A third fight", d + 8); facRelSet("fw_i", "fw_t", -90, "A fourth, while the ask waits", d + 9); facRelSet("fw_i", "fw_t", -80, "A fifth", d + 9);
  const waiting = `${facRelOf("fw_i", "fw_t")}, the ask still for ${facStateAsks()[0] && facStateAsks()[0].to}`; await wait(20); el.querySelector('[data-stateask="yes"]').click(); await wait(20);
  const approved = `${facRelOf("fw_i", "fw_t")} (${facStateLabel(facRelOf("fw_i", "fw_t"))})`;
  facRelSet("fw_i", "fw_j", -50, "set", d); facRelAll()["fw_i|fw_j"].cap = -60; facRelSet("fw_i", "fw_j", -60, "The navy's line", d); const capped = `${facRelOf("fw_i", "fw_j")}, asks ${facStateAsks().length}`;
  facRelAll()["fw_i|fw_j"].cap = -40; facRelAll()["fw_i|fw_j"].s = -45;
  return `asked: "${shown}" | held a point short: ${held1} | held off, then pushed again that week: ${afterHold} | a week on, asked again, two more fights while it waits: ${waiting}; approved: ${approved} | a ceiling of −60: ${capped} | page errors ${__KIT.errors.length}`;
});
step("one fight between factions a week; the navy and pirates fight freely, pirates slipping away; one attack a week a pirate faction; two weeks in port", async () => {
  const d0 = campaignDay(), W = worldOf(); delete W.lastClash; W.clashDays = []; W.pirAttack = {};
  const L = lib(); if (!L.factions.some(f => f.id === "fw_n")) L.factions.push({ id: "fw_n", name: "The Admiralty", align: "Lawful Neutral", standing: 0, repDie: 12 });
  facRelSet("fw_i", "fw_t", -70, "set", d0, true); facRelSet("fw_n", "fw_i", -60, "set", d0, true); const en = facRelAll()[facRelKey("fw_n", "fw_i")]; en.cap = -60; en.floor = -60;
  const mk = (kind, fac) => { const s = fleetAdd({ kind, faction: fac }); delete s.leg; s.at = null; s.pos = { x: 2000, y: 2000 }; return s; };
  const i1 = mk("pirate", "fw_i"), t1 = mk("pirate", "fw_t"); let fights = 0;
  for (let k = 0; k < 14; k++) { for (const s of [i1, t1]) { if (!root.fleet.includes(s)) continue; delete s.leg; s.at = null; s.pos = { x: 2000, y: 2000 }; } const n0 = bgLogList().length; fleetMeetings(d0 + k); fights += bgLogList().slice(n0).filter(e => e.kind === "world" && / beat /.test(e.text) && e.text.includes(i1.name) && e.text.includes(t1.name)).length; if (!root.fleet.includes(i1) || !root.fleet.includes(t1)) break; }
  for (const s of [i1, t1]) if (root.fleet.includes(s)) { root.fleet = root.fleet.filter(x => x !== s); fleetForget(s); }     // out of the way: the week's fights are shared by everyone
  const atWar = []; for (const v of [-85, -97]) { facRelAll()["fw_i|fw_t"].s = v; W.clashDays = []; let n = 0; const a = mk("pirate", "fw_i"), b = mk("pirate", "fw_t");
    for (let k = 0; k < 14; k++) { for (const s of [a, b]) { if (!root.fleet.includes(s)) continue; delete s.leg; s.at = null; s.pos = { x: 2000, y: 2000 }; if ((s.crew || []).length < 3) fleetCrewRoll(s); } const n0 = bgLogList().length; fleetMeetings(d0 + 20 + k); n += bgLogList().slice(n0).filter(e => e.kind === "world" && / beat /.test(e.text) && e.text.includes(a.name) && e.text.includes(b.name)).length; if (!root.fleet.includes(a) || !root.fleet.includes(b)) break; facRelAll()["fw_i|fw_t"].s = v; }
    atWar.push(`${facStateLabel(v).toLowerCase()} ${n} in 14 days`); for (const s of [a, b]) if (root.fleet.includes(s)) { root.fleet = root.fleet.filter(x => x !== s); fleetForget(s); } }
  const navyNow = facRelOf("fw_n", "fw_i"); let slip = 0, navyFights = 0; const nv = mk("navy", "fw_n");
  for (let k = 0; k < 30; k++) { const p = mk("pirate", "fw_i"); nv.pos = { x: 2000, y: 2000 }; delete W.lastClash; W.lastClash = d0; const n0 = bgLogList().length; fleetMeetings(d0 + 1); const t = bgLogList().slice(n0).filter(e => e.kind === "world" && (e.text.includes(p.name) || e.text.includes(nv.name))).map(e => e.text).join(" "); if (/slipped away/.test(t)) slip++; if (/ beat /.test(t)) navyFights++; for (const s of [p]) if (root.fleet.includes(s)) { root.fleet = root.fleet.filter(x => x !== s); fleetForget(s); } if (!root.fleet.includes(nv)) break; }
  const pa = mk("pirate", "fw_j"); W.pirAttack = {}; let attacks = 0;
  for (let k = 0; k < 14; k++) { const v = fleetAdd({ kind: "merchant" }); v.leg = { pts: [{ x: 0, y: 0 }, { x: 4000, y: 0 }], from: v.home, to: v.home, left: d0 - 1, arrive: d0 + 30, miles: 400 }; const at = fleetPos(v, d0 + k); delete pa.leg; pa.at = null; pa.pos = { x: at.x + 30, y: at.y }; delete pa.robbed;
    const n0 = bgLogList().length; fleetMeetings(d0 + k); if (/ robbed | as a prize|beat off/.test(bgLogList().slice(n0).map(e => e.text).join(" "))) attacks++; if (root.fleet.includes(v)) { root.fleet = root.fleet.filter(x => x !== v); fleetForget(v); } if (!root.fleet.includes(pa)) break; }
  const port = repPorts()[0], pp = fleetAdd({ kind: "pirate" }); pp.leg = { pts: [{ x: port.x - 100, y: port.y }, { x: port.x, y: port.y }], from: null, to: port.id, left: d0 - 1, arrive: d0, miles: 10 }; root.fday = d0 - 1; fleetCatchUp();
  return `isles–Tripolitania at −70, their ships side by side 14 days: ${fights} fight(s); at ${atWar.join(", ")} | the navy at −60 fixed (now ${navyNow}); 30 pirates meeting a navy ship, a fight already this week: slipped away ${slip}, fought ${navyFights} | a pirate faction's attacks on merchants in 14 days: ${attacks} | a pirate into port on day ${d0} stays till day ${pp.stay} (${pp.leg ? "still at sea?" : "in port"}) | page errors ${__KIT.errors.length}`;
});
step("ninety days with it all running: what happened at sea", async () => {
  facRelAll()["fw_i|fw_t"].s = -65; worldOf().day = campaignDay(); root.fday = campaignDay(); const n0 = bgLogList().length;
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 90); dn.dispatchEvent(new Event("change")); await wait(80);
  const L = bgLogList().slice(n0), c = r => L.filter(e => r.test(e.text)).length;
  return `fights ${c(/ beat /)}, robbed ${c(/ robbed /)}, prizes ${c(/as a prize/)}, scared off ${c(/sheered off/)}, strays ${c(/strayed into/)}, hunting ${c(/hunting ships of/)}, parleys ${c(/parley/)}, peace sued ${c(/sue for peace/)}, blood money ${c(/blood money/)} | Isles–Tripolitania now ${sgn(facRelOf("fw_i", "fw_t"))} | dead in the Library ${lib().npcs.filter(p => p.dead).length} | ships ${root.fleet.length} | page errors ${__KIT.errors.length}`;
});
