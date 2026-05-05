import { state, normalizeStep, findStepById } from "./state.js";
import { hotkeys, hotkeyLabels, hotkeyDisplayIds } from "./constants.js";
import { num, txt, escapeHtml } from "./utils.js";

export function hotkeyToDisplay(hk) {
  if (!hk || !hk.key) return "未設定";
  const m = hk.mods
    .map((mod) => mod.charAt(0).toUpperCase() + mod.slice(1))
    .join("+");
  return (m ? m + "+" : "") + hk.key.toUpperCase();
}

export function keyToDisplay(key) {
  if (!key) return "未設定";
  if (key === " ") return "SPACE";
  return key.toUpperCase();
}

export function defaultWaitSecondsForIndex(index) {
  return index % 2 === 0 ? 0.3 : 0.4;
}

export function getStepLabelById(id) {
  const findIn = (steps) => {
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].id === id) return `Step ${i + 1}`;
      if (steps[i].kind === "check") {
        const ok = findIn(steps[i].okBranch || []);
        if (ok) return ok;
        const ng = findIn(steps[i].ngBranch || []);
        if (ng) return ng;
      }
    }
    return null;
  };
  return findIn(state.flowSteps) || "不明";
}

export const icons = {
  ipad: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12" y1="18" y2="18"/></svg>`,
  iphone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="10" height="18" x="7" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="17" y2="17"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>`,
  click: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  focus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-3-3-3 3"/><path d="m15 18-3-3-3 3"/><path d="M12 3v6"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  jump: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>`,
};

export function setupAddStepButtons() {
  const mapping = {
    btnFlowAddIPad: icons.ipad,
    btnFlowAddIPhone: icons.iphone,
    btnFlowAddKey: icons.key,
    btnFlowAddClick: icons.click,
    btnFlowAddFocus: icons.focus,
    btnFlowAddCheck: icons.check,
    btnFlowAddJump: icons.jump,
    btnFlowAddStop: icons.stop,
  };

  Object.entries(mapping).forEach(([id, icon]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.innerHTML = `${icon} <span>${btn.innerText.trim()}</span>`;
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.gap = "8px";
      btn.style.justifyContent = "center";
    }
  });
}

