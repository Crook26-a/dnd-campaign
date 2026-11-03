// The Proving Grounds (Joseph, 2026-11-02: "create a test fight I can do to test all this"): loads the real Test Arena.json
// (built by Test Arena\Tools\build-arena.ps1), opens each of the five Proving fights in the Proving Grounds, and runs each
// enemy's turn once on the autopilot, all at once: everyone's there, nothing errors, and each does something sensible.
const ARENA = "file:///C:/Users/josep/OneDrive/Documents/DnD/Test%20Arena/Test%20Arena.json";
const getText = url => { const x = new XMLHttpRequest(); x.open("GET", url, false); x.send(); return x.responseText; };
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const openFight = async id => {
  window.confirm = () => true; root.arenaIn = partyRoster().map(p => p.id); Object.assign(arenaPick, { from: "kproving", room: "pg_hall", fight: id });
  const b = document.createElement("button"); b.dataset.arena = "fresh"; document.body.appendChild(b); b.click(); b.remove(); await wait(150);
  const n = (doc.nodes || []).find(x => x.id === "pg_hall"); beginBattle(n.site); await wait(60); renderBattle(); return n.site.combat;
};
const runAll = async c => { const out = [];
  for (const t of combatants(c).filter(o => o.side === "enemy")) { c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id;
    $("#bt-pop").hidden = true; const r = await withRoll(0.55, () => autoTurn(c, t)); $("#bt-pop").hidden = true; out.push(`${t.label} [${tacOf(c, t).role}]: ${r ? r.said.slice(0, 170) : "no turn"}`); }
  return out.join(" / "); };
step("the arena loads, with the Proving Grounds and its five fights first in the Fight list", async () => {
  loadJSONNow(getText(ARENA)); await wait(400); setDmMode(true); await wait(60); root.autoPace = "now"; root.autoEnemies = false;
  const n = (plans.kproving && plans.kproving.nodes || [])[0];
  return `place: ${(root.nodes || []).find(x => x.id === "kproving").name} | room: ${n && n.name} (${n && n.bmap.rows.length} rows, exits ${n && n.bmap.exits.length}) | fights: ${(root.arenaFights || []).slice(0, 5).map(f => f.name.replace(/ \(.*$/, "")).join("; ")}`;
});
for (const [k, label] of [[1, "the bandit gang"], [2, "big, flying, and the door"], [3, "spells"], [4, "a legend"], [5, "the hungry dead"]]) {
  step(`Proving ${k}, ${label}: everyone's in, and each enemy's turn runs`, async () => {
    const c = await openFight(`af_prove${k}`); const who = combatants(c).filter(o => o.side === "enemy").map(o => `${o.label}${footOf(o) > 1 ? " (" + footOf(o) + "×" + footOf(o) + ")" : ""}`).join(", ");
    const said = await runAll(c); return `${who} || ${said} | page errors ${__KIT.errors.length}`;
  });
}
