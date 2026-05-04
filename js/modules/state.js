import { hotkeys } from './constants.js';

export const state = {
  projects: {},
  activeProjectId: null,
  selectedStepId: null,
  selectedBranch: null,
  globalSettings: {
    reloadHotkey: { key: "r", mods: ["ctrl", "shift"] },
    ipadMove: { key: "a", mods: ["ctrl", "shift"] },
    iphoneMove: { key: "z", mods: ["ctrl", "shift"] },
    stopAllHotkey: { key: "q", mods: ["ctrl", "shift"] },
  },
  recordingTarget: null,
  recordingStepId: null,
  stepIdSeq: 1,
  flowSteps: [],
  templateStepIds: {},
  projectOrder: [],
};

export function nextStepId() {
  const id = state.stepIdSeq;
  state.stepIdSeq += 1;
  return id;
}

export function findStepById(stepId, steps) {
  const list = steps || state.flowSteps;
  for (const step of list) {
    if (step.id === stepId) return step;
    if (step.kind === "check") {
      if (step.okBranch) {
        const found = findStepById(stepId, step.okBranch);
        if (found) return found;
      }
      if (step.ngBranch) {
        const found = findStepById(stepId, step.ngBranch);
        if (found) return found;
      }
    }
  }
  return null;
}

export function flushActiveProject() {
  if (!state.activeProjectId || !state.projects[state.activeProjectId]) return;
  const p = state.projects[state.activeProjectId];
  p.hotkeys = {
    start: hotkeys.start,
    stop: hotkeys.stop,
  };
  p.flowSteps = [...state.flowSteps];
  p.stepIdSeq = state.stepIdSeq;
  p.templateStepIds = { ...state.templateStepIds };
  p.config = {
    settleIPad: document.getElementById("settleIPad").value,
    waitIPad: document.getElementById("waitIPad").value,
    settleIPhone: document.getElementById("settleIPhone").value,
    waitIPhone: document.getElementById("waitIPhone").value,
    enableTimelineLog: document.getElementById("enableTimelineLog").value,
    enableLoop: document.getElementById("enableLoop").value,
  };
}

export function defaultTitleByKind(kind) {
  if (kind === "move") return "切り替えショートカット送信";
  if (kind === "click") return "アプリの座標クリック";
  if (kind === "focus") return "アプリを前面に出す";
  if (kind === "check") return "画面テキスト確認";
  if (kind === "stop") return "実行停止";
  if (kind === "jump") return "ジャンプ";
  return "キー送信";
}

export function migrateLegacyAction(action, targetId) {
  if (action === "stop") {
    return [
      {
        id: nextStepId(),
        kind: "stop",
        title: "実行停止",
        phase: "Custom",
        waitAfter: 0.25,
      },
    ];
  }
  if (action === "jump" && targetId) {
    return [
      {
        id: nextStepId(),
        kind: "jump",
        title: "ジャンプ",
        phase: "Custom",
        targetId: Number(targetId),
        waitAfter: 0.25,
      },
    ];
  }
  return [];
}

export function normalizeWaitAfter(value, fallback) {
  const numValue = Number(value);
  if (Number.isFinite(numValue) && numValue >= 0) return numValue;
  return fallback;
}

export function normalizeStep(step) {
  const s = {
    id: step.id,
    kind: step.kind,
    phase: (step.phase || "Custom").trim() || "Custom",
    title:
      (step.title || defaultTitleByKind(step.kind)).trim() ||
      defaultTitleByKind(step.kind),
  };

  if (s.kind === "move") {
    s.moveHotkey = step.moveHotkey || "ipadMove";
  } else if (s.kind === "click") {
    s.appName = (step.appName || "").trim();
    s.x = Number.isFinite(Number(step.x)) ? Number(step.x) : 0;
    s.y = Number.isFinite(Number(step.y)) ? Number(step.y) : 0;
    s.settleBefore = Number.isFinite(Number(step.settleBefore))
      ? Number(step.settleBefore)
      : 0.5;
  } else if (s.kind === "focus") {
    s.appName = (step.appName || "").trim();
  } else if (s.kind === "check") {
    s.text = (step.text || "").trim();
    s.okWaitBefore = normalizeWaitAfter(step.okWaitBefore, 0.5);
    s.ngWaitBefore = normalizeWaitAfter(step.ngWaitBefore, 0.5);
    s.okWaitAfter = normalizeWaitAfter(step.okWaitAfter, 0.5);
    s.ngWaitAfter = normalizeWaitAfter(step.ngWaitAfter, 0.5);
    s.okBranch = Array.isArray(step.okBranch)
      ? step.okBranch.map((bs) => normalizeStep(bs))
      : [];
    s.ngBranch = Array.isArray(step.ngBranch)
      ? step.ngBranch.map((bs) => normalizeStep(bs))
      : [];
    if (!Array.isArray(step.okBranch) && step.ifFoundAction) {
      s.okBranch = migrateLegacyAction(
        step.ifFoundAction,
        step.ifFoundTargetId,
      );
    }
    if (!Array.isArray(step.ngBranch) && step.ifNotFoundAction) {
      s.ngBranch = migrateLegacyAction(
        step.ifNotFoundAction,
        step.ifNotFoundTargetId,
      );
    }
  } else if (s.kind === "jump") {
    s.targetId = step.targetId ? Number(step.targetId) : null;
  } else if (s.kind === "stop") {
    // No extra fields
  } else {
    s.kind = "key";
    s.key = (step.key || "space").trim().toLowerCase() || "space";
  }
  s.waitAfter = normalizeWaitAfter(step.waitAfter, 0.25);
  return s;
}
