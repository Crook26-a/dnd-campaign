// Two table rules (Joseph, 2026-11-06), both on unless unticked: the players roll their own checks and saves (the app asks
// for a player character's d20 instead of rolling it), and a character can spend their action on a second Bonus Action.
const trWall = "#".repeat(32), trFloor = "#" + ".".repeat(30) + "#";
const TR = { format: "ordinate-survey-v1", title: "Table rules", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Thomas", cls: "Paladin", level: 5, hp: "47", hpMax: "47", ac: "18", attacks: [{ name: "Longsword", hit: "+6", dmg: "1d8+3" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", dex: 14, attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }],
      spells: ["spell:burning-hands"], slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [trWall, trFloor, trFloor, trFloor, trFloor, trFloor, trFloor, trFloor, trFloor, trWall], start: { party: [[2, 4], [4, 4]], enemy: [[20, 4]] } } }] } } };
const trHall = () => (doc.nodes || []).find(n => n.id === "hall");
const trFight = () => trHall().site.combat;
const trWho = nm => combatants(trFight()).find(t => t.label.startsWith(nm));
const trTurn = async t => { const c = trFight(); c.turn = t.id; ["moved", "acted", "bonused"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const trLast = () => ((trFight().log || []).slice(-1)[0] || {}).text || "";
let trAsked = [];
const trAsk = answers => { trAsked = []; const q = answers.slice(); window.prompt = m => { trAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { trAsked.push(m); return q.length ? q.shift() : true; }; };
step("both rules are on by default; a PC's d20 is asked for (7 typed, then blank rolls it), an enemy's isn't", async () => {
  loadJSONNow(JSON.stringify(TR)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(trHall()); await wait(150); beginBattle(trHall().site); await wait(60);
  trAsk(["7", ""]); const a = pcD20(trWho("Wren"), "a Dexterity save against DC 13"), b = pcD20(trWho("Wren"), "a Dexterity save against DC 13"), n = trAsked.length, f = pcD20(trWho("Cultist"), "a save");
  return `players roll ${playersRoll()}, second BA ${baForAction()} | typed ${a.d}${a.w} | blank: rolled by the app ${!b.typed} | asked ${n} times, then ${trAsked.length} after the enemy's | "${trAsked[0]}"`;
});
step("the Action box: Thomas's save against Wren's Burning Hands asks for his d20 (12 typed)", async () => {
  const W = trWho("Wren"), T = trWho("Thomas"); await trTurn(W);
  act.what = "sp:spell:burning-hands"; act.lvl = 1; act.targets = [T.id]; renderBattlePanel(); await wait(20);
  trAsk(["12"]); document.querySelector(`[data-svroll="${T.id}"]`).click(); await wait(20);
  return `${(act.saves || {})[T.id] ? act.saves[T.id].said : "no save"} | asked: ${trAsked.join(" / ")}`;
});
step("Thomas: a Bonus Action, then a second one takes his action (asked first); a third asks again (no: nothing logged)", async () => {
  const c = trFight(), T = trWho("Thomas"), F = trWho("Cultist"); await trTurn(T);
  const one = () => { act = freshAct(T.id); act.what = "pca:0"; act.targets = [F.id]; act.outcome = "miss"; act.bonus = true; renderBattlePanel(); };
  trAsk([]); one(); await wait(20); $("#ac-go").click(); await wait(30); const first = `${trLast()} | asked ${trAsked.length}`;
  trAsk([true]); one(); await wait(20); $("#ac-go").click(); await wait(30); const second = `${trLast()} | asked: ${trAsked.join(" / ")} | actions left ${actionsLeft(c, T.id)}`;
  trAsk([false]); one(); await wait(20); const n0 = c.log.length; $("#ac-go").click(); await wait(30);
  return `${first} || ${second} || third asked: ${trAsked.join(" / ")}, logged ${c.log.length !== n0}`;
});
step("both rules off: no d20 asked, and the second Bonus Action asks the plain way; page errors", async () => {
  root.playersRoll = false; root.baForAction = false; const c = trFight(), T = trWho("Thomas"), F = trWho("Cultist");
  trAsk([]); const a = pcD20(T, "a save"); const asked1 = trAsked.length; await trTurn(T);
  const one = () => { act = freshAct(T.id); act.what = "pca:0"; act.targets = [F.id]; act.outcome = "miss"; act.bonus = true; renderBattlePanel(); };
  one(); await wait(20); $("#ac-go").click(); await wait(30); trAsk([true]); one(); await wait(20); $("#ac-go").click(); await wait(30);
  root.playersRoll = true; root.baForAction = true; window.confirm = () => true; window.prompt = (q, d) => d ?? "";
  return `asked for a d20 ${asked1} times (rolled ${a.d >= 1 && a.d <= 20}) | second: ${trAsked.join(" / ")} | actions left ${actionsLeft(c, T.id)} | page errors ${__KIT.errors.length}`;
});
