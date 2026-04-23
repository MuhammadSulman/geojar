import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {Place} from '@/types';
import * as queries from '@/database/queries';

interface PlacesState {
  places: Place[];
  isLoading: boolean;
  error: string | null;

  loadPlaces: () => Promise<void>;
  addPlace: (
    data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
  updatePlace: (id: string, data: Partial<Place>) => Promise<void>;
  deletePlace: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  importPlaces: (data: unknown[]) => Promise<queries.ImportResult>;
  deleteAllPlaces: () => Promise<void>;
}

export const usePlacesStore = create<PlacesState>()(
  immer(set => ({
    places: [],
    isLoading: false,
    error: null,

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
      const place = await queries.createPlace(data);
      set(state => {
        state.places.unshift(place);
      });
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
      try {
        const nowFavorite = await queries.toggleFavorite(id);
        set(state => {
          const idx = state.places.findIndex(p => p.id === id);
          if (idx !== -1) {
            state.places[idx].isFavorite = nowFavorite;
          }
        });
      } catch (e) {
        set(state => {
          state.error = (e as Error).message;
        });
      }
    },

    importPlaces: async data => {
      const result = await queries.importPlaces(data);
      // Source of truth is the DB; reread to capture overwrites / merges.
      const places = await queries.getAllPlaces();
      set(state => {
        state.places = places;
      });
      return result;
    },

    deleteAllPlaces: async () => {
      await queries.deleteAllPlaces();
      set(state => {
        state.places = [];
      });
    },
  })),
);
