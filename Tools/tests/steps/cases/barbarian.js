// The Barbarian (Joseph, 2026-11-06: "go 1-10", the SRD's class features): Rage, Reckless Attack, Danger Sense, Instinctive
// Pounce, Brutal Strike, Relentless Rage, Persistent Rage, Indomitable Might, and the Berserker's features.
const bbWall = "#".repeat(32), bbFloor = "#" + ".".repeat(30) + "#";
const BB = { format: "ordinate-survey-v1", title: "Barbarian", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "ka", name: "Korg", species: "Human", cls: "Barbarian", subcls: "Path of the Berserker", level: 5, hp: "55", hpMax: "55", ac: "15", str: 18, dex: 14, con: 16,
      saves: "Strength +7, Constitution +6", res: [{ id: "rrg", name: "Rage", max: 3, used: 0, rest: "long" }],
      attacks: [{ name: "Greataxe", hit: "+7", dmg: "1d12+4", dtype: "slashing" }, { name: "Shortbow", hit: "+5", dmg: "1d6+2", dtype: "piercing" }] },
    { id: "kb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] }],
  groups: [{ id: "g1", members: ["ka", "kb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [bbWall, bbFloor, bbFloor, bbFloor, bbFloor, bbFloor, bbFloor, bbFloor, bbFloor, bbWall], start: { party: [[4, 4], [2, 6]], enemy: [[5, 4]] } } }] } } };
const bbHall = () => (doc.nodes || []).find(n => n.id === "hall");
const bbFight = () => bbHall().site.combat;
const bbWho = nm => combatants(bbFight()).find(t => t.label.startsWith(nm));
const bbTurn = async t => { const c = bbFight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const bbLast = () => ((bbFight().log || []).slice(-1)[0] || {}).text || "";
let bbAsked = [];
const bbAsk = answers => { bbAsked = []; const q = answers.slice(); window.prompt = m => { bbAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { bbAsked.push(m); return q.length ? q.shift() : true; }; };
const bbRage = async () => { const K = bbWho("Korg"); await bbTurn(K); act.what = actionChoices(K).flatMap(g => g.items).find(i => /^rage/i.test(i.label)).v; act.targets = []; renderBattlePanel(); await wait(20); bbAsk([]); $("#ac-go").click(); await wait(30); return bbLast(); };
const bbAxe = (t, tgt) => { act = freshAct(t.id); act.what = "pca:0"; act.targets = [tgt.id]; act.outcome = "hit"; const info = actInfo(bbFight(), t); act.addons = autoAddonKeys(bbFight(), t, info, "slashing"); return info; };
step("Rage: a Bonus Action that spends a use, ends Concentration; Resistance, +2 on the Greataxe (not the Shortbow), Advantage on Strength saves; the card", async () => {
  loadJSONNow(JSON.stringify(BB)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(bbHall()); await wait(150); beginBattle(bbHall().site); await wait(60);
  const K = bbWho("Korg"); pcState(K.p).conc = { id: "spell:bless", name: "Bless" }; const said = await bbRage(); const c = bbFight();
  const r = pcState(K.p).res.find(x => x.name === "Rage"), F = bbWho("Cultist");
  const axe = bbAxe(K, F), axeDice = actDice(c, K, axe).dmgLabel, bow = (act = freshAct(K.id), act.what = "pca:1", act.targets = [F.id], actInfo(c, K)), bowKeys = autoAddonKeys(c, K, bow, "piercing");
  const card = barbCardHtml(K.p).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), wren = barbCardHtml(bbWho("Wren").p);
  return `${said} | uses ${r.max - r.used}/${r.max}, bonus ${bonusUsed(c, K.id)}, conc ${pcState(K.p).conc ? "still" : "gone"} | slashing: ${dmgTakes(K, "slashing")}, fire: "${dmgTakes(K, "fire")}" | greataxe ${axeDice} | shortbow chips [${bowKeys}] | Str save: ${JSON.stringify(saveModeT(c, K, "str"))} | card: ${card} | Wren's card: "${wren}"`;
});
step("Reckless Attack: the tick on Korg's first Greataxe attack gives Advantage; the Fanatic gets Advantage on him; it lapses on his next turn; Wren has no tick", async () => {
  const c = bbFight(), K = bbWho("Korg"), F = bbWho("Cultist"), W = bbWho("Wren"); c.round++; await bbTurn(K); bbAxe(K, F); renderBattlePanel(); await wait(20);
  const tick = !!document.querySelector("#ac-reck"); document.querySelector("#ac-reck").click(); await wait(20);
  document.querySelector('[data-acroll="hit"]').click(); await wait(20); const said = (act.toHit || {}).said || ""; act.dmg = "9"; renderBattlePanel(); await wait(20); bbAsk([]); $("#ac-go").click(); await wait(30);
  bbAxe(K, F); renderBattlePanel(); await wait(20); const second = `tick again ${!!document.querySelector("#ac-reck")}, note ${/Reckless this turn/.test(document.querySelector(".actbox").textContent)}`;
  const vs = rollAdvOf(c, F, K, actInfo(c, F)).why; await bbTurn(W); act.what = "pca:0"; act.targets = [F.id]; renderBattlePanel(); await wait(20); const wren = !!document.querySelector("#ac-reck");
  c.round++; await bbTurn(K); const lapsed = reckOn(c, K);
  return `tick ${tick} | ${said.replace(/^To hit: /, "").slice(0, 120)} | ${second} | Fanatic on Korg: ${vs} | Wren's tick ${wren} | next turn reckless ${lapsed}`;
});
step("Danger Sense: Advantage on Korg's Dexterity saves, asked of his player as one d20 with Advantage; none while Stunned; Wren none", async () => {
  const c = bbFight(), K = bbWho("Korg"), W = bbWho("Wren"); const a = saveModeT(c, K, "dex"); bbAsk([""]); const Q = saveD(K, "Dexterity", "a Dexterity save against DC 13");
  const asked = bbAsked[0] || "not asked"; pcState(K.p).conds.push("Stunned"); const s = saveModeT(c, K, "dex"); pcState(K.p).conds = pcState(K.p).conds.filter(k => k !== "Stunned");
  return `Korg: ${JSON.stringify(a)} | rolled for him: d20 ${Q.d >= 1 && Q.d <= 20 ? "ok" : Q.d}${Q.w.replace(/\d+ and \d+/, "x and y")} | asked: ${asked} | Stunned: adv ${s.adv} | Wren: adv ${saveModeT(c, W, "dex").adv}`;
});
step("Rage ends at the end of Korg's turn when he didn't keep it up; an attack keeps it; Undo of the Rage takes it back", async () => {
  const c = bbFight(), K = bbWho("Korg"), F = bbWho("Cultist"), used = () => pcState(K.p).res.find(x => x.name === "Rage").used;
  c.round++; await bbTurn(K); turnEnds(c); const ended = `${pcState(K.p).rage ? "still raging" : "ended"}: ${bbLast()}`;
  await bbRage(); c.round++; await bbTurn(K); bbAxe(K, F); act.dmg = "10"; renderBattlePanel(); await wait(20); $("#ac-go").click(); await wait(30); const hit = bbLast(); turnEnds(c);
  const kept = `${pcState(K.p).rage ? "still raging" : "ended"}`;
  c.round++; await bbTurn(K); turnEnds(c); const u0 = used(); await bbRage(); const u1 = used(); undoAction(c); await wait(20);
  return `${ended} || ${hit} | after the attack turn: ${kept} || raged again: uses used ${u0} → ${u1}; undone: ${used()}, raging ${!!pcState(K.p).rage}`;
});
