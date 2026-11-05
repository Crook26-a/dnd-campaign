// uses: kal
// The play button (Joseph, 2026-11-05: "a button that just has the days going by one at a time when I hit play"):
// a day every second, two or four; it stops when a map opens or a ship comes into sight of the party at sea.
const dpPop = () => { const p = document.getElementById("fleetPop"); return p && !p.hidden ? p.innerText.replace(/\s+/g, " ").slice(0, 90) : "none"; };
let dpGroups = null;
step("ashore, play at a day a second: the days go by and the ships sail; pause stops them", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll(); render(); await wait(30);
  dpGroups = JSON.stringify(root.groups || null); const town = repPlaces().find(n => n.kind === "town" && !repIsCoastal(n)); setPartyAt({ map: "survey", node: town.id }, true);
  const d0 = campaignDay(); document.getElementById("daySpeed").value = "1000";
  document.getElementById("dayPlay").click(); await wait(3500); const d1 = campaignDay(), label = document.getElementById("dayPlay").textContent, legs = root.fleet.filter(s => s.leg).length;
  document.getElementById("dayPlay").click(); await wait(3000);
  return `party at ${town.name} | day ${d0} -> after 3.5 s playing ${d1} (button ${label}, ${legs} ships at sea, the day box ${document.getElementById("dayNum").value}) -> paused, 3 s later day ${campaignDay()}, button ${document.getElementById("dayPlay").textContent} | page errors ${__KIT.errors.length}`;
});
step("a map opened while playing stops it", async () => {
  const s = root.fleet.find(x => x.kind === "merchant"), d0 = campaignDay(), g = JSON.stringify(root.groups);
  document.getElementById("dayPlay").click(); await wait(1500); fleetGoAboard(s); await wait(3000); const d1 = campaignDay(), playing = !!dayPlaying;
  if (battleOf) closeBattle(); if (planOf) leavePlan(); root.groups = JSON.parse(g);
  return `day ${d0} -> ${d1} with a map open, still playing ${playing}, the button ${document.getElementById("dayPlay").textContent} | page errors ${__KIT.errors.length}`;
});
step("at sea on the party's ship: a ship coming into sight stops it", async () => {
  root.groups = JSON.parse(dpGroups) || root.groups; render(); await wait(30); const d0 = campaignDay(), pop0 = dpPop();
  for (const s of root.fleet) s.asked = 0; const b = document.getElementById("fleetPop"); if (b) { b.hidden = true; delete b.dataset.ship; }
  document.getElementById("dayPlay").click(); await wait(8000);
  const out = `day ${d0} -> ${campaignDay()}, still playing ${!!dayPlaying} | the box: ${dpPop()}`; if (dayPlaying) dayStop(true);
  return out + ` | page errors ${__KIT.errors.length}`;
});
