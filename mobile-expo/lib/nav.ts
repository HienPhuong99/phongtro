import { router, usePathname } from 'expo-router';
import type { NavTab } from './shared';

/** Mở màn mới chồng lên tab đang đứng — vuốt mép trái (iOS) hoặc Back (Android) để quay lại */
export function useOpen() {
  const tab = usePathname().split('/')[1] || 'overview';
  return (screen: NavTab) => router.push(`/${tab}/${screen}`);
}
