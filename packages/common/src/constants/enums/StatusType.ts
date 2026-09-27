export const STATUS_TYPE = {
  NOT_STARTED: "Not Started",
  ACTIVE: "Active",
  CLOSED: "Closed",
} as const;

export type StatusType = (typeof STATUS_TYPE)[keyof typeof STATUS_TYPE];
