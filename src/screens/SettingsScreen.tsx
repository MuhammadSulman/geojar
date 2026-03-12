import React, {useCallback, useEffect, useState} from 'react';
import {View, ScrollView, Alert, Linking, StyleSheet} from 'react-native';
import {List, Switch, Text, Divider} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {pick} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {SettingsStackParamList} from '@/navigation/types';
import type {Place} from '@/types';
import {importPlaces, deleteAllPlaces} from '@/database/queries';
import {usePlacesStore} from '@/store/placesStore';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

const DARK_MODE_KEY = 'dark_mode';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.geojar';

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const loadPlaces = usePlacesStore(s => s.loadPlaces);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then(val => {
      if (val !== null) {
        setIsDarkMode(val === 'true');
      }
    });
    setAppVersion(DeviceInfo.getVersion());
  }, []);

  const handleToggleDarkMode = useCallback(async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem(DARK_MODE_KEY, value.toString());
  }, []);

  const handleExport = () => {
    navigation.navigate('Export');
  };

  const handleImport = useCallback(async () => {
    try {
      const [result] = await pick({
        type: ['application/json'],
      });
      const content = await RNFS.readFile(result.uri, 'utf8');
      const data: Place[] = JSON.parse(content);

      if (!Array.isArray(data)) {
        Alert.alert('Invalid File', 'The file does not contain valid data.');
        return;
      }

      Alert.alert(
        'Import Backup',
        `Import ${data.length} places? Existing places with the same ID will be overwritten.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Import',
            onPress: async () => {
              await importPlaces(data);
              await loadPlaces();
              Alert.alert('Success', `${data.length} places imported.`);
            },
          },
        ],
      );
    } catch (err: unknown) {
      const error = err as {code?: string};
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        return;
      }
      Alert.alert('Error', 'Failed to import backup file.');
    }
  }, [loadPlaces]);

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Delete All Places',
      'Are you sure? This will permanently delete all saved places. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllPlaces();
            await loadPlaces();
            Alert.alert('Done', 'All places have been deleted.');
          },
        },
      ],
    );
  }, [loadPlaces]);

  const handleRateApp = () => {
    Linking.openURL(PLAY_STORE_URL);
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>

      <List.Section>
        <List.Subheader style={styles.subheader}>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          titleStyle={styles.itemTitle}
          left={props => <List.Icon {...props} icon="weather-night" color="#7B82A0" />}
          right={() => (
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              color="#16A34A"
            />
          )}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.subheader}>Data</List.Subheader>
        <List.Item
          title="Export Data"
          titleStyle={styles.itemTitle}
          left={props => <List.Icon {...props} icon="export" color="#7B82A0" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#7B82A0" />}
          onPress={handleExport}
        />
        <List.Item
          title="Import Backup"
          titleStyle={styles.itemTitle}
          left={props => <List.Icon {...props} icon="import" color="#7B82A0" />}
          onPress={handleImport}
        />
        <List.Item
          title="Delete All Places"
          titleStyle={styles.deleteTitle}
          left={props => <List.Icon {...props} icon="delete-outline" color="#EF4444" />}
          onPress={handleDeleteAll}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.subheader}>About</List.Subheader>
        <List.Item
          title="App Version"
          description={appVersion}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.descText}
          left={props => <List.Icon {...props} icon="information-outline" color="#7B82A0" />}
        />
        <List.Item
          title="Rate on Play Store"
          titleStyle={styles.itemTitle}
          left={props => <List.Icon {...props} icon="star-outline" color="#7B82A0" />}
          onPress={handleRateApp}
        />
      </List.Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>GeoJar v{appVersion}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
  title: {
    color: '#F0F2F8',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  subheader: {
    color: '#16A34A',
    fontWeight: '600',
  },
  itemTitle: {
    color: '#F0F2F8',
  },
  deleteTitle: {
    color: '#EF4444',
  },
  descText: {
    color: '#7B82A0',
  },
  divider: {
    backgroundColor: '#2A2F42',
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: '#7B82A0',
    fontSize: 13,
  },
});
