export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Room {
  id: number;
  topic: string;
  name: string;
  description: string;
  host: User; // Or just the host ID depending on your API
  participants_count?: number; // Optional, depending on API
  created: string;
}