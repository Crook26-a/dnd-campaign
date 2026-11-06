// The Bard (Joseph, 2026-11-06, the SRD walk-through: "Do it"): Bardic Inspiration (given, held, used on a failed roll),
// Jack of All Trades, Font of Inspiration, Countercharm, Superior Inspiration, Words of Creation, and the College of Lore's
// Cutting Words and Peerless Skill.
const bdWall = "#".repeat(32), bdFloor = "#" + ".".repeat(30) + "#";
const BD = { format: "ordinate-survey-v1", title: "Bard", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "la", name: "Lyra", species: "Human", cls: "Bard", subcls: "College of Lore", level: 5, hp: "33", hpMax: "33", ac: "14", str: 8, dex: 14, cha: 16,
      spells: ["spell:burning-hands", "spell:charm-person", "spell:power-word-heal"], slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 2, used: 0 }], dc: "13",
      attacks: [{ name: "Rapier", hit: "+5", dmg: "1d8+2", dtype: "piercing" }] },
    { id: "lb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", dex: 12, skills: "Athletics +6", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["la", "lb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [bdWall, bdFloor, bdFloor, bdFloor, bdFloor, bdFloor, bdFloor, bdFloor, bdFloor, bdWall], start: { party: [[3, 4], [5, 4]], enemy: [[6, 4]] } } }] } } };
const bdHall = () => (doc.nodes || []).find(n => n.id === "hall");
const bdFight = () => bdHall().site.combat;
const bdWho = nm => combatants(bdFight()).find(t => t.label.startsWith(nm));
const bdTurn = async t => { const c = bdFight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const bdLast = () => ((bdFight().log || []).slice(-1)[0] || {}).text || "";
let bdAsked = [];
const bdAsk = answers => { bdAsked = []; const q = answers.slice(); window.prompt = m => { bdAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { bdAsked.push(m); return q.length ? q.shift() : true; }; };
step("Bardic Inspiration: 3 uses (Cha 16), back on a Short Rest at 5; Lyra gives Bram a d8 (a Bonus Action); his card shows it; Undo takes it back", async () => {
  loadJSONNow(JSON.stringify(BD)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(bdHall()); await wait(150); beginBattle(bdHall().site); await wait(60);
  const c = bdFight(), L = bdWho("Lyra"), B = bdWho("Bram"), r = biRes(pcState(L.p)); const uses = `${r.max - r.used}/${r.max} (${r.rest})`;
  const give = async () => { await bdTurn(L); act.what = actionChoices(L).flatMap(g => g.items).find(i => /bardic/i.test(i.label)).v; act.targets = [B.id]; renderBattlePanel(); await wait(20); bdAsk([]); $("#ac-go").click(); await wait(30); };
  await give(); const said = bdLast(), card = bardCardHtml(B.p).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); undoAction(c); await wait(20); const r2 = biRes(pcState(L.p)), undone = `${JSON.stringify(B.p.bi || null)}, uses ${r2.max - r2.used}`;
  await give();
  return `uses ${uses} | ${said} | Bram's card: ${card} | bonus used ${bonusUsed(c, L.id)} || undone: ${undone} | given again: ${JSON.stringify(B.p.bi)}`;
});
step("Bram misses (5 + 5 = 10 vs AC 13), uses the d8 (6 typed): 16, a hit; the die is gone; a failed save (2 typed) asks too", async () => {
  const c = bdFight(), B = bdWho("Bram"), F = bdWho("Cultist"); await bdTurn(B); act.what = "pca:0"; act.targets = [F.id]; act.d20 = "5"; renderBattlePanel(); await wait(20);
  bdAsk([true, "6"]); document.querySelector('[data-acroll="hit"]').click(); await wait(20); const hit = ((act.toHit || {}).said || "").replace(/^To hit: /, ""), held = JSON.stringify(B.p.bi || null);
  B.p.bi = { die: 8, by: "Lyra" }; const L = bdWho("Lyra"); await bdTurn(L); act.what = "sp:spell:burning-hands"; act.lvl = 1; act.targets = [B.id]; renderBattlePanel(); await wait(20);
  bdAsk(["2", true, "7"]); document.querySelector(`[data-svroll="${B.id}"]`).click(); await wait(20);
  return `${hit} | asked: ${bdAsked.length ? "" : "nothing"}${held === "null" ? "die gone" : "die still " + held} || save: ${(act.saves || {})[B.id] ? act.saves[B.id].said : "none"} | die ${JSON.stringify(B.p.bi || null)}`;
});
step("Jack of All Trades: Lyra (Bard 5, PB 3) adds 1 to a skill not on her sheet; Bram (a Fighter) doesn't", async () => {
  const L = pcState(bdWho("Lyra").p), B = pcState(bdWho("Bram").p);
  return `Lyra: Stealth ${skillMod(L, "Stealth")} (Dex +2), Athletics ${skillMod(L, "Athletics")} (Str −1) | Bram: Stealth ${skillMod(B, "Stealth")} (Dex +1), Athletics ${skillMod(B, "Athletics")} (on his sheet)`;
});
