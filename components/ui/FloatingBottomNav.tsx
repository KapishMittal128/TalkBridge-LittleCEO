import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart3, Home, LayoutGrid, User } from 'lucide-react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONFIG = {
  index: { label: 'Home', icon: Home, path: '/' },
  categories: { label: 'Train', icon: LayoutGrid, path: '/categories' },
  history: { label: 'History', icon: BarChart3, path: '/history' },
  settings: { label: 'Profile', icon: User, path: '/settings' },
} as const;

type TabName = keyof typeof TAB_CONFIG;

function TabItem({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Icon size={24} color={active ? '#3B5BDB' : '#9CA3AF'} strokeWidth={2} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

export function FloatingBottomNav({ state, navigation }: { state: any; navigation: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  function isActiveRoute(name: TabName) {
    const config = TAB_CONFIG[name];
    if (name === 'index') {
      return pathname === '/';
    }
    return pathname === config.path || pathname.startsWith(`${config.path}/`);
  }

  function navigateTo(name: TabName) {
    if (isActiveRoute(name)) {
      return;
    }

    const route = state.routes.find((item: { name: string }) => item.name === name);
    if (route) {
      navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
    }

    router.replace(TAB_CONFIG[name].path);
  }

  const routes = state.routes.filter((route: { name: string }) => route.name in TAB_CONFIG) as {
    key: string;
    name: TabName;
  }[];

  return (
    <View style={[styles.container, { height: 60 + insets.bottom, paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {routes.map((route) => {
          const config = TAB_CONFIG[route.name];
          return (
            <TabItem
              key={route.key}
              icon={config.icon}
              label={config.label}
              active={isActiveRoute(route.name)}
              onPress={() => navigateTo(route.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  row: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: '#EEF2FF',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#3B5BDB',
  },
});
