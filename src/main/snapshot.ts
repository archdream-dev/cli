// Backward-compatible barrel — prefer imports from domains/*
export {
  getCustomDir,
  getCustomScopes,
  isBuiltinScope,
  countSnapshotsInScope,
  removeScope,
  renameScope,
} from "./domains/scope/scope.js";
export {
  snapshotToArchitecture,
  saveArchitecture,
  listCustomSnapshots,
  removeSnapshot,
  type CustomSnapshot,
} from "./domains/snapshot/snapshot.js";
