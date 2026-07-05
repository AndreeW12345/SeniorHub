import { Alert, Platform } from 'react-native';

/** Shows an error alert on all platforms (Alert.alert is a no-op on web). */
export function showErrorAlert(title: string, message: string) {
  console.error(`[SeniorHub] ${title}:`, message);

  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

/** Shows a destructive confirmation dialog on all platforms. */
export function confirmDestructiveAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
) {
  console.log(`[SeniorHub] Bekräftelsedialog visas: ${title}`);

  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    console.log('[SeniorHub] Bekräftelsesvar:', confirmed ? 'ja' : 'nej');

    if (confirmed) {
      onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    { text: 'Avbryt', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
