export type Game = "Pokémon" | "Magic: The Gathering" | "Yu-Gi-Oh!" | "One Piece" | "Lorcana" | "Flesh and Blood" | "Other";

export const GAMES: Game[] = ["Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", "Lorcana", "Flesh and Blood", "Other"];

export const CONDITIONS = ["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged", "Good", "Poor"];

export const LANGUAGES = ["English", "japanese", "Chinese", "French", "German", "Spanish", "Italian", "Portuguese", "Korean"];

export const GRADES = ["", "PSA 10", "PSA 9", "PSA 8", "PSA 7", "PSA 6", "BGS 10", "BGS 9.5", "BGS 9", "CGC 10", "CGC 9", "Raw"];

export const CURRENCIES = ["GBP", "USD", "EUR", "AUD", "CAD", "JPY"];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
};

export const SEALED_TYPES = ["Booster Pack", "Booster Box", "Elite Trainer Box", "Tin", "Pre-Constructed Deck", "Blister Pack", "Other"];

export interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  username_last_changed: string | null;
  business_name: string | null;
  currency: string;
  theme_mode: string;
  scan_sound: boolean;
  scan_sound_type: string;
  scan_haptics: boolean;
  event_active: boolean;
  onboarding_complete: boolean;
  sender_email: string;
  instagram: string | null;
  website: string | null;
  sale_target: number | null;
  sale_target_set_at: string | null;
  is_affiliated: boolean;
  is_supporter: boolean;
  suspended: boolean;
  logo_storage_id: string | null;
  profile_image_storage_id: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  name: string;
  game: string;
  set_name: string | null;
  card_number: string | null;
  condition: string;
  rarity: string | null;
  grade: string | null;
  language: string;
  market_value: number;
  purchase_price: number;
  sold: boolean;
  sold_date: string | null;
  notes: string | null;
  image_storage_id: string | null;
  image_back_storage_id: string | null;
  created_at: string;
}

export interface Label {
  id: string;
  user_id: string;
  card_id: string | null;
  qr_value: string | null;
  label_data: Record<string, unknown>;
  currency: string;
  width_mm: number;
  height_mm: number;
  print_count: number;
  printed: boolean;
  created_at: string;
}

export interface ScanLog {
  id: string;
  user_id: string;
  card_id: string | null;
  label_id: string | null;
  qr_value: string | null;
  action: string;
  scanned_at: string;
  created_at: string;
}

export interface SealedProduct {
  id: string;
  user_id: string;
  name: string;
  game: string;
  type: string;
  barcode: string | null;
  quantity: number;
  purchase_price: number;
  sell_price: number;
  created_at: string;
}

export interface BuyingDeal {
  id: string;
  user_id: string;
  card_count: number;
  card_price: number;
  amount_paid: number;
  pct: number;
  you_keep: number;
  note: string | null;
  date: string;
  at: string;
  deleted_at: string | null;
  created_at: string;
}

export interface CalendarNote {
  id: string;
  user_id: string;
  date: string;
  note: string;
  created_at: string;
}

export interface EarningsSnapshot {
  id: string;
  user_id: string;
  date: string;
  total_earned: number;
  cards_sold: number;
  top_card: string | null;
  top_card_value: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  name: string | null;
  message: string;
  type: string;
  approved: boolean;
  created_at: string;
}
