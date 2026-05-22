import { Sticker } from './catalog.model';

export interface Friend {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Friendship {
  id: number;
  requester: Friend;
  addressee: Friend;
  status: FriendshipStatus;
  createdAt: string;
  acceptedAt: string | null;
}

export interface TradeMatch {
  friend: Friend;
  youGive: Sticker[];
  youReceive: Sticker[];
}
