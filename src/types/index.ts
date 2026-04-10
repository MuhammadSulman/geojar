export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: CategoryName;
  note?: string;
  emoji: string;
  isFavorite: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type CategoryName =
  | 'Home'
  | 'Family'
  | 'Friends'
  | 'Relative'
  | 'Food'
  | 'Work'
  | 'Health'
  | 'Shopping'
  | 'Nature'
  | 'Other';

export interface Category {
  id: string;
  name: CategoryName;
  color: string; // hex e.g. "#F59E0B"
  emoji: string;
}

export type SortOrder = 'newest' | 'oldest' | 'az' | 'nearest';
