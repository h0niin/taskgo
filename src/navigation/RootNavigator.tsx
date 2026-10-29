import React from 'react';
import { View } from 'react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { CustomerNavigator } from './CustomerNavigator';
import { RunnerNavigator } from './RunnerNavigator';
import { AppHeader } from '../components';
import { useStore } from '../store';

export function RootNavigator() {
  const currentUser = useStore((s) => s.currentUser);
  const adminMode = useStore((s) => s.adminMode);

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Determine which side of the app to render with navigation-level gating
  const isCustomerInterface =
    currentUser.role === 'CUSTOMER' ||
    (currentUser.role === 'ADMIN' && adminMode === 'CUSTOMER');

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      {isCustomerInterface ? <CustomerNavigator /> : <RunnerNavigator />}
    </View>
  );
}

