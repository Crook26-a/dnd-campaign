// Characters at 0 hit points (Joseph's autopilot list, item 10; his call: "a dial, mostly no"): a goblin left as it is goes
// past Wren (down) for Gawain; set to finish them off first, it hits Wren: Advantage, a crit within 5 ft, two death save
// failures; a zombie (undead, Int 3) finishes off the fallen when nobody standing is in reach; massive damage kills outright;
// the dial in the tactics editor and its words.
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
      foes: [{ id: "srd:goblin-warrior", n: "3" }, { id: "srd:zombie", n: "1" }] },
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
const down = (nm, hpMax) => { const p = who(nm).p; p.hp = 0; if (hpMax) p.hpMax = String(hpMax); p.conds = ["Unconscious"]; p.death = { s: 0, f: 0 }; return who(nm); };
step("left as it is: the goblin passes Wren (down) and goes for Gawain", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const c = fight(), g = gob(0), W = down("Wren"); c.pos[g.id] = { x: 10, y: 4 }; c.pos[W.id] = { x: 11, y: 4 }; c.pos[who("Gawain").id] = { x: 14, y: 4 }; c.pos[who("Zombie").id] = { x: 28, y: 8 }; renderBattle();
  const { r } = await run1(g, 0.6); return `${r.said.slice(0, 200)} | Wren's death saves ${JSON.stringify(W.p.death)}`;
});
step("set to finish them off first: it hits Wren with Advantage, a crit, two death save failures", async () => {
  place(); const c = fight(), g = gob(0), W = down("Wren"); c.pos[g.id] = { x: 10, y: 4 }; c.pos[W.id] = { x: 11, y: 4 }; c.pos[who("Zombie").id] = { x: 28, y: 8 }; g.x.tac = { role: "front", aim: "nearest", fallen: "first" }; renderBattle();
  const s = tacSuggest(c, g); const { r } = await run1(g, 0.6); return `tactics: ${s.why} | ${r.said.slice(0, 330)} | Wren's death saves ${JSON.stringify(W.p.death)}`;
});
step("a zombie (its own default: when nobody standing is in reach) goes for Wren, with Gawain too far", async () => {
  place(); const c = fight(), Z = who("Zombie"), W = down("Wren"); c.pos[Z.id] = { x: 20, y: 4 }; c.pos[W.id] = { x: 21, y: 4 }; c.pos[who("Gawain").id] = { x: 2, y: 1 }; Z.x.tac = undefined; renderBattle();
  const s = tacSuggest(c, Z); const { r } = await run1(Z, 0.6); return `fallen dial ${tacOf(c, Z).fallen} | tactics: ${s.why} | ${r.said.slice(0, 200)} | Wren ${JSON.stringify(W.p.death)}`;
});
step("massive damage: Bram at 0 with 8 maximum hit points takes the crit: dead outright", async () => {
  place(); const c = fight(), g = gob(0), B = down("Bram", 8); c.pos[g.id] = { x: 10, y: 4 }; c.pos[B.id] = { x: 11, y: 4 }; c.pos[who("Zombie").id] = { x: 28, y: 8 }; g.x.tac = { role: "front", aim: "nearest", fallen: "first" }; renderBattle();
  const { r } = await run1(g, 0.6); return `${r.said.slice(0, 330)} | Bram ${JSON.stringify(B.p.death)}`;
});
step("the dial in the tactics editor, and its words", async () => {
  const g = gob(1), ed = tacEditor(g.x, "x:" + g.x.id), has = /data-tf="fallen"/.test(ed);
  return `editor has it: ${has} | words: ${tacWords({ role: "front", aim: "nearest", courage: 3, fallen: "last" })} | page errors ${__KIT.errors.length}`;
});
step("three failures: Wren dies: no turn, healing doesn't bring Wren back, the token says dead", async () => {
  place(); const c = fight(), W = down("Wren"); W.p.death = { s: 0, f: 3 }; c.pos[who("Zombie").id] = { x: 28, y: 8 }; renderBattle();
  const order = []; c.turn = who("Gawain").id; for (let k = 0; k < 8; k++) { nextTurn(c); order.push((all().find(x => x.id === c.turn) || {}).label); } clearTimeout(autoTimer);
  const healed = healAny(W, 10); const tok = document.querySelector(`[data-tok="${W.id}"]`); const word = tok ? tok.textContent.replace(/\s+/g, " ").trim() : "no token";
  return `turns: ${order.join(" → ")} | Wren in them: ${order.includes("Wren")} | healed ${healed}, hp ${W.p.hp} | token: ${word}`;
});
step("on Bram's turn at 0: the death save row; a 15 is a success, a 1 two failures, a 20 back up with 1 hit point", async () => {
  place(); const c = fight(), B = down("Bram"); c.turn = B.id; act = freshAct(B.id); battleSel = B.id; renderBattle(); renderBattlePanel(); await wait(20);
  const row = !!document.querySelector("[data-dsroll]"), roll = async v => { const i = $("#ac-ds"); i.value = String(v); document.querySelector("[data-dsroll]").click(); await wait(20); return `${JSON.stringify(B.p.death)} hp ${B.p.hp}`; };
  const a = await roll(15), b = await roll(1), d = await roll(20); const log = (c.log.slice(-1)[0] || {}).text;
  return `row: ${row} | 15: ${a} | 1: ${b} | 20: ${d} | ${log} | page errors ${__KIT.errors.length}`;
});
