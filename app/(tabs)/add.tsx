import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { PlusCircle, Sparkles } from 'lucide-react-native';
import { useDataStore } from '@/store/data-store';
import { getCategoryMeta } from '@/constants/categories';
import { slugify } from '@/lib/slug';
import { Colors, Layout, Radius, Shadow, Spacing, Typography, Motion } from '@/constants/theme';

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { categories, createCard, createCategory, initializeData } = useDataStore();
  const [label, setLabel] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (categoryId && categories.some((category) => category.id === categoryId)) {
      setSelectedCategoryId(categoryId);
      return;
    }

    if (!selectedCategoryId && categories[0]) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, categoryId, selectedCategoryId]);

  useEffect(() => {
    if (categories.length === 0) {
      setShowCategoryCreator(true);
    }
  }, [categories.length]);

  async function handleCreateCategory() {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      Alert.alert('Category name required', 'Please enter a category name first.');
      return;
    }

    setCreatingCategory(true);
    try {
      const category = await createCategory({
        name: trimmed,
        slug: slugify(trimmed),
        sort_order: categories.length,
      });
      setCategoryName('');
      setShowCategoryCreator(false);
      setSelectedCategoryId(category.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to create category.';
      Alert.alert('Error', message);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed || !selectedCategoryId) return;

    setSaving(true);
    try {
      await createCard({
        category_id: selectedCategoryId,
        label: trimmed,
        phrase_output: trimmed,
        normalized_label: slugify(trimmed),
      });
      setLabel('');
      router.replace(`/categories/${selectedCategoryId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: Layout.bottomNavClearance + insets.bottom + 40,
          },
        ]}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.headerBlock}>
          <View style={styles.sparkleContainer}>
            <Sparkles size={20} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Quick Add</Text>
          <Text style={styles.subtitle}>
            Create a new phrase card and assign it to a category.{'\n'}You can train it afterwards.
          </Text>
        </Animated.View>

        {/* Input Card */}
        <Animated.View entering={FadeInUp.delay(80).springify()} style={styles.inputCard}>
          <Text style={styles.fieldLabel}>PHRASE</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. I need a break"
            placeholderTextColor={Colors.textDisabled}
            multiline
          />
          <Text style={styles.helperText}>
            This is the exact phrase spoken aloud after recognition.
          </Text>
        </Animated.View>

        {/* Category Picker */}
        <Animated.View entering={FadeInUp.delay(160).springify()} style={styles.categorySection}>
          <View style={styles.categoryHeaderRow}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <Pressable onPress={() => setShowCategoryCreator((value) => !value)}>
              <Text style={styles.createCategoryLink}>
                {showCategoryCreator ? 'Close' : 'New category'}
              </Text>
            </Pressable>
          </View>
          {showCategoryCreator ? (
            <View style={styles.categoryCreatorCard}>
              <TextInput
                style={styles.categoryInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g. Comfort"
                placeholderTextColor={Colors.textDisabled}
              />
              <Pressable
                style={[styles.secondaryButton, creatingCategory && styles.createButtonDisabled]}
                onPress={() => void handleCreateCategory()}
                disabled={creatingCategory}
              >
                {creatingCategory ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.secondaryButtonText}>Create Category</Text>
                )}
              </Pressable>
            </View>
          ) : null}
          <View style={styles.categoryGrid}>
            {categories.map((cat, index) => {
              const meta = getCategoryMeta(cat.slug);
              const Icon = meta.icon;
              const selected = selectedCategoryId === cat.id;

              return (
                <Animated.View
                  key={cat.id}
                  entering={FadeInUp.delay(200 + index * Motion.choreography.microStagger).springify()}
                >
                  <Pressable
                    style={[
                      styles.categoryChip,
                      selected && { backgroundColor: `${meta.color}18`, borderColor: meta.color },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Icon size={18} color={selected ? meta.color : Colors.textTertiary} />
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected && { color: meta.color, fontWeight: '700' as const },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Create Button — inside scroll, no absolute positioning */}
        <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.buttonWrap}>
          <Pressable
            style={[
              styles.createButton,
              (!label.trim() || !selectedCategoryId || saving) && styles.createButtonDisabled
            ]}
            onPress={() => void handleCreate()}
            disabled={!label.trim() || !selectedCategoryId || saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <PlusCircle size={20} color={Colors.textInverse} />
                <Text style={styles.createButtonText}>Create Phrase Card</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
  },
  headerBlock: {
    marginBottom: Spacing.xl,
  },
  sparkleContainer: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}14`,
    borderWidth: 1,
    borderColor: `${Colors.primary}2A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heroTitle,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.supportText,
    fontSize: 15,
    lineHeight: 22,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow.luxe,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  fieldLabel: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  helperText: {
    ...Typography.supportText,
    marginTop: Spacing.md,
    fontSize: 13,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  createCategoryLink: {
    ...Typography.microLabel,
    color: Colors.primary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  categoryCreatorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.soft,
    gap: Spacing.md,
  },
  categoryInput: {
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.strokeMuted,
    ...Shadow.soft,
  },
  categoryChipText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  buttonWrap: {
    marginTop: Spacing.md,
  },
  createButton: {
    minHeight: 58,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Shadow.glow,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  createButtonText: {
    color: Colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  createButtonDisabled: {
    opacity: 0.35,
  },
});
