import { Colors } from '@/constants/theme';

/** Returns the active app theme. SeniorHub uses a fixed light theme for readability. */
export function useTheme() {
  return Colors.light;
}
