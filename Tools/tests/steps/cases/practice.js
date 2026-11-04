// uses: kal
// Practice (Joseph, 2026-11-04: "turn off saving for a bit so that I can do things and not worry about messing up the
// campaign"): while it's on nothing is written (the save, the folder, the shelf); stopping keeps it or throws it away.
// Writes are counted as they're asked for (the test's clock runs ahead of real storage, so nothing is read back).
// Throwing away reloads the page, which a test can't follow: here, keeping.
step("practising: changes stay in the app, nothing is written", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(3000);      // the save's pictures go in after it loads
  const put = IDBObjectStore.prototype.put; __KIT.keep.puts = 0; __KIT.keep.keys = []; IDBObjectStore.prototype.put = function (...a) { if (practice && !_saving) { __KIT.keep.puts++; __KIT.keep.keys.push(String(a[1])); } return put.apply(this, a); };      // a save already under way when practice began may finish; nothing new may start
  for (let k = 0; k < 100 && (_saving || _dirty.size); k++) { pump(); await wait(200); }     // the load all saved first
  practiceStart(); await wait(300); __KIT.keep.puts = 0; __KIT.keep.keys = [];
  root.day = 9; saveParty(); touch(); await wait(900); pump();
  const label = ($("#saveState") || {}).textContent, btn = ($("#practiceBtn") || {}).textContent;
  const folder = await homeWrite(true), shelf = await shelveBeforeReplacing();
  expect(__KIT.keep.puts === 0, "no writes while practising", __KIT.keep.keys);
  return `writes while practising: ${__KIT.keep.puts} (the app's day ${root.day}) | "${label}" | button "${btn}" | the folder written: ${folder}, the shelf: ${shelf} | waiting to save: ${_dirty.size}`;
});
step("stop and keep it: what waited goes to be saved", async () => {
  const waiting = _dirty.size > 0; practiceStop(true); await wait(50);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `something was waiting: ${waiting} | saving again: ${!practice} | button "${($("#practiceBtn") || {}).textContent}"`;
});
step("by the buttons, as Joseph does: Practice, then the red button opens the choice and stays open; Keep it", async () => {
  const b = $("#practiceBtn"); b.click(); await wait(50); const on = practice;
  b.click(); await wait(50); const p = $("#campPop"), open = !p.hidden, choices = [...p.querySelectorAll("[data-practice]")].map(x => x.textContent);
  const keep = p.querySelector('[data-practice="keep"]'); if (keep) { keep.click(); await wait(50); }
  expect(on && open, "the choice shows (it used to shut at once)", { on, open });
  return `practising ${on} | the choice open: ${open} (${choices.join(" / ")}) | after Keep it: practising ${practice}, menu hidden ${p.hidden}`;
});
