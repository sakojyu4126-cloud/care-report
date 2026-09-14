import React, { useState, useEffect } from 'react';
import { CareReport, Resident, ShiftRecord, hasShiftData } from '../types';
import { Check, Edit3, Eye, EyeOff } from 'lucide-react';

interface ReportCardProps {
  key?: string;
  resident: Resident;
  report: CareReport | null;
  onEditShift: (shift: 'morning' | 'noon' | 'night') => void;
  onToggleYamamotoConfirm: (reportId: string | null) => void;
  onSaveYamamotoInstructions: (text: string, reportId: string | null) => void;
  dateLabel?: string;
  onDeleteReport?: (reportId: string) => void;
}

export default function ReportCard({
  resident,
  report,
  onEditShift,
  onToggleYamamotoConfirm,
  onSaveYamamotoInstructions,
  dateLabel,
}: ReportCardProps) {
  // Shift-level collapse states
  const [collapsedShifts, setCollapsedShifts] = useState<{
    morning: boolean;
    noon: boolean;
    night: boolean;
  }>({
    morning: false,
    noon: false,
    night: false,
  });

  // Yamamoto section collapse & edit states
  const [isYamamotoCollapsed, setIsYamamotoCollapsed] = useState(false);
  const [isEditingYamamoto, setIsEditingYamamoto] = useState(false);
  const [editedYamamotoText, setEditedYamamotoText] = useState(report?.yamamotoInstructions?.text || '');

  useEffect(() => {
    if (!isEditingYamamoto) {
      setEditedYamamotoText(report?.yamamotoInstructions?.text || '');
    }
  }, [report?.yamamotoInstructions?.text, isEditingYamamoto]);

  const toggleShiftCollapse = (shiftKey: 'morning' | 'noon' | 'night') => {
    setCollapsedShifts((prev) => ({
      ...prev,
      [shiftKey]: !prev[shiftKey],
    }));
  };

  const handleSaveYamamoto = () => {
    onSaveYamamotoInstructions(editedYamamotoText, report ? report.id : null);
    setIsEditingYamamoto(false);
  };

  const handleCancelYamamoto = () => {
    setEditedYamamotoText(report?.yamamotoInstructions?.text || '');
    setIsEditingYamamoto(false);
  };

  // Helper to render temperature with custom color rule (red if >= 37.5, blue if < 37.5)
  const renderKt = (ktStr: string) => {
    if (!ktStr) return <span className="text-slate-400 font-mono">--.-℃</span>;
    const ktVal = parseFloat(ktStr);
    if (!isNaN(ktVal) && ktVal >= 37.5) {
      return (
        <span className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-black text-sm border border-rose-300 animate-pulse">
          {ktStr}℃
        </span>
      );
    } else {
      return (
        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold text-sm border border-blue-200">
          {ktStr}℃
        </span>
      );
    }
  };

  // Helper to render category badges neatly with smartphone-friendly legible font sizes
  const renderCategories = (shift: ShiftRecord) => {
    const badges: { text: string; color: string }[] = [];
    
    if (shift.categories.poorHealth.length > 0) {
      shift.categories.poorHealth.forEach(c => {
        badges.push({ text: `体調不良: ${c}`, color: 'bg-red-50 text-red-700 border-red-300' });
      });
    }
    
    if (shift.categories.injuryGait.length > 0) {
      shift.categories.injuryGait.forEach(c => {
        badges.push({ text: `怪我・歩行: ${c}`, color: 'bg-amber-50 text-amber-800 border-amber-300' });
      });
    }
    
    if (shift.categories.elimination.length > 0) {
      shift.categories.elimination.forEach(c => {
        badges.push({ text: `排泄: ${c}`, color: 'bg-indigo-50 text-indigo-800 border-indigo-300' });
      });
    }

    if (badges.length === 0 && !shift.otherSymptomText) return null;

    return (
      <div className="space-y-2 mt-1">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b, idx) => (
              <span key={idx} className={`inline-block text-xs px-2 py-1 rounded-md font-extrabold border shadow-3xs ${b.color}`}>
                {b.text}
              </span>
            ))}
          </div>
        )}
        {shift.otherSymptomText && (
          <div className="text-sm text-slate-800 bg-white p-2 rounded-lg border border-slate-200 shadow-3xs leading-relaxed whitespace-pre-wrap break-words">
            <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs mr-1.5">【他】</span>
            {shift.otherSymptomText}
          </div>
        )}
      </div>
    );
  };

  // Render Shift Box (朝・昼・夜) with smartphone-optimized fonts & individual collapse toggle
  const renderShiftBox = (
    title: '朝' | '昼' | '夜',
    shiftKey: 'morning' | 'noon' | 'night',
    bgClass: string,
    borderClass: string,
    accentBadgeClass: string
  ) => {
    const rawShiftData = report ? report[shiftKey] : null;
    const shiftData = hasShiftData(rawShiftData) ? rawShiftData : null;
    const isHidden = collapsedShifts[shiftKey];

    return (
      <div className={`flex flex-col p-3 sm:p-3.5 rounded-xl border-2 ${bgClass} ${borderClass} relative transition-all shadow-xs`}>
        {/* Shift Title Header */}
        <div className="flex items-center justify-between border-b border-slate-300/70 pb-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-md border shadow-3xs ${accentBadgeClass}`}>
              {title}
            </span>
            {shiftData && (
              <span className="inline-flex items-center text-xs text-slate-700 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md font-bold" title="記録者">
                担当: {shiftData.reporter || '未詳'}
              </span>
            )}
            {!shiftData && (
              <span className="text-xs text-slate-500 font-bold">
                (未入力)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {/* 非表示 / 表示 Toggle Button (Eye/EyeOff) */}
            <button
              onClick={() => toggleShiftCollapse(shiftKey)}
              className="text-xs text-slate-600 hover:text-slate-900 bg-white/90 hover:bg-white px-2 py-1 rounded-md border border-slate-300 font-bold flex items-center space-x-1 transition-colors cursor-pointer shadow-3xs"
              title={isHidden ? `${title}の記録を表示する` : `${title}の記録を折りたたんで非表示にする`}
            >
              {isHidden ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                  <span>表示</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                  <span>非表示</span>
                </>
              )}
            </button>

            {/* 編集 / 記録 Button */}
            <button
              onClick={() => onEditShift(shiftKey)}
              className="text-xs text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-md border border-blue-300 font-black flex items-center space-x-1 transition-colors cursor-pointer shadow-3xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-blue-600" />
              <span>{shiftData ? '編集' : '記録'}</span>
            </button>
          </div>
        </div>

        {/* Content body if not hidden */}
        {isHidden ? (
          <div 
            onClick={() => toggleShiftCollapse(shiftKey)}
            className="py-3 px-2 text-center text-xs text-slate-500 bg-white/50 rounded-lg border border-dashed border-slate-300 cursor-pointer hover:bg-white/80 transition-colors flex items-center justify-center space-x-1.5"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-bold">{title}の詳細は非表示中（タップで再表示）</span>
          </div>
        ) : shiftData ? (
          <div className="flex-1 flex flex-col justify-between space-y-2.5 text-sm">
            {/* 1. Categories & Symptoms */}
            <div>
              {renderCategories(shiftData)}
            </div>

            {/* 2. Vitals Line (Large, clear smartphone typography) */}
            <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200/90 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm shadow-3xs">
              <div className="flex items-center space-x-1 font-bold">
                <span className="text-slate-500 font-mono">KT:</span>
                {renderKt(shiftData.vitals.kt)}
              </div>
              <span className="text-slate-300">|</span>
              <div className="font-mono">
                <span className="text-slate-500 font-bold">BP:</span>{' '}
                {shiftData.vitals.bpSys ? (
                  <span className="font-black text-slate-900 text-sm">
                    {shiftData.vitals.bpSys}/{shiftData.vitals.bpDia || '--'}
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold">--/--</span>
                )}
              </div>
              <span className="text-slate-300">|</span>
              <div className="font-mono">
                <span className="text-slate-500 font-bold">PR:</span>{' '}
                {shiftData.vitals.pr ? (
                  <span className="font-black text-slate-900 text-sm">{shiftData.vitals.pr}</span>
                ) : (
                  <span className="text-slate-400 font-bold">--</span>
                )}
              </div>
            </div>

            {/* 3. Meals & Hydration (Smartphone clear 2-column layout) */}
            <div className="grid grid-cols-2 gap-2 bg-white/90 p-2 sm:p-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-3xs">
              <div>
                <span className="text-slate-500 font-bold">主食:</span>{' '}
                <span className="font-mono font-black text-slate-900 text-base">{shiftData.meals.staple || '0'}</span>
                <span className="font-bold text-slate-700 ml-0.5">割</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold">副食:</span>{' '}
                <span className="font-mono font-black text-slate-900 text-base">{shiftData.meals.side || '0'}</span>
                <span className="font-bold text-slate-700 ml-0.5">割</span>
              </div>
              {shiftData.meals.lacol && (
                <div className="col-span-2 flex items-center space-x-1.5 pt-0.5">
                  <span className="text-slate-500 font-bold">ラコール等栄養剤:</span>{' '}
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-black text-xs border border-emerald-300">
                    {shiftData.meals.lacol}
                  </span>
                </div>
              )}
              <div className="col-span-2 flex items-center space-x-1 pt-0.5">
                <span className="text-slate-500 font-bold">水分:</span>{' '}
                <span className="font-mono font-black text-slate-900 text-sm">
                  {shiftData.meals.water || '--'}
                </span>
                <span className="text-slate-700 font-bold">ml</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg bg-white/50 p-4 text-center text-xs text-slate-500">
            <span className="font-bold">この時間帯の記録はありません</span>
            <button
              onClick={() => onEditShift(shiftKey)}
              className="mt-2 text-xs text-blue-700 hover:text-blue-900 bg-white border border-blue-300 px-3 py-1 rounded-md font-black shadow-3xs hover:bg-blue-50 transition-colors"
            >
              + {title}の記録を追加
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      id={`resident-card-${resident.id}`}
      className="rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col scroll-mt-28"
    >
      {/* 1. Header Card Panel with Large Font */}
      <div className="bg-emerald-600 px-4 py-3 sm:py-3.5 text-white flex items-center justify-between border-b border-emerald-700 shadow-xs">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
          {dateLabel && (
            <span className="rounded-md bg-amber-400 text-slate-950 px-2.5 py-1 text-xs font-black shadow-xs mr-1">
              {dateLabel}
            </span>
          )}
          <span className="rounded-lg bg-emerald-900/90 border border-emerald-400/50 px-2.5 py-1 text-xs sm:text-sm font-mono font-black text-white shadow-3xs">
            {resident.roomNumber}号室
          </span>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-baseline space-x-1">
            <span>{resident.name}</span>
            <span className="text-xs text-emerald-100 font-bold">様</span>
          </h3>
          {resident.careLevel && (
            <span className="rounded-md bg-white/20 border border-white/40 text-white px-2 py-0.5 text-xs font-black">
              {resident.careLevel}
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      {/* 2. Shifts Columns (Morning, Noon, Night) */}
      <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 朝 (Morning) - Sky Blue */}
        {renderShiftBox(
          '朝',
          'morning',
          'bg-sky-50/90 text-sky-950',
          'border-sky-300',
          'bg-sky-200 text-sky-900 border-sky-400'
        )}
        {/* 昼 (Noon) - Warm Orange */}
        {renderShiftBox(
          '昼',
          'noon',
          'bg-amber-50/90 text-amber-950',
          'border-amber-300',
          'bg-amber-200 text-amber-900 border-amber-400'
        )}
        {/* 夜 (Night) - Elegant Wisteria Purple */}
        {renderShiftBox(
          '夜',
          'night',
          'bg-violet-50/90 text-violet-950',
          'border-violet-300',
          'bg-violet-200 text-violet-900 border-violet-400'
        )}
      </div>

          {/* 3. Yamamoto Doctor Instruction Area */}
          {isYamamotoCollapsed ? (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 mt-auto">
              <button
                onClick={() => setIsYamamotoCollapsed(false)}
                className="w-full bg-blue-50 border-2 border-blue-200 text-blue-800 hover:bg-blue-100 text-xs sm:text-sm font-black py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-3xs"
              >
                <Eye className="h-4 w-4 text-blue-600" />
                <span>山本先生指示欄を表示（{report?.yamamotoInstructions?.text ? '記載あり' : '未記入'}）</span>
              </button>
            </div>
          ) : (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 mt-auto">
              <div className="bg-white border-2 border-blue-600 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2.5 flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-sm font-black text-blue-900">
                    <div className="h-3 w-3 rounded-full bg-blue-600" />
                    <span>山本先生指示欄</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Collapse Toggle Button */}
                    <button
                      onClick={() => setIsYamamotoCollapsed(true)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1 px-2.5 py-1 rounded-md border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="指示欄を非表示にする"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                      <span>非表示</span>
                    </button>

                    {/* Edit Button */}
                    {!isEditingYamamoto && (
                      <button
                        onClick={() => setIsEditingYamamoto(true)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-black flex items-center space-x-1 px-2.5 py-1 rounded-md border border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                        <span>{report?.yamamotoInstructions?.text ? '編集' : '追加'}</span>
                      </button>
                    )}

                    {/* Confirm Toggle Button */}
                    <button
                      onClick={() => onToggleYamamotoConfirm(report ? report.id : null)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                        report?.yamamotoInstructions?.confirmed
                          ? 'bg-emerald-600 text-white border border-emerald-500 shadow-3xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                      }`}
                      title="クリックで確認状態を切り替え"
                    >
                      {report?.yamamotoInstructions?.confirmed ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>確認済</span>
                        </>
                      ) : (
                        <span>未確認</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Body Content / Form */}
                {isEditingYamamoto ? (
                  <div className="space-y-2.5">
                    <textarea
                      value={editedYamamotoText}
                      onChange={(e) => setEditedYamamotoText(e.target.value)}
                      placeholder="山本先生からの指示内容をここに入力してください..."
                      rows={3}
                      className="w-full p-2.5 border-2 border-blue-400 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-700 text-slate-900 leading-relaxed"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleCancelYamamoto}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleSaveYamamoto}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    {report?.yamamotoInstructions?.text ? (
                      <p className="text-sm sm:text-base leading-relaxed text-slate-900 font-bold whitespace-pre-wrap break-words">
                        {report.yamamotoInstructions.text}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-400 font-bold italic py-1">
                        指示はまだ入力されていません。「追加」ボタンから入力できます。
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
    </div>
  );
}
