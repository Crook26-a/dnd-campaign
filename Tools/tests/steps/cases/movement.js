// Moving on the map (Joseph's autopilot list, item 9): a strip of mud is difficult terrain (10 ft a square), for the
// autopilot and for a drag; a harpy flies over it at its Fly Speed; an ogre is Large (2×2) and reaches from its edge; a
// goblin opens a shut door on its way (Undo shuts it again); a wolf (a Beast) can't; a locked door stops anyone.
const wall = "#".repeat(32), row = d => "#" + ".".repeat(9) + "a" + ".".repeat(9) + d + ".".repeat(10) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "1" }, { id: "srd:harpy", n: "1" }, { id: "srd:ogre", n: "1" }, { id: "srd:wolf", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, row("#"), row("#"), row("#"), row("D"), row("#"), row("#"), row("#"), row("#"), wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const OFF = { x: 1, y: 8 };
const place = (at) => { const c = fight(), P = c.pos, st = hall().site; st.doorsShut = { "20,4": true }; st.locks = {}; c.stealth = {}; c.disengaged = {};
  ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; });
  ["Goblin", "Harpy", "Ogre", "Wolf"].forEach((n, k) => { const x = who(n).x; x.conds = []; x.hp = x.max; x.tac = { role: "front", aim: "nearest" }; P[who(n).id] = { x: 1 + k, y: 1 }; });
  Object.assign(P, { [who("Wren").id]: { x: 29, y: 8 }, [who("Bram").id]: { x: 30, y: 8 } }, at); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const run1 = async (t, v) => { $("#bt-pop").hidden = true; await turnOf(t); const r = await withRoll(v, () => autoTurn(fight(), t)); $("#bt-pop").hidden = true; return r; };
const at2 = t => { const p = fight().pos[t.id]; return `(${p.x},${p.y})`; };
const moved = t => movedOf(fight(), t.id).ft;
step("the goblin crosses the strip of mud to reach Gawain: 25 ft, not 20", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now";
  place({ [who("Gawain").id]: { x: 13, y: 4 } }); const g = who("Goblin"); fight().pos[g.id] = { x: 8, y: 4 }; renderBattle();
  const r = await run1(g, 0.6); return `${r.said.slice(0, 160)} | at ${at2(g)} | moved ${moved(g)} ft`;
});
step("the harpy flies over it at its Fly Speed (40 ft): 20 ft", async () => {
  place({ [who("Gawain").id]: { x: 13, y: 4 } }); const h = who("Harpy"); fight().pos[h.id] = { x: 8, y: 4 }; renderBattle();
  const r = await run1(h, 0.6); return `speed ${speedOf(h)} | ${r.said.slice(0, 120)} | at ${at2(h)} | moved ${moved(h)} ft`;
});
step("the ogre is Large: 2×2 on the map, it stops with its edge beside Gawain and swings", async () => {
  place({ [who("Gawain").id]: { x: 6, y: 4 } }); const o = who("Ogre"); fight().pos[o.id] = { x: 1, y: 3 }; renderBattle();
  const tok = document.querySelector(`[data-tok="${o.id}"]`), tf = tok ? tok.getAttribute("transform") : "no token";
  const r = await run1(o, 0.6); const p = fight().pos[o.id];
  return `token ${tf} | ${r.said.slice(0, 200)} | at ${at2(o)} (n ${p.n}), ${chebSq(p, fight().pos[who("Gawain").id])} squares from Gawain`;
});
step("a shut door: the goblin opens it on its way; Undo their turn shuts it again", async () => {
  place({ [who("Gawain").id]: { x: 24, y: 4 } }); const g = who("Goblin"); fight().pos[g.id] = { x: 17, y: 4 }; renderBattle();
  const r = await run1(g, 0.6); const open = !hall().site.doorsShut["20,4"], there = at2(g); const undone = autoUndo(fight());
  return `${r.said.slice(0, 160)} | at ${there} | door opened: ${open} | after undo: shut ${!!hall().site.doorsShut["20,4"]}, at ${at2(g)} (${undone})`;
});
step("the wolf (a Beast) can't open it; a locked door stops the goblin", async () => {
  place({ [who("Gawain").id]: { x: 24, y: 4 } }); const w = who("Wolf"), g = who("Goblin"); fight().pos[w.id] = { x: 17, y: 4 }; fight().pos[g.id] = { x: 17, y: 6 }; renderBattle();
  const a = await run1(w, 0.6); const wolf = `${a.said.slice(0, 120)} | at ${at2(w)}`;
  hall().site.locks = { "20,4": { dc: 15 } }; const b = await run1(g, 0.6);
  return `${wolf} || locked: ${b.said.slice(0, 160)} | at ${at2(g)} | shut ${!!hall().site.doorsShut["20,4"]}`;
});
step("Gawain dragged across the mud on his turn: 20 ft counted for 3 squares", async () => {
  place({ [who("Gawain").id]: { x: 8, y: 2 } }); const G = who("Gawain"), c = fight(); await turnOf(G);
  const from = { ...c.pos[G.id] }; c.pos[G.id] = { x: 11, y: 2 }; moveTrack(c, G.id, from);
  return `moved ${moved(G)} ft | page errors ${__KIT.errors.length}`;
});
