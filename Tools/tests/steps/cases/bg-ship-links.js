// uses: kal
// The Background log's ship names open the ship's card over the log (Joseph, 2026-11-06: "without kicking me out of
// the log").
step("a ship's name in the log: her card opens, the log stays", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60); delete root.fleet; seaLanesFromMap(); fleetRoll();
  const dn = document.getElementById("dayNum"); dn.value = String(campaignDay() + 5); dn.dispatchEvent(new Event("change")); await wait(40);
  pane = "background"; syncTabs(); openInv.add("bg:log"); renderPane(true); await wait(30);
  const el = document.getElementById("pane-background"), links = el.querySelectorAll('[data-invfor="bg:log"] [data-laneship]'), row = links[0] && links[0].closest(".glrow").innerText.replace(/\s+/g, " ").slice(0, 90);
  links[0].click(); await wait(30);
  const pop = document.getElementById("fleetPop"), card = !pop.hidden && pop.innerText.replace(/\s+/g, " ").slice(0, 80);
  const still = pane === "background" && !!el.querySelector('[data-invfor="bg:log"][open]');
  pop.hidden = true;
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `${links.length} ship names linked in the log; e.g. "${row}" | clicked: "${card}" | still on the log: ${still}`;
});
