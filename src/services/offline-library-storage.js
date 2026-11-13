import AsyncStorage from "@react-native-async-storage/async-storage";
import offlineLibrary from "./offline-library";

const offlineStorage = offlineLibrary.createOfflineStorage({
  getItem: key => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: key => AsyncStorage.removeItem(key)
});

export default offlineStorage;
