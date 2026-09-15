import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { THEME } from '../config';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  
  const { register, isLoading } = useContext(AuthContext);

  const handleSignup = async () => {
    setErrorMsg('');
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords don\'t match — double-check and try again.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const result = await register(name, email, password);
    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed. Please try again.');
    }
  };

  const isVitEmail = email.endsWith('@vitstudent.ac.in') || email.endsWith('@vit.ac.in');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🛍️</Text>
          </View>
          <Text style={styles.appTitle}>Campus Exchange</Text>
          <Text style={styles.appTagline}>Join your campus marketplace</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create your account</Text>
          <Text style={styles.cardSubtitle}>Takes less than a minute — we promise!</Text>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
              placeholder="What should we call you?"
              placeholderTextColor={THEME.textLight}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused, isVitEmail && styles.inputVerified]}
              placeholder="your@email.com"
              placeholderTextColor={THEME.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
            {isVitEmail ? (
              <Text style={styles.verifiedHint}>✅ VIT email — you'll get a Verified badge!</Text>
            ) : (
              <Text style={styles.hint}>Use your VIT email to get a Verified badge</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              placeholder="Min. 6 characters"
              placeholderTextColor={THEME.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
              placeholder="Retype your password"
              placeholderTextColor={THEME.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.white} />
            ) : (
              <Text style={styles.signupButtonText}>Create Account 🎉</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.trustNote}>🔒 We never share your info</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 15,
    color: THEME.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: THEME.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#FDF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: THEME.danger,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    color: THEME.text,
    fontWeight: '600',
    marginBottom: 7,
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    color: THEME.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  inputFocused: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
  },
  inputVerified: {
    borderColor: THEME.secondary,
    backgroundColor: THEME.secondaryLight,
  },
  hint: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 5,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  verifiedHint: {
    fontSize: 12,
    color: THEME.secondary,
    marginTop: 5,
    fontWeight: '600',
    lineHeight: 15,
  },
  signupButton: {
    backgroundColor: THEME.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: THEME.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  trustNote: {
    textAlign: 'center',
    color: THEME.textLight,
    fontSize: 12,
    marginTop: 20,
  },
});
