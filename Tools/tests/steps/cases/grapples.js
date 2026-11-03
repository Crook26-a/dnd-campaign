// Grapples that stick (Joseph's arena list, item 3): the Bugbear Warrior's Grab hits Wren: Grappled, held by the bugbear
// (escape DC 12); the Crocodile's Bite on Gawain: Grappled and Restrained while it lasts; a Large Gawain is too big for it;
// on Wren's turn, Escape (Athletics or Acrobatics vs 12) frees Wren, undo puts it back; the bugbear moving drags Wren along
// at double cost; dragged out of its reach by hand, or the bugbear down, the grapple ends; on its turn it keeps hitting Wren.
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
      foes: [{ id: "srd:bugbear-warrior", n: "1" }, { id: "srd:crocodile", n: "1" }] },
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
const bug = () => who("Bugbear"), croc = () => who("Crocodile"), last = () => ((fight().log || []).slice(-1)[0] || {}).text || "", cw = nm => JSON.stringify(condsOfT(who(nm)));
const hit = async (by, what, tgName, v) => { window.confirm = () => true; const c = fight(); c.turn = by.id; act = freshAct(by.id); battleSel = by.id; renderBattle(); renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); s.value = what; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [who(tgName).id]; renderBattlePanel(); await wait(20);
  await withRoll(v, async () => { $('[data-acroll="hit"]').click(); renderBattlePanel(); await wait(10); const d = document.querySelector('[data-acroll="dmg"]'); if (d) d.click(); $("#ac-go").click(); }); await wait(20); return last().slice(0, 230); };
step("the Bugbear's Grab hits Wren: Grappled, held by it, escape DC 12", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now"; root.autoEnemies = false;
  const c = fight(); all().forEach((t, k) => { c.init[t.id] = 20 - k; }); ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.conds = []; });
  Object.assign(c.pos, { [who("Gawain").id]: { x: 20, y: 4 }, [who("Wren").id]: { x: 10, y: 4 }, [who("Bram").id]: { x: 4, y: 8 }, [bug().id]: { x: 11, y: 4 }, [croc().id]: { x: 21, y: 4 } }); renderBattle();
  const said = await hit(bug(), "fa:Grab", "Wren", 0.6); return `${said} | Wren ${cw("Wren")} | grips ${JSON.stringify(c.grips || {}).replace(/"[a-z0-9]{6,}"/g, "id")}`;
});
step("the Crocodile bites Gawain: Grappled and Restrained; a Large Gawain would be too big", async () => {
  const c = fight(), a = await hit(croc(), "fa:Bite", "Gawain", 0.6), w = cw("Gawain"); undoAction(c);
  who("Gawain").p.size = "Large"; const b = await hit(croc(), "fa:Bite", "Gawain", 0.6); const w2 = cw("Gawain"); undoAction(c); delete who("Gawain").p.size;
  return `${a} | Gawain ${w} || Large: ${b} | ${w2}`;
});
step("on Wren's turn: the Action box offers Escape; a high roll frees Wren; undo puts it back", async () => {
  const c = fight(), W = who("Wren"); c.turn = W.id; act = freshAct(W.id); battleSel = W.id; renderBattlePanel(); await wait(20);
  const row = (document.querySelector("[data-gripesc]") || {}).parentElement; const shown = row ? row.innerText.replace(/\s+/g, " ").trim() : "no row";
  await withRoll(0.95, async () => { document.querySelector("[data-gripesc]").click(); }); await wait(20); const freed = `${last()} | ${cw("Wren")}`; undoAction(c);
  return `${shown} || ${freed} || after undo: ${cw("Wren")}, held ${!!(c.grips || {})[W.id]}`;
});
step("the bugbear moves two squares: Wren comes along, and it costs 20 ft; on its turn it keeps hitting Wren", async () => {
  const c = fight(), B = bug(), W = who("Wren"); c.turn = B.id; ["moved"].forEach(k => { if (c[k]) delete c[k][B.id]; }); const from = { ...c.pos[B.id] };
  c.pos[B.id] = { x: 13, y: 4 }; moveTrack(c, B.id, from); gripDrag(c, B.id, from); gripSweep(c); const after = `bugbear (13,4), Wren (${c.pos[W.id].x},${c.pos[W.id].y}), moved ${movedOf(c, B.id).ft} ft, still held ${!!(c.grips || {})[W.id]}`;
  B.x.tac = { role: "front", aim: "strongest" }; c.autoLast = null; ["moved", "acted"].forEach(k => { if (c[k]) delete c[k][B.id]; }); const r = await withRoll(0.6, () => autoTurn(c, B)); $("#bt-pop").hidden = true;
  return `${after} || its turn: ${r.said.slice(0, 120)}`;
});
step("dragged out of its reach by hand, the grapple ends; held again and the bugbear drops: it ends", async () => {
  const c = fight(), B = bug(), W = who("Wren"); const p = c.pos[W.id]; c.pos[W.id] = { x: 3, y: 2 }; const a = gripSweep(c).join(" ") || "nothing"; const wa = cw("Wren");
  c.pos[W.id] = { x: c.pos[B.id].x - 1, y: c.pos[B.id].y }; await hit(B, "fa:Grab", "Wren", 0.6); B.x.hp = 0; const b = gripSweep(c).join(" ") || "nothing";
  return `${a} | Wren ${wa} || ${b} | Wren ${cw("Wren")} | page errors ${__KIT.errors.length}`;
});