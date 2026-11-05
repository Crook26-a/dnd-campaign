// uses: kal
// Smugglers' ports and pirate hideouts (Joseph, 2026-11-05: "places to sell loot"; a hideout "very small and not really
// even drawn, but with a small area for a map"), and set routes edited by hand.
const shPlace = (kind, near, dx) => { const n = newNode(kind, near.x + dx, near.y + 30, near); n.name = kind === "hideout" ? "Gull Hole" : "Tarry Wharf"; n.port = true; if (kind === "hideout") n.hidden = true; root.nodes.push(n); return n; };
step("a smugglers' port and a hideout on the map: ports, a plan with its buildings, a map of its own, a fence", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; delete root.trade; delete root.world;
  const P0 = repPorts(), sm = shPlace("smuggle", P0[1], 25), hd = shPlace("hideout", P0[2], -25);
  seaLanesFromMap(); fleetRoll();
  const pir = root.fleet.find(s => s.kind === "pirate"), smg = root.fleet.filter(s => s.kind === "smuggler").map(s => repPlaceName(s.home));
  let honestThere = 0; for (const s of root.fleet.filter(x => FLEET_HONEST.has(x.kind) && x.mode === "wander")) for (let i = 0; i < 20; i++) { const g = fleetNext(s); if (g && shadyPort(g.to)) honestThere++; }
  enterPlan(sm.id); const inside = doc.nodes.map(n => `${n.name} (${n.kind})`).join(", "); leavePlan();
  select("node", hd.id); pane = "inspect"; syncTabs(); renderPane(true); await wait(30);
  const enterBtn = !!document.getElementById("pl-enter"), tplSel = document.querySelector('[data-shop="tpl"]');
  shopOpen(hd, "fence"); const keeper = libNpcById(hd.shop.keeper);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `ports: ${repPorts().filter(p => shadyPort(p)).map(p => `${p.name} (${KINDS[p.kind].label}, trade place ${tradeIsPlace(p)})`).join(", ")} | the pirate's home: ${repPlaceName(pir.home)} | smugglers out of ${smg.join(", ")} | honest wanderers headed for them ${honestThere} times in 20 tries each | the smugglers' port inside: ${inside} | the hideout: hidden ${!!hd.hidden}, its map "${bmapOf(hd).name}" ${bmapOf(hd).w}x${bmapOf(hd).h}, Enter button ${enterBtn}, shop picker on ${tplSel && tplSel.value} | its fence: ${keeper && keeper.name}, ${keeper && keeper.role}, ${hd.shop.items.length} things for sale`;
});
step("stolen cargo sold at the hideout: no risk, for the hideout's cut; no navy search there", async () => {
  const hd = root.nodes.find(n => n.kind === "hideout"), T = tradeOf(), pc = partyRoster()[0]; T.payer = pc.id; T.hold = { "rum|pirate|x": { g: "rum", n: 10, paid: 0, stolen: "pirate", from: "The Black Gull" } };
  select("node", hd.id); openInv.add("trade:" + hd.id); renderPane(true); await wait(30);
  const btn = document.querySelector('[data-trade="fence"]'), label = btn && btn.innerText, search = !!document.querySelector('[data-trade="search"]'), gp0 = purseGp(purseOf(pc));
  btn.click(); await wait(30);
  return `the button: "${label}" | navy search offered: ${search} | paid ${Math.round((purseGp(purseOf(pc)) - gp0) * 100) / 100} gp | the hold now ${Object.keys(T.hold).length} lots | the log: ${gameLogList().slice(-1)[0].text} | page errors ${__KIT.errors.length}`;
});
step("a set route edited: a stop moved, one taken off, one added; to wandering and back; rolled again", async () => {
  const s = root.fleet.find(x => x.mode === "route" && (x.route || []).length >= 3), out = [`was ${s.route.map(repPlaceName).join(" → ")}`];
  fleetShowEntry(s.id); openInv.add("route:" + s.id); renderNamedPane("background"); await wait(30);
  const q = sel => document.querySelector(`#pane-background ${sel}`);
  q(`[data-rt="up"][data-i="1"][data-sid="${s.id}"]`).click(); await wait(20); out.push(`2nd up: ${s.route.map(repPlaceName).join(" → ")}`);
  q(`[data-rt="del"][data-i="2"][data-sid="${s.id}"]`).click(); await wait(20); out.push(`3rd off: ${s.route.map(repPlaceName).join(" → ")}`);
  const hd = root.nodes.find(n => n.kind === "hideout"), add = q(`[data-rtadd="${s.id}"]`); add.value = hd.id; add.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const warn = (q(`[data-invfor="route:${s.id}"]`) || {}).innerText || ""; out.push(`the hideout added: ${s.route.map(repPlaceName).join(" → ")}; says: ${(warn.match(/[^.\n]*not where an honest ship[^.\n]*/) || ["(nothing)"])[0]}`);
  const m = q(`[data-fleetmode="${s.id}"]`); m.value = "wander"; m.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); out.push(`to wandering: ${s.mode}, editor shown ${!!q(`[data-invfor="route:${s.id}"]`)}`);
  const m2 = q(`[data-fleetmode="${s.id}"]`); m2.value = "route"; m2.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); out.push(`back to a route: ${s.route.length} stops kept`);
  q(`[data-rt="roll"][data-sid="${s.id}"]`).click(); await wait(20); out.push(`rolled: ${s.route.map(repPlaceName).join(" → ")}`);
  return out.join(" | ") + ` | page errors ${__KIT.errors.length}`;
});
