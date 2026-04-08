import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Plus, Search, ChevronRight } from 'lucide-react-native';
import { useDataStore, type Category } from '@/store/data-store';
import { Colors, Radius, Spacing, Typography, Shadow } from '@/constants/theme';
import { getCategoryMeta } from '@/constants/categories';
import { EmptyStatePanel } from '@/components/ui/EmptyStatePanel';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, soundCards, fetchCategories } = useDataStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  function getCategoryCards(categoryId: string) {
    return soundCards.filter((card) => card.category_id === categoryId);
  }

  function renderCategory({ item, index }: { item: Category; index: number }) {
    const meta = getCategoryMeta(item.slug);
    const categoryCards = getCategoryCards(item.id);
    const count = categoryCards.length;
    const ready = categoryCards.filter((card) => card.training_status === 'ready').length;
    const samples = categoryCards.reduce((sum, card) => sum + card.sample_count, 0);
    const Icon = meta.icon;
    const toneBackground =
      item.slug === 'feelings'
        ? Colors.surfaceTintViolet
        : item.slug === 'actions'
          ? Colors.surfaceTintMint
          : item.slug === 'emergency'
            ? Colors.surfaceTintCoral
            : Colors.surfaceTintBlue;

    return (
      <Animated.View entering={FadeInUp.delay(index * 60).springify().damping(20)}>
        <Pressable
          onPress={() => router.push(`/categories/${item.id}`)}
          style={({ pressed }) => [
            styles.categoryCard,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
          ]}
        >
          <View style={[styles.accentBar, { backgroundColor: meta.color }]} />
          <View style={[styles.cardBody, { backgroundColor: toneBackground }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${meta.color}14` }]}>
              <Icon size={24} color={meta.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{count} phrases</Text>
              <View style={styles.categoryMetaRow}>
                <View style={styles.categoryMetaChip}>
                  <Text style={styles.categoryMetaValue}>{ready}</Text>
                  <Text style={styles.categoryMetaLabel}>ready</Text>
                </View>
                <View style={styles.categoryMetaChip}>
                  <Text style={styles.categoryMetaValue}>{samples}</Text>
                  <Text style={styles.categoryMetaLabel}>samples</Text>
                </View>
              </View>
            </View>
            <View style={styles.chevronWrap}>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Train</Text>
          <Text style={styles.subtitle}>Open a category to review cards and calibrate each phrase.</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/add')}>
          <Plus size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Search size={20} color={Colors.textTertiary} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyStatePanel
              title={searchQuery ? 'No categories match' : 'No categories yet'}
              message={
                searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Create your first phrase card to start building a training library.'
              }
              actionLabel="Add phrase"
              onAction={() => router.push('/add')}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...Typography.heroTitle,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: Radius.pill,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    ...Shadow.soft,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    overflow: 'hidden',
    ...Shadow.luxe,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  accentBar: {
    width: 6,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  cardBody: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.xl + 2,
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cardContent: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  categoryName: {
    ...Typography.cardTitle,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  categoryCount: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  categoryMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  categoryMetaChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  categoryMetaValue: {
    ...Typography.microLabel,
    textTransform: 'none',
    letterSpacing: 0,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  categoryMetaLabel: {
    ...Typography.microLabel,
    textTransform: 'none',
    letterSpacing: 0,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  chevronWrap: {
    paddingLeft: Spacing.md,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
