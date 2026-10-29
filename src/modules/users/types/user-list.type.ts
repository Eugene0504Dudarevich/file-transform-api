export type UserListItem = {
  id: string;
  email: string;
  photoUrl: string | null;
  createdAt: Date;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  lastLoginAt: Date | null;
};

export type UserListResponse = {
  items: UserListItem[];
  nextCursor: string | null;
};
