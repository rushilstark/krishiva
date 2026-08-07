import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

function openSettingsAlert(title: string, message: string) {
  if (Platform.OS === 'web') return;
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

function preAsk(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(true);
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', onPress: () => resolve(true) },
    ]);
  });
}

export async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) {
    openSettingsAlert('Camera access needed', 'Camera permission was denied earlier. Enable it in Settings to click photos or record videos.');
    return false;
  }
  const proceed = await preAsk('Use your camera', 'Krishiva needs camera access so you can click photos and record videos of your farm to share.');
  if (!proceed) return false;
  const res = await ImagePicker.requestCameraPermissionsAsync();
  if (!res.granted && !res.canAskAgain) {
    openSettingsAlert('Camera access needed', 'Enable camera access in Settings to use this feature.');
  }
  return res.granted;
}

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) {
    openSettingsAlert('Photos access needed', 'Photo library permission was denied earlier. Enable it in Settings to share photos and videos.');
    return false;
  }
  const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!res.granted && !res.canAskAgain) {
    openSettingsAlert('Photos access needed', 'Enable photo library access in Settings to use this feature.');
  }
  return res.granted;
}

export async function ensureLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) {
    openSettingsAlert('Location access needed', 'Location permission was denied earlier. Enable it in Settings, or type your location manually.');
    return false;
  }
  const proceed = await preAsk('Find farmers near you', 'Krishiva uses your location to auto-fill your village/city and show localized farming tips.');
  if (!proceed) return false;
  const res = await Location.requestForegroundPermissionsAsync();
  if (!res.granted && !res.canAskAgain) {
    openSettingsAlert('Location access needed', 'Enable location access in Settings, or type your location manually.');
  }
  return res.granted;
}

export async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1];
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  const FileSystem = await import('expo-file-system/legacy');
  return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
}
