// The Druid (Joseph, 2026-11-12, the SRD walk-through: "Do it"): Wild Shape's uses (the SRD 5.2.1 table), Primal Order,
// Elemental Fury, the Circle of the Land (Circle Spells, Land's Aid, Natural Recovery, Nature's Ward, Nature's Sanctuary),
// Wild Resurgence, Wild Companion, Beast Spells, Archdruid; a 2014 druid gets only what their sheet has.
const drWall = "#".repeat(32), drFloor = "#" + ".".repeat(30) + "#";
const DR = { format: "ordinate-survey-v1", title: "Druid", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "fa", name: "Fern", species: "Elf", cls: "Druid", subcls: "Circle of the Land", level: 7, land: "temperate", hp: "45", hpMax: "45", ac: "14", wis: 16, dc: "13", satk: "+5",
      spells: ["spell:produce-flame", "spell:cure-wounds", "spell:find-familiar"], slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 1, used: 0 }], forms: ["srd:wolf"],
      attacks: [{ name: "Quarterstaff", hit: "+5", dmg: "1d6+2", dtype: "bludgeoning" }] },
    { id: "fb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] },
    { id: "fc", name: "Old Druid", cls: "Druid", level: 7, rules: "2014", feats: "Druidic, Spellcasting, Wild Shape, Druid Circle", hp: "40", hpMax: "40", ac: "13", wis: 16,
      res: [{ id: "rws", name: "Wild Shape", max: 2, used: 0, rest: "short" }], attacks: [{ name: "Scimitar", hit: "+4", dmg: "1d6+2" }] }],
  groups: [{ id: "g1", members: ["fa", "fb", "fc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "2" }] },
      bmap: { name: "The Hall", rows: [drWall, drFloor, drFloor, drFloor, drFloor, drFloor, drFloor, drFloor, drFloor, drWall], start: { party: [[4, 4], [5, 5], [3, 6]], enemy: [[6, 4], [6, 6]] } } }] } } };
