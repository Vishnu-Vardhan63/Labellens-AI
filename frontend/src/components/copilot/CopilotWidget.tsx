import React, { useState } from 'react';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { queryCopilot } from '../../api/client';
import type { CopilotResponse } from '../../types';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  evidenceFields?: string[];
  suggestedActions?: string[];
  timestamp: string;
}

interface CopilotWidgetProps {
  scanId: string;
  onHighlightField: (fieldKey: string) => void;
}

const PRESET_CHIPS = [
  { label: 'Explain this result', intent: 'EXPLAIN_RESULT' },
  { label: 'What needs manual review?', intent: 'WHAT_TO_CHECK_MANUALLY' },
  { label: 'Show detected evidence', intent: 'SHOW_DETECTED_INFORMATION' },
  { label: 'Why was this flagged?', intent: 'SHOW_POTENTIAL_ISSUES' },
];

export function CopilotWidget({ scanId, onHighlightField }: CopilotWidgetProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Legal Metrology Inspection Assistant active. Ask about detected declarations, review reasons, or evidence grounding for this package.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (payload: { intent?: string; query?: string; displayQuestion?: string }) => {
    const questionText = payload.displayQuestion || payload.query || payload.intent || '';
    if (!questionText.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res: CopilotResponse = await queryCopilot(scanId, {
        intent: payload.intent,
        query: payload.query || payload.displayQuestion,
      });

      const assistantMsg: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        evidenceFields: res.evidence_fields,
        suggestedActions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: CopilotMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Inspection Assistant is unable to answer at this time. Please verify backend connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldDisplayNames: Record<string, string> = {
    product_name: 'Product Identity',
    mrp: 'Maximum Retail Price',
    net_quantity: 'Net Quantity',
    manufacturer_packer: 'Manufacturer / Packer',
    date_information: 'Date Information',
    consumer_care: 'Consumer Care',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1F3A]/90 backdrop-blur-xl shadow-xl overflow-hidden text-slate-100">
      {/* Widget Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#10263F]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2563EB]/20 text-[#38BDF8] flex items-center justify-center border border-blue-400/30 text-xs font-bold">
            <SparklesIcon className="w-4.5 h-4.5 text-[#38BDF8]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Inspection Assistant
            </h3>
            <p className="text-[11px] text-slate-400">
              Grounded package screening analysis · Zero hallucination
            </p>
          </div>
        </div>

        <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Grounded</span>
        </div>
      </div>

      {/* Suggested Quick Inquiry Chips */}
      <div className="px-4 py-2.5 bg-[#07111F]/80 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider whitespace-nowrap mr-1">
          Quick Actions:
        </span>
        {PRESET_CHIPS.map(chip => (
          <button
            key={chip.intent}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend({ intent: chip.intent, displayQuestion: chip.label })}
            className="px-3 py-1 rounded-xl border border-white/10 bg-[#10263F] hover:bg-[#16324F] hover:border-[#38BDF8] text-slate-200 hover:text-white font-semibold text-xs whitespace-nowrap cursor-pointer transition disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="p-4 space-y-3.5 max-h-[320px] overflow-y-auto text-xs bg-[#07111F]/40">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-[#2563EB] text-white rounded-br-xs shadow-md font-medium'
                  : 'bg-[#10263F] border border-white/10 text-slate-200 rounded-bl-xs shadow-md'
              }`}
            >
              {m.text}

              {/* Actionable Visual Evidence Links */}
              {m.sender === 'assistant' && m.evidenceFields && m.evidenceFields.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block w-full">
                    Visual Evidence Shortcuts:
                  </span>
                  {m.evidenceFields.map(fKey => (
                    <button
                      key={fKey}
                      type="button"
                      onClick={() => onHighlightField(fKey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB]/40 text-[#38BDF8] font-bold text-[11px] border border-blue-400/30 cursor-pointer transition-colors"
                    >
                      <MagnifyingGlassIcon className="w-3 h-3 text-[#38BDF8]" />
                      <span>Highlight {fieldDisplayNames[fKey] || fKey}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-300 italic p-2.5 bg-[#10263F] rounded-xl border border-white/10 max-w-[220px]">
            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
            <span>Consulting package data...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (inputText.trim() && !isLoading) {
            handleSend({ query: inputText, displayQuestion: inputText });
          }
        }}
        className="p-3 border-t border-white/10 bg-[#10263F] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask a question about this package (e.g. What is the MRP?)..."
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 text-xs bg-[#07111F] text-white rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8] placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2.5 bg-[#2563EB] text-white rounded-xl hover:bg-[#1d4ed8] disabled:opacity-40 transition-colors cursor-pointer shadow-md"
          title="Send query to Copilot"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
