import React, { useState, useEffect } from 'react';
import { CareReport, Resident, ShiftRecord, ShiftType, hasShiftData, getShiftYamamotoInstruction } from '../types';
import { Check, Edit3, Eye, EyeOff, Trash2 } from 'lucide-react';

interface ReportCardProps {
  key?: string;
  resident: Resident;
  report: CareReport | null;
  onEditShift: (shift: ShiftType) => void;
  onToggleYamamotoConfirm: (reportId: string | null, shiftKey: ShiftType | 'all') => void;
  onSaveYamamotoInstructions: (text: string, shiftKey: ShiftType | 'all', reportId: string | null) => void;
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
  onDeleteReport,
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

  // Shift-specific Yamamoto instruction editing states
  const [editingShifts, setEditingShifts] = useState<{
    morning: boolean;
    noon: boolean;
    night: boolean;
  }>({
    morning: false,
    noon: false,
    night: false,
  });

  const [shiftTexts, setShiftTexts] = useState<{
    morning: string;
    noon: string;
    night: string;
  }>({
    morning: '',
    noon: '',
    night: '',
  });

  // Sync shift texts when report updates if not actively editing
  useEffect(() => {
    setShiftTexts((prev) => ({
      morning: editingShifts.morning ? prev.morning : getShiftYamamotoInstruction(report, 'morning').text,
      noon: editingShifts.noon ? prev.noon : getShiftYamamotoInstruction(report, 'noon').text,
      night: editingShifts.night ? prev.night : getShiftYamamotoInstruction(report, 'night').text,
    }));
  }, [
    report?.yamamotoInstructions?.morning?.text,
    report?.yamamotoInstructions?.noon?.text,
    report?.yamamotoInstructions?.night?.text,
    editingShifts.morning,
    editingShifts.noon,
    editingShifts.night,
  ]);

  // Overall / legacy Yamamoto section collapse & edit states
  const hasOverallText = !!(report?.yamamotoInstructions?.text && report.yamamotoInstructions.text.trim().length > 0);
  const [isOverallCollapsed, setIsOverallCollapsed] = useState(false);
  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [editedOverallText, setEditedOverallText] = useState(report?.yamamotoInstructions?.text || '');

  useEffect(() => {
    if (!isEditingOverall) {
      setEditedOverallText(report?.yamamotoInstructions?.text || '');
    }
  }, [report?.yamamotoInstructions?.text, isEditingOverall]);

  const toggleShiftCollapse = (shiftKey: ShiftType) => {
    setCollapsedShifts((prev) => ({
      ...prev,
      [shiftKey]: !prev[shiftKey],
    }));
  };

  const handleStartEditingShift = (shiftKey: ShiftType) => {
    const current = getShiftYamamotoInstruction(report, shiftKey).text;
    setShiftTexts((prev) => ({ ...prev, [shiftKey]: current }));
    setEditingShifts((prev) => ({ ...prev, [shiftKey]: true }));
  };

  const handleCancelEditingShift = (shiftKey: ShiftType) => {
    const current = getShiftYamamotoInstruction(report, shiftKey).text;
    setShiftTexts((prev) => ({ ...prev, [shiftKey]: current }));
    setEditingShifts((prev) => ({ ...prev, [shiftKey]: false }));
  };

  const handleSaveShiftInstruction = (shiftKey: ShiftType) => {
    const textToSave = shiftTexts[shiftKey] || '';
    onSaveYamamotoInstructions(textToSave, shiftKey, report ? report.id : null);
    setEditingShifts((prev) => ({ ...prev, [shiftKey]: false }));
  };

  const handleSaveOverall = () => {
    onSaveYamamotoInstructions(editedOverallText, 'all', report ? report.id : null);
    setIsEditingOverall(false);
  };

