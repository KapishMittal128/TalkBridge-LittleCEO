import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Search, Plus, RotateCcw, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore, type SoundCard } from '@/store/data-store';
import { SoundCardTile } from '@/components/ui/SoundCardTile';
import { VocalTrainer } from '@/components/VocalTrainer';
import { Colors, Layout, Radius, Spacing, Typography, Shadow } from '@/constants/theme';
import { getCategoryMeta } from '@/constants/categories';
import { EmptyStatePanel } from '@/components/ui/EmptyStatePanel';

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const voiceFeedbackEnabled = profile?.voice_feedback_enabled !== false;
  const hapticFeedbackEnabled = profile?.haptic_feedback_enabled !== false;
  const { categories, soundCards, fetchCardsByCategory, toggleFavorite, resetCardTraining, deleteCard, deleteCategory } =
    useDataStore();
  const [trainingCard, setTrainingCard] = useState<SoundCard | null>(null);
  const [managedCard, setManagedCard] = useState<SoundCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      void fetchCardsByCategory(id);
    }
  }, [fetchCardsByCategory, id]);

  const category = categories.find((item) => item.id === id);
  const meta = getCategoryMeta(category?.slug);
  const cards = soundCards.filter((card) => 
    card.category_id === id && 
    (card.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
     card.phrase_output.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const sampleTotal = cards.reduce((sum, card) => sum + card.sample_count, 0);
  const readyCount = cards.filter((card) => card.training_status === 'ready').length;
  const canDeleteCategory = useMemo(() => cards.length === 0, [cards.length]);

  function handleCardPress(card: SoundCard) {
    if (card.training_status !== 'ready') {
      setTrainingCard(card);
      return;
    }
    
    if (hapticFeedbackEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (voiceFeedbackEnabled) {
      Speech.speak(card.phrase_output, {
        language: profile?.output_language || 'en',
        pitch: 1,
        rate: 0.9,
      });
    }
  }

  async function handleResetCard() {
    if (!managedCard) return;

    try {
      await resetCardTraining(managedCard.id);
      setManagedCard(null);
      if (id) {
        void fetchCardsByCategory(id);
      }
    } catch (error) {
      Alert.alert('Could not reset training', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  function confirmDeleteCard() {
    if (!managedCard) return;

    Alert.alert('Delete phrase?', 'This will remove the phrase and its saved training samples.', [
      { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteCard(managedCard.id);
                setManagedCard(null);
                if (id) {
                  void fetchCardsByCategory(id);
                }
              } catch (error) {
                Alert.alert('Could not delete phrase', error instanceof Error ? error.message : 'Please try again.');
              }
            })();
          },
      },
    ]);
  }

  function confirmDeleteCategory() {
    Alert.alert(
      'Delete category?',
      'This category is empty and will be removed from your communication bank.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteCategory(String(id));
                router.replace('/categories');
              } catch (error) {
                Alert.alert('Could not delete', error instanceof Error ? error.message : 'Please try again.');
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.replace('/categories')}
          hitSlop={20}
        >
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>{category?.name ?? 'Category'}</Text>
          <Text style={styles.headerSubtitle}>
            {readyCount}/{cards.length || 0} ready • {sampleTotal} calibrations saved
          </Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push(id ? `/add?categoryId=${id}` : '/add')}
          hitSlop={12}
        >
          <Plus size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <View style={[styles.heroBadge, { backgroundColor: `${meta.color}16`, borderColor: `${meta.color}28` }]}>
          <Text style={[styles.heroBadgeText, { color: meta.color }]}>{category?.name ?? 'Category'}</Text>
        </View>
        <Text style={styles.heroTitle}>Train each phrase until it is ready to speak.</Text>
        <Text style={styles.heroSubtitle}>
          Tap a card to speak it, or use the recalibrate action on any card to review and replay its saved sound samples.
        </Text>
        {canDeleteCategory ? (
          <Pressable style={styles.heroInlineAction} onPress={confirmDeleteCategory}>
            <Trash2 size={14} color={Colors.emergency} />
            <Text style={styles.heroInlineActionText}>Delete empty category</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search phrases..."
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Phrase List - 2 Column Grid */}
      <FlatList
        data={cards}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent, 
          { paddingBottom: Layout.bottomNavClearance + insets.bottom + 20 }
        ]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View 
            entering={FadeInDown.delay(index * 40).springify().damping(20)}
            style={styles.gridItem}
          >
            <SoundCardTile
              label={item.label}
              phrase={item.phrase_output}
              sampleCount={item.sample_count}
              status={item.training_status}
              favorite={item.is_favorite}
              emergency={item.is_emergency}
              accentColor={meta.color}
              onPress={() => handleCardPress(item)}
              onLongPress={() => setManagedCard(item)}
              onTrain={() => setTrainingCard(item)}
              onFavorite={() => void toggleFavorite(item.id, !item.is_favorite)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyStatePanel
              title={searchQuery ? 'No phrases match' : 'No phrases here yet'}
              message={
                searchQuery
                  ? 'Try a different phrase or clear the search to see the full category.'
                  : 'Add a new phrase to this category, then train it so TalkBridge can recognize it.'
              }
              actionLabel="Add phrase"
              onAction={() => router.push(id ? `/add?categoryId=${id}` : '/add')}
            />
          </View>
        }
        ListFooterComponent={() => (
          <Animated.View entering={FadeInDown.delay(cards.length * 40).springify()} style={styles.gridItemFull}>
            <Pressable 
              style={styles.dashedCard}
              onPress={() => router.push(id ? `/add?categoryId=${id}` : '/add')}
            >
              <Plus size={24} color={Colors.textTertiary} />
              <Text style={styles.dashedCardText}>Add new phrase</Text>
            </Pressable>
          </Animated.View>
        )}
      />

      {trainingCard ? (
        <VocalTrainer
          isVisible={Boolean(trainingCard)}
          soundCard={trainingCard}
          onClose={() => {
            setTrainingCard(null);
            if (id) {
              void fetchCardsByCategory(id);
            }
          }}
        />
      ) : null}

      <Modal visible={Boolean(managedCard)} transparent animationType="fade" onRequestClose={() => setManagedCard(null)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setManagedCard(null)} />
          <View style={[styles.manageCard, { marginBottom: insets.bottom + Spacing.lg }]}>
            <Text style={styles.manageEyebrow}>Phrase actions</Text>
            <Text style={styles.manageTitle}>{managedCard?.label}</Text>
            <Text style={styles.manageSubtitle}>
              {managedCard?.sample_count ?? 0} saved samples • {managedCard?.training_status === 'ready' ? 'Ready to speak' : 'Needs training'}
            </Text>

            <Pressable style={styles.manageAction} onPress={() => {
              setTrainingCard(managedCard);
              setManagedCard(null);
            }}>
              <RotateCcw size={18} color={Colors.primary} />
              <View style={styles.manageCopy}>
                <Text style={styles.manageActionTitle}>Recalibrate sound</Text>
                <Text style={styles.manageActionSubtitle}>Review saved samples, play them back, or record fresh ones.</Text>
              </View>
            </Pressable>

            <Pressable style={styles.manageAction} onPress={() => void handleResetCard()}>
              <RotateCcw size={18} color={Colors.warning} />
              <View style={styles.manageCopy}>
                <Text style={styles.manageActionTitle}>Reset training</Text>
                <Text style={styles.manageActionSubtitle}>Keep the phrase, clear its saved samples.</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.manageAction, styles.manageActionDanger]} onPress={confirmDeleteCard}>
              <Trash2 size={18} color={Colors.emergency} />
              <View style={styles.manageCopy}>
                <Text style={[styles.manageActionTitle, { color: Colors.emergency }]}>Delete phrase</Text>
                <Text style={styles.manageActionSubtitle}>Remove this phrase and its training completely.</Text>
              </View>
            </Pressable>

            <Pressable style={styles.manageCloseButton} onPress={() => setManagedCard(null)}>
              <Text style={styles.manageCloseText}>Close</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  headerTitle: {
    ...Typography.heroTitle,
  },
  headerSubtitle: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    ...Shadow.soft,
  },
  heroPanel: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    ...Shadow.luxe,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  heroBadgeText: {
    ...Typography.microLabel,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...Typography.sectionTitle,
    fontSize: 24,
    lineHeight: 30,
  },
  heroSubtitle: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  heroInlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceTintCoral,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  heroInlineActionText: {
    ...Typography.microLabel,
    color: Colors.emergency,
    textTransform: 'none',
    letterSpacing: 0,
  },
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xs,
    flexGrow: 1,
  },
  emptyWrap: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridItem: {
    flex: 1,
  },
  gridItemFull: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  dashedCard: {
    height: 112,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.strokeStrong,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceMuted,
  },
  dashedCardText: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    fontSize: 12,
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
  manageCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.drawer,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.luxe,
  },
  manageEyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
  },
  manageTitle: {
    ...Typography.sectionTitle,
    fontSize: 24,
    lineHeight: 28,
  },
  manageSubtitle: {
    ...Typography.supportText,
    color: Colors.textSecondary,
  },
  manageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  manageActionDanger: {
    backgroundColor: Colors.surfaceTintCoral,
  },
  manageCopy: {
    flex: 1,
  },
  manageActionTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    lineHeight: 20,
  },
  manageActionSubtitle: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  manageCloseButton: {
    minHeight: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    marginTop: Spacing.xs,
  },
  manageCloseText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
