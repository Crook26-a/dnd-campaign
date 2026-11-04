// what stays on attacks by itself (Joseph, 2026-11-04: Divine Favor and the lit Flame Tongue had to be ticked every
// time): Divine Favor, once cast, is on each weapon attack for its minute, the bonus-action one too; unticked, it's off
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Favor", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Thomas", cls: "Paladin", level: 5, hp: "47", hpMax: "47", ac: "18", cha: 16, dc: "13", spells: ["spell:divine-favor", "spell:bless"],
    attacks: [{ name: "Longsword", hit: "+6", dmg: "1d8+3", dtype: "slashing" }], notes: "Great Weapon Master",
    slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 2, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }] },
    { id: "pb", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:ogre", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [2, 6]], enemy: [[3, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().filter(t => t.label.startsWith(nm))[0];
const pick = v => { const s = document.querySelector("#ac-what"); const o = ([...s.options].find(x => (x.value + " " + x.textContent).toLowerCase().includes(v.toLowerCase())) || {}).value; s.value = o; s.dispatchEvent(new Event("change", { bubbles: true })); return o; };
const on = () => (act.addons || []).join(", ") || "nothing";
step("Thomas casts Divine Favor; his Longsword then has it on by itself, and his second attack too", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60);
  expect(who("Thomas") && who("Ogre"), "both in the fight", all().map(t => t.label).join(", ")); const T = who("Thomas"), O = who("Ogre"); fight().turn = T.id; act = freshAct(T.id); renderBattlePanel();
  pick("divine-favor"); logAction(hall(), fight()); act = freshAct(T.id); renderBattlePanel();
  const w = pick("longsword"); const first = on(); act.targets = [O.id]; act.outcome = "hit"; act.dmg = "9"; logAction(hall(), fight()); const second = `${act.queue ? act.queue.word : "no queue"}: ${on()}`;
  return `attack ${w}: on it ${first} | the next one (${second})`;
});
step("a round later it's still on; the bonus-action attack (Great Weapon Master) has it too; unticked, it's off", () => {
  const T = who("Thomas"), c = fight(); newRound(c); act = freshAct(T.id); renderBattlePanel(); pick("longsword"); const later = on();
  c.gwm = { id: T.id, what: act.what, at: turnStamp(c), why: "a test" }; delete c.bonused; renderBattlePanel(); const g = document.querySelector("[data-gwm]"); if (g) g.click(); const bonus = g ? `bonus ${act.bonus}: ${on()}` : "no Great Weapon Master offer";
  act = freshAct(T.id); renderBattlePanel(); pick("longsword"); document.querySelector('[data-addon="spell:spell:divine-favor"]').click(); const off = on();
  act = freshAct(T.id); renderBattlePanel(); pick("longsword"); const after = on();
  return `round ${c.round}: ${later} | ${bonus} | unticked: ${off}; the next attack: ${after} | page errors ${__KIT.errors.length}`;
});
step("after its minute (ten rounds) it's off", () => {
  const T = who("Thomas"), c = fight(); (c.lit = c.lit || {})[T.id] = { "spell:spell:divine-favor": c.round }; for (let i = 0; i < 10; i++) newRound(c);
  act = freshAct(T.id); renderBattlePanel(); pick("longsword");
  return `round ${c.round}: ${on()}`;
});
