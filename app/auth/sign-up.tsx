import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth, type AuthFieldErrors } from '@/contexts/AuthContext';
import {
  Colors,
  FontSize,
  FontWeight,
  Spacing,
  Radius,
  TouchTarget,
  Shadow,
  Typography,
} from '@/constants/theme';
import { Lock, UserPlus, ArrowLeft, UserRound } from 'lucide-react-native';
import { SectionLabel } from '@/components/ui/SectionLabel';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  async function handleSignUp() {
    clearError();
    const result = await register(username, password, confirmPassword);
    setFieldErrors(result.fieldErrors ?? {});
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/auth/sign-in')}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + Spacing['2xl'],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroBlock, { marginTop: Spacing.md }]}>
            <View style={styles.heroIcon}>
              <UserPlus size={28} color={Colors.secondary} strokeWidth={2} />
            </View>
            <SectionLabel
              centered
              eyebrow="Join TalkBridge"
              title="Create account"
              subtitle="Everything runs on your device - no cloud required for training or recognition."
              style={{ marginBottom: 0 }}
            />
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <UserRound size={14} color={Colors.textMuted} />
                  <Text style={styles.fieldLabel}>Username</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                    if (error) clearError();
                  }}
                  placeholder="kapish"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {fieldErrors.username ? <Text style={styles.inlineError}>{fieldErrors.username}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Lock size={14} color={Colors.textMuted} />
                  <Text style={styles.fieldLabel}>Password</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (error) clearError();
                  }}
                  placeholder="At least 8 characters"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
                {fieldErrors.password ? <Text style={styles.inlineError}>{fieldErrors.password}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Lock size={14} color={Colors.textMuted} />
                  <Text style={styles.fieldLabel}>Confirm password</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    if (error) clearError();
                  }}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
                {fieldErrors.confirmPassword ? <Text style={styles.inlineError}>{fieldErrors.confirmPassword}</Text> : null}
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Create account</Text>
                    <UserPlus size={18} color={Colors.background} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.switchLink}
            onPress={() => router.replace('/auth/sign-in')}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLinkText}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  topBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...Shadow.luxe,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    ...Shadow.luxe,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    ...Typography.microLabel,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    borderRadius: Radius.md,
    height: TouchTarget.comfortable,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  inlineError: {
    fontSize: FontSize.sm,
    color: Colors.emergency,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.emergency,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  button: {
    backgroundColor: Colors.secondary,
    height: TouchTarget.comfortable,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },
  switchLink: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.md,
  },
  switchText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  switchLinkText: {
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },
});
