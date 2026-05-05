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
    // mermaid は global に存在することを期待
    const result = await mermaid.render("mermaid-graph-svg", graphCode);
    container.innerHTML = result.svg || result;
  } catch (e) {
    console.error("Mermaid rendering failed", e);
    container.innerHTML = "グラフの生成に失敗しました。";
  }
}