function renderStepCard(step, stepNum) {
  let icon = icons.key;
  if (step.kind === "move") {
    icon = step.moveHotkey === "ipadMove" ? icons.ipad : icons.iphone;
  } else if (step.kind === "click") {
    icon = icons.click;
  } else if (step.kind === "focus") {
    icon = icons.focus;
  } else if (step.kind === "check") {
    icon = icons.check;
  } else if (step.kind === "jump") {
    icon = icons.jump;
  } else if (step.kind === "stop") {
    icon = icons.stop;
  }

  let displayContent = "";
  let editorContent = "";

  if (step.kind === "move") {
    displayContent = `<p class="flow-value flow-value-hotkey">${hotkeyToDisplay(state.globalSettings[step.moveHotkey] || hotkeys[step.moveHotkey])}</p>`;
    editorContent = `<span class="step-key-label" style="font-size:0.7rem; color:#94a3b8;">固定ステップ</span>`;
  } else if (step.kind === "click") {
    displayContent = `
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <div class="step-key-label-group">
          <input type="text" class="step-input" style="flex:1;" data-field="appName" data-step-id="${step.id}" value="${escapeHtml(step.appName || "")}" placeholder="アプリ名 (クリック対象)" />
          <button type="button" class="btn-ghost btn-small" data-action="select-app" data-step-id="${step.id}" style="padding: 4px 8px!important; font-size: 0.7rem!important;">選択</button>
          <input type="file" id="file-app-${step.id}" webkitdirectory directory style="display:none;" />
        </div>
        <div class="step-key-label-group" style="gap: 8px;">
          <div style="display:flex; align-items:center; gap:3px;">
            <span class="step-key-label">X</span>
            <input type="number" class="step-input" style="width: 55px;" data-field="x" data-step-id="${step.id}" value="${step.x}" />
          </div>
          <div style="display:flex; align-items:center; gap:3px;">
            <span class="step-key-label">Y</span>
            <input type="number" class="step-input" style="width: 55px;" data-field="y" data-step-id="${step.id}" value="${step.y}" />
          </div>
          <div style="display:flex; align-items:center; gap:3px; margin-left:auto;">
            <span class="step-key-label" title="前面に出るのを待つ時間">待機</span>
            <input type="number" class="step-input" style="width: 48px;" data-field="settleBefore" data-step-id="${step.id}" value="${step.settleBefore}" step="0.1" min="0" />
            <span class="step-key-label">s</span>
          </div>
        </div>
      </div>
    `;
    editorContent = "";
  } else if (step.kind === "focus") {
    displayContent = `
      <div class="step-key-label-group">
        <input type="text" class="step-input" style="flex:1;" data-field="appName" data-step-id="${step.id}" value="${escapeHtml(step.appName || "")}" placeholder="アプリ名 (前面に出す)" />
        <button type="button" class="btn-ghost btn-small" data-action="select-app" data-step-id="${step.id}" style="padding: 4px 8px!important; font-size: 0.7rem!important;">選択</button>
        <input type="file" id="file-app-${step.id}" webkitdirectory directory style="display:none;" />
      </div>
    `;
    editorContent = "";
  } else if (step.kind === "check") {
    displayContent = `
      <div class="step-key-label-group">
        <input type="text" class="step-input" data-field="text" data-step-id="${step.id}" value="${escapeHtml(step.text || "")}" placeholder="検知するテキストを入力..." />
      </div>
    `;
    editorContent = "";
  } else if (step.kind === "jump") {
    const stepOptions = state.flowSteps
      .map(
        (s, i) =>
          `<option value="${s.id}" ${step.targetId === s.id ? "selected" : ""}>Step ${i + 1}: ${escapeHtml(s.title || s.kind)}</option>`,
      )
      .join("");

    let targetDesc = getStepLabelById(step.targetId) || "未設定";

    displayContent = `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div class="step-key-label-group" style="flex-wrap: wrap;">
          <span class="step-key-label" style="min-width: 60px;">移動先:</span>
          <select class="step-input" data-field="targetId" data-step-id="${step.id}" style="width: auto;">
            <option value="">-- ステップ選択 --</option>
            ${stepOptions}
          </select>
        </div>
        <div class="flow-summary-bar">
          <span>ジャンプ</span>
          <span class="flow-summary-arrow">➔</span>
          <span class="flow-summary-target">${targetDesc} へ</span>
        </div>
      </div>
    `;
    editorContent = "";
  } else if (step.kind === "stop") {
    displayContent = `
      <div class="step-key-label-group">
        <span class="step-key-label">このステップで実行を停止します</span>
      </div>
    `;
    editorContent = "";
  } else {
    displayContent = `
      <div class="step-key-label-group">
        <span class="step-key-label">入力キー:</span>
        <span class="step-key-badge">${step.key ? keyToDisplay(step.key) : "未設定"}</span>
      </div>
    `;
    editorContent = `<button type="button" class="record-btn btn-small${state.recordingStepId === step.id ? " recording" : ""}" data-action="record-step" data-step-id="${step.id}">
         ${state.recordingStepId === step.id ? "入力待ち..." : "記録"}
       </button>`;
  }

  const badgeLabel =
    step.kind === "move"
      ? step.moveHotkey === "ipadMove"
        ? "iPad"
        : "iPhone"
      : step.kind === "click"
        ? "CLICK"
        : step.kind === "focus"
          ? "FOCUS"
          : step.kind === "check"
            ? "CHECK"
            : step.kind === "jump"
              ? "JUMP"
              : step.kind === "stop"
                ? "STOP"
                : "KEY";

  const kindClass =
    step.kind === "move"
      ? step.moveHotkey === "ipadMove"
        ? "move"
        : "iphone"
      : step.kind === "click"
        ? "click"
        : step.kind === "focus"
          ? "focus"
          : step.kind === "check"
            ? "check"
            : step.kind === "jump"
              ? "jump"
              : step.kind === "stop"
                ? "stop"
                : "key";

  return `
    <article class="flow-step ${kindClass}${state.selectedStepId === step.id ? " selected" : ""}" draggable="true" data-step-id="${step.id}">
      <div class="flow-step-header">
        <div class="flow-step-title">
          <span class="flow-index">${stepNum}</span>
          ${icon}
          <span class="flow-kind flow-kind-${kindClass}">${badgeLabel}</span>
          <input type="text" class="step-title-input" data-field="title" data-step-id="${step.id}" value="${escapeHtml(step.title || "")}" placeholder="アクション名" />
        </div>
        <button type="button" class="icon-btn" data-action="delete" data-step-id="${step.id}" title="削除">
          <svg pointer-events="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="flow-step-body">
        <div class="flow-value-container">
          ${displayContent}
        </div>
        <div class="flow-edit-inline">
          ${editorContent}
        </div>
      </div>
    </article>
  `;
}

