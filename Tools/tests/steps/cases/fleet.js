// uses: kal
// Ships at sea (Joseph, 2026-11-04) on the Age of Exploration map: real ports from the coastline, sea lanes so every port
// can reach every other, a fleet of 18 (set routes, mercurial ones, one pirate on her own) sailing as the days pass and
// carrying word; on the charts; a ship within 10 miles of the party offers an encounter.
const fleetSeed = s => { let x = s; Math.random = () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
step("the ports on the water, and the sea lanes from the map: every port joined up", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(400); setDmMode(true); await wait(60); fleetSeed(9); delete root.rep; delete root.fleet;
  const all = (root.nodes || []).filter(n => isPort(n)), real = repPorts(), r = seaLanesFromMap();
  const far = real.find(p => p.kind === "city" && p.region !== real[0].region), path = far ? seaPath(real[0].id, far.id) : null;
  const unreachable = real.filter(p => !seaPath(real[0].id, p.id)).length;
  expect(unreachable === 0, "every port reachable", unreachable);
  return `ports by kind ${all.length}, on the water ${real.length} | inland: ${all.filter(p => !real.includes(p)).map(p => p.name).slice(0, 8).join(", ")} | ${r.lanes} lanes | ${real[0].name} to ${far ? far.name : "?"}: ${path ? path.map(repPlaceName).join(" → ") : "none"}`;
});
step("a fleet of 18: the mix, the routes, the pirate's hideout", async () => {
  const n = fleetRoll(), F = root.fleet, count = k => F.filter(s => s.kind === k).length;
  expect(n === 18, "18 ships", n);
  const pir = F.find(s => s.kind === "pirate");
  return `${Object.keys(FLEET_KINDS).map(k => `${k} ${count(k)}`).join(", ")} | set routes ${F.filter(s => s.mode === "route").length}, mercurial ${F.filter(s => s.mode === "wander").length} | pirate ${pir.name} out of ${repPlaceName(pir.home)} | e.g. ${F.filter(s => s.mode === "route").slice(0, 2).map(s => `${s.name}: ${s.route.map(repPlaceName).join(" → ")}`).join(" / ")}`;
});
step("sixty days pass: they sail, call at ports, carry word", async () => {
  repRecord({ text: "Raised the drowned bell", who: "party", fame: "fame", size: "notable", place: (root.nodes.find(q => q.name === "Kalatecha") || {}).id });
  const d0 = campaignDay(); root.fday = d0; repOf().gday = d0; root.day = d0 + 60; syncTimeBar(); await wait(20);
  const F = root.fleet, moved = root.gameLog.filter(l => /^Ships at sea/.test(l.text)), carried = (moved[0] || { text: "" }).text.match(/aboard [^,]+/g) || [];
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `in port ${F.filter(s => s.at && !s.leg).length}, at sea ${F.filter(s => s.leg).length}, lying in wait ${F.filter(s => !s.at && !s.leg).length} | log lines ${moved.length} | word carried by ship ${carried.length} | the pirate: ${(F.find(s => s.kind === "pirate").leg ? "at sea" : F.find(s => s.kind === "pirate").at ? "in port" : "lying in wait")}`;
});
step("the charts: lanes and ships on yours; on the players' only what's within 10 miles; an encounter offered", async () => {
  render(); await wait(30); const dm = (document.querySelector("#gChart") || {}).innerHTML || "";
  const t = fleetT(), s = root.fleet.find(x => fleetPos(x, t)), p = fleetPos(s, t), ship = partyShip();
  const at = partyWhere(); ship.x = p.x + 5 * (root.ppm || 10); ship.y = p.y; setPartyAt({ map: "survey", node: ship.id }, true); delete s.asked; render(); await wait(30);
  const pl = playerMapScene(), plSvg = String(pl.svg || pl.html || ""), pop = $("#fleetPop");
  const offered = !pop.hidden ? pop.innerText.replace(/\s+/g, " ").slice(0, 160) : "nothing";
  if (!pop.hidden) { pop.querySelector('[data-fleet="meet"]').click(); await wait(20); }
  return `your chart: ${(dm.match(/<line /g) || []).length} lanes, ${(dm.match(/<path d="M-7 2/g) || []).length} ships | players' chart: ${(plSvg.match(/M-7 2/g) || []).length} ship(s) | offered: ${offered} | met on day ${s.met || "-"} | page errors ${__KIT.errors.length}`;
});
