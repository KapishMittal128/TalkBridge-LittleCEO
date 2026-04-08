import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/lib/storage';

export const dataStorage = {
  async getItem(key: string): Promise<string | null> {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }

    return storage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
