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
  Edit,
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
  onEdit: (id: number) => void;
  onDelete: (slide: Slide) => void;
  onToggle: (id: number) => void;
  onUpdate: (id: number, data: Partial<Slide>) => void;
}

function SortableSlide({ slide, onEdit, onDelete, onToggle, onUpdate }: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [titleValue, setTitleValue] = useState(slide.title);
  const [durationValue, setDurationValue] = useState(slide.duration);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${
        !slide.isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
      >
        <GripVertical size={20} />
      </button>

      {/* Active toggle */}
      <button
        onClick={() => onToggle(slide.id)}
        className={`toggle-switch ${slide.isActive ? 'toggle-switch-checked' : 'toggle-switch-unchecked'}`}
        title={slide.isActive ? 'Ativo' : 'Inativo'}
      >
        <span className={`toggle-dot ${slide.isActive ? 'toggle-dot-checked' : 'toggle-dot-unchecked'}`} />
      </button>

      {/* Type badge */}
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          SLIDE_TYPE_COLORS[slide.type]
        }`}
      >
        {SLIDE_TYPE_LABELS[slide.type]}
      </span>

      {/* Title - inline editable */}
      <div className="flex-1 min-w-0">
        {editingTitle ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(slide.title); setEditingTitle(false); } }}
              className="flex-1 px-2 py-1 text-sm font-medium border border-cdf-300 rounded outline-none focus:ring-1 focus:ring-cdf-500"
            />
            <button onClick={saveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
            <button onClick={() => { setTitleValue(slide.title); setEditingTitle(false); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
        ) : (
          <h3
            onClick={() => setEditingTitle(true)}
            className="font-medium text-gray-800 truncate cursor-pointer hover:text-cdf-600"
            title="Clique para editar"
          >
            {slide.title}
          </h3>
        )}
      </div>

      {/* Duration - inline editable, same font size */}
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
            className="w-16 px-2 py-1 text-sm font-medium border border-cdf-300 rounded outline-none focus:ring-1 focus:ring-cdf-500 text-center"
          />
          <button onClick={saveDuration} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
        </div>
      ) : (
        <span
          onClick={() => setEditingDuration(true)}
          className="text-sm font-medium text-gray-500 cursor-pointer hover:text-cdf-600 whitespace-nowrap"
          title="Clique para editar"
        >
          {slide.duration}s
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(slide.id)}
          className="p-2 text-gray-400 hover:text-cdf-600 hover:bg-cdf-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => onDelete(slide)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar slides..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
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
              <option key={value} value={value}>
                {label}
              </option>
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

      {/* Slide list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">A carregar slides...</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-3">
            <PlusCircle size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 font-medium">Nenhum slide encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Crie o primeiro slide para começar</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {slides.map((slide) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  onEdit={(id) => navigate(`/slides/${id}`)}
                  onDelete={setDeleteTarget}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
              <strong>"{deleteTarget.title}"</strong>? Esta ação não pode ser revertida.
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
