// Cover (Joseph, 2026-11-02): from the attacker's best corner, lines to the target's four corners; a wall, a shut door or a
// creature blocks a line; one or two blocked: half (+2 AC and Dex saves), three: three-quarters (+5), four: total (no roll).
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
      foes: [{ id: "srd:scout", n: "1" }, { id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, inner, inner, inner, inner, inner, inner, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = () => { const P = fight().pos, c = fight(); c.stealth = {}; ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; });
  Object.assign(P, { [who("Gawain").id]: { x: 3, y: 4 }, [who("Wren").id]: { x: 5, y: 2 }, [who("Bram").id]: { x: 6, y: 6 }, [who("Scout").id]: { x: 14, y: 3 }, [who("Cultist").id]: { x: 20, y: 7 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const at2 = t => { const p = fight().pos[t.id]; return `(${p.x},${p.y})`; };
const lineTo = (a, b) => { const P = fight().pos, n = hall(); return losClear(bmapOf(n), n.site || {}, P[a.id].x, P[a.id].y, P[b.id].x, P[b.id].y); };
const cov = (a, b, o) => { const r = coverOf(fight(), who(a).id, who(b).id, o); return r.word || "none"; };
const put = m => { const P = fight().pos; for (const [n, x, y] of m) P[who(n).id] = { x, y }; renderBattle(); };
step("open ground: none; Gawain standing in the line of fire: half", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  put([["Scout", 20, 8], ["Bram", 12, 8], ["Gawain", 2, 1], ["Wren", 3, 1]]); const open = cov("Scout", "Bram");
  put([["Gawain", 16, 8]]); const behind = cov("Scout", "Bram");
  return `open: ${open} | Gawain between: ${behind}`;
});
step("tucked beside the wall's end: the wall blocks some lines; behind the wall: total", async () => {
  put([["Gawain", 2, 1], ["Scout", 16, 8], ["Bram", 9, 6]]); const corner = cov("Scout", "Bram"); put([["Bram", 9, 5]]); const deeper = cov("Scout", "Bram");
  put([["Bram", 6, 3], ["Scout", 14, 2]]); const behind = cov("Scout", "Bram");
  return `beside the end: ${corner} | a square further in: ${deeper} | behind the wall: ${behind}`;
});
step("the roll: half cover shows in the button and adds to the AC; total cover isn't rolled", async () => {
  const c = fight(), S = who("Scout"), B = who("Bram"); put([["Scout", 20, 8], ["Bram", 12, 8], ["Gawain", 16, 8]]);
  c.turn = S.id; act = freshAct(S.id); act.what = "fa:Longbow"; act.targets = [B.id]; renderBattlePanel(); await wait(20);
  const btn = (document.querySelector('[data-acroll="hit"]') || {}).textContent || "no button";
  await withRoll(0.6, () => document.querySelector('[data-acroll="hit"]').click()); const said = act.toHit ? act.toHit.said : "not rolled";
  put([["Bram", 6, 3], ["Scout", 14, 2]]); act = freshAct(S.id); act.what = "fa:Longbow"; act.targets = [B.id]; renderBattlePanel(); await wait(20);
  document.querySelector('[data-acroll="hit"]').click(); const tot = act.toHit ? act.toHit.said : "not rolled";
  return `button: ${btn.trim()} | ${said} | behind the wall: ${tot}`;
});
step("a Fireball's Dexterity saves: cover from its center (a creature in between), not from the caster", async () => {
  const c = fight(); put([["Scout", 26, 2], ["Bram", 20, 8], ["Gawain", 21, 8], ["Wren", 24, 8]]);
  const fromCenter = coverOf(c, who("Scout").id, who("Wren").id, { x: 18, y: 8.5 });
  return `Wren from a point west of Bram and Gawain: ${fromCenter.word || "none"} | Bram, nearest the point: ${coverOf(c, who("Scout").id, who("Bram").id, { x: 18, y: 8.5 }).word || "none"} | page errors ${__KIT.errors.length}`;
});
