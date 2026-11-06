// uses: kal
// Between the factions (Joseph, 2026-11-05: the pirate islands, "loosely confederated, but cut throat"): standings
// between factions, recorded by hand, rolled as incidents as the days pass, shown in the Background tab and on cards.
const frMk = (id, name) => { const L = lib(); L.factions = (L.factions || []).filter(f => f.id !== id); L.factions.push({ id, name, align: "Chaotic Neutral", standing: 0, repDie: 12 }); };
step("a feud recorded by hand in the Background tab; the buttons; the faction's page and a place's card", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.world;
  frMk("lfa_t1", "The Scarlet Fleet"); frMk("lfa_t2", "The Black Ledger"); frMk("lfa_t3", "The Keepers of the Articles");
  facRelOpen(); await wait(30); const pane0 = document.getElementById("pane-background"), q = s => pane0.querySelector(s);
  const sec = !!q('[data-invfor="bg:facrel"]');
  q("#fr-a").value = "lfa_t1"; q("#fr-b").value = "lfa_t2"; q("#fr-why").value = "The Fleet hanged a Ledger collector at Gallows Quay"; q("#fr-d").value = "-15"; q('[data-frel="add"]').click(); await wait(20);
  q("#fr-a").value = "lfa_t1"; q("#fr-b").value = "lfa_t3"; q("#fr-why").value = ""; q("#fr-d").value = "-10"; q('[data-frel="add"]').click(); await wait(20);
  q(`[data-frel="-5"][data-k="${facRelKey("lfa_t1", "lfa_t3")}"]`).click(); await wait(20);
  const rows = [...pane0.querySelectorAll('[data-invfor="bg:facrel"] .facfx')].map(r => r.innerText.replace(/\s+/g, " ").trim());
  const logs = bgLogList().filter(e => e.kind === "factions").map(e => e.text);
  const kal = root.nodes.find(n => n.name === "Kalatecha"); kal.faction = "lfa_t1"; const card = factionsHere(kal).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `section shown ${sec} | rows: ${rows.join(" / ")} | log: ${logs.join(" || ")} | Kalatecha's card: ${(card.match(/With the others:[^|]*/) || ["(none)"])[0].trim()}`;
});
step("incidents: rolled now, and sixty days passing; turned off, none", async () => {
  const n0 = bgLogList().filter(e => e.kind === "factions").length; const pane0 = document.getElementById("pane-background");
  pane0.querySelector('[data-frel="roll"]').click(); await wait(20); const rolled = bgLogList().filter(e => e.kind === "factions").slice(-1)[0].text;
  worldOf().day = campaignDay(); const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 60); dn.dispatchEvent(new Event("change")); await wait(60);
  const after = bgLogList().filter(e => e.kind === "factions").slice(n0 + 1);
  const on = pane0.querySelector("#fr-on") || document.querySelector("#fr-on"); renderNamedPane("background"); await wait(20);
  const box = document.querySelector("#pane-background #fr-on"); box.checked = false; box.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const n1 = bgLogList().filter(e => e.kind === "factions").length; dn.value = String(campaignDay() + 60); dn.dispatchEvent(new Event("change")); await wait(60);
  const n2 = bgLogList().filter(e => e.kind === "factions").length;
  return `rolled: ${rolled} | sixty days: ${after.length} incidents (at most 9), e.g. ${after.slice(0, 2).map(e => `day ${e.day}: ${e.text}`).join(" || ")} | standings now: ${facRelPairs().map(p => `${p.ids.map(id => factionById(id).name).join(" & ")} ${sgn(p.e.s)}`).join(", ")} | turned off: ${worldOf().facOff}, sixty more days added ${n2 - n1} | page errors ${__KIT.errors.length}`;
});
