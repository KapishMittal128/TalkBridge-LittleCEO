import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, SlideInUp } from 'react-native-reanimated';
import { PlusCircle, Sparkles, X } from 'lucide-react-native';
import { useDataStore } from '@/store/data-store';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { OnboardingStepCard } from '@/components/ui/OnboardingStepCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors, Layout, Motion, Radius, Spacing, Typography } from '@/constants/theme';
import { getCategoryMeta } from '@/constants/categories';
import { slugify } from '@/lib/slug';

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const { categories, createCard, createCategory, initializeData } = useDataStore();
  const [label, setLabel] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (!selectedCategoryId && categories[0]) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (categories.length === 0) {
      setShowCategoryCreator(true);
    }
  }, [categories.length]);

  async function handleCreateCategory() {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setSaveError('Please enter a category name first.');
      return;
    }

    setCreatingCategory(true);
    setSaveError(null);
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
      const message = error instanceof Error ? error.message : 'Unable to create category right now.';
      setSaveError(message);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSave() {
    const trimmed = label.trim();
    if (!trimmed || !selectedCategoryId) return;

    setSaving(true);
    setSaveError(null);
    try {
      await createCard({
        category_id: selectedCategoryId,
        label: trimmed,
        phrase_output: trimmed,
        normalized_label: slugify(trimmed),
      });
      setLabel('');
      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save this sound card right now.';
      setSaveError(message);
      Alert.alert('Could not save card', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuroraBackground>
      <Animated.View
        entering={SlideInUp.springify().damping(Motion.spring.gentle.damping)}
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Sparkles size={18} color={Colors.primary} />
          </View>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={18} color={Colors.textSecondary} />
          </Pressable>
        </Animated.View>

        <SectionHeader
          eyebrow="Create voice tile"
          title="Add a phrase with intention"
          subtitle="This phrase becomes part of the communication library, then you can train TalkBridge to recognize the sound that means it."
          style={styles.titleBlock}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <GlassPanel variant="elevated" radius={Radius.panel} padding={Spacing.xl} style={styles.inputPanel}>
            <Text style={styles.fieldLabel}>Phrase output</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="For example: I need a break"
              placeholderTextColor={Colors.textDisabled}
              multiline
            />
            <Text style={styles.helperText}>Use the exact phrase you want spoken aloud after recognition.</Text>
          </GlassPanel>

          <View style={styles.categoryHeader}>
            <View style={styles.categoryHeaderRow}>
              <Text style={styles.fieldLabel}>Choose a category</Text>
              <Pressable onPress={() => setShowCategoryCreator((value) => !value)}>
                <Text style={styles.createCategoryLink}>
                  {showCategoryCreator ? 'Close' : 'New category'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.helperInline}>This controls the card&apos;s visual identity and placement.</Text>
          </View>

          {showCategoryCreator ? (
            <GlassPanel variant="ghost" radius={Radius.card} padding={Spacing.lg} style={styles.categoryCreatorPanel}>
              <TextInput
                style={styles.categoryInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="For example: Comfort"
                placeholderTextColor={Colors.textDisabled}
              />
              <Pressable
                style={[styles.categoryCreateButton, creatingCategory && styles.disabledButton]}
                onPress={() => void handleCreateCategory()}
                disabled={creatingCategory}
              >
                {creatingCategory ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.categoryCreateButtonText}>Create category</Text>
                )}
              </Pressable>
            </GlassPanel>
          ) : null}

          <View style={styles.categoryStack}>
            {categories.map((category, index) => {
              const meta = getCategoryMeta(category.slug);
              return (
                <Animated.View key={category.id} entering={FadeInUp.delay(index * Motion.choreography.microStagger).springify()}>
                  <OnboardingStepCard
                    title={category.name}
                    subtitle={meta.description}
                    icon={meta.icon}
                    active={selectedCategoryId === category.id}
                    onPress={() => setSelectedCategoryId(category.id)}
                  />
                </Animated.View>
              );
            })}
          </View>

          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        </ScrollView>

        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, (!label.trim() || !selectedCategoryId || saving) && styles.disabledButton]}
            onPress={() => void handleSave()}
            disabled={!label.trim() || !selectedCategoryId || saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <PlusCircle size={18} color={Colors.textInverse} />
                <Text style={styles.primaryButtonText}>Create sound card</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: 'rgba(54,215,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(54,215,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  inputPanel: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: 112,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
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
  },
  categoryHeader: {
    marginBottom: Spacing.md,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperInline: {
    ...Typography.supportText,
    fontSize: 13,
  },
  createCategoryLink: {
    ...Typography.microLabel,
    color: Colors.primary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  categoryCreatorPanel: {
    marginBottom: Spacing.md,
  },
  categoryInput: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  categoryCreateButton: {
    minHeight: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCreateButtonText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  categoryStack: {
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.supportText,
    color: Colors.warmth,
    marginTop: Spacing.lg,
  },
  footer: {
    marginTop: 'auto',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.35,
  },
});
