import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppTheme} from '@/constants/theme';
import type {
  MainTabParamList,
  HomeStackParamList,
  MapStackParamList,
  CategoryStackParamList,
  SearchStackParamList,
  SettingsStackParamList,
} from './types';
import HomeScreen from '@/screens/HomeScreen';
import MapScreen from '@/screens/MapScreen';
import SearchScreen from '@/screens/SearchScreen';
import CategoryListScreen from '@/screens/CategoryListScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ExportScreen from '@/screens/ExportScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const CategoryStack = createNativeStackNavigator<CategoryStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function MapStackScreen() {
  return (
    <MapStack.Navigator screenOptions={{headerShown: false}}>
      <MapStack.Screen name="Map" component={MapScreen} />
    </MapStack.Navigator>
  );
}

function CategoryStackScreen() {
  return (
    <CategoryStack.Navigator screenOptions={{headerShown: false}}>
      <CategoryStack.Screen name="CategoryList" component={CategoryListScreen} />
    </CategoryStack.Navigator>
  );
}

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{headerShown: false}}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
    </SearchStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{headerShown: false}}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Export" component={ExportScreen} />
    </SettingsStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'home-outline',
  MapTab: 'map-outline',
  SearchTab: 'magnify',
  CategoryTab: 'view-grid-outline',
  SettingsTab: 'cog-outline',
};

export default function MainNavigator() {
  const theme = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: theme.appColors.primary,
        tabBarInactiveTintColor: theme.appColors.onSurfaceMuted,
        tabBarStyle: {
          backgroundColor: theme.appColors.surfaceAlt,
          borderTopWidth: 0,
        },
      })}>
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{title: 'Home'}} />
      <Tab.Screen name="MapTab" component={MapStackScreen} options={{title: 'Map'}} />
      <Tab.Screen name="SearchTab" component={SearchStackScreen} options={{title: 'Search'}} />
      <Tab.Screen name="CategoryTab" component={CategoryStackScreen} options={{title: 'Categories'}} />
      <Tab.Screen name="SettingsTab" component={SettingsStackScreen} options={{title: 'Settings'}} />
    </Tab.Navigator>
  );
}
