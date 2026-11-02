// Areas of effect on the battle map (Joseph, 2026-11-01; aiming: follow the pointer). The shape from the spell's or
// ability's words; a point within range (a ring), on its user, or out from them; the caught go in the targets.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Areas", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 9, hp: "40", hpMax: "40", ac: "12", int: 18, dc: "15",
      spells: ["spell:fireball", "spell:burning-hands", "spell:lightning-bolt", "spell:thunderwave", "spell:web", "spell:cone-of-cold"],
      slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 1, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "4" }, { id: "srd:young-red-dragon", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [3, 4]], enemy: [[10, 2], [11, 2], [12, 2], [13, 2], [20, 5]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().filter(t => t.label.startsWith(nm));
const names = ids => ids.map(id => (all().find(t => t.id === id) || {}).label || id).join(", ") || "nobody";
const sq = (x, y) => ({ x: (x + .5) * BS, y: (y + .5) * BS });
const place = () => { const P = fight().pos; const [g1, g2, g3, g4] = who("Goblin"); Object.assign(P, { [who("Gawain")[0].id]: { x: 2, y: 4 }, [who("Wren")[0].id]: { x: 3, y: 4 },
  [g1.id]: { x: 10, y: 3 }, [g2.id]: { x: 11, y: 4 }, [g3.id]: { x: 12, y: 5 }, [g4.id]: { x: 6, y: 4 }, [who("Young Red")[0].id]: { x: 20, y: 5 } }); renderBattle(); };
const choose = async (actor, what) => { act = freshAct(actor.id); renderBattlePanel(); await wait(30);
  const s = document.querySelector("#ac-what"); expect(s && [...s.options].some(o => o.value === what), "the Action box offers " + what, s && [...s.options].map(o => o.value).join(" ")); s.value = what; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(30); };
const row = () => { const r = document.querySelector(".aoerow"); return r ? r.textContent.replace(/\s+/g, " ").trim() : "no row"; };
const drawn = () => { const g = document.querySelector("#bsvg #aoe-g"); return g ? `${g.querySelectorAll("circle[stroke-dasharray]").length ? "a range ring, " : ""}${(p => p ? `${(p.getAttribute("d").match(/M/g) || []).length} squares lit` : "no shape yet")(g.querySelector("path[fill-opacity]"))}` : "nothing drawn"; };
// the pointer, as the person moves it: a map point to the screen and back (bpoint's own sums, turned round)
const at = p => { const r = $("#bsvg").getBoundingClientRect(), b = bview, s = Math.max(b.w / r.width, b.h / r.height), ox = (r.width - b.w / s) / 2, oy = (r.height - b.h / s) / 2; return { clientX: r.left + ox + (p.x - b.x) / s, clientY: r.top + oy + (p.y - b.y) / s }; };
const ptr = (type, p) => $("#bsvg").dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, buttons: type === "pointerup" ? 0 : 1, ...at(p) }));

step("the shapes, read from the words", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place();
  const sp = n => ({ kind: "spell", spell: allSpells().find(s => s.name === n) });
  const L = ["Fireball", "Burning Hands", "Lightning Bolt", "Thunderwave", "Web", "Cone of Cold", "Spirit Guardians", "Sleet Storm", "Ice Storm", "Fog Cloud", "Magic Missile"].map(n => `${n}: ${(a => a ? aoeWords(a) : "no area")(aoeOf(sp(n)))}`);
  const d = who("Young Red")[0], br = foeEntries(foeById(d.x.foe)).find(([n]) => /Breath/.test(n));
  L.push(`${d.label}'s ${br[0]}: ${aoeWords(aoeOf({ text: br[1] }))}`);
  return L.join(" | ");
});
step("Fireball, aimed with the pointer: the ring, the shape following, and a tap placing it", async () => {
  place(); const W = who("Wren")[0]; await choose(W, "sp:spell:fireball");
  const before = `${row()} | ${drawn()}`;
  ptr("pointermove", sq(11, 4)); await wait(20); const moving = drawn();
  ptr("pointerdown", sq(11, 4)); ptr("pointerup", sq(11, 4)); await wait(40);
  return `chosen: ${before} | moving over (11,4): ${moving} | placed: ${names(act.targets)} | ${row()} | ${drawn()}`;
});
step("Burning Hands: a 15-foot cone out from her, toward the goblin beside the fighter", async () => {
  place(); const P = fight().pos, W = who("Wren")[0]; P[W.id] = { x: 4, y: 4 }; renderBattle(); await choose(W, "sp:spell:burning-hands");
  aoeMove(sq(9, 4)); aoePlace(); await wait(30);
  return `${names(act.targets)} | ${drawn()}`;
});
step("Lightning Bolt: a 100-foot line, 5 feet wide, along row 4", async () => {
  place(); const W = who("Wren")[0]; await choose(W, "sp:spell:lightning-bolt"); aoeMove(sq(25, 4)); aoePlace(); await wait(30);
  return `${names(act.targets)} | ${drawn()}`;
});
step("Thunderwave: a 15-foot cube beside her, turned toward the pointer", async () => {
  place(); const P = fight().pos, W = who("Wren")[0]; P[W.id] = { x: 9, y: 4 }; renderBattle(); await choose(W, "sp:spell:thunderwave");
  aoeMove(sq(12, 4)); aoePlace(); await wait(30); const east = names(act.targets);
  await choose(W, "sp:spell:thunderwave"); aoeMove(sq(6, 4)); aoePlace(); await wait(30);
  return `toward the east: ${east} | toward the west: ${names(act.targets)}`;
});
step("Web, 60 feet: a point 75 feet off is out of range and isn't placed", async () => {
  place(); const W = who("Wren")[0]; await choose(W, "sp:spell:web"); aoeMove(sq(18, 4)); aoePlace(); await wait(30);
  const far = `${aoeAim && aoeAim.on ? "still aiming" : "placed"}, targets ${names(act.targets)}`;
  aoeMove(sq(11, 4)); aoePlace(); await wait(30);
  return `75 ft: ${far} | 40 ft: ${names(act.targets)}`;
});
step("the dragon's breath from 25 feet off: a 30-foot cone at the party, its own goblin too; Escape stops aiming; never on the players' screen", async () => {
  place(); const d = who("Young Red")[0]; fight().pos[d.id] = { x: 8, y: 4 }; renderBattle(); const br = foeEntries(foeById(d.x.foe)).find(([n]) => /Breath/.test(n))[0];
  await choose(d, "fa:" + br); aoeMove(sq(3, 4)); aoePlace(); await wait(30); const hit = names(act.targets);
  await choose(d, "fa:" + br); document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); await wait(20);
  const tv = renderBattle(true);
  return `breath at the party: ${hit} | after Escape: ${aoeAim ? "aiming" : "stopped"}, ${drawn()} | players' screen has it: ${/aoe-g/.test(tv || "")} | page errors ${__KIT.errors.length}`;
});
