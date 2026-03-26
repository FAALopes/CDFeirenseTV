import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlusCircle,
  GripVertical,
  Trash2,
  Search,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import type { Slide, SlideType } from '../types';
import { getSlides, deleteSlide, reorderSlides, toggleSlide, updateSlide } from '../services/api';

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  news: 'Notícias',
  single_news: 'Notícia Destaque',
  game: 'Jogo',
  complex_map: 'Mapa Complexo',
  visitor_info: 'Info Visitante',
  services: 'Serviços',
  announcement: 'Anúncio',
  sponsor: 'Patrocinador',
};

const SLIDE_TYPE_COLORS: Record<SlideType, string> = {
  news: 'bg-blue-100 text-blue-800',
  single_news: 'bg-indigo-100 text-indigo-800',
  game: 'bg-green-100 text-green-800',
  complex_map: 'bg-purple-100 text-purple-800',
  visitor_info: 'bg-orange-100 text-orange-800',
  services: 'bg-teal-100 text-teal-800',
  announcement: 'bg-yellow-100 text-yellow-800',
  sponsor: 'bg-pink-100 text-pink-800',
};

interface SortableSlideProps {
  slide: Slide;
  onDelete: (slide: Slide) => void;
  onToggle: (id: number) => void;
  onUpdate: (id: number, data: Partial<Slide>) => void;
}

function SortableSlide({ slide, onDelete, onToggle, onUpdate }: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const [titleValue, setTitleValue] = useState(slide.title);
  const [durationValue, setDurationValue] = useState(slide.duration);
  const [typeValue, setTypeValue] = useState<SlideType>(slide.type);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const saveTitle = () => {
    if (titleValue.trim() && titleValue !== slide.title) {
      onUpdate(slide.id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const saveDuration = () => {
    const val = Math.max(1, Math.min(300, durationValue));
    if (val !== slide.duration) {
      onUpdate(slide.id, { duration: val });
    }
    setEditingDuration(false);
  };

  const saveType = (newType: SlideType) => {
    setTypeValue(newType);
    if (newType !== slide.type) {
      onUpdate(slide.id, { type: newType as any });
    }
    setEditingType(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[40px_140px_1fr_80px_60px_70px] items-center gap-3 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !slide.isActive ? 'opacity-50' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none justify-self-center"
      >
        <GripVertical size={16} />
      </button>

      {/* Type badge - click to edit */}
      {editingType ? (
        <select
          autoFocus
          value={typeValue}
          onChange={(e) => saveType(e.target.value as SlideType)}
          onBlur={() => setEditingType(false)}
          className="text-xs px-1 py-1 border border-cdf-300 rounded bg-white outline-none focus:ring-1 focus:ring-cdf-500"
        >
          {Object.entries(SLIDE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      ) : (
        <button
          onClick={() => setEditingType(true)}
          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:ring-2 hover:ring-cdf-300 transition-all ${
            SLIDE_TYPE_COLORS[slide.type]
          }`}
          title="Clique para editar tipo"
        >
          {SLIDE_TYPE_LABELS[slide.type]}
        </button>
      )}

      {/* Title - click to edit */}
      {editingTitle ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(slide.title); setEditingTitle(false); } }}
            className="flex-1 px-2 py-1 text-sm border border-cdf-300 rounded outline-none focus:ring-1 focus:ring-cdf-500"
          />
          <button onClick={saveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
          <button onClick={() => { setTitleValue(slide.title); setEditingTitle(false); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
        </div>
      ) : (
        <button
          onClick={() => setEditingTitle(true)}
          className="text-left text-sm text-gray-800 truncate hover:text-cdf-600 cursor-pointer"
          title="Clique para editar título"
        >
          {slide.title}
        </button>
      )}

      {/* Duration - click to edit */}
      {editingDuration ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="number"
            min={1}
            max={300}
            value={durationValue}
            onChange={(e) => setDurationValue(parseInt(e.target.value) || 1)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveDuration(); if (e.key === 'Escape') { setDurationValue(slide.duration); setEditingDuration(false); } }}
            className="w-14 px-2 py-1 text-sm border border-cdf-300 rounded outline-none focus:ring-1 focus:ring-cdf-500 text-center"
          />
          <span className="text-xs text-gray-500">s</span>
          <button onClick={saveDuration} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
        </div>
      ) : (
        <button
          onClick={() => setEditingDuration(true)}
          className="text-sm text-gray-600 hover:text-cdf-600 cursor-pointer text-center"
          title="Clique para editar duração"
        >
          {slide.duration}s
        </button>
      )}

      {/* Active toggle */}
      <button
        onClick={() => onToggle(slide.id)}
        className={`toggle-switch ${slide.isActive ? 'toggle-switch-checked' : 'toggle-switch-unchecked'}`}
        title={slide.isActive ? 'Ativo' : 'Inativo'}
      >
        <span className={`toggle-dot ${slide.isActive ? 'toggle-dot-checked' : 'toggle-dot-unchecked'}`} />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(slide)}
        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors justify-self-center"
        title="Eliminar"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Slide | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSlides = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterActive) params.isActive = filterActive;
      if (searchText) params.search = searchText;
      const data = await getSlides(params);
      setSlides(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterType, filterActive, searchText]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);
    setSlides(reordered);

    const items = reordered.map((s, i) => ({ id: s.id, ordering: i + 1 }));
    try {
      await reorderSlides(items);
    } catch {
      fetchSlides();
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await toggleSlide(id);
      setSlides((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      // ignore
    }
  };

  const handleUpdate = async (id: number, data: Partial<Slide>) => {
    try {
      const updated = await updateSlide(id, data);
      setSlides((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSlide(deleteTarget.id);
      setSlides((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch {
      // ignore
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Painel de Controlo</h1>
        <button
          onClick={() => navigate('/slides/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cdf-600 hover:bg-cdf-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={18} />
          Novo Slide
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none bg-white"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(SLIDE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none bg-white"
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {/* Slide table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_140px_1fr_80px_60px_70px] items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span></span>
          <span>Tipo</span>
          <span>Título</span>
          <span className="text-center">Duração</span>
          <span className="text-center">Ativo</span>
          <span className="text-center">Ações</span>
        </div>

        {/* Slide list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">A carregar slides...</div>
        ) : slides.length === 0 ? (
          <div className="text-center py-12">
            <PlusCircle size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Nenhum slide encontrado</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {slides.map((slide) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  onDelete={setDeleteTarget}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Eliminar Slide</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Tem a certeza que pretende eliminar o slide{' '}
              <strong>"{deleteTarget.title}"</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
