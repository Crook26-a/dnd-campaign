// The Ranger (Joseph, 2026-11-12, the SRD walk-through: "Do it"; text from his SRD 5.2.1): Favored Enemy's free Hunter's
// Mark, the marked creature and its chip, Roving, Tireless, Nature's Veil, Relentless Hunter, Precise Hunter, Feral Senses,
// Foe Slayer, and the Hunter (Colossus Slayer, Horde Breaker, Superior Hunter's Prey, the Defensive Tactics, Superior Hunter's Defense).
const rgWall = "#".repeat(32), rgFloor = "#" + ".".repeat(30) + "#";
const RG = { format: "ordinate-survey-v1", title: "Ranger", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "rr", name: "Rae", species: "Human", cls: "Ranger", subcls: "Hunter", level: 11, hp: "80", hpMax: "80", ac: "16", speed: "30 ft", str: 10, dex: 18, con: 14, wis: 16, prey: "colossus",
      slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }], attacks: [{ name: "Shortsword", hit: "+8", dmg: "1d6+4", dtype: "piercing" }] },
    { id: "rb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["rr", "rb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }, { id: "srd:zombie", n: "1" }] },
      bmap: { name: "The Hall", rows: [rgWall, rgFloor, rgFloor, rgFloor, rgFloor, rgFloor, rgFloor, rgFloor, rgFloor, rgWall], start: { party: [[4, 4], [4, 6]], enemy: [[5, 4], [5, 5]] } } }] } } };
