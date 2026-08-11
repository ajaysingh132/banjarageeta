import { ExternalLink } from "lucide-react";

const PDF_URL = "/manus-storage/banjara-gita_8e346454.pdf";

export default function PDFViewer() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">पुस्तक दर्शक</h1>
          <p className="text-muted-foreground text-sm">बंजारा गीता मूल PDF — स्टोरीबोर्ड के साथ संदर्भ के लिए</p>
        </div>
        <a
          href={PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> नए टैब में खोलें
        </a>
      </div>
      <div className="bg-gradient-card border border-border rounded-xl overflow-hidden h-[calc(100vh-230px)] min-h-[560px]">
        <iframe
          src={PDF_URL}
          className="w-full h-full"
          title="बंजारा गीता PDF">
          PDF लोड नहीं हो सका। <a href={PDF_URL} className="text-gold underline">यहां से डाउनलोड करें</a>
        </iframe>
      </div>
    </div>
  );
}