function renderFlowStepsRecursive(
  steps,
  isTopLevel = false,
  branchWaitInfo = null,
  startIndex = 1,
) {
  const nodes = [];
  let currentIdx = startIndex;

  steps.forEach((raw, index) => {
    const step = normalizeStep(raw);
    const stepNum = currentIdx++;
    const hasNext = index < steps.length - 1;

    const okEndsStop =
      step.kind === "check" &&
      step.okBranch &&
      step.okBranch.length > 0 &&
      (step.okBranch[step.okBranch.length - 1].kind === "stop" ||
        step.okBranch[step.okBranch.length - 1].kind === "jump");
    const ngEndsStop =
      step.kind === "check" &&
      step.ngBranch &&
      step.ngBranch.length > 0 &&
      (step.ngBranch[step.ngBranch.length - 1].kind === "stop" ||
        step.ngBranch[step.ngBranch.length - 1].kind === "jump");
    const isStopStep =
      step.kind === "stop" ||
      (step.kind === "check" && okEndsStop && ngEndsStop);

    const stepCardHtml = renderStepCard(step, stepNum);

    if (step.kind !== "check") {
      nodes.push(stepCardHtml);
    }

    if (step.kind === "check") {
      const { html: okHtml, nextIdx: nextIdxAfterOk } =
        renderFlowStepsRecursive(
          step.okBranch || [],
          false,
          {
            value: step.okWaitAfter,
            parentStepId: step.id,
            field: "okWaitAfter",
          },
          currentIdx,
        );
      currentIdx = nextIdxAfterOk;

      const { html: ngHtml, nextIdx: nextIdxAfterNg } =
        renderFlowStepsRecursive(
          step.ngBranch || [],
          false,
          {
            value: step.ngWaitAfter,
            parentStepId: step.id,
            field: "ngWaitAfter",
          },
          currentIdx,
        );
      currentIdx = nextIdxAfterNg;

      let mergeClass = "";
      if (okEndsStop && ngEndsStop) mergeClass = " both-ends";
      else if (okEndsStop) mergeClass = " ok-ends";
      else if (ngEndsStop) mergeClass = " ng-ends";

      const okBeforeConnector = `
        <div class="flow-connector is-branch">
          <div class="flow-connector-pill">
            <span class="flow-connector-dot"></span>
            待機
            <input data-field="okWaitBefore" data-step-id="${step.id}" type="number" min="0" step="0.05" value="${(step.okWaitBefore ?? 0.5).toFixed(2)}" />
            s
          </div>
        </div>
      `;
      const ngBeforeConnector = `
        <div class="flow-connector is-branch">
          <div class="flow-connector-pill">
            <span class="flow-connector-dot"></span>
            待機
            <input data-field="ngWaitBefore" data-step-id="${step.id}" type="number" min="0" step="0.05" value="${(step.ngWaitBefore ?? 0.5).toFixed(2)}" />
            s
          </div>
        </div>
      `;

      nodes.push(`
        <div class="flow-check-block${mergeClass}">
          <div class="flow-check-card">
            ${stepCardHtml}
          </div>
          <div class="flow-split" data-parent-check-id="${step.id}">
            <div class="flow-split-col ok${state.selectedBranch && state.selectedBranch.checkId === step.id && state.selectedBranch.branchType === "ok" ? " selected" : ""}${okEndsStop ? " ends-stop" : ""}" data-branch-type="ok" data-parent-id="${step.id}">
              <div class="flow-split-header">✅ OK (見つかった時)</div>
              ${okBeforeConnector}
              ${okHtml || `<div class="flow-split-empty">ここにドロップ</div>`}
              ${okEndsStop ? "" : `<div class="flow-branch-filler"></div>`}
            </div>
            <div class="flow-split-col ng${state.selectedBranch && state.selectedBranch.checkId === step.id && state.selectedBranch.branchType === "ng" ? " selected" : ""}${ngEndsStop ? " ends-stop" : ""}" data-branch-type="ng" data-parent-id="${step.id}">
              <div class="flow-split-header">❌ NG (見つからない時)</div>
              ${ngBeforeConnector}
              ${ngHtml || `<div class="flow-split-empty">ここにドロップ</div>`}
              ${ngEndsStop ? "" : `<div class="flow-branch-filler"></div>`}
            </div>
          </div>
          <div class="flow-merge${mergeClass}" data-rendered-from="merge">
            <span class="flow-merge-pill">↓ メインフローに合流</span>
          </div>
        </div>
      `);
    }

    if (isStopStep) {
      // No connector
    } else if (!hasNext) {
      if (isTopLevel && txt("enableLoop", "true") === "true") {
        const waitSeconds = step.waitAfter ?? defaultWaitSecondsForIndex(index);
        nodes.push(`
          <div class="flow-connector">
            <div class="flow-connector-pill">
              <span class="flow-connector-dot"></span>
              待機
              <input data-field="waitAfter" data-step-id="${step.id}" type="number" min="0" step="0.05" value="${waitSeconds.toFixed(2)}" />
              s
            </div>
          </div>
          <div class="flow-loop-connector">
            <div class="flow-connector-pill" style="background: #f0f9ff; border-color: #bae6fd; color: #0369a1; padding: 6px 16px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              最初に戻ってループ
            </div>
          </div>
        `);
      }
    } else if (step.kind !== "check") {
      const waitSeconds = step.waitAfter ?? defaultWaitSecondsForIndex(index);
      nodes.push(`
        <div class="flow-connector">
          <div class="flow-connector-pill">
            <span class="flow-connector-dot"></span>
            待機
            <input data-field="waitAfter" data-step-id="${step.id}" type="number" min="0" step="0.05" value="${waitSeconds.toFixed(2)}" />
            s
          </div>
        </div>
      `);
    }

    if (branchWaitInfo && !hasNext && !isStopStep && step.kind !== "jump") {
      nodes.push(`
        <div class="flow-connector is-branch">
          <div class="flow-connector-pill">
            <span class="flow-connector-dot"></span>
            待機
            <input data-field="${branchWaitInfo.field}" data-step-id="${branchWaitInfo.parentStepId}" type="number" min="0" step="0.05" value="${(branchWaitInfo.value ?? 0.5).toFixed(2)}" />
            s
          </div>
        </div>
      `);
    }
  });

  return { html: nodes.join(""), nextIdx: currentIdx };
}

