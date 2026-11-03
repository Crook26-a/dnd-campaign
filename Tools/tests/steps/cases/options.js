// More than attacking (Joseph's arena list, item 4): a goblin badly hurt drinks its Potion of Healing (a Bonus Action);
// one that can't reach anyone and is hurt takes the Dodge action (Gawain's roll on it: Disadvantage); one at full strength
// Readies its scimitar and swings when Gawain walks into reach; with two of its side beside Wren, a goblin shoves Wren
// Prone; one with nothing to attack with Helps (the next goblin's roll on Wren: Advantage); a cowardly goblin running
// east through the open door shuts it behind it.
const wall = "#".repeat(32), floor = "#" + ".".repeat(15) + "#" + ".".repeat(14) + "#", door = "#" + ".".repeat(15) + "D" + ".".repeat(14) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "3" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, door, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6]] } } }] } } };
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
const last = () => ((fight().log || []).slice(-1)[0] || {}).text || "";
const fresh = () => { const c = fight(); place(); hall().site.doorsShut = {}; c.readied = {}; c.dodging = {}; c.helped = {}; [0, 1, 2].forEach(k => { const x = gob(k).x; x.dropped = {}; x.inv = null; foeBelongings(x); }); renderBattle(); };
const roll = async (byNm, tg, v) => { window.confirm = () => true; const c = fight(), B = who(byNm); c.turn = B.id; act = freshAct(B.id); battleSel = B.id; renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); s.value = [...s.options].find(o => /^(pca|fa):/.test(o.value)).value; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [tg.id]; renderBattlePanel(); await wait(20);
  await withRoll(v, () => { $('[data-acroll="hit"]').click(); }); return act.toHit ? act.toHit.said : "not rolled"; };
step("a goblin at 2 HP with a Potion of Healing drinks it as a Bonus Action", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now"; root.autoEnemies = false; fresh();
  const g = gob(0); g.x.inv.push({ id: "srd:potion-of-healing", qty: 1 }); g.x.hp = 2; g.x.tac = { role: "front", aim: "nearest", courage: 5 }; const { r } = await run1(g, 0.6);
  return `${r.said.slice(0, 200)} | HP ${g.x.hp}/${g.x.max} | potion left: ${(g.x.inv || []).some(e => /potion/.test(e.id))}`;
});
step("hurt and out of reach: the Dodge action; Gawain's roll on it has Disadvantage", async () => {
  fresh(); const c = fight(), g = gob(1); g.x.hp = 4; g.x.tac = { role: "front", aim: "nearest", courage: 5 }; g.x.dropped = { shortbow: "x" }; Object.assign(c.pos, { [g.id]: { x: 3, y: 1 }, [who("Gawain").id]: { x: 14, y: 8 }, [who("Wren").id]: { x: 14, y: 7 }, [who("Bram").id]: { x: 13, y: 8 } }); renderBattle();
  const { r } = await run1(g, 0.6); c.pos[who("Gawain").id] = { x: 4, y: 1 }; renderBattle(); const rl = await roll("Gawain", g, 0.5);
  return `${r.said.slice(-120)} || ${rl}`;
});
step("at full strength and out of reach: it Readies its scimitar; Gawain walks into reach: it swings", async () => {
  fresh(); const c = fight(), g = gob(2); g.x.tac = { role: "front", aim: "nearest", courage: 5 }; g.x.dropped = { shortbow: "x" }; Object.assign(c.pos, { [g.id]: { x: 3, y: 1 }, [who("Gawain").id]: { x: 14, y: 8 }, [who("Wren").id]: { x: 14, y: 7 }, [who("Bram").id]: { x: 13, y: 8 } }); renderBattle();
  const { r } = await run1(g, 0.6); const G = who("Gawain"); c.turn = G.id; const from = { ...c.pos[G.id] }, gp = c.pos[g.id]; c.pos[G.id] = { x: gp.x + 1, y: gp.y }; const n0 = c.log.length; await withRoll(0.6, () => readyCheck(c, G.id, from)); $("#bt-pop").hidden = true;
  return `${r.said.slice(-110)} || ${c.log.slice(n0).map(e => e.text.slice(0, 120)).join(" / ") || "nothing"}`;
});
step("two goblins already beside Wren: the third shoves Wren Prone", async () => {
  fresh(); const c = fight(), W = who("Wren"); Object.assign(c.pos, { [W.id]: { x: 8, y: 4 }, [gob(0).id]: { x: 9, y: 4 }, [gob(1).id]: { x: 7, y: 4 }, [gob(2).id]: { x: 8, y: 3 }, [who("Gawain").id]: { x: 2, y: 8 }, [who("Bram").id]: { x: 3, y: 8 } }); renderBattle();
  const g = gob(0); g.x.tac = { role: "front", aim: "weakest", courage: 5 }; const { r } = await withRoll(0.05, () => run1(g, 0.05)); return `${r.said.slice(0, 200)} | Wren ${JSON.stringify(condsOfT(W))}`;
});
step("a goblin with nothing to attack with Helps; the next goblin's roll on Wren has Advantage", async () => {
  fresh(); const c = fight(), W = who("Wren"); Object.assign(c.pos, { [W.id]: { x: 8, y: 4 }, [gob(0).id]: { x: 9, y: 4 }, [gob(1).id]: { x: 7, y: 4 }, [gob(2).id]: { x: 20, y: 8 } }); W.p.conds = []; renderBattle();
  const h = gob(1); h.x.dropped = { scimitar: "x", shortbow: "y" }; h.x.tac = { role: "front", aim: "nearest", courage: 5 }; const { r } = await run1(h, 0.6);
  const rl = await roll("Goblin Warrior 1", W, 0.5); return `${r.said.slice(-110)} || ${rl}`;
});
step("a cowardly goblin runs east through the open door and shuts it behind it", async () => {
  fresh(); const c = fight(), g = gob(0); hall().bmap.exits = [{ x: 30, y: 4, to: "" }]; g.x.tac = { courage: 1 }; g.x.hp = 2; Object.assign(c.pos, { [g.id]: { x: 14, y: 4 }, [who("Gawain").id]: { x: 12, y: 4 } }); renderBattle();
  const { r } = await run1(g, 0.6); return `${r.said.slice(0, 200)} | at ${JSON.stringify(c.pos[g.id])} | door shut: ${!!(hall().site.doorsShut || {})["16,4"]} | page errors ${__KIT.errors.length}`;
});