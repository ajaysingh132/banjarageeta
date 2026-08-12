import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Save, Sparkles, Loader2, Film, Trash2, User, Mountain, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type SceneForm = {
  sceneDescription: string;
  characters: string;
  background: string;
  dialogue: string;
  dialogueBanjara: string;
  mood: string;
  cameraAngle: string;
  lighting: string;
  audioNotes: string;
  durationSeconds: number;
  status: string;
};

const emptyForm: SceneForm = {
  sceneDescription: "",
  characters: "",
  background: "",
  dialogue: "",
  dialogueBanjara: "",
  mood: "",
  cameraAngle: "",
  lighting: "",
  audioNotes: "",
  durationSeconds: 30,
  status: "draft",
};

export default function SceneEditor({ shlokaId }: { shlokaId: number }) {
  const [, navigate] = useLocation();
  const isNew = isNaN(shlokaId);
  const [chapterIdQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("chapterId")) || 0;
  });

  // Always render the form component so all hooks are called unconditionally.
  // When creating new, pass shlokaId=0 (unused) and isNew=true.
  return <SceneFormInner shlokaId={isNew ? 0 : shlokaId} isNew={isNew} chapterIdQuery={chapterIdQuery} navigate={navigate} />;
}

function SceneFormInner({
  shlokaId,
  isNew,
  chapterIdQuery,
  navigate,
}: {
  shlokaId: number;
  isNew: boolean;
  chapterIdQuery: number;
  navigate: (to: string) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: existingScene, isLoading: sceneLoading } = !isNew
    ? trpc.scenes.getByShloka.useQuery({ shlokaId })
    : { data: undefined, isLoading: false };

  const [form, setForm] = useState<SceneForm>(emptyForm);

  useEffect(() => {
    if (!isNew && existingScene) {
      setForm({
        sceneDescription: existingScene.sceneDescription ?? "",
        characters: existingScene.characters ?? "",
        background: existingScene.background ?? "",
        dialogue: existingScene.dialogue ?? "",
        dialogueBanjara: existingScene.dialogueBanjara ?? "",
        mood: existingScene.mood ?? "",
        cameraAngle: existingScene.cameraAngle ?? "",
        lighting: existingScene.lighting ?? "",
        audioNotes: existingScene.audioNotes ?? "",
        durationSeconds: existingScene.durationSeconds ?? 30,
        status: existingScene.status,
      });
    }
  }, [existingScene, isNew]);

  const set = (key: keyof SceneForm, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isAdmin = user?.role === "admin";

  const createShlokaMutation = trpc.shlokas.create.useMutation({
    onSuccess: (res) => {
      createSceneMutation.mutate({
        shlokaId: res.id,
        sceneDescription: form.sceneDescription,
        characters: form.characters,
        background: form.background,
        dialogue: form.dialogue,
        dialogueBanjara: form.dialogueBanjara,
        mood: form.mood,
        cameraAngle: form.cameraAngle,
        lighting: form.lighting,
        audioNotes: form.audioNotes,
        durationSeconds: form.durationSeconds,
        status: form.status as never,
      });
    },
    onError: (err: { message?: string }) => toast.error(err.message || "श्लोक बनाने में विफल"),
  });

  const createSceneMutation = trpc.scenes.create.useMutation({
    onSuccess: (res) => {
      toast.success("सीन सुरक्षित हो गई");
      navigate(`/chapters/${chapterIdQuery}`);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "सुरक्षित करने में विफल"),
  });

  const updateMutation = trpc.scenes.update.useMutation({
    onSuccess: () => {
      toast.success("सीन अपडेट हो गई");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "अपडेट में विफल"),
  });

  const deleteMutation = trpc.scenes.delete.useMutation({
    onSuccess: () => {
      toast.success("सीन हटाई गई");
      const params = new URLSearchParams(window.location.search);
      navigate(`/chapters/${params.get("chapterId") ?? ""}`);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "हटाने में विफल"),
  });

  const generateImageMutation = trpc.scenes.generateSceneImage.useMutation({
    onSuccess: (res) => {
      if (res.scene) {
        void queryClient.invalidateQueries({ queryKey: getQueryKey(trpc.scenes.getByShloka, { shlokaId }, "query") });
        toast.success("3D सीन छवि तैयार हो गई!");
      } else {
        toast.error("छवि जनरेशन विफल");
      }
    },
    onError: (err: { message?: string }) => toast.error(err.message || "छवि जनरेशन में त्रुटि"),
  });

  const generateMutation = trpc.scenes.generateScene.useMutation({
    onSuccess: (res) => {
      if (res.scene) {
        setForm({
          sceneDescription: res.scene.sceneDescription ?? "",
          characters: res.scene.characters ?? "",
          background: res.scene.background ?? "",
          dialogue: res.scene.dialogue ?? "",
          dialogueBanjara: res.scene.dialogueBanjara ?? "",
          mood: res.scene.mood ?? "",
          cameraAngle: res.scene.cameraAngle ?? "",
          lighting: res.scene.lighting ?? "",
          audioNotes: res.scene.audioNotes ?? "",
          durationSeconds: res.scene.durationSeconds ?? 30,
          status: res.scene.status,
        });
        toast.success("AI ने सीन विवरण तैयार किए। कृपया समीक्षा करके सुरक्षित करें।");
      } else {
        toast.error("AI से कोई विवरण नहीं मिला");
      }
    },
    onError: (err: { message?: string }) => toast.error(err.message || "AI जनरेशन में त्रुटि"),
  });

  const handleSave = () => {
    if (!form.sceneDescription.trim()) {
      toast.error("कृपया सीन विवरण भरें");
      return;
    }
    if (isNew) {
      const shlokaNum = Number(new URLSearchParams(window.location.search).get("shlokaNumber")) || 1;
      createShlokaMutation.mutate({
        chapterId: chapterIdQuery,
        shlokaNumber: shlokaNum,
        verseNumber: `1.${shlokaNum}`,
        sanskrit: form.sceneDescription,
      });
    } else if (existingScene) {
      updateMutation.mutate({
        id: existingScene.id,
        sceneDescription: form.sceneDescription,
        characters: form.characters,
        background: form.background,
        dialogue: form.dialogue,
        dialogueBanjara: form.dialogueBanjara,
        mood: form.mood,
        cameraAngle: form.cameraAngle,
        lighting: form.lighting,
        audioNotes: form.audioNotes,
        durationSeconds: form.durationSeconds,
        status: form.status as never,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between animate-fade-in-up">
        <Link href={chapterIdQuery ? `/chapters/${chapterIdQuery}` : "/chapters"} className="flex items-center gap-1.5 text-muted-foreground hover:text-gold transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          वापस
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && existingScene && (
            <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate({ id: existingScene.id })}>
              <Trash2 className="w-4 h-4 mr-1" /> हटाएं
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={handleSave} disabled={createSceneMutation.isPending || updateMutation.isPending || createShlokaMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {createSceneMutation.isPending || updateMutation.isPending || createShlokaMutation.isPending ? "सुरक्षित हो रहा..." : "सुरक्षित करें"}
            </Button>
          )}
        </div>
      </div>

      {sceneLoading ? (
        <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl" />)}</div>
      ) : (
        <div className="space-y-5">
          <div className="bg-gradient-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <Film className="w-5 h-5 text-gold" />
                सीन सम्पादक
              </h1>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/40 text-primary hover:bg-primary/10"
                    disabled={generateMutation.isPending || isNew}
                    onClick={() => generateMutation.mutate({ shlokaId })}>
                    {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    AI सीन जनरेट
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gold/50 text-gold hover:bg-gold/10"
                    disabled={generateImageMutation.isPending || isNew}
                    onClick={() => generateImageMutation.mutate({ shlokaId })}>
                    {generateImageMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    3D छवि जनरेट
                  </Button>
                </div>
              )}
            </div>

            {existingScene?.imageUrl ? (
              <div className="overflow-hidden rounded-lg border border-gold/30 mb-4">
                <div className="relative">
                  <img src={existingScene.imageUrl} alt={`सीन - श्लोक ${shlokaId}`} className="w-full h-auto max-h-[420px] object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-gold text-xs px-2 py-1 rounded">3D सीन छवि</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gold/30 p-6 mb-4 text-center text-sm text-muted-foreground">
                {isAdmin ? "उपर ‘3D छवि जनरेट’ पर क्लिक करके इस श्लोक की AI 3D सीन छवि बनाएं" : "अभी तक कोई 3D सीन छवि नहीं है"}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gold/80">सीन विवरण (क्या दिखेगा)</Label>
                <Textarea
                  rows={4}
                  value={form.sceneDescription}
                  onChange={(e) => set("sceneDescription", e.target.value)}
                  placeholder="उदाहरण: कुरुक्षेत्र के युद्धभूमि में, कृष्ण अर्जुन को चरथ पर गीता का उपदेश दे रहे हैं..."
                  disabled={!isAdmin}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80 flex items-center gap-1"><User className="w-3 h-3" /> पात्र (Characters)</Label>
                  <Textarea
                    rows={3}
                    value={form.characters}
                    onChange={(e) => set("characters", e.target.value)}
                    placeholder="कृष्ण (नीली त्वचा, पीला वस्त्र), अर्जुन..."
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80 flex items-center gap-1"><Mountain className="w-3 h-3" /> पृष्ठभूमि (Background)</Label>
                  <Textarea
                    rows={3}
                    value={form.background}
                    onChange={(e) => set("background", e.target.value)}
                    placeholder="कुरुक्षेत्र युद्धभूमि, सूर्यास्त, दूर में सैनिक..."
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80">संवाद (Dialog - Hindi)</Label>
                  <Textarea
                    rows={3}
                    value={form.dialogue}
                    onChange={(e) => set("dialogue", e.target.value)}
                    placeholder="कृष्ण: 'अर्जुन, युद्ध कर, यही तेरा धर्म है।'"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80">संवाद बंजारा (Dialogue in Banjara)</Label>
                  <Textarea
                    rows={3}
                    value={form.dialogueBanjara}
                    onChange={(e) => set("dialogueBanjara", e.target.value)}
                    placeholder="बंजारा में संवाद..."
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80">मूड/भाव</Label>
                  <Input value={form.mood} onChange={(e) => set("mood", e.target.value)} placeholder="गंभीर, भक्तिपूर्ण..." disabled={!isAdmin} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80">कैमरा कोण</Label>
                  <Input value={form.cameraAngle} onChange={(e) => set("cameraAngle", e.target.value)} placeholder="close-up, wide shot..." disabled={!isAdmin} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80">प्रकाश (Lighting)</Label>
                  <Input value={form.lighting} onChange={(e) => set("lighting", e.target.value)} placeholder="सोनहरी धूप, गोदेन आवर..." disabled={!isAdmin} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gold/80 flex items-center gap-1"><Music className="w-3 h-3" /> ध्वनि/संगीत (Audio Notes)</Label>
                  <Input value={form.audioNotes} onChange={(e) => set("audioNotes", e.target.value)} placeholder="भक्ति संगीत, बांसुरी..." disabled={!isAdmin} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gold/80">अवधि (सेकंड)</Label>
                    <Input type="number" value={form.durationSeconds} onChange={(e) => set("durationSeconds", Number(e.target.value))} disabled={!isAdmin} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gold/80">स्थिति</Label>
                    <Select value={form.status} onValueChange={(v) => set("status", v)} disabled={!isAdmin}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">ड्राफ्ट</SelectItem>
                        <SelectItem value="in-progress">प्रगति पर</SelectItem>
                        <SelectItem value="complete">पूर्ण</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isAdmin && (
            <p className="text-xs text-muted-foreground text-center">सीन संपादित करने के लिए एडमिन एक्सेस आवश्यक है।</p>
          )}
        </div>
      )}
    </div>
  );
}
