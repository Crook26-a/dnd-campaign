// uses: kal
// The party's deeds move the factions (Joseph, 2026-11-06), and a deed pinned on another faction; faction pirate
// ships based at home, raiding a region now and then.
const fdMk = (id, name) => { const L = lib(); L.factions = (L.factions || []).filter(f => f.id !== id); L.factions.push({ id, name, align: "Chaotic Neutral", standing: 0, repDie: 12 }); };
const fdSt = () => ["fd_a", "fd_b", "fd_c", "fd_d"].map(id => `${factionById(id).name.replace(/^The /, "")} ${sgn(standingOf(factionById(id)))}`).join(", ");
const fdRel = () => facRelPairs().map(p => `${p.ids.map(id => factionById(id).name.replace(/^The /, "")).join("–")} ${sgn(p.e.s)}`).join(", ");
step("a notable deed hurting one faction, from the form: its friends and enemies take sides", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.world;
  fdMk("fd_a", "The Scarlet Fleet"); fdMk("fd_b", "The Black Ledger"); fdMk("fd_c", "The Keepers"); fdMk("fd_d", "The Wreckers");
  facRelSet("fd_a", "fd_b", -3, "set"); facRelSet("fd_a", "fd_c", -4, "set"); facRelSet("fd_b", "fd_c", 2, "set"); facRelSet("fd_a", "fd_d", 3, "set");
  const box = document.createElement("div"); box.id = "fdbox"; document.body.appendChild(box); box.innerHTML = repBlock(); await wait(20);
  const has = ["rep-against", "rep-helped", "rep-blame", "rep-blameroll"].map(id => `${id} ${!!document.getElementById(id)}`).join(", ");
  document.getElementById("rep-text").value = "Burned the Scarlet Fleet's powder store"; document.getElementById("rep-fame").value = "infamy"; document.getElementById("rep-size").value = "notable";
  document.getElementById("rep-against").value = "fd_a"; document.getElementById("rep-helped").value = "fd_b"; document.getElementById("rep-force").checked = true;
  box.querySelector('[data-rep="record"]').click(); await wait(30); box.remove();
  const d = repOf().deeds.slice(-1)[0];
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `fields: ${has} | the deed: against ${d.against}, helped ${d.helped}, factions told ${d.factions.join(",")} | standings: ${fdSt()} | between them: ${fdRel()}`;
});
step("pinned on another faction: one that sticks, one that fails", async () => {
  const before = fdSt(), n0 = repOf().deeds.length;
  const r1 = repRecord({ text: "Sank a Ledger cutter", who: "party", fame: "infamy", size: "notable", place: root.nodes[0].id, force: true, against: "fd_b", blame: "fd_d", blameRoll: "19" });
  const mid = fdSt(), rel1 = fdRel();
  const r2 = repRecord({ text: "Robbed the Keepers' tithe boat", who: "party", fame: "infamy", size: "minor", place: root.nodes[0].id, force: true, against: "fd_c", blame: "fd_a", blameRoll: "5" });
  const lines = gameLogList().filter(e => /Pinn/.test(e.text)).map(e => e.text);
  return `stuck: framed ${!!r1.deed.framed} (${r1.deed.frame.roll} vs ${r1.deed.frame.dc}), written in ${r1.said.length} tables, standings ${before} → ${mid}, between: ${rel1} | failed: framed ${!!r2.deed.framed} (${r2.deed.frame.roll} vs ${r2.deed.frame.dc}), written in ${r2.said.length} tables, standings now ${fdSt()} | the log: ${lines.join(" || ")} | page errors ${__KIT.errors.length}`;
});
step("faction pirate ships: crews of their faction, voyages near home, a raid now and then; seizing their plunder pinned on another", async () => {
  delete root.fleet; seaLanesFromMap(); fleetRoll(); const P = repPorts(), home = P[P.length - 1], kal = root.nodes.find(n => n.name === "Kalatecha");
  const s = { id: "sh_fd1", name: "The Crimson Crown", kind: "pirate", mode: "pirate", home: home.id, at: home.id, stay: campaignDay(), carry: [], faction: "fd_a", raid: { region: kal.region, pct: 20 }, needCrew: true };
  root.fleet.push(s); fleetCatchUp(); const crewFac = [s.captain, ...(s.crew || [])].map(libNpcById).filter(Boolean).every(p => p.faction === "fd_a");
  let raids = 0, near = 0; const H = repNode(s.home);
  for (let i = 0; i < 100; i++) { s.at = s.home; const g = fleetNext(s); if (!g || !g.lurk) continue; const l = repOf().lanes.find(x => x.id === g.lurk.on); if ([l.from, l.to].some(id => (repNode(id) || {}).region === kal.region)) raids++; else near++; }
  const kept = (() => { fleetRoll(); return root.fleet.some(x => x.id === "sh_fd1"); })();
  renderNamedPane("background"); await wait(20); const row = document.getElementById("fleetrow-sh_fd1"), facSel = row && row.querySelector("[data-fleetfac]");
  const s2 = root.fleet.find(x => x.id === "sh_fd1"); s2.met = campaignDay(); s2.cargo = { rum: { n: 6, paid: 0, from: "plunder" } }; tradeOf().cap = 40; tradeOf().hold = {};
  const n0 = repOf().deeds.length, fb = repNode("fv_" + s2.id) || fleetBoard(s2); select("node", fb.id); renderPane(true); await wait(20);
  const pin = document.querySelector(`[data-seizepin="${s2.id}"]`); if (pin) { pin.value = "fd_d"; document.querySelector(`[data-seizeroll="${s2.id}"]`).value = "18"; }
  const sb = document.querySelector(`button[data-seize="rum"][data-ship="${s2.id}"]`); if (sb) { sb.click(); await wait(20); }
  const nd = repOf().deeds.slice(n0)[0];
  return `crew rolled ${(s.crew || []).length + 1}, all of the faction ${crewFac}, plunder ${Object.keys(s.cargo || {}).length} goods | 100 voyages: ${raids} raids on ${repPlaceName(kal.id)}'s waters, ${near} near home | kept through a new fleet roll ${kept} | her entry: Sails for ${facSel && facSel.value} | seized: pin offered ${!!pin}, the deed "${nd && nd.text}" framed ${nd && !!nd.framed} | between: ${fdRel()} | page errors ${__KIT.errors.length}`;
});
