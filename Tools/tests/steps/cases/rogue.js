// The Rogue (Joseph, 2026-11-13, the SRD walk-through: "Yes"; text from his SRD 5.2.1): Sneak Attack from the level, Cunning
// Strike (and Devious Strikes), Cunning Action, Steady Aim, Uncanny Dodge, Reliable Talent, Slippery Mind, Elusive, Stroke of
// Luck, and the Thief's notes.
const roWall = "#".repeat(32), roFloor = "#" + ".".repeat(30) + "#";
const RO = { format: "ordinate-survey-v1", title: "Rogue", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "ri", name: "Rita", species: "Human", cls: "Rogue", subcls: "Thief", level: 11, hp: "70", hpMax: "70", ac: "16", str: 10, dex: 18, con: 12, wis: 12, cha: 10,
      skills: "Proficient: Acrobatics +8. Expertise: Stealth +12. Also Athletics +0.", attacks: [{ name: "Shortsword", hit: "+8", dmg: "1d6+4", dtype: "piercing" }] },
    { id: "rb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["ri", "rb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }, { id: "srd:zombie", n: "1" }] },
      bmap: { name: "The Hall", rows: [roWall, roFloor, roFloor, roFloor, roFloor, roFloor, roFloor, roFloor, roFloor, roWall], start: { party: [[4, 4], [6, 4]], enemy: [[5, 4], [5, 5]] } } }] } } };
