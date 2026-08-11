import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  LayoutDashboard,
  Clapperboard,
  MessageCircle,
  Settings,
  FileText,
  TrendingUp,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const navItems = [
  { href: "/dashboard", label: "डैशबोर्ड", icon: LayoutDashboard },
  { href: "/chapters", label: "अध्याय", icon: BookOpen },
  { href: "/storyboard", label: "स्टोरीबोर्ड", icon: Clapperboard },
  { href: "/ai-chat", label: "AI सहायक", icon: MessageCircle },
  { href: "/progress", label: "प्रगति", icon: TrendingUp },
  { href: "/pdf", label: "PDF दृशक", icon: FileText },
  { href: "/admin", label: "एडमिन", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-royal">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-display text-gold-bright">बंजारा गीतामृत — वीडियो पुस्तक</h2>
          <p className="text-muted-foreground">कृपया प्रवेश करें</p>
          <a
            href={getLoginUrl()}
            className="inline-block px-6 py-3 bg-gradient-gold text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">
            लॉगिन करें
          </a>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-sidebar-foreground leading-tight">
              बंजारा गीतामृत
            </h1>
            <p className="text-[11px] text-muted-foreground">वीडियो पुस्तक निर्माता</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}>
            <item.icon className={cn("w-4 h-4", isActive(item.href) && "text-gold")} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name ?? "उपयोगकर्ता"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role === "admin" ? "एडमिन" : "दर्शक"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-royal flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span>बंजारा गीतामृत</span>
          </Link>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
