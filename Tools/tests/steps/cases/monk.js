// The Monk (Joseph, 2026-11-12, the SRD walk-through: "Do it"; text from his SRD 5.2.1): Focus Points and the Monk's uses,
// Martial Arts, Flurry of Blows, Patient Defense, Step of the Wind, Stunning Strike, Deflect Attacks, Evasion, Uncanny
// Metabolism, Self-Restoration, Disciplined Survivor, Superior Defense, and the Warrior of the Open Hand.
const mkWall = "#".repeat(32), mkFloor = "#" + ".".repeat(30) + "#";
const MK = { format: "ordinate-survey-v1", title: "Monk", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "mm", name: "Mira", species: "Human", cls: "Monk", subcls: "Warrior of the Open Hand", level: 10, hp: "60", hpMax: "70", ac: "17", speed: "30 ft", str: 10, dex: 16, con: 14, wis: 16,
      attacks: [{ name: "Quarterstaff", hit: "+7", dmg: "1d8+3", dtype: "bludgeoning" }] },
    { id: "mb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["mm", "mb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [mkWall, mkFloor, mkFloor, mkFloor, mkFloor, mkFloor, mkFloor, mkFloor, mkFloor, mkWall], start: { party: [[4, 4], [2, 6]], enemy: [[5, 4]] } } }] } } };
