// The Cleric (Joseph, 2026-11-12, the SRD walk-through: "Build it"): Channel Divinity (Divine Spark, Turn Undead with Sear
// Undead, Preserve Life), Divine Order, Blessed Strikes, Divine Intervention, and the Life Domain; a 2014 cleric gets only
// what their sheet has.
const clWall = "#".repeat(32), clFloor = "#" + ".".repeat(30) + "#";
const CL = { format: "ordinate-survey-v1", title: "Cleric", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "ma", name: "Mira", species: "Human", cls: "Cleric", subcls: "Life Domain", level: 5, hp: "38", hpMax: "38", ac: "18", wis: 16, str: 14, dc: "13", satk: "+5",
      spells: ["spell:cure-wounds", "spell:sacred-flame", "spell:healing-word"], slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 2, used: 0 }],
      attacks: [{ name: "Mace", hit: "+5", dmg: "1d6+2", dtype: "bludgeoning" }] },
    { id: "mb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] },
    { id: "mc", name: "Old Gnick", cls: "Cleric", level: 4, rules: "2014", feats: "Spellcasting, Divine Domain, Channel Divinity, Destroy Undead", hp: "27", hpMax: "27", ac: "16", wis: 16, dc: "13",
      res: [{ id: "rcd", name: "Channel Divinity", max: 1, used: 0, rest: "short" }], attacks: [{ name: "Mace", hit: "+4", dmg: "1d6+2" }] }],
  groups: [{ id: "g1", members: ["ma", "mb", "mc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:zombie", n: "2" }, { id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [clWall, clFloor, clFloor, clFloor, clFloor, clFloor, clFloor, clFloor, clFloor, clWall], start: { party: [[4, 4], [5, 5], [3, 6]], enemy: [[7, 4], [7, 6], [9, 5]] } } }] } } };
