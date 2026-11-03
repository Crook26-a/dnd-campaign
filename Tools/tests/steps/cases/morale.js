// Group morale (Joseph's autopilot list, item 11): the bandit captain falls; at the start of each bandit's turn it checks
// its nerve (DC 10 Wisdom save), once for that; broken, its tactics say it would flee and the autopilot runs; with half
// the side down or gone, another check; Cowardly breaks without a roll, Fearless never checks, "Nobody flees" no check;
// undo takes a check back.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:bandit-captain", n: "1" }, { id: "srd:bandit", n: "3" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const gob = k => all().filter(t => t.label.startsWith("Goblin"))[k];
const bnd = k => all().filter(t => t.kind === "foe" && t.x.foe === "srd:bandit")[k], cap = () => all().find(t => t.kind === "foe" && t.x.foe === "srd:bandit-captain");
const start = async (id, v) => { const c = fight(); c.turn = id; return withRoll(v, () => { moraleTurnStart(c, id); renderBattle(); renderBattlePanel(); return (c.moraleNow && c.moraleNow.id === id && c.moraleNow.at === turnStamp(c)) ? c.moraleNow.said : "no check"; }); };
step("the captain is the leader; he falls; bandit 1 checks its nerve (d20 5): it breaks, its tactics would flee", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now";
  const c = fight(); if (!bnd(2)) return `only: ${all().map(o => o.label).join(", ")}`; [0, 1, 2].forEach(k => { bnd(k).x.tac = { role: "front", aim: "nearest", courage: 3 }; }); const lead = moraleLeader(all().filter(o => o.kind === "foe"));
  cap().x.hp = 0; const said = await start(bnd(0).id, 0.2);
  return `leader ${lead && lead.label} | ${said} | tactics: ${tacSuggest(c, bnd(0)).flee}`;
});
step("bandit 2 rolls 13: it holds; next turn, no second check for the same thing", async () => {
  const a = await start(bnd(1).id, 0.6), c = fight(); c.round = (c.round || 1) + 1; const b = await start(bnd(1).id, 0.6);
  return `${a} | again: ${b} | would flee: "${tacSuggest(c, bnd(1)).flee}"`;
});
step("bandit 1 flees (the autopilot runs for the way out); half the side is gone: bandit 2 checks again", async () => {
  const c = fight(); hall().bmap.exits = [{ x: 30, y: 4, to: "" }]; c.pos[bnd(0).id] = { x: 26, y: 4 }; c.pos[who("Gawain").id] = { x: 2, y: 1 }; c.pos[who("Wren").id] = { x: 3, y: 1 }; c.pos[who("Bram").id] = { x: 4, y: 1 }; renderBattle();
  c.turn = bnd(0).id; ["moved", "acted"].forEach(k => { if (c[k]) delete c[k][bnd(0).id]; }); c.autoLast = null; const r = await withRoll(0.6, () => autoTurn(c, bnd(0))); $("#bt-pop").hidden = true;
  c.round += 1; const said = await start(bnd(1).id, 0.2);
  return `${r.said.slice(0, 120)} | fled ${!!bnd(0).x.fled} | ${said}`;
});
step("undo takes bandit 2's check back", async () => { const c = fight(); undoAction(c); return `broken now: ${JSON.stringify(c.morale.broken)}`; });
step("Cowardly breaks without a roll; Fearless never checks; a room with Nobody flees doesn't check", async () => {
  const c = fight(); c.round += 1; bnd(2).x.tac = { role: "front", aim: "nearest", courage: 1 }; const a = await start(bnd(2).id, 0.9);
  delete c.morale.broken[bnd(2).id]; delete c.morale.rolled[bnd(2).id]; bnd(2).x.tac.courage = 5; c.round += 1; const b = await start(bnd(2).id, 0.1);
  bnd(2).x.tac.courage = 3; hall().site.noFlee = true; c.round += 1; const d = await start(bnd(2).id, 0.1); delete hall().site.noFlee;
  return `${a} | Fearless: ${b} | Nobody flees: ${d} | page errors ${__KIT.errors.length}`;
});