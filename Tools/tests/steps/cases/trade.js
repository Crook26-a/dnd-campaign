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
step("the party: the market on a town's card, buy 5 with a character's coin, sell 5", async () => {
  const town = repPlaces().find(n => n.kind === "town" && tradeIsPlace(n)), pc = partyRoster()[0], g = tradePlace(town.id).make[0];
  select("node", town.id); pane = "inspect"; renderPane(true); await wait(30);
  const card = !!document.querySelector('[data-trade="reroll"]'); tradeOf().payer = pc.id; purseOf(pc).gp += 500; const gp0 = purseGp(purseOf(pc));
  const q = document.querySelector(`[data-tradeqty="${g}"]`); q.value = "5"; document.querySelector(`[data-trade="buy"][data-g="${g}"]`).click(); await wait(30);
  const gp1 = purseGp(purseOf(pc)), held = { ...(tradeOf().hold[g] || {}) };
  const q2 = document.querySelector(`[data-tradeqty="${g}"]`); q2.value = "5"; document.querySelector(`[data-trade="sell"][data-g="${g}"]`).click(); await wait(30);
  return `card has the market: ${card} | ${pc.name} bought 5 ${g} at ${town.name}: ${gp0} -> ${Math.round(gp1 * 100) / 100} gp, hold ${held ? held.n : 0} | sold back: ${Math.round(purseGp(purseOf(pc)) * 100) / 100} gp, hold ${(tradeOf().hold[g] || {}).n || 0} | page errors ${__KIT.errors.length}`;
});