const clHall = () => (doc.nodes || []).find(n => n.id === "hall");
const clFight = () => clHall().site.combat;
const clWho = nm => combatants(clFight()).find(t => t.label.startsWith(nm));
const clZ = () => combatants(clFight()).filter(t => /zombie/i.test(t.label));
const clTurn = async t => { const c = clFight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const clLast = () => ((clFight().log || []).slice(-1)[0] || {}).text || "";
let clAsked = [];
const clAsk = answers => { clAsked = []; const q = answers.slice(); window.prompt = m => { clAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { clAsked.push(m); return q.length ? q.shift() : true; }; };
const clCD = async (who, fx) => { const M = clWho(who); await clTurn(M); const v = actionChoices(M).flatMap(g => g.items).find(i => /channel divinity/i.test(i.label)).v; const w = document.querySelector("#ac-what"); w.value = v; w.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  if (fx) { const s = document.querySelector("#ac-cdfx"); s.value = fx; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); } return M; };
step("Channel Divinity: Mira (Life 5) has Divine Spark, Turn Undead, Preserve Life, 2 uses (one back on a Short Rest); Old Gnick (2014) has Turn Undead only", async () => {
  loadJSONNow(JSON.stringify(CL)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(clHall()); await wait(150); beginBattle(clHall().site); await wait(60);
  const M = clWho("Mira"), G = clWho("Old Gnick"), r = pcState(M.p).res.find(x => x.name === "Channel Divinity"), g = pcState(G.p).res.find(x => x.name === "Channel Divinity");
  return `Mira: ${cdChoices(pcState(M.p)).map(x => x[1]).join("; ")} | uses ${r.max} (${r.rest}) || Old Gnick: ${cdChoices(pcState(G.p)).map(x => x[1]).join("; ")} | uses ${g.max} (${g.rest})`;
});
step("Divine Spark: heals Bram 1d8+3; then Radiant at a zombie, Con save failed (typed outcome): 1d8+3 damage", async () => {
  const c = clFight(), B = clWho("Bram"), [Z] = clZ(); pcState(B.p).hp = 20; const M = await clCD("Mira", "spark-heal"); act.targets = [B.id]; renderBattlePanel(); await wait(20);
  document.querySelector('[data-acroll="heal"]').click(); await wait(20); const rolled = act.heal; clAsk([]); $("#ac-go").click(); await wait(30); const heal = `${clLast()} | Bram ${pcState(B.p).hp}`;
  c.round++; await clCD("Mira", "spark-radiant"); act.targets = [Z.id]; act.outcome = "fail"; act.dmg = "9"; renderBattlePanel(); await wait(20); const dc = JSON.stringify(saveOfAct(c, M, actInfo(c, M)));
  const hp0 = Z.x.hp; clAsk([]); $("#ac-go").click(); await wait(30);
  return `rolled ${rolled} | ${heal} || save ${dc} | ${clLast()} | zombie ${hp0} → ${Z.x.hp}`;
});
step("Turn Undead: both zombies fail: Frightened and Incapacitated, Sear Undead's 3d8 Radiant; Bram hits one and its turning ends; the other flees on the autopilot", async () => {
  const c = clFight(), B = clWho("Bram"), [Z1, Z2] = clZ(); for (const z of [Z1, Z2]) { z.x.max = 60; z.x.hp = 60; z.x.conds = []; } c.round++;
  const M = await clCD("Mira", "turn"); act.targets = [Z1.id, Z2.id]; act.outcome = "fail"; renderBattlePanel(); await wait(20); const cond = act.cond;
  clAsk([]); $("#ac-go").click(); await wait(30); const line = clLast(), st = z => `${z.label} [${condsOfT(z).join(", ")}] ${z.x.hp}/${z.x.max}`; const after = `${st(Z1)} | ${st(Z2)}`;
  await clTurn(B); act.what = "pca:0"; act.targets = [Z1.id]; act.outcome = "hit"; act.dmg = "5"; renderBattlePanel(); await wait(20); clAsk([]); $("#ac-go").click(); await wait(30); const hit = st(Z1);
  const d0 = chebSq(c.pos[M.id], c.pos[Z2.id]); c.turn = Z2.id; holdsTurnStart(c, Z2.id); root.autoPace = "now"; const r = await autoTurn(c, Z2); const d1 = chebSq(c.pos[M.id], c.pos[Z2.id]);
  return `act.cond ${cond} | ${line} || ${after} || after Bram's hit: ${hit} || ${r ? r.said : "no turn"} | squares from Mira ${d0} → ${d1}`;
});
step("Divine Order on Mira's card (not Old Gnick's, nor Bram's); Thaumaturge adds her Wisdom (+3) to Religion; Blessed Strikes waits for level 7", async () => {
  const M = clWho("Mira"), G = clWho("Old Gnick"), B = clWho("Bram"), host = document.createElement("div"); document.body.appendChild(host);
  host.innerHTML = clericCardHtml(M.p); const opts = [...host.querySelectorAll("select")].map(s => s.dataset.k).join(", "); const r0 = skillMod(pcState(M.p), "Religion");
  const s = host.querySelector('[data-k="order"]'); s.value = "thaumaturge"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); host.remove();
  const p = pcState(M.p); p.level = 7; const seven = [...(() => { const h = document.createElement("div"); h.innerHTML = clericCardHtml(M.p); return h.querySelectorAll("select"); })()].map(x => x.dataset.k).join(", "); p.level = 5;
  return `Mira's picks: ${opts} | order now ${M.p.order} | Religion ${r0} → ${skillMod(pcState(M.p), "Religion")}, Medicine ${skillMod(pcState(M.p), "Medicine")} | at 7: ${seven} || Old Gnick: "${clericCardHtml(G.p)}" | Bram: "${clericCardHtml(B.p)}"`;
});
step("Blessed Strikes at 7: Divine Strike's chips on Mira's Mace, gone after one hit that turn; Potent Spellcasting puts +3 on Sacred Flame; at 14 a damaging cantrip offers 6 temp HP", async () => {
  const c = clFight(), M = clWho("Mira"), F = combatants(c).find(t => /cultist/i.test(t.label)), p = pcState(M.p); p.level = 7; p.strikes = "divine"; c.round++; await clTurn(M);
  act.what = "pca:0"; act.targets = [F.id]; act.outcome = "hit"; renderBattlePanel(); await wait(20); const chips = [...document.querySelectorAll("[data-addon]")].map(b => b.textContent.trim()).join(", ");
  document.querySelector('[data-addon="dstrike-radiant"]').click(); await wait(20); const dice = actDice(c, M, actInfo(c, M)).dmgLabel; act.dmg = "9"; renderBattlePanel(); await wait(20); clAsk([]); $("#ac-go").click(); await wait(30);
  const line = clLast(); act = freshAct(M.id); act.what = "pca:0"; act.targets = [F.id]; renderBattlePanel(); await wait(20); const again = [...document.querySelectorAll("[data-addon]")].map(b => b.textContent.trim()).join(", ") || "none";
  p.strikes = "potent"; act = freshAct(M.id); act.what = "sp:spell:sacred-flame"; act.targets = [F.id]; renderBattlePanel(); await wait(20); const flame = actDice(c, M, actInfo(c, M)).dmgLabel;
  p.level = 14; c.round++; await clTurn(M); act.what = "sp:spell:sacred-flame"; act.targets = [F.id]; act.outcome = "fail"; act.dmg = "12"; renderBattlePanel(); await wait(20); p.temp = 0; clAsk([true]); $("#ac-go").click(); await wait(30);
  const temp = `asked "${(clAsked.find(a => /Potent/.test(a)) || "no").slice(0, 70)}…", temp HP ${p.temp}`; p.level = 5; delete p.strikes; p.temp = 0;
  return `chips: ${chips} | ${dice} | ${line} | next attack's chips: ${again} || Sacred Flame ${flame} || at 14: ${temp}`;
});
step("Preserve Life: 25 hit points split between Bram (Bloodied, 10/44) and Old Gnick (5/27), each no higher than half its maximum; Mira (full) asks first", async () => {
  const c = clFight(), B = clWho("Bram"), G = clWho("Old Gnick"), M = clWho("Mira"); pcState(B.p).hp = 10; pcState(G.p).hp = 5; c.round++; pcState(M.p).res.find(x => x.name === "Channel Divinity").used = 0;
  await clCD("Mira", "preserve"); act.targets = [B.id, G.id]; renderBattlePanel(); await wait(20); clAsk([]); $("#ac-go").click(); await wait(30);
  const one = `${clLast()} | Bram ${pcState(B.p).hp}, Gnick ${pcState(G.p).hp}`; c.round++; await clCD("Mira", "preserve"); act.targets = [M.id]; renderBattlePanel(); await wait(20);
  clAsk([false]); $("#ac-go").click(); await wait(30);
  return `${one} || Mira at full: asked "${(clAsked[0] || "nothing").slice(0, 90)}" | page errors ${__KIT.errors.length}`;
});
