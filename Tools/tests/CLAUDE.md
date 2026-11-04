# Testing Ordinate Survey: the rules (Joseph, 2026-11-01; tightened 2026-11-04)

1. **Every new test is a step test**: `steps\cases\<name>.js`, run with
   `powershell -NoProfile -ExecutionPolicy Bypass -File Tools\tests\steps\run.ps1 -Only <name>` (`-From <n>` restarts
   at a failed step, `-Accept` records what it saw, `-Keep` keeps the built page). The old harness
   (`run-tests.ps1`, `cases\*.html`) only re-runs the tests listed in `old-cases.txt`; it refuses anything new.
2. **Write and change test files with the editor (Write / Edit), never sed, awk or perl.** Quoting in those mangles
   JavaScript, and a test file that doesn't parse is the commonest "hang".
3. **A smoke test, not a proof**: a handful of steps, the feature's main path once. Steps return the values that
   matter; read them once and `-Accept`. Use `expect()` only for facts that can't be wrong (no page errors, nothing
   doubled). Never hand-write exact expected values.
4. **Name things in a test so they can't clash with the app's globals** (prefix them with the feature: `memP`, not `P`).
5. **A test that fails because of the test a second time gets simplified or deleted, not debugged again.**
6. **Run the new test and the few nearby ones.** Never the old full suite (about 7 minutes) without asking Joseph.
7. Dialogs answer from `__KIT.answers`; nothing a step test does can open a real dialog, download or window.

If a run "hangs", it's almost always the test file: the step runner says so at once ("no steps ran, so the test file
didn't load: <the error>"), and the old harness reports a script that doesn't parse within a second.
