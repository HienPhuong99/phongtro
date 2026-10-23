import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../../lib/store';
import { C } from '../../lib/theme';
import { ModalHost } from '../../screens/Modals';
import { Toast } from '../../screens/Shell';

export default function RootLayout() {
  return (
    <StoreProvider>
      <View style={{ flex: 1, backgroundColor: C.page }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <ModalHost />
        <Toast />
      </View>
    </StoreProvider>
  );
}