export function updateFlowPreview() {
  const track = document.getElementById("flowTrack");
  if (!track) return;
  const { html } = renderFlowStepsRecursive(state.flowSteps, true);
  track.innerHTML = html;

  // レールの長さを動的に調整する処理は廃止（CSSセグメント方式へ移行）
  requestAnimationFrame(() => {});
}

export function updateMiniFlow() {
  const container = document.getElementById("miniFlow");
  if (!container) return;
  container.innerHTML = "";

  function getStepsFlat(steps) {
    let res = [];
    steps.forEach((s) => {
      res.push(s);
      if (s.kind === "check") {
        res = res.concat(getStepsFlat(s.okBranch || []));
        res = res.concat(getStepsFlat(s.ngBranch || []));
      }
    });
    return res;
  }

  const flat = getStepsFlat(state.flowSteps);
  flat.forEach((step, idx) => {
    if (idx > 0) {
      const arrow = document.createElement("span");
      arrow.className = "mini-arrow";
      arrow.textContent = "→";
      container.appendChild(arrow);
    }

    const item = document.createElement("div");
    const kindClass =
      step.kind === "move"
        ? step.moveHotkey === "ipadMove"
          ? "move"
          : "iphone"
        : step.kind;
    item.className = `mini-step mini-step-${kindClass}`;

    let iconHtml = icons.key;
    if (step.kind === "move")
      iconHtml = step.moveHotkey === "ipadMove" ? icons.ipad : icons.iphone;
    else if (step.kind === "click") iconHtml = icons.click;
    else if (step.kind === "focus") iconHtml = icons.focus;
    else if (step.kind === "check") iconHtml = icons.check;
    else if (step.kind === "jump") iconHtml = icons.jump;
    else if (step.kind === "stop") iconHtml = icons.stop;

    item.innerHTML = `${iconHtml} <span>${step.title || step.kind.toUpperCase()}</span>`;
    container.appendChild(item);
  });
}

