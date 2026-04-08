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
import { Lock, LogIn, UserRound } from 'lucide-react-native';
import { SectionLabel } from '@/components/ui/SectionLabel';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  async function handleSignIn() {
    clearError();
    const result = await login(username, password);
    setFieldErrors(result.fieldErrors ?? {});
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.lg,
              paddingBottom: insets.bottom + Spacing['2xl'],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            <View style={styles.heroIcon}>
              <LogIn size={28} color={Colors.primary} strokeWidth={2} />
            </View>
            <SectionLabel
              centered
              eyebrow="Welcome back"
              title="Sign in"
              subtitle="Your sound cards and training stay on this device."
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
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
                {fieldErrors.password ? <Text style={styles.inlineError}>{fieldErrors.password}</Text> : null}
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
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Sign in</Text>
                    <LogIn size={18} color={Colors.background} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.switchLink}
            onPress={() => router.replace('/auth/sign-up')}
          >
            <Text style={styles.switchText}>
              New here?{' '}
              <Text style={styles.switchLinkText}>Create an account</Text>
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
  heroBlock: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
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
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
