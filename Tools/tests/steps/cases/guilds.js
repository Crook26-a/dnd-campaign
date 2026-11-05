// uses: kal
// The guilds (Joseph, 2026-11-05): the Trade Guild and the Guild of Explorers, a main hall in Kalatecha and a branch
// in every city; the Trade Guild's trade runs: taken (the cargo into the party's hold) and delivered for the fee.
step("found both guilds: halls, branches, boards, and trade runs posted", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; delete root.trade; seaLanesFromMap(); fleetRoll();
  pane = "background"; syncTabs(); openInv.add("bg:guilds"); renderPane(true); await wait(30);
  const before = (lib().factions || []).map(f => f.name).join(", ");
  document.querySelector('[data-guild="setup"][data-key="trade"]').click(); await wait(30);
  document.querySelector('[data-guild="setup"][data-key="explore"]').click(); await wait(30);
  const out = [];
  for (const key of ["trade", "explore"]) { const f = guildFaction(key), hub = guildHub(), hall = guildIn(f, hub.id), cities = guildCities(), branches = cities.filter(c => guildIn(f, c.id));
    out.push(`${f.name}: hall "${hall && hall.name}" in ${hub.name} (board "${hall && hall.board.title}"), in ${branches.length} of ${cities.length} cities, a gossip branch in ${cities[3].name}: ${repFacHere(f, cities[3].id)}`); }
  const runs = missionsAll().filter(x => x.m.kind === "trade");
  const txt = document.querySelector('details[data-invfor="bg:guilds"]').innerText.replace(/\s+/g, " ").slice(0, 300);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `factions before: ${before} | ${out.join(" | ")} | trade runs posted ${runs.length}, e.g. "${runs[0].m.title}" (${runs[0].m.reward}; ${runs[0].m.patron}) / "${runs[runs.length - 1].m.title}" (${runs[runs.length - 1].m.patron}) | the section: ${txt}`;
});
step("a trade run taken at the hall: the Guild's cargo in the hold; delivered at its market for the fee", async () => {
  const f = guildFaction("trade"), hub = guildHub(), hall = guildIn(f, hub.id), m = boardMissions(hall.board).find(x => x.kind === "trade"), pc = partyRoster()[0], T = tradeOf();
  T.hold = {}; T.cap = 40; T.payer = pc.id; const gp0 = purseGp(purseOf(pc)), st0 = standingOf(f);
  enterPlan(hub.id); select("node", hall.id); pane = "inspect"; syncTabs(); renderPane(true); await wait(40);
  const card = !!document.querySelector('[data-mb="addtrade"]'), sel1 = document.querySelector(`select[data-mbf="status"][data-mid="${m.id}"]`);
  sel1.value = "taken"; sel1.dispatchEvent(new Event("change", { bubbles: true })); await wait(40);
  const held = Object.values(T.hold).map(h => `${h.n} ${h.g} for ${h.from} to ${repPlaceName(h.to)} by day ${h.due}`).join(", ");
  leavePlan(); const dest = repNode(m.to); select("node", dest.id); renderPane(true); await wait(40);
  const btn = document.querySelector('[data-trade="deliver"]'); if (btn) { btn.click(); await wait(40); }
  return `the hall's board has "Add a trade run": ${card} | taken: ${held} | at ${dest.name}, Deliver there: ${!!btn} -> ${pc.name} ${Math.round(gp0)} -> ${Math.round(purseGp(purseOf(pc)))} gp (fee ${m.fee}), run ${m.status}, ${f.name} ${st0} -> ${standingOf(f)}, hold now ${Object.keys(T.hold).length} | page errors ${__KIT.errors.length}`;
});
step("Add a trade run on a branch's board", async () => {
  const f = guildFaction("trade"), c = guildCities().find(x => x !== guildHub() && guildIn(f, x.id)), b = guildIn(f, c.id);
  enterPlan(c.id); select("node", b.id); pane = "inspect"; syncTabs(); renderPane(true); await wait(40); const n0 = boardMissions(b.board).length;
  document.querySelector('[data-mb="addtrade"]').click(); await wait(40); const m = boardMissions(b.board).slice(-1)[0];
  const fields = [...document.querySelectorAll(`[data-mid="${m.id}"]`)].map(x => x.dataset.mbf).filter(Boolean).join(",");
  leavePlan();
  return `${c.name}'s office: ${n0} -> ${boardMissions(b.board).length} missions; the new one: "${m.title}" (${m.status}), "${m.text}" | its fields: ${fields} | page errors ${__KIT.errors.length}`;
});
