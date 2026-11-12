// The Oath of the Fallen Crown (Joseph's own paladin oath, 2026-11-12: "build the subclass, and build the mechanics into
// the apps"): the uses and oath spells, Kneel Before the Crown (Prone, can't stand up), Wrath of the Fallen, Aura of Never
// Again with Vengeance of the Crown, and the Spectral Court.
const fcWall = "#".repeat(32), fcFloor = "#" + ".".repeat(30) + "#";
const FC = { format: "ordinate-survey-v1", title: "Fallen Crown", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "fp", name: "Corin", species: "Human", cls: "Paladin", subcls: "Oath of the Fallen Crown", level: 20, hp: "150", hpMax: "150", ac: "18", str: 18, dex: 10, con: 14, wis: 12, cha: 18,
      slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 2, used: 0 }], attacks: [{ name: "Longsword", hit: "+10", dmg: "1d8+4", dtype: "slashing" }] },
    { id: "fb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", saves: "Strength +6, Constitution +5, Wisdom +1", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["fp", "fb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }, { id: "srd:zombie", n: "1" }] },
      bmap: { name: "The Hall", rows: [fcWall, fcFloor, fcFloor, fcFloor, fcFloor, fcFloor, fcFloor, fcFloor, fcFloor, fcWall], start: { party: [[4, 4], [4, 6]], enemy: [[5, 4], [5, 5]] } } }] } } };
