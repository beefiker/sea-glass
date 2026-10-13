# Sea Glass components

The studio contains 32 interactive groups. Material and motion are shared across the primitive examples and the connected Fileloom concept.

| Group | Component |
| --- | --- |
| 01 | Buttons |
| 02 | Segmented control |
| 03 | Slider |
| 04 | Switches |
| 05 | Checkboxes & radio |
| 06 | Search & text fields |
| 07 | Stepper |
| 08 | Select & action menu |
| 09 | Toolbar |
| 10 | Badges & removable chips |
| 11 | Progress |
| 12 | Accordion |
| 13 | Dialog |
| 14 | Toast & inline notice |
| 15 | Cards |
| 16 | Tooltip & icon actions |
| 17 | Bottom sheet |
| 18 | File rows and thumbnail tiles |
| 19 | Location navigation |
| 20 | Selection and copy/move transfer bars |
| 21 | Adaptive app navigation |
| 22 | Integrated precision slider |
| 23 | Reading progress and page jump |
| 24 | Compact reader control bars |
| 25 | Movable playback pill |
| 26 | Grouped settings and choice cards |
| 27 | Find results and match navigation |
| 28 | Empty, loading, error and access recovery |
| 29 | Reorderable toolbar |
| 30 | Tap-zone editor |
| 31 | Command palette |
| 32 | Layer tree and sortable data table |

## Connected app concept

Files, Library, Reader and Settings share local state. Copy/move changes the in-memory file fixtures only after destination confirmation. Collections group chosen sample books without moving them. Exact reader settings combine stepped ranges with minus/plus buttons. Reading progress separates drag preview from committed page selection and ignores track taps.

The command palette supports Control/Command + K, filtering, arrow navigation and Enter. Sheets retain a native modal focus boundary and restore an available opener. Page replacement is deferred until native modal close to preserve WebKit background interaction. Toolbar drag handles have move-earlier/later alternatives. Playback can be moved with its grip or arrow keys.

Provider data, artwork, documents and table records are local examples. The reader displays original sample text; playback controls do not synthesize audio. Reading-mode cards and tap zones demonstrate configuration. No real files, accounts, provider connections or native permissions are used. State resets on reload.

## Material and platform intent

Use pigment, fine grain, rounded edges, restrained upper-edge light and contact/cast shadows. Keep document text and dense lists calm. The minimum target is 44 logical pixels; standard controls use 48. Press feedback, persistent selection, hover and focus remain separate. Reduced motion and forced colours have dedicated fallbacks.

The capsule thumb is 44 × 28 pixels on a 12-pixel track within a 48-pixel input. Its pressed deformation is visual only. Native Compose and SwiftUI ports should preserve platform typography, gestures, sheets and accessibility, with separate device and performance validation.
