import { Button } from "@/components/ui/button";
import { Film, Link2, Scissors, Smartphone, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Scissors className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>
              InstantCut
            </span>
          </div>
        </nav>

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Film className="h-4 w-4" />
            Découpe vidéo/audio depuis un simple lien URL
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            La découpe média
            <br />
            <span className="text-primary">précise et instantanée</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10">
            InstantCut est une plateforme web/mobile révolutionnaire pour découper vos vidéos et audios sans
            téléchargement complet par l'utilisateur. Collez un lien, définissez vos points de coupe et exportez
            avec une précision chirurgicale.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            onClick={() => navigate("/extract")}
          >
            Commencer maintenant
          </Button>
        </div>
      </header>

      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Link2,
              title: "Découpe depuis URL",
              desc: "Importez un média via lien et lancez le traitement sans flux complexe côté utilisateur.",
            },
            {
              icon: Timer,
              title: "Précision chirurgicale",
              desc: "Définissez vos extraits au dixième de seconde pour des segments propres et exploitables.",
            },
            {
              icon: Smartphone,
              title: "Web + mobile",
              desc: "Une expérience fluide sur desktop et smartphone pour produire partout, rapidement.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>InstantCut — Le découpage vidéo/audio depuis URL, simplement.</p>
      </footer>
    </div>
  );
};

export default Index;