const drHall = () => (doc.nodes || []).find(n => n.id === "hall");
const drFight = () => drHall().site.combat;
const drWho = nm => combatants(drFight()).find(t => t.label.startsWith(nm));
const drFoes = () => combatants(drFight()).filter(t => t.kind === "foe");
const drTurn = async t => { const c = drFight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const drLast = () => ((drFight().log || []).slice(-1)[0] || {}).text || "";
let drAsked = [];
const drAsk = answers => { drAsked = []; const q = answers.slice(); window.prompt = m => { drAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { drAsked.push(m); return q.length ? q.shift() : true; }; };
const drCard = p => { const h = document.createElement("div"); h.innerHTML = druidCardHtml(p); return [...h.querySelectorAll("select")].map(s => s.dataset.k).concat([...h.querySelectorAll("button")].map(b => b.textContent.trim())).join(", ") || "nothing"; };
step("Wild Shape's uses from the SRD table (Fern, level 7: 3, one back on a Short Rest); Old Druid (2014) keeps his own 2; the card's picks: Fern's, none for Old Druid or Bram", async () => {
  loadJSONNow(JSON.stringify(DR)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(drHall()); await wait(150); beginBattle(drHall().site); await wait(60);
  const F = drWho("Fern"), O = drWho("Old Druid"), B = drWho("Bram"), ws = p => { const r = wildShapeRes(pcState(p)); return r ? `${r.max} (${r.rest})` : "none"; };
  const lv = n => { pcState(F.p).level = n; pcState(F.p); return ws(F.p); }; const t = `levels 2/6/17: ${lv(2)}, ${lv(6)}, ${lv(17)}`; lv(7);
  return `Fern: ${ws(F.p)}, Natural Recovery ${!!pcState(F.p).res.find(r => r.name === "Natural Recovery")} | ${t} || Old Druid: ${ws(O.p)} || Fern's card: ${drCard(F.p)} | Old Druid's: ${drCard(O.p)} | Bram's: ${drCard(B.p)}`;
});
step("Primal Order: Magician adds +3 to Nature; Elemental Fury: Potent puts +3 on Produce Flame, Primal Strike's four chips on the Quarterstaff, gone after one hit", async () => {
  const c = drFight(), F = drWho("Fern"), [E] = drFoes(), p = pcState(F.p); const n0 = skillMod(p, "Nature"); p.porder = "magician"; const n1 = skillMod(p, "Nature");
  p.fury = "potent"; await drTurn(F); act.what = "sp:spell:produce-flame"; act.targets = [E.id]; renderBattlePanel(); await wait(20); const flame = actDice(c, F, actInfo(c, F)).dmgLabel;
  p.fury = "primal"; act = freshAct(F.id); act.what = "pca:0"; act.targets = [E.id]; act.outcome = "hit"; renderBattlePanel(); await wait(20); const chips = [...document.querySelectorAll("[data-addon]")].map(b => b.textContent.trim().replace(/ ·.*$/, "")).join(", ");
  document.querySelector('[data-addon="pstrike-thunder"]').click(); await wait(20); act.dmg = "7"; renderBattlePanel(); await wait(20); drAsk([]); $("#ac-go").click(); await wait(30);
  const line = drLast(); act = freshAct(F.id); act.what = "pca:0"; act.targets = [E.id]; renderBattlePanel(); await wait(20); const again = [...document.querySelectorAll("[data-addon]")].length;
  return `Nature ${n0} → ${n1} || Produce Flame ${flame} || chips: ${chips} | ${line} | chips after: ${again}`;
});
step("Circle Spells (temperate, 7) in her spell list; Natural Recovery's free box on Sleep; Nature's Ward at 10: Poisoned can't land, Lightning resisted", async () => {
  const c = drFight(), F = drWho("Fern"), p = pcState(F.p); await drTurn(F);
  const list = actionChoices(F).flatMap(g => g.items).map(i => i.label).filter(l => /Misty Step|Shocking Grasp|Sleep|Lightning Bolt|Freedom of Movement/.test(l)).join(", ");
  act.what = "sp:spell:sleep"; renderBattlePanel(); await wait(20); const box = document.querySelector("#ac-mi"); const nr = box ? box.parentElement.textContent.replace(/\s+/g, " ").trim() : "no box";
  const before = `${condImmune(F, "Poisoned")}/${dmgTakes(F, "lightning") || "normal"}`; p.level = 10; const after = `${condImmune(F, "Poisoned")}/${dmgTakes(F, "lightning") || "normal"}, fire ${dmgTakes(F, "fire") || "normal"}`; p.level = 7;
  return `${list} || ${nr} || Poisoned immune/lightning at 7: ${before}; at 10: ${after}`;
});
step("Land's Aid: a Wild Shape use, 2d6 Necrotic with a Con save on the Fanatics, Bram healed 2d6; then Wild Resurgence's button turns a slot into a use when none are left", async () => {
  const c = drFight(), F = drWho("Fern"), B = drWho("Bram"), E = drFoes(), p = pcState(F.p), r = wildShapeRes(p); r.used = 0; pcState(B.p).hp = 20; c.round++; await drTurn(F);
  const v = actionChoices(F).flatMap(g => g.items).find(i => /^Wild Shape/.test(i.label)).v, w = document.querySelector("#ac-what"); w.value = v; w.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const s = document.querySelector("#ac-wsfx"); const opts = s ? [...s.options].map(o => o.value).join("/") : "no select"; s.value = "aid"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const h = document.querySelector("#ac-laheal"); h.value = B.id; h.dispatchEvent(new Event("change", { bubbles: true })); act.targets = E.map(x => x.id); act.outcome = "fail"; act.dmg = "7"; renderBattlePanel(); await wait(20);
  drAsk([]); $("#ac-go").click(); await wait(30); const aid = `${drLast()} | uses ${r.max - wildShapeRes(pcState(F.p)).used}/${r.max}, Bram ${pcState(B.p).hp}, shape ${pcState(F.p).shape ? "yes" : "none"}`;
  wildShapeRes(pcState(F.p)).used = wildShapeRes(pcState(F.p)).max; const host = document.createElement("div"); host.innerHTML = druidCardHtml(pcState(F.p)); document.body.appendChild(host);
  const btn = host.querySelector('[data-drb="wrslot"]'); const label = btn ? btn.textContent : "no button"; if (btn) btn.click(); await wait(20); host.remove();
  return `${opts} || ${aid} || ${label} → uses ${wildShapeRes(pcState(F.p)).max - wildShapeRes(pcState(F.p)).used}, slots used ${JSON.stringify(pcState(F.p).slots.slice(1, 3).map(x => x.used))}`;
});
step("Nature's Sanctuary (14): Fern and Bram get Half Cover, Bram Lightning Resistance; Wild Companion's free box on Find Familiar; Incapacitated ends Wild Shape; Beast Spells at 18; Evergreen at 20", async () => {
  const c = drFight(), F = drWho("Fern"), B = drWho("Bram"), [E] = drFoes(), p = pcState(F.p); p.level = 14; pcState(p); wildShapeRes(p).used = 0; c.round++; await drTurn(F);
  act.wsFx = "sanct"; act.what = actionChoices(F).flatMap(g => g.items).find(i => /^Wild Shape/.test(i.label)).v; act.targets = [B.id]; renderBattlePanel(); await wait(20); drAsk([]); $("#ac-go").click(); await wait(30);
  const sanct = `${drLast()} | Bram's cover from the Fanatic: ${coverOf(c, E.id, B.id).word || "none"}, lightning ${dmgTakes(B, "lightning") || "normal"}, Fern's cover ${coverOf(c, E.id, F.id).word || "none"}`;
  act = freshAct(F.id); act.what = "sp:spell:find-familiar"; renderBattlePanel(); await wait(20); const wc = (document.querySelector("#ac-mi") || {}).parentElement; const wcl = wc ? wc.textContent.replace(/\s+/g, " ").trim() : "no box";
  shapeShift(p, "srd:wolf"); p.conds.push("Stunned"); barbTurnEnd(c, "x"); const ended = `${p.shape ? "still a wolf" : "back to normal"} (${drLast()})`; p.conds = [];
  shapeShift(p, "srd:wolf"); p.level = 18; const s18 = actionChoices(F).map(g => g.group).filter(g => /spells/i.test(g)).join(", ") || "no spells"; p.level = 17; const s17 = actionChoices(F).map(g => g.group).filter(g => /spells/i.test(g)).join(", ") || "no spells"; delete p.shape;
  p.level = 20; pcState(p); wildShapeRes(p).used = wildShapeRes(p).max; drAsk([]); const box = () => document.querySelector(`.init-in[data-bid="${F.id}"]`); renderBattlePanel(); await wait(20); box().value = "15"; box().onchange(); await wait(20);
  const ever = `${wildShapeRes(pcState(F.p)).max - wildShapeRes(pcState(F.p)).used} left`; p.level = 7; pcState(p);
  return `${sanct} || Find Familiar: ${wcl} || Stunned: ${ended} || in beast form at 18: ${s18}; at 17: ${s17} || Evergreen: ${ever} | page errors ${__KIT.errors.length}`;
});
