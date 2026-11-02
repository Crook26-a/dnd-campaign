// Enemies on their own turns (Joseph, 2026-11-02): each sizes up the party as its turn starts, until it has a read, in
// the read its dials name (a mindless one doesn't); and the tactics line follows the dials when they change (on a
// fight's card, and on a person rolled but not added yet), keeping anything written around it.
const TC = { format: "ordinate-survey-v1", title: "Enemy turns", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", str: 20, attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 3, hp: "20", hpMax: "20", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:animated-armor", n: "1" }, { id: "srd:gargoyle", n: "1" }, { id: "srd:specter", n: "1" }] },
      bmap: { name: "The Hall", rows: ["####################", "#..................#", "#..................#", "#..................#", "#..................#", "####################"], start: { party: [[2, 2], [3, 2]], enemy: [[6, 1], [7, 1], [8, 1]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const who = nm => combatants(fight()).find(t => t.label.startsWith(nm));
const withRoll = (v, f) => { const r = Math.random; Math.random = () => v; try { return f(); } finally { Math.random = r; } };
const reads = () => (fight().log || []).concat([]).length, gl = () => (root.gameLog || root.log || []);
const sizeLines = () => document.querySelectorAll(".sizeres").length;

step("a fight: the dials say who sizes up the party, and how", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60);
  return ["Animated Armor", "Gargoyle", "Specter"].map(n => { const t = who(n); return `${t.label}: ${tacOf(fight(), t).read}`; }).join(" · ");
});
step("round 1: each rolls as its turn starts (a d20 of 6: one believes a false read, one learns nothing)", async () => {
  const c = fight(); c.turn = null;
  const seen = withRoll(0.25, () => { const L = []; for (let i = 0; i < combatants(c).length; i++) { nextTurn(c); const t = combatants(c).find(x => x.id === c.turn); const h = t && t.x; L.push(`${t.label}: ${h && h.partyRead ? h.partyRead.split("\n")[0].replace(/^Day [^·]+· /, "") : "no roll"}`); } return L; });
  return seen.join(" | ") + ` | read done: ${JSON.stringify(Object.fromEntries(Object.entries(c.readDone || {}).map(([k, v]) => [combatants(c).find(x => x.id === k).label, v])))}`;
});
step("round 2: only the one who learned nothing rolls again (a 20 this time)", async () => {
  const c = fight(), before = Object.fromEntries(["Gargoyle", "Specter"].map(n => [n, (who(n).x.partyRead || "").split("\n\n").length]));
  withRoll(0.95, () => { for (let i = 0; i < combatants(c).length; i++) nextTurn(c); });
  const after = Object.fromEntries(["Gargoyle", "Specter"].map(n => [n, (who(n).x.partyRead || "").split("\n\n").length]));
  renderBattlePanel(); await wait(30);
  return `reads: before ${JSON.stringify(before)}, after ${JSON.stringify(after)} | specter's newest: ${who("Specter").x.partyRead.split("\n")[0].replace(/^Day [^·]+· /, "")}`;
});
step("a creature's courage changed on its card: its line follows, with what was written after it kept", async () => {
  const g = who("Gargoyle"), key = "x:" + g.x.id; g.x.tac = {}; g.x.tactics = tacWords(tacCur(g.x, key)) + " Guards the door.";
  const before = g.x.tactics, box = document.createElement("div"); box.innerHTML = tacEditor(g.x, key); document.body.appendChild(box);
  const s = box.querySelector('[data-tf="courage"]'); s.value = "1"; s.dispatchEvent(new Event("change", { bubbles: true })); box.remove(); await wait(20);
  return `before: ${before} | after: ${g.x.tactics}`;
});
step("written by hand: left alone, with a button to write it from the dials", async () => {
  const g = who("Gargoyle"), key = "x:" + g.x.id; g.x.tactics = "Bites the nearest wizard.";
  const box = document.createElement("div"); box.innerHTML = tacEditor(g.x, key); document.body.appendChild(box);
  const s = box.querySelector('[data-tf="aim"]'); s.value = "nearest"; s.dispatchEvent(new Event("change", { bubbles: true })); box.remove(); await wait(20);
  const kept = g.x.tactics, b2 = document.createElement("div"); b2.innerHTML = tacRewriteBtn(g.x, key); document.body.appendChild(b2);
  const btn = b2.querySelector("[data-tacrewrite]"); const had = !!btn; if (btn) btn.click(); b2.remove(); await wait(20);
  return `kept: ${kept} | button: ${had} | after it: ${g.x.tactics}`;
});
step("a person rolled, not added yet: the dials are on the page, and the line follows them", async () => {
  const x = { id: "ln_test", name: "Test Brute", cls: "Fighter", level: 3, statBlock: null, fightsAs: "srd:bandit" };
  x.tac = Object.assign(tacDefault(foeById("srd:bandit")), { role: "front", courage: 3, rigid: 2 }); x.tactics = tacWords(x.tac);
  libDraft = { cat: "npcs", x }; const before = x.tactics;
  const box = document.createElement("div"); box.innerHTML = libForm("npcs", x); document.body.appendChild(box);
  const dials = [...box.querySelectorAll('[data-tac="d:ln_test"]')].map(e => e.dataset.tf).join(", ");
  const s = box.querySelector('[data-tac="d:ln_test"][data-tf="courage"]'); s.value = "5"; s.dispatchEvent(new Event("change", { bubbles: true })); box.remove(); await wait(20);
  libDraft = null;
  return `dials: ${dials} | before: ${before} | after: ${x.tactics}`;
});
