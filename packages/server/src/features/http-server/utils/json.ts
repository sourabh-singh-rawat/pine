import type { HttpResponse } from "../types";

export const json = <TData>(data: TData, status = 200): HttpResponse => ({
  status,
  body: { data },
});
