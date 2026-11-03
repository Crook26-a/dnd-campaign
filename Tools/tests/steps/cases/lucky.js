// Lucky (Joseph, 2026-11-03): the 2024 feat with a flat 3 Luck points ("Lucky" use), ticked in the Action box before
// the roll: Advantage on your own attack roll, Disadvantage on an attack roll against you; a halfling's 1 is rerolled
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Lucky", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", species: "Human", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }],
      res: [{ name: "Lucky", max: 3, used: 0, rest: "long" }] },
    { id: "pb", name: "Pip", species: "Halfling", cls: "Rogue", level: 5, hp: "30", hpMax: "30", ac: "14", attacks: [{ name: "Shortsword", hit: "+7", dmg: "1d6+4" }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [3, 4]], enemy: [[4, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().filter(t => t.label.startsWith(nm))[0];
const left = () => luckLeft(who("Gawain"));
// Math.random from a list, then normal
const withRolls = (vs, f) => { const r = Math.random; let i = 0; Math.random = () => i < vs.length ? vs[i++] : r(); try { return f(); } finally { Math.random = r; } };
const swing = (actor, target, what) => { act = freshAct(actor.id); act.targets = [target.id]; renderBattlePanel(); const o = [...document.querySelector("#ac-what").options].map(x => x.value); act.what = o.find(v => v.toLowerCase().includes(what.toLowerCase())) || o.find(v => /^fa:|^pa:|^at:/.test(v)) || o[1]; renderBattlePanel(); };
step("Gawain ticks a Luck point: Advantage on his attack, and a point spent", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60);
  const G = who("Gawain"), g = who("Goblin"); fight().pos[G.id] = { x: 3, y: 4 }; fight().pos[g.id] = { x: 4, y: 4 };
  swing(G, g, "Greatsword"); const box = !!document.querySelector("#ac-luckme");
  const cb = document.querySelector("#ac-luckme"); cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true }));
  withRolls([0.2, 0.8], () => document.querySelector('[data-acroll="hit"]').click());
  return `the box offers it ${box} | ${act.toHit.said} | Luck left ${left()}`;
});
step("the goblin attacks Gawain; he ticks a Luck point: Disadvantage on it", () => {
  const G = who("Gawain"), g = who("Goblin"); swing(g, G, "fa:");
  const cb = document.querySelector("#ac-luckvs"); expect(cb, "the Lucky box against the attack"); cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true }));
  withRolls([0.9, 0.1], () => document.querySelector('[data-acroll="hit"]').click());
  return `${act.toHit.said} | Luck left ${left()}`;
});
step("Pip the halfling rolls a 1: it's rerolled, and the new roll stands", () => {
  const P = who("Pip"), g = who("Goblin"); fight().pos[P.id] = { x: 5, y: 4 }; swing(P, g, "Shortsword");
  const none = !document.querySelector("#ac-luckme");
  withRolls([0.0, 0.5, 0.6], () => document.querySelector('[data-acroll="hit"]').click());
  return `no Luck box for Pip ${none} | ${act.toHit.said} | page errors ${__KIT.errors.length}`;
});
