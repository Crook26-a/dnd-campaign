// uses: kal
// The Islands of Lost Hope (Joseph, 2026-11-05): a pirate city and a pirate town in the builder; an island's places put
// into one region from the island's panel.
step("a pirate city and town placed on a new island; its places into a new region, named", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); delete root.fleet; delete root.trade;
  const pp = root.ppm || 10, P0 = repPorts()[0], cx = P0.x + 60 * pp, cy = P0.y + 60 * pp, half = 6 * pp;
  const isle = { id: "s_pi", kind: "island", closed: true, straight: true, name: "Gallows Key", side: 1, impassable: false, notes: "", pts: [{ x: cx - half, y: cy - half }, { x: cx + half, y: cy - half }, { x: cx + half, y: cy + half }, { x: cx - half, y: cy + half }] };
  root.shapes.push(isle);
  placeNode("piratecity", cx - half + pp, cy); const pc = sel && nodeById(sel.id); pc.name = "Port Gallows";
  placeNode("piratetown", cx + half - pp, cy); const pt = sel && nodeById(sel.id); pt.name = "Rattle Cove";
  select("shape", isle.id); renderInspect(); await wait(30);
  const box = document.getElementById("s-isleregion"), before = (document.querySelector("#pane-inspect") || document.body).innerText.match(/\d+ places? on it[^.]*\./);
  box.value = "__new"; __KIT.answers.push("Islands of Lost Hope"); document.getElementById("s-isleregiongo").click(); await wait(30);
  const reg = root.regions.find(r => r.name === "Islands of Lost Hope");
  select("node", pc.id); renderInspect(); await wait(20); const kindSel = document.getElementById("f-kind");
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `placed: ${pc.name} (kind ${pc.kind}, pirate ${!!pc.pirate}, shows as ${KINDS[shownKind(pc)].label}), ${pt.name} (kind ${pt.kind}, pirate ${!!pt.pirate}) | the island's panel said: ${before && before[0]} | the region: ${reg ? reg.name : "none"}, both in it ${!!reg && pc.region === reg.id && pt.region === reg.id} | the Kind box on the city: ${kindSel && kindSel.value} | shady ports ${shadyPort(pc)} ${shadyPort(pt)}, the cut ${shadyCut(pc.id)}%, a trade place ${tradeIsPlace(pc)}, a guild city ${guildCities().includes(pc)}`;
});
step("the fleet: the pirate based at the pirate port, honest ships keep away; the Kind box turns it back to a plain city", async () => {
  seaLanesFromMap(); fleetRoll(); const pir = root.fleet.find(s => s.kind === "pirate");
  const pc = root.nodes.find(n => n.name === "Port Gallows"); let honest = 0;
  for (const s of root.fleet.filter(x => FLEET_HONEST.has(x.kind) && x.mode === "wander")) for (let i = 0; i < 20; i++) { const g = fleetNext(s); if (g && shadyPort(g.to)) honest++; }
  const k = document.getElementById("f-kind"); k.value = "city"; k.dispatchEvent(new Event("change")); await wait(20);
  return `the pirate out of ${repPlaceName(pir.home)} | honest wanderers headed for a pirate port ${honest} times | after the Kind box: kind ${pc.kind}, pirate ${!!pc.pirate}, shady ${shadyPort(pc)} | page errors ${__KIT.errors.length}`;
});
