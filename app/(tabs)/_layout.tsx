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
        tabBarStyle: { position: 'absolute' },
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
          title: 'Train',
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
