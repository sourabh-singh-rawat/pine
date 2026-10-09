import Type from "typebox";

export const GraphNamespaceSchema = Type.Union([
  Type.Literal("Identity"),
  Type.Literal("Profile"),
  Type.Literal("Platform"),
  Type.Literal("Tenant"),
  Type.Literal("Organization"),
  Type.Literal("Space"),
  Type.Literal("List"),
  Type.Literal("Item"),
  Type.Literal("Role"),
  Type.Literal("Permission"),
]);
