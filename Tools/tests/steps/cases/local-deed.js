// uses: kal
// A local deed stays in its town (Joseph, 2026-11-05: "14 should just be that town"): never along a road, never by
// sea or by ship, and with a faction only in that faction's branch there, never its shared slots.
step("a local deed in Kalatecha, a faction's too, then ninety days of gossip and ships: where it's known", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll();
  const L = lib(); L.factions = L.factions || []; if (!L.factions.length) L.factions.push({ id: "lfa_t", name: "The Test Guild", standing: 0, repDie: 12 });
  const kal = root.nodes.find(q => q.name === "Kalatecha"), f = L.factions[0];
  const loc = repRecord({ text: "Short-changed the fishwife", who: "party", fame: "infamy", size: "local", place: kal.id, factions: [f.id], force: true }).deed;
  const big = repRecord({ text: "Sank a pirate sloop", who: "party", fame: "fame", size: "notable", place: kal.id, factions: [f.id], force: true }).deed;
  const where = d => Object.entries(repOf().tables).filter(([, T]) => Object.values(T.slots).some(e => e.d === d.id)).map(([k]) => repTableLabel(k));
  const at0 = where(loc);
  const d0 = campaignDay(); root.fday = d0; repOf().gday = d0; root.day = d0 + 90; syncTimeBar(); await wait(30);
  const carried = root.fleet.filter(s => (s.carry || []).some(e => e.d === loc.id)).length;
  return `local, recorded in: ${at0.join("; ")} | after 90 days: ${where(loc).join("; ")} | ships carrying it ${carried} | the notable one, for comparison, now in ${where(big).length} tables | the size's label: ${REP_SIZES[0][1]} | page errors ${__KIT.errors.length}`;
});
