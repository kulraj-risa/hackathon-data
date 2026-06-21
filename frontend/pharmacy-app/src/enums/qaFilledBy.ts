export enum QaFilledBy {
  MANUAL = "manual",
  BOT = "bot",
  NOT_NEEDED = "not_needed",
}

export const QaFilledByLabels: Record<QaFilledBy, string> = {
  [QaFilledBy.MANUAL]: "Manual",
  [QaFilledBy.BOT]: "Bot",
  [QaFilledBy.NOT_NEEDED]: "Not needed",
};
