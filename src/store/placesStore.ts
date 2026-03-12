import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {useMemo} from 'react';
import {Place, CategoryName, SortOrder} from '@/types';
import * as queries from '@/database/queries';

interface PlacesState {
  places: Place[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeCategory: CategoryName | null;
  sortOrder: SortOrder;

  loadPlaces: () => Promise<void>;
  addPlace: (
    data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
  updatePlace: (id: string, data: Partial<Place>) => Promise<void>;
  deletePlace: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setActiveCategory: (cat: CategoryName | null) => void;
  setSortOrder: (order: SortOrder) => void;
}

export const usePlacesStore = create<PlacesState>()(
  immer((set, get) => ({
    places: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    activeCategory: null,
    sortOrder: 'newest',

    loadPlaces: async () => {
      set(state => {
        state.isLoading = true;
        state.error = null;
      });
      try {
        const places = await queries.getAllPlaces();
        set(state => {
          state.places = places;
          state.isLoading = false;
        });
      } catch (e) {
        set(state => {
          state.error = (e as Error).message;
          state.isLoading = false;
        });
      }
    },

    addPlace: async data => {
      try {
        const place = await queries.createPlace(data);
        set(state => {
          state.places.unshift(place);
        });
      } catch (e) {
        set(state => {
          state.error = (e as Error).message;
        });
      }
    },

    updatePlace: async (id, data) => {
      try {
        const updated = await queries.updatePlace(id, data);
        set(state => {
          const idx = state.places.findIndex(p => p.id === id);
          if (idx !== -1) {
            state.places[idx] = updated;
          }
        });
      } catch (e) {
        set(state => {
          state.error = (e as Error).message;
        });
      }
    },

    deletePlace: async id => {
      try {
        await queries.deletePlace(id);
        set(state => {
          state.places = state.places.filter(p => p.id !== id);
        });
      } catch (e) {
        set(state => {
          state.error = (e as Error).message;
        });
      }
    },

    toggleFavorite: async id => {
      const place = get().places.find(p => p.id === id);
      if (!place) {
        return;
      }
      try {
        await queries.toggleFavorite(id, place.isFavorite);
        set(state => {
          const idx = state.places.findIndex(p => p.id === id);
          if (idx !== -1) {
            state.places[idx].isFavorite = !state.places[idx].isFavorite;
          }
        });
      } catch (e) {
        set(state => {
          state.error = (e as Error).message;
        });
      }
    },

    setSearchQuery: q => {
      set(state => {
        state.searchQuery = q;
      });
    },

    setActiveCategory: cat => {
      set(state => {
        state.activeCategory = cat;
      });
    },

    setSortOrder: order => {
      set(state => {
        state.sortOrder = order;
      });
    },
  })),
);

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useFilteredPlaces(userLocation?: UserLocation): Place[] {
  const places = usePlacesStore(s => s.places);
  const searchQuery = usePlacesStore(s => s.searchQuery);
  const activeCategory = usePlacesStore(s => s.activeCategory);
  const sortOrder = usePlacesStore(s => s.sortOrder);

  return useMemo(() => {
    let filtered = places;

    if (activeCategory) {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.note && p.note.toLowerCase().includes(q)),
      );
    }

    const sorted = [...filtered];

    switch (sortOrder) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case 'az':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nearest':
        if (userLocation) {
          sorted.sort(
            (a, b) =>
              haversineDistance(
                userLocation.latitude,
                userLocation.longitude,
                a.latitude,
                a.longitude,
              ) -
              haversineDistance(
                userLocation.latitude,
                userLocation.longitude,
                b.latitude,
                b.longitude,
              ),
          );
        }
        break;
    }

    return sorted;
  }, [places, searchQuery, activeCategory, sortOrder, userLocation]);
}
