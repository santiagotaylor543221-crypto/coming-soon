import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Film, Sparkles, Clapperboard, ArrowLeft, Search, Filter, X } from "lucide-react";
import { VideoBackground } from "../components/VideoBackground";
import { useUpcomingMovies } from "../components/upcoming/useUpcomingMovies";
import { UpcomingList } from "../components/upcoming/UpcomingList";

export default function UpcomingReleasesPage() {
  const { movies, loading, error } = useUpcomingMovies();
  const [selectedGenre, setSelectedGenre] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Extracción dinámica de los géneros disponibles
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    movies.forEach((movie) => {
      movie.genres.forEach((g) => genresSet.add(g));
    });
    return ["Todos", ...Array.from(genresSet)];
  }, [movies]);

  // Filtrado de películas por género y término de búsqueda (manteniendo el orden por fecha)
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesGenre =
        selectedGenre === "Todos" || movie.genres.includes(selectedGenre);
      const matchesSearch =
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genres.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesGenre && matchesSearch;
    });
  }, [movies, selectedGenre, searchTerm]);

  return (
    <div className="min-h-screen relative overflow-x-hidden pb-16">
      <VideoBackground />

      {/* Header superior */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)]"
              title="Volver al inicio"
            >
              <Film className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white">CINEMA RIWI</h1>
              <p className="text-[10px] text-cyan-300/80 font-medium">Cartelera Exclusiva</p>
            </div>
          </div>

          <Link
            to="/"
            className="water-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Iniciar Sesión</span>
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        {/* Banner de Título */}
        <div className="text-center max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Muy pronto en nuestras salas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            PRÓXIMAMENTE
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto">
            Explora los lanzamientos cinematográficos ordenados por fecha de estreno. Haz clic en cualquier película para ver su trailer y detalles.
          </p>
        </div>

        {/* Barra de Filtros y Búsqueda con separación estricta para evitar colisiones */}
        <div className="liquid-glass rounded-2xl p-4 sm:p-5 mb-8 border border-white/10 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Selector de Géneros en Pills con scroll horizontal fluido y sin solapamiento */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 flex-1 min-w-0 scrollbar-thin scrollbar-thumb-white/10">
            <div className="flex items-center gap-1 text-cyan-400 shrink-0 pl-1 pr-1">
              <Filter className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedGenre === genre
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Input de Búsqueda independiente con ancho fijo en pantallas grandes */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar película o género..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="liquid-glass-input w-full pl-9 pr-8 py-2.5 rounded-xl text-xs sm:text-sm placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sección del Listado / Grid */}
        <section aria-label="Lista de películas en Próximamente">
          <UpcomingList movies={filteredMovies} loading={loading} error={error} />
        </section>
      </main>

      {/* Footer Sencillo */}
      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center text-xs text-slate-400 relative z-10 flex items-center justify-center space-x-2">
        <Clapperboard className="w-4 h-4 text-cyan-400" />
        <span>Cinema Riwi © 2026 — Todos los derechos reservados</span>
      </footer>
    </div>
  );
}
