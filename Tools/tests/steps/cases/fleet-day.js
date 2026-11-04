// uses: kal
// The day moved on from the day box (Joseph, 2026-11-04: "I don't see that happening right now"): the ships sail, and
// the chart and the Party tab show it at once.
const fdShips = () => [...document.querySelectorAll("svg g text")].filter(t => (root.fleet || []).some(s => s.name === t.textContent)).map(t => t.parentElement.getAttribute("transform")).join(";");
const fdPane = () => (document.querySelector('[data-invfor="party:fleet"]') || {}).innerText || "";
step("ten days on from the day box: where the ships are, on the chart and in the Party tab", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll(); render(); await wait(30);
  pane = "party"; syncTabs(); renderPane(true); const sec = document.querySelector('details[data-invfor="party:fleet"]'); if (sec) sec.open = true; await wait(30);
  const chart0 = fdShips(), pane0 = fdPane(), legs0 = root.fleet.filter(s => s.leg).length;
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 10); dn.dispatchEvent(new Event("change")); await wait(60);
  const chart1 = fdShips(), pane1 = fdPane(), legs1 = root.fleet.filter(s => s.leg).length;
  return `day ${campaignDay()} | at sea before ${legs0}, after ${legs1} | the chart redrawn: ${chart0 !== chart1} (${chart0.split(";").length} ships drawn) | the Party tab redrawn: ${pane0 !== pane1} | page errors ${__KIT.errors.length}`;
});
