interface ListMemberProps {
  id: string;
  name: string;
  userId: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
}

export class ListMember {
  id: string;
  name: string;
  userId: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;

  constructor({ id, name, userId, email, role, createdAt, updatedAt }: ListMemberProps) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.userId = userId;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