const roHall = () => (doc.nodes || []).find(n => n.id === "hall");
const roFight = () => roHall().site.combat;
const roWho = nm => combatants(roFight()).find(t => t.label.startsWith(nm));
const roTurn = async t => { const c = roFight(); c.round++; c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const roLast = () => ((roFight().log || []).slice(-1)[0] || {}).text || "";
const roAsk = answers => { const q = answers.slice(); window.prompt = () => q.length ? q.shift() : ""; window.confirm = () => q.length ? q.shift() : true; };
const roWhat = async (v, targets) => { act.targets = targets; const w = $("#ac-what"); w.value = v; w.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = targets; renderBattlePanel(); await wait(20); };
const roPick = (t, re) => actionChoices(t).flatMap(g => g.items).find(i => re.test(i.label));
const roLow = async f => { const r = Math.random; Math.random = () => 0.01; try { return await f(); } finally { Math.random = r; } };
step("Rita (Rogue 11, Thief): her card, her Rogue choices, the Sneak Attack chip (6d6) with no typed line", async () => {
  loadJSONNow(JSON.stringify(RO)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(roHall()); await wait(150); beginBattle(roHall().site); await wait(60);
  const R = roWho("Rita"), p = pcState(R.p), h = document.createElement("div"); h.innerHTML = rogueCardHtml(p);
  return `card: ${[...h.querySelectorAll(".chip")].map(x => x.textContent).join(" | ")} | ${h.textContent.replace(/^.*?DC \d+/, "").trim().slice(0, 80)} || ${(actionChoices(R).find(g => g.group === "Rogue") || { items: [] }).items.map(i => i.label.replace(/ \(.*$/, "")).join("; ")} || ${(attackAddons(R).find(a => a.key === "sneak") || {}).dice}`;
});
step("Sneak Attack with two Cunning Strikes (Trip and Poison: 4d6 left), the Fanatic's saves rolled low: Prone and Poisoned", async () => {
  const c = roFight(), R = roWho("Rita"), F = roWho("Cultist"); F.x.hp = F.x.max = 200; await roTurn(R);
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await roWhat("pca:0", [F.id]); act.addons = [...(act.addons || []), "sneak"]; renderBattlePanel(); await wait(20);
  const s0 = document.querySelector('[data-cs="0"]'); s0.value = "trip"; s0.onchange(); await wait(20); const s1 = document.querySelector('[data-cs="1"]'); s1.value = "poison"; s1.onchange(); await wait(20);
  const dice = attackAddons(R).find(a => a.key === "sneak").dice; act.outcome = "hit"; act.dmg = "25"; renderBattlePanel(); await wait(20);
  await roLow(async () => { roAsk([]); $("#ac-go").click(); await wait(30); });
  return `Sneak Attack ${dice} || ${roLast()} | ${condsOfT(F).join(", ")}`;
});
step("Cunning Action: Hide (Stealth 12 + 12 = 24: hidden); next turn Steady Aim gives Advantage; Uncanny Dodge halves Bram's 12; Reliable Talent: a Stealth check's 3 counts as 10", async () => {
  const c = roFight(), R = roWho("Rita"), B = roWho("Bram"), F = roWho("Cultist"), p = pcState(R.p); condsOfT(F).length = 0; c.effects = []; await roTurn(R);
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await roWhat(roPick(R, /^Cunning Action: Hide/).v, [R.id]); roAsk(["12"]); $("#ac-go").click(); await wait(30); const hide = `${roLast()} | hidden ${!!((c.stealth || {})[R.id] || {}).hide}`; delete c.stealth[R.id];
  await roTurn(R); act = freshAct(R.id); renderBattlePanel(); await wait(20); await roWhat(roPick(R, /^Steady Aim/).v, [R.id]); roAsk([]); $("#ac-go").click(); await wait(30);
  const aim = `${roLast().replace(/^.*?; /, "")} | next attack: ${rollAdvOf(c, R, F, { kind: "attack", name: "Shortsword" }).why} | move left ${moveAllow(c, R) - movedOf(c, R.id).ft}`;
  await roTurn(B); act = freshAct(B.id); renderBattlePanel(); await wait(20); await roWhat("pca:0", [R.id]); act.outcome = "hit"; act.dmg = "12"; renderBattlePanel(); await wait(20); const hp0 = p.hp; roAsk([true]); $("#ac-go").click(); await wait(30);
  const ud = `${roLast().replace(/^.*?hits, /, "")} | hp ${hp0} → ${p.hp}`;
  await roTurn(R); act = freshAct(R.id); renderBattlePanel(); await wait(20); await roWhat("chk", []); act.chk = "Stealth"; act.chkDc = "20"; act.chkD20 = "3"; renderBattlePanel(); await wait(20); roAsk([]); $("#ac-go").click(); await wait(30);
  return `${hide} || ${aim} || ${ud} || ${roLast()}`;
});
step("14: Knock Out (6d6) on the Zombie, then Bram's hit wakes it; 15: Wisdom saves proficient; 18: Elusive takes Advantage away; 20: Stroke of Luck turns a failed save's d20 into a 20", async () => {
  const c = roFight(), R = roWho("Rita"), B = roWho("Bram"), Z = roWho("Zombie"), p = pcState(R.p); Z.x.hp = Z.x.max = 200; p.level = 14; pcState(p); await roTurn(R);
  act = freshAct(R.id); renderBattlePanel(); await wait(20); await roWhat("pca:0", [Z.id]); act.addons = [...(act.addons || []), "sneak"]; renderBattlePanel(); await wait(20);
  const s0 = document.querySelector('[data-cs="0"]'); s0.value = "ko"; s0.onchange(); await wait(20); act.outcome = "hit"; act.dmg = "10"; renderBattlePanel(); await wait(20);
  await roLow(async () => { roAsk([]); $("#ac-go").click(); await wait(30); }); const ko = `${roLast().replace(/^.*?damage; /, "")} | ${condsOfT(Z).join(", ")}`;
  await roTurn(B); act = freshAct(B.id); renderBattlePanel(); await wait(20); await roWhat("pca:0", [Z.id]); act.outcome = "hit"; act.dmg = "5"; renderBattlePanel(); await wait(20); roAsk([]); $("#ac-go").click(); await wait(30);
  const wake = `${roLast().replace(/^.*?damage; /, "")} | ${condsOfT(Z).join(", ") || "no conditions"}`;
  p.level = 15; pcState(p); const wis = saveBonusOf(R, "Wisdom");
  p.level = 18; pcState(p); p.conds = ["Restrained"]; const el = rollAdvOf(c, B, R, actInfo(c, B)).why; p.conds = [];
  p.level = 20; pcState(p); roAsk([true]); const SL = d20Rescue(c, R, 9, 15, "Wisdom save", "save", 5); p.level = 11; pcState(p);
  return `${ko} || ${wake} || Wis save ${signed(wis)} || Elusive: ${el} || ${SL.tot}${SL.w} | page errors ${__KIT.errors.length}`;
});
