// Mirror Image (Joseph, 2026-11-02), the SRD 5.2 rule: a hit by an attack roll rolls a d6 for each duplicate left; any 3
// or higher, a duplicate is hit instead and destroyed; the spell ends with the last; a Blinded attacker isn't fooled.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Areas", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 9, hp: "40", hpMax: "40", ac: "12", int: 18, dc: "15",
      spells: ["spell:fireball", "spell:burning-hands", "spell:lightning-bolt", "spell:thunderwave", "spell:web", "spell:cone-of-cold", "spell:mirror-image"],
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
const withRoll = (v, f) => { const r = Math.random; Math.random = () => v; try { return f(); } finally { Math.random = r; } };
const dupes = () => { const W = who("Wren")[0], f = (W.p.fx || []).find(x => x.sp === "spell:mirror-image"); return f ? f.b.mirror : "gone"; };
const swing = (v, outcome = "hit") => withRoll(v, () => { const g = who("Goblin")[0], W = who("Wren")[0]; delete fight().acted; act = freshAct(g.id); act.what = "fa:Scimitar"; act.targets = [W.id]; act.outcome = outcome; act.dmg = "5"; logAction(hall(), fight());
  return `"${fight().log.slice(-1)[0].text.replace(/^.*?—/, "—")}" | Wren HP ${W.p.hp}, duplicates ${dupes()}`; });
step("Wren casts Mirror Image: three duplicates on her", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place();
  const W = who("Wren")[0]; await choose(W, "sp:spell:mirror-image"); const tg = names(act.targets); logAction(hall(), fight()); await wait(30);
  return `targets: ${tg} | duplicates ${dupes()} | ${fxSay((W.p.fx || [])[0].b)}`;
});
step("a goblin's hit: d6s of 4 put it on a duplicate (no damage); d6s of 1 let the next one through", () => `${swing(0.5)} || ${swing(0.05)}`);
step("a miss doesn't touch them; a Blinded goblin isn't fooled", () => {
  const miss = swing(0.5, "miss"), g = who("Goblin")[0]; g.x.conds = ["Blinded"]; const blind = swing(0.5); g.x.conds = [];
  return `${miss} || ${blind}`;
});
step("the last two go, and the spell ends; undo puts the last one back", () => {
  const a = swing(0.5), b = swing(0.5); undoAction(fight()); return `${a} || ${b} || after undo: duplicates ${dupes()} | page errors ${__KIT.errors.length}`;
});
