"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  WrenchIcon,
  Settings2Icon,
  AlertTriangleIcon,
  ClipboardCheckIcon
} from "lucide-react"

// Crane icon custom
const CraneIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 20h16" />
    <path d="M6 16l4-8 4 4" />
    <path d="M10 4v4" />
    <rect x="8" y="8" width="8" height="12" />
  </svg>
)

export function AppSidebar({ user }: { user?: { nama: string; email: string; role: string } }) {
  const pathname = usePathname()

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
      isActive: pathname === "/dashboard",
    },
    ...(user?.role === 'admin' ? [
      {
        title: "Admin",
        url: "/admin",
        icon: <Settings2Icon className="h-4 w-4" />,
        isActive: pathname?.startsWith("/admin"),
        items: [
          {
            title: "RTG Groups",
            url: "/admin/rtg-groups",
            isActive: pathname === "/admin/rtg-groups",
          },
          {
            title: "RTG Units",
            url: "/admin/rtg-units",
            isActive: pathname === "/admin/rtg-units",
          },
        ],
      },
    ] : []),
    ...(user?.role === 'operator' ? [
      {
        title: "Lapor Temuan",
        url: "/operator/temuan",
        icon: <AlertTriangleIcon className="h-4 w-4" />,
        isActive: pathname?.startsWith("/operator/temuan"),
      },
    ] : []),
    ...(user?.role === 'operasional' ? [
      {
        title: "Input Status",
        url: "/operasional/status-harian",
        icon: <ClipboardCheckIcon className="h-4 w-4" />,
        isActive: pathname?.startsWith("/operasional/status-harian"),
      },
    ] : []),
    ...(user?.role === 'mekanik' ? [
      {
        title: "Perbaikan",
        url: "/mekanik/perbaikan",
        icon: <WrenchIcon className="h-4 w-4" />,
        isActive: pathname?.startsWith("/mekanik/perbaikan"),
      },
    ] : []),
  ]

  return (
    <Sidebar collapsible="icon" {...{}}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <CraneIcon className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Dashboard RTG</span>
            <span className="text-xs text-muted-foreground">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Loading...'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
