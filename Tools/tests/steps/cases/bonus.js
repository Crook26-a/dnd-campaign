// Bonus actions and disengaging (Joseph's autopilot list, item 7): a goblin skirmisher hits, Disengages (Nimble Escape) and
// falls back with no opportunity attack; a goblin archer beside the fighter Disengages first, steps back, shoots; a lurking
// goblin slips out of sight and Hides; an assassin out of reach Dashes (Cunning Action); a fleeing one Disengages for a way out.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#", inner = "#" + ".".repeat(9) + "#" + ".".repeat(20) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "3" }, { id: "srd:assassin", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, inner, inner, inner, inner, inner, inner, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const gob = k => all().filter(t => t.label.startsWith("Goblin"))[k];
const place = () => { const c = fight(), P = c.pos; c.stealth = {}; c.disengaged = {}; ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; });
  Object.assign(P, { [who("Gawain").id]: { x: 14, y: 4 }, [who("Wren").id]: { x: 16, y: 2 }, [who("Bram").id]: { x: 18, y: 6 }, [gob(0).id]: { x: 15, y: 4 }, [gob(1).id]: { x: 13, y: 4 }, [gob(2).id]: { x: 12, y: 8 }, [who("Assassin").id]: { x: 28, y: 1 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const run1 = async (t, v) => { $("#bt-pop").hidden = true; await turnOf(t); const r = await withRoll(v, () => autoTurn(fight(), t)); const pop = !$("#bt-pop").hidden; $("#bt-pop").hidden = true; return { r, pop }; };
const at2 = t => { const p = fight().pos[t.id]; return `(${p.x},${p.y})`; };
step("a goblin skirmisher beside Gawain: it hits, Disengages, and falls back; no opportunity attack is offered", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const g = gob(0); g.x.tac = { role: "skirm", aim: "nearest" }; const { r, pop } = await run1(g, 0.6);
  return `${r.said.slice(0, 300)} | at ${at2(g)}, in someone's reach: ${inSomeReach(fight(), g, fight().pos[g.id])} | opportunity attack offered: ${pop}`;
});
step("a goblin archer beside Gawain: Disengages first, steps back, then shoots; no opportunity attack", async () => {
  place(); const g = gob(1); g.x.tac = { role: "ranged", aim: "nearest" }; const { r, pop } = await run1(g, 0.6);
  return `${r.said.slice(0, 300)} | at ${at2(g)} | opportunity attack offered: ${pop}`;
});
step("a lurking goblin behind the wall's end: shoots, slips out of sight, and Hides (DC 15 Stealth)", async () => {
  place(); const g = gob(2); g.x.tac = { role: "lurker", aim: "nearest" }; const { r } = await run1(g, 0.9);
  return `${r.said.slice(0, 340)} | at ${at2(g)} | hidden: ${JSON.stringify((fight().stealth || {})[g.id] || null)}`;
});
step("the assassin, far off: Dashes with Cunning Action to get there", async () => {
  place(); const A = who("Assassin"); A.x.tac = { role: "front", aim: "nearest" }; const { r } = await run1(A, 0.6);
  return `${r.said.slice(0, 260)} | at ${at2(A)}`;
});
step("a cowardly goblin, a way out within its Speed: the Disengage action, no opportunity attack, and it's gone", async () => {
  place(); hall().bmap.exits = [{ x: 22, y: 4, to: "" }]; const g = gob(0); g.x.tac = { courage: 1 }; g.x.hp = 2; const { r, pop } = await run1(g, 0.6);
  return `${r.said.slice(0, 200)} | fled ${!!g.x.fled} | opportunity attack offered: ${pop} | page errors ${__KIT.errors.length}`;
});
