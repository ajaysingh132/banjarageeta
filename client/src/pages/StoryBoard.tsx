import { Link } from "wouter";
import { Film, BookOpen, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; color: string; badge: string }> = {
  draft: { icon: AlertCircle, label: "ड्राफ्ट", color: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "in-progress": { icon: Clock, label: "प्रगति पर", color: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  complete: { icon: CheckCircle2, label: "पूर्ण", color: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

export default function StoryBoard() {
  const { data: chapters, isLoading } = trpc.chapters.list.useQuery();
  const { data: sceneImages } = trpc.scenes.coverImages.useQuery();
  const sorted = chapters?.sort((a, b) => a.chapterNumber - b.chapterNumber) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-card rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">स्टोरीबोर्ड</h1>
        <p className="text-muted-foreground text-sm">
          18 अध्यायों का विशुअल कार्ड डैशबोर्ड — प्रत्येक श्लोक के लिए एक सीन
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((chapter, i) => {
          const cfg = statusConfig[chapter.status] ?? statusConfig.draft;
          const pct =
            chapter.totalShlokas > 0
              ? Math.round((chapter.completedShlokas / chapter.totalShlokas) * 100)
              : 0;
          const StatusIcon = cfg.icon;
          return (
            <Link
              key={chapter.id}
              href={`/chapters/${chapter.id}`}
              className={cn(
                "group relative bg-gradient-card border border-border rounded-xl overflow-hidden hover:border-gold/40 transition-all duration-300 animate-fade-in-up animate-stagger-",
                Math.min(i + 1, 6)
              )}>
              {/* Card header with number (or scene thumbnail) */}
              <div className="relative h-28 bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center overflow-hidden">
                {sceneImages?.[chapter.id] ? (
                  <img src={sceneImages[chapter.id]} alt={chapter.titleBanjara} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-5xl font-display font-bold text-gold/20 group-hover:text-gold/35 transition-colors">
                    {String(chapter.chapterNumber).padStart(2, "0")}
                  </span>
                )}
                <div className="absolute top-3 right-3">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", cfg.badge)}>
                    <StatusIcon className={cn("w-3 h-3", cfg.color)} />
                    {cfg.label}
                  </span>
                </div>
                <BookOpen className="absolute bottom-2 left-3 w-4 h-4 text-gold/30" />
                <span className="absolute bottom-2 left-8 text-[10px] text-gold/40 font-medium">
                  {chapter.totalShlokas} श्लोक
                </span>
              </div>

              {/* Card body */}
              <div className="p-4">
                <h3 className="font-display text-base font-semibold text-foreground line-clamp-1">
                  {chapter.titleBanjara}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{chapter.titleHindi}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-gold font-semibold w-8 text-right">{pct}%</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    {chapter.completedShlokas}/{chapter.totalShlokas} सीन
                  </span>
                  <span className="text-[10px] text-gold/70 group-hover:text-gold transition-colors">
                    खोलें →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 bg-gradient-card border border-border rounded-xl">
          <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">कोई अध्याय नहीं है। एडमिन पैनल से 18 अध्याय जोड़ें।</p>
        </div>
      )}
    </div>
  );
}
