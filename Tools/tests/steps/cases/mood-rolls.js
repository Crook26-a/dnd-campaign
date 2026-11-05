// uses: kal
// Memory and standing on the rolls (Joseph, 2026-11-05: "add the two together"; Charisma checks, Insight, haggling and
// shop prices; applied, and said why): a person's own feelings and their faction's standing, as steps, added.
const mrP = () => lib().npcs.find(p => p.name && !p.crewOf);
step("how someone feels, all told: their memories, their faction, added", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60);
  const L = lib(); L.factions = L.factions || []; if (!L.factions.length) L.factions.push({ id: "lfa_t", name: "The Test Guild", standing: 0, repDie: 12 });
  const f = L.factions[0], p = mrP(), pc = partyRoster()[0], out = [];
  p.faction = f.id; p.mem = []; f.standing = 0; out.push(`nothing: ${JSON.stringify(moodOf(p, pc.id).label)}`);
  memAdd(p, { text: "Saved my daughter", tone: 1, size: "notable", who: [pc.id], src: "deed" }, true); const M1 = moodOf(p, pc.id); out.push(`a good memory: ${M1.label} (${M1.why}) -> ${M1.check || "no change"}`);
  f.standing = -5; const M2 = moodOf(p, pc.id); out.push(`and the faction unfriendly/hostile ${f.standing}: ${M2.label} (${M2.why}) -> ${M2.check || "no change"}`);
  f.standing = 6; const M3 = moodOf(p, pc.id); out.push(`and the faction trusted: ${M3.label} (${M3.why}) -> ${M3.check}`);
  const other = partyRoster()[1]; const M4 = other ? moodOf(p, other.id) : null; out.push(`toward someone else in the party: ${M4 ? `${M4.label} (${M4.why})` : "-"}`);
  return out.join(" | ") + ` | page errors ${__KIT.errors.length}`;
});
step("the Action box: Persuasion with them, rolled with Advantage, and said why in the log", async () => {
  const p = mrP(), pc = partyRoster()[0], kal = root.nodes.find(q => q.name === "Kalatecha");
  const room = (plans[kal.id].nodes || []).find(n => n.kind === "inn") || plans[kal.id].nodes[0]; room.npcs = [...new Set([...(room.npcs || []), p.id])];
  try { Object.defineProperty(window, "innerWidth", { configurable: true, get: () => 1400 }); } catch (e) {}     // the Action box is the laptop's: wider than 860
  enterPlan(kal.id); select("node", room.id); await wait(30);
  ta.what = "check"; ta.who = "pc:" + pc.id; ta.skill = "Persuasion"; ta.with = p.id; ta.tot = {}; renderActionBox(true); await wait(30);
  const box = document.getElementById("actionbox"), withSel = box.querySelector('[data-ta="with"]'), tag = [...box.querySelectorAll(".pchecks small.mono")].map(s => s.innerText).join(" ");
  const rollB = box.querySelector(`[data-tar="check"][data-k="pc:${pc.id}"]`); rollB.click(); await wait(30);
  const said = (ta.d20 || {})["pc:" + pc.id];
  const lg = box.querySelector("[data-talog]"); if (lg) { lg.click(); await wait(30); }
  const line = gameLogList().slice(-1)[0];
  ta.moodOn = false; renderActionBox(true); await wait(20); const off = [...box.querySelectorAll(".pchecks small.mono")].map(s => s.innerText).join(" "); ta.moodOn = true; leavePlan();
  return `"With" offers ${p.name}: ${!!withSel && [...withSel.options].some(o => o.value === p.id)} | the row's tag: ${tag} | rolled: ${said && said.said} | the log: ${line && line.text} | unticked, the tag: ${off} | page errors ${__KIT.errors.length}`;
});
step("a shop: its keeper's feelings in the prices and the haggle, rolled", async () => {
  const kal = root.nodes.find(q => q.name === "Kalatecha"), N = plans[kal.id].nodes || [];
  let shop = N.find(n => n.shop && n.shop.keeper && libNpcById(n.shop.keeper));
  if (!shop) { shop = N.find(n => n.kind === "store") || N[0]; shop.shop = shop.shop || {}; shop.shop.keeper = lib().npcs.filter(p => p.name && !p.crewOf)[1].id; }     // the fixture's chandlery, given a keeper
  const k = libNpcById(shop.shop.keeper), pc = partyRoster()[0], f = lib().factions[0]; k.faction = ""; k.mem = [];
  enterPlan(kal.id); select("node", shop.id); haggle.who = ""; await wait(20); const id = (shop.site && shop.site.items || [])[0] || "srd:rations";
  const base = shopPrice(shop, id);
  memAdd(k, { text: "Robbed me blind", tone: -1, size: "notable", who: [pc.id], src: "deed" }, true); haggle.who = pc.id;
  const sour = shopPrice(shop, id), line = (shopFactionLine(shop) || "").replace(/<[^>]+>/g, "");
  renderPane(true); await wait(20); const hb = document.querySelector('[data-shopb="haggleroll"]'); if (hb) { hb.click(); await wait(20); }
  const said = haggle.said; haggle.who = ""; leavePlan();
  return `${k.name} keeps ${shop.name}: a price ${base} cp, after a grudge against ${pc.name}: ${sour} cp | the line: ${line} | haggle rolled: ${said} | page errors ${__KIT.errors.length}`;
});
