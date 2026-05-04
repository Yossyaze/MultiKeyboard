import { state, flushActiveProject } from './state.js';
import { hotkeys, NEW_STORAGE_KEY, OLD_STORAGE_KEY } from './constants.js';

export function saveToStorage() {
  flushActiveProject();
  state.globalSettings.reloadHotkey = hotkeys.reload;
  state.globalSettings.ipadMove = hotkeys.ipadMove;
  state.globalSettings.iphoneMove = hotkeys.iphoneMove;
  state.globalSettings.stopAllHotkey = hotkeys.stopAll;
  const data = {
    activeProjectId: state.activeProjectId,
    projects: state.projects,
    globalSettings: state.globalSettings,
    projectOrder: state.projectOrder,
  };
  localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(data));
}

export function loadFromStorage(callbacks) {
  const newJson = localStorage.getItem(NEW_STORAGE_KEY);
  if (newJson) {
    try {
      const data = JSON.parse(newJson);
      state.projects = data.projects || {};
      state.projectOrder = data.projectOrder || Object.keys(state.projects);
      const savedActiveId = data.activeProjectId;
      if (data.globalSettings) {
        if (data.globalSettings.reloadHotkey) {
          state.globalSettings.reloadHotkey = data.globalSettings.reloadHotkey;
          hotkeys.reload = state.globalSettings.reloadHotkey;
        }
        if (data.globalSettings.ipadMove) {
          state.globalSettings.ipadMove = data.globalSettings.ipadMove;
          hotkeys.ipadMove = state.globalSettings.ipadMove;
        }
        if (data.globalSettings.iphoneMove) {
          state.globalSettings.iphoneMove = data.globalSettings.iphoneMove;
          hotkeys.iphoneMove = state.globalSettings.iphoneMove;
        }
        if (data.globalSettings.stopAllHotkey) {
          state.globalSettings.stopAllHotkey = data.globalSettings.stopAllHotkey;
          hotkeys.stopAll = state.globalSettings.stopAllHotkey;
        }
      }
      if (savedActiveId && state.projects[savedActiveId]) {
        callbacks.loadProjectState(savedActiveId);
      } else {
        const firstKey = Object.keys(state.projects)[0];
        if (firstKey) callbacks.loadProjectState(firstKey);
      }
      return true;
    } catch (e) {
      console.error("Failed to load new storage format", e);
    }
  }

  // Fallback/Migration from old storage
  const oldJson = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldJson) {
    try {
      const oldData = JSON.parse(oldJson);
      const defaultId = "proj-" + Date.now();
      state.projects[defaultId] = {
        id: defaultId,
        name: "Default Project",
        hotkeys: oldData.hotkeys || {},
        flowSteps: oldData.flowSteps || [],
        config: oldData.config || {},
        stepIdSeq: oldData.stepIdSeq || 1,
        templateStepIds: oldData.templateStepIds || {},
      };
      if (oldData.hotkeys) {
        if (oldData.hotkeys.reload) {
          state.globalSettings.reloadHotkey = oldData.hotkeys.reload;
          hotkeys.reload = oldData.hotkeys.reload;
        }
        if (oldData.hotkeys.ipadMove) {
          state.globalSettings.ipadMove = oldData.hotkeys.ipadMove;
          hotkeys.ipadMove = oldData.hotkeys.ipadMove;
        }
        if (oldData.hotkeys.iphoneMove) {
          state.globalSettings.iphoneMove = oldData.hotkeys.iphoneMove;
          hotkeys.iphoneMove = oldData.hotkeys.iphoneMove;
        }
      }
      state.activeProjectId = defaultId;
      callbacks.loadProjectState(defaultId);
      saveToStorage();
      return true;
    } catch (e) {
      console.error("Failed to migrate from old storage", e);
    }
  }
  return false;
}
