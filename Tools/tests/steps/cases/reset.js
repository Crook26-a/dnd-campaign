// Reset the party (Joseph, 2026-11-04): in the Test Arena, one button puts everyone back as new between fights.
const ARENA = "file:///C:/Users/josep/OneDrive/Documents/DnD/Ordinate%20Survey/Campaigns/Test%20Arena/Test%20Arena.json";
const rsGet = url => { const x = new XMLHttpRequest(); x.open("GET", url, false); x.send(); return x.responseText; };
const rsSay = () => partyRoster().map(p => { pcState(p); const used = p.slots.reduce((a, s) => a + ((s && s.used) || 0), 0);
  return `${p.name} ${p.hp}/${p.hpMax} temp ${p.temp} slots used ${used} conds [${p.conds.join(",")}] death ${p.death.s}/${p.death.f}${p.conc ? " conc " + p.conc.name : ""}`; }).join(" / ");
step("the arena loads with a fight open; the party is hurt, spent, and under conditions", async () => {
  loadJSONNow(rsGet(ARENA)); await wait(400); setDmMode(true); await wait(60); window.confirm = () => true;
  root.arenaIn = partyRoster().map(p => p.id); Object.assign(arenaPick, { from: "kproving", room: "pg_hall", fight: "af_prove1" });
  const b = document.createElement("button"); b.dataset.arena = "fresh"; document.body.appendChild(b); b.click(); b.remove(); await wait(150);
  for (const p of partyRoster()) { pcState(p); p.hp = 0; p.temp = 5; p.conds = ["Unconscious", "Prone", "Frightened"]; p.death = { s: 1, f: 2 }; p.conc = { id: "bless", name: "Bless" };
    for (let L = 1; L <= 9; L++) p.slots[L].used = p.slots[L].max; }
  renderSession(); return `${rsSay()} | reset button shown: ${!!document.querySelector('[data-arena="reset"]')}`;
});
step("Reset the party: everyone full, slots back, no conditions or concentration", async () => {
  document.querySelector('[data-arena="reset"]').click(); await wait(60);
  return `${rsSay()} | page errors ${__KIT.errors.length}`;
});
