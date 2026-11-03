// Blink (Joseph, 2026-11-03), the SRD 5.2 rule: cast from the Action box; at the end of the caster's turn a party
// member is reminded to roll its d6 (front of the turn strip: Roll it, or what the table rolled); 4-6 sends them to the
// Ethereal Plane until the start of their next turn; an enemy's roll is made for it
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Blink", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 9, hp: "40", hpMax: "40", ac: "12", int: 18, dc: "15", spells: ["spell:blink", "spell:fire-bolt"],
      slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 1, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [3, 4]], enemy: [[10, 2]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().filter(t => t.label.startsWith(nm))[0];
const strip = () => { const s = document.querySelector("#bt-strip .ts-blink"); return s ? s.textContent.replace(/\s+/g, " ").trim() : "no reminder"; };
const away = () => !!((fight().stealth || {})[who("Wren").id] || {}).ethereal;
const last = () => fight().log.slice(-1)[0].text;
const withRoll = (v, f) => { const r = Math.random; Math.random = () => v; try { return f(); } finally { Math.random = r; } };
const turnTo = id => { const c = fight(); let n = 0; while (c.turn !== id && n++ < 10) nextTurn(c); renderBattle(); };
step("Wren casts Blink from the Action box: it's on her", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60);
  const W = who("Wren"); turnTo(W.id); act = freshAct(W.id); renderBattlePanel(); await wait(30);
  const s = document.querySelector("#ac-what"); expect(s && [...s.options].some(o => o.value === "sp:spell:blink"), "the Action box offers Blink"); s.value = "sp:spell:blink"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(30);
  logAction(hall(), fight()); await wait(30);
  return `on Wren: ${(W.p.fx || []).map(f => `${f.name}, ${f.left} rounds: ${fxSay(f.b)}`).join("; ")} | reminder before her turn ends: ${strip()}`;
});
step("her turn ends: the reminder; Roll it with a 5 sends her to the Ethereal Plane", () => {
  nextTurn(fight()); renderBattle(); const ask = strip();
  withRoll(0.7, () => document.querySelector('#bt-strip [data-ts="blink"][data-v="roll"]').click());
  return `${ask} || ${last()} | ethereal ${away()} | reminder now: ${strip()}`;
});
step("the start of her next turn brings her back; the table's 1-3 keeps her here", () => {
  turnTo(who("Wren").id); const back = `${last()} | ethereal ${away()}`;
  nextTurn(fight()); renderBattle(); document.querySelector('#bt-strip [data-ts="blink"][data-v="stay"]').click();
  return `${back} || ${last()} | ethereal ${away()} | page errors ${__KIT.errors.length}`;
});
