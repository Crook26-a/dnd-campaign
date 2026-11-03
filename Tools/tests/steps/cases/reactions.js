// The enemies' own reactions (Joseph's autopilot list, item 4), with "Enemies run their own turns" on: Parry and Shield
// when they turn a hit into a miss (not a natural 20; once a round; a use spent); opportunity attacks taken without asking.
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
      foes: [{ id: "srd:bandit-captain", n: "1" }, { id: "srd:mage", n: "1" }, { id: "srd:goblin-warrior", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = () => { const P = fight().pos; Object.assign(P, { [who("Gawain").id]: { x: 5, y: 4 }, [who("Wren").id]: { x: 12, y: 2 }, [who("Bram").id]: { x: 20, y: 6 },
  [who("Bandit").id]: { x: 6, y: 4 }, [who("Mage").id]: { x: 16, y: 2 }, [who("Goblin").id]: { x: 21, y: 6 } }); renderBattle(); };
const swing = (a, b, what, v) => withRoll(v, () => { const c = fight(); c.turn = who(a).id; act = freshAct(who(a).id); act.what = what; act.targets = [who(b).id]; renderBattlePanel();
  document.querySelector('[data-acroll="hit"]').click(); return act.toHit ? act.toHit.said : "not rolled"; });
step("Gawain's greatsword would just hit the Bandit Captain: it parries (+2), and it's a miss; a second hit that round lands", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now"; root.autoEnemies = true;
  const ac = acOf(who("Bandit")), first = await swing("Gawain", "Bandit", "pca:0", (ac - 8 - 1 + .5) / 20), second = await swing("Gawain", "Bandit", "pca:0", (ac - 8 - 1 + .5) / 20);
  return `AC ${ac} | ${first} || again: ${second}`;
});
step("with the setting off, no Parry (the DM's call)", async () => {
  const c = fight(); if (c.reacted) delete c.reacted[who("Bandit").id]; root.autoEnemies = false; const ac = acOf(who("Bandit"));
  const s = await swing("Gawain", "Bandit", "pca:0", (ac - 8 - 1 + .5) / 20); root.autoEnemies = true; return s;
});
step("the Mage: Shield turns Wren's hit into a miss (+5 until its next turn, a use of Protective Magic); a natural 20 still hits", async () => {
  const M = who("Mage"), ac = acOf(M); const a = await swing("Wren", "Mage", "pca:0", (ac - 4 - 1 + .5) / 20);
  const now = acOf(M); if (fight().reacted) delete fight().reacted[M.id]; const b = await swing("Wren", "Mage", "pca:0", 0.99);
  return `AC ${ac} | ${a} | AC now ${now}, uses ${JSON.stringify(M.x.used)} || a 20: ${b}`;
});
step("Bram steps away from the goblin on his turn: it takes its opportunity attack by itself, and his turn carries on", async () => {
  const c = fight(), B = who("Bram"), G = who("Goblin"); c.turn = B.id; act = freshAct(B.id); act.what = "pca:0"; const n0 = c.log.length;
  const from = { ...c.pos[B.id] }; c.pos[B.id] = { x: 18, y: 6 }; await withRoll(0.6, async () => { askOpportunity(B.id, from); await wait(200); });
  return `logged: ${c.log.slice(n0).map(e => e.text.slice(0, 110)).join(" / ")} | asked: ${!$("#bt-pop").hidden} | back to ${(all().find(x => x.id === act.actor) || {}).label}, ${act.what}`;
});
step("undo takes the Mage's Shield back (its reaction and its use)", async () => {
  const c = fight(), M = who("Mage"); let i = c.log.length - 1; while (i >= 0 && !/Shield/.test(c.log[i].text)) i--; while (c.log.length > i) undoAction(c);
  return `reacted: ${!!(c.reacted && c.reacted[M.id] != null)} | uses ${JSON.stringify(M.x.used)} | page errors ${__KIT.errors.length}`;
});
