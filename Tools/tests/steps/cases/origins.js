// The SRD's character origins (Joseph, 2026-11-06: "do it, and the card and sheet"): a Goliath's Giant Ancestry (Fire's
// Burn, Frost's Chill, Stone's Endurance, Storm's Thunder), Large Form, Powerful Build; an Orc's Adrenaline Rush and
// Relentless Endurance; the origin feats Alert (swap initiative), Magic Initiate (no slot), Savage Attacker.
const orWall = "#".repeat(32), orFloor = "#" + ".".repeat(30) + "#";
const OR = { format: "ordinate-survey-v1", title: "Origins", ppm: 10, unit: "mi", party: 6,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "ga", name: "Grom", species: "Goliath", giant: "fire", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", str: 16, attacks: [{ name: "Greatsword", hit: "+6", dmg: "2d6+3", dtype: "slashing" }] },
    { id: "gb", name: "Pell", species: "Goliath (Stone)", cls: "Barbarian", level: 5, hp: "50", hpMax: "50", ac: "14", con: 16, attacks: [{ name: "Greataxe", hit: "+6", dmg: "1d12+3" }] },
    { id: "gc", name: "Skye", species: "Goliath", giant: "storm", cls: "Fighter", level: 3, hp: "30", hpMax: "30", ac: "16", attacks: [{ name: "Spear", hit: "+5", dmg: "1d6+3" }] },
    { id: "gd", name: "Rime", species: "Goliath", giant: "frost", cls: "Fighter", level: 3, hp: "30", hpMax: "30", ac: "16", attacks: [{ name: "Maul", hit: "+5", dmg: "2d6+3" }] },
    { id: "oa", name: "Ursa", species: "Orc", cls: "Fighter", level: 5, hp: "30", hpMax: "40", ac: "16", feats: "Savage Attacker, Alert", attacks: [{ name: "Battleaxe", hit: "+6", dmg: "1d8+3", dtype: "slashing" }] },
    { id: "sa", name: "Quill", species: "Human", cls: "Rogue", level: 5, hp: "30", hpMax: "30", ac: "14", int: 14, feats: "Magic Initiate (Wizard)", spells: ["spell:magic-missile"],
      res: [{ id: "rmi", name: "Magic Missile (Magic Initiate, no slot)", max: 1, used: 0, rest: "long" }], attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["ga", "gb", "gc", "gd", "oa", "sa"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [orWall, orFloor, orFloor, orFloor, orFloor, orFloor, orFloor, orFloor, orFloor, orWall],
        start: { party: [[2, 4], [5, 4], [8, 4], [11, 4], [14, 4], [17, 4]], enemy: [[6, 5]] } } }] } } };
const orHall = () => (doc.nodes || []).find(n => n.id === "hall");
const orFight = () => orHall().site.combat;
const orWho = nm => combatants(orFight()).find(t => t.label.startsWith(nm));
const orTurn = async t => { const c = orFight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const orLast = () => ((orFight().log || []).slice(-1)[0] || {}).text || "";
const orRes = nm => pcState(orWho(nm).p).res.map(r => `${r.name} ${r.max - r.used}/${r.max}${r.rest === "short" ? " (short)" : ""}`).join(", ");
let orAsked = [];
const orAsk = answers => { orAsked = []; const q = answers.slice(); window.prompt = m => { orAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { orAsked.push(m); return q.length ? q.shift() : true; }; };
const orHit = async (who, tgt, dmg) => { const F = orWho(who), T = orWho(tgt); await orTurn(F); act.what = F.kind === "foe" ? actionChoices(F).flatMap(g => g.items).find(i => /^fa:/.test(i.v) && !/multiattack/i.test(i.v)).v : "pca:0";
  act.targets = [T.id]; act.outcome = "hit"; act.dmg = String(dmg); renderBattlePanel(); await wait(20); $("#ac-go").click(); await wait(30); return orLast(); };
step("the uses come from the species: Goliaths (Large Form at level 5), the Orc; a Goliath's card has the giant pick", async () => {
  loadJSONNow(JSON.stringify(OR)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(orHall()); await wait(150); beginBattle(orHall().site); await wait(60);
  const card = originCardHtml(orWho("Pell").p).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 80);
  return `Grom: ${orRes("Grom")} | Pell (${giantOf(orWho("Pell").p)}): ${orRes("Pell")} | Skye: ${orRes("Skye")} | Ursa: ${orRes("Ursa")} | Pell's card: ${card} | Quill's card: "${originCardHtml(orWho("Quill").p).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)}"`;     // one line: Weapon Mastery's card has several
});
step("Fire's Burn: a chip on Grom's hit, its 1d10 Fire in the damage, a use spent; Frost's Chill takes 10 ft off the Fanatic", async () => {
  const G = orWho("Grom"), F = orWho("Cultist"); await orTurn(G); act.what = "pca:0"; act.targets = [F.id]; act.outcome = "hit"; renderBattlePanel(); await wait(20);
  const chip = document.querySelector('[data-addon="giant"]'); const chipTxt = chip ? chip.textContent.trim() : "no chip"; chip.click(); await wait(20);
  const dice = actDice(orFight(), G, actInfo(orFight(), G)).dmgLabel; act.dmg = "12"; renderBattlePanel(); await wait(20); orAsk([]); $("#ac-go").click(); await wait(30);
  const fire = `${chipTxt} | ${dice} | ${orLast()} | ${orRes("Grom")}`;
  const sp0 = speedOf(F), R = orWho("Rime"); await orTurn(R); act.what = "pca:0"; act.targets = [F.id]; act.outcome = "hit"; act.addons = ["giant"]; act.dmg = "9"; renderBattlePanel(); await wait(20); $("#ac-go").click(); await wait(30);
  return `${fire} || ${orLast()} | speed ${sp0} → ${speedOf(F)}`;
});
step("Stone's Endurance (Pell: yes, d12 6 typed, + Con 3 off) and Storm's Thunder (Skye: yes, d8 5 typed back at the Fanatic)", async () => {
  orAsk([true, "6"]); const stone = await orHit("Cultist", "Pell", 14); const pell = `${pcState(orWho("Pell").p).hp} HP, asked: ${orAsked.join(" / ")}`;
  const F = orWho("Cultist"), hp0 = F.x.hp; orAsk([true, "5"]); const storm = await orHit("Cultist", "Skye", 4);
  return `${stone} | Pell ${pell} || ${storm} | Fanatic ${hp0} → ${orWho("Cultist").x.hp}`;
});
step("Relentless Endurance: Ursa at 5 takes 10, says yes, and is at 1; Undo puts the use back", async () => {
  pcState(orWho("Ursa").p).hp = 5; orAsk([true]); const said = await orHit("Cultist", "Ursa", 10);
  const now = `${pcState(orWho("Ursa").p).hp} HP, ${orRes("Ursa")} | asked: ${orAsked.join(" / ")}`; undoAction(orFight()); await wait(20);
  return `${said} | ${now} || undone: ${pcState(orWho("Ursa").p).hp} HP, ${orRes("Ursa")}`;
});
step("Adrenaline Rush: a Bonus Action, Dash and 3 temp HP; Large Form: Grom is 2x2, 40 ft, and escapes a grapple with Advantage", async () => {
  const U = orWho("Ursa"); pcState(U.p).hp = 30; await orTurn(U); const ch = actionChoices(U).flatMap(g => g.items);
  act.what = ch.find(i => /adrenaline/i.test(i.label)).v; act.targets = []; renderBattlePanel(); await wait(20); orAsk([]); $("#ac-go").click(); await wait(30);
  const rush = `${orLast()} | temp ${pcState(U.p).temp}, dash ${movedOf(orFight(), U.id).dash}, bonus used ${bonusUsed(orFight(), U.id)}`;
  const G = orWho("Grom"); await orTurn(G); act.what = actionChoices(G).flatMap(g => g.items).find(i => /large form/i.test(i.label)).v; act.targets = []; renderBattlePanel(); await wait(20); $("#ac-go").click(); await wait(30);
  const big = `${orLast()} | foot ${footOf(orWho("Grom"))}, speed ${speedOf(orWho("Grom"))}`;
  const c = orFight(), F = orWho("Cultist"); (c.grips = c.grips || {})[G.id] = { by: F.id, dc: 12, cond: "Grappled", what: "grip", ends: [] }; condsOfT(G).push("Grappled");
  orAsk([]); const esc1 = gripEscape(c, orWho("Grom")); delete orWho("Grom").p.big; return `${rush} || ${big} || ${esc1}`;
});
step("Savage Attacker: Ursa's damage rolled twice, the higher kept; Magic Initiate: Quill's Magic Missile without a slot", async () => {
  const U = orWho("Ursa"), F = orWho("Cultist"); await orTurn(U); act.what = "pca:0"; act.targets = [F.id]; act.outcome = "hit"; renderBattlePanel(); await wait(20);
  const chips = [...document.querySelectorAll("[data-addon]")].map(b => b.textContent.trim()).join(", "); document.querySelector('[data-addon="savage"]').click(); await wait(20);
  document.querySelector('[data-acroll="dmg"]').click(); await wait(20); const sav = `chips: ${chips} | ${(act.rolled && act.rolled.dmg || {}).said}`;
  const Q = orWho("Quill"); await orTurn(Q); act.what = "sp:spell:magic-missile"; act.targets = [F.id]; act.outcome = "hit"; act.dmg = "10"; renderBattlePanel(); await wait(20);
  const box = !!document.querySelector("#ac-mi"); const mi = document.querySelector("#ac-mi"); mi.checked = true; mi.onchange(); await wait(20); orAsk([]); $("#ac-go").click(); await wait(30);
  return `${sav} || box ${box} | ${orLast()} | ${orRes("Quill")} | slots used ${pcState(Q.p).slots[1].used} | asked ${orAsked.length}`;
});
step("Alert: Ursa swaps initiative with Quill in round 1; page errors", async () => {
  const c = orFight(), U = orWho("Ursa"), Q = orWho("Quill"); c.round = 1; c.init[U.id] = 5; c.init[Q.id] = 18; renderBattlePanel(); await wait(20);
  const row = document.querySelector(`[data-alertswap="${U.id}"]`); const rowTxt = row ? row.parentElement.textContent.replace(/\s+/g, " ").trim() : "no row";
  document.querySelector(`[data-alertwho="${U.id}"]`).value = Q.id; row.click(); await wait(20);
  window.confirm = () => true; window.prompt = (q, d) => d ?? "";
  return `${rowTxt} || ${orLast()} | again offered: ${!!document.querySelector(`[data-alertswap="${U.id}"]`)} | page errors ${__KIT.errors.length}`;
});
