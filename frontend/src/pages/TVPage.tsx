import { useState, useEffect, useRef, useCallback } from 'react';
import type { Slide, Settings, WPPost } from '../types';
import { getTVSlides, getTVSettings } from '../services/api';

export default function TVPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [slideVisible, setSlideVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transitionEffect = settings.transitionEffect || 'fade';
  const transitionDuration = parseInt(settings.transitionDuration || '600');

  const fetchData = useCallback(async () => {
    try {
      const [slidesData, settingsData] = await Promise.all([getTVSlides(), getTVSettings()]);
      setSlides(slidesData);
      setSettings(settingsData);
    } catch {
      // retry on next refresh
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic refresh
  useEffect(() => {
    const interval = parseInt(settings.tvRefreshInterval || '60') * 1000;
    refreshRef.current = setInterval(fetchData, interval);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [settings.tvRefreshInterval, fetchData]);

  // Slideshow timer
  useEffect(() => {
    if (slides.length === 0) return;

    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;

    const duration = (currentSlide.duration || parseInt(settings.defaultDuration || '10')) * 1000;

    timerRef.current = setTimeout(() => {
      if (transitionEffect === 'none') {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else {
        setTransitioning(true);
        setSlideVisible(false);

        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % slides.length);
          setSlideVisible(true);
          setTimeout(() => setTransitioning(false), transitionDuration);
        }, transitionDuration);
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, slides, settings.defaultDuration, transitionEffect, transitionDuration]);

  const getTransitionStyle = (): React.CSSProperties => {
    const dur = `${transitionDuration}ms`;

    switch (transitionEffect) {
      case 'fade':
        return {
          opacity: slideVisible ? 1 : 0,
          transition: `opacity ${dur} ease-in-out`,
        };
      case 'slide_left':
        return {
          transform: slideVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${dur} ease-in-out`,
        };
      case 'slide_right':
        return {
          transform: slideVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${dur} ease-in-out`,
        };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cdf-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-3xl">CDF</span>
          </div>
          <p className="text-cdf-300 text-xl">A carregar...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cdf-600 flex items-center justify-center">
            <span className="text-white font-bold text-3xl">CDF</span>
          </div>
          <p className="text-cdf-300 text-xl">Nenhum slide disponível</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div style={getTransitionStyle()} className="w-full h-full">
        <SlideRenderer slide={currentSlide} />
      </div>

      {/* CDF Logo watermark */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-10 h-10 rounded-full bg-cdf-600 bg-opacity-80 flex items-center justify-center">
          <span className="text-white font-bold text-xs">CDF</span>
        </div>
      </div>

      {/* Slide progress dots */}
      {slides.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-cdf-400' : 'bg-white bg-opacity-30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case 'news':
      return <NewsSlide slide={slide} />;
    case 'game':
      return <GameSlide slide={slide} />;
    case 'complex_map':
      return <ComplexMapSlide slide={slide} />;
    case 'visitor_info':
      return <VisitorInfoSlide slide={slide} />;
    case 'services':
      return <ServicesSlide slide={slide} />;
    case 'announcement':
      return <AnnouncementSlide slide={slide} />;
    case 'sponsor':
      return <SponsorSlide slide={slide} />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <p className="text-white text-2xl">{slide.title}</p>
        </div>
      );
  }
}

function NewsSlide({ slide }: { slide: Slide }) {
  const posts: WPPost[] = slide.content?.posts || [];

  return (
    <div className="w-full h-full bg-gradient-to-br from-cdf-900 to-cdf-800 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-cdf-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">CDF</span>
        </div>
        <div>
          <h1 className="text-white text-3xl font-bold">{slide.title}</h1>
          <p className="text-cdf-300 text-sm">Últimas notícias</p>
        </div>
      </div>

      {/* News grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden">
        {posts.slice(0, 6).map((post) => (
          <div
            key={post.id}
            className="bg-white bg-opacity-10 rounded-xl overflow-hidden flex flex-col"
          >
            {post.featuredImage && (
              <div className="h-32 overflow-hidden">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-white font-semibold text-sm leading-tight mb-2 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-cdf-200 text-xs line-clamp-3 flex-1">{post.excerpt}</p>
              <p className="text-cdf-400 text-xs mt-2">
                {new Date(post.date).toLocaleDateString('pt-PT')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-cdf-300 text-xl">Sem notícias disponíveis</p>
        </div>
      )}
    </div>
  );
}

function GameSlide({ slide }: { slide: Slide }) {
  const { homeTeam, awayTeam, date, time, competition, location } = slide.content || {};

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-cdf-900 via-cdf-800 to-cdf-900 flex flex-col items-center justify-center p-8">
      {/* Competition */}
      <div className="mb-8">
        <p className="text-cdf-300 text-lg uppercase tracking-widest text-center">
          {competition || 'Competição'}
        </p>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-8 md:gap-16 mb-8">
        {/* Home team */}
        <div className="text-center">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-cdf-700 flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-2xl md:text-3xl">
              {(homeTeam || 'Casa').substring(0, 3).toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-xl md:text-2xl font-bold">{homeTeam || 'Equipa Casa'}</h2>
        </div>

        {/* VS */}
        <div className="text-center">
          <span className="text-cdf-400 text-4xl md:text-6xl font-light">VS</span>
        </div>

        {/* Away team */}
        <div className="text-center">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-2xl md:text-3xl">
              {(awayTeam || 'Fora').substring(0, 3).toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-xl md:text-2xl font-bold">
            {awayTeam || 'Equipa Visitante'}
          </h2>
        </div>
      </div>

      {/* Date/Time */}
      <div className="text-center space-y-2">
        <p className="text-white text-2xl md:text-3xl font-bold">
          {time || '--:--'}
        </p>
        <p className="text-cdf-300 text-lg">{formatDate(date)}</p>
        {location && <p className="text-cdf-400 text-sm">{location}</p>}
      </div>

      {/* CDF branding bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-cdf-600" />
    </div>
  );
}

function ComplexMapSlide({ slide }: { slide: Slide }) {
  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="text-center">
          <p className="text-white text-2xl">{slide.title}</p>
          <p className="text-gray-400 mt-2">Imagem não disponível</p>
        </div>
      )}
    </div>
  );
}

function VisitorInfoSlide({ slide }: { slide: Slide }) {
  const { htmlContent, imageUrl } = slide.content || {};

  return (
    <div className="w-full h-full bg-gradient-to-br from-cdf-900 to-cdf-800 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-cdf-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">CDF</span>
        </div>
        <h1 className="text-white text-3xl font-bold">{slide.title}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-8 overflow-hidden">
        <div className="flex-1">
          {htmlContent ? (
            <div
              className="text-white text-lg leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <p className="text-cdf-300">Sem conteúdo</p>
          )}
        </div>
        {imageUrl && (
          <div className="w-1/3 flex-shrink-0">
            <img
              src={imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ServicesSlide({ slide }: { slide: Slide }) {
  const { htmlContent } = slide.content || {};

  return (
    <div className="w-full h-full bg-gradient-to-br from-cdf-900 to-cdf-800 flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-cdf-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">CDF</span>
        </div>
        <h1 className="text-white text-3xl font-bold">{slide.title}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {htmlContent ? (
          <div
            className="text-white text-lg leading-relaxed prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <p className="text-cdf-300">Sem conteúdo</p>
        )}
      </div>
    </div>
  );
}

function AnnouncementSlide({ slide }: { slide: Slide }) {
  const { htmlContent, backgroundColor } = slide.content || {};
  const bgColor = backgroundColor || '#1e3a5f';

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-12 text-center"
      style={{ backgroundColor: bgColor }}
    >
      <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-8">
        <span className="text-white font-bold text-2xl">CDF</span>
      </div>

      <h1 className="text-white text-4xl md:text-6xl font-bold mb-6 leading-tight">
        {slide.title}
      </h1>

      {htmlContent && (
        <div
          className="text-white text-xl md:text-2xl opacity-90 max-w-3xl prose prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
}

function SponsorSlide({ slide }: { slide: Slide }) {
  const { sponsorName, website, logoUrl } = slide.content || {};

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-white flex flex-col items-center justify-center p-12">
      {/* Sponsor logo */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={sponsorName || 'Patrocinador'}
          className="max-w-md max-h-48 object-contain mb-8"
        />
      ) : (
        <div className="w-48 h-32 bg-gray-200 rounded-xl flex items-center justify-center mb-8">
          <span className="text-gray-400 text-lg">Logo</span>
        </div>
      )}

      {/* Sponsor name */}
      <h2 className="text-gray-800 text-3xl font-bold mb-2">
        {sponsorName || 'Patrocinador'}
      </h2>

      {/* Website */}
      {website && <p className="text-cdf-600 text-lg">{website}</p>}

      {/* CDF branding */}
      <div className="absolute bottom-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-cdf-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">CDF</span>
        </div>
        <span className="text-gray-400 text-sm">Patrocinador Oficial</span>
      </div>
    </div>
  );
}
