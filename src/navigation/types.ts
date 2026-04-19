export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  SearchTab: undefined;
  CategoryTab: undefined;
  SettingsTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  AddPlace: {latitude?: number; longitude?: number} | undefined;
  PlaceDetail: {placeId: string};
};

export type MapStackParamList = {
  Map: {focusLatitude?: number; focusLongitude?: number} | undefined;
  AddPlace: {latitude?: number; longitude?: number} | undefined;
  PlaceDetail: {placeId: string};
};

export type CategoryStackParamList = {
  CategoryList: undefined;
  PlaceDetail: {placeId: string};
};

export type SearchStackParamList = {
  Search: undefined;
  PlaceDetail: {placeId: string};
};

export type SettingsStackParamList = {
  Settings: undefined;
  Export: undefined;
};
