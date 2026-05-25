'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { createCampaignAction } from '@/app/actions/groups';
import { generateCaptionsAction } from '@/app/actions/ai';
import { X, Loader2, FileText, ImageIcon, CheckCircle2, AlertTriangle, Send, Sparkles, Clock, RefreshCw } from 'lucide-react';

interface CampaignPostModalProps {
  selectedGroups: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  facebookPageName?: string;
  onSuccess: () => void;
}

const initialState = {
  error: '',
  success: '',
};

export default function CampaignPostModal({
  selectedGroups,
  isOpen,
  onClose,
  facebookPageName,
  onSuccess,
}: CampaignPostModalProps) {
  const [content, setContent] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [rotateVariations, setRotateVariations] = useState(true);
  const [imagePath, setImagePath] = useState('');

  // AI variation states
  const [isAiPending, startAiTransition] = useTransition();
  const [aiVariations, setAiVariations] = useState<Array<{ tone: string; caption: string }>>([]);
  const [aiError, setAiError] = useState('');

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const ids = selectedGroups.map((g) => g.id);
      const res = await createCampaignAction(
        ids,
        content,
        delayMinutes,
        rotateVariations,
        imagePath || undefined
      );
      if (res.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
      return res;
    },
    initialState
  );

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleAiRewrite = () => {
    if (!content.trim()) {
      setAiError('Please enter some text in the Post Body first to generate variations.');
      return;
    }
    setAiError('');
    setAiVariations([]);
    startAiTransition(async () => {
      const result = await generateCaptionsAction(content);
      if (result.error) {
        setAiError(result.error);
      } else if (result.variations) {
        setAiVariations(result.variations);
      }
    });
  };

  if (!isOpen) return null;

  // Calculate campaign span
  const campaignDuration = (selectedGroups.length - 1) * delayMinutes;
  const formatDuration = (mins: number) => {
    if (mins <= 0) return 'instantly';
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs > 0) {
      return `${hrs} hr ${m > 0 ? `${m} min` : ''}`;
    }
    return `${mins} minutes`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              Schedule Post Campaign
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Bulk posting to <span className="text-indigo-400 font-semibold">{selectedGroups.length} groups</span> as{' '}
              <span className="text-indigo-400">{facebookPageName || "Mayor's Page"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="p-6 space-y-5">
          {state?.error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{state.success}</span>
              </div>
            </div>
          )}

          {/* Group Names Chip Container */}
          <div className="bg-gray-950/40 border border-gray-800/80 rounded-xl p-3.5 space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Selected Target Groups ({selectedGroups.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {selectedGroups.map((g) => (
                <span
                  key={g.id}
                  className="px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-md text-xs text-gray-300 font-medium font-sans inline-block"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Base Message Content *
              </label>
              <button
                type="button"
                onClick={handleAiRewrite}
                disabled={isAiPending || isPending}
                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 text-xs font-semibold flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 transition-all hover:scale-[1.01]"
              >
                {isAiPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Rewriting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" /> Generate AI Variations
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-500">
                <FileText className="h-4 w-4" />
              </span>
              <textarea
                name="content"
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your primary message here... The AI anti-duplicate system will rewrite it into multiple variations and rotate them across scheduled posts."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
              />
            </div>
          </div>

          {/* AI Variations Result Drawer */}
          {aiError && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {aiVariations.length > 0 && (
            <div className="border border-gray-800 rounded-xl p-4 bg-gray-950/30 space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin-slow" />
                AI Rotation Preview (Bypasses Duplicate Content Filters)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiVariations.map((v, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-gray-800/80 bg-gray-900/40 text-[11px] leading-relaxed transition-all duration-300"
                  >
                    <div className="mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border ${
                          v.tone === 'Professional'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : v.tone === 'Casual'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {v.tone}
                      </span>
                    </div>
                    <p className="text-gray-300 italic">"{v.caption}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timing Interval */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-500" /> Stagger Interval (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                required
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
              <p className="text-[10px] text-gray-500 mt-1">Time delay between each sequential post.</p>
            </div>

            {/* Image Path */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-gray-500" /> Image Path (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. C:\Users\admin\Desktop\image.jpg"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
              <p className="text-[10px] text-gray-500 mt-1">Absolute local directory path of image to upload.</p>
            </div>
          </div>

          {/* Rotation Toggle */}
          <div className="flex items-center gap-2 p-3 bg-gray-950/20 border border-gray-800/60 rounded-xl">
            <input
              type="checkbox"
              id="rotateVariations"
              checked={rotateVariations}
              onChange={(e) => setRotateVariations(e.target.checked)}
              className="h-4 w-4 rounded border-gray-800 bg-gray-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors cursor-pointer"
            />
            <label htmlFor="rotateVariations" className="text-xs text-gray-300 font-medium select-none cursor-pointer">
              Rotate AI variations across target groups to evade duplicate posting flags.
            </label>
          </div>

          {/* Summary Box */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-xs text-indigo-300 flex justify-between items-center gap-2">
            <div>
              <p className="font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Campaign Stagger Schedule Summary
              </p>
              <p className="text-indigo-400/80 mt-1 leading-relaxed">
                Posts will execute sequentially. First post will launch immediately. Subsequent posts will trigger every{' '}
                <span className="font-bold text-white">{delayMinutes} minutes</span>. Entire run will complete in{' '}
                <span className="font-bold text-white">{formatDuration(campaignDuration)}</span>.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-800 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !content}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 flex items-center gap-2 hover:scale-[1.01]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scheduling Campaign...
                </>
              ) : (
                'Schedule Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
