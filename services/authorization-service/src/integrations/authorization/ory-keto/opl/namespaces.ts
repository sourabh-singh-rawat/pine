import { Context, Namespace } from "@ory/keto-namespace-types";

export class Identity implements Namespace {}

export class Profile implements Namespace {
  related: {
    identity: Identity[];
  };

  permits = {
    read: (ctx: Context): boolean => this.related.identity.includes(ctx.subject),
    update: (ctx: Context): boolean => this.related.identity.includes(ctx.subject),
  };
}

export class Platform implements Namespace {
  related: {
    admin: Identity[];
    member: Identity[];
    tenant: Tenant[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) || this.related.member.includes(ctx.subject),
    create_tenant: (ctx: Context): boolean => this.related.admin.includes(ctx.subject),
    manage_admins: (ctx: Context): boolean => this.related.admin.includes(ctx.subject),
  };
}

export class Tenant implements Namespace {
  related: {
    owner: Identity[];
    admin: Identity[];
    member: Identity[];
    platform: Platform[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.permits.read(ctx)),
    read_list: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.permits.read(ctx)),
    configure: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.related.admin.includes(ctx.subject)),
    manage_members: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.related.admin.includes(ctx.subject)),
    create_organization: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) || this.related.owner.includes(ctx.subject),
    manage_office_types: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) || this.related.owner.includes(ctx.subject),
    administer: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) || this.related.owner.includes(ctx.subject),
    assign_admin: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.related.admin.includes(ctx.subject)),
    assign_owner: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.related.admin.includes(ctx.subject)),
    suspend: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.related.admin.includes(ctx.subject)),
    delete: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.platform.traverse((item) => item.related.admin.includes(ctx.subject)),
  };
}

export class Organization implements Namespace {
  related: {
    owner: Identity[];
    admin: Identity[];
    member: Identity[];
    tenant: Tenant[];
    parents: Organization[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)) ||
      this.related.parents.traverse((item) => item.permits.read(ctx)),
    update: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    manage_members: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    create_space: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    create_list: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.permits.administer(ctx)),
    delete: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.tenant.traverse((item) => item.related.owner.includes(ctx.subject)),
  };
}

export class Space implements Namespace {
  related: {
    owner: Identity[];
    admin: Identity[];
    member: Identity[];
    organization: Organization[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.read(ctx)),
    update: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.update(ctx)),
    manage_members: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.manage_members(ctx)),
    create_list: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.create_list(ctx)),
    delete: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.organization.traverse((item) => item.permits.delete(ctx)),
  };
}

export class List implements Namespace {
  related: {
    owner: Identity[];
    admin: Identity[];
    member: Identity[];
    space: Space[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.read(ctx)),
    update: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.update(ctx)),
    manage_members: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.manage_members(ctx)),
    create_item: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.create_list(ctx)),
    delete: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.space.traverse((item) => item.permits.delete(ctx)),
  };
}

export class Item implements Namespace {
  related: {
    owner: Identity[];
    admin: Identity[];
    member: Identity[];
    list: List[];
  };

  permits = {
    read: (ctx: Context): boolean =>
      this.related.member.includes(ctx.subject) ||
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.read(ctx)),
    update: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.update(ctx)),
    manage_members: (ctx: Context): boolean =>
      this.related.admin.includes(ctx.subject) ||
      this.related.owner.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.manage_members(ctx)),
    delete: (ctx: Context): boolean =>
      this.related.owner.includes(ctx.subject) ||
      this.related.list.traverse((entry) => entry.permits.delete(ctx)),
  };
}

export class Role implements Namespace {
  related: {
    member: Identity[];
  };
}

export class Permission implements Namespace {
  related: {
    has: Role[];
  };
}