const fcHall = () => (doc.nodes || []).find(n => n.id === "hall");
const fcFight = () => fcHall().site.combat;
const fcWho = nm => combatants(fcFight()).find(t => t.label.startsWith(nm));
const fcTurn = async t => { const c = fcFight(); c.round++; c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const fcLast = () => ((fcFight().log || []).slice(-1)[0] || {}).text || "";
const fcAsk = answers => { const q = answers.slice(); window.prompt = () => q.length ? q.shift() : ""; window.confirm = () => q.length ? q.shift() : true; };
const fcWhat = async v => { const w = $("#ac-what"); w.value = v; w.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); };
const fcPick = re => actionChoices(fcWho("Corin")).flatMap(g => g.items).find(i => re.test(i.label));
step("Corin (Paladin 20, the Fallen Crown): uses, the oath spells, the Channel Divinity choices, the card", async () => {
  loadJSONNow(JSON.stringify(FC)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(fcHall()); await wait(150); beginBattle(fcHall().site); await wait(60);
  const P = fcWho("Corin"), p = pcState(P.p), uses = p.res.map(r => `${r.name} ${r.max}`).join(", ");
  const spells = actionChoices(P).find(g => /spells/.test(g.group)).items.map(i => i.label.replace(/ \(.*$/, "")).join(", ");
  const h = document.createElement("div"); h.innerHTML = palCardHtml(p); const card = [...h.querySelectorAll(".chip")].map(x => x.textContent).join(" | ");
  return `${uses} || ${spells} || Channel Divinity: ${cdChoices(p).map(x => x[1].replace(/:.*$/, "")).join(", ")} || card: ${card}`;
});
step("Kneel Before the Crown on both (saves rolled low): Prone and held; the Spectral Court gives Disadvantage; the hold ends after the creature's turn, the Prone stays", async () => {
  const c = fcFight(), P = fcWho("Corin"), F = fcWho("Cultist"), Z = fcWho("Zombie"), p = pcState(P.p); await fcTurn(P);
  p.court = { round: c.round }; act = freshAct(P.id); act.cdFx = "kneel"; const dis = saveModeT(c, F, "wis"); delete p.court;
  act = freshAct(P.id); renderBattlePanel(); await wait(20); act.cdFx = "kneel"; await fcWhat(fcPick(/^Channel Divinity/).v); act.targets = [F.id, Z.id]; renderBattlePanel(); await wait(20);
  const r = Math.random; Math.random = () => 0.01; try { for (const id of [F.id, Z.id]) { const b = document.querySelector(`[data-svroll="${id}"]`); if (b) b.click(); await wait(10); } } finally { Math.random = r; }
  fcAsk([]); $("#ac-go").click(); await wait(30); const kn = fcLast();
  const held = `${F.label} ${condsOfT(F).join(", ") || "none"}, held ${(c.effects || []).filter(e => e.kneel).length}`;
  await fcTurn(F); effectsTurnEnd(c, F.id); const after = `${condsOfT(F).join(", ") || "none"}, held ${(c.effects || []).filter(e => e.kneel && e.who === F.id).length}`;
  condsOfT(F).length = 0; condsOfT(Z).length = 0; c.effects = []; if (c.holds) c.holds = {};
  return `court: dis ${dis.dis} (${dis.why}) || ${kn} || ${held} || after its turn: ${after}`;
});
step("Wrath of the Fallen: Corin drops the Fanatic beside him: Wrath on, its chip on his next attack by itself; it lasts through his next turn", async () => {
  const c = fcFight(), P = fcWho("Corin"), F = fcWho("Cultist"), Z = fcWho("Zombie"); F.x.hp = 5; Z.x.hp = Z.x.max = 200; await fcTurn(P);
  act = freshAct(P.id); renderBattlePanel(); await wait(20); act.targets = [F.id]; await fcWhat("pca:0"); act.outcome = "hit"; act.dmg = "12"; renderBattlePanel(); await wait(20); fcAsk([]); $("#ac-go").click(); await wait(30);
  const drop = fcLast(), on1 = wrathOn(c, P);
  act = freshAct(P.id); renderBattlePanel(); await wait(20); act.targets = [Z.id]; await fcWhat("pca:0"); const auto = (act.addons || []).join(", "), chip = (attackAddons(P).find(a => a.key === "wrath") || {}).dice;
  effectsTurnEnd(c, P.id); const on2 = wrathOn(c, P); await fcTurn(P); effectsTurnEnd(c, P.id); const on3 = wrathOn(c, P);
  return `${drop} || on ${on1}, auto ${auto}, +${chip} || after this turn ${on2}, after his next ${on3}`;
});
step("Aura of Never Again: the Zombie drops Bram; Corin's Reaction keeps him at 1, Wrath starts, Vengeance of the Crown is said; a second time the same round, no Reaction left", async () => {
  const c = fcFight(), P = fcWho("Corin"), B = fcWho("Bram"), Z = fcWho("Zombie"), p = pcState(P.p), b = pcState(B.p); await fcTurn(Z);
  b.hp = 5; const na = p.res.find(r => r.name === "Aura of Never Again"), u0 = na.used, ds = []; fcAsk([true]);
  const down1 = damagePc(B.p, 20, false, ds); const first = `dropped ${down1}, hp ${b.hp}, uses spent ${na.used - u0}, reacted ${(c.reacted || {})[P.id] === c.round} || ${ds.join(" | ")}`;
  b.hp = 5; const ds2 = []; fcAsk([true]); const down2 = damagePc(B.p, 20, false, ds2);
  b.hp = 44; b.conds = []; b.death = { s: 0, f: 0 };
  return `${first} || again: dropped ${down2}, hp after ${ds2.join(" | ") || "nothing asked"}`;
});
step("Spectral Court (20): a Bonus Action; at the start of Corin's turn it calls on an ally's Reaction; the card's chips", async () => {
  const c = fcFight(), P = fcWho("Corin"), p = pcState(P.p); await fcTurn(P);
  act = freshAct(P.id); act.what = fcPick(/^Spectral Court/).v; renderBattlePanel(); await wait(20); fcAsk([]); $("#ac-go").click(); await wait(30); const sc = fcLast();
  await fcTurn(P); palTurnStart(c, P.id); const call = fcLast();
  const h = document.createElement("div"); h.innerHTML = palCardHtml(p); const card = [...h.querySelectorAll(".chip, button")].map(x => x.textContent).join(" | ");
  delete p.court; return `${sc} || ${call} || card: ${card} | page errors ${__KIT.errors.length}`;
});
