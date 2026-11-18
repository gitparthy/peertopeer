import { useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, IconButton, geometry } from '@peers-touch/ui';
import { NotificationBell } from './NotificationBell';
import { WindowDragRegion } from './shell/WindowDragRegion';
import { UserProfilePopover, useUserAvatar } from './UserProfilePopover';
import { UserSquareAvatar } from './common/UserSquareAvatar';
import { useNavigationBadgeStore } from '../store/navigationBadges';
import type { Page, Navigation } from '../types/navigation';
import { markInteractionStarted } from '../kernel/frontendRuntimeProfiler';
import { getDesktopHostPolicy } from '../kernel/hostPolicy';
import { useSearchStore } from '../store/search';
import { searchActions } from '../runtimes/searchRuntime';

interface AppSideNavProps {
  page: Page;
  navigation: Navigation;
}

function PrimaryNavAnchor({ pageId, children }: { readonly pageId: string; readonly children: ReactNode }) {
  return (
    <span data-pt-primary-nav={pageId} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function AppSideNav({ page, navigation }: AppSideNavProps) {
  const userAvatar = useUserAvatar();
  const { t, i18n } = useTranslation('layout');
  const searchOpen = useSearchStore((state) => state.open);
  const chatUnreadTotal = useNavigationBadgeStore((state) => state.chatUnreadTotal);
  const momentsEnabled = getDesktopHostPolicy().nativeSocialEnabled;

  const navigatePrimary = useCallback((pageId: Page) => {
    markInteractionStarted('shell', `primary-nav:${pageId}`, { pageId });
    navigation.navigateTo(pageId);
  }, [navigation]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === ',') {
        event.preventDefault();
        navigatePrimary('settings');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigatePrimary]);

  return (
    <WindowDragRegion><nav className="ds-rail" aria-label={t('layout.nav.primary')}>
      <UserProfilePopover>
        <Button actionId="rail.open-self" emphasis="quiet" appearance="identity" className="ds-rail-avatar"
          aria-label={t('layout.user.viewProfile')} aria-haspopup="dialog">
          <UserSquareAvatar remoteUrl={userAvatar.url} name={userAvatar.name} {...geometry.avatar.navigation} />
        </Button>
      </UserProfilePopover>

      <div className="ds-rail-group">
        <PrimaryNavAnchor pageId="search">
          <IconButton actionId="primary-nav.search" iconId="search" iconSize={19}
            label={t('layout.nav.search')} aria-haspopup="dialog"
            aria-expanded={searchOpen || undefined}
            onClick={() => searchActions.open(page, i18n.language)} />
        </PrimaryNavAnchor>

        <PrimaryNavAnchor pageId="chat">
          <span className="ds-rail-entry"
            data-pt-navigation-badge="chat"
            data-pt-unread-count={chatUnreadTotal}>
            <Badge count={chatUnreadTotal} tone="danger" label={t('layout.nav.chat')}>
              <IconButton actionId="primary-nav.chat" iconId="message-circle" iconSize={19}
                label={t('layout.nav.chat')} aria-current={page === 'chat' ? 'page' : undefined}
                onClick={() => navigatePrimary('chat')} />
            </Badge>
          </span>
        </PrimaryNavAnchor>

        {momentsEnabled && (
          <PrimaryNavAnchor pageId="moments">
            <IconButton actionId="primary-nav.moments" iconId="sparkles" iconSize={19}
              label={t('moments.title', { ns: 'moments' })}
              aria-current={page === 'moments' ? 'page' : undefined}
              onClick={() => navigatePrimary('moments')} />
          </PrimaryNavAnchor>
        )}
      </div>

      <span className="ds-rail-spacer" />

      <div className="ds-rail-group">
        <NotificationBell />
        <PrimaryNavAnchor pageId="settings">
          <IconButton actionId="primary-nav.settings" iconId="settings" iconSize={19}
            label={t('layout.nav.settings')}
            aria-current={page === 'settings' ? 'page' : undefined}
            onClick={() => navigatePrimary('settings')} />
        </PrimaryNavAnchor>
      </div>
    </nav></WindowDragRegion>
  );
}