export function renderHotkeys() {
  Object.keys(hotkeys).forEach((id) => {
    const displayId = hotkeyDisplayIds[id];
    const el = document.getElementById(displayId);
    if (el) {
      if (state.recordingTarget === id) {
        el.value = "入力待ち...";
        el.classList.add("recording");
      } else {
        el.value = hotkeyToDisplay(state.globalSettings[id] || hotkeys[id]);
        el.classList.remove("recording");
      }
    }

    const btn = document.querySelector(`.record-btn[data-hotkey="${id}"]`);
    if (btn) {
      if (state.recordingTarget === id) {
        btn.textContent = "停止";
        btn.classList.add("recording");
      } else {
        btn.textContent = "記録";
        btn.classList.remove("recording");
      }
    }
  });
}

export function updateProjectTabs(
  projects = state.projects,
  activeProjectId = state.activeProjectId,
  onSelect,
  onAdd,
) {
  const container = document.getElementById("projectTabs");
  if (!container || !projects) return;
  container.innerHTML = "";

  const selectCb =
    onSelect ||
    ((id) => {
      if (id === state.activeProjectId) return;
      window.loadProjectState(id);
    });
  const addCb =
    onAdd ||
    (() => {
      const name = prompt("新しいプロジェクト名", "New Project");
      if (name) window.createNewProject(name);
    });

  // プロジェクトの順序が未設定の場合は、現在のキーから作成
  if (state.projectOrder.length === 0 && Object.keys(projects).length > 0) {
    state.projectOrder = Object.keys(projects);
  }

  state.projectOrder.forEach((id) => {
    const p = projects[id];
    if (!p) return;

    const tab = document.createElement("div");
    tab.className = `tab${id === activeProjectId ? " active" : ""}`;
    tab.dataset.id = id;
    tab.draggable = true;

    const nameSpan = document.createElement("span");
    nameSpan.className = "tab-name";
    nameSpan.textContent = p.name;
    nameSpan.title = "ダブルクリックで名前変更";
    nameSpan.addEventListener("click", () => selectCb(id));
    nameSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (typeof window.renameProject === "function") {
        window.renameProject(id);
      }
    });

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "削除";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof window.deleteProject === "function") {
        window.deleteProject(id);
      }
    });

    tab.appendChild(nameSpan);
    tab.appendChild(closeBtn);

    // ドラッグ＆ドロップのイベント
    tab.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", id);
      tab.classList.add("dragging");
    });
    tab.addEventListener("dragover", (e) => {
      e.preventDefault();
      tab.classList.add("drag-over");
    });
    tab.addEventListener("dragleave", () => {
      tab.classList.remove("drag-over");
    });
    tab.addEventListener("dragend", () => {
      tab.classList.remove("dragging");
      container
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("drag-over"));
    });
    tab.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      if (draggedId !== id && typeof window.reorderProjects === "function") {
        window.reorderProjects(draggedId, id);
      }
    });

    container.appendChild(tab);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "tab tab-add";
  addBtn.innerHTML = "+";
  addBtn.title = "新規プロジェクト";
  addBtn.addEventListener("click", addCb);
  container.appendChild(addBtn);
}

