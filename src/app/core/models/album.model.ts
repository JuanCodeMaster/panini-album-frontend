export interface UserSticker {
  stickerCode: string;
  countryCode: string | null;
  numberInCountry: number | null;
  quantity: number;
  obtainedAt: string | null;
  updatedAt: string | null;
}

export interface CountryProgress {
  countryCode: string;
  total: number;
  obtained: number;
  progressPct: number;
}

export interface AlbumSummary {
  totalStickers: number;
  obtained: number;
  missing: number;
  duplicates: number;
  progressPct: number;
  stickerQuantities: Record<string, number>;
  countries: CountryProgress[];
}
