import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, Radius, TouchTarget, Motion } from '@/constants/theme';
import { useDataStore } from '@/store/data-store';
import { X, PlusCircle, Sparkles } from 'lucide-react-native';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SectionLabel } from '@/components/ui/SectionLabel';
import Animated, { FadeInDown, SlideInUp, FadeInUp } from 'react-native-reanimated';
import { CATEGORY_METADATA, DEFAULT_CATEGORY_COLOR } from '@/constants/categories';
import { slugify } from '@/lib/slug';

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const { categories, createCard, initializeData, isLoading } = useDataStore();
  const [label, setLabel] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void initializeData();
    }, [initializeData]),
  );

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleSave = async () => {
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
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuroraBackground>
      <Animated.View
        entering={SlideInUp.springify()
          .damping(Motion.spring.gentle.damping)
          .stiffness(Motion.spring.gentle.stiffness)}
        style={[styles.container, { paddingTop: insets.top + Spacing.md }]}
      >
        <Animated.View entering={FadeInDown.springify().delay(120)} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.heroIcon}>
              <Sparkles size={22} color={Colors.primary} />
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
              ]}
            >
              <X size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <SectionLabel
            eyebrow="Create"
            title="New sound card"
            subtitle="This phrase is what TalkBridge speaks after your voice matches this card."
            style={{ marginBottom: 0 }}
          />
        </Animated.View>

        {isLoading && categories.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingCap}>Loading categories…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <GlassPanel variant="elevated" padding={Spacing.xl} style={styles.formPanel}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phrase</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. I need a break"
                    placeholderTextColor={Colors.textMuted}
                    value={label}
                    onChangeText={setLabel}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryPicker}>
                  {categories.map((cat) => {
                    const meta = CATEGORY_METADATA[cat.slug] || { color: DEFAULT_CATEGORY_COLOR };
                    const isSelected = selectedCategoryId === cat.id;

                    return (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryOption,
                          isSelected && {
                            borderColor: meta.color,
                            backgroundColor: `${meta.color}18`,
                          },
                        ]}
                        onPress={() => setSelectedCategoryId(cat.id)}
                      >
                        <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                        <Text
                          style={[
                            styles.categoryOptionText,
                            isSelected && { color: Colors.textPrimary, fontWeight: FontWeight.bold },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.hintBox}>
                <Text style={styles.hint}>
                  Then open the Bank → choose this category → tap TRAIN and record three clean samples.
                </Text>
              </View>
            </GlassPanel>
          </ScrollView>
        )}

        <Animated.View
          entering={FadeInUp.springify().delay(400).damping(Motion.spring.snappy.damping)}
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && { transform: [{ scale: 0.99 }] },
              (!label.trim() || !selectedCategoryId || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!label.trim() || !selectedCategoryId || saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <PlusCircle size={22} color={Colors.background} />
                <Text style={styles.saveButtonText}>Create sound card</Text>
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
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingCap: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  formPanel: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing['2xl'],
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
    minHeight: TouchTarget.comfortable,
  },
  textInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    lineHeight: 24,
  },
  categoryPicker: {
    gap: Spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryOptionText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  hintBox: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(56, 226, 177, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56, 226, 177, 0.2)',
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: TouchTarget.comfortable,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  saveButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
});
