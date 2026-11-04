// uses: kal
// Ships' crews and the ship builder (Joseph, 2026-11-04): a captain of level 3 (fighter, barbarian, paladin or ranger)
// and a crew by her kind; fishing boats small, most ships medium, passenger ships large, each its own deck; going aboard;
// adding a ship by type or random, her size and crew count.
const crewOf = s => [s.captain, ...(s.crew || [])].map(libNpcById).filter(Boolean);
const crewSay = p => `${p.cls || "folk"} ${p.level || "-"}`;
step("a fleet rolled: every ship with crew rules has her crew, by her kind", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll();
  const F = root.fleet, by = k => F.filter(s => s.kind === k), first = k => by(k)[0], tally = s => { const c = {}; for (const p of crewOf(s).slice(1)) c[crewSay(p)] = (c[crewSay(p)] || 0) + 1; return JSON.stringify(c); };
  const caps = [...new Set(F.filter(s => s.captain).map(s => libNpcById(s.captain)).map(p => `${p.cls} ${p.level}`))];
  const fam = crewOf(first("fishing")).slice(1).map(p => p.name.split(" ").pop()), genders = new Set(F.flatMap(s => crewOf(s)).map(p => p.gender));
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `captains: ${caps.join(", ")} | navy ${tally(first("navy"))} | merchant ${tally(first("merchant"))} (${crewOf(first("merchant")).slice(1).map(p => p.role.split("· ").pop()).join(", ")}) | fishing ${tally(first("fishing"))}, family ${[...new Set(fam)].join("/")} | smuggler ${tally(first("smuggler"))} | pirate ${tally(first("pirate"))} | explorer and packet crews: ${by("explorer").concat(by("packet")).map(s => (s.crew || []).length).join(",")} | genders ${[...genders].join(", ")} | in the Library: ${lib().npcs.filter(p => p.crewOf).length}`;
});
step("sizes and decks: going aboard a fishing boat, a merchantman, the pirate", async () => {
  const F = root.fleet, out = [];
  for (const k of ["fishing", "merchant", "pirate"]) { const s = F.find(x => x.kind === k), n = fleetBoard(s);
    out.push(`${k}: ${fleetSizeOf(s)}, deck ${n.bmap.preset} (${bmapOf(n).w}x${bmapOf(n).h}), hidden ${n.hidden}, kind ${n.kind}, ${n.npcs.length} aboard, ready to fight ${n.site.foes.length}`); }
  const pf = partyShip(); out.push(`the party's ship is still ${pf ? pf.name : "none"}`);
  return out.join(" | ");
});
step("the builder: a smuggler, small, a crew of 6; a random one; then one removed takes her crew with her", async () => {
  const a = fleetAdd({ kind: "smuggler", size: "small", crew: "6", mode: "wander", home: "", name: "The Quiet Gull" }), r = fleetAdd({});
  const before = lib().npcs.filter(p => p.crewOf === a.id).length, said = `${a.name}: ${a.kind}, ${fleetSizeOf(a)}, ${a.mode}, crew ${(a.crew || []).length} ${[...new Set(crewOf(a).slice(1).map(crewSay))].join("/")}`;
  fleetForget(a); root.fleet = root.fleet.filter(s => s !== a);
  return `${said} | random: ${r.name}, ${r.kind}, ${fleetSizeOf(r)}, crew ${(r.crew || []).length} | removed: her ${before} in the Library -> ${lib().npcs.filter(p => p.crewOf === a.id).length} | page errors ${__KIT.errors.length}`;
});
