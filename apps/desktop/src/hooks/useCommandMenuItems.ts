import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandMenuStore } from '../store/commandMenu';
import { fuzzyMatchMulti } from '../utils/fuzzyMatch';
import type { CommandItem } from '../store/commandMenu';
import type { Page } from '../types/navigation';

interface CommandMenuDeps {
  navigateTo: (page: Page) => void;
  navigateToAgentSurface: (agentName: string, surface: 'chat' | 'profile') => void;
  navigateToSettings: (tab: string) => void;
}

interface GroupedCommands {
  pages: CommandItem[];
  agents: CommandItem[];
  topics: CommandItem[];
  actions: CommandItem[];
}

const PAGE_ICONS: Record<string, string> = {
  home: 'Home',
  chat: 'MessageSquare',
  settings: 'Settings',
};

export function useCommandMenuItems(deps: CommandMenuDeps): GroupedCommands {
  const { navigateTo, navigateToSettings } = deps;
  const { t } = useTranslation('agent');
  const query = useCommandMenuStore((s) => s.query);

  return useMemo(() => {
    const allItems: CommandItem[] = [];

    // Pages
    const pageEntries: Array<{ id: string; page: Page; titleKey: string }> = [
      { id: 'page:home', page: 'home', titleKey: 'agent.commandMenu.page.home' },
      { id: 'page:chat', page: 'chat', titleKey: 'agent.commandMenu.page.chat' },
      { id: 'page:settings', page: 'settings', titleKey: 'agent.commandMenu.page.settings' },
    ];

    for (const entry of pageEntries) {
      const title = t(entry.titleKey);
      allItems.push({
        id: entry.id,
        type: 'page',
        title,
        icon: PAGE_ICONS[entry.page] ?? 'FileText',
        action: () => navigateTo(entry.page),
      });
    }

    // Actions
    const actionEntries: Array<{ id: string; titleKey: string; icon: string; action: () => void }> = [
      {
        id: 'action:new-chat',
        titleKey: 'agent.commandMenu.newChat',
        icon: 'Plus',
        action: () => navigateTo('chat'),
      },
      {
        id: 'action:open-settings',
        titleKey: 'agent.commandMenu.settings',
        icon: 'Settings',
        action: () => navigateToSettings('general'),
      },
    ];

    for (const entry of actionEntries) {
      allItems.push({
        id: entry.id,
        type: 'action',
        title: t(entry.titleKey),
        icon: entry.icon,
        action: entry.action,
      });
    }

    // Filter by query using fuzzy matching
    const filtered = query
      ? allItems
          .map((item) => ({ item, score: fuzzyMatchMulti(query, item.title, item.subtitle) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .map(({ item }) => item)
      : allItems;

    // Group by type
    const grouped: GroupedCommands = { pages: [], agents: [], topics: [], actions: [] };
    for (const item of filtered) {
      grouped[`${item.type}s` as keyof GroupedCommands].push(item);
    }

    return grouped;
  }, [query, navigateTo, navigateToSettings, t]);
}
