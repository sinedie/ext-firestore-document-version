import { DocumentSnapshot, FieldValue } from "firebase-admin/firestore";
import {
  restoreField,
  undoField,
  redoField,
  gotoField,
  versionField,
  historyPath,
} from "./config";
import { logger } from "firebase-functions";

export function isRestoring(document: DocumentSnapshot) {
  return document.get(restoreField) !== undefined;
}

export function isUndoing(document: DocumentSnapshot) {
  return document.get(undoField) !== undefined;
}

export function isRedoing(document: DocumentSnapshot) {
  return document.get(redoField) !== undefined;
}

export function isGoingTo(document: DocumentSnapshot) {
  return document.get(gotoField) !== undefined;
}

export function canRedo(document: DocumentSnapshot) {
  return document.get(versionField) !== undefined;
}

export function isHistoryTransaction(document: DocumentSnapshot) {
  return (
    isUndoing(document) ||
    isRedoing(document) ||
    isGoingTo(document) ||
    isRestoring(document)
  );
}

export function getHistoryPath(document: DocumentSnapshot) {
  return `${historyPath}/${document.ref.path
    .split("/")
    .map((x, i) => (i % 2 != 0 ? x : `${x}_history`))
    .join("/")}`;
}

export function getHistoryPathVersion(document: DocumentSnapshot) {
  return `${getHistoryPath(document)}/versions_history`;
}

export async function cleanFlags(
  document: DocumentSnapshot,
  flags = [undoField, redoField, gotoField, restoreField, versionField]
) {
  try {
    logger.log(`Cleaning history change flags on (${document.ref.path})`);
    await document.ref.update(deletedHistoryFlags(flags));
    logger.log("DONE");
  } catch (error) {
    logger.error(
      `ERROR cleaning history change flags on (${document.ref.path})`,
      error
    );
    throw error;
  }
}

export function deletedHistoryFlags(
  flags = [undoField, redoField, gotoField, restoreField, versionField],
  value = FieldValue.delete()
) {
  return Object.fromEntries(flags.map((flag) => [flag, value]));
}