export function setStatus(msg, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? "error" : "ok";
}

export async function updateMermaidGraph() {
  const container = document.getElementById("mermaidContainer");
  const graphView = document.getElementById("viewGraph");
  if (!container || !graphView || graphView.style.display === "none") return;

  if (state.flowSteps.length === 0) {
    container.innerHTML = "ステップがありません";
    return;
  }

  const lines = ["graph TD"];
  const getTargetNodeId = (id) => (id ? "s" + id : null);

  state.flowSteps.forEach((step, index) => {
    const s = normalizeStep(step);
    const nodeId = "s" + s.id;
    const labelText = `Step ${index + 1}: ${s.title || s.kind}`;

    let shape;
    if (s.kind === "check") shape = `{"${labelText}"}`;
    else if (s.kind === "stop") shape = `(("${labelText}"))`;
    else shape = `["${labelText}"]`;
    lines.push(`  ${nodeId}${shape}`);
  });

  state.flowSteps.forEach((step, index) => {
    const s = normalizeStep(step);
    const nodeId = "s" + s.id;
    if (s.kind === "stop") return;

    if (s.kind === "jump") {
      const tgtId = getTargetNodeId(s.targetId);
      if (tgtId) lines.push(`  ${nodeId} -.-> ${tgtId}`);
    } else if (s.kind === "check") {
      const nextMainId =
        index < state.flowSteps.length - 1
          ? "s" + state.flowSteps[index + 1].id
          : null;

      const addBranch = (branch, prefix, label) => {
        if (!branch || branch.length === 0) {
          if (nextMainId)
            lines.push(`  ${nodeId} -- ${label} --> ${nextMainId}`);
          return;
        }
        lines.push(`  ${nodeId} -- ${label} --> ${prefix}_${branch[0].id}`);
        branch.forEach((bs, bi) => {
          const bNodeId = `${prefix}_${bs.id}`;
          lines.push(`  ${bNodeId}["${bs.title || bs.kind}"]`);
          if (bi < branch.length - 1) {
            lines.push(`  ${bNodeId} --> ${prefix}_${branch[bi + 1].id}`);
          } else if (nextMainId) {
            lines.push(`  ${bNodeId} --> ${nextMainId}`);
          }
        });
      };

      addBranch(s.okBranch, nodeId + "_ok", "OK");
      addBranch(s.ngBranch, nodeId + "_ng", "NG");
    } else {
      if (index < state.flowSteps.length - 1) {
        lines.push(`  ${nodeId} --> s${state.flowSteps[index + 1].id}`);
      } else if (txt("enableLoop", "true") === "true") {
        lines.push(`  ${nodeId} -.-> s${state.flowSteps[0].id}`);
      }
    }
  });

  const graphCode = lines.join("\n");
  const oldSvg = document.getElementById("mermaid-graph-svg");
  if (oldSvg) oldSvg.remove();

  try {
    const result = await mermaid.render("mermaid-graph-svg", graphCode);
    container.innerHTML = result.svg || result;
  } catch (e) {
    console.error("Mermaid rendering failed", e);
    container.innerHTML = "グラフの生成に失敗しました。";
  }
}
