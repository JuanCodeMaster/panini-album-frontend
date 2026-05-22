export interface Country {
  id: number;
  code: string;
  name: string;
  iso2: string;
  wcGroup: string | null;
  displayOrder: number;
}

export interface Section {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
}

export type StickerType =
  | 'LOGO_PANINI'
  | 'HOST'
  | 'MUSEUM'
  | 'BADGE'
  | 'PLAYER'
  | 'TEAM_PHOTO'
  | 'SPECIAL';

export interface Sticker {
  id: number;
  code: string;
  numberInCountry: number | null;
  displayName: string;
  stickerType: StickerType;
  foil: boolean;
  inPacks: boolean;
  countryCode: string | null;
  sectionCode: string;
  imageUrl: string | null;
}

export function flagUrl(iso2: string, size = 80): string {
  const code = iso2.toLowerCase();
  return `https://flagcdn.com/w${size}/${code}.png`;
}
