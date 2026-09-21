export type PineAppId = "items";

export type PineApp = {
  id: PineAppId;
  label: string;
  isActive: (pathname: string) => boolean;
};

export const PINE_APPS: readonly PineApp[] = [
  {
    id: "items",
    label: "Item Tracker",
    isActive: (pathname) =>
      pathname === "/home" || pathname.startsWith("/i/") || pathname.startsWith("/v/"),
  },
];

export const getActiveApp = (pathname: string): PineApp | undefined =>
  PINE_APPS.find((app) => app.isActive(pathname));

export const appShowsSidebar = (app: PineApp | undefined): boolean => app?.id === "items";
