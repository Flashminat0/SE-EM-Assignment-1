import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Text';
import { authError, signUp } from '@/lib/auth';
import { space } from '@/theme';

// Limits set by Firebase Auth and the rules.
const MIN_PASSWORD = 6;
const MAX_NAME = 80;
const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Why the button is greyed out.
  const missing = [
    !name.trim() && 'your name',
    !email.trim() && 'your email address',
    password.length < MIN_PASSWORD && `a password of at least ${MIN_PASSWORD} characters`,
  ].filter((m): m is string => !!m);
  const go = async () => {
    setBusy(true);
    setError('');
    try {
      await signUp(name.trim(), email, password);
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Create account" right={<Button label="Back" kind="ghost" onPress={() => router.back()} />}>
      <View style={{ gap: space[5] }}>
        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          maxLength={MAX_NAME}
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          hint={`At least ${MIN_PASSWORD} characters.`}
          error={error}
        />
        <View style={{ gap: space[2] }}>
          <Button label="Create account" onPress={() => void go()} loading={busy} disabled={missing.length > 0} />
          {missing.length > 0 ? (
            <T role="footnote" tone="secondary">
              Still needed: {list(missing)}.
            </T>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
