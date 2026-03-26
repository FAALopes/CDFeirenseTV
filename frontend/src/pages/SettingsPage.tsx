import { useState, useEffect, type FormEvent } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [defaultDuration, setDefaultDuration] = useState('10');
  const [transitionEffect, setTransitionEffect] = useState('fade');
  const [transitionDuration, setTransitionDuration] = useState('600');
  const [tvRefreshInterval, setTvRefreshInterval] = useState('60');
  const [wpApiUrl, setWpApiUrl] = useState('');
  const [wpAutoFetchCount, setWpAutoFetchCount] = useState('5');

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data.defaultDuration) setDefaultDuration(data.defaultDuration);
        if (data.transitionEffect) setTransitionEffect(data.transitionEffect);
        if (data.transitionDuration) setTransitionDuration(data.transitionDuration);
        if (data.tvRefreshInterval) setTvRefreshInterval(data.tvRefreshInterval);
        if (data.wpApiUrl) setWpApiUrl(data.wpApiUrl);
        if (data.wpAutoFetchCount) setWpAutoFetchCount(data.wpAutoFetchCount);
      })
      .catch(() => setError('Erro ao carregar definições'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);

    try {
      await updateSettings({
        defaultDuration,
        transitionEffect,
        transitionDuration,
        tvRefreshInterval,
        wpApiUrl,
        wpAutoFetchCount,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao guardar definições');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">A carregar definições...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle size={18} />
          Definições guardadas com sucesso
        </div>
      )}

      {/* TV Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">Definições da TV</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração padrão (segundos)
            </label>
            <input
              type="number"
              min={1}
              max={300}
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Duração padrão para novos slides se não especificada
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Efeito de transição
            </label>
            <select
              value={transitionEffect}
              onChange={(e) => setTransitionEffect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none bg-white"
            >
              <option value="fade">Fade</option>
              <option value="slide_left">Deslizar para a esquerda</option>
              <option value="slide_right">Deslizar para a direita</option>
              <option value="none">Nenhum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração da transição (ms)
            </label>
            <input
              type="number"
              min={0}
              max={3000}
              step={100}
              value={transitionDuration}
              onChange={(e) => setTransitionDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intervalo de atualização (segundos)
            </label>
            <input
              type="number"
              min={10}
              max={600}
              value={tvRefreshInterval}
              onChange={(e) => setTvRefreshInterval(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Intervalo para re-buscar dados da TV (slides e definições)
            </p>
          </div>
        </div>
      </div>

      {/* WordPress Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">Definições WordPress</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da API</label>
            <input
              type="url"
              value={wpApiUrl}
              onChange={(e) => setWpApiUrl(e.target.value)}
              placeholder="https://cdfeirense.pt/wp-json/wp/v2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de posts (auto-fetch)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={wpAutoFetchCount}
              onChange={(e) => setWpAutoFetchCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cdf-500 focus:border-cdf-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-cdf-600 hover:bg-cdf-700 rounded-lg transition-colors disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? 'A guardar...' : 'Guardar Definições'}
        </button>
      </div>
    </form>
  );
}
