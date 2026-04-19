import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, ScrollView, Alert, Linking, StyleSheet} from 'react-native';
import {List, Text, Divider, SegmentedButtons} from 'react-native-paper';
import {pick} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {SettingsStackParamList} from '@/navigation/types';
import type {Place} from '@/types';
import {importPlaces, deleteAllPlaces} from '@/database/queries';
import {usePlacesStore} from '@/store/placesStore';
import {useThemeStore, type ThemeMode} from '@/store/themeStore';
import {useAppTheme, type AppTheme} from '@/constants/theme';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.geojar';

const THEME_OPTIONS: {value: ThemeMode; label: string; icon: string}[] = [
  {value: 'light', label: 'Light', icon: 'white-balance-sunny'},
  {value: 'dark', label: 'Dark', icon: 'weather-night'},
  {value: 'system', label: 'System', icon: 'cellphone'},
];

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const loadPlaces = usePlacesStore(s => s.loadPlaces);
  const themeMode = useThemeStore(s => s.mode);
  const setThemeMode = useThemeStore(s => s.setMode);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    setAppVersion(DeviceInfo.getVersion());
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

  const muted = theme.appColors.onSurfaceMuted;

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>

      <List.Section>
        <List.Subheader style={styles.subheader}>Appearance</List.Subheader>
        <View style={styles.segmentWrap}>
          <SegmentedButtons
            value={themeMode}
            onValueChange={v => setThemeMode(v as ThemeMode)}
            buttons={THEME_OPTIONS.map(o => ({
              value: o.value,
              label: o.label,
              icon: o.icon,
            }))}
          />
        </View>
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.subheader}>Data</List.Subheader>
        <List.Item
          title="Export Data"
          titleStyle={styles.itemTitle}
          left={props => <List.Icon {...props} icon="export" color={muted} />}
          right={props => (
            <List.Icon {...props} icon="chevron-right" color={muted} />
          )}
          onPress={handleExport}
        />
        <List.Item
          title="Import Backup"
          titleStyle={styles.itemTitle}
          left={props => <List.Icon {...props} icon="import" color={muted} />}
          onPress={handleImport}
        />
        <List.Item
          title="Delete All Places"
          titleStyle={styles.deleteTitle}
          left={props => (
            <List.Icon
              {...props}
              icon="delete-outline"
              color={theme.appColors.favorite}
            />
          )}
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
          left={props => (
            <List.Icon {...props} icon="information-outline" color={muted} />
          )}
        />
        <List.Item
          title="Rate on Play Store"
          titleStyle={styles.itemTitle}
          left={props => (
            <List.Icon {...props} icon="star-outline" color={muted} />
          )}
          onPress={handleRateApp}
        />
      </List.Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>GeoJar v{appVersion}</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    title: {
      color: t.appColors.onSurface,
      paddingTop: 56,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    subheader: {
      color: t.appColors.primary,
      fontWeight: '600',
    },
    segmentWrap: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    itemTitle: {
      color: t.appColors.onSurface,
    },
    deleteTitle: {
      color: t.appColors.favorite,
    },
    descText: {
      color: t.appColors.onSurfaceMuted,
    },
    divider: {
      backgroundColor: t.appColors.outline,
      marginHorizontal: 16,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    footerText: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 13,
    },
  });
