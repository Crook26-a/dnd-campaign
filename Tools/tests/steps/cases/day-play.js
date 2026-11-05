// uses: kal
// The play button (Joseph, 2026-11-05: "a button that just has the days going by one at a time when I hit play"):
// only in practice mode; a day every second, two or four, with no encounters on the way; a map opening stops it.
const dpPop = () => { const p = document.getElementById("fleetPop"); return p && !p.hidden ? p.innerText.replace(/\s+/g, " ").slice(0, 90) : "none"; };
const dpShown = () => !document.getElementById("dayPlay").hidden;
step("only in practice mode: hidden, then shown once practising; play at a day a second, then pause", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll(); render(); await wait(30);
  const before = dpShown(); practiceStart(); await wait(30); const during = dpShown();
  const d0 = campaignDay(); document.getElementById("daySpeed").value = "1000";
  document.getElementById("dayPlay").click(); await wait(3500); const d1 = campaignDay(), legs = root.fleet.filter(s => s.leg).length;
  document.getElementById("dayPlay").click(); await wait(3000);
  return `button shown before practice ${before}, while practising ${during} | day ${d0} -> after 3.5 s playing ${d1} (${legs} ships at sea) -> paused, 3 s later day ${campaignDay()} | page errors ${__KIT.errors.length}`;
});
step("at sea on the party's ship: no encounters while playing, the days keep going", async () => {
  for (const s of root.fleet) s.asked = 0; const d0 = campaignDay();
  document.getElementById("dayPlay").click(); await wait(8000);
  const out = `day ${d0} -> ${campaignDay()}, still playing ${!!dayPlaying} | encounter offered: ${dpPop()}`; document.getElementById("dayPlay").click(); await wait(30);
  render(); await wait(30);
  return out + ` | once paused, the ship in sight is offered: ${dpPop()} | page errors ${__KIT.errors.length}`;
});
step("a map opened while playing stops it; practice kept: the button goes away", async () => {
  const s = root.fleet.find(x => x.kind === "merchant"), d0 = campaignDay(), g = JSON.stringify(root.groups);
  document.getElementById("dayPlay").click(); await wait(1500); fleetGoAboard(s); await wait(3000); const d1 = campaignDay(), playing = !!dayPlaying;
  if (battleOf) closeBattle(); if (planOf) leavePlan(); root.groups = JSON.parse(g);
  document.getElementById("dayPlay").click(); await wait(1500); practiceStop(true); await wait(30);
  return `day ${d0} -> ${d1} with a map open, still playing ${playing} | practice kept: button shown ${dpShown()}, playing ${!!dayPlaying} | page errors ${__KIT.errors.length}`;
});
