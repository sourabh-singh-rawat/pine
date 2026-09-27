import { STATUS_TYPE } from "@pine/common/constants";

export const DEFAULT_COLOR = "#64748B";

export const STATUS_TYPE_OPTIONS = Object.values(STATUS_TYPE).map((value) => ({
  id: value,
  name: value,
}));

export type StatusRow = {
  id: string;
  name: string;
  type: string;
  color: string;
  orderIndex: number;
};

export type DraftStatus = {
  name: string;
  type: string;
  color: string;
};

export const emptyDraft = (): DraftStatus => ({
  name: "",
  type: STATUS_TYPE.ACTIVE,
  color: DEFAULT_COLOR,
});

export const toStatusRow = (value: {
  id: string | null;
  name: string | null;
  type: string | null;
  color: string | null;
  orderIndex: number | null;
}): StatusRow | null => {
  if (
    !value.id ||
    !value.name ||
    !value.type ||
    !value.color ||
    value.orderIndex === null ||
    value.orderIndex === undefined
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    type: value.type,
    color: value.color,
    orderIndex: value.orderIndex,
  };
};
