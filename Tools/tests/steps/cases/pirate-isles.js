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
step("an island with nothing on it yet: given the region, and a town placed on it later joins it", async () => {
  const pp = root.ppm || 10, a = root.shapes.find(s => s.id === "s_pi"), cx = a.pts[1].x + 10 * pp, cy = a.pts[1].y + 6 * pp, h = 4 * pp;
  const isle2 = { id: "s_pi2", kind: "island", closed: true, straight: true, name: "Widow's Rock", side: 1, impassable: false, notes: "", pts: [{ x: cx - h, y: cy - h }, { x: cx + h, y: cy - h }, { x: cx + h, y: cy + h }, { x: cx - h, y: cy + h }] };
  root.shapes.push(isle2); select("shape", isle2.id); renderInspect(); await wait(30);
  const btn = document.getElementById("s-isleregiongo"), reg = root.regions.find(r => r.name === "Islands of Lost Hope"), box = document.getElementById("s-isleregion");
  box.value = reg.id; btn.click(); await wait(30);
  placeNode("piratetown", cx, cy); const t = nodeById(sel.id); t.name = "Widow's Landing";
  return `the button enabled with nothing on the island: ${!btn.disabled} | the island's region: ${(root.regions.find(r => r.id === isle2.region) || {}).name} | ${t.name} placed on it, in ${(root.regions.find(r => r.id === t.region) || {}).name} | page errors ${__KIT.errors.length}`;
});
step("the region's name written faintly across its islands, as a group", async () => {
  const S = root.shapes.filter(s => s.id === "s_pi" || s.id === "s_pi2"), P = S.flatMap(s => s.pts), x0 = Math.min(...P.map(p => p.x)), x1 = Math.max(...P.map(p => p.x)), y0 = Math.min(...P.map(p => p.y)), y1 = Math.max(...P.map(p => p.y));
  const b = svg.getBoundingClientRect(); view.k = Math.min((b.width - 160) / (x1 - x0), (b.height - 160) / (y1 - y0)); view.tx = b.width / 2 - (x0 + x1) / 2 * view.k; view.ty = b.height / 2 - (y0 + y1) / 2 * view.k; sel = null; applyTransform(); render(); await wait(30);
  const t = [...document.querySelectorAll("svg text.islelab")].map(e => `"${e.textContent}" at ${Math.round(+e.getAttribute("x"))},${Math.round(+e.getAttribute("y"))} size ${Math.round(+e.getAttribute("font-size") * view.k)}px on screen`);
  return `the islands span ${Math.round(x0)}–${Math.round(x1)}, ${Math.round(y0)}–${Math.round(y1)} | written: ${t.join("; ") || "nothing"} | page errors ${__KIT.errors.length}`;
});
step("the fleet: the pirate based at the pirate port, honest ships keep away; the Kind box turns it back to a plain city", async () => {
  seaLanesFromMap(); fleetRoll(); const pir = root.fleet.find(s => s.kind === "pirate");
  const pc = root.nodes.find(n => n.name === "Port Gallows"); let honest = 0;
  for (const s of root.fleet.filter(x => FLEET_HONEST.has(x.kind) && x.mode === "wander")) for (let i = 0; i < 20; i++) { const g = fleetNext(s); if (g && shadyPort(g.to)) honest++; }
  select("node", pc.id); renderInspect(); await wait(20); const k = document.getElementById("f-kind"); k.value = "city"; k.dispatchEvent(new Event("change")); await wait(20);
  return `the pirate out of ${repPlaceName(pir.home)} | honest wanderers headed for a pirate port ${honest} times | after the Kind box: kind ${pc.kind}, pirate ${!!pc.pirate}, shady ${shadyPort(pc)} | page errors ${__KIT.errors.length}`;
});
