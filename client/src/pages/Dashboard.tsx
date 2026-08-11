import { Link } from "wouter";
import { BookOpen, Clapperboard, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  draft: AlertCircle,
  "in-progress": Clock,
  complete: CheckCircle2,
};

const statusLabels: Record<string, string> = {
  draft: "ड्राफ्ट",
  "in-progress": "प्रगति पर",
  complete: "पूर्ण",
};

export default function Dashboard() {
  const { data: progress, isLoading: progressLoading } = trpc.progress.overall.useQuery();
  const { data: chapters, isLoading: chaptersLoading } = trpc.chapters.list.useQuery();

  if (progressLoading || chaptersLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const overallPct =
    progress && progress.totalChapters > 0
      ? Math.round((progress.completedChapters / progress.totalChapters) * 100)
      : 0;
  const shlokaPct =
    progress && progress.totalShlokas > 0
      ? Math.round((progress.completedShlokas / progress.totalShlokas) * 100)
      : 0;

  const stats = [
    { label: "अध्याय", value: `${progress?.completedChapters ?? 0}/${progress?.totalChapters ?? 0}`, icon: BookOpen, color: "text-gold" },
    { label: "पूर्ण श्लोक", value: `${progress?.completedShlokas ?? 0}/${progress?.totalShlokas ?? 0}`, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "कुल श्लोक", value: progress?.totalShlokas ?? 0, icon: FileText, color: "text-blue-400" },
    { label: "पूर्णता", value: `${overallPct}%`, icon: Clapperboard, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">निर्माण डैशबोर्ड</h1>
        <p className="text-muted-foreground text-sm">बंजारा गीता वीडियो पुस्तक की निर्माण स्थिति</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`bg-gradient-card border border-border rounded-xl p-5 animate-fade-in-up animate-stagger-${i + 1}`}>
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-card border border-border rounded-xl p-6 animate-fade-in-up animate-stagger-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">कुल प्रगति</h2>
          <span className="text-sm text-gold font-semibold">{overallPct}%</span>
        </div>
        <Progress value={overallPct} className="h-3" />
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>श्लोक पूर्णता: {shlokaPct}%</span>
          <span>{progress?.completedShlokas ?? 0} / {progress?.totalShlokas ?? 0} श्लोक</span>
        </div>
      </div>

      <div className="animate-fade-in-up animate-stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">अध्याय स्थिति</h2>
          <Link href="/chapters" className="text-sm text-gold hover:text-gold-bright transition-colors">
            सब देखें →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {chapters?.map((chapter) => {
            const StatusIcon = statusIcons[chapter.status] ?? AlertCircle;
            const pct =
              chapter.totalShlokas > 0
                ? Math.round((chapter.completedShlokas / chapter.totalShlokas) * 100)
                : 0;
            return (
              <Link
                key={chapter.id}
                href={`/chapters/${chapter.id}`}
                className="bg-gradient-card border border-border rounded-xl p-4 hover:border-gold/30 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-medium text-gold/70 tracking-wider">
                      अध्याय {chapter.chapterNumber}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground mt-0.5 line-clamp-1">
                      {chapter.titleBanjara}
                    </h3>
                  </div>
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusColors[chapter.status]?.split(" ")[1]}`} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[chapter.status]}`}>
                    {statusLabels[chapter.status]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {chapter.completedShlokas}/{chapter.totalShlokas} श्लोक
                  </span>
                </div>
              </Link>
            );
          }) ??
            (chaptersLoading ? (
              <p className="text-muted-foreground col-span-full">लोड हो रहा है...</p>
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">
                अध्याय नहीं मिले। कृपया एडमिन पैनल से अध्याय जोड़ें।
              </p>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/storyboard", label: "स्टोरीबोर्ड", icon: Clapperboard },
          { href: "/ai-chat", label: "AI सहायक", icon: FileText },
          { href: "/progress", label: "प्रगति", icon: BookOpen },
          { href: "/pdf", label: "PDF दृश्यक", icon: FileText },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-gold hover:border-gold/40 transition-all">
            <action.icon className="w-4 h-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
