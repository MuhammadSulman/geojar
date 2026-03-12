import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type {MainTabParamList, HomeStackParamList, MapStackParamList, SettingsStackParamList} from './types';
import HomeScreen from '@/screens/HomeScreen';
import AddPlaceScreen from '@/screens/AddPlaceScreen';
import PlaceDetailScreen from '@/screens/PlaceDetailScreen';
import MapScreen from '@/screens/MapScreen';
import SearchScreen from '@/screens/SearchScreen';
import CategoryListScreen from '@/screens/CategoryListScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ExportScreen from '@/screens/ExportScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="AddPlace" component={AddPlaceScreen} />
      <HomeStack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
    </HomeStack.Navigator>
  );
}

function MapStackScreen() {
  return (
    <MapStack.Navigator screenOptions={{headerShown: false}}>
      <MapStack.Screen name="Map" component={MapScreen} />
      <MapStack.Screen name="AddPlace" component={AddPlaceScreen} />
      <MapStack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
    </MapStack.Navigator>
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
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#7B82A0',
        tabBarStyle: {
          backgroundColor: '#161920',
          borderTopWidth: 0,
        },
      })}>
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{title: 'Home'}} />
      <Tab.Screen name="MapTab" component={MapStackScreen} options={{title: 'Map'}} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{title: 'Search'}} />
      <Tab.Screen name="CategoryTab" component={CategoryListScreen} options={{title: 'Categories'}} />
      <Tab.Screen name="SettingsTab" component={SettingsStackScreen} options={{title: 'Settings'}} />
    </Tab.Navigator>
  );
}
