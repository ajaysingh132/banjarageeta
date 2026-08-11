import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

type ChapterForm = {
  chapterNumber: number;
  titleSanskrit: string;
  titleBanjara: string;
  titleHindi: string;
  descriptionBanjara: string;
  descriptionHindi: string;
  totalShlokas: number;
  status: string;
};

type ShlokaForm = {
  chapterId: number;
  shlokaNumber: number;
  verseNumber: string;
  sanskrit: string;
  banjara: string;
  hindi: string;
  speaker: string;
  speakerBanjara: string;
  meaning: string;
};

const emptyShlokaForm: ShlokaForm = {
  chapterId: 0,
  shlokaNumber: 1,
  verseNumber: "",
  sanskrit: "",
  banjara: "",
  hindi: "",
  speaker: "",
  speakerBanjara: "",
  meaning: "",
};

const emptyForm: ChapterForm = {
  chapterNumber: 1,
  titleSanskrit: "",
  titleBanjara: "",
  titleHindi: "",
  descriptionBanjara: "",
  descriptionHindi: "",
  totalShlokas: 0,
  status: "draft",
};

export default function AdminPanel() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ChapterForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chapters");

  const { data: chapters, isLoading } = trpc.chapters.list.useQuery();
  const sorted = chapters?.sort((a, b) => a.chapterNumber - b.chapterNumber) ?? [];

  // Shloka management state
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => sorted[0]?.id ?? 0);
  const [shlokaEditId, setShlokaEditId] = useState<number | null>(null);
  const [shlokaForm, setShlokaForm] = useState<ShlokaForm>(emptyShlokaForm);
  const [shlokaDialogOpen, setShlokaDialogOpen] = useState(false);

  const { data: shlokas, isLoading: shlokasLoading } = trpc.shlokas.list.useQuery(
    { chapterId: selectedChapterId },
    { enabled: !!selectedChapterId },
  );
  const shlokaList = useMemo(() => (shlokas ?? []).sort((a, b) => a.shlokaNumber - b.shlokaNumber), [shlokas]);

  const createMutation = trpc.chapters.create.useMutation({
    onSuccess: () => {
      toast.success("अध्याय जोड़ा गया");
      utils.chapters.list.invalidate();
      utils.progress.overall.invalidate();
      setEditId(null);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "त्रुटि"),
  });

  const updateMutation = trpc.chapters.update.useMutation({
    onSuccess: () => {
      toast.success("अध्याय अपडेट हुआ");
      utils.chapters.list.invalidate();
      utils.chapters.get.invalidate({ id: editId ?? 0 });
      utils.progress.overall.invalidate();
      setEditId(null);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "त्रुटि"),
  });

  const deleteMutation = trpc.chapters.delete.useMutation({
    onSuccess: () => {
      toast.success("अध्याय हटाया गया");
      utils.chapters.list.invalidate();
      utils.progress.overall.invalidate();
    },
    onError: (err: { message?: string }) => toast.error(err.message || "त्रुटि"),
  });

  const openEdit = (c: (typeof sorted)[number]) => {
    setEditId(c.id);
    setForm({
      chapterNumber: c.chapterNumber,
      titleSanskrit: c.titleSanskrit ?? "",
      titleBanjara: c.titleBanjara,
      titleHindi: c.titleHindi,
      descriptionBanjara: c.descriptionBanjara ?? "",
      descriptionHindi: c.descriptionHindi ?? "",
      totalShlokas: c.totalShlokas,
      status: c.status,
    });
  };

  const openNew = () => {
    setDialogOpen(true);
    const next = sorted.length >= 18 ? sorted.length + 1 : sorted.length + 1;
    setForm({ ...emptyForm, chapterNumber: next });
  };

  const handleSave = () => {
    if (!form.titleBanjara.trim()) {
      toast.error("कृपया बंजारा शीर्षक भरें");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form } as never);
    } else {
      createMutation.mutate(form as never);
    }
  };

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };

  // Shloka CRUD mutations
  const shlokaCreateMutation = trpc.shlokas.create.useMutation({
    onSuccess: () => {
      toast.success("श्लोक जोड़ा गया");
      utils.shlokas.list.invalidate({ chapterId: selectedChapterId });
      utils.chapters.list.invalidate();
      utils.progress.overall.invalidate();
      setShlokaEditId(null);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "त्रुटि"),
  });

  const shlokaUpdateMutation = trpc.shlokas.update.useMutation({
    onSuccess: () => {
      toast.success("श्लोक अपडेट हुआ");
      utils.shlokas.list.invalidate({ chapterId: selectedChapterId });
      utils.progress.overall.invalidate();
      setShlokaEditId(null);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "त्रुटि"),
  });

  const shlokaDeleteMutation = trpc.shlokas.delete.useMutation({
    onSuccess: () => {
      toast.success("श्लोक हटाया गया");
      utils.shlokas.list.invalidate({ chapterId: selectedChapterId });
      utils.chapters.list.invalidate();
      utils.progress.overall.invalidate();
    },
    onError: (err: { message?: string }) => toast.error(err.message || "त्रुटि"),
  });

  const openShlokaEdit = (s: (typeof shlokaList)[number]) => {
    setShlokaEditId(s.id);
    setShlokaForm({
      chapterId: s.chapterId,
      shlokaNumber: s.shlokaNumber,
      verseNumber: s.verseNumber ?? "",
      sanskrit: s.sanskrit ?? "",
      banjara: s.banjara ?? "",
      hindi: s.hindi ?? "",
      speaker: s.speaker ?? "",
      speakerBanjara: s.speakerBanjara ?? "",
      meaning: s.meaning ?? "",
    });
    setShlokaDialogOpen(true);
  };

  const openNewShloka = () => {
    const nextNum = shlokaList.length > 0 ? shlokaList[shlokaList.length - 1].shlokaNumber + 1 : 1;
    setShlokaEditId(null);
    setShlokaForm({ ...emptyShlokaForm, chapterId: selectedChapterId, shlokaNumber: nextNum, verseNumber: `1.${nextNum}` });
    setShlokaDialogOpen(true);
  };

  const handleShlokaSave = () => {
    if (!shlokaForm.banjara.trim() && !shlokaForm.sanskrit.trim()) {
      toast.error("कृपया कम से कम बंजारा या संस्कृत श्लोक भरें");
      return;
    }
    if (shlokaEditId) {
      const { id, chapterId: _c, ...data } = { id: shlokaEditId, ...shlokaForm };
      shlokaUpdateMutation.mutate(data as never);
    } else {
      shlokaCreateMutation.mutate(shlokaForm as never);
    }
    setShlokaDialogOpen(false);
  };

  const closeShlokaDialog = () => {
    setShlokaDialogOpen(false);
    setShlokaEditId(null);
    setShlokaForm(emptyShlokaForm);
  };

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-muted-foreground">एडमिन एक्सेस आवश्यक है</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">एडमिन पैनल</h1>
          <p className="text-muted-foreground text-sm mt-0.5">18 अध्यायों और श्लोकों का प्रबंधन</p>
        </div>
        <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> नया अध्याय
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-background border border-border">
          <TabsTrigger value="chapters">अध्याय</TabsTrigger>
          <TabsTrigger value="shlokas">श्लोक</TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="mt-4">
      <div className="bg-gradient-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-2 p-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-background/50 rounded" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-gold/80">#</TableHead>
                <TableHead className="text-gold/80">बंजारा शीर्षक</TableHead>
                <TableHead className="text-gold/80">हिंदी शीर्षक</TableHead>
                <TableHead className="text-gold/80">श्लोक</TableHead>
                <TableHead className="text-gold/80">स्थिति</TableHead>
                <TableHead className="text-gold/80 text-right">क्रिया</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => (
                <TableRow key={c.id} className="border-border/50 hover:bg-background/40">
                  <TableCell className="font-semibold text-gold">{c.chapterNumber}</TableCell>
                  <TableCell className="font-medium">{c.titleBanjara}</TableCell>
                  <TableCell className="text-muted-foreground">{c.titleHindi}</TableCell>
                  <TableCell>{c.totalShlokas}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      c.status === "complete" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      c.status === "in-progress" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }`}>
                      {c.status === "complete" ? "पूर्ण" : c.status === "in-progress" ? "प्रगति पर" : "ड्राफ्ट"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gold hover:bg-gold/10" onClick={() => openEdit(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm(`अध्याय ${c.chapterNumber} हटाना चाहते हैं?`)) {
                          deleteMutation.mutate({ id: c.id });
                        }
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit/New dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); } }>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editId ? "अध्याय संपादित करें" : "नया अध्याय जोड़ें"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gold/80">अध्याय संख्या</label>
                <Input type="number" value={form.chapterNumber} onChange={(e) => setForm({ ...form, chapterNumber: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gold/80">श्लोक की संख्या</label>
                <Input type="number" value={form.totalShlokas} onChange={(e) => setForm({ ...form, totalShlokas: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">बंजारा शीर्षक *</label>
              <Input value={form.titleBanjara} onChange={(e) => setForm({ ...form, titleBanjara: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">संस्कृत शीर्षक</label>
              <Input value={form.titleSanskrit} onChange={(e) => setForm({ ...form, titleSanskrit: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">हिंदी शीर्षक</label>
              <Input value={form.titleHindi} onChange={(e) => setForm({ ...form, titleHindi: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">बंजारा विवरण</label>
              <Textarea rows={2} value={form.descriptionBanjara} onChange={(e) => setForm({ ...form, descriptionBanjara: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">हिंदी विवरण</label>
              <Textarea rows={2} value={form.descriptionHindi} onChange={(e) => setForm({ ...form, descriptionHindi: e.target.value })} />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>
                <X className="w-4 h-4 mr-1" /> रद्द करें
              </Button>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                सुरक्षित करें
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="shlokas" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={String(selectedChapterId)} onValueChange={(v) => setSelectedChapterId(Number(v))}>
                <SelectTrigger className="w-64 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sorted.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      अध्याय {c.chapterNumber} — {c.titleBanjara}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{shlokaList.length} श्लोक</span>
            </div>
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={openNewShloka}>
              <Plus className="w-4 h-4 mr-1" /> नया श्लोक
            </Button>
          </div>

          <div className="bg-gradient-card border border-border rounded-xl overflow-hidden">
            {shlokasLoading ? (
              <div className="animate-pulse space-y-2 p-4">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-background/50 rounded" />)}</div>
            ) : shlokaList.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">इस अध्याय में कोई श्लोक नहीं। "नया श्लोक" पर क्लिक करें।</p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto divide-y divide-border/50">
                {shlokaList.map((s) => (
                  <div key={s.id} className="p-4 hover:bg-background/40 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gold">{s.shlokaNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="min-w-0"><p className="text-[10px] text-gold/70 mb-0.5">बंजारा</p><p className="text-sm text-foreground line-clamp-2">{s.banjara || "—"}</p></div>
                      <div className="min-w-0"><p className="text-[10px] text-gold/70 mb-0.5">संस्कृत</p><p className="text-sm text-foreground line-clamp-2 font-serif italic">{s.sanskrit || "—"}</p></div>
                      <div className="min-w-0"><p className="text-[10px] text-gold/70 mb-0.5">हिंदी अर्थ</p><p className="text-sm text-muted-foreground line-clamp-2">{s.hindi || "—"}</p></div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gold hover:bg-gold/10" onClick={() => openShlokaEdit(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm(`श्लोक ${s.shlokaNumber} हटाना चाहते हैं?`)) {
                          shlokaDeleteMutation.mutate({ id: s.id });
                        }
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Shloka Edit/New dialog */}
      <Dialog open={shlokaDialogOpen} onOpenChange={(o) => { if (!o) closeShlokaDialog(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {shlokaEditId ? "श्लोक संपादित करें" : "नया श्लोक जोड़ें"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gold/80">श्लोक संख्या</label>
                <Input type="number" value={shlokaForm.shlokaNumber} onChange={(e) => setShlokaForm({ ...shlokaForm, shlokaNumber: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gold/80">श्लोक आईडी (उदा. 1.1)</label>
                <Input value={shlokaForm.verseNumber} onChange={(e) => setShlokaForm({ ...shlokaForm, verseNumber: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">बंजारा अनुवाद</label>
              <Textarea rows={3} value={shlokaForm.banjara} onChange={(e) => setShlokaForm({ ...shlokaForm, banjara: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">संस्कृत श्लोक</label>
              <Textarea rows={2} value={shlokaForm.sanskrit} onChange={(e) => setShlokaForm({ ...shlokaForm, sanskrit: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gold/80">हिंदी अर्थ</label>
              <Textarea rows={2} value={shlokaForm.hindi} onChange={(e) => setShlokaForm({ ...shlokaForm, hindi: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gold/80">बोलने वाला (हिंदी)</label>
                <Input value={shlokaForm.speaker} onChange={(e) => setShlokaForm({ ...shlokaForm, speaker: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gold/80">बोलने वाला (बंजारा)</label>
                <Input value={shlokaForm.speakerBanjara} onChange={(e) => setShlokaForm({ ...shlokaForm, speakerBanjara: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeShlokaDialog}>
                <X className="w-4 h-4 mr-1" /> रद्द करें
              </Button>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={handleShlokaSave} disabled={shlokaCreateMutation.isPending || shlokaUpdateMutation.isPending}>
                {shlokaCreateMutation.isPending || shlokaUpdateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                सुरक्षित करें
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
