import { state, normalizeStep } from "./state.js";
import { txt } from "./utils.js";

/**
 * Mermaid.jsを使用してフロー図（グラフ）を生成し描画する
 */
export async function updateMermaidGraph() {
  const container = document.getElementById("mermaidContainer");
  const graphView = document.getElementById("viewGraph");
  if (!container || !graphView || graphView.style.display === "none") return;

  if (state.flowSteps.length === 0) {
    container.innerHTML = "ステップがありません";
    return;
  }

  // 1. 全ステップを走査して、エディタと一致するステップ番号を割り当てる
  const stepIdToNum = new Map();
  let currentNum = 1;

  const walkForNumbering = (steps) => {
    steps.forEach((raw) => {
      const s = normalizeStep(raw);
      stepIdToNum.set(s.id, currentNum++);
      if (s.kind === "check") {
        walkForNumbering(s.okBranch || []);
        walkForNumbering(s.ngBranch || []);
      }
    });
  };
  walkForNumbering(state.flowSteps);

  const lines = ["graph TD"];

  // 2. ノードの定義（形状とラベル）を再帰的に生成
  const generateNodes = (steps) => {
    steps.forEach((raw) => {
      const s = normalizeStep(raw);
      const nodeId = `s${s.id}`;
      const stepNum = stepIdToNum.get(s.id) || "?";
      const labelText = `Step ${stepNum}: ${s.title || s.kind}`;

      let shape;
      if (s.kind === "check") shape = `{"${labelText}"}`;
      else if (s.kind === "stop") shape = `(("${labelText}"))`;
      else shape = `["${labelText}"]`;
      
      lines.push(`  ${nodeId}${shape}`);

      if (s.kind === "check") {
        generateNodes(s.okBranch || []);
        generateNodes(s.ngBranch || []);
      }
    });
  };
  generateNodes(state.flowSteps);

  // 3. 接続（矢印）を再帰的に生成
  const generateConnections = (steps, nextNodeIdAfterBranch = null) => {
    steps.forEach((raw, index) => {
      const s = normalizeStep(raw);
      const nodeId = `s${s.id}`;
      const isLast = index === steps.length - 1;
      const nextInSameLevel = !isLast ? `s${normalizeStep(steps[index + 1]).id}` : null;
      // ブランチが終わった後に戻るべきノード
      const returnToId = nextInSameLevel || nextNodeIdAfterBranch;

      if (s.kind === "stop") {
        return; // STOPは次へ繋がない
      }

      if (s.kind === "jump") {
        if (s.targetId) {
          lines.push(`  ${nodeId} -.-> s${s.targetId}`);
        }
      } else if (s.kind === "check") {
        // OKブランチの接続
        if (s.okBranch && s.okBranch.length > 0) {
          lines.push(`  ${nodeId} -- OK --> s${s.okBranch[0].id}`);
          generateConnections(s.okBranch, returnToId);
        } else if (returnToId) {
          lines.push(`  ${nodeId} -- OK --> ${returnToId}`);
        }

        // NGブランチの接続
        if (s.ngBranch && s.ngBranch.length > 0) {
          lines.push(`  ${nodeId} -- NG --> s${s.ngBranch[0].id}`);
          generateConnections(s.ngBranch, returnToId);
        } else if (returnToId) {
          lines.push(`  ${nodeId} -- NG --> ${returnToId}`);
        }
      } else {
        // 通常のステップ
        if (nextInSameLevel) {
          lines.push(`  ${nodeId} --> ${nextInSameLevel}`);
        } else if (isLast) {
          if (nextNodeIdAfterBranch) {
            // 合流先へ接続（ループバックを含む）
            if (nextNodeIdAfterBranch.startsWith("s") && nextNodeIdAfterBranch === `s${state.flowSteps[0].id}`) {
              lines.push(`  ${nodeId} -.-> ${nextNodeIdAfterBranch}`);
            } else {
              lines.push(`  ${nodeId} --> ${nextNodeIdAfterBranch}`);
            }
          }
        }
      }
    });
  };

  const isLoopEnabled = document.getElementById("enableLoop")?.checked;
  const firstNodeId = `s${state.flowSteps[0].id}`;
  const endNodeId = "endNode";

  if (!isLoopEnabled) {
    lines.push(`  ${endNodeId}(("実行終了"))`);
    lines.push(`  style ${endNodeId} fill:#fef2f2,stroke:#fecaca,color:#991b1b`);
  }

  generateConnections(state.flowSteps, isLoopEnabled ? firstNodeId : endNodeId);

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
