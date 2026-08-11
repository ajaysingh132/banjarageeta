import { Link } from "wouter";
import { TrendingUp, CheckCircle2, Circle, Loader2, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Progress as UIProgress } from "@/components/ui/progress";

export default function Progress() {
  const { data: progress, isLoading } = trpc.progress.overall.useQuery();
  const { data: chapters, isLoading: chaptersLoading } = trpc.chapters.list.useQuery();
  const sorted = chapters?.sort((a, b) => a.chapterNumber - b.chapterNumber) ?? [];

  const pct = progress && progress.totalShlokas > 0
    ? Math.round((progress.completedShlokas / progress.totalShlokas) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">उत्पादन प्रगति</h1>
        <p className="text-muted-foreground text-sm">18 अध्यायों की वीडियो पुस्तक निर्माण स्थिति</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-card border border-border rounded-xl p-5 flex flex-col items-center text-center">
            <div className="text-4xl font-display font-bold text-gold">{progress?.totalChapters ?? 0}/18</div>
            <p className="text-xs text-muted-foreground mt-1">अध्याय</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-xl p-5 flex flex-col items-center text-center">
            <div className="text-4xl font-display font-bold text-gold">{progress?.completedShlokas ?? 0}/{progress?.totalShlokas ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">श्लोक (सीन पूर्ण)</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-xl p-5 flex flex-col items-center text-center">
            <div className="text-4xl font-display font-bold text-gold">{pct}%</div>
            <p className="text-xs text-muted-foreground mt-1">सम्पूर्णता</p>
            <div className="w-full mt-2"><UIProgress value={pct} className="h-1.5" /></div>
          </div>
        </div>
      )}

      <div className="bg-gradient-card border border-border rounded-xl p-5">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" /> अध्याय-वार प्रगति
        </h2>
        {chaptersLoading ? (
          <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-background/50 rounded" />)}</div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((c) => {
              const cp = c.totalShlokas > 0 ? Math.round((c.completedShlokas / c.totalShlokas) * 100) : 0;
              return (
                <Link key={c.id} href={`/chapters/${c.id}`} className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-4 py-2.5 hover:border-gold/40 transition-colors group">
                  <span className="text-xs font-semibold text-gold w-6">{c.chapterNumber}</span>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{c.titleBanjara}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{c.completedShlokas}/{c.totalShlokas} श्लोक</span>
                  <div className="w-28 hidden md:block"><UIProgress value={cp} className="h-1.5" /></div>
                  <span className="text-xs font-semibold text-gold/80 w-10 text-right">{cp}%</span>
                  {c.status === "complete" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : c.status === "in-progress" ? (
                    <Loader2 className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </Link>
              );
            })}
            {sorted.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">अभी कोई अध्याय नहीं है।</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
