// Stabilizing and Lay on Hands (Joseph, 2026-11-06), with the fixes from his fight log that day: a Medicine check (DC 10)
// or a Healer's Kit stabilizes a dying ally beside you, Spare the Dying does too; a paladin's Lay on Hands pool (5 x level)
// heals and ends Poisoned; a character told "Halt!" is asked before acting; a second spell slot on a turn asks first; a
// long rest ends concentration.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Stabilize", ppm: 10, unit: "mi", party: 4,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Thomas", cls: "Paladin", level: 5, hp: "47", hpMax: "47", ac: "18", wis: 12, skills: "Also Medicine +1", attacks: [{ name: "Longsword", hit: "+6", dmg: "1d8+3" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }],
      spells: ["spell:magic-missile", "spell:burning-hands"], slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }], inv: [{ id: "srd:srd_healers-kit", qty: 1 }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] },
    { id: "pd", name: "Avery", cls: "Cleric", level: 5, hp: "38", hpMax: "38", ac: "18", spells: ["spell:spare-the-dying"], attacks: [{ name: "Mace", hit: "+5", dmg: "1d6+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc", "pd"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [3, 4], [3, 5]], enemy: [[20, 4]] } } }] } } };
const stHall = () => (doc.nodes || []).find(n => n.id === "hall");
const stFight = () => stHall().site.combat;
const stWho = nm => combatants(stFight()).find(t => t.label.startsWith(nm));
const stTurn = async t => { const c = stFight(); c.turn = t.id; ["moved", "acted", "bonused"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const stDown = () => { const p = pcState(stWho("Bram").p); p.hp = 0; p.conds = ["Unconscious"]; p.death = { s: 1, f: 2 }; };
const stBram = () => { const p = pcState(stWho("Bram").p); return `Bram ${p.hp} HP, death ${p.death.s}/${p.death.f}, conds [${p.conds.join(",")}]`; };
const stBox = () => { const b = document.querySelector("[data-stab]"); return b ? b.closest(".tacbox").textContent.replace(/\s+/g, " ").trim() : "no box"; };
const stLast = () => ((stFight().log || []).slice(-1)[0] || {}).text || "";
step("Bram is dying beside Thomas: the box offers Medicine; a typed 9 + 1 = 10 makes him Stable; Undo takes it back", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(stHall()); await wait(150); beginBattle(stHall().site); await wait(60);
  stDown(); const T = stWho("Thomas"); await stTurn(T); const box = stBox();
  document.querySelector('[data-stabd]').value = "9"; document.querySelector('[data-stab]').click(); await wait(30);
  const after = `${stLast()} | ${stBram()} | Thomas's actions left ${actionsLeft(stFight(), T.id)}`;
  undoAction(stFight()); await wait(20);
  return `${box} || ${after} || undone: ${stBram()}, actions left ${actionsLeft(stFight(), T.id)}`;
});
step("Wren uses her Healer's Kit instead: Stable, no check, 9 uses left; Undo puts the use back", async () => {
  stDown(); const W = stWho("Wren"); await stTurn(W); document.querySelector('[data-stabkit]').click(); await wait(30);
  const kit = () => { const e = pcState(W.p).inv.find(x => /healers-kit/.test(x.id)); return e.uses == null ? "untouched" : e.uses; };
  const said = `${stLast()} | ${stBram()} | kit ${kit()}`; undoAction(stFight()); await wait(20);
  return `${said} || undone: kit ${kit()}, ${stBram()}`;
});
step("Avery casts Spare the Dying on Bram: Stable", async () => {
  stDown(); const A = stWho("Avery"); await stTurn(A); act.what = "sp:spell:spare-the-dying"; act.targets = [stWho("Bram").id]; act.outcome = "none"; renderBattlePanel(); await wait(20);
  $("#ac-go").click(); await wait(30); return `${stLast()} | ${stBram()}`;
});
step("Thomas has a Lay on Hands pool of 25: 10 to Bram and 5 to end Poisoned, as a Bonus Action; 30 more is refused", async () => {
  stDown(); pcState(stWho("Bram").p).conds.push("Poisoned"); const T = stWho("Thomas"), r = pcState(T.p).res.find(q => /lay on hands/i.test(q.name));
  await stTurn(T); const choice = actionChoices(T).flatMap(g => g.items).find(i => /lay on hands/i.test(i.label));
  act.what = choice.v; act.targets = [stWho("Bram").id]; act.heal = "10"; act.outcome = "none"; renderBattlePanel(); await wait(20);
  const row = (document.querySelector("[data-lohpois]") || {}).parentElement; const rowTxt = row ? row.textContent.replace(/\s+/g, " ").trim() : "no row";
  document.querySelector("[data-lohpois]").click(); await wait(20); $("#ac-go").click(); await wait(30);
  const said = `${stLast()} | ${stBram()} | pool ${r.max - r.used}/${r.max} | bonus used ${bonusUsed(stFight(), T.id)}`;
  act = freshAct(T.id); act.what = choice.v; act.targets = [stWho("Bram").id]; act.heal = "30"; act.outcome = "none"; renderBattlePanel(); await wait(20);
  const n0 = stFight().log.length; window.confirm = () => true; $("#ac-go").click(); await wait(30);
  return `choice "${choice.label}" | ${rowTxt} || ${said} || 30 more logged: ${stFight().log.length !== n0}`;
});
step("Thomas told “Halt!” by the Cultist Fanatic: his turn says so, and Log it asks first (answered no: nothing logged)", async () => {
  const c = stFight(), T = stWho("Thomas"), F = stWho("Cultist"); c.holds = { [T.id]: { by: F.id, tier: "order", name: "Command", sp: null, cond: "", dmgEnds: "", once: true, turns: 0, pts: 0, word: "Halt" } };
  await stTurn(T); holdsTurnStart(c, T.id); renderBattlePanel(); await wait(20);
  const box = [...document.querySelectorAll(".tacbox")].map(b => b.textContent.replace(/\s+/g, " ").trim()).find(s => /Halt/.test(s)) || "no box";
  let asked = ""; window.confirm = m => { asked = m; return false; };
  act.what = "pca:0"; act.targets = [F.id]; act.outcome = "miss"; renderBattlePanel(); await wait(20); const n0 = c.log.length; $("#ac-go").click(); await wait(30);
  window.confirm = () => true; return `${box} | asked: ${asked} | logged ${c.log.length !== n0}`;
});
step("Wren casts Magic Missile, then Burning Hands on the same turn: asked first about the second slot", async () => {
  const W = stWho("Wren"), F = stWho("Cultist"); await stTurn(W); let asked = ""; window.confirm = m => { asked = m; return /concentrat/i.test(m); };
  act.what = "sp:spell:magic-missile"; act.lvl = 1; act.targets = [F.id]; act.outcome = "hit"; act.dmg = "10"; renderBattlePanel(); await wait(20); $("#ac-go").click(); await wait(30);
  const first = asked || "not asked"; asked = "";
  act = freshAct(W.id); act.what = "sp:spell:burning-hands"; act.lvl = 1; act.targets = [F.id]; act.outcome = "hit"; act.dmg = "5"; act.bonus = true; renderBattlePanel(); await wait(20);
  const n0 = stFight().log.length; $("#ac-go").click(); await wait(30); window.confirm = () => true;
  return `first: ${first} | second: ${asked || "not asked"} | logged ${stFight().log.length !== n0} | slots used ${pcState(W.p).slots[1].used}`;
});
step("a long rest ends Thomas's concentration", async () => {
  const p = pcState(stWho("Thomas").p); p.conc = { id: "spell:shield-of-faith", name: "Shield of Faith" }; restPc(p, "long");
  return `concentrating: ${p.conc ? p.conc.name : "nothing"} | pool ${p.res.find(q => /lay on hands/i.test(q.name)).used} used | page errors ${__KIT.errors.length}`;
});
