// uses: kal
// The day moved on from the day box (Joseph, 2026-11-04: "I don't see that happening right now"): the ships sail, and
// the chart and the Party tab show it at once. A ship on the chart can be clicked for her card; going aboard opens her
// deck's map ("it just opens the panel on the side").
const fdShips = () => [...document.querySelectorAll("svg g text")].filter(t => (root.fleet || []).some(s => s.name === t.textContent)).map(t => t.parentElement.getAttribute("transform")).join(";");
const fdPane = () => (document.querySelector('[data-invfor="party:fleet"]') || {}).innerText || "";
const fdMap = () => { if (!battleOf) return "no map open"; const n = (battleOf.doc.nodes || []).find(x => x.id === battleOf.nodeId), m = bmapOf(n); return `${n.name}: ${m.name} ${m.w}x${m.h}, ${((n.site || {}).combat || {}).list ? n.site.combat.list.length : 0} in the fight list`; };
step("ten days on from the day box: where the ships are, on the chart and in the Party tab", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll(); render(); await wait(30);
  pane = "party"; syncTabs(); renderPane(true); const sec = document.querySelector('details[data-invfor="party:fleet"]'); if (sec) sec.open = true; await wait(30);
  const chart0 = fdShips(), pane0 = fdPane(), legs0 = root.fleet.filter(s => s.leg).length;
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 10); dn.dispatchEvent(new Event("change")); await wait(60);
  const chart1 = fdShips(), pane1 = fdPane(), legs1 = root.fleet.filter(s => s.leg).length;
  return `day ${campaignDay()} | at sea before ${legs0}, after ${legs1} | the chart redrawn: ${chart0 !== chart1} (${chart0.split(";").length} ships drawn) | the Party tab redrawn: ${pane0 !== pane1} | page errors ${__KIT.errors.length}`;
});
step("going aboard opens her deck's map: a merchantman, a passenger ship", async () => {
  const out = [];
  for (const k of ["merchant", "packet"]) { const s = root.fleet.find(x => x.kind === k); fleetGoAboard(s); await wait(80);
    out.push(`${k}: ${fdMap()}${planOf ? ", in her plan" : ""}`); if (battleOf) closeBattle(); await wait(30); if (planOf) leavePlan(); }
  return out.join(" | ") + ` | page errors ${__KIT.errors.length}`;
});
step("a ship clicked on the chart: her card, then Go aboard", async () => {
  render(); await wait(30); const g = document.querySelector("svg [data-fleetship]"), s = root.fleet.find(x => x.id === g.dataset.fleetship);
  g.querySelector("path").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true, pointerId: 1, clientX: 5, clientY: 5 })); await wait(30);
  const pop = document.getElementById("fleetPop"), shown = !pop.hidden, text = pop.innerText.replace(/\s+/g, " ").trim();
  render(); await wait(30); const stays = !pop.hidden && !!pop.querySelector("[data-fleetcard]");
  pop.querySelector('[data-fleetcard="aboard"]').click(); await wait(80);
  const map = fdMap(); if (battleOf) closeBattle(); if (planOf) leavePlan();
  return `card shown: ${shown}, still there after a redraw: ${stays} | "${text.slice(0, 260)}" | aboard: ${map} | page errors ${__KIT.errors.length}`;
});
