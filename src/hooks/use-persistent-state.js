import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PREFERENCES_KEY = "@ayah/preferences-v1";

export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREFERENCES_KEY + ":" + key).then(async raw => {
      if (!active) return;
      if (raw !== null) {
        try {
          setValue(JSON.parse(raw));
        } catch (_error) {
          console.warn("Resetting unreadable preference:", key);
          await AsyncStorage.removeItem(PREFERENCES_KEY + ":" + key);
          if (active) setValue(initialValue);
        }
      }
    }).catch(error => {
      console.warn("Could not load saved Ayah preferences:", error);
    }).finally(() => {
      if (active) setHydrated(true);
    });
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PREFERENCES_KEY + ":" + key, JSON.stringify(value))
      .catch(error => console.warn("Could not save Ayah preferences:", error));
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
