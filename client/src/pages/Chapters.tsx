import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const statusLabels: Record<string, string> = {
  draft: "ड्राफ्ट",
  "in-progress": "प्रगति पर",
  complete: "पूर्ण",
};

export default function Chapters() {
  const { data: chapters, isLoading } = trpc.chapters.list.useQuery();
  const [filter, setFilter] = useState<string>("all");

  const filtered = chapters?.filter(
    (c) => filter === "all" || c.status === filter
  );

  if (isLoading) {
    return <div className="animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-card rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">अध्याय</h1>
        <p className="text-muted-foreground text-sm">बंजारा गीता के 18 अध्याय — तीन-भाषा सामग्री के साथ</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all">सभी ({chapters?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="draft">ड्राफ्ट</TabsTrigger>
          <TabsTrigger value="in-progress">प्रगति पर</TabsTrigger>
          <TabsTrigger value="complete">पूर्ण</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered?.map((chapter, i) => {
          const pct =
            chapter.totalShlokas > 0
              ? Math.round((chapter.completedShlokas / chapter.totalShlokas) * 100)
              : 0;
          return (
            <Link
              key={chapter.id}
              href={`/chapters/${chapter.id}`}
              className={`block bg-gradient-card border border-border rounded-xl p-5 hover:border-gold/30 transition-all animate-fade-in-up animate-stagger-${Math.min(i + 1, 6)}`}>
              <div className="flex items-center gap-4">
                {/* Chapter number */}
                <div className="w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground font-display">{chapter.chapterNumber}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base line-clamp-1">{chapter.titleBanjara}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{chapter.titleHindi}</p>
                  {chapter.titleSanskrit && (
                    <p className="text-xs text-gold/70 line-clamp-1 mt-0.5 font-serif italic">{chapter.titleSanskrit}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="hidden md:flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${statusColors[chapter.status]}`}>
                    {statusLabels[chapter.status]}
                  </span>
                  <div className="flex items-center gap-2 w-32">
                    <Progress value={pct} className="h-1.5" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {chapter.completedShlokas}/{chapter.totalShlokas} श्लोक
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>

              {/* Mobile stats */}
              <div className="md:hidden flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${statusColors[chapter.status]}`}>
                  {statusLabels[chapter.status]}
                </span>
                <span className="text-[10px] text-muted-foreground">{chapter.completedShlokas}/{chapter.totalShlokas} श्लोक</span>
              </div>
            </Link>
          );
        }) ?? (
          <p className="text-muted-foreground text-center py-12">अध्याय नहीं मिले</p>
        )}
      </div>
    </div>
  );
}
