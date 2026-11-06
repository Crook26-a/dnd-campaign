// uses: kal
// Rich and poor passenger ships (Joseph, 2026-11-06): a rich one's hold a little better than before and an Admiralty
// escort beside her; a poor one's hold worse, its passengers in steerage, plain goods.
step("a fleet rolled: one rich, one poor; the rich one's escort; passengers, goods and the odds of magic", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.world; delete root.fleet; delete root.trade; seaLanesFromMap(); fleetRoll();
  const R = root.fleet.find(s => s.kind === "packet" && s.tier === "rich"), Pp = root.fleet.find(s => s.kind === "packet" && s.tier === "poor"), E = fleetEscortOf(R);
  const fares = s => { const c = {}; for (const id of s.pass || []) { const p = libNpcById(id); if (p) c[p.fare] = (c[p.fare] || 0) + 1; } return JSON.stringify(c); };
  const goods = s => Object.keys(s.cargo || {}).map(g => TRADE_GOODS[g][2]).join(",") || "empty";
  const odds = s => { const n = {}; const save = [s.magic, s.magicNote]; for (let i = 0; i < 2000; i++) { fleetMagicRoll(s); for (const id of s.magic) { const x = libLootById(id); if (x) n[x.rarity] = (n[x.rarity] || 0) + 1; } } [s.magic, s.magicNote] = save; return Object.entries(n).map(([k, v]) => `${k} ${Math.round(v / 20)}%`).join(", "); };
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `ships ${root.fleet.length} | rich: ${R.name}, passengers ${fares(R)}, goods ${goods(R)} | escort: ${E ? `${E.name} (${E.kind}, ${E.mode}, crew ${(E.crew || []).length + 1}, faction ${(factionById(E.faction) || {}).name || "none"})` : "none"} | poor: ${Pp.name}, passengers ${fares(Pp)}, escort ${!!fleetEscortOf(Pp)} | magic in 2000 rolls: rich ${odds(R)} / poor ${odds(Pp)}`;
});
step("thirty days: the escort keeps a mile off her charge; the poor one buys plain goods; the cards say so", async () => {
  const R = root.fleet.find(s => s.kind === "packet" && s.tier === "rich"), E = fleetEscortOf(R), Pp = root.fleet.find(s => s.kind === "packet" && s.tier === "poor");
  const dn = document.getElementById("dayNum"); let apart = 0, worst = 0;
  for (let d = 0; d < 30; d++) { dn.value = String(campaignDay() + 1); dn.dispatchEvent(new Event("change")); await wait(5); const a = fleetPos(R, fleetT()), b = fleetPos(E, fleetT()); const mi = Math.hypot(a.x - b.x, a.y - b.y) / (root.ppm || 10); worst = Math.max(worst, mi); if (mi > 2) apart++; }
  const lux = Object.keys(Pp.cargo || {}).filter(g => TRADE_GOODS[g][2] === "lux").length, buys = (Pp.trades || []).map(t => t.did.join("; ")).slice(-1)[0] || "nothing yet";
  const meet = seaMeetHtml(R, 3).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").match(/Under escort[^.]*\./), card = (fleetCard(R), document.getElementById("fleetPop").innerText.replace(/\s+/g, " ").slice(0, 160));
  document.getElementById("fleetPop").hidden = true;
  return `days more than 2 miles apart: ${apart} of 30 (farthest ${worst.toFixed(1)} mi), both in port at ${R.at ? repPlaceName(R.at) : "sea"}/${E.at ? repPlaceName(E.at) : "sea"} | the poor one's luxury goods ${lux}, her last trade: ${buys} | met at sea: "${meet && meet[0]}" | her card: "${card}" | page errors ${__KIT.errors.length}`;
});
step("made poor: the escort goes back on patrol; rich again: a new escort; her charge lost: the escort patrols", async () => {
  const R = root.fleet.find(s => s.kind === "packet" && s.tier === "rich"), E = fleetEscortOf(R); renderNamedPane("background"); await wait(20);
  const sel = document.querySelector(`[data-fleettier="${R.id}"]`); sel.value = "poor"; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const a = `${E.name}: ${E.mode}, escorting ${!!E.escortOf}`;
  const sel2 = document.querySelector(`[data-fleettier="${R.id}"]`); sel2.value = "rich"; sel2.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const E2 = fleetEscortOf(R); root.fleet = root.fleet.filter(s => s !== R); worldOf().day = campaignDay(); const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 1); dn.dispatchEvent(new Event("change")); await wait(20);
  return `made poor: ${a} | rich again: a new escort ${E2 ? E2.name : "none"} (${E2 && E2 !== E}) | her charge gone: ${E2.name} ${E2.mode}, escorting ${!!E2.escortOf} | page errors ${__KIT.errors.length}`;
});
