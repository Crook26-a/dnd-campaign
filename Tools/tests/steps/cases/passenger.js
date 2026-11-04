// uses: kal
// Passenger ships (Joseph, 2026-11-04): a fighter of level 3 for captain; 10 crew (5 hospitality, 4 guards of level 4,
// a cleric of level 5); 19 passengers (10 low, 5 middle, 4 first class); three decks: the deck, the cabins, steerage.
const passOf = s => [s.captain, ...(s.crew || []), ...(s.pass || [])].map(libNpcById).filter(Boolean);
step("a passenger ship rolled: her captain, her crew and her passengers", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll();
  const s = root.fleet.find(x => x.kind === "packet"), cap = libNpcById(s.captain), tally = {};
  for (const p of (s.crew || []).map(libNpcById)) { const k = `${p.role.split("· ").pop()} ${p.cls} ${p.level}`; tally[k] = (tally[k] || 0) + 1; }
  const fares = {}; for (const p of (s.pass || []).map(libNpcById)) fares[p.fare] = (fares[p.fare] || 0) + 1;
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `${s.name}: captain ${cap.name}, ${cap.cls} ${cap.level} | crew ${(s.crew || []).length}: ${JSON.stringify(tally)} | passengers ${JSON.stringify(fares)}, e.g. ${(s.pass || []).map(libNpcById).filter((p, i) => [0, 10, 15].includes(i)).map(p => `${p.name} (${p.role})`).join(" / ")}`;
});
step("going aboard: three decks, each its own map, her people on each", async () => {
  const s = root.fleet.find(x => x.kind === "packet"); fleetGoAboard(s); await wait(60);
  const P = plans["fv_" + s.id], out = [`in her plan: ${planOf === "fv_" + s.id}, floor ${curFloor()}`];
  for (const r of P.nodes) { const n = { ...r }, b = bmapOf(n); out.push(`${r.name} (${r.floor}): ${r.bmap.preset} ${b.w}x${b.h}, ${r.npcs.length} people, ${r.site.foes.length} ready to fight`); }
  leavePlan(); return out.join(" | ") + ` | page errors ${__KIT.errors.length}`;
});
step("a new crew keeps the decks but moves the people; the ship gone takes her decks and her people", async () => {
  const s = root.fleet.find(x => x.kind === "packet"), id = "fv_" + s.id, old = plans[id].nodes[0].npcs[0];
  fleetCrewRoll(s); fleetBoard(s); const moved = plans[id].nodes[0].npcs[0] !== old, n = passOf(s).length;
  fleetForget(s); root.fleet = root.fleet.filter(x => x !== s);
  return `people rolled anew: ${moved} (${n} aboard) | after she's gone: plan ${!!plans[id]}, in the Library ${lib().npcs.filter(p => p.crewOf === s.id).length} | page errors ${__KIT.errors.length}`;
});
