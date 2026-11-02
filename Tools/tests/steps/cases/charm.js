// Charm Person (Joseph, 2026-11-02, after a test fight): the save with Advantage while they're fighting it; Charmed put on
// from the spell's words and kept while it lasts; a charmed enemy never goes for its charmer (the tactics, the autopilot,
// and the Action box asks), but still fights the rest; the charmer's side damaging it ends it, Charmed and all.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", int: 16, dc: "13", spells: ["spell:charm-person"], slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 2, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }], attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "1" }, { id: "srd:gargoyle", n: "1" }, { id: "srd:scout", n: "1" }, { id: "srd:winter-wolf", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = () => { const P = fight().pos; Object.assign(P, { [who("Gawain").id]: { x: 2, y: 4 }, [who("Wren").id]: { x: 4, y: 4 }, [who("Bram").id]: { x: 5, y: 4 },
  [who("Goblin").id]: { x: 12, y: 4 }, [who("Gargoyle").id]: { x: 9, y: 2 }, [who("Scout").id]: { x: 20, y: 6 }, [who("Winter").id]: { x: 25, y: 7 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; if (c.moved) delete c.moved[t.id]; if (c.acted) delete c.acted[t.id]; c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(30); };
const run = async () => { const b = document.querySelector("[data-autorun]"); expect(b, "Run their turn is offered"); b.click(); await wait(40); return fight().autoLast; };

const scout = () => who("Scout"), wren = () => who("Wren");
const held = () => { const H = (fight().holds || {})[scout().id]; return H ? `${H.name}, ${CTRL_SAY[H.tier]}, condition ${H.cond || "none"}, lasts ${H.once ? "one turn" : "while it's on"}` : "no hold"; };
step("Wren casts Charm Person on the scout: the save has Advantage (they're fighting it); a fail puts Charmed on", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const c = fight(), W = wren(), S = scout(); c.turn = W.id; act = freshAct(W.id); renderBattlePanel(); await wait(30);
  const sel = document.querySelector("#ac-what"); sel.value = "sp:spell:charm-person"; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  act.targets = [S.id]; renderBattlePanel(); await wait(20);
  const row = (document.querySelector(".saverow") || {}).innerText || "no save row";
  await withRoll(0.05, () => { document.querySelector(`[data-svroll="${S.id}"]`).click(); }); await wait(20);
  document.querySelector("#ac-go").click(); await wait(30);
  return `save row: ${row.replace(/\s+/g, " ").slice(0, 150)} | logged: ${c.log.slice(-1)[0].text.replace(/^.*?—/, "—")} | ${S.label}: conditions ${JSON.stringify(S.x.conds)} | hold: ${held()}`;
});
step("its turn: the tactics and the autopilot pass over Wren (its charmer) and go for someone else", async () => {
  place(); const c = fight(), S = scout(), W = wren(); S.x.tac = { aim: "weakest", role: "ranged" }; fight().pos[S.id] = { x: 6, y: 4 }; renderBattle();
  c.turn = S.id; holdsTurnStart(c, S.id); delete c.autoLast; if (c.acted) delete c.acted[S.id]; act = freshAct(S.id); renderBattlePanel(); await wait(20);
  const sug = tacSuggest(c, S); const r = await withRoll(0.6, () => autoTurn(c, S));
  return `suggestion: ${sug.toLabel} (${sug.why}) | turn: ${r.said.slice(0, 220)} | went for Wren: ${/on Wren/.test(r.said)} | hold: ${held()}`;
});
step("attacking Wren by hand asks first (no, here), and nothing is logged", async () => {
  const c = fight(), S = scout(), W = wren(), n0 = c.log.length; if (c.acted) delete c.acted[S.id];
  act = freshAct(S.id); act.what = "fa:Longbow"; act.targets = [W.id]; act.outcome = "hit"; act.dmg = "5"; logAction(hall(), c);
  return `logged: ${c.log.length - n0} | Wren HP ${W.p.hp}`;
});
step("Bram (Wren's side) hits it: the charm ends, and Charmed comes off", async () => {
  const c = fight(), S = scout(), B = who("Bram"); act = freshAct(B.id); act.what = "pca:0"; act.targets = [S.id]; act.outcome = "hit"; act.dmg = "4"; logAction(hall(), c);
  return `logged: ${c.log.slice(-1)[0].text.replace(/^.*?—/, "—")} | conditions ${JSON.stringify(S.x.conds)} | hold: ${held()} | page errors ${__KIT.errors.length}`;
});
