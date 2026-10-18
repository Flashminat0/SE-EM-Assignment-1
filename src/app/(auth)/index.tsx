import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { authError, signIn } from '@/lib/auth';
import { space } from '@/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ field: 'email' | 'password'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!email.trim()) {
      setError({ field: 'email', text: 'Enter your email address.' });
      return;
    }
    if (!password) {
      setError({ field: 'password', text: 'Enter your password.' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError({ field: 'password', text: authError(e) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <View style={{ gap: space[5], paddingTop: space[12] }}>
        <View style={{ gap: space[2], marginBottom: space[4] }}>
          <T role="display">Edu-Alarm</T>
          <T tone="secondary">Lectures, deadlines and exams, with alarms that work offline.</T>
        </View>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={error?.field === 'email' ? error.text : undefined}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          error={error?.field === 'password' ? error.text : undefined}
          onSubmitEditing={() => void go()}
        />
        <Button label="Sign in" onPress={() => void go()} loading={busy} disabled={!email || !password} />
        <Link href="/(auth)/sign-up" asChild>
          <Button label="Create an account" kind="ghost" onPress={() => {}} />
        </Link>
      </View>
    </Screen>
  );
}
