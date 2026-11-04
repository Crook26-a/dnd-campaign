// uses: kal
// Cargo and trade (Joseph, 2026-11-04): every place makes 4 goods and wants 4; prices move with what ships unload and
// buy, back by a tenth a day; ships trade in port and steer by it; the party buys and sells from a place's card.
step("markets rolled; a fleet put to sea with cargo from home", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; delete root.trade; seaLanesFromMap(); fleetRoll();
  const P = repPlaces().filter(n => tradeIsPlace(n)), ex = P.slice(0, 3).map(n => `${n.name} (${n.kind}) makes ${tradePlace(n.id).make.join("/")}, wants ${tradePlace(n.id).want.join("/")}`);
  const traders = root.fleet.filter(s => TRADE_SHIPS.has(s.kind)), routes = root.fleet.filter(s => s.mode === "route" && TRADE_SHIPS.has(s.kind)).map(s => s.route.map(id => repPlaceName(id)).join(">"));
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `${P.length} markets | ${ex.join(" | ")} | traders loaded: ${traders.map(s => `${s.name} ${tradeLoaded(s.cargo)}/${tradeCap(s)} ${Object.keys(s.cargo || {}).join("+")}`).join(", ")} | routes: ${routes.join("; ")}`;
});
step("a glut: 40 loads unloaded halves the price; it drifts back", async () => {
  const town = repPlaces().find(n => n.kind === "town" && tradeIsPlace(n)), g = "spices", before = tradeBuyAt(town.id, g, 1);
  tradeBump(town.id, g, 40); const after = tradeBuyAt(town.id, g, 1), D = campaignDay(), week = tradeBuyAt(town.id, g, 1, D + 7), month = tradeBuyAt(town.id, g, 1, D + 30);
  return `${town.name}, spices: ${before} gp, after 40 loads ${after}, a week on ${week}, a month on ${month} (base 60)`;
});
step("sixty days: ships trade as they call; their holds and their takings", async () => {
  root.day = (root.day || 1) + 60; fleetCatchUp();
  const T = root.fleet.filter(s => TRADE_SHIPS.has(s.kind)), moved = Object.values(tradeOf().glut).reduce((a, m) => a + Object.keys(m).length, 0);
  return `trades: ${T.map(s => (s.trades || []).length).join(",")} | made: ${T.map(s => Math.round(s.gain || 0)).join(",")} gp | markets with a glut: ${moved} | e.g. ${T.filter(s => (s.trades || []).length).slice(0, 2).map(s => `${s.name}: day ${s.trades[0].day} at ${repPlaceName(s.trades[0].at)}, ${s.trades[0].did.join(", ")}`).join(" / ")} | page errors ${__KIT.errors.length}`;
});
step("magic in the hold: the odds over 4000 ports each, a passenger ship, a merchantman, the pirate", async () => {
  const out = [];
  for (const k of ["packet", "merchant", "pirate"]) { const s = { kind: k }, c = {}; for (let i = 0; i < 4000; i++) { fleetMagicRoll(s); for (const t of s.magic) { const r = libLootById(t).rarity; c[r] = (c[r] || 0) + 1; } }
    out.push(`${k}: ${Object.entries(c).map(([r, n]) => `${r} ${(n / 40).toFixed(1)}%`).join(", ")}`); }
  const p = root.fleet.find(s => s.kind === "pirate"); fleetPlunder(p);
  return out.join(" | ") + ` | the pirate's plunder: ${Object.entries(p.cargo).map(([g, c]) => `${c.n} ${g}`).join(", ")}`;
});
step("aboard: the magic hidden in her hold; seize her cargo; take an item, and it's gone from her", async () => {
  const s = root.fleet.find(x => x.kind === "packet"); s.magic = ["srd:dragon-orb#ctest"]; s.magicSig = "mgtest"; s.magicNote = [];
  s.cargo = { silk: { n: 12, paid: 70, from: s.home } }; tradeOf().hold = {}; tradeOf().cap = 40;
  fleetGoAboard(s); await wait(60); const st = plans["fv_" + s.id].nodes.find(r => r.id === "fvrl").site;
  const inHold = `${st.items.join(",")} hidden DC ${st.hide["srd:dragon-orb#ctest"]} at ${st.where["srd:dragon-orb#ctest"]}`;
  select("node", "fvrl"); renderPane(true); await wait(30); const card = !!document.querySelector(`[data-seize="silk"]`);
  document.querySelector(`[data-seizeqty="silk"]`).value = "8"; document.querySelector(`[data-seize="silk"]`).click(); await wait(30);
  st.items = []; fleetBoard(s); leavePlan();
  return `in steerage's hold: ${inHold} | seize on her card: ${card} | after seizing 8: hers ${s.cargo.silk.n}, the party's ${JSON.stringify(Object.values(tradeOf().hold))} | the orb taken: hers now ${s.magic.length} | page errors ${__KIT.errors.length}`;
});
step("stolen cargo: sold unseen, sold and caught, a pirate's plunder turned in and suspected, a navy search", async () => {
  if (!tradeNavy()) (lib().factions = lib().factions || []).push({ id: "lfa_admiralty", name: "The Admiralty", standing: 0 });     // the fixture is older than the Admiralty
  const town = repPlaces().find(n => n.kind === "town" && tradeIsPlace(n)), pc = partyRoster()[0], T = tradeOf(), R = stolenRules(), f = tradeNavy();
  T.payer = pc.id; purseOf(pc).gp += 2000; T.office = { [town.id]: true }; select("node", town.id); renderPane(true); await wait(30);
  const gp = () => Math.round(purseGp(purseOf(pc))), st0 = standingOf(f), deeds0 = repOf().deeds.length, out = [];
  T.hold = { "silk|piracy|a": { g: "silk", n: 5, paid: 0, stolen: "piracy", from: "The Test" } }; R.sell = 0; renderPane(true); let g0 = gp();
  document.querySelector('[data-trade="fence"]').click(); await wait(30); out.push(`sold unseen: +${gp() - g0} gp`);
  T.hold = { "silk|piracy|a": { g: "silk", n: 5, paid: 0, stolen: "piracy", from: "The Test" } }; R.sell = 100; renderPane(true); g0 = gp();
  document.querySelector('[data-trade="fence"]').click(); await wait(30); out.push(`caught selling: ${gp() - g0} gp, hold ${Object.keys(T.hold).length}, ${f.name} ${st0} -> ${standingOf(f)}`);
  T.hold = { "rum|pirate|b": { g: "rum", n: 10, paid: 0, stolen: "pirate", from: "The Faithful Tide" } }; R.suspect = 100; renderPane(true); g0 = gp(); const st1 = standingOf(f);
  document.querySelector('[data-trade="prize"]').click(); await wait(30); out.push(`turned in: +${gp() - g0} gp, suspected ${tradeSuspect()}, ${st1} -> ${standingOf(f)}`);
  T.hold = { "rum|pirate|b": { g: "rum", n: 10, paid: 0, stolen: "pirate", from: "The Faithful Tide" }, wine: { n: 3, paid: 12 } }; R.search = 100; g0 = gp();
  tradeNavySearch("HMS Test", town.id); out.push(`searched: ${gp() - g0} gp, left in the hold ${Object.keys(T.hold).join(",")}`);
  Object.assign(R, STOLEN_RULES); T.hold = {};
  return out.join(" | ") + ` | deeds +${repOf().deeds.length - deeds0}: ${repOf().deeds.slice(deeds0).map(d => `${d.text} (${d.size})`).join("; ")} | page errors ${__KIT.errors.length}`;
});
step("piracy: an honest ship robbed with everyone alive is a deed (once); robbed after a fight that left nobody, none", async () => {
  const s = root.fleet.find(x => x.kind === "merchant" && (x.crew || []).length), key = "fv_" + s.id, d0 = repOf().deeds.length; tradeOf().hold = {};
  s.cargo = { wine: { n: 10, paid: 12, from: s.home } }; s.met = campaignDay(); delete s.piracyAt; fleetGoAboard(s); await wait(60);
  const said = (document.querySelector(`[data-seize="wine"]`).closest("p, div").parentElement.innerText.match(/Left to tell[^.]*\./) || [""])[0];
  for (let i = 0; i < 2; i++) { document.querySelector(`[data-seizeqty="wine"]`).value = "4"; document.querySelector(`[data-seize="wine"]`).click(); await wait(30); }
  const D = repOf().deeds.slice(d0), first = D.map(d => `${d.text} (${d.size} ${d.fame}, at ${repPlaceName(d.place)}, seen by ${d.seenBy.length})`).join("; ");
  s.cargo = { rum: { n: 5, paid: 10, from: s.home } }; s.met = campaignDay(); delete s.piracyAt; repOf().lastWitness = { day: campaignDay(), place: key, room: key, at: s.name, seen: [], names: [] };
  renderPane(true); await wait(30); document.querySelector(`[data-seize="rum"]`).click(); await wait(30);
  tradeOf().hold = {};
  return `the card said: "${said}" | deeds after two seizures: ${D.length}: ${first} | after a fight with no survivors: ${repOf().deeds.length - d0 - D.length} more | page errors ${__KIT.errors.length}`;
});
step("the party: the market on a town's card, buy 5 with a character's coin, sell 5", async () => {
  const town = repPlaces().find(n => n.kind === "town" && tradeIsPlace(n)), pc = partyRoster()[0], g = tradePlace(town.id).make[0];
  select("node", town.id); pane = "inspect"; renderPane(true); await wait(30);
  const card = !!document.querySelector('[data-trade="reroll"]'); tradeOf().payer = pc.id; purseOf(pc).gp += 500; const gp0 = purseGp(purseOf(pc));
  const q = document.querySelector(`[data-tradeqty="${g}"]`); q.value = "5"; document.querySelector(`[data-trade="buy"][data-g="${g}"]`).click(); await wait(30);
  const gp1 = purseGp(purseOf(pc)), held = { ...(tradeOf().hold[g] || {}) };
  const q2 = document.querySelector(`[data-tradeqty="${g}"]`); q2.value = "5"; document.querySelector(`[data-trade="sell"][data-g="${g}"]`).click(); await wait(30);
  return `card has the market: ${card} | ${pc.name} bought 5 ${g} at ${town.name}: ${gp0} -> ${Math.round(gp1 * 100) / 100} gp, hold ${held ? held.n : 0} | sold back: ${Math.round(purseGp(purseOf(pc)) * 100) / 100} gp, hold ${(tradeOf().hold[g] || {}).n || 0} | page errors ${__KIT.errors.length}`;
});
