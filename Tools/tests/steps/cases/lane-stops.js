// uses: kal
// A sea lane's stops (Joseph, 2026-11-06: "edit the sea lanes, like add ports they stop at"): a stop added from the
// lane's card splits it in two by water; the route shows every stop; renamed as one; a stop taken out again.
step("a stop added: the lane split in two, one route with its stops; renamed as one; the stop taken out", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); seaLanesFromMap(); render(); await wait(30);
  const l = repOf().lanes.slice().sort((a, b) => (+b.miles || 0) - (+a.miles || 0))[0], A = repPlaceName(l.from), B = repPlaceName(l.to), n0 = repOf().lanes.length;
  laneCard(l.id); await wait(20); const pop = document.getElementById("fleetPop");
  const sel = pop.querySelector("[data-lanestop]"), first = sel.options[1]; sel.value = first.value; pop.querySelector('[data-laneact="stop"]').click(); await wait(30);
  const stops1 = [...pop.querySelectorAll(".sbl b")].map(b => b.textContent).join(" → "), legs = laneChain(repOf().lanes.find(x => x.id === laneSel)).lanes;
  const nm = pop.querySelector('[data-lanef="name"]'); nm.value = "The Long Reach"; nm.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  const named = legs.map(x => x.name).join(", ");
  pop.querySelector('[data-laneact="unstop"]').click(); await wait(30);
  const back = laneBetween(l.from, l.to);
  pop.hidden = true; laneSel = null;
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `the lane ${A} – ${B} (${Math.round(l.miles)} mi); the first port offered: ${first.textContent} | its stops: ${stops1} (${legs.length} legs, ${legs.map(x => Math.round(x.miles) + " mi").join(" + ")}, by water ${legs.every(x => x.pts && x.pts.length > 1)}) | renamed: ${named} | the stop taken out: ${A} – ${B} one lane again ${!!back}, named ${back && back.name}, lanes ${n0} → ${repOf().lanes.length}`;
});
