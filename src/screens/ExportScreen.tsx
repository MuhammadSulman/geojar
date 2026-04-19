import React, {useEffect, useMemo, useState} from 'react';
import {View, Alert, StyleSheet} from 'react-native';
import {Text, Button, IconButton} from 'react-native-paper';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {useNavigation} from '@react-navigation/native';
import type {Place} from '@/types';
import {getAllPlacesForExport} from '@/database/queries';
import {useAppTheme, type AppTheme} from '@/constants/theme';

export default function ExportScreen() {
  const navigation = useNavigation();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    getAllPlacesForExport().then(setPlaces);
  }, []);

  const buildCsv = (data: Place[]): string => {
    const headers = [
      'id',
      'name',
      'latitude',
      'longitude',
      'category',
      'emoji',
      'note',
      'isFavorite',
      'createdAt',
      'updatedAt',
    ];
    const rows = data.map(p =>
      [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.latitude,
        p.longitude,
        p.category,
        p.emoji,
        `"${(p.note ?? '').replace(/"/g, '""')}"`,
        p.isFavorite ? 1 : 0,
        p.createdAt,
        p.updatedAt,
      ].join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const exportFile = async (format: 'csv' | 'json') => {
    if (places.length === 0) {
      Alert.alert('No Data', 'There are no places to export.');
      return;
    }

    setIsExporting(true);
    try {
      const filename = `geojar_export.${format}`;
      const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
      const content =
        format === 'csv' ? buildCsv(places) : JSON.stringify(places, null, 2);

      await RNFS.writeFile(path, content, 'utf8');

      await Share.open({
        url: `file://${path}`,
        type: format === 'csv' ? 'text/csv' : 'application/json',
        filename,
      });
    } catch (err: unknown) {
      const error = err as {message?: string};
      if (error.message && !error.message.includes('User did not share')) {
        Alert.alert('Error', 'Failed to export data.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.appColors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Export Data
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.countEmoji}>📦</Text>
        <Text variant="headlineSmall" style={styles.count}>
          You have {places.length} place{places.length !== 1 ? 's' : ''} to
          export.
        </Text>

        <Button
          mode="contained"
          icon="file-delimited-outline"
          onPress={() => exportFile('csv')}
          loading={isExporting}
          disabled={isExporting}
          style={styles.exportBtn}
          buttonColor={theme.appColors.primary}>
          Export as CSV
        </Button>

        <Button
          mode="outlined"
          icon="code-json"
          onPress={() => exportFile('json')}
          loading={isExporting}
          disabled={isExporting}
          style={styles.exportBtn}
          textColor={theme.appColors.primary}>
          Export as JSON
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 44,
      paddingHorizontal: 4,
    },
    headerTitle: {
      color: t.appColors.onSurface,
      flex: 1,
    },
    headerSpacer: {
      width: 48,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    countEmoji: {
      fontSize: 56,
      marginBottom: 16,
    },
    count: {
      color: t.appColors.onSurface,
      textAlign: 'center',
      marginBottom: 40,
    },
    exportBtn: {
      width: '100%',
      marginBottom: 16,
    },
  });
