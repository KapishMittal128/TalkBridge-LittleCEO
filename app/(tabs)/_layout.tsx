import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { FloatingBottomNav } from '@/components/ui/FloatingBottomNav';
import { useDataStore } from '@/store/data-store';

export default function TabLayout() {
  const initializeData = useDataStore((s) => s.initializeData);

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  return (
    <Tabs
      tabBar={(props) => <FloatingBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute' }, // Allow content to render behind the bar
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
