# React IDE Issues

Status: investigation note from the React IDE debugging pass.

## Current Symptoms

- Editing code in the React IDE updates editor state, but the Sandpack preview iframe can remain stale.
- Hot reload is unreliable. In browser smoke testing, the preview kept rendering the old counter UI after `App.tsx` was changed to render different text.
- The issue reproduced with the custom Monaco editor and also with Sandpack's built-in CodeMirror editor, so the primary failure is below the editor component.
- Monaco IntelliSense was incomplete for React and cross-file imports.
- The file tree is currently read/select only. It does not yet support create, rename, delete, drag/drop, or arbitrary project building.
- Tailwind support is currently via runtime CDN injection in the preview iframe. This is useful for learning exercises, but it is not a production-grade Tailwind pipeline.
- There are still multiple editor paths in the codebase: JS question IDE, scratchpad, visual debugger, CodeMirror preview/read phase, and the React IDE. The React IDE needs one definitive runtime/editor contract.
- Error display should rely on Sandpack runtime errors where possible. Custom hardcoded error boundaries can get stuck and hide recovery after a valid edit.

## Findings

- Sandpack is still the right runtime primitive for this product direction: it provides iframe isolation, preview, console, runtime errors, dependencies, and editor-agnostic APIs.
- The blocking issue is the Sandpack preview client lifecycle, not only Monaco. During local browser testing, Sandpack file state updated, but the preview client could sit around `idle` / `initializing` and fail to receive a rebuilt sandbox.
- The previous cross-file sync optimization used only file content length. Edits with the same length could leave Monaco models stale, which hurts IntelliSense and imports.
- The React IDE test expected old hardcoded Tailwind utility CSS. The implementation now injects Tailwind through the preview entrypoint, so the test needed to assert that contract instead.

## Changes Made

- Added content-aware project file signatures for React IDE file sync.
- Improved Monaco React/TSX IntelliSense setup with React module typings, JSX runtime typings, and cross-file model creation.
- Wired Monaco content changes through `onDidChangeModelContent` so the controlled value callback stays reliable.
- Updated the React IDE layout test to match the current Tailwind injection contract.

## Next Debugging Path

1. Build a minimal route or test fixture with only `SandpackProvider`, `SandpackCodeEditor`, and `SandpackPreview`.
2. Verify hot reload there before adding the custom file tree, phase UI, solution switching, console toggles, or Monaco.
3. Once the minimal Sandpack lifecycle is reliable, reintroduce Monaco as a custom editor by writing only through `sandpack.updateFile(activeFile, value)`.
4. Add a browser smoke test that edits `App.tsx` and asserts the iframe body changes.
5. After runtime reliability is proven, add real file operations and zip export.

