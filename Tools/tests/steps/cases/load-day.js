// uses: kal
// Loading an old save takes the day back too (Joseph, 2026-11-04: "It's not taking the days back"): the time bar shows
// the file's day, not the one before it.
step("on day 4, then load a save from day 1: the time bar says day 1", async () => {
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(300); setDmMode(true); await wait(60);
  root.day = 4; root.timeOfDay = "night"; syncTimeBar(); const before = ($("#dayNum") || {}).value;
  loadJSONNow(JSON.stringify(FIX.kal)); await wait(100);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `before: day ${before} | after loading: the campaign's day ${root.day}, the bar ${($("#dayNum") || {}).value}, ${timeOfDay()}`;
});
