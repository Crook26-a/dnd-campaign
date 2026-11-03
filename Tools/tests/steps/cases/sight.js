// Line of sight and hiding (Joseph's autopilot list, item 3): no attacking through a wall (it walks round for a line);
// the hidden aren't gone for; the Invisible are, with Disadvantage; with everyone hidden it Searches (Pass without Trace's
// totals beat it); "a creature you can see" spells aren't cast at someone it can't see.
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
step("the scout behind the wall: no line to anyone, so it walks round the end of the wall, then shoots", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const S = who("Scout"); S.x.tac = { role: "ranged", aim: "nearest" }; const before = ["Gawain", "Wren", "Bram"].map(n => `${n} ${lineTo(S, who(n))}`).join(", ");
  await turnOf(S); const r = await withRoll(0.6, () => autoTurn(fight(), S)); const tg = (r.said.match(/on (\w+) —/) || [])[1];
  return `lines from (14,3): ${before} | ${r.said.slice(0, 150)} | now at ${at2(S)}, a line to ${tg}: ${tg ? lineTo(S, who(tg)) : "?"}`;
});
step("Wren hidden (Stealth 18): it doesn't go for her; Bram Invisible: shot at with Disadvantage", async () => {
  place(); const c = fight(), S = who("Scout"); c.pos[S.id] = { x: 9, y: 8 }; S.x.tac = { role: "ranged", aim: "weakest" }; c.stealth[who("Wren").id] = { hide: 18 };
  who("Gawain").p.conds = ["Invisible"]; who("Bram").p.conds = ["Invisible"]; renderBattle(); await turnOf(S);
  const sug = tacSuggest(c, S); const r = await withRoll(0.6, () => autoTurn(c, S));
  return `suggests ${sug.toLabel} | ${r.said.slice(0, 200)} | Wren shot at: ${/on Wren/.test(r.said)} | Disadvantage: ${/Disadvantage/.test(r.said)}`;
});
step("everyone hidden: it Searches; a 20 finds them; with Pass without Trace's +10 a middling roll finds no one", async () => {
  place(); const c = fight(), S = who("Scout"); c.pos[S.id] = { x: 9, y: 8 }; renderBattle();
  ["Gawain", "Wren", "Bram"].forEach(n => { c.stealth[who(n).id] = { hide: 14 }; }); await turnOf(S); const a = await withRoll(0.97, () => autoTurn(c, S));
  const found = ["Gawain", "Wren", "Bram"].filter(n => !(c.stealth[who(n).id] || {}).hide && (c.stealth[who(n).id] || {}).hide !== 0).join(", ");
  ["Gawain", "Wren", "Bram"].forEach(n => { c.stealth[who(n).id] = { hide: 26 }; }); await turnOf(S); const b = await withRoll(0.5, () => autoTurn(c, S));
  return `${a.said.slice(0, 200)} | found: ${found} || with Pass without Trace: ${b.said.slice(0, 200)}`;
});
step("Hold Person needs a creature it can see: not at the Invisible fighter; at someone it can see instead", async () => {
  place(); const c = fight(), F = who("Cultist"); c.pos[F.id] = { x: 8, y: 7 }; who("Gawain").p.conds = ["Invisible"]; renderBattle(); await turnOf(F);
  const r = await withRoll(0.3, () => autoTurn(c, F));
  return `${r.said.slice(0, 180)} | at Gawain: ${/on Gawain/.test(r.said)} | page errors ${__KIT.errors.length}`;
});
