'use client';

import { useState, useEffect } from 'react';
import { CirclePlusIcon, PanelLeftIcon, MessageIcon, BellIcon, SwarmIcon, ArrowUpCircleIcon, LifeBuoyIcon, CrosshairIcon, ShieldIcon, PackageIcon, CommandIcon, UsersIcon, TerminalIcon } from './icons.js';
import { getUnreadNotificationCount, getAppVersion } from '../actions.js';
import { SidebarHistory } from './sidebar-history.js';
import { SidebarUserNav } from './sidebar-user-nav.js';
import { UpgradeDialog } from './upgrade-dialog.js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from './ui/sidebar.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';
import { useChatNav } from './chat-nav-context.js';

export function AppSidebar({ user }) {
  const { navigateToChat } = useChatNav();
  const { state, open, setOpenMobile, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const [unreadCount, setUnreadCount] = useState(0);
  const [version, setVersion] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [changelog, setChangelog] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    getUnreadNotificationCount()
      .then((count) => setUnreadCount(count))
      .catch(() => {});
    getAppVersion()
      .then(({ version, updateAvailable, changelog }) => {
        setVersion(version);
        setUpdateAvailable(updateAvailable);
        setChangelog(changelog);
      })
      .catch(() => {});
  }, []);

  return (
    <>
    <Sidebar>
      <SidebarHeader>
        {/* Top row: brand name + toggle */}
        <div className={collapsed ? 'flex justify-center' : 'flex items-center justify-between'}>
          {!collapsed && (
            <span className="px-2 text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="font-semibold text-[--cyan]">Harbinger</span>
              {version && <span className="text-[10px] font-mono font-normal text-muted-foreground ml-1.5">v{version}</span>}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
                onClick={toggleSidebar}
              >
                <PanelLeftIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'bottom'}>
              {collapsed ? 'Open sidebar' : 'Close sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        <SidebarMenu>
          {/* New chat */}
          <SidebarMenuItem className="mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => {
                    navigateToChat(null);
                    setOpenMobile(false);
                  }}
                >
                  <CirclePlusIcon size={16} />
                  {!collapsed && <span>New chat</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">New chat</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Chats */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/chats'; }}
                >
                  <MessageIcon size={16} />
                  {!collapsed && <span>Chats</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Chats</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Swarm */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/swarm'; }}
                >
                  <SwarmIcon size={16} />
                  {!collapsed && <span>Swarm</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Swarm</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Mission Control */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/mission-control'; }}
                >
                  <CommandIcon size={16} />
                  {!collapsed && <span>Mission Control</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Mission Control</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Agents */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/agents'; }}
                >
                  <UsersIcon size={16} />
                  {!collapsed && <span>Agents</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Agents</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Targets */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/targets'; }}
                >
                  <CrosshairIcon size={16} />
                  {!collapsed && <span>Targets</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Targets</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Findings */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/findings'; }}
                >
                  <ShieldIcon size={16} />
                  {!collapsed && <span>Findings</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Findings</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Toolbox */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/toolbox'; }}
                >
                  <PackageIcon size={16} />
                  {!collapsed && <span>Toolbox</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Toolbox</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Logs */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/logs'; }}
                >
                  <TerminalIcon size={16} />
                  {!collapsed && <span>Logs</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Logs</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Notifications */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => { window.location.href = '/notifications'; }}
                >
                  <BellIcon size={16} />
                  {!collapsed && (
                    <span className="flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-[--destructive] px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                  {collapsed && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[--destructive] text-[10px] font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Notifications</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Upgrade */}
          {updateAvailable && (
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    className={collapsed ? 'justify-center' : ''}
                    onClick={() => setUpgradeOpen(true)}
                  >
                    <span className="relative">
                      <ArrowUpCircleIcon size={16} />
                      {collapsed && (
                        <span className="absolute -top-1 -right-1 inline-block h-2 w-2 rounded-full bg-[--cyan]" />
                      )}
                    </span>
                    {!collapsed && (
                      <span className="flex items-center gap-2">
                        Upgrade
                        <span className="inline-flex items-center justify-center rounded-full bg-[--cyan] px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                          v{updateAvailable}
                        </span>
                      </span>
                    )}
                  </SidebarMenuButton>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">Upgrade to v{updateAvailable}</TooltipContent>
                )}
              </Tooltip>
            </SidebarMenuItem>
          )}

          {/* Support */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  className={collapsed ? 'justify-center' : ''}
                  onClick={() => window.open('https://www.skool.com/ai-architects', '_blank')}
                >
                  <LifeBuoyIcon size={16} />
                  {!collapsed && <span>Support</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Support</TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarHeader>

      {!collapsed && (
        <SidebarContent>
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-wider">Chats</SidebarGroupLabel>
          </SidebarGroup>
          <SidebarHistory />
        </SidebarContent>
      )}

      {collapsed && <div className="flex-1" />}

      <SidebarFooter>
        {user && <SidebarUserNav user={user} collapsed={collapsed} />}
      </SidebarFooter>
    </Sidebar>
    <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} version={version} updateAvailable={updateAvailable} changelog={changelog} />
    </>
  );
}
