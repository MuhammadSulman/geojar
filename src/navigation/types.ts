export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main:
    | {
        screen?: keyof MainTabParamList;
        params?: MapStackParamList['Map'];
      }
    | undefined;
  AddPlace: {latitude?: number; longitude?: number} | undefined;
  PlaceDetail: {placeId: string};
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
};

export type MapStackParamList = {
  Map: {focusLatitude?: number; focusLongitude?: number} | undefined;
};

export type CategoryStackParamList = {
  CategoryList: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  Export: undefined;
};
