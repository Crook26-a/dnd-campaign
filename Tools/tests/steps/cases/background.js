// uses: kal
// The Background tab (Joseph, 2026-11-05): what goes on whether or not the party is there. Its log, the ships at sea
// (moved from the Party tab), and the economics: the best runs, gluts and shortages, every market's prices.
step("a fleet and thirty days: the tab, its log and its sections", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; delete root.trade; seaLanesFromMap(); fleetRoll();
  repRecord({ text: "Raised the drowned bell", who: "party", fame: "fame", size: "notable", place: (root.nodes.find(q => q.name === "Kalatecha") || {}).id, force: true });
  const d0 = campaignDay(); repOf().gday = d0; root.day = d0 + 30; syncTimeBar(); await wait(30);
  pane = "background"; syncTabs(); renderPane(true); await wait(30);
  const el = document.getElementById("pane-background"), secs = [...el.querySelectorAll("details > summary")].map(s => s.innerText.split("\n")[0].trim());
  const kinds = {}; for (const e of bgLogList()) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
  const rows = [...el.querySelectorAll('details[data-invfor="bg:log"] .glrow')].slice(0, 3).map(r => r.innerText.replace(/\s+/g, " ").trim());
  const party = document.getElementById("pane-party"); pane = "party"; syncTabs(); renderPane(true); const fleetInParty = !!party.querySelector('[data-invfor="party:fleet"]');
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `tab button: ${!!document.querySelector('#tabs [data-pane="background"]')}, in the More drawer: ${DRAWER_TABS.some(([k]) => k === "background")} | sections: ${secs.join(" / ")} | log: ${JSON.stringify(kinds)}; newest: ${rows.join(" || ")} | ships still in the Party tab: ${fleetInParty} | the game log's ship lines: ${root.gameLog.filter(l => l.kind === "sail").length}`;
});
step("the log's filter, and the economics: runs, gluts, shortages, the heatmap", async () => {
  pane = "background"; syncTabs(); openInv.add("bg:econ"); renderPane(true); await wait(30);
  const f = document.getElementById("bg-filter"); f.value = "trade"; f.dispatchEvent(new Event("change", { bubbles: true })); await wait(30);
  const el = document.getElementById("pane-background"), trades = [...el.querySelectorAll('details[data-invfor="bg:log"] .glk')].map(k => k.innerText.trim());
  const econ = el.querySelector('details[data-invfor="bg:econ"]'), txt = econ.innerText, cells = econ.querySelectorAll("td[title]").length;
  const runs = (txt.match(/The best runs right now[\s\S]*?Gluts/i) || [""])[0].split("\n").filter(l => /buy at/.test(l)).slice(0, 2);
  const glutN = ((txt.match(/Gluts[\s\S]*?Shortages/i) || [""])[0].match(/usual,/g) || []).length, shortN = ((txt.match(/Shortages[\s\S]*?Every market/i) || [""])[0].match(/usual,/g) || []).length;
  const cell = econ.querySelector("td[title]");
  return `filtered to trade: ${trades.length} rows, all trade ${trades.every(k => /^trade$/i.test(k))} | heatmap squares ${cells} (${repPlaces().filter(tradeIsPlace).length} markets × ${Object.keys(TRADE_GOODS).length} goods) | e.g. "${cell.title}" coloured ${cell.style.background.slice(0, 40)} | runs: ${runs.join(" / ")} | gluts listed ${glutN}, shortages ${shortN} | page errors ${__KIT.errors.length}`;
});
step("a place clicked in the economics: its card, its market open", async () => {
  const el = document.getElementById("pane-background"), a = el.querySelector("[data-bgplace]"), id = a.dataset.bgplace; a.click(); await wait(40);
  const open = !!document.querySelector(`details[data-invfor="trade:${id}"][open]`);
  bgFilter = ""; return `clicked ${a.innerText}: selected ${sel && sel.id === id}, pane ${pane}, its market open ${open} | page errors ${__KIT.errors.length}`;
});
