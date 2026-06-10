# MLE Optimizer Trainer

MLE Optimizer Trainer is an offline Electron desktop app for practicing optimization of machine-learning-engineering Python code. The interface follows a minimalist VS Code-style layout with an activity bar, collapsible side panel, Monaco editor, status bar, dark/light themes, guided exercises, glossary pages, and interview-prep reading panes.

## Tech stack

- Electron desktop shell
- React + TypeScript UI
- Monaco editor for Python code panes
- Local JSON content bundled with the app
- Electron Builder Windows installer output
- Browser local storage persisted in Electron's app profile for theme, edited code, completed exercises, and best times

## Project structure

```text
electron/
  main.ts              Electron main process
  preload.ts           Safe preload bridge
src/
  App.tsx              Main application shell and section views
  styles.css           VS Code-inspired light/dark UI
  data/
    exercises.json     Training modules, exercises, hints, steps, solutions
    glossary.json      Searchable glossary content
    interview.json     Mercor MLE interview prep pages
```

## Development

```bash
npm install
npm run electron:dev
```

## Build a Windows .exe

```bash
npm run build
```

Electron Builder writes the Windows installer to:

```text
release/MLE-Optimizer-Trainer-1.0.0-Setup.exe
```

## Adding content

New exercises, glossary entries, and interview pages can be added by editing the JSON files in `src/data`. The React components read those files directly, so no component changes are needed for ordinary content additions.
