// Opportunity attacks (Joseph, 2026-11-03: "both people should be able to take opportunity attacks"): when a mover
// leaves the reach of two, each is offered theirs: picking one keeps the pop-up for the other
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "OA", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Avery", cls: "Rogue", level: 5, hp: "30", hpMax: "30", ac: "14", attacks: [{ name: "Shortsword", hit: "+7", dmg: "1d6+4" }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [2, 5]], enemy: [[3, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().filter(t => t.label.startsWith(nm))[0];
const popText = () => { const p = $("#bt-pop"); return p.hidden ? "no pop-up" : p.textContent.replace(/\s+/g, " ").trim(); };
step("the goblin leaves Gawain's and Avery's reach: both are offered; one takes it, the other's still there", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60);
  const c = fight(), G = who("Gawain"), A = who("Avery"), g = who("Goblin");
  Object.assign(c.pos, { [G.id]: { x: 2, y: 4 }, [A.id]: { x: 2, y: 5 }, [g.id]: { x: 3, y: 4 } }); renderBattle();
  const from = { x: 3, y: 4 }; c.pos[g.id] = { x: 8, y: 4 }; askOpportunity(g.id, from); const first = popText();
  document.querySelector(`#bt-pop [data-oa="${G.id}"]`).click(); const box = `${(all().find(t => t.id === act.actor) || {}).label}, reaction ${act.reaction}`; const then = popText();
  return `${first} || picked Gawain: Action box ${box} || ${then} | page errors ${__KIT.errors.length}`;
});
step("Gawain's is logged; then Avery takes hers", () => {
  const A = who("Avery"); act.outcome = "miss"; logAction(hall(), fight()); const still = popText();
  document.querySelector(`#bt-pop [data-oa="${A.id}"]`).click();
  return `after Gawain's: ${still} || Avery's: ${(all().find(t => t.id === act.actor) || {}).label}, reaction ${act.reaction}; pop-up now: ${popText()}`;
});
