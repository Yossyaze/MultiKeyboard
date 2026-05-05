/**
 * 状態の履歴管理を行うクラス
 */
export class HistoryManager {
  constructor(maxHistory = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
  }

  /**
   * 現在の状態を履歴に保存する
   * @param {Object} state 保存する状態オブジェクト
   */
  push(state) {
    // 状態をディープコピーして保存
    const stateCopy = JSON.parse(JSON.stringify(state));
    
    // 直前の履歴と同じなら保存しない
    if (this.undoStack.length > 0) {
      const last = this.undoStack[this.undoStack.length - 1];
      if (JSON.stringify(last) === JSON.stringify(stateCopy)) {
        return;
      }
    }

    this.undoStack.push(stateCopy);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    
    // 新しい操作が行われたらRedoスタックはクリアする
    this.redoStack = [];
  }

  /**
   * Undoを実行し、前の状態を返す
   * @param {Object} currentState 現在の状態（Redo用に保存するため）
   * @returns {Object|null} 前の状態、または履歴がない場合はnull
   */
  undo(currentState) {
    if (this.undoStack.length === 0) return null;

    const prevState = this.undoStack.pop();
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    
    if (this.redoStack.length > this.maxHistory) {
      this.redoStack.shift();
    }

    return prevState;
  }

  /**
   * Redoを実行し、次の状態を返す
   * @param {Object} currentState 現在の状態（Undo用に保存するため）
   * @returns {Object|null} 次の状態、または履歴がない場合はnull
   */
  redo(currentState) {
    if (this.redoStack.length === 0) return null;

    const nextState = this.redoStack.pop();
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));

    return nextState;
  }

  /**
   * 履歴をクリアする
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Undoが可能かどうか
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Redoが可能かどうか
   */
  canRedo() {
    return this.redoStack.length > 0;
  }
}
