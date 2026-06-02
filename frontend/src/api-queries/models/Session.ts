export interface Session {
  id: string;
  userId: string;
  title: string;
  chatVersion: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionApi {
  id: string;
  userId: string;
  title: string;
  chatVersion: string;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}
