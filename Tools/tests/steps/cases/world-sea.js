// uses: kal
// Items 7–12 (Joseph, 2026-11-05): explorers' crews and commissions; encounters at sea (hail, news, trade, a pirate's
// toll, a ship in trouble); world news (10% a day, no more than one a week); the guilds' weekly boards; the price feat;
// editing usual prices; fishing boats landing fish; sea lanes clicked, named, re-trafficked, deleted and drawn.
const wsBg = k => bgLogList().filter(e => e.kind === k);
step("explorer crews; the guilds set up; commissions of every kind; an escort taken", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; delete root.trade; delete root.world; seaLanesFromMap(); fleetRoll();
  const ex = root.fleet.find(s => s.kind === "explorer"), crew = [ex.captain, ...ex.crew].map(libNpcById).map(p => `${p.role.split("· ").pop()} ${p.cls} ${p.level || "-"}`);
  guildSetup("trade"); guildSetup("explore"); const n = explorePost();
  const C = missionsAll().filter(x => x.m.kind === "explore"), by = {}; for (const x of C) by[x.m.ek] = (by[x.m.ek] || 0) + 1;
  const esc1 = C.find(x => x.m.ek === "escort").m; esc1.status = "taken"; const said = exploreTaken(esc1);
  const chart = C.find(x => x.m.ek === "chart");
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `explorer ${ex.name}: ${crew.join(", ")} | ${n} commissions posted: ${JSON.stringify(by)} | e.g. "${C[0].m.title}" (${C[0].m.reward}) | chart: ${chart ? `"${chart.m.text}" -> ${chart.m.notes}` : "no unknown places"} | escort taken:${said}`;
});
step("world news: each kind; then a week from the day box posts fresh boards; troubles steer the ships", async () => {
  const seen = {}, d = campaignDay(); for (let i = 0; i < 40 && Object.keys(seen).length < 3; i++) { const before = bgLogList().length; worldNews(d); const e = bgLogList()[before]; if (!e) continue;
    const k = /lost|wrecked|taken by|missing/.test(e.text) ? "lost" : /till about day/.test(e.text) ? "trouble" : "shock"; if (!seen[k]) seen[k] = e.text; }
  const T = Object.entries(worldOf().troubles)[0], fleetN = root.fleet.length, repl = worldOf().replace.length;
  const runs0 = missionsAll().filter(x => x.m.kind === "trade").map(x => x.m.id).join(), W = worldOf(); if (W.day == null) { W.day = campaignDay(); W.posted = campaignDay(); } W.news = campaignDay();
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 8); dn.dispatchEvent(new Event("change")); await wait(60);
  const runs1 = missionsAll().filter(x => x.m.kind === "trade").map(x => x.m.id).join();
  let shunned = "no plague or blockade"; const bad = Object.entries(W.troubles).find(([id, t]) => TROUBLES[t.kind].away && troubleAt(id));
  if (bad) { const s = root.fleet.find(x => x.kind === "merchant" && x.mode === "wander"); if (s) { const before = s.at; s.at = (repOf().lanes.find(l => l.from === bad[0] || l.to === bad[0]) || {}).from; s.at = s.at === bad[0] ? repOf().lanes.find(l => l.from === bad[0] || l.to === bad[0]).to : s.at; let hits = 0; for (let i = 0; i < 30; i++) { const g = fleetNext(s); if (g && g.to === bad[0]) hits++; } shunned = `a merchant next to ${repPlaceName(bad[0])} (${W.troubles[bad[0]].label}) headed there ${hits} of 30 times`; s.at = before; } }
  return `news: ${Object.entries(seen).map(([k, t]) => `${k}: ${t}`).join(" || ")} | fleet ${fleetN} (replacements due ${repl}) | a week on, the trade boards refreshed: ${runs0 !== runs1} | ${shunned} | page errors ${__KIT.errors.length}`;
});
step("fishing boats land fish; a usual price edited; the price feat on the players' screen", async () => {
  const f = root.fleet.find(s => s.kind === "fishing"), port = repNode(f.home), p0 = tradeEach(port.id, "saltfish");
  tradeCall(f, port, campaignDay()); const p1 = tradeEach(port.id, "saltfish");
  const kal = root.nodes.find(q => q.name === "Kalatecha"), s0 = tradeEach(kal.id, "spices"); tradeOf().base = { spices: 120 }; const s1 = tradeEach(kal.id, "spices"); delete tradeOf().base;
  const pc = partyRoster()[0]; select("node", kal.id); pane = "inspect"; syncTabs(); openInv.add("trade:" + kal.id); renderPane(true); await wait(30);
  const box = document.querySelector(`[data-msense="${pc.id}"]`); box.checked = true; box.dispatchEvent(new Event("change", { bubbles: true })); await wait(30);
  const tv = document.querySelector('[data-trade="tv"]'); if (tv) { tv.click(); await wait(30); }
  const html = marketTvHtml(kal.id).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160); playerShow = { kind: "map" };
  return `salt fish at ${port.name}: ${p0.toFixed(2)} -> ${p1.toFixed(2)} gp after ${f.name} landed her catch | spices at Kalatecha ${s0.toFixed(1)} -> ${s1.toFixed(1)} with a usual price of 120 | ${pc.name} knows the markets: ${pc.marketSense}, the button there ${!!tv}, showing ${tv ? "yes" : "no"}: "${html}" | page errors ${__KIT.errors.length}`;
});
step("sea lanes: clicked, named, its traffic; deleted with a warning; one drawn", async () => {
  render(); await wait(30); const el = document.querySelector("svg [data-lane]"), id = el.dataset.lane, l = repOf().lanes.find(x => x.id === id);
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true, pointerId: 1, clientX: 5, clientY: 5 })); await wait(30);
  const pop = document.getElementById("fleetPop"), shown = !pop.hidden && /sea lane|Its name/.test(pop.innerText);
  const nm = pop.querySelector('[data-lanef="name"]'); nm.value = "The Spice Road"; nm.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const tr = pop.querySelector('[data-lanef="traffic"]'); tr.value = "busy"; tr.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const named = `${l.name}, ${l.traffic}, kept ${l.auto === false}, on the chart: ${[...document.querySelectorAll("svg text")].some(t => t.textContent === "The Spice Road")}`;
  const P = repPorts(), end = P.find(p => repOf().lanes.filter(x => x.from === p.id || x.to === p.id).length === 1);
  let warned = "no port with a single lane"; if (end) { const only = repOf().lanes.find(x => x.from === end.id || x.to === end.id); laneCard(only.id); __KIT.answers.confirm = false; const n0 = repOf().lanes.length;
    document.querySelector('[data-laneact="del"]').click(); await wait(20); warned = `deleting ${end.name}'s only lane asked first, kept ${repOf().lanes.length === n0}`; }
  const a = P[0], b = P.find(p => p !== a && !repOf().lanes.some(x => (x.from === a.id && x.to === p.id) || (x.to === a.id && x.from === p.id)));
  const nl = laneDraw(a.id, b.id); laneSel = null; pop.hidden = true; delete pop.dataset.card;
  return `lane card shown: ${shown} | ${named} | ${warned} | drawn ${a.name} – ${b.name}: ${nl ? `${Math.round(nl.miles)} mi, ${nl.pts.length} points` : "no"} | page errors ${__KIT.errors.length}`;
});
step("at sea: hail a merchant, swap news, buy from her hold; a pirate's toll; a ship in trouble helped", async () => {
  const T = tradeOf(), pc = partyRoster()[0]; T.hold = {}; T.cap = 40; T.payer = pc.id; purseOf(pc).gp += 500; const pop = document.getElementById("fleetPop");
  const m = root.fleet.find(s => s.kind === "merchant" && Object.keys(s.cargo || {}).length) || root.fleet.find(s => s.kind === "merchant"); m.cargo = m.cargo && Object.keys(m.cargo).length ? m.cargo : { wine: { n: 10, paid: 12, from: m.home } };
  repRecord({ text: "Raised the drowned bell", who: "party", fame: "fame", size: "notable", place: m.home, force: true });
  m.trouble = null; m.meetDay = campaignDay(); pop.dataset.ship = m.id; pop.dataset.view = ""; pop.innerHTML = seaMeetHtml(m, 4); pop.hidden = false;
  const first = pop.innerText.replace(/\s+/g, " ").trim();
  pop.querySelector('[data-fleet="hail"]').click(); await wait(20); const parley = pop.innerText.replace(/\s+/g, " ").slice(0, 220);
  pop.querySelector('[data-parley="news"]').click(); await wait(20); const news = gameLogList().slice(-1)[0].text.slice(0, 120), carried = (m.carry || []).length;
  const g = Object.keys(m.cargo)[0], q = pop.querySelector(`[data-pqty="${g}"]`); q.value = "3"; pop.querySelector(`[data-parley="buy"][data-g="${g}"]`).click(); await wait(20);
  const bought = `${(T.hold[g] || {}).n || 0} ${g} in the hold, she has ${(m.cargo[g] || {}).n || 0} left`;
  const pir = root.fleet.find(s => s.kind === "pirate"); pir.meetDay = campaignDay(); pop.dataset.ship = pir.id; pop.dataset.view = "parley"; pop.innerHTML = seaParleyHtml(pir);
  const tollTxt = pop.innerText.replace(/\s+/g, " ").slice(0, 160), gp0 = purseGp(purseOf(pc)); pop.querySelector('[data-parley="toll"]').click(); await wait(20);
  const tollPaid = Math.round(gp0 - purseGp(purseOf(pc)));
  const h = root.fleet.find(s => s.kind === "packet"), d0 = repOf().deeds.length; h.meetDay = campaignDay(); h.trouble = SEA_TROUBLE[0]; pop.dataset.ship = h.id; pop.dataset.view = ""; pop.innerHTML = seaMeetHtml(h, 3); pop.hidden = false;
  const tr = pop.innerText.includes("in trouble"); pop.querySelector('[data-fleet="help"]').click(); await wait(20); const dd = repOf().deeds.slice(d0).map(d => `${d.text} (${d.size} ${d.fame}, seen by ${d.seenBy.length})`).join("; ");
  pop.hidden = true; delete pop.dataset.ship;
  return `sighted: "${first.slice(0, 200)}" | hailed: "${parley}" | news: "${news}", she carries ${carried} | bought: ${bought} | pirate: "${tollTxt}", paid ${tollPaid} gp | in trouble shown ${tr}, helped: ${dd} | page errors ${__KIT.errors.length}`;
});
