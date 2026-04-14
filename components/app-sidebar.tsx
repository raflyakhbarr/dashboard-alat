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
    ...(user?.role === 'operasional' ? [
      {
        title: "Master Data",
        url: "/operasional",
        icon: <Settings2Icon className="h-4 w-4" />,
        isActive: pathname?.startsWith("/operasional/rtg-"),
        items: [
          {
            title: "RTG Groups",
            url: "/operasional/rtg-groups",
            isActive: pathname === "/operasional/rtg-groups",
          },
          {
            title: "RTG Units",
            url: "/operasional/rtg-units",
            isActive: pathname === "/operasional/rtg-units",
          },
        ],
      },
      {
        title: "Laporan Kerusakan",
        url: "/operasional/buat-laporan",
        icon: <AlertTriangleIcon className="h-4 w-4" />,
        isActive: pathname?.startsWith("/operasional/") && !pathname?.includes("/rtg-"),
        items: [
          {
            title: "Buat Laporan",
            url: "/operasional/buat-laporan",
            isActive: pathname === "/operasional/buat-laporan",
          },
          {
            title: "Daftar Laporan",
            url: "/operasional/daftar-laporan",
            isActive: pathname === "/operasional/daftar-laporan",
          },
        ],
      },
    ] : []),
    ...(user?.role === 'peralatan_terminal' || user?.role === 'perencanaan_persediaan' || user?.role === 'fasilitas' ? [
      {
        title: "Laporan Saya",
        url: `/${user.role}/laporan`,
        icon: <ClipboardCheckIcon className="h-4 w-4" />,
        isActive: pathname?.startsWith(`/${user.role}/laporan`),
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
