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

/** Shows a success alert on all platforms. */
export function showSuccessAlert(title: string, message: string) {
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
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);

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

type SeriesActionChoice = 'occurrence' | 'series';

/**
 * Asks whether to apply a destructive action to one occurrence or the whole series.
 */
export function confirmSeriesDestructiveAction(
  title: string,
  message: string,
  onChoose: (choice: SeriesActionChoice) => void,
) {
  if (Platform.OS === 'web') {
    const removeSeries = window.confirm(
      `${title}\n\n${message}\n\nTryck OK för att påverka HELA serien.\nTryck Avbryt för att välja endast detta tillfälle.`,
    );

    if (removeSeries) {
      onChoose('series');
      return;
    }

    const removeOccurrence = window.confirm(
      `${title}\n\nVill du fortsätta med endast detta tillfälle?`,
    );

    if (removeOccurrence) {
      onChoose('occurrence');
    }

    return;
  }

  Alert.alert(title, message, [
    { text: 'Avbryt', style: 'cancel' },
    {
      text: 'Endast detta tillfälle',
      style: 'destructive',
      onPress: () => onChoose('occurrence'),
    },
    {
      text: 'Hela serien',
      style: 'destructive',
      onPress: () => onChoose('series'),
    },
  ]);
}
