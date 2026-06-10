import Editor from "@monaco-editor/react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  GraduationCap,
  Lightbulb,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Settings,
  Sun,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import exercisesData from "./data/exercises.json";
import glossaryData from "./data/glossary.json";
import interviewData from "./data/interview.json";
import "./styles.css";

type Theme = "dark" | "light";
type Section = "training" | "glossary" | "interview" | "settings";

type Exercise = {
  id: string;
  title: string;
  targetMinutes: number;
  limitMinutes: number;
  problem: string;
  code: string;
  steps: string[];
  hints: string[];
  solution: string;
  fixedCode: string;
};

type Module = {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
};

type GlossaryGroup = {
  category: string;
  terms: { term: string; definition: string }[];
};

type InterviewTopic = {
  id: string;
  title: string;
  sections: { heading: string; body?: string; bullets?: string[] }[];
};

type Progress = {
  completed: Record<string, boolean>;
  bestTimes: Record<string, number>;
};

const modules = exercisesData as Module[];
const glossary = glossaryData as GlossaryGroup[];
const interviewTopics = interviewData as InterviewTopic[];
const firstExercise = modules[0].exercises[0];

const storageKeys = {
  theme: "mle-optimizer-theme",
  progress: "mle-optimizer-progress",
  code: "mle-optimizer-code",
};

function loadProgress(): Progress {
  try {
    const stored = localStorage.getItem(storageKeys.progress);
    if (stored) return JSON.parse(stored) as Progress;
  } catch {
    // A corrupt localStorage value should not block the trainer from opening.
  }
  return { completed: {}, bestTimes: {} };
}

