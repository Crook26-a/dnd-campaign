// Lingering areas (Joseph's arena list, item 2): Ilsa's Spirit Guardians (a 15-foot Emanation): a goblin dragged into it
// saves or takes 3d8 radiant (half on a save); one ending its turn in it too; Gawain beside her is unaffected. Web (a 20-foot
// Cube at a point): a goblin starting its turn in it saves or is Restrained (and can break free: Athletics vs her DC), its
// squares cost double. Spike Growth: dragged three squares through it, 2d4 piercing a square; the autopilot goes round it.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 4,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }, { id: "pd", name: "Ilsa", cls: "Cleric", level: 5, hp: "38", hpMax: "38", ac: "18", wis: 18, dc: "15", spells: ["spell:spirit-guardians", "spell:web", "spell:spike-growth"], slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 2, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }], attacks: [{ name: "Mace", hit: "+5", dmg: "1d6+2" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc", "pd"], at: { map: "h", node: "hall" } }],
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
const ilsa = () => who("Ilsa"), log1 = () => ((fight().log || []).slice(-1)[0] || {}).text || "";
const cast = async (sp, at) => { window.confirm = () => true; const c = fight(), I = ilsa(); c.turn = I.id; act = freshAct(I.id); battleSel = I.id; renderBattle(); renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); const o = [...s.options].find(o => o.value.includes(sp)); if (!o) return "no option " + sp; s.value = o.value; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  if (at && aoeAim) { aoeMove({ x: at.x * BS, y: at.y * BS }); aoePlace(); await wait(20); }
  for (const id of act.targets.slice()) { const b = document.querySelector(`[data-svroll="${id}"]`); if (b) await withRoll(0.9, () => { b.click(); }); }
  const d = document.querySelector('[data-acroll="dmg"]'); if (d) await withRoll(0.5, () => { d.click(); }); const aimAt = JSON.stringify(aoeAim && { placed: aoeAim.placed, Q: aoeAim.Q }); const n0 = (c.log || []).length, go = $("#ac-go"); if (!go) return `no Log it: what ${act.what}, targets ${act.targets}, aim ${JSON.stringify(aoeAim && { on: aoeAim.on, placed: aoeAim.placed })}`; go.click(); await wait(30); if ((c.log || []).length === n0) return `not logged: what ${act.what}, lvl ${act.lvl}, targets ${act.targets}`;
  return `${log1().slice(0, 110)} | zone: ${JSON.stringify(((c.ups || []).slice(-1)[0] || {}).zone ? Object.fromEntries(Object.entries(c.ups.slice(-1)[0].zone).filter(([k, v]) => ["shape", "size", "enter", "endT", "startT", "per5", "once", "cond", "choose", "diff"].includes(k) && v)) : null)}`; };
const dragTo = (t, to) => { const c = fight(), from = { ...c.pos[t.id] }; c.pos[t.id] = to; renderBattle(); const mover = t, bn = bnode(); const way = moveGrid(c, mover, bn, from, 60).seen.get(`${to.x},${to.y}`); for (let q = way; q && q.prev; q = q.prev) zonesStep(c, mover, q); return zonesMoved(c).join(" ") || "nothing"; };
step("Spirit Guardians on Ilsa: Gawain beside her is fine; a goblin dragged in saves or takes radiant; ending its turn there, again", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now"; root.autoEnemies = false;
  const c = fight(); all().forEach((t, k) => { c.init[t.id] = 20 - k; }); Object.assign(c.pos, { [ilsa().id]: { x: 6, y: 4 }, [who("Gawain").id]: { x: 7, y: 4 }, [gob(0).id]: { x: 14, y: 4 }, [gob(1).id]: { x: 20, y: 6 }, [gob(2).id]: { x: 26, y: 8 } }); renderBattle();
  const said = await cast("spirit-guardians"); const g = gob(0); g.x.max = 60; g.x.hp = 60;
  const enter = await withRoll(0.2, () => dragTo(g, { x: 9, y: 4 })); c.turn = g.id; const end = await withRoll(0.2, async () => { nextTurn(c); clearTimeout(autoTimer); return log1(); });
  return `${said} || dragged in: ${enter} || its turn ends: ${end} | Gawain HP ${who("Gawain").p.hp}`;
});
step("Web on the goblins' side: one starting its turn in it saves or is Restrained; it can break free; its squares cost double", async () => {
  const c = fight(); (c.ups || []).forEach(u => upEnd(c, u, "test")); const I = ilsa(); delete pcState(I.p).conc; Object.assign(c.pos, { [gob(1).id]: { x: 16, y: 6 }, [gob(0).id]: { x: 10, y: 2 } }); renderBattle();
  const said = await cast("web", { x: 16, y: 6 }); const g = gob(1); g.x.conds = []; delete (c.holds || {})[g.id];
  c.turn = who("Wren").id; const order = combatants(c); const before = order[order.findIndex(x => x.id === g.id) - 1]; c.turn = before.id;
  const U = (c.ups || []).find(u => u.zone && u.zone.cond), dbg = `turn before ${before && before.label}, in it ${U ? zoneHas(c, U, g) : "no zone"}, hurts ${U ? zoneHurts(c, U, g) : "-"}, owner pos ${U ? !!c.pos[U.owner] : "-"}`;
  const start = await withRoll(0.05, async () => { nextTurn(c); clearTimeout(autoTimer); return c.zoneNow && c.zoneNow.id === g.id ? c.zoneNow.said : log1(); });
  const grip = gripOf(c, g); const cost = moveGrid(c, gob(0), bnode(), { x: 11, y: 6 }, 40).seen.get("14,6");
  return `${said} || ${start} | Restrained: ${condsOfT(g).includes("Restrained")} | break free: ${grip ? `Athletics vs DC ${grip.dc} (${grip.what})` : "none"} | 3 squares into it cost ${cost ? cost.cost * 5 : "?"} ft`;
});
step("Spike Growth: a goblin dragged three squares through it takes 2d4 piercing a square; the autopilot, with its bow down and Bram too far to reach either way, keeps out", async () => {
  const c = fight(); (c.ups || []).forEach(u => upEnd(c, u, "test")); delete pcState(ilsa().p).conc; const g = gob(2); g.x.conds = []; g.x.hp = g.x.max;
  Object.assign(c.pos, { [g.id]: { x: 26, y: 8 } }); renderBattle(); const said = await cast("spike-growth", { x: 22, y: 5 });
  const hp0 = g.x.hp, n0 = c.log.length; await withRoll(0.4, () => dragTo(g, { x: 23, y: 5 })); const lines = c.log.slice(n0).map(e => e.text.slice(0, 90));
  g.x.hp = g.x.max; c.pos[g.id] = { x: 28, y: 5 }; c.pos[who("Bram").id] = { x: 15, y: 5 }; g.x.dropped = { shortbow: "x" }; g.x.tac = { role: "front", aim: "nearest" }; renderBattle(); c.turn = g.id; ["moved", "acted"].forEach(k => { if (c[k]) delete c[k][g.id]; }); c.autoLast = null;
  const n1 = c.log.length; const r = await withRoll(0.6, () => autoTurn(c, g)); const hurt = c.log.slice(n1).filter(e => /Spike Growth/.test(e.text)).length;
  return `${said} || dragged: ${lines.length} lines, HP ${hp0} → ${g.x.max - 0} (first: ${lines[0] || "none"}) || autopilot: ${r.said.slice(0, 120)} | spike hits on its walk: ${hurt} | page errors ${__KIT.errors.length}`;
});