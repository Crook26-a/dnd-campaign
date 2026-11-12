// The Fighter (Joseph, 2026-11-12, the SRD walk-through: "Do 1-8"; text from his SRD 5.2.1): Action Surge and Indomitable's
// uses, Tactical Mind, Tactical Shift, Indomitable, Tactical Master, Studied Attacks, the Champion (critical range, Remarkable
// Athlete, Heroic Warrior, Survivor), and the Fighting Style feats.
const fiWall = "#".repeat(32), fiFloor = "#" + ".".repeat(30) + "#";
const FI = { format: "ordinate-survey-v1", title: "Fighter", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "va", name: "Vera", species: "Human", cls: "Fighter", subcls: "Champion", level: 13, hp: "100", hpMax: "100", ac: "18", str: 18, dex: 14, con: 14,
      skills: "Athletics +9", saves: "Strength +9, Constitution +7", mastery: ["Greatsword"], res: [{ id: "rsw", name: "Second Wind", max: 4, used: 0, rest: "one" }],
      attacks: [{ name: "Greatsword", hit: "+9", dmg: "2d6+4", dtype: "slashing" }, { name: "Longbow", hit: "+7", dmg: "1d8+2", dtype: "piercing" }, { name: "Shortsword (off-hand)", hit: "+7", dmg: "1d6", dtype: "piercing" }] },
    { id: "vb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["va", "vb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [fiWall, fiFloor, fiFloor, fiFloor, fiFloor, fiFloor, fiFloor, fiFloor, fiFloor, fiWall], start: { party: [[4, 4], [2, 6]], enemy: [[5, 4]] } } }] } } };
const fiHall = () => (doc.nodes || []).find(n => n.id === "hall");
const fiFight = () => fiHall().site.combat;
const fiWho = nm => combatants(fiFight()).find(t => t.label.startsWith(nm));
const fiTurn = async t => { const c = fiFight(); c.round++; c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const fiLast = () => ((fiFight().log || []).slice(-1)[0] || {}).text || "";
let fiAsked = [];
const fiAsk = answers => { fiAsked = []; const q = answers.slice(); window.prompt = m => { fiAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { fiAsked.push(m); return q.length ? q.shift() : true; }; };
const fiSwing = async (row, d20, dmg) => { const V = fiWho("Vera"), F = fiWho("Cultist"); act = freshAct(V.id); act.what = `pca:${row}`; act.targets = [F.id]; act.d20 = d20; renderBattlePanel(); await wait(20);
  fiAsk([]); document.querySelector('[data-acroll="hit"]').click(); await wait(20); const said = ((act.toHit || {}).said || "").replace(/^To hit: /, ""); act.dmg = dmg; renderBattlePanel(); await wait(20); fiAsk([]); $("#ac-go").click(); await wait(30); return `${said} → ${fiLast().replace(/ \(to hit[^)]*\)/, "")}`; };
step("uses: Vera (13) Action Surge 1, Indomitable 2; at 17 two and three; the card's Fighting Style picks (a Champion's second at 7); Bram (5) one pick", async () => {
  loadJSONNow(JSON.stringify(FI)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(fiHall()); await wait(150); beginBattle(fiHall().site); await wait(60);
  const V = fiWho("Vera"), B = fiWho("Bram"), u = p => ["Action Surge", "Indomitable"].map(n => { const r = pcState(p).res.find(x => x.name === n); return r ? `${n} ${r.max}` : `no ${n}`; }).join(", ");
  const at13 = u(V.p); V.p.level = 17; pcState(V.p); const at17 = u(V.p); V.p.level = 13; pcState(V.p);
  const picks = p => { const h = document.createElement("div"); h.innerHTML = fighterCardHtml(p); return [...h.querySelectorAll("select")].map(s => s.dataset.k).join(", ") || "none"; };
  return `Vera 13: ${at13}; 17: ${at17} | Vera's picks: ${picks(V.p)} | Bram: ${u(B.p)}; picks ${picks(B.p)}`;
});
step("Champion: a 19 is a crit (Improved Critical), then half her Speed to move (Remarkable Athlete); a miss gives Advantage on the next attack (Studied Attacks)", async () => {
  const c = fiFight(), V = fiWho("Vera"), F = fiWho("Cultist"); F.x.hp = F.x.max = 200; await fiTurn(V); const m0 = moveAllow(c, V);
  const crit = await fiSwing(0, "19", "20"); const m1 = moveAllow(c, V); const miss = await fiSwing(0, "2", "0");
  act = freshAct(V.id); act.what = "pca:0"; act.targets = [F.id]; const adv = rollAdvOf(c, V, F, actInfo(c, V)).why;
  return `${crit} | move ${m0} → ${m1} ft || ${miss} | next: ${adv}`;
});
step("Tactical Shift (Second Wind as a Bonus Action: half Speed); Indomitable rerolls a failed save (3 typed, then 9 + 9 + 13 = 31); Tactical Mind on an out-of-fight check row", async () => {
  const c = fiFight(), V = fiWho("Vera"), B = fiWho("Bram"); await fiTurn(V); const m0 = moveAllow(c, V);
  act.what = actionChoices(V).flatMap(g => g.items).find(i => /second wind/i.test(i.label)).v; act.targets = [V.id]; act.heal = "10"; renderBattlePanel(); await wait(20); fiAsk([]); $("#ac-go").click(); await wait(30);
  const shift = `${fiLast()} | move ${m0} → ${moveAllow(c, V)} ft`; await fiTurn(B); act.what = "sp:spell:burning-hands"; act.lvl = 1; act.targets = [V.id]; act.saveDC = 30; renderBattlePanel(); await wait(20);
  fiAsk(["3", true, "9"]); document.querySelector(`[data-svroll="${V.id}"]`).click(); await wait(20); const ind = `${(act.saves || {})[V.id] ? act.saves[V.id].said : "none"} | Indomitable left ${pcState(V.p).res.find(r => r.name === "Indomitable").max - pcState(V.p).res.find(r => r.name === "Indomitable").used}`;
  const P = taPeople(), vk = P.find(x => x.o === V.p).key; ta.what = "check"; ta.dc = "20"; ta.tot = { [vk]: "15" }; const h = document.createElement("div"); h.innerHTML = taBardBtns(P.find(x => x.key === vk), P); const tm = [...h.querySelectorAll("button")].map(b => b.textContent.trim()).join(", ") || "none"; ta.tot = {}; ta.dc = "";
  return `${shift} || ${ind} || check 15 vs DC 20: [${tm}]`;
});
step("Fighting Styles on a sheet made here: Archery +2 on the Longbow, Defense +1 AC, Great Weapon Fighting's 1s as 3s on the Greatsword, Two-Weapon Fighting's +4 on the off-hand; Tactical Master swaps Graze for Push", async () => {
  const c = fiFight(), V = fiWho("Vera"), F = fiWho("Cultist"), p = pcState(V.p); await fiTurn(V); p.style1 = "archery"; const bow = await fiSwing(1, "10", "5");
  const ac0 = acOf(V); p.style1 = "defense"; const ac1 = acOf(V); p.style1 = "gwf"; act = freshAct(V.id); act.what = "pca:0"; act.targets = [F.id]; act.outcome = "hit"; renderBattlePanel(); await wait(20);
  const r = Math.random; Math.random = () => 0.01; try { document.querySelector('[data-acroll="dmg"]').click(); } finally { Math.random = r; } await wait(20); const gwf = (act.rolled && act.rolled.dmg || {}).said;
  p.style1 = "twf"; act = freshAct(V.id); act.what = "pca:2"; act.targets = [F.id]; renderBattlePanel(); await wait(20); const twf = actDice(c, V, actInfo(c, V)).dmgLabel;
  act = freshAct(V.id); act.what = "pca:0"; act.targets = [F.id]; renderBattlePanel(); await wait(20); const sel = !!document.querySelector("#ac-tmaster"); const s = document.querySelector("#ac-tmaster"); s.value = "Push"; s.onchange(); await wait(20);
  const chip = [...document.querySelectorAll("[data-addon]")].map(b => b.textContent.trim().replace(/ ·.*$/, "")).join(", "); delete p.style1;
  return `${bow.slice(0, 120)} || AC ${ac0} → ${ac1} || ${gwf} || off-hand ${twf} || Tactical Master select ${sel}: chips ${chip}`;
});
step("Action Surge twice in one turn asks first (17); Heroic Warrior gives Inspiration and Heroic Rally heals when Bloodied at turn start (18); Defy Death: an 18 on a death save counts as a 20", async () => {
  const c = fiFight(), V = fiWho("Vera"), p = pcState(V.p); p.level = 18; pcState(p); await fiTurn(V); const as = () => { act = freshAct(V.id); act.what = actionChoices(V).flatMap(g => g.items).find(i => /action surge/i.test(i.label)).v; act.targets = []; renderBattlePanel(); };
  as(); await wait(20); fiAsk([]); $("#ac-go").click(); await wait(30); as(); await wait(20); fiAsk([false]); const n0 = c.log.length; $("#ac-go").click(); await wait(30);
  const surge = `asked "${(fiAsked[0] || "no").slice(0, 70)}", logged ${c.log.length !== n0}`; delete p.insp; p.hp = 40; fighterTurnStart(c, V.id); const ts = `insp ${!!p.insp}, hp ${p.hp}`;
  p.hp = 0; p.conds = ["Unconscious"]; p.death = { s: 0, f: 1 }; renderBattlePanel(); await wait(20); const ds = document.querySelector("#ac-ds"); if (ds) ds.value = "18"; const b = document.querySelector(`[data-dsroll="${V.id}"]`); if (b) b.click(); await wait(20);
  const defy = `${fiLast()} | hp ${p.hp}`; p.level = 13; pcState(p); p.hp = 100; p.conds = []; p.death = { s: 0, f: 0 };
  return `${surge} || turn start: ${ts} || ${defy} | page errors ${__KIT.errors.length}`;
});