const mkHall = () => (doc.nodes || []).find(n => n.id === "hall");
const mkFight = () => mkHall().site.combat;
const mkWho = nm => combatants(mkFight()).find(t => t.label.startsWith(nm));
const mkTurn = async t => { const c = mkFight(); c.round++; c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const mkLast = () => ((mkFight().log || []).slice(-1)[0] || {}).text || "";
let mkAsked = [];
const mkAsk = answers => { mkAsked = []; const q = answers.slice(); window.prompt = m => { mkAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { mkAsked.push(m); return q.length ? q.shift() : true; }; };
const mkFocus = () => { const p = pcState(mkWho("Mira").p), r = p.res.find(x => x.name === "Focus Points"); return r ? r.max - r.used : "none"; };
const mkPick = (re) => actionChoices(mkWho("Mira")).flatMap(g => g.items).find(i => re.test(i.label));
const mkDo = async (re, targets, setup, answers) => { const M = mkWho("Mira"); act = freshAct(M.id); act.what = mkPick(re).v; renderBattlePanel(); await wait(20); act.targets = targets; if (setup) setup(); renderBattlePanel(); await wait(20); mkAsk(answers || []); $("#ac-go").click(); await wait(30); return mkLast(); };
step("uses and card: Mira (Monk 10, Open Hand) gets Focus Points, Uncanny Metabolism, Wholeness of Body; her card, her Monk choices, Speed with Unarmored Movement; Bram has none", async () => {
  loadJSONNow(JSON.stringify(MK)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(mkHall()); await wait(150); beginBattle(mkHall().site); await wait(60);
  const M = mkWho("Mira"), B = mkWho("Bram"), p = pcState(M.p), uses = p.res.map(r => `${r.name} ${r.max}`).join(", ");
  const h = document.createElement("div"); h.innerHTML = monkCardHtml(p); const card = [...h.querySelectorAll(".chip")].map(x => x.textContent).join(" | ");
  const groups = actionChoices(M).find(g => g.group === "Monk"), bram = actionChoices(B).some(g => g.group === "Monk");
  return `${uses} || card: ${card} || Monk: ${groups.items.map(i => i.label.replace(/ \(.*$/, "")).join("; ")} || Speed ${speedOf(M)} || Bram has Monk choices: ${bram}`;
});
step("Flurry of Blows (1 Focus Point, the Bonus Action): three strikes at 10; the next strike is no action; Topple on it (Open Hand Technique); Stunning Strike on a hit", async () => {
  const c = mkFight(), M = mkWho("Mira"), F = mkWho("Cultist"); F.x.hp = F.x.max = 200; await mkTurn(M); const f0 = mkFocus();
  const one = await mkDo(/^Flurry of Blows: three/, [F.id], () => { act.outcome = "hit"; act.dmg = "6"; });
  const opts = actionChoices(M).find(g => g.group === "Monk").items.filter(i => /next Unarmed/.test(i.label)).map(i => i.label).join(", ");
  const two = await mkDo(/next Unarmed/, [F.id], () => { act.outcome = "hit"; act.dmg = "5"; act.ohFx = "topple"; act.addons = ["stun"]; });
  return `Focus ${f0} → ${mkFocus()} | ${one} || choices: ${opts} || ${two} || bonus used ${!!(c.bonused || {})[M.id]}, actions used ${((c.acted || {})[M.id] || {}).n || 0}`;
});
step("Patient Defense with a point: Disengage, Dodge, and two Martial Arts dice of temporary hit points (Heightened Focus); Step of the Wind free: Dash", async () => {
  const c = mkFight(), M = mkWho("Mira"), p = pcState(M.p); await mkTurn(M); p.temp = 0;
  const pd = await mkDo(/^Patient Defense: Disengage and Dodge/, [], null, ["4", "5"]); const st = `dodging ${!!(c.dodging || {})[M.id]}, disengaged ${!!(c.disengaged || {})[M.id]}, temp ${p.temp}`;
  await mkTurn(M); const m0 = moveAllow(c, M); const sw = await mkDo(/^Step of the Wind: Dash/, []);
  return `${pd} || ${st} || ${sw} | move ${m0} → ${moveAllow(c, M)} ft`;
});
step("Deflect Attacks: Bram's 12 Slashing cut by d10 5 + 3 + 10 to none, then redirected for 1 Focus Point; Evasion on Burning Hands: a failed Dex save half, a made one none", async () => {
  const c = mkFight(), M = mkWho("Mira"), B = mkWho("Bram"), p = pcState(M.p); p.hp = 60; p.temp = 0; await mkTurn(B); const f0 = mkFocus();
  act = freshAct(B.id); act.what = "pca:0"; act.targets = [M.id]; renderBattlePanel(); await wait(20); act.outcome = "hit"; act.dmg = "12"; act.dtype = "slashing"; renderBattlePanel(); await wait(20); mkAsk([true, "5", true, "2"]); $("#ac-go").click(); await wait(30);
  const defl = `${mkLast()} | hp ${p.hp}, Focus ${f0} → ${mkFocus()}`;
  const burn = async (d20) => { await mkTurn(B); act = freshAct(B.id); act.what = "sp:spell:burning-hands"; act.lvl = 1; act.targets = [M.id]; act.saveDC = 15; renderBattlePanel(); await wait(20);
    mkAsk([d20]); document.querySelector(`[data-svroll="${M.id}"]`).click(); await wait(20); act.dmg = "12"; renderBattlePanel(); await wait(20); const hp0 = p.hp; mkAsk([]); $("#ac-go").click(); await wait(30); return `${(mkLast().match(/Evasion[^;.]*/) || ["no Evasion"])[0]}: hp ${hp0} → ${p.hp}`; };
  return `${defl} || failed: ${await burn("3")} || made: ${await burn("14")}`;
});
step("Initiative: Uncanny Metabolism (all Focus back, heal 10 + d8); Self-Restoration ends Frightened; at 14 every save proficient and a failed one rerolled for a point; at 18 Superior Defense", async () => {
  const c = mkFight(), M = mkWho("Mira"), p = pcState(M.p); p.hp = 40; const f0 = mkFocus(); mkAsk([true, "4"]); monkInit(c, M.id); const um = `${mkLast()} | Focus ${f0} → ${mkFocus()}, hp ${p.hp}`;
  p.conds.push("Frightened"); monkTurnEnd(c, M.id); const sr = `${mkLast()} | conds ${p.conds.join(", ") || "none"}`;
  p.level = 14; pcState(p); const intSave = saveBonusOf(M, "Intelligence"); mkAsk([true, "17"]); const RS = d20Rescue(c, M, 9, 15, "Wisdom save", "save", 5); const ds = `Int save ${signed(intSave)} | ${RS.tot}${RS.w} | Focus ${mkFocus()}`;
  p.level = 18; pcState(p); await mkTurn(M); const sd = await mkDo(/^Superior Defense/, []); const how = `fire ${dmgTakes(M, "fire") || "full"}, force ${dmgTakes(M, "force") || "full"}`;
  p.level = 10; pcState(p); delete p.supDef;
  return `${um} || ${sr} || ${ds} || ${sd} | ${how} | page errors ${__KIT.errors.length}`;
});
