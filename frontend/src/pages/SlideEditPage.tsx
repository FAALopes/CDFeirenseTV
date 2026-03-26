import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Upload, Trash2, Image } from 'lucide-react';
import type { SlideType, WPCategory } from '../types';
import {
  getSlide,
  createSlide,
  updateSlide,
  uploadImage,
  deleteImage,
  getWPCategories,
} from '../services/api';

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: 'news', label: 'Notícias' },
  { value: 'single_news', label: 'Notícia em Destaque' },
  { value: 'game', label: 'Jogo' },
  { value: 'complex_map', label: 'Mapa Complexo' },
  { value: 'visitor_info', label: 'Info Visitante' },
  { value: 'services', label: 'Serviços' },
  { value: 'announcement', label: 'Anúncio' },
  { value: 'sponsor', label: 'Patrocinador' },
];

export default function SlideEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SlideType>('news');
  const [duration, setDuration] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState<any>({});

  // WP categories for news type
  const [wpCategories, setWpCategories] = useState<WPCategory[]>([]);

  // Image upload state
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getSlide(Number(id))
        .then((slide) => {
          setTitle(slide.title);
          setType(slide.type);
          setDuration(slide.duration);
          setIsActive(slide.isActive);
          setImageUrl(slide.imageUrl || '');
          setContent(slide.content || {});
        })
        .catch(() => setError('Erro ao carregar slide'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  useEffect(() => {
    getWPCategories().then(setWpCategories).catch(() => {});
  }, []);

  const handleContentChange = useCallback((key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, field?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file);
      if (field) {
        handleContentChange(field, result.url);
      } else {
        setImageUrl(result.url);
      }
    } catch {
      setError('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (url: string, field?: string) => {
    const filename = url.split('/').pop();
    if (!filename) return;

    try {
      await deleteImage(filename);
      if (field) {
        handleContentChange(field, '');
      } else {
        setImageUrl('');
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const data = { type, title, content, duration, isActive, imageUrl: imageUrl || undefined };

    try {
      if (isEdit) {
        await updateSlide(Number(id), data);
      } else {
        await createSlide(data);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao guardar slide');
    } finally {
      setSaving(false);
    }
  };

  const renderImageUploader = (
    currentUrl: string,
    onUpload: (e: ChangeEvent<HTMLInputElement>) => void,
    onDelete: () => void,
    label: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {currentUrl ? (
        <div className="relative group">
          <img
            src={currentUrl}
            alt={label}
            className="w-full h-40 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={onDelete}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-cdf-400 hover:bg-cdf-50 transition-colors">
          <Upload size={24} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">
            {uploading ? 'A carregar...' : 'Clique para selecionar'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );

  const renderContentFields = () => {
    switch (type) {
      case 'news':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de notícias
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={content.count || 5}
                onChange={(e) => handleContentChange('count', parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoFetch"
                checked={content.autoFetch ?? true}
                onChange={(e) => handleContentChange('autoFetch', e.target.checked)}
                className="w-4 h-4 text-cdf-600 rounded focus:ring-cdf-500"
              />
              <label htmlFor="autoFetch" className="text-sm text-gray-700">
                Buscar automaticamente do WordPress
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por categoria
              </label>
              <select
                value={content.categoryId || ''}
                onChange={(e) =>
                  handleContentChange('categoryId', e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none bg-white"
              >
                <option value="">Todas as categorias</option>
                {wpCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'single_news':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do artigo
              </label>
              <input
                type="url"
                placeholder="https://cdfeirense.pt/nome-do-artigo/"
                value={content.articleUrl || ''}
                onChange={(e) => handleContentChange('articleUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cola aqui o link do artigo do site cdfeirense.pt
              </p>
            </div>
          </div>
        );

      case 'game':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={content.date || ''}
                  onChange={(e) => handleContentChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="time"
                  value={content.time || ''}
                  onChange={(e) => handleContentChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipa Casa</label>
              <input
                type="text"
                value={content.homeTeam || ''}
                onChange={(e) => handleContentChange('homeTeam', e.target.value)}
                placeholder="CD Feirense"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipa Visitante
              </label>
              <input
                type="text"
                value={content.awayTeam || ''}
                onChange={(e) => handleContentChange('awayTeam', e.target.value)}
                placeholder="Equipa visitante"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Competição</label>
              <input
                type="text"
                value={content.competition || ''}
                onChange={(e) => handleContentChange('competition', e.target.value)}
                placeholder="Liga Portugal 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
              <input
                type="text"
                value={content.location || ''}
                onChange={(e) => handleContentChange('location', e.target.value)}
                placeholder="Estádio Marcolino de Castro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
          </div>
        );

      case 'complex_map':
        return (
          <div className="space-y-4">
            {renderImageUploader(
              imageUrl,
              (e) => handleImageUpload(e),
              () => handleImageDelete(imageUrl),
              'Imagem do Mapa'
            )}
          </div>
        );

      case 'visitor_info':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo HTML
              </label>
              <textarea
                value={content.htmlContent || ''}
                onChange={(e) => handleContentChange('htmlContent', e.target.value)}
                rows={6}
                placeholder="<p>Informações para visitantes...</p>"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none font-mono"
              />
            </div>
            {renderImageUploader(
              content.imageUrl || '',
              (e) => handleImageUpload(e, 'imageUrl'),
              () => handleImageDelete(content.imageUrl, 'imageUrl'),
              'Imagem'
            )}
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo HTML
              </label>
              <textarea
                value={content.htmlContent || ''}
                onChange={(e) => handleContentChange('htmlContent', e.target.value)}
                rows={8}
                placeholder="<p>Informações de serviços...</p>"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none font-mono"
              />
            </div>
          </div>
        );

      case 'announcement':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo HTML
              </label>
              <textarea
                value={content.htmlContent || ''}
                onChange={(e) => handleContentChange('htmlContent', e.target.value)}
                rows={6}
                placeholder="<h2>Texto do anúncio</h2>"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={content.backgroundColor || '#1e3a5f'}
                  onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={content.backgroundColor || '#1e3a5f'}
                  onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        );

      case 'sponsor':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Patrocinador
              </label>
              <input
                type="text"
                value={content.sponsorName || ''}
                onChange={(e) => handleContentChange('sponsorName', e.target.value)}
                placeholder="Nome do patrocinador"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={content.website || ''}
                onChange={(e) => handleContentChange('website', e.target.value)}
                placeholder="https://www.exemplo.pt"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
            {renderImageUploader(
              content.logoUrl || '',
              (e) => handleImageUpload(e, 'logoUrl'),
              () => handleImageDelete(content.logoUrl, 'logoUrl'),
              'Logo do Patrocinador'
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">A carregar...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Form */}
        <div className="flex-1 lg:w-2/3 space-y-6">
          {/* Basic fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">Informações Gerais</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do slide"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as SlideType);
                    setContent({});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none bg-white"
                >
                  {SLIDE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (segundos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
                />
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2 pb-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`toggle-switch ${isActive ? 'toggle-switch-checked' : 'toggle-switch-unchecked'}`}
                  >
                    <span
                      className={`toggle-dot ${isActive ? 'toggle-dot-checked' : 'toggle-dot-unchecked'}`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">{isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic content fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 text-lg mb-4">
              Conteúdo -{' '}
              {SLIDE_TYPES.find((t) => t.value === type)?.label}
            </h2>
            {renderContentFields()}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-cdf-600 hover:bg-cdf-700 rounded-lg transition-colors disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            <h2 className="font-semibold text-gray-800 text-lg mb-4">Pré-visualização</h2>
            <div className="bg-gray-900 rounded-lg aspect-video overflow-hidden relative">
              <SlidePreview
                type={type}
                title={title}
                content={content}
                imageUrl={imageUrl}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Duração: {duration}s | {isActive ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

function SlidePreview({
  type,
  title,
  content,
  imageUrl,
}: {
  type: SlideType;
  title: string;
  content: any;
  imageUrl: string;
}) {
  const previewTitle = title || 'Sem título';

  switch (type) {
    case 'news':
      return (
        <div className="p-3 h-full flex flex-col">
          <div className="text-cdf-400 text-[8px] font-bold uppercase tracking-wider mb-1">
            Notícias
          </div>
          <h3 className="text-white text-xs font-bold mb-2">{previewTitle}</h3>
          <div className="flex-1 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded p-1.5 flex gap-1.5">
                <div className="w-6 h-6 bg-gray-700 rounded flex-shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="h-1.5 bg-gray-700 rounded w-3/4" />
                  <div className="h-1 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'single_news':
      return (
        <div className="p-3 h-full flex flex-col">
          <div className="text-cdf-400 text-[8px] font-bold uppercase tracking-wider mb-1">
            Notícia em Destaque
          </div>
          <h3 className="text-white text-xs font-bold mb-2">{previewTitle}</h3>
          <div className="flex-1 flex gap-2">
            <div className="w-1/2 bg-gray-700 rounded" />
            <div className="w-1/2 space-y-1">
              <div className="h-2 bg-gray-600 rounded w-3/4" />
              <div className="h-1.5 bg-gray-700 rounded w-full" />
              <div className="h-1.5 bg-gray-700 rounded w-2/3" />
              <div className="mt-2 h-1 bg-cdf-600 rounded w-1/2" />
            </div>
          </div>
        </div>
      );

    case 'game':
      return (
        <div className="p-3 h-full flex flex-col items-center justify-center text-center">
          <div className="text-cdf-400 text-[7px] uppercase tracking-wider mb-1">
            {content.competition || 'Competição'}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-[10px] font-bold">
              {content.homeTeam || 'Casa'}
            </span>
            <span className="text-cdf-400 text-[8px]">vs</span>
            <span className="text-white text-[10px] font-bold">
              {content.awayTeam || 'Fora'}
            </span>
          </div>
          <div className="text-gray-400 text-[7px]">
            {content.date || '--/--'} {content.time || '--:--'}
          </div>
          <div className="text-gray-500 text-[6px] mt-0.5">
            {content.location || 'Local'}
          </div>
        </div>
      );

    case 'complex_map':
      return imageUrl ? (
        <img src={imageUrl} alt="Mapa" className="w-full h-full object-cover" />
      ) : (
        <div className="h-full flex items-center justify-center">
          <Image size={24} className="text-gray-600" />
        </div>
      );

    case 'visitor_info':
      return (
        <div className="p-3 h-full flex flex-col">
          <h3 className="text-white text-xs font-bold mb-1">{previewTitle}</h3>
          <div className="text-gray-400 text-[7px] flex-1 overflow-hidden">
            {content.htmlContent ? 'Conteúdo HTML...' : 'Sem conteúdo'}
          </div>
          {content.imageUrl && (
            <div className="h-8 mt-1 rounded overflow-hidden">
              <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      );

    case 'services':
      return (
        <div className="p-3 h-full flex flex-col">
          <h3 className="text-white text-xs font-bold mb-1">{previewTitle}</h3>
          <div className="text-gray-400 text-[7px] flex-1">
            {content.htmlContent ? 'Conteúdo HTML...' : 'Sem conteúdo'}
          </div>
        </div>
      );

    case 'announcement':
      return (
        <div
          className="p-3 h-full flex items-center justify-center text-center"
          style={{ backgroundColor: content.backgroundColor || '#1e3a5f' }}
        >
          <div>
            <h3 className="text-white text-xs font-bold">{previewTitle}</h3>
            {content.htmlContent && (
              <div className="text-gray-200 text-[7px] mt-1">Conteúdo HTML...</div>
            )}
          </div>
        </div>
      );

    case 'sponsor':
      return (
        <div className="p-3 h-full flex flex-col items-center justify-center text-center">
          {content.logoUrl ? (
            <img
              src={content.logoUrl}
              alt={content.sponsorName || 'Sponsor'}
              className="max-h-10 max-w-full object-contain mb-1"
            />
          ) : (
            <div className="w-12 h-8 bg-gray-800 rounded mb-1 flex items-center justify-center">
              <Image size={14} className="text-gray-600" />
            </div>
          )}
          <div className="text-white text-[9px] font-bold">
            {content.sponsorName || 'Patrocinador'}
          </div>
          {content.website && (
            <div className="text-cdf-400 text-[7px]">{content.website}</div>
          )}
        </div>
      );

    default:
      return (
        <div className="h-full flex items-center justify-center text-gray-500 text-xs">
          Pré-visualização
        </div>
      );
  }
}
