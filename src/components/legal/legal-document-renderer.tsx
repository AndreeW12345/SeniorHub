import { useRouter, type Href } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type LegalInlineSegment =
  | string
  | { text: string; bold?: boolean }
  | { link: string; href: string };

export type LegalBlock =
  | { type: 'docTitle'; text: string }
  | { type: 'lead'; content: LegalInlineSegment[] }
  | { type: 'meta'; content: LegalInlineSegment[] }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; content: LegalInlineSegment[] }
  | { type: 'ul'; items: LegalInlineSegment[][] }
  | { type: 'hr' };

export type LegalDocumentDefinition = {
  screenTitle: string;
  screenSubtitle?: string;
  blocks: LegalBlock[];
};

function segmentKey(segment: LegalInlineSegment, index: number): string {
  if (typeof segment === 'string') {
    return `s-${index}-${segment.slice(0, 12)}`;
  }

  if ('link' in segment) {
    return `l-${index}-${segment.href}`;
  }

  return `t-${index}-${segment.text.slice(0, 12)}`;
}

function openLegalHref(href: string, navigate: (href: Href) => void): void {
  if (href.startsWith('/')) {
    navigate(href as Href);
    return;
  }

  void Linking.openURL(href);
}

function LegalInlineText({ segments }: { segments: LegalInlineSegment[] }) {
  const router = useRouter();

  return (
    <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.paragraph}>
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          return segment;
        }

        if ('link' in segment) {
          return (
            <ThemedText
              key={segmentKey(segment, index)}
              type="bodyLarge"
              themeColor="primary"
              style={styles.link}
              onPress={() => openLegalHref(segment.href, router.push)}
              accessibilityRole="link">
              {segment.link}
            </ThemedText>
          );
        }

        if (segment.bold) {
          return (
            <ThemedText key={segmentKey(segment, index)} type="bodyLarge" style={styles.boldInline}>
              {segment.text}
            </ThemedText>
          );
        }

        return segment.text;
      })}
    </ThemedText>
  );
}

type LegalDocumentRendererProps = {
  document: LegalDocumentDefinition;
};

/** Renders structured legal document blocks inside a card. */
export function LegalDocumentRenderer({ document }: LegalDocumentRendererProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      {document.blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case 'docTitle':
            return (
              <ThemedText key={key} type="sectionTitle" style={styles.docTitle}>
                {block.text}
              </ThemedText>
            );
          case 'lead':
            return <LegalInlineText key={key} segments={block.content} />;
          case 'meta':
            return (
              <ThemedText key={key} type="smallBold" themeColor="textSecondary" style={styles.meta}>
                {block.content.map((segment, segmentIndex) => {
                  if (typeof segment === 'string') {
                    return segment;
                  }

                  if ('link' in segment) {
                    return (
                      <ThemedText
                        key={segmentKey(segment, segmentIndex)}
                        type="smallBold"
                        themeColor="primary"
                        style={styles.link}
                        onPress={() => openLegalHref(segment.href, router.push)}
                        accessibilityRole="link">
                        {segment.link}
                      </ThemedText>
                    );
                  }

                  return segment.bold ? (
                    <ThemedText key={segmentKey(segment, segmentIndex)} type="smallBold">
                      {segment.text}
                    </ThemedText>
                  ) : (
                    segment.text
                  );
                })}
              </ThemedText>
            );
          case 'h2':
            return (
              <ThemedText key={key} type="sectionTitle" style={styles.h2}>
                {block.text}
              </ThemedText>
            );
          case 'h3':
            return (
              <ThemedText key={key} type="smallBold" themeColor="textSecondary" style={styles.h3}>
                {block.text}
              </ThemedText>
            );
          case 'p':
            return <LegalInlineText key={key} segments={block.content} />;
          case 'ul':
            return (
              <View key={key} style={styles.list}>
                {block.items.map((item, itemIndex) => (
                  <View key={`${key}-item-${itemIndex}`} style={styles.listItem}>
                    <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.bullet}>
                      •
                    </ThemedText>
                    <View style={styles.listItemText}>
                      <LegalInlineText segments={item} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'hr':
            return <View key={key} style={[styles.hr, { backgroundColor: theme.border }]} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  docTitle: {
    letterSpacing: -0.2,
  },
  meta: {
    lineHeight: 28,
  },
  h2: {
    marginTop: Spacing.two,
    letterSpacing: -0.15,
  },
  h3: {
    marginTop: Spacing.one,
  },
  paragraph: {
    lineHeight: 32,
  },
  boldInline: {
    fontWeight: '700',
    lineHeight: 32,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  list: {
    gap: Spacing.two,
    paddingLeft: Spacing.one,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bullet: {
    lineHeight: 32,
    width: 16,
  },
  listItemText: {
    flex: 1,
  },
  hr: {
    height: 1,
    marginVertical: Spacing.two,
  },
});
