// Joseph's 2026-11-03 list: Healing Word upcasts (2d4 more a slot level above 1st); tokens say whose number it is (GW1,
// B1, BC); a dead enemy leaves the map till the fight's over; cover from a creature only where a line runs through it, and
// none from the dead; a hidden attacker has Advantage (Sneak Attack applies) and its attack gives it away (undo hides it
// again); a hidden one walking into plain view of the other side is found, behind a pillar it isn't.
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
      foes: [{ id: "srd:goblin-warrior", n: "3" }, { id: "srd:bandit", n: "1" }, { id: "srd:bandit-captain", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const gob = k => all().filter(t => t.label.startsWith("Goblin"))[k];
const place = () => { const c = fight(), P = c.pos; c.stealth = {}; c.disengaged = {}; c.holds = {}; ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; });
  [0, 1, 2].forEach(k => { const x = gob(k).x; x.conds = []; x.hp = x.max; x.fled = false; x.tac = { role: "front", aim: "nearest" }; });
  Object.assign(P, { [who("Gawain").id]: { x: 14, y: 4 }, [who("Wren").id]: { x: 10, y: 1 }, [who("Bram").id]: { x: 4, y: 8 }, [gob(0).id]: { x: 15, y: 4 }, [gob(1).id]: { x: 20, y: 6 }, [gob(2).id]: { x: 26, y: 8 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const run1 = async (t, v) => { $("#bt-pop").hidden = true; await turnOf(t); const r = await withRoll(v, () => autoTurn(fight(), t)); const pop = !$("#bt-pop").hidden; $("#bt-pop").hidden = true; return { r, pop }; };
const toks = () => [...document.querySelectorAll("#bsvg [data-tok]")].map(e => e.dataset.tok);
step("Healing Word: 2d4 at 1st level, 4d4 from a 2nd-level slot, 6d4 from a 3rd", async () => {
  const s = SPELL_BY.get("spell:healing-word"); return [1, 2, 3].map(l => `${l}: ${scaledSpell(s, l, 5).heal}`).join(" | ");
});
step("token names: the letters and the number", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  return all().filter(o => o.kind === "foe").map(o => `${o.label}: ${tokenText(o)}`).join(", ");
});
step("a dead goblin leaves the map during the fight, and is back once it's over", async () => {
  const c = fight(), g = gob(2); g.x.hp = 0; c.round = 1; c.turn = who("Gawain").id; c.calm = false; renderBattle(); const during = toks().includes(g.id);
  c.calm = true; renderBattle(); const after = toks().includes(g.id); c.calm = false; g.x.hp = g.x.max; renderBattle();
  return `on the map during the fight: ${during} | after: ${after}`;
});
step("cover: Wren beside the line (it only grazes her square) gives none; standing in it, half; the dead give none", async () => {
  const c = fight(), G = who("Gawain"), W = who("Wren"), g = gob(0); place(); c.pos[G.id] = { x: 4, y: 4 }; c.pos[g.id] = { x: 10, y: 4 };
  c.pos[W.id] = { x: 7, y: 3 }; renderBattle(); const graze = coverOf(c, G.id, g.id).word || "none";
  c.pos[W.id] = { x: 7, y: 4 }; renderBattle(); const inLine = coverOf(c, G.id, g.id).word || "none";
  const b = gob(1); c.pos[W.id] = { x: 1, y: 8 }; c.pos[b.id] = { x: 7, y: 4 }; b.x.hp = 0; renderBattle(); const dead = coverOf(c, G.id, g.id).word || "none"; b.x.hp = b.x.max;
  return `beside the line: ${graze} | in it: ${inLine} | a dead goblin in it: ${dead}`;
});
step("Bram hidden (Stealth 18) behind the pillar attacks the goblin: Advantage (hidden), and he's no longer hidden; undo hides him again", async () => {
  const c = fight(), B = who("Bram"), g = gob(0); place(); hall().bmap.rows[4] = hall().bmap.rows[4].slice(0, 12) + "O" + hall().bmap.rows[4].slice(13);
  c.pos[B.id] = { x: 13, y: 4 }; c.pos[g.id] = { x: 14, y: 4 }; c.pos[who("Gawain").id] = { x: 2, y: 1 }; c.pos[who("Wren").id] = { x: 3, y: 1 };
  [0, 1, 2].forEach(k => { if (k) c.pos[gob(k).id] = { x: 28, y: 1 + k }; }); c.pos[all().find(o => /Bandit$/.test(o.label) || o.label === "Bandit").id] = { x: 28, y: 6 }; c.pos[all().find(o => /Captain/.test(o.label)).id] = { x: 28, y: 7 };
  c.stealth = { [B.id]: { hide: 18 } }; c.turn = B.id; act = freshAct(B.id); battleSel = B.id; renderBattle(); renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); s.value = "pca:0"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [g.id]; renderBattlePanel(); await wait(20);
  await withRoll(0.5, () => { $('[data-acroll="hit"]').click(); }); const roll = act.toHit ? act.toHit.said : "not rolled";
  $("#ac-go").click(); await wait(30); const logged = (c.log.slice(-1)[0] || {}).text || ""; const after = JSON.stringify(c.stealth[B.id] || {});
  undoAction(c); const back = JSON.stringify(c.stealth[B.id] || {}); hall().bmap.rows[4] = hall().bmap.rows[4].slice(0, 12) + "." + hall().bmap.rows[4].slice(13); renderBattle();
  return `${roll} | logged: ...${logged.slice(-40)} | stealth after: ${after} | after undo: ${back}`;
});
step("hidden Bram walks out where a goblin can see him: found; hidden behind a wall end it can't see past: still hidden", async () => {
  const c = fight(), B = who("Bram"), g = gob(0); place(); c.pos[g.id] = { x: 20, y: 4 }; c.pos[B.id] = { x: 2, y: 8 }; c.stealth = { [B.id]: { hide: 18 } }; c.turn = B.id; renderBattle();
  const from = { ...c.pos[B.id] }; c.pos[B.id] = { x: 10, y: 4 }; moveTrack(c, B.id, from); const seen = hideSweep(c).join("; ") || "nobody";
  const was = stealthOf(c, B).hidden ?? "no"; hall().bmap.rows[3] = hall().bmap.rows[3].slice(0, 12) + "###" + hall().bmap.rows[3].slice(15); hall().bmap.rows[4] = hall().bmap.rows[4].slice(0, 12) + "###" + hall().bmap.rows[4].slice(15); hall().bmap.rows[5] = hall().bmap.rows[5].slice(0, 12) + "###" + hall().bmap.rows[5].slice(15);
  c.pos[B.id] = { x: 11, y: 4 }; [0, 1, 2].forEach(k => { c.pos[gob(k).id] = { x: 20, y: 3 + k }; }); c.stealth = { [B.id]: { hide: 18 } }; renderBattle(); const behind = hideSweep(c).join("; ") || "nobody";
  return `in the open: ${seen} (hidden now: ${was}) | behind a wall: ${behind} (hidden now: ${stealthOf(c, B).hidden ?? "no"}) | page errors ${__KIT.errors.length}`;
});