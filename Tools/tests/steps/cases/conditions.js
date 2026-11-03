// Conditions on its own turn (Joseph's autopilot list, item 8): Stunned, it does nothing; Prone, it stands up (half its
// Speed); Grappled by the fighter and wanting out, it breaks free (Athletics against 8 + Str + proficiency) and runs;
// Poisoned, Disadvantage; Frightened, it won't step closer and shoots at Disadvantage; Paralyzed target, Advantage and a crit
// within 5 ft; the goblin's "+1d4 if the attack roll had Advantage" only with Advantage; a Stunned one makes no opportunity attack.
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
const at2 = t => { const p = fight().pos[t.id]; return `(${p.x},${p.y})`; };
const toHitSaid = () => (fight().log || []).slice(-1)[0] ? fight().log.slice(-1)[0].text.slice(0, 260) : "nothing logged";
step("Stunned: it does nothing; walking away from it, no opportunity attack is offered", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const g = gob(0); g.x.conds = ["Stunned"]; const { r } = await run1(g, 0.6);
  const c = fight(), G = who("Gawain"); c.turn = G.id; const from = { ...c.pos[G.id] }; c.pos[G.id] = { x: 11, y: 4 }; $("#bt-pop").hidden = true; askOpportunity(G.id, from); const pop = !$("#bt-pop").hidden; $("#bt-pop").hidden = true;
  return `${r.said} | at ${at2(g)} | opportunity attack offered: ${pop}`;
});
step("Prone beside Gawain: it stands up (15 ft), then attacks as usual (no +1d4 without Advantage)", async () => {
  place(); const g = gob(0); g.x.conds = ["Prone"]; const { r } = await run1(g, 0.6);
  return `${r.said.slice(0, 320)} | conditions ${JSON.stringify(g.x.conds)}`;
});
step("Gawain swings at a Prone goblin beside him: Advantage; Wren's dagger from 15 ft off: Disadvantage", async () => {
  place(); const c = fight(), g = gob(0), G = who("Gawain"), W = who("Wren"); g.x.conds = ["Prone"]; c.pos[W.id] = { x: 12, y: 4 }; c.pos[G.id] = { x: 14, y: 3 }; renderBattle();
  const roll = async (t, v) => { c.turn = t.id; act = freshAct(t.id); battleSel = t.id; renderBattlePanel(); await wait(20); const s = $("#ac-what"); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
    act.targets = [g.id]; renderBattlePanel(); await wait(20); await withRoll(0.5, () => { $('[data-acroll="hit"]').click(); }); return act.toHit ? act.toHit.said : "not rolled"; };
  return `${await roll(G, "pca:0")} || ${await roll(W, "pca:0")}`;
});
step("Grappled by Gawain and wanting out: it breaks free (Athletics or Acrobatics vs DC 11) and runs for the way out", async () => {
  place(); hall().bmap.exits = [{ x: 22, y: 4, to: "" }]; const g = gob(0); g.x.conds = ["Grappled"]; g.x.tac = { courage: 1 }; g.x.hp = 2; const { r } = await run1(g, 0.9);
  return `${r.said.slice(0, 340)} | conditions ${JSON.stringify(g.x.conds)} | fled ${!!g.x.fled}`;
});
step("Poisoned: its attack has Disadvantage", async () => {
  place(); delete hall().bmap.exits; const g = gob(0); g.x.conds = ["Poisoned"]; const { r } = await run1(g, 0.6);
  return r.said.slice(0, 260);
});
step("Frightened of Gawain (Cause Fear), 20 ft off: it won't come closer; it shoots, at Disadvantage", async () => {
  place(); const c = fight(), g = gob(1), G = who("Gawain"); c.pos[g.id] = { x: 18, y: 4 }; g.x.conds = ["Frightened"]; c.holds[g.id] = { by: G.id, tier: "half", name: "Cause Fear", sp: null, cond: "Frightened", turns: 0, pts: 0 }; renderBattle();
  const { r } = await run1(g, 0.6); return `${r.said.slice(0, 300)} | at ${at2(g)}, ${chebSq(c.pos[g.id], c.pos[G.id])} squares from Gawain`;
});
step("Wren Paralyzed beside it: it goes for Wren (helpless), Advantage, the +1d4 rides, and the hit is a crit", async () => {
  place(); const c = fight(), g = gob(0), W = who("Wren"); c.pos[W.id] = { x: 16, y: 4 }; W.p.conds = ["Paralyzed"]; g.x.tac = { role: "front", aim: "weakest" }; renderBattle();
  const { r } = await run1(g, 0.6); return `${r.said.slice(0, 340)} | page errors ${__KIT.errors.length}`;
});
