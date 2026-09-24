interface List {
  id: string;
  workspaceId: string;
  ownerUserId: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date | null;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export class ListDetails<M> {
  id: string;
  workspaceId: string;
  ownerUserId: string;
  name: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status: string;
  createdAt: Date;
  updatedAt?: Date | null;
  actions: string[][];
  statuses: string[];
  members: M[];

  constructor(
    {
      id,
      workspaceId,
      ownerUserId,
      name,
      description,
      startDate,
      endDate,
      status,
      createdAt,
      updatedAt,
    }: List,
    actions: string[][] = [],
    statuses: string[] = [],
    members: M[],
  ) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.ownerUserId = ownerUserId;
    this.name = name;
    this.description = description;
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this.actions = actions;
    this.statuses = statuses;
    this.members = members;
  }
}