  const handleCancelOverall = () => {
    setEditedOverallText(report?.yamamotoInstructions?.text || '');
    setIsEditingOverall(false);
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
        badges.push({ text: `体調不良: ${c}`, color: 'bg-orange-500 text-white border-orange-600 font-extrabold' });
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
              shiftData.reporter?.trim() ? (
                <span className="inline-flex items-center text-xs text-slate-700 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md font-bold" title="記録者">
                  担当: {shiftData.reporter}
                </span>
              ) : null
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
              className="mt-2 text-xs text-blue-700 hover:text-blue-900 bg-white border border-blue-300 px-3 py-1 rounded-md font-black shadow-3xs hover:bg-blue-50 transition-colors cursor-pointer"
            >
              + {title}の記録を追加
            </button>
          </div>
        )}

        {/* Yamamoto Doctor Instruction Box for this Shift (朝・昼・夜 各時間帯別) */}
        {!isHidden && (
          <div className="mt-3 pt-2.5 border-t border-slate-300/80">
            {(() => {
              const shiftInst = getShiftYamamotoInstruction(report, shiftKey);
              const isEditingThisShift = editingShifts[shiftKey];

              return (
                <div className={`rounded-xl border-2 transition-all p-2.5 sm:p-3 space-y-2 ${
                  shiftInst.text ? 'bg-blue-50/90 border-blue-400 shadow-3xs' : 'bg-white/85 border-blue-200/90'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-black text-blue-900">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span>山本先生指示（{title}）</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* 追加 / 修正 Button */}
                      {!isEditingThisShift && (
                        <button
                          type="button"
                          onClick={() => handleStartEditingShift(shiftKey)}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-black flex items-center space-x-1 px-2 py-0.5 rounded-md border border-blue-300 bg-white hover:bg-blue-50 transition-colors cursor-pointer shadow-3xs"
                        >
                          <Edit3 className="h-3 w-3 text-blue-600" />
                          <span>{shiftInst.text ? '修正' : '指示入力'}</span>
                        </button>
                      )}

                      {/* 未確認 / 確認済 Button */}
                      <button
                        type="button"
                        onClick={() => onToggleYamamotoConfirm(report ? report.id : null, shiftKey)}
                        className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all cursor-pointer shadow-3xs ${
                          shiftInst.confirmed
                            ? 'bg-emerald-600 text-white border border-emerald-500 shadow-xs'
                            : 'bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-xs'
                        }`}
                        title={`クリックで${title}の指示の確認状態を切り替え`}
                      >
                        {shiftInst.confirmed ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>確認済</span>
                          </>
                        ) : (
                          <span>未確認</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content / Editor */}
                  {isEditingThisShift ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={shiftTexts[shiftKey] || ''}
                        onChange={(e) => setShiftTexts((prev) => ({ ...prev, [shiftKey]: e.target.value }))}
                        placeholder={`山本先生からの${title}の指示内容をここに入力...`}
                        rows={3}
                        className="w-full p-2 border-2 border-blue-400 rounded-lg text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-700 text-slate-900 leading-relaxed bg-white shadow-inner"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleCancelEditingShift(shiftKey)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveShiftInstruction(shiftKey)}
                          className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {shiftInst.text ? (
                        <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-blue-200 shadow-3xs">
                          <p className="text-xs sm:text-sm leading-relaxed text-slate-900 font-bold whitespace-pre-wrap break-words">
                            {shiftInst.text}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white/60 p-2 rounded-lg border border-dashed border-blue-200/90 text-center">
                          <p className="text-[11px] text-slate-400 font-bold italic">
                            {title}の指示は未記入です（「指示入力」から登録）
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
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

        {/* Delete report button */}
        {report && onDeleteReport && (
          <button
            type="button"
            onClick={() => onDeleteReport(report.id)}
            className="flex items-center space-x-1 bg-white/15 hover:bg-rose-600 text-white border border-white/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
            title="この日のすべての記録を完全に削除"
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
            <span className="hidden sm:inline">全記録削除</span>
          </button>
        )}
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

      {/* 3. Overall / General Yamamoto Doctor Instruction Area (Shown when general/legacy instruction exists) */}
      {hasOverallText && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 mt-auto">
          {isOverallCollapsed ? (
            <button
              type="button"
              onClick={() => setIsOverallCollapsed(false)}
              className="w-full bg-amber-50 border-2 border-amber-200 text-amber-900 hover:bg-amber-100 text-xs sm:text-sm font-black py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-3xs"
            >
              <Eye className="h-4 w-4 text-amber-700" />
              <span>全日・共通指示を表示（記載あり）</span>
            </button>
          ) : (
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2.5 flex flex-col">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2 flex-wrap gap-2">
                <div className="flex items-center space-x-2 text-xs sm:text-sm font-black text-amber-950">
                  <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-xs font-black">全日共通</span>
                  <span>山本先生 共通指示</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsOverallCollapsed(true)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-3xs"
                    title="共通指示欄を非表示にする"
                  >
                    <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                    <span>非表示</span>
                  </button>

                  {!isEditingOverall && (
                    <button
                      type="button"
                      onClick={() => setIsEditingOverall(true)}
                      className="text-xs text-amber-900 hover:text-amber-950 font-black flex items-center space-x-1 px-2.5 py-1 rounded-md border border-amber-400 bg-white hover:bg-amber-50 transition-colors cursor-pointer shadow-3xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                      <span>編集</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleYamamotoConfirm(report ? report.id : null, 'all')}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-3xs ${
                      report?.yamamotoInstructions?.confirmed
                        ? 'bg-emerald-600 text-white border border-emerald-500'
                        : 'bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-xs'
                    }`}
                    title="クリックで全日共通指示の確認状態を切り替え"
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
              {isEditingOverall ? (
                <div className="space-y-2">
                  <textarea
                    value={editedOverallText}
                    onChange={(e) => setEditedOverallText(e.target.value)}
                    placeholder="山本先生からの全日共通の指示内容を入力..."
                    rows={2}
                    className="w-full p-2.5 border-2 border-amber-400 rounded-lg text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-700 text-slate-900 leading-relaxed bg-white"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelOverall}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOverall}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-3xs">
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-900 font-bold whitespace-pre-wrap break-words">
                    {report?.yamamotoInstructions?.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
