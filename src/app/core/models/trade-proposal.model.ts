import { Friend } from './social.model';
import { Sticker } from './catalog.model';

export type TradeProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface TradeProposal {
  id: number;
  requester: Friend;
  addressee: Friend;
  stickersGiven: string[];
  stickersReceived: string[];
  gift: boolean;
  message: string | null;
  status: TradeProposalStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface CreateProposalRequest {
  addresseeUsername: string;
  stickersGiven: string[];
  stickersReceived: string[];
  message?: string;
}

export interface TradeSuggestion {
  friend: Friend;
  giveCount: number;
  receiveCount: number;
  sampleGive: Sticker[];
  sampleReceive: Sticker[];
}
