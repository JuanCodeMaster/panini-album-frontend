import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Friend, Friendship, TradeMatch } from '../models/social.model';
import {
  CreateProposalRequest,
  TradeProposal,
  TradeSuggestion,
  NearbySuggestion,
  TradeMessage,
} from '../models/trade-proposal.model';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/social`;
  private readonly tradesUrl = `${environment.apiUrl}/trades`;

  readonly incomingCount = signal(0);
  readonly pendingProposalsCount = signal(0);

  search(query: string): Observable<Friend[]> {
    const q = encodeURIComponent(query);
    return this.http.get<Friend[]>(`${this.baseUrl}/users/search?q=${q}`);
  }

  friends(): Observable<Friend[]> {
    return this.http.get<Friend[]>(`${this.baseUrl}/friends`);
  }

  incoming(): Observable<Friendship[]> {
    return this.http.get<Friendship[]>(`${this.baseUrl}/requests/incoming`).pipe(
      tap((list) => this.incomingCount.set(list.length))
    );
  }

  outgoing(): Observable<Friendship[]> {
    return this.http.get<Friendship[]>(`${this.baseUrl}/requests/outgoing`);
  }

  sendRequest(username: string): Observable<Friendship> {
    return this.http.post<Friendship>(`${this.baseUrl}/requests/${encodeURIComponent(username)}`, {});
  }

  accept(id: number): Observable<Friendship> {
    return this.http.post<Friendship>(`${this.baseUrl}/requests/${id}/accept`, {});
  }

  reject(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/requests/${id}`);
  }

  unfriend(username: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/friends/${encodeURIComponent(username)}`);
  }

  tradeMatches(friendUsername: string): Observable<TradeMatch> {
    return this.http.get<TradeMatch>(`${this.tradesUrl}/matches/${encodeURIComponent(friendUsername)}`);
  }

  tradeSuggestions(limit = 3): Observable<TradeSuggestion[]> {
    return this.http.get<TradeSuggestion[]>(`${this.tradesUrl}/suggestions?limit=${limit}`);
  }

  nearbySuggestions(): Observable<NearbySuggestion[]> {
    return this.http.get<NearbySuggestion[]>(`${this.tradesUrl}/nearby`);
  }

  // ── Chat de propuesta ──
  proposalMessages(proposalId: number): Observable<TradeMessage[]> {
    return this.http.get<TradeMessage[]>(`${this.tradesUrl}/proposals/${proposalId}/messages`);
  }

  sendProposalMessage(proposalId: number, body: string): Observable<TradeMessage> {
    return this.http.post<TradeMessage>(`${this.tradesUrl}/proposals/${proposalId}/messages`, { body });
  }

  // ── Trade proposals ──
  createProposal(body: CreateProposalRequest): Observable<TradeProposal> {
    return this.http.post<TradeProposal>(`${this.tradesUrl}/proposals`, body);
  }

  incomingProposals(): Observable<TradeProposal[]> {
    return this.http.get<TradeProposal[]>(`${this.tradesUrl}/proposals/incoming`).pipe(
      tap((list) => this.pendingProposalsCount.set(list.length))
    );
  }

  outgoingProposals(): Observable<TradeProposal[]> {
    return this.http.get<TradeProposal[]>(`${this.tradesUrl}/proposals/outgoing`);
  }

  proposalHistory(): Observable<TradeProposal[]> {
    return this.http.get<TradeProposal[]>(`${this.tradesUrl}/proposals/history`);
  }

  proposalsPendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.tradesUrl}/proposals/pending-count`).pipe(
      tap((res) => this.pendingProposalsCount.set(res.count))
    );
  }

  acceptProposal(id: number): Observable<TradeProposal> {
    return this.http.post<TradeProposal>(`${this.tradesUrl}/proposals/${id}/accept`, {});
  }

  rejectProposal(id: number): Observable<unknown> {
    return this.http.post(`${this.tradesUrl}/proposals/${id}/reject`, {});
  }

  cancelProposal(id: number): Observable<unknown> {
    return this.http.post(`${this.tradesUrl}/proposals/${id}/cancel`, {});
  }

  /** Limpia los signals al cerrar sesión o cambiar de usuario */
  clear(): void {
    this.incomingCount.set(0);
    this.pendingProposalsCount.set(0);
  }
}
