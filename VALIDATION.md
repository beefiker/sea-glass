# Validation

Publication check: 2026-10-13.

- JavaScript syntax: `node --check` passed for `studio.js`, `motion.js`, `fileloom.js` and `fileloom-model.js`.
- Runtime/state checks: `node --test motion-checks.mjs fileloom-checks.mjs` passed 20 tests (109 ms).
- Material/source checks: `python3 check.py` passed 7 tests (11 ms).
- Server smoke check: an isolated server using `serve.PreviewHandler` passed `check_http`; 10 public assets were served and 9 private/unknown routes were rejected. The test server was shut down afterward.
- macOS helper syntax: `bash -n start-preview.sh` passed.
- Browser observation assertion fixtures rejected all 10 negative cases across both assertion modules.
- Nine design/runtime assets were byte-compared with the approved studio: all matched. Component documentation numbering was checked against the runtime catalogue.

The design was browser-checked during development at desktop, 320-pixel and 390-pixel widths, including focus boundaries, sample transfers, reader input, settings and dark appearance. Those observations apply to the identical design assets copied here; this publication task did not repeat physical browser input.

The checks cover this web prototype. Native Android/iOS builds, physical touch hardware, provider networking, audio synthesis and native performance are outside its scope. The Fileloom concept uses fixtures and resets on reload.
