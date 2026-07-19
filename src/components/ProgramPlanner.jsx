import React, { useState } from 'react';
import { Music, Award, Plus, Trash2, CheckCircle2, LayoutGrid, Heart, Sparkles } from 'lucide-react';
import { API_URL } from '../config';

const getMediaEmbed = (url) => {
  if (!url) return null;
  
  // YouTube parser
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
    };
  }

  // Spotify parser
  if (url.includes('spotify.com')) {
    const cleanUrl = url.split('?')[0];
    const embedUrl = cleanUrl.replace('spotify.com/', 'spotify.com/embed/');
    return {
      type: 'spotify',
      embedUrl
    };
  }

  // Instagram parser
  if (url.includes('instagram.com')) {
    const cleanUrl = url.split('?')[0];
    const slashEnds = cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/';
    return {
      type: 'instagram',
      embedUrl: `${slashEnds}embed`
    };
  }

  // General Image parser
  if (url.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
    return {
      type: 'image',
      embedUrl: url
    };
  }

  // General URL fallback
  return {
    type: 'link',
    embedUrl: url
  };
};

export default function ProgramPlanner({ details, token, onDetailAdded, onDetailDeleted }) {
  const [category, setCategory] = useState('Music');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [side, setSide] = useState('Shared');
  const [mediaUrl, setMediaUrl] = useState('');
  const [message, setMessage] = useState(null);

  const categories = ['Music', 'Decor & Theme', 'Moments & Toast', 'Cake & Dessert', 'Custom Details'];

  // Common quick templates to click and add instantly
  const templates = [
    { category: 'Music', key: 'Grand Entry Song', val: 'Marry You - Bruno Mars' },
    { category: 'Music', key: 'First Dance Song', val: 'Perfect - Ed Sheeran' },
    { category: 'Music', key: 'Bride Walk Song', val: 'A Thousand Years' },
    { category: 'Decor & Theme', key: 'Primary Theme Color', val: 'Dusty Rose & Sage Green' },
    { category: 'Cake & Dessert', key: 'Wedding Cake Flavour', val: 'Red Velvet Vanilla Fusion' },
    { category: 'Moments & Toast', key: 'Best Man Toast Speaker', val: 'Mark (Best Man)' }
  ];

  const handleAddDetail = async (e) => {
    if (e) e.preventDefault();
    if (!key.trim() || !value.trim()) {
      setMessage({ type: 'error', text: 'Detail name and value are required.' });
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/program-details`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ category, key, value, side, mediaUrl })
      });
      if (res.ok) {
        const data = await res.json();
        onDetailAdded(data);
        setKey('');
        setValue('');
        setMediaUrl('');
        setMessage({ type: 'success', text: 'Program detail saved!' });
      }
    } catch (err) {
      // Offline fallback
      const fallback = { _id: Date.now().toString(), category, key, value, side, mediaUrl };
      onDetailAdded(fallback);
      setKey('');
      setValue('');
      setMediaUrl('');
      setMessage({ type: 'success', text: 'Saved locally (Offline).' });
    }
  };

  const handleApplyTemplate = (tpl) => {
    setCategory(tpl.category);
    setKey(tpl.key);
    setValue(tpl.val);
    setMediaUrl('');
  };

  const handleDelete = async (id) => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_URL}/api/program-details/${id}`, {
        method: 'DELETE',
        headers
      });
      onDetailDeleted(id);
    } catch (err) {
      onDetailDeleted(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-semibold text-base text-slate-800 flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-100" />
            Wedding Details & Program Planner
          </h3>
          <p className="text-xs text-slate-400">Map out creative details like entrance songs, toast programs, decor preferences, and cake selections.</p>
        </div>

        {/* Templates shortcuts */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Quick Templates:</span>
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleApplyTemplate(tpl)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors"
            >
              {tpl.key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creation panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
          <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">Record Program Detail</h4>
          
          {message && (
            <div className={`p-3 rounded-lg text-xs font-semibold mb-4 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAddDetail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Planning Category</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detail Parameter (Key)</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                placeholder="e.g. Grand Entrance Song / MC Name"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Value</label>
              <textarea
                required
                rows="2"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                placeholder="e.g. Perfect - Ed Sheeran / Uncle Mark"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Workspace Alignment</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                value={side}
                onChange={(e) => setSide(e.target.value)}
              >
                <option value="Shared">Shared / Joint View</option>
                <option value="Bride">Bride Team / Preference</option>
                <option value="Groom">Groom Team / Preference</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attached Media / Reference URL (Optional)</label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                placeholder="Spotify, YouTube, Instagram, or Image link"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Save Program Item
            </button>
          </form>
        </div>

        {/* Display Grid */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map(catGroup => {
            const filtered = details.filter(d => d.category === catGroup);
            if (filtered.length === 0) return null;

            return (
              <div key={catGroup} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">{catGroup}</h4>
                  <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.25 rounded font-bold">
                    {filtered.length} items
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map(detail => (
                    <div 
                      key={detail._id}
                      className="p-3 rounded-xl border border-slate-150 bg-slate-50/30 flex justify-between items-start gap-4 relative group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                            {detail.key}
                          </span>
                          <span className={`px-1.5 py-0.25 rounded text-[8px] font-bold ${
                            detail.side === 'Bride' ? 'bg-rose-50 text-rose-600' :
                            detail.side === 'Groom' ? 'bg-sky-50 text-sky-600' :
                            'bg-indigo-50 text-indigo-650'
                          }`}>
                            {detail.side}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 whitespace-pre-wrap">{detail.value}</p>
                        {detail.mediaUrl && (() => {
                          const embed = getMediaEmbed(detail.mediaUrl);
                          if (!embed) return null;

                          if (embed.type === 'image') {
                            return (
                              <div className="mt-2 rounded-lg overflow-hidden max-w-full h-24 border border-slate-200 bg-slate-100 shadow-inner">
                                <img src={embed.embedUrl} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            );
                          }
                          if (['youtube', 'spotify', 'instagram'].includes(embed.type)) {
                            return (
                              <div className="mt-2 rounded-lg overflow-hidden w-full border border-slate-200 bg-slate-50 shadow-inner">
                                <iframe
                                  src={embed.embedUrl}
                                  width="100%"
                                  height={embed.type === 'spotify' ? '80' : '150'}
                                  frameBorder="0"
                                  allowTransparency="true"
                                  allow="encrypted-media; clipboard-write; picture-in-picture; web-share"
                                  title="Media Preview"
                                  className="rounded-lg"
                                ></iframe>
                              </div>
                            );
                          }
                          return (
                            <a
                              href={detail.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 text-[10px] font-extrabold text-indigo-650 hover:underline flex items-center gap-1"
                            >
                              🔗 View Reference Link
                            </a>
                          );
                        })()}
                      </div>

                      <button
                        onClick={() => handleDelete(detail._id)}
                        className="text-slate-300 hover:text-rose-600 self-center transition-colors"
                        title="Remove detail"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {details.length === 0 && (
            <div className="bg-slate-50 border border-dashed border-slate-350 p-16 rounded-2xl text-center text-slate-500 text-xs italic">
              Program and playlist planner is empty. Click templates above or add entries to record details!
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