const rgHall = () => (doc.nodes || []).find(n => n.id === "hall");
const rgFight = () => rgHall().site.combat;
const rgWho = nm => combatants(rgFight()).find(t => t.label.startsWith(nm));
const rgTurn = async t => { const c = rgFight(); c.round++; c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const rgLast = () => ((rgFight().log || []).slice(-1)[0] || {}).text || "";
const rgAsk = answers => { const q = answers.slice(); window.prompt = () => q.length ? q.shift() : ""; window.confirm = () => q.length ? q.shift() : true; };
const rgWhat = async (v, targets) => { act.targets = targets; const w = $("#ac-what"); w.value = v; w.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = targets; renderBattlePanel(); await wait(20); };
const rgPick = (t, re) => actionChoices(t).flatMap(g => g.items).find(i => re.test(i.label));
step("uses and card: Rae (Ranger 11, Hunter): Favored Enemy's free Hunter's Mark 4, Tireless 3; Hunter's Mark in her spells; her card's picks; Speed with Roving", async () => {
  loadJSONNow(JSON.stringify(RG)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(rgHall()); await wait(150); beginBattle(rgHall().site); await wait(60);
  const R = rgWho("Rae"), p = pcState(R.p), uses = p.res.map(r => `${r.name} ${r.max}`).join(", "), hm = !!rgPick(R, /^Hunter's Mark \(/);
  const h = document.createElement("div"); h.innerHTML = rangerCardHtml(p); const picks = [...h.querySelectorAll("select")].map(s => `${s.dataset.k}=${s.value || "none"}`).join(", ");
  return `${uses} | Hunter's Mark listed ${hm} | card picks ${picks} | Speed ${speedOf(R)}`;
});
step("Hunter's Mark (free) on the Fanatic marks it; her Shortsword on it has Hunter's Mark and Colossus Slayer on by themselves (not on the Zombie); a hit offers Superior Hunter's Prey on the Zombie", async () => {
  const c = rgFight(), R = rgWho("Rae"), F = rgWho("Cultist"), Z = rgWho("Zombie"), p = pcState(R.p); F.x.hp = 150; F.x.max = 200; Z.x.hp = Z.x.max = 200; await rgTurn(R);
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await rgWhat(rgPick(R, /^Hunter's Mark \(/).v, [F.id]); act.miFree = true; act.outcome = "none"; renderBattlePanel(); await wait(20); rgAsk([]); $("#ac-go").click(); await wait(30);
  const cast = `${rgLast()} | marked ${(hmarkOf(c, R.id) || {}).label}, free uses left ${(r => r.max - r.used)(p.res.find(r => /favored enemy/i.test(r.name)))}`;
  await rgTurn(R); act = freshAct(R.id); renderBattlePanel(); await wait(20); await rgWhat("pca:0", [Z.id]); const onZ = (act.addons || []).join(", ") || "none";
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await rgWhat("pca:0", [F.id]); const onF = (act.addons || []).join(", ");
  act.outcome = "hit"; act.dmg = "20"; renderBattlePanel(); await wait(20); const zhp = Z.x.hp; rgAsk(["1"]); $("#ac-go").click(); await wait(30);
  return `${cast} || on the Zombie: ${onZ} | on the Fanatic: ${onF} || ${rgLast()} | Zombie ${zhp} → ${Z.x.hp}`;
});
step("Horde Breaker sets up one more attack at the Zombie; Multiattack Defense and Escape the Horde give Bram's attacks on Rae Disadvantage; Precise Hunter (17) gives Advantage on the marked Fanatic", async () => {
  const c = rgFight(), R = rgWho("Rae"), B = rgWho("Bram"), F = rgWho("Cultist"), Z = rgWho("Zombie"), p = pcState(R.p); p.prey = "horde"; await rgTurn(R);
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await rgWhat("pca:0", [F.id]); act.outcome = "miss"; act.dmg = ""; renderBattlePanel(); await wait(20); rgAsk([true]); $("#ac-go").click(); await wait(30);
  const hb = `horde ${!!act.horde}, free ${!!act.extraFree}, target ${(combatants(c).find(x => x.id === act.targets[0]) || {}).label}`;
  p.tactics = "multi"; await rgTurn(B); act = freshAct(B.id); renderBattlePanel(); await wait(20); await rgWhat("pca:0", [R.id]); act.outcome = "hit"; act.dmg = "5"; renderBattlePanel(); await wait(20); rgAsk([]); $("#ac-go").click(); await wait(30);
  const md = rollAdvOf(c, B, R, actInfo(c, B)).why; p.tactics = "escape"; act = freshAct(B.id); act.reaction = true; const esc2 = rollAdvOf(c, B, R, actInfo(c, B)).why; act = freshAct(R.id);
  p.level = 17; pcState(p); const ph = rollAdvOf(c, R, F, actInfo(c, R)).why; p.level = 11; pcState(p); p.prey = "colossus"; delete p.tactics;
  return `${hb} || Multiattack Defense: ${md} | Escape the Horde: ${esc2} || Precise Hunter: ${ph}`;
});
step("Tireless (10) gives 1d8 + Wis temp HP; at 14 Nature's Veil: Invisible; at 15 Superior Hunter's Defense halves Bram's 12; at 13 damage asks no save for Hunter's Mark; at 18 Blindsight 30; at 20 the mark's die is a d10", async () => {
  const c = rgFight(), R = rgWho("Rae"), B = rgWho("Bram"), p = pcState(R.p); p.temp = 0; await rgTurn(R);
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await rgWhat(rgPick(R, /^Tireless/).v, [R.id]); rgAsk(["5"]); $("#ac-go").click(); await wait(30); const ti = `${rgLast()} | temp ${p.temp}`;
  p.level = 15; pcState(p); await rgTurn(R); act = freshAct(R.id); renderBattlePanel(); await wait(20); await rgWhat(rgPick(R, /^Nature's Veil/).v, [R.id]); rgAsk([]); $("#ac-go").click(); await wait(30); const nv = `${rgLast()} | ${p.conds.join(", ")}`; p.conds = [];
  p.temp = 0; await rgTurn(B); act = freshAct(B.id); renderBattlePanel(); await wait(20); await rgWhat("pca:0", [R.id]); act.outcome = "hit"; act.dmg = "12"; act.dtype = "slashing"; renderBattlePanel(); await wait(20); const hp0 = p.hp; rgAsk([true]); $("#ac-go").click(); await wait(30);
  const shd = `${rgLast().replace(/^.*?; /, "")} | hp ${hp0} → ${p.hp}`; concAsks.length = 0; concSweep(); const rel = `concentration saves asked: ${concAsks.length}, still marked ${!!hmarkOf(c, R.id)}`;
  p.level = 20; pcState(p); const v = visionOf(c, R), die = attackAddons(R).find(a => a.key === "hmark"); p.level = 11; pcState(p);
  return `${ti} || ${nv} || ${shd} || ${rel} || Blindsight ${v.bs} | Hunter's Mark ${die && die.dice} | page errors ${__KIT.errors.length}`;
});
