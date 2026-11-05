// uses: kal
// A port clicked shows the ships in port, on their way and calling later on routes; a ship card's "In the Background
// tab" goes to her own entry (Joseph, 2026-11-05).
step("a port's panel: ships in port, on the way, later on routes; a name opens her card", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; delete root.trade; delete root.world; seaLanesFromMap(); fleetRoll();
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 3); dn.dispatchEvent(new Event("change")); await wait(60);
  const psBest = repPorts().map(p => ({ p, S: portShips(p.id) })).sort((a, b) => (b.S.here.length + b.S.coming.length + b.S.later.length) - (a.S.here.length + a.S.coming.length + a.S.later.length))[0];
  select("node", psBest.p.id); pane = "inspect"; syncTabs(); renderPane(true); await wait(30);
  const sec = document.querySelector("[data-portfold]"), txt = sec ? sec.innerText.replace(/\s+/g, " ").slice(0, 400) : "none";
  const nm = sec && sec.querySelector("[data-laneship]"); if (nm) { nm.click(); await wait(20); }
  const pop = document.getElementById("fleetPop"), card = !pop.hidden && pop.dataset.card;
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `${psBest.p.name}: ${txt} | a name clicked opens her card: ${!!card && !String(card).startsWith("lane:")}`;
});
step("her card's Background-tab button lands on her own entry", async () => {
  const pop = document.getElementById("fleetPop"), id = pop.dataset.card || root.fleet[5].id; fleetCard(id); await wait(20);
  pop.querySelector('[data-fleetcard="party"]').click(); await wait(40);
  const row = document.getElementById("fleetrow-" + id), s = root.fleet.find(x => x.id === id);
  return `pane ${pane}, her entry there: ${!!row}, marked: ${!!row && row.classList.contains("fleetfocus")}, her name box focused: ${document.activeElement && document.activeElement.dataset.fleetname === id} (${s.name}) | page errors ${__KIT.errors.length}`;
});
