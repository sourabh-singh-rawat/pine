import { createFileRoute } from "@tanstack/react-router";
import { ItemPage } from "@features/item";

export const Route = createFileRoute("/_authenticated/i/$itemId")({
  component: ItemPage,
});
