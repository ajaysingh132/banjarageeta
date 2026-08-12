import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Mic,
  Volume2,
  Copy,
  X,
  Clock3,
  Lightbulb,
  Music,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const sceneStatusColors: Record<string, string> = {
  "not-started": "text-muted-foreground",
  draft: "text-yellow-400",
  "in-progress": "text-blue-400",
  complete: "text-emerald-400",
};

const sceneStatusIcons: Record<string, typeof CheckCircle2> = {
  "not-started": AlertCircle,
  draft: AlertCircle,
  "in-progress": Clock,
  complete: CheckCircle2,
};

const sceneStatusLabels: Record<string, string> = {
  "not-started": "शुरू नहीं",
  draft: "ड्राफ्ट",
  "in-progress": "प्रगति पर",
  complete: "पूर्ण",
};

export default function ChapterDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const [generateTarget, setGenerateTarget] = useState<number | null>(null);
  const [voiceoverTarget, setVoiceoverTarget] = useState<number | null>(null);
  const [voiceoverResult, setVoiceoverResult] = useState<{
    shlokaVerse: string;
    script: {
      narrationBanjara: string | null;
      narrationHindi: string | null;
      openingLine: string | null;
      closingLine: string | null;
      estimatedDurationSeconds: number | null;
      toneNotes: string | null;
      soundCues: string | null;
    } | null;
  } | null>(null);
  const { data: chapter, isLoading: chapterLoading } = trpc.chapters.get.useQuery({ id });
  const { data: shlokas, isLoading: shlokasLoading } = trpc.shlokas.listWithScenes.useQuery({ chapterId: id });
  const utils = trpc.useUtils();
  const { data: allChapters } = trpc.chapters.list.useQuery();

  const updateSceneStatus = trpc.scenes.update.useMutation({
    onSuccess: () => {
      toast.success("सीन स्थिति अपडेट हुई");
      utils.shlokas.listWithScenes.invalidate({ chapterId: id });
    },
    onError: (err: { message?: string }) => toast.error(err.message),
  });

  const generateSceneMutation = trpc.scenes.generateScene.useMutation({
    onSuccess: () => {
      toast.success("AI ने सीन विवरण बनाया। सीन एडिटर में देखें और संपादित करें।");
      utils.shlokas.listWithScenes.invalidate({ chapterId: id });
    },
    onError: (err) => {
      toast.error(err.message || "AI सीन जनरेशन में त्रुटि");
    },
    onSettled: () => setGenerateTarget(null),
  });

  const generateVoiceoverMutation = trpc.ai.voiceoverScript.useMutation({
    onSuccess: (res) => {
      setVoiceoverResult({ shlokaVerse: res.shlokaVerse, script: res.script });
      // Keep dialog open after success so the user can read the generated script.
      setVoiceoverActive(true);
    },
    onError: (err) => {
      toast.error(err.message || "वॉयसओवर जनरेशन में त्रुटि");
      setVoiceoverResult(null);
      setVoiceoverActive(false);
    },
    onSettled: () => setVoiceoverTarget(null),
  });

  // Separate dialog-visibility state from the generation target, so the
  // result dialog stays open after generation finishes.
  const [voiceoverActive, setVoiceoverActive] = useState(false);

  const copyToClipboard = async (text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("स्क्रिप्ट कॉपी हो गई");
    } catch {
      toast.error("कॉपी नहीं हो सकी");
    }
  };

  const pct =
    chapter && chapter.totalShlokas > 0 ? Math.round((chapter.completedShlokas / chapter.totalShlokas) * 100) : 0;
  const sortedChapters = allChapters ? [...allChapters].sort((a, b) => a.chapterNumber - b.chapterNumber) : [];
  const currentIndex = sortedChapters.findIndex((c) => c.id === id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  if (chapterLoading || shlokasLoading) {
    return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl" />)}</div>;
  }

  if (!chapter) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">अध्याय नहीं मिला</p>
        <Link href="/chapters" className="text-gold text-sm mt-2 inline-block hover:text-gold-bright transition-colors">
          ← अध्यायों पर जाएं
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <Link href="/chapters" className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors text-sm mb-4">
          <ChevronLeft className="w-4 h-4" />
          सभी अध्याय
        </Link>
        <div className="bg-gradient-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0 shadow-gold">
              <span className="text-xl font-bold text-primary-foreground font-display">{chapter.chapterNumber}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground line-clamp-1">{chapter.titleBanjara}</h1>
              <p className="text-sm text-muted-foreground">{chapter.titleHindi}</p>
              {chapter.titleSanskrit && (
                <p className="text-xs text-gold/70 font-serif italic mt-0.5">{chapter.titleSanskrit}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={pct} className="h-2 flex-1" />
            <span className="text-sm text-gold font-semibold">{pct}%</span>
            <span className="text-xs text-muted-foreground">
              {chapter.completedShlokas}/{chapter.totalShlokas} श्लोक पूर्ण
            </span>
          </div>
          {chapter.descriptionBanjara && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{chapter.descriptionBanjara}</p>
          )}
        </div>

        {/* प्रथम श्लोक — आधिकारिक कलाकृति (बंजारा गीतामृत पुस्तक से) */}
        {chapter.chapterNumber === 1 && (
          <div className="bg-gradient-card border border-gold/30 rounded-xl overflow-hidden">
            <img
              src="/manus-storage/banjara-gita-shloka-page_9ce91dc0.jpg"
              alt="बंजारा गीतामृत — प्रथम श्लोक कलाकृति"
              className="w-full object-contain" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            श्लोक और सीन ({shlokas?.length ?? 0})
          </h2>
          <Button size="sm" asChild className="bg-gradient-gold text-primary-foreground hover:opacity-90">
            <Link href={`/scenes/new?chapterId=${id}`}>
              <Plus className="w-4 h-4" /> नया श्लोक जोड़ें
            </Link>
          </Button>
        </div>

        {(shlokas ?? []).map((item, i) => {
          const shloka = item.shlokas;
          const scene = item.scenes;
          const status = shloka.sceneStatus ?? "not-started";
          const StatusIcon = sceneStatusIcons[status] ?? AlertCircle;
          return (
            <div
              key={shloka.id}
              className={`bg-gradient-card border border-border rounded-xl overflow-hidden animate-fade-in-up animate-stagger-${Math.min(i + 1, 6)}`}>
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-gold/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gold">{shloka.shlokaNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">श्लोक {shloka.verseNumber} · बोलने वाला: {shloka.speakerBanjara ?? shloka.speaker}</p>
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {shloka.banjara ?? shloka.sanskrit ?? "(शीर्षक नहीं)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusIcon className={`w-4 h-4 ${sceneStatusColors[status]}`} />
                  <span className="text-[10px] text-muted-foreground">{sceneStatusLabels[status]}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold text-xs"
                    onClick={() => navigate(`/scenes/${shloka.id}`)}>
                    <Film className="w-3.5 h-3.5 mr-1" />
                    सीन
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10 text-xs"
                    disabled={generateTarget === shloka.id}
                    onClick={() => {
                      setGenerateTarget(shloka.id);
                      generateSceneMutation.mutate({ shlokaId: shloka.id });
                    }}>
                    {generateTarget === shloka.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                    )}
                    AI सीन
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent text-xs"
                    disabled={voiceoverTarget === shloka.id}
                    onClick={() => {
                      setVoiceoverTarget(shloka.id);
                      setVoiceoverResult(null);
                      setVoiceoverActive(true);
                      generateVoiceoverMutation.mutate({ shlokaId: shloka.id });
                    }}>
                    {voiceoverTarget === shloka.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 mr-1" />
                    )}
                    AI वॉयसओवर
                  </Button>
                </div>
              </div>

              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {shloka.sanskrit && (
                  <div className="bg-background/40 rounded-lg p-3 border border-border/50">
                    <p className="text-[9px] uppercase tracking-wider text-gold/60 mb-1">संस्कृत</p>
                    <p className="text-xs text-foreground/90 leading-relaxed font-serif italic line-clamp-3">{shloka.sanskrit}</p>
                  </div>
                )}
                {shloka.banjara && (
                  <div className="bg-background/40 rounded-lg p-3 border border-border/50">
                    <p className="text-[9px] uppercase tracking-wider text-gold/60 mb-1">बंजारा</p>
                    <p className="text-xs text-foreground/90 leading-relaxed line-clamp-3">{shloka.banjara}</p>
                  </div>
                )}
                {shloka.hindi && (
                  <div className="bg-background/40 rounded-lg p-3 border border-border/50">
                    <p className="text-[9px] uppercase tracking-wider text-gold/60 mb-1">हिंदी</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{shloka.hindi}</p>
                  </div>
                )}
              </div>

              {scene && (
                <div className="px-4 pb-4">
                  <div className="bg-primary/5 border border-gold/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] uppercase tracking-wider text-gold font-semibold">सीन पूर्वावलोकन</span>
                      <Select value={scene.status} onValueChange={(v) => {
                        updateSceneStatus.mutate({ id: scene.id, status: v as never });
                      }}>
                        <SelectTrigger className="h-6 text-[10px] w-28 bg-transparent border-gold/30 text-gold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">ड्राफ्ट</SelectItem>
                          <SelectItem value="in-progress">प्रगति पर</SelectItem>
                          <SelectItem value="complete">पूर्ण</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{scene.sceneDescription}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {shlokas?.length === 0 && (
          <div className="text-center py-12 bg-gradient-card border border-border rounded-xl">
            <p className="text-muted-foreground mb-3">इस अध्याय में कोई श्लोक नहीं है</p>
            <Button asChild size="sm" className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              <Link href={`/scenes/new?chapterId=${id}`}>
                <Plus className="w-4 h-4 mr-1" /> पहला श्लोक जोड़ें
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={voiceoverActive} onOpenChange={(open) => {
        setVoiceoverActive(open);
        if (!open) {
          setVoiceoverTarget(null);
          setVoiceoverResult(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-background border-gold/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Volume2 className="w-5 h-5 text-gold" />
              बंजारा वॉयसओवर स्क्रिप्ट
              {voiceoverResult && (
                <span className="text-xs text-muted-foreground font-normal">श्लोक {voiceoverResult.shlokaVerse}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              {voiceoverTarget !== null && generateVoiceoverMutation.isPending
                ? "AI बंजारा भाषा में वॉयसओवर स्क्रिप्ट बना रहा है..."
                : "3D एनिमेटेड सीन के लिए नैरेशन स्क्रिप्ट (बंजारा + हिंदी)"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {!voiceoverResult && generateVoiceoverMutation.isPending && (
              <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
                <p className="text-sm">AI वॉयसओवर स्क्रिप्ट तैयार कर रहा है, कृपया प्रतीक्षा करें...</p>
              </div>
            )}
            {!voiceoverResult && !generateVoiceoverMutation.isPending && generateVoiceoverMutation.isError && (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm">स्क्रिप्ट जनरेशन में त्रुटि हुई। कृपया दोबारा प्रयास करें।</p>
              </div>
            )}
            {!voiceoverResult && !generateVoiceoverMutation.isPending && !generateVoiceoverMutation.isError && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">“AI वॉयसओवर” बटन दबाएँ ताकि AI बंजारा भाषा में नैरेशन स्क्रिप्ट बना सके।</p>
              </div>
            )}
            {voiceoverResult && voiceoverResult.script && (
              <div className="space-y-4 pr-2">
                {voiceoverResult.script.openingLine && (
                  <div className="bg-primary/5 border border-gold/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gold/70 mb-1">प्रारंभिक पंक्ति</p>
                    <p className="text-sm text-foreground leading-relaxed italic">“{voiceoverResult.script.openingLine}”</p>
                  </div>
                )}
                {voiceoverResult.script.narrationBanjara && (
                  <div className="bg-gradient-gold/10 border border-gold/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wider text-gold font-semibold">बंजारा नैरेशन</p>
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 text-gold hover:text-gold-bright hover:bg-gold/10"
                        onClick={() => copyToClipboard(voiceoverResult.script?.narrationBanjara ?? null)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-base text-foreground leading-relaxed">{voiceoverResult.script.narrationBanjara}</p>
                  </div>
                )}
                {voiceoverResult.script.closingLine && (
                  <div className="bg-primary/5 border border-gold/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gold/70 mb-1">समापन पंक्ति</p>
                    <p className="text-sm text-foreground leading-relaxed italic">“{voiceoverResult.script.closingLine}”</p>
                  </div>
                )}
                {voiceoverResult.script.narrationHindi && (
                  <div className="bg-background/40 border border-border/60 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gold/70 mb-1">हिंदी अर्थ (वॉयस आर्टिस्ट के लिए)</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{voiceoverResult.script.narrationHindi}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {voiceoverResult.script.estimatedDurationSeconds && (
                    <div className="bg-background/40 border border-border/60 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock3 className="w-3.5 h-3.5 text-gold" />
                        <p className="text-[10px] uppercase tracking-wider text-gold/70">अवनुमानित अवधि</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">~{voiceoverResult.script.estimatedDurationSeconds} सेकंड</p>
                    </div>
                  )}
                  {voiceoverResult.script.toneNotes && (
                    <div className="bg-background/40 border border-border/60 rounded-lg p-3 sm:col-span-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-gold" />
                        <p className="text-[10px] uppercase tracking-wider text-gold/70">टोन नोट्स</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{voiceoverResult.script.toneNotes}</p>
                    </div>
                  )}
                  {voiceoverResult.script.soundCues && (
                    <div className="bg-background/40 border border-border/60 rounded-lg p-3 sm:col-span-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Music className="w-3.5 h-3.5 text-gold" />
                        <p className="text-[10px] uppercase tracking-wider text-gold/70">संगीत/ध्वनि संकेत</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{voiceoverResult.script.soundCues}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={generateVoiceoverMutation.isPending}
              onClick={() => {
                setVoiceoverResult(null);
                generateVoiceoverMutation.mutate({ shlokaId: voiceoverTarget! });
              }}>
              {generateVoiceoverMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              दोबारा जनरेट करें
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between pt-2">
        {prevChapter ? (
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-gold hover:border-gold/40" onClick={() => navigate(`/chapters/${prevChapter.id}`)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> अध्याय {prevChapter.chapterNumber}
          </Button>
        ) : <div />}
        {nextChapter ? (
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-gold hover:border-gold/40" onClick={() => navigate(`/chapters/${nextChapter.id}`)}>
            अध्याय {nextChapter.chapterNumber} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
