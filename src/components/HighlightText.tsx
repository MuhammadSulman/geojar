import React from 'react';
import {Text, StyleSheet, TextStyle} from 'react-native';

interface Props {
  text: string;
  highlight: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
}

export default function HighlightText({
  text,
  highlight,
  style,
  highlightStyle,
}: Props) {
  if (!highlight.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={style}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Text key={i} style={[styles.highlight, highlightStyle]}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: '#16A34A44',
    color: '#16A34A',
    fontWeight: '700',
  },
});
