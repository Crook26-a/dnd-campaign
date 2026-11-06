// uses: kal
// Ships asked for in a save (root.fleetQueue) put to sea on load; a city's own ship that keeps to her home port
// (Joseph, 2026-11-06: "at their city more than the other ships are sailing").
step("a queue of ships in the save: put to sea once, crews and routes rolled; a faction's ship keeping to port", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.world; delete root.fleet; seaLanesFromMap(); fleetRoll();
  const L = lib(); L.factions = (L.factions || []).filter(f => f.id !== "fq_t"); L.factions.push({ id: "fq_t", name: "Tripolitania", align: "Neutral Evil", standing: 0, repDie: 12 });
  const P = repPorts(), home = P[3], n0 = root.fleet.length;
  root.fleetQueue = [{ kind: "merchant" }, { kind: "navy" }, { kind: "packet" }, { kind: "pirate", home: home.id, faction: "fq_t", homely: true, name: "The Corsair of Test" }];
  fleetCatchUp(); const added = root.fleet.slice(n0), again = (fleetCatchUp(), root.fleet.length - n0);
  const c = added.find(s => s.name === "The Corsair of Test");
  renderNamedPane("background"); await wait(20); const box = document.querySelector(`[data-fleethomely="${c.id}"]`);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `added: ${added.map(s => `${s.name} (${s.kind}, ${s.mode}${s.route ? ` ${s.route.length} stops` : ""}, crew ${(s.crew || []).length + 1}, out of ${repPlaceName(s.home)})`).join("; ")} | the queue gone: ${!root.fleetQueue}, a second catch-up added ${again - added.length} | the corsair: home ${repPlaceName(c.home)}, Tripolitania's ${c.faction === "fq_t"}, crew of the faction ${libNpcById(c.captain).faction === "fq_t"}, the box ticked ${box && box.checked}`;
});
step("120 days: the keep-to-port ship at home far more of the time than an ordinary pirate", async () => {
  const c = root.fleet.find(s => s.name === "The Corsair of Test"), o = root.fleet.find(s => s.kind === "pirate" && s !== c);
  let ch = 0, oh = 0; const dn = document.getElementById("dayNum");
  for (let d = 0; d < 120; d++) { dn.value = String(campaignDay() + 1); dn.dispatchEvent(new Event("change")); await wait(5); if (!c.leg && c.at === c.home) ch++; if (!o.leg && o.at === o.home) oh++; }
  return `days in her home port of 120: ${c.name} ${ch}, ${o.name} ${oh} | page errors ${__KIT.errors.length}`;
});
