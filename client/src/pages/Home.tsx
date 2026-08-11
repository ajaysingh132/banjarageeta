import { Link } from "wouter";
import {
  BookOpen,
  Clapperboard,
  MessageCircle,
  Film,
  Languages,
  Sparkles,
  Play,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const features = [
  {
    icon: BookOpen,
    title: "18 अध्याय",
    description: "संपूर्ण बंजारा गीता — संस्कृत श्लोक, बंजारा अनुवाद, हिंदी अर्थ",
  },
  {
    icon: Clapperboard,
    title: "स्टोरीबोर्ड",
    description: "प्रत्येक श्लोक के लिए सीन-बाय-सीन विज़ुअल प्लान",
  },
  {
    icon: MessageCircle,
    title: "AI सहायक",
    description: "बंजारा अनुवाद, सीन जनरेशन और नरेटिव में AI मदद",
  },
  {
    icon: Film,
    title: "3D एनिमेशन",
    title2: "",
    description: "कृष्णा सीरियल शैली — प्रत्येक श्लोक = एक सिनेमैटिक सीन",
  },
  {
    icon: Languages,
    title: "3-भाषा स्तर",
    description: "संस्कृत श्लोक + बंजारा काव्य अनुवाद + हिंदी अर्थ",
  },
  {
    icon: Sparkles,
    title: "एडमिन पैनल",
    description: "रोल-आधारित एक्सेस — एडमिन संपादन, दर्शक ब्राउज़",
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-royal">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <header className="relative px-4 lg:px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gold-bright">बंजारा गीतामृत</h1>
              <p className="text-[11px] text-muted-foreground">वीडियो पुस्तक निर्माता</p>
            </div>
          </div>
          <div>
            {loading ? null : isAuthenticated && user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-gradient-gold text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all text-sm">
                डैशबोर्ड
              </Link>
            ) : (
              <a
                href={getLoginUrl()}
                className="px-5 py-2.5 bg-gradient-gold text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all text-sm">
                प्रवेश करें
              </a>
            )}
          </div>
        </header>

        <section className="relative px-4 lg:px-8 py-16 lg:py-24 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-sm tracking-[0.3em] uppercase text-gold/70 font-medium">
              3D एनिमेटेड वीडियो पुस्तक
            </p>
            <h2 className="font-display text-4xl lg:text-6xl font-bold text-gold-bright text-shadow-gold leading-tight">
              बंजारा गीता
              <br />
              <span className="text-foreground/90 text-3xl lg:text-4xl">फिल्म शैली में — सीन दर सीन</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              भगवद गीता के 700 श्लोकों का बंजारा (लम्बाडी) काव्यात्मक अनुवाद। प्रत्येक श्लोक के लिए एक
              सिनेमैटिक 3D सीन — कृष्ण सीरियल की तरह।
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href={isAuthenticated ? "/dashboard" : getLoginUrl()}
                className="group px-8 py-3.5 bg-gradient-gold text-primary-foreground font-semibold rounded-xl hover:shadow-gold transition-all flex items-center gap-2">
                <Play className="w-4 h-4" />
                शुरू करें
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/storyboard"
                className="px-8 py-3.5 border border-gold/40 text-gold font-semibold rounded-xl hover:bg-gold/10 transition-all flex items-center gap-2">
                <Clapperboard className="w-4 h-4" />
                स्टोरीबोर्ड
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Features grid */}
      <section className="px-4 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`bg-gradient-card border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-300 animate-fade-in-up animate-stagger-${Math.min(i + 1, 6)}`}>
              <div className="w-11 h-11 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 lg:px-8 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          बंजारा गीतामृत — भगवद गीता का बंजारा अनुवाद | वीडियो पुस्तक निर्माण प्लेटफॉर्म
        </p>
      </footer>
    </div>
  );
}