function formatTime(seconds: number) {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const remainingSeconds = clamped % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(storageKeys.theme) as Theme) || "dark";
  });
  const [activeSection, setActiveSection] = useState<Section>("training");
  const [sideOpen, setSideOpen] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0].id);
  const [selectedExerciseId, setSelectedExerciseId] = useState(firstExercise.id);
  const [selectedTerm, setSelectedTerm] = useState(glossary[0].terms[0].term);
  const [selectedInterviewId, setSelectedInterviewId] = useState(interviewTopics[0].id);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [codeByExercise, setCodeByExercise] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKeys.code) || "{}");
    } catch {
      return {};
    }
  });
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [glossaryQuery, setGlossaryQuery] = useState("");

  const selectedModule = modules.find((module) => module.id === selectedModuleId) ?? modules[0];
  const selectedExercise =
    selectedModule.exercises.find((exercise) => exercise.id === selectedExerciseId) ??
    selectedModule.exercises[0];
  const currentCode = codeByExercise[selectedExercise.id] ?? selectedExercise.code;

  const flattenedExercises = useMemo(
    () => modules.flatMap((module) => module.exercises.map((exercise) => ({ module, exercise }))),
    [],
  );
  const completedCount = flattenedExercises.filter(({ exercise }) => progress.completed[exercise.id]).length;
  const completionPercent = Math.round((completedCount / flattenedExercises.length) * 100);

  const selectedGlossaryEntry = useMemo(() => {
    return glossary
      .flatMap((group) => group.terms.map((entry) => ({ ...entry, category: group.category })))
      .find((entry) => entry.term === selectedTerm);
  }, [selectedTerm]);

  const filteredGlossary = useMemo(() => {
    const query = glossaryQuery.trim().toLowerCase();
    if (!query) return glossary;
    return glossary
      .map((group) => ({
        ...group,
        terms: group.terms.filter(
          (entry) =>
            entry.term.toLowerCase().includes(query) ||
            entry.definition.toLowerCase().includes(query) ||
            group.category.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.terms.length > 0);
  }, [glossaryQuery]);

  const selectedInterview = interviewTopics.find((topic) => topic.id === selectedInterviewId) ?? interviewTopics[0];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKeys.theme, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(storageKeys.progress, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(storageKeys.code, JSON.stringify(codeByExercise));
  }, [codeByExercise]);

  useEffect(() => {
    setElapsed(0);
    setStepIndex(0);
    setHintCount(0);
    setSolutionVisible(false);
    const interval = window.setInterval(() => {
      setElapsed((value) => Math.min(value + 1, selectedExercise.limitMinutes * 60));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [selectedExercise.id, selectedExercise.limitMinutes]);

  const timerState =
    elapsed >= selectedExercise.limitMinutes * 60
      ? "limit"
      : elapsed >= selectedExercise.targetMinutes * 60
        ? "target"
        : "normal";

  const switchTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));

  function openExercise(moduleId: string, exerciseId: string, showSolution = false) {
    setActiveSection("training");
    setSelectedModuleId(moduleId);
    setSelectedExerciseId(exerciseId);
    setSolutionVisible(showSolution);
  }

  function markComplete() {
    setProgress((current) => {
      const previousBest = current.bestTimes[selectedExercise.id];
      const bestTime = previousBest ? Math.min(previousBest, elapsed) : elapsed;
      return {
        completed: { ...current.completed, [selectedExercise.id]: true },
        bestTimes: { ...current.bestTimes, [selectedExercise.id]: bestTime },
      };
    });
  }

  function resetProgress() {
    setProgress({ completed: {}, bestTimes: {} });
  }

  return (
    <div className={`app-shell ${sideOpen ? "" : "side-closed"}`}>
      <aside className="activity-bar" aria-label="Primary sections">
        <ActivityButton
          label="Training"
          active={activeSection === "training"}
          onClick={() => setActiveSection("training")}
          icon={<Code2 size={22} />}
        />
        <ActivityButton
          label="Glossary"
          active={activeSection === "glossary"}
          onClick={() => setActiveSection("glossary")}
          icon={<BookOpen size={22} />}
        />
        <ActivityButton
          label="Interview Prep"
          active={activeSection === "interview"}
          onClick={() => setActiveSection("interview")}
          icon={<GraduationCap size={22} />}
        />
        <ActivityButton
          label="Settings"
          active={activeSection === "settings"}
          onClick={() => setActiveSection("settings")}
          icon={<Settings size={22} />}
        />
      </aside>

      {sideOpen && (
        <aside className="side-panel">
          <div className="side-header">
            <span>{sectionTitle(activeSection)}</span>
            <button className="icon-button" type="button" onClick={() => setSideOpen(false)} title="Collapse panel">
              <PanelLeftClose size={17} />
            </button>
          </div>
          {activeSection === "training" && (
            <TrainingNav
              modules={modules}
              selectedExerciseId={selectedExercise.id}
              progress={progress}
              onOpen={openExercise}
            />
          )}
          {activeSection === "glossary" && (
            <GlossaryNav
              groups={filteredGlossary}
              query={glossaryQuery}
              selectedTerm={selectedTerm}
              onQuery={setGlossaryQuery}
              onSelect={setSelectedTerm}
            />
          )}
          {activeSection === "interview" && (
            <InterviewNav
              topics={interviewTopics}
              selectedId={selectedInterviewId}
              onSelect={setSelectedInterviewId}
            />
          )}
          {activeSection === "settings" && (
            <div className="side-note">
              <p>Theme, local progress, and completion stats are stored on disk through Electron's app profile.</p>
            </div>
          )}
        </aside>
      )}

      <main className="workspace">
        {!sideOpen && (
          <button className="reopen-panel icon-button" type="button" onClick={() => setSideOpen(true)} title="Open panel">
            <PanelLeftOpen size={18} />
          </button>
        )}
        {activeSection === "training" && (
          <TrainingView
            theme={theme}
            module={selectedModule}
            exercise={selectedExercise}
            code={currentCode}
            elapsed={elapsed}
            timerState={timerState}
            stepIndex={stepIndex}
            hintCount={hintCount}
            solutionVisible={solutionVisible}
            completed={Boolean(progress.completed[selectedExercise.id])}
            bestTime={progress.bestTimes[selectedExercise.id]}
            onCodeChange={(value) =>
              setCodeByExercise((current) => ({ ...current, [selectedExercise.id]: value ?? "" }))
            }
            onNextStep={() => setStepIndex((value) => Math.min(value + 1, selectedExercise.steps.length - 1))}
            onPreviousStep={() => setStepIndex((value) => Math.max(value - 1, 0))}
            onHint={() => setHintCount((value) => Math.min(value + 1, selectedExercise.hints.length))}
            onToggleSolution={() => setSolutionVisible((value) => !value)}
            onComplete={markComplete}
          />
        )}
        {activeSection === "glossary" && <GlossaryView entry={selectedGlossaryEntry} />}
        {activeSection === "interview" && <InterviewView topic={selectedInterview} />}
        {activeSection === "settings" && (
          <SettingsView
            theme={theme}
            completed={completedCount}
            total={flattenedExercises.length}
            progress={progress}
            exercises={flattenedExercises.map(({ exercise }) => exercise)}
            onTheme={switchTheme}
            onReset={resetProgress}
          />
        )}
      </main>

      <footer className="status-bar">
        <button className="status-item status-button" type="button" onClick={switchTheme}>
          {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          {theme === "dark" ? "Dark" : "Light"}
        </button>
        <span className={`status-item timer-state-${timerState}`}>
          <Timer size={14} />
          {activeSection === "training" ? formatTime(elapsed) : "00:00"}
        </span>
        <span className="status-item">{completedCount}/{flattenedExercises.length} complete</span>
        <span className="status-fill">{completionPercent}%</span>
      </footer>
    </div>
  );
}

function ActivityButton({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={`activity-button ${active ? "active" : ""}`} type="button" onClick={onClick} title={label}>
      {icon}
    </button>
  );
}

function sectionTitle(section: Section) {
  const titles: Record<Section, string> = {
    training: "Training",
    glossary: "Glossary",
    interview: "Interview Prep",
    settings: "Settings",
  };
  return titles[section];
}

function TrainingNav({
  modules,
  selectedExerciseId,
  progress,
  onOpen,
}: {
  modules: Module[];
  selectedExerciseId: string;
  progress: Progress;
  onOpen: (moduleId: string, exerciseId: string, showSolution?: boolean) => void;
}) {
  return (
    <div className="tree-list">
      {modules.map((module) => (
        <section className="tree-group" key={module.id}>
          <h2>{module.title}</h2>
          {module.exercises.map((exercise) => (
            <div className={`exercise-row ${exercise.id === selectedExerciseId ? "active" : ""}`} key={exercise.id}>
              <button type="button" onClick={() => onOpen(module.id, exercise.id)}>
                {progress.completed[exercise.id] ? <CheckCircle2 size={14} /> : <Code2 size={14} />}
                <span>{exercise.title}</span>
              </button>
              <button
                className="mini-action"
                type="button"
                onClick={() => onOpen(module.id, exercise.id, true)}
                title="Open solution"
              >
                Solution
              </button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function GlossaryNav({
  groups,
  query,
  selectedTerm,
  onQuery,
  onSelect,
}: {
  groups: GlossaryGroup[];
  query: string;
  selectedTerm: string;
  onQuery: (query: string) => void;
  onSelect: (term: string) => void;
}) {
  return (
    <div className="glossary-nav">
      <label className="search-box">
        <Search size={15} />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search terms" />
      </label>
      <div className="tree-list">
        {groups.map((group) => (
          <section className="tree-group" key={group.category}>
            <h2>{group.category}</h2>
            {group.terms.map((entry) => (
              <button
                className={`term-button ${entry.term === selectedTerm ? "active" : ""}`}
                type="button"
                key={entry.term}
                onClick={() => onSelect(entry.term)}
              >
                {entry.term}
              </button>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function InterviewNav({
  topics,
  selectedId,
  onSelect,
}: {
  topics: InterviewTopic[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="tree-list">
      {topics.map((topic) => (
        <button
          className={`topic-button ${topic.id === selectedId ? "active" : ""}`}
          type="button"
          key={topic.id}
          onClick={() => onSelect(topic.id)}
        >
          {topic.title}
        </button>
      ))}
    </div>
  );
}

function TrainingView({
  theme,
  module,
  exercise,
  code,
  elapsed,
  timerState,
  stepIndex,
  hintCount,
  solutionVisible,
  completed,
  bestTime,
  onCodeChange,
  onNextStep,
  onPreviousStep,
  onHint,
  onToggleSolution,
  onComplete,
}: {
  theme: Theme;
  module: Module;
  exercise: Exercise;
  code: string;
  elapsed: number;
  timerState: string;
  stepIndex: number;
  hintCount: number;
  solutionVisible: boolean;
  completed: boolean;
  bestTime?: number;
  onCodeChange: (value?: string) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onHint: () => void;
  onToggleSolution: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="training-view">
      <header className="exercise-header">
        <div>
          <p className="eyebrow">{module.title}</p>
          <h1>{exercise.title}</h1>
          <p>{exercise.problem}</p>
        </div>
        <div className={`timer-card timer-state-${timerState}`}>
          <span>Target {exercise.targetMinutes}m</span>
          <strong>{formatTime(elapsed)}</strong>
          <span>Limit {exercise.limitMinutes}m</span>
        </div>
      </header>

      <section className="guided-strip">
        <div className="step-panel">
          <div className="step-heading">
            <span>Step {stepIndex + 1} of {exercise.steps.length}</span>
            <div className="step-actions">
              <button className="icon-button" type="button" onClick={onPreviousStep} title="Previous step">
                <ChevronLeft size={16} />
              </button>
              <button className="icon-button" type="button" onClick={onNextStep} title="Next step">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p>{exercise.steps[stepIndex]}</p>
        </div>
        <div className="hint-panel">
          <div className="step-heading">
            <span>Hints</span>
            <button className="text-button" type="button" onClick={onHint}>
              <Lightbulb size={15} />
              Hint
            </button>
          </div>
          {hintCount === 0 ? (
            <p className="muted">Hints are hidden until requested.</p>
          ) : (
            <ol>
              {exercise.hints.slice(0, hintCount).map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="editor-shell">
        <Editor
          height="100%"
          language="python"
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={code}
          onChange={onCodeChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </section>

      <section className="exercise-actions">
        <button className="primary-button" type="button" onClick={onComplete}>
          <CheckCircle2 size={16} />
          {completed ? "Completed" : "Mark Complete"}
        </button>
        <button className="secondary-button" type="button" onClick={onToggleSolution}>
          {solutionVisible ? "Hide Solution" : "Show Solution"}
        </button>
        {bestTime !== undefined && <span className="muted">Best time {formatTime(bestTime)}</span>}
      </section>

      {solutionVisible && (
        <section className="solution-pane">
          <h2>Solution</h2>
          <p>{exercise.solution}</p>
          <div className="solution-editor">
            <Editor
              height="100%"
              language="python"
              theme={theme === "dark" ? "vs-dark" : "light"}
              value={exercise.fixedCode}
              options={{
                readOnly: true,
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function GlossaryView({ entry }: { entry?: { term: string; definition: string; category: string } }) {
  if (!entry) {
    return (
      <article className="reading-pane">
        <h1>No term selected</h1>
      </article>
    );
  }

  return (
    <article className="reading-pane">
      <p className="eyebrow">{entry.category}</p>
      <h1>{entry.term}</h1>
      <p>{entry.definition}</p>
    </article>
  );
}

function InterviewView({ topic }: { topic: InterviewTopic }) {
  return (
    <article className="reading-pane">
      <p className="eyebrow">Mercor MLE Interview</p>
      <h1>{topic.title}</h1>
      {topic.sections.map((section) => (
        <section className="reading-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body && <p>{section.body}</p>}
          {section.bullets && (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

function SettingsView({
  theme,
  completed,
  total,
  progress,
  exercises,
  onTheme,
  onReset,
}: {
  theme: Theme;
  completed: number;
  total: number;
  progress: Progress;
  exercises: Exercise[];
  onTheme: () => void;
  onReset: () => void;
}) {
  const bestEntries = exercises
    .filter((exercise) => progress.bestTimes[exercise.id] !== undefined)
    .sort((a, b) => progress.bestTimes[a.id] - progress.bestTimes[b.id])
    .slice(0, 8);

  return (
    <article className="settings-pane">
      <header>
        <p className="eyebrow">Preferences</p>
        <h1>Settings</h1>
      </header>
      <section className="settings-row">
        <div>
          <h2>Theme</h2>
          <p>Switch between VS Code-inspired dark and light palettes.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onTheme}>
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          {theme === "dark" ? "Dark" : "Light"}
        </button>
      </section>
      <section className="settings-row">
        <div>
          <h2>Progress</h2>
          <p>{completed} of {total} exercises completed.</p>
        </div>
        <button className="danger-button" type="button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset Progress
        </button>
      </section>
      <section className="stats-pane">
        <h2>Best Times</h2>
        {bestEntries.length === 0 ? (
          <p className="muted">Complete an exercise to record a best time.</p>
        ) : (
          <table>
            <tbody>
              {bestEntries.map((exercise) => (
                <tr key={exercise.id}>
                  <td>{exercise.title}</td>
                  <td>{formatTime(progress.bestTimes[exercise.id])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </article>
  );
}

export default App;
