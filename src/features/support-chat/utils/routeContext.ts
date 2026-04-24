import { resolvePageLabel } from '@/constants/routeResolver';
import type { SupportChatRouteContext } from '../types/supportChat';

export const getSupportChatRouteContext = (
  pathname: string,
): SupportChatRouteContext => ({
  pathname,
  pageLabel: resolvePageLabel(pathname),
});
