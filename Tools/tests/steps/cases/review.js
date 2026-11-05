// uses: kal
// The Review tab (Joseph, 2026-11-05: "a tab for me that lets me approve or disapprove things that need my input"):
// Read the log for everyone; memories from the log to mark; garbled stories; deeds nobody knows; guild jobs done or late.
const rvPane = () => document.getElementById("pane-review");
step("read the log for everyone: the lines wait in Review; the tab says how many", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60);
  const p = lib().npcs.find(q => q.name && q.name.split(" ").length >= 2 && !q.crewOf), pc = partyRoster()[0];
  gameLog("talk", `${pc.name.split(" ")[0]} talked with ${p.name} about the harbour seal`); gameLog("check", `${pc.name.split(" ")[0]}: Deception check with ${p.name} 7, fails`);
  pane = "review"; syncTabs(); renderPane(true); await wait(30);
  rvPane().querySelector('[data-rv="readall"]').click(); await wait(30);
  const I = reviewItems(), again = memFromLogAll().n, tab = document.querySelector('#tabs [data-pane="review"]').innerText;
  const mine = (p.mem || []).filter(memWaiting).map(m => m.text);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `waiting: ${I.mems.length} memories from the log (${p.name}: ${mine.join(" / ")}) | read again: ${again} new | the tab: "${tab}" | in the drawer list: ${DRAWER_TABS.some(([k]) => k === "review")}`;
});
step("mark one Good, call one not a memory: off the list, and it counts", async () => {
  const p = lib().npcs.find(q => (q.mem || []).filter(memWaiting).length >= 2), pc = partyRoster()[0], W = p.mem.filter(memWaiting), n0 = reviewItems().mems.length;
  rvPane().querySelector(`[data-mem="tone"][data-m="${W[0].id}"][data-v="1"]`).click(); await wait(20);
  rvPane().querySelector(`[data-mem="del"][data-m="${W[1].id}"]`).click(); await wait(20);
  const I = memImpression(p, pc.id);
  return `${p.name}: waiting ${n0} -> ${reviewItems().mems.length} | the good one: tone ${W[0].tone}, marked ${!!W[0].ok} | the other gone: ${!p.mem.includes(W[1])} | ${pc.name}'s standing with them: ${sgn(I.s)} (${I.tier.label}) | page errors ${__KIT.errors.length}`;
});
step("a garbled story, a deed nobody knows, a late trade run and a found chart: each answered here", async () => {
  const R = repOf(), kal = root.nodes.find(q => q.name === "Kalatecha");
  const d = repRecord({ text: "Sank a pirate sloop", who: "party", fame: "fame", size: "notable", place: kal.id, force: true }).deed;
  const k = "place:" + kal.id; R.tables[k] = R.tables[k] || { die: 100, slots: {} }; R.tables[k].slots[99] = { d: d.id, g: true, t: "Sank three navy frigates" };
  const q = repRecord({ text: "Pocketed the bishop's ring", who: "party", fame: "infamy", size: "minor", place: kal.id, gate: true }).deed;
  guildSetup("trade"); guildSetup("explore"); guildPostRuns(); explorePost();
  const tr = missionsAll().find(x => x.m.kind === "trade").m; tr.status = "taken"; tr.due = campaignDay() - 2;
  const hid = root.nodes.find(n => n.name && !sailsAbout(n)); let ch = missionsAll().find(x => x.m.ek === "chart"); if (ch) { ch = ch.m; ch.status = "taken"; delete repNode(ch.target).hidden; }
  renderPane(true); await wait(30); const before = reviewItems(), txt = rvPane().innerText.replace(/\s+/g, " ");
  const g = rvPane().querySelector('[data-rep="revok"]'); if (g) { g.click(); await wait(20); }
  const f = rvPane().querySelector(`[data-rep="force"][data-d="${q.id}"]`); if (f) { f.click(); await wait(20); }
  const m1 = rvPane().querySelector(`[data-rv="more"][data-mid="${tr.id}"]`); if (m1) { m1.click(); await wait(20); }
  const c1 = ch && rvPane().querySelector(`[data-rv="done"][data-mid="${ch.id}"]`); if (c1) { c1.click(); await wait(20); }
  const after = reviewItems();
  return `waiting: garbled ${before.garbled.length}, quiet ${before.quiet.length}, jobs ${before.jobs.length} (${/Late: it was due/.test(txt) ? "a late one" : ""}${/it looks done/.test(txt) ? ", a found chart" : ""}) | after: garbled ${after.garbled.length}, quiet ${after.quiet.length} (spread: ${!q.quiet}), the run due day ${tr.due} (${tr.status}), the chart ${ch ? ch.status : "none"} | jobs left ${after.jobs.length} | page errors ${__KIT.errors.length}`;
});
