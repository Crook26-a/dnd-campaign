// Dropping and picking up (Joseph, 2026-11-03): on its turn a goblin's Action box lists what it holds (Scimitar, Shortbow)
// with Drop and what's on the ground by it with Pick up; dropped, the scimitar lies at its feet and can't be swung (undo puts
// it back); Command's Drop drops the weapon in its hand; next turn the autopilot picks it up and fights; Gawain drops his
// greatsword and Bram, beside it, picks it up.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }], inv: [{ id: "srd:greatsword", qty: 1 }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "3" }] },
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
const chips = () => [...document.querySelectorAll("[data-itemdrop],[data-itempick]")].map(b => b.textContent.trim()).join(", ");
const ground = () => { const st = hall().site; return [...new Set(st.items || [])].map(t => `${itemName(t)} at ${(st.where || {})[t] || "?"}`).join(", ") || "nothing"; };
step("the goblin's turn: Holding Scimitar and Shortbow; Drop the scimitar: at its feet, and it can't swing it", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const g = gob(0); await turnOf(g); const before = chips();
  document.querySelector("[data-itemdrop]").click(); await wait(20); const after = chips();
  const s = $("#ac-what"); s.value = "fa:Scimitar"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [who("Gawain").id]; renderBattlePanel(); await wait(20);
  document.querySelector('[data-acroll="hit"]').click(); await wait(20);
  return `before: ${before} | after: ${after} | ground: ${ground()} | dropped: ${JSON.stringify(g.x.dropped)} | swung: ${!!act.toHit}`;
});
step("undo: the scimitar is back in its hand", async () => { const c = fight(); undoAction(c); renderBattlePanel(); await wait(20); return `ground: ${ground()} | dropped: ${JSON.stringify(gob(0).x.dropped)} | chips: ${chips()}`; });
step("Command: Drop: the weapon in its hand (it last shot its bow): the Shortbow drops", async () => {
  const c = fight(), g = gob(0); g.x.wield = "shortbow"; c.turn = g.id; c.heldNow = { id: g.id, tier: "order", name: "Command", by: who("Wren").id, at: turnStamp(c) };
  await autoCommand(c, g, "Drop"); clearTimeout(autoTimer); c.turn = g.id; return `${c.autoLast && c.autoLast.said} | ground: ${ground()}`;
});
step("next turn the autopilot picks the bow up on its way, then fights", async () => {
  const c = fight(), g = gob(0); c.heldNow = null; c.pos[g.id] = { x: 11, y: 4 }; renderBattle(); const { r } = await run1(g, 0.6);
  return `${r.said.slice(0, 220)} | ground: ${ground()} | dropped: ${JSON.stringify(g.x.dropped || {})}`;
});
step("Gawain drops his greatsword; Bram beside it picks it up on his turn", async () => {
  const c = fight(), G = who("Gawain"), B = who("Bram"); place(); c.pos[B.id] = { x: 13, y: 4 }; renderBattle(); await turnOf(G);
  const g0 = chips(); document.querySelector("[data-itemdrop]").click(); await wait(20); await turnOf(B); const b0 = chips();
  document.querySelector("[data-itempick]").click(); await wait(20);
  return `Gawain: ${g0} | Bram sees: ${b0} | ground now: ${ground()} | Bram has: ${(pcState(B.p).inv || []).map(e => itemName(e.id)).join(", ")} | Gawain has: ${(pcState(G.p).inv || []).map(e => itemName(e.id)).join(", ") || "nothing"} | page errors ${__KIT.errors.length}`;
});