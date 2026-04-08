import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CalendarHeart, ChevronRight, RotateCcw, Trash2 } from 'lucide-react-native';
import { useDataStore } from '@/store/data-store';
import { EmptyStatePanel } from '@/components/ui/EmptyStatePanel';
import { HistoryEventCard } from '@/components/ui/HistoryEventCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, Layout, Motion, Spacing, Typography } from '@/constants/theme';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { history, soundCards, fetchHistory, clearHistory } = useDataStore();
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => history.find((item) => item.id === selectedHistoryId) ?? null,
    [history, selectedHistoryId],
  );
  const linkedCard = useMemo(
    () => soundCards.find((item) => item.id === selectedEvent?.sound_card_id) ?? null,
    [selectedEvent?.sound_card_id, soundCards],
  );

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
        <Animated.View entering={FadeInDown.springify().damping(Motion.spring.gentle.damping)} style={styles.header}>
          <SectionHeader
            eyebrow="Communication moments"
            title="History"
            subtitle="A calm record of the phrases TalkBridge recently recognized."
            trailing={
              history.length > 0 ? (
                <Pressable 
                  style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]} 
                  onPress={() => void clearHistory()}
                >
                  <Trash2 size={18} color={Colors.emergency} />
                </Pressable>
              ) : undefined
            }
          />
        </Animated.View>

        {history.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyStatePanel
              title="No history yet"
              message="Once a phrase is recognized from the home hub, it will appear here as part of your communication story."
              icon={CalendarHeart}
            />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: Layout.bottomNavClearance + insets.bottom }]}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.delay(index * Motion.choreography.microStagger).springify()}>
                {(() => {
                  const itemCard = soundCards.find((card) => card.id === item.sound_card_id) ?? null;
                  return (
                <HistoryEventCard
                  phrase={item.phrase_output}
                  createdAt={item.created_at}
                  confidence={item.confidence}
                  label={itemCard?.label}
                  onPress={() => setSelectedHistoryId(item.id)}
                />
                  );
                })()}
              </Animated.View>
            )}
            ListHeaderComponent={
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineEyebrow}>Latest activity</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={Boolean(selectedEvent)} transparent animationType="fade" onRequestClose={() => setSelectedHistoryId(null)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedHistoryId(null)} />
          <View style={[styles.detailCard, { marginBottom: Layout.bottomNavClearance + insets.bottom }]}>
            <Text style={styles.detailEyebrow}>Recognition detail</Text>
            <Text style={styles.detailPhrase}>{selectedEvent?.phrase_output}</Text>
            <Text style={styles.detailMeta}>
              {selectedEvent ? `${Math.round(selectedEvent.confidence * 100)}% confidence` : ''}
            </Text>

            {linkedCard && linkedCard.category_id ? (
              <>
                <View style={styles.linkedCardWrap}>
                  <Text style={styles.linkedCardLabel}>{linkedCard.label}</Text>
                  <Text style={styles.linkedCardMeta}>
                    {linkedCard.sample_count} samples • {linkedCard.training_status === 'ready' ? 'Ready' : 'Needs training'}
                  </Text>
                </View>
                <Pressable
                  style={styles.detailAction}
                  onPress={() => {
                    setSelectedHistoryId(null);
                    router.push(`/categories/${linkedCard.category_id}`);
                  }}
                >
                  <RotateCcw size={18} color={Colors.primary} />
                  <Text style={styles.detailActionText}>Open phrase and retrain</Text>
                  <ChevronRight size={16} color={Colors.primary} />
                </Pressable>
              </>
            ) : (
              <Text style={styles.detailHint}>
                This moment is saved, but the original phrase card is no longer available for retraining from here.
              </Text>
            )}

            <Pressable style={styles.detailCloseButton} onPress={() => setSelectedHistoryId(null)}>
              <Text style={styles.detailCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  listContent: {
    paddingBottom: Spacing['2xl'],
  },
  timelineHeader: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineEyebrow: {
    ...Typography.microLabel,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.28)',
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.screenPadding,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  detailEyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
  },
  detailPhrase: {
    ...Typography.sectionTitle,
    fontSize: 24,
    lineHeight: 30,
  },
  detailMeta: {
    ...Typography.supportText,
    color: Colors.textSecondary,
  },
  linkedCardWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.surfaceMuted,
    padding: Spacing.md,
  },
  linkedCardLabel: {
    ...Typography.cardTitle,
    fontSize: 18,
  },
  linkedCardMeta: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  detailAction: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
    backgroundColor: `${Colors.primary}10`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  detailActionText: {
    ...Typography.body,
    flex: 1,
    color: Colors.primary,
    fontWeight: '700',
  },
  detailHint: {
    ...Typography.supportText,
    color: Colors.textSecondary,
  },
  detailCloseButton: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  detailCloseText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
