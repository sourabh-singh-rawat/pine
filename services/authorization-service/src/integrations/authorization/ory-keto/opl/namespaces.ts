import { Context, Namespace } from "@ory/keto-namespace-types";

export class Identity implements Namespace {}

export class Profile implements Namespace {
  related: {
    identity: Identity[];
  };

  permits = {
    read: (ctx: Context) => this.related.identity.includes(ctx.subject),
    update: (ctx: Context) => this.related.identity.includes(ctx.subject),
  };
}

export class Platform implements Namespace {
  related: {
    owners: Identity[];
    admins: Identity[];
    members: Identity[];
  };

  permits = {
    read: (ctx: Context) =>
      this.related.owners.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.members.includes(ctx.subject),
    create_tenant: (ctx: Context) =>
      this.related.owners.includes(ctx.subject) || this.related.admins.includes(ctx.subject),
    manage_admins: (ctx: Context) => this.related.owners.includes(ctx.subject),
  };
}

export class Tenant implements Namespace {
  related: {
    owners: Identity[];
    admins: Identity[];
    members: Identity[];
  };

  permits = {
    read: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject),
    read_list: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject),
    configure: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) || this.related.owners.includes(ctx.subject),
    manage_members: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) || this.related.owners.includes(ctx.subject),
    create_organization: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) || this.related.owners.includes(ctx.subject),
    manage_organization_types: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) || this.related.owners.includes(ctx.subject),
    administer: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) || this.related.owners.includes(ctx.subject),
    assign_admin: (ctx: Context) => this.related.owners.includes(ctx.subject),
    assign_owner: (ctx: Context) => this.related.owners.includes(ctx.subject),
    suspend: (ctx: Context) => this.related.owners.includes(ctx.subject),
    delete: (ctx: Context) => this.related.owners.includes(ctx.subject),
  };
}

export class Organization implements Namespace {
  related: {
    owners: Identity[];
    admins: Identity[];
    members: Identity[];
    tenant: Tenant[];
    parents: Organization[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)) ||
      this.related.parents.traverse((item) => item.permits.read(ctx)),
    update: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    manage_members: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    create_space: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    create_list: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    delete: (ctx: Context) =>
      this.related.owners.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.related.owners.includes(ctx.subject)),
  };
}

export class Space implements Namespace {
  related: {
    owners: Identity[];
    admins: Identity[];
    members: Identity[];
    organization: Organization[];
  };

  permits = {
    read: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.read(ctx)),
    update: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.update(ctx)),
    manage_members: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.manage_members(ctx)),
    create_list: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.create_list(ctx)),
    delete: (ctx: Context) =>
      this.related.owners.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.delete(ctx)),
  };
}

export class List implements Namespace {
  related: {
    owners: Identity[];
    admins: Identity[];
    members: Identity[];
    space: Space[];
  };

  permits = {
    read: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.read(ctx)),
    update: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.update(ctx)),
    manage_members: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.manage_members(ctx)),
    create_item: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.create_list(ctx)),
    delete: (ctx: Context) =>
      this.related.owners.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.delete(ctx)),
  };
}

export class Item implements Namespace {
  related: {
    owners: Identity[];
    admins: Identity[];
    members: Identity[];
    list: List[];
  };

  permits = {
    read: (ctx: Context) =>
      this.related.members.includes(ctx.subject) ||
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.read(ctx)),
    update: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.update(ctx)),
    manage_members: (ctx: Context) =>
      this.related.admins.includes(ctx.subject) ||
      this.related.owners.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.manage_members(ctx)),
    delete: (ctx: Context) =>
      this.related.owners.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.delete(ctx)),
  };
}

export class Role implements Namespace {
  related: {
    members: Identity[];
  };
}

export class Permission implements Namespace {
  related: {
    has: Role[];
  };
}
