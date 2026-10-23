import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '../../../screens/Shell';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }} backBehavior="firstRoute">
      <Tabs.Screen name="overview" />
      <Tabs.Screen name="rooms" />
      <Tabs.Screen name="invoices" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
