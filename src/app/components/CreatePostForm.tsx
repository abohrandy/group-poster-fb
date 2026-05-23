'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { createGroupPostAction } from '@/app/actions/groups';
import { generateCaptionsAction } from '@/app/actions/ai';
import { X, Loader2, FileText, ImageIcon, CheckCircle2, AlertTriangle, Send, Sparkles } from 'lucide-react';

interface CreatePostFormProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  facebookPageName?: string;
}

const initialState = {
  error: '',
  success: '',
};

export default function CreatePostForm({ groupId, groupName, isOpen, onClose, facebookPageName }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  
  // AI caption states
  const [isAiPending, startAiTransition] = useTransition();
  const [aiVariations, setAiVariations] = useState<Array<{ tone: string; caption: string }>>([]);
  const [aiError, setAiError] = useState('');

  const boundPostAction = createGroupPostAction.bind(null, groupId);
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const imagePath = formData.get('imagePath') as string;
      return boundPostAction(content, imagePath || undefined);
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

  const selectVariation = (caption: string) => {
    setContent(caption);
    setAiVariations([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-400" />
              Write Group Post
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              Post to <span className="text-indigo-400 font-semibold">{groupName}</span> as {facebookPageName || "Mayor's Page"}
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
        <form action={formAction} className="p-6 space-y-4">
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
              <button
                type="button"
                onClick={onClose}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline text-[11px]"
              >
                Close Modal
              </button>
            </div>
          )}

          {/* Post Content */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Post Body *</label>
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
                placeholder="Write your group post update here... click 'Generate AI Variations' to rewrite the post in diverse tones and bypass duplicates."
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
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                Select AI Variation (Anti-Duplicate System)
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {aiVariations.map((v, index) => (
                  <div
                    key={index}
                    onClick={() => selectVariation(v.caption)}
                    className="p-3 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-indigo-500/30 hover:bg-indigo-500/5 cursor-pointer text-xs transition-all duration-300"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                        v.tone === 'Professional'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : v.tone === 'Casual'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {v.tone}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold select-none group-hover:text-indigo-400">Use variation &rarr;</span>
                    </div>
                    <p className="text-gray-300 italic font-sans leading-relaxed">"{v.caption}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Path */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Image File Path (Optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <ImageIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="imagePath"
                placeholder="e.g. C:\Users\admin\Desktop\image.jpg"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-800 bg-gray-950/50 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm font-sans"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Provide the absolute file path to upload an image along with the post.</p>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Posting (Human Typing)...
                </>
              ) : (
                'Publish Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
