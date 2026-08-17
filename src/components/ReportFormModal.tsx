import React, { useState, useEffect } from 'react';
import { CareReport, Resident, ShiftRecord } from '../types';
import { X, Save, Clock, Heart, Coffee, FileText, User, Trash2 } from 'lucide-react';

interface ReportFormModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  residents: Resident[];
  reports: CareReport[];
  onSaveReport: (report: CareReport) => void;
  initialResidentId?: string;
  initialDate?: string;
  initialShift?: 'morning' | 'noon' | 'night';
  editReport?: CareReport | null; // if editing an existing full day report
  isInline?: boolean; // new prop!
  onDeleteReport?: (reportId: string) => void;
}

export default function ReportFormModal({
  isOpen = false,
  onClose,
  residents,
  reports,
  onSaveReport,
  initialResidentId,
  initialDate,
  initialShift,
  editReport,
  isInline = false,
  onDeleteReport,
}: ReportFormModalProps) {
  // Primary Keys
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [shift, setShift] = useState<'morning' | 'noon' | 'night'>('morning');

  // Form Fields
  const [reporter, setReporter] = useState<string>('');
  const [otherText, setOtherText] = useState<string>('');

  // Selected categories
  const [poorHealth, setPoorHealth] = useState<string[]>([]);
  const [injuryGait, setInjuryGait] = useState<string[]>([]);
  const [elimination, setElimination] = useState<string[]>([]);

  // Meals
  const [staple, setStaple] = useState<string>('');
  const [side, setSide] = useState<string>('');
  const [lacol, setLacol] = useState<string>('');
  const [water, setWater] = useState<string>('');

  // Vitals
  const [kt, setKt] = useState<string>('');
  const [bpSys, setBpSys] = useState<string>('');
  const [bpDia, setBpDia] = useState<string>('');
  const [pr, setPr] = useState<string>('');

  // Doctor Instructions (optional)
  const [instructionsText, setInstructionsText] = useState<string>('');

  // Feedback message when saved in inline mode
  const [savedMessage, setSavedMessage] = useState<string>('');

  // Searchable select dropdown state
  const [residentSearch, setResidentSearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Synchronize search text when selected resident changes
  useEffect(() => {
    if (selectedResId) {
      const res = residents.find((r) => r.id === selectedResId);
      if (res) {
        setResidentSearch(`${res.roomNumber ? `${res.roomNumber}号室: ` : ''}${res.name}`);
      } else {
        setResidentSearch('');
      }
    } else {
      setResidentSearch('');
    }
  }, [selectedResId, residents]);

  // Keep state synchronized if props change (for reactive clicks in instruction panel)
  useEffect(() => {
    setSelectedResId(initialResidentId || '');
  }, [initialResidentId]);

  useEffect(() => {
    if (initialShift) {
      setShift(initialShift);
    }
  }, [initialShift]);

  // Keep reportsRef updated with the latest reports prop to avoid breaking user typing on Firestore syncs
  const reportsRef = React.useRef(reports);
  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  // Load shift data if switching shift or during initialization
  const loadShiftData = (report: CareReport, targetShift: 'morning' | 'noon' | 'night') => {
    const sData = report[targetShift];
    if (sData) {
      setReporter(sData.reporter || '');
      setPoorHealth(sData.categories?.poorHealth || []);
      setInjuryGait(sData.categories?.injuryGait || []);
      setElimination(sData.categories?.elimination || []);
      setOtherText(sData.otherSymptomText || '');
      setStaple(sData.meals?.staple || '');
      setSide(sData.meals?.side || '');
      setLacol(sData.meals?.lacol || '');
      setWater(sData.meals?.water || '');
      setKt(sData.vitals?.kt || '');
      setBpSys(sData.vitals?.bpSys || '');
      setBpDia(sData.vitals?.bpDia || '');
      setPr(sData.vitals?.pr || '');
    } else {
      // Clear fields for a blank shift in an existing report
      setReporter('');
      setPoorHealth([]);
      setInjuryGait([]);
      setElimination([]);
      setOtherText('');
      setStaple('');
      setSide('');
      setLacol('');
      setWater('');
      setKt('');
      setBpSys('');
      setBpDia('');
      setPr('');
    }
  };

  // Set initial states when opening/inline state is initialized
  useEffect(() => {
    if (isOpen || isInline) {
      if (editReport) {
        // Edit mode
        setSelectedResId(editReport.residentId);
        setDate(editReport.date);
        
        // Find first non-null shift or default
        const activeS = initialShift || (editReport.morning ? 'morning' : editReport.noon ? 'noon' : 'night');
        setShift(activeS);
        setInstructionsText(editReport.yamamotoInstructions?.text || '');
        loadShiftData(editReport, activeS);
      } else {
        // New record mode - Start with blank selection so it doesn't prefill automatically
        setSelectedResId(initialResidentId || '');
        setDate(initialDate || new Date().toISOString().substring(0, 10));
        setShift(initialShift || 'morning');
        setReporter('');
        setOtherText('');
        setPoorHealth([]);
        setInjuryGait([]);
        setElimination([]);
        setStaple('');
        setSide('');
        setLacol('');
        setWater('');
        setKt('');
        setBpSys('');
        setBpDia('');
        setPr('');
        setInstructionsText('');
        setSavedMessage('');
      }
    }
  }, [isOpen, isInline, editReport, initialResidentId, initialDate, initialShift]);

  // When selected user, date, or shift changes manually inside the form, load existing data
  useEffect(() => {
    if (isOpen || isInline) {
      if (selectedResId && date) {
        // Look up existing report for this resident & date
        const existing = reportsRef.current.find((r) => r.residentId === selectedResId && r.date === date);
        if (existing) {
          setInstructionsText(existing.yamamotoInstructions?.text || '');
          loadShiftData(existing, shift);
        } else {
          // clear instructions
          setInstructionsText('');
          // clear shift
          setReporter('');
          setPoorHealth([]);
          setInjuryGait([]);
          setElimination([]);
          setOtherText('');
          setStaple('');
          setSide('');
          setLacol('');
          setWater('');
          setKt('');
          setBpSys('');
          setBpDia('');
          setPr('');
        }
      } else {
        // No resident selected - completely clear all fields
        setInstructionsText('');
        setReporter('');
        setPoorHealth([]);
        setInjuryGait([]);
        setElimination([]);
        setOtherText('');
        setStaple('');
        setSide('');
        setLacol('');
        setWater('');
        setKt('');
        setBpSys('');
        setBpDia('');
        setPr('');
      }
    }
  }, [selectedResId, date, shift, isOpen, isInline]);

  // Toggle checklist category items
  const toggleCategory = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) {
      alert("① 対象利用者（入居者）を一覧から選択してください。");
      return;
    }

    // 1. Check if we already have a report for this resident + date
    const existingIndex = reports.findIndex((r) => r.residentId === selectedResId && r.date === date);
    
    // Create the updated shift record
    const shiftRecord: ShiftRecord = {
      reporter: reporter.trim(),
      categories: {
        poorHealth,
        injuryGait,
        elimination,
      },
      otherSymptomText: otherText.trim(),
      meals: {
        staple: staple.trim(),
        side: side.trim(),
        lacol: lacol.trim(),
        water: water.trim(),
      },
      vitals: {
        kt: kt.trim(),
        bpSys: bpSys.trim(),
        bpDia: bpDia.trim(),
        pr: pr.trim(),
      },
    };

    let updatedReport: CareReport;

    if (existingIndex >= 0) {
      // Clone existing and overwrite shift & instructions
      const existing = reports[existingIndex];
      updatedReport = {
        ...existing,
        [shift]: shiftRecord,
        yamamotoInstructions: {
          text: instructionsText.trim(),
          confirmed: instructionsText.trim() === existing.yamamotoInstructions?.text ? existing.yamamotoInstructions?.confirmed : false, // reset confirm if text edited
        },
      };
    } else {
      // Create completely new report
      updatedReport = {
        id: `${selectedResId}_${date}`,
        residentId: selectedResId,
        date: date,
        morning: shift === 'morning' ? shiftRecord : null,
        noon: shift === 'noon' ? shiftRecord : null,
        night: shift === 'night' ? shiftRecord : null,
        yamamotoInstructions: {
          text: instructionsText.trim(),
          confirmed: false,
        },
        confirmedByDirector: false,
      };
    }

    onSaveReport(updatedReport);
    
    if (isInline) {
      const targetRes = residents.find((r) => r.id === selectedResId);
      const shiftName = shift === 'morning' ? '朝' : shift === 'noon' ? '昼' : '夜';
      setSavedMessage(`🎉 ${targetRes?.roomNumber || ''}号室: ${targetRes?.name || ''} 様 の【${shiftName}の記録】を正常に保存しました！`);
      
      // Auto-clear form state completely
      setSelectedResId('');
      setReporter('');
      setOtherText('');
      setPoorHealth([]);
      setInjuryGait([]);
      setElimination([]);
      setStaple('');
      setSide('');
      setLacol('');
      setWater('');
      setKt('');
      setBpSys('');
      setBpDia('');
      setPr('');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSavedMessage(''), 8000);
    } else {
      onClose?.();
    }
  };

  // Categories metadata
  const poorHealthOptions = ['発熱', '食事がとれない', '嘔吐', '呼吸困難/息苦しい', '浮腫（下肢）（その他）', '腹痛', '頭痛', 'その他'];
  const injuryGaitOptions = ['転倒', '転落', '歩行困難', '体動不可', '褥瘡（発赤）', '褥瘡（剥離）', '擦過傷', '打撲痕', '出血を確認 ※具体的にはその他へ記入のこと'];
  const eliminationOptions = ['尿（-）', '尿（+）', '便（-）', '便（+）', '排便大量', '排尿大量', '便が出ない', '排泄失敗', '赤色の汚染（パット/便器内）を確認する'];

  // Sort residents for the dropdown select: those with Yamamoto instructions for the selected date go to the top
  const sortedDropdownResidents = React.useMemo(() => {
    const withInstructions: Resident[] = [];
    const withoutInstructions: Resident[] = [];

    residents.forEach((r) => {
      const rep = reports.find((rep) => rep.residentId === r.id && rep.date === date);
      const hasInst = rep?.yamamotoInstructions?.text && rep.yamamotoInstructions.text.trim().length > 0;
      if (hasInst) {
        withInstructions.push(r);
      } else {
        withoutInstructions.push(r);
      }
    });

    const sortByRoom = (a: Resident, b: Resident) => {
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    };
    withInstructions.sort(sortByRoom);
    withoutInstructions.sort(sortByRoom);

    return {
      withInstructions,
      withoutInstructions,
    };
  }, [residents, reports, date]);

  // Filter the sorted dropdown residents based on user search query (supporting Kanji, Kana/Hiragana, Room number)
  const filteredDropdownResidents = React.useMemo(() => {
    if (!residentSearch) {
      return sortedDropdownResidents;
    }

    const query = residentSearch.trim().toLowerCase();
    
    // Check if query is an exact match for the current selection
    const selectedRes = residents.find((r) => r.id === selectedResId);
    const selectedText = selectedRes ? `${selectedRes.roomNumber ? `${selectedRes.roomNumber}号室: ` : ''}${selectedRes.name}` : '';
    
    if (selectedRes && query === selectedText.trim().toLowerCase()) {
      return sortedDropdownResidents;
    }

    const filterFn = (r: Resident) => {
      const nameMatch = r.name.toLowerCase().includes(query);
      const roomMatch = r.roomNumber?.toLowerCase().includes(query);
      
      const hiraganaToKatakana = (str: string) => {
        return str.replace(/[\u3041-\u3096]/g, (match) => {
          const chr = match.charCodeAt(0) + 0x60;
          return String.fromCharCode(chr);
        });
      };
      
      const katakanaQuery = hiraganaToKatakana(query);
      const kanaMatch = r.kana?.toLowerCase().includes(query) || r.kana?.toLowerCase().includes(katakanaQuery);

      return nameMatch || roomMatch || kanaMatch;
    };

    return {
      withInstructions: sortedDropdownResidents.withInstructions.filter(filterFn),
      withoutInstructions: sortedDropdownResidents.withoutInstructions.filter(filterFn),
    };
  }, [residentSearch, sortedDropdownResidents, selectedResId, residents]);

  if (!isOpen && !isInline) return null;

  const renderHeader = () => (
    <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-amber-200 animate-pulse" />
        <h2 className="text-lg font-black tracking-tight">
          {isInline ? '介護職員 状況記録入力フォーム' : editReport ? '記録を修正' : '高齢者状況 記録新規入力'}
        </h2>
      </div>
      {!isInline && onClose && (
        <button 
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const mainLayout = (
    <div className={`flex flex-col bg-white overflow-hidden ${
      isInline ? 'w-full rounded-xl border border-slate-200 shadow-sm' : 'h-[90vh] w-full max-w-2xl rounded-xl shadow-2xl'
    }`}>
      {renderHeader()}
      
      {/* Form Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {savedMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-xs font-black text-emerald-800 animate-pulse shadow-md flex items-center space-x-2">
            <span>✨</span>
            <span>{savedMessage}</span>
          </div>
        )}

        {/* Key Selection Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="relative" ref={containerRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1">① 対象利用者（入居者）*</label>
            <div className="relative">
              <input
                type="text"
                disabled={!!editReport}
                placeholder="名前・フリガナ・居室で検索..."
                value={residentSearch}
                onFocus={() => {
                  if (!editReport) setIsDropdownOpen(true);
                }}
                onChange={(e) => {
                  setResidentSearch(e.target.value);
                  setIsDropdownOpen(true);
                  if (e.target.value === '') {
                    setSelectedResId('');
                  } else {
                    const match = residents.find(r => 
                      `${r.roomNumber ? `${r.roomNumber}号室: ` : ''}${r.name}` === e.target.value
                    );
                    if (match) {
                      setSelectedResId(match.id);
                    }
                  }
                }}
                className="w-full rounded-lg border border-slate-300 pl-3 pr-8 py-1.5 text-sm bg-white font-bold text-slate-800 focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <span className="text-[10px]">▼</span>
              </div>
            </div>

            {isDropdownOpen && !editReport && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl py-1 text-sm">
                {/* Yamamoto Instructions group */}
                {filteredDropdownResidents.withInstructions.length > 0 && (
                  <div>
                    <div className="bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800 border-y border-amber-100 flex items-center space-x-1 sticky top-0 z-10">
                      <span>⚠️ 山本先生の報告指示・要請あり（優先入力）</span>
                    </div>
                    {filteredDropdownResidents.withInstructions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedResId(r.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-100 ${
                          selectedResId === r.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-mono bg-amber-100 text-amber-800 px-1 py-0.2 rounded text-[9px] mr-1 font-bold">要報告</span>
                          <span className="font-bold text-slate-800 text-xs">
                            {r.roomNumber ? `${r.roomNumber}号室: ` : ''}{r.name} 様
                          </span>
                        </div>
                        {r.kana && <span className="text-[9px] text-slate-400 font-normal">{r.kana}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Normal resident list */}
                <div>
                  <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 border-y border-slate-200 sticky top-0 z-10">
                    利用者一覧
                  </div>
                  {filteredDropdownResidents.withoutInstructions.length === 0 && filteredDropdownResidents.withInstructions.length === 0 ? (
                    <div className="px-3 py-2 text-center text-xs text-slate-400">
                      一致する利用者は見つかりません
                    </div>
                  ) : (
                    filteredDropdownResidents.withoutInstructions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedResId(r.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-100 ${
                          selectedResId === r.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-slate-800 text-xs">
                          {r.roomNumber ? `${r.roomNumber}号室: ` : ''}{r.name} 様
                        </span>
                        {r.kana && <span className="text-[9px] text-slate-400 font-normal">{r.kana}</span>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">② 記録日付 *</label>
            <input
              type="date"
              required
              disabled={!!editReport}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">③ 記録時間帯 (シフト) *</label>
            <div className="flex bg-slate-200 rounded-lg p-0.5 border border-slate-300">
              <button
                type="button"
                onClick={() => setShift('morning')}
                className={`flex-1 text-center py-1 rounded text-xs font-bold transition-all ${
                  shift === 'morning' ? 'bg-amber-100 text-amber-800 shadow-xs border border-amber-300' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                朝
              </button>
              <button
                type="button"
                onClick={() => setShift('noon')}
                className={`flex-1 text-center py-1 rounded text-xs font-bold transition-all ${
                  shift === 'noon' ? 'bg-orange-100 text-orange-800 shadow-xs border border-orange-300' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                昼
              </button>
              <button
                type="button"
                onClick={() => setShift('night')}
                className={`flex-1 text-center py-1 rounded text-xs font-bold transition-all ${
                  shift === 'night' ? 'bg-sky-100 text-sky-800 shadow-xs border border-sky-300' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                夜
              </button>
            </div>
          </div>
        </div>

        {/* Reporter field */}
        <div>
          <label className="flex items-center space-x-1 text-xs font-bold text-slate-700 mb-1">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span>④ 記録者（スタッフ名）*</span>
          </label>
          <input
            type="text"
            required
            placeholder="例: 吉田、長島、高井"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none font-bold text-slate-800"
          />
        </div>

        {/* Sickness Categories (Checkboxes) */}
        <div className="space-y-3.5 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold text-slate-900 tracking-wide">【状況報告の項目チェック】<span className="text-[10px] text-slate-400 font-normal">該当項目を選択してください。</span></h3>
          
          {/* Category 1: Poor Health */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-xs font-bold text-slate-800">1. 体調不良</span>
            <div className="flex flex-wrap gap-2.5">
              {poorHealthOptions.map((opt) => {
                const isChecked = poorHealth.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleCategory(opt, poorHealth, setPoorHealth)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-red-500 border-red-500 text-white shadow-xs font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category 2: Injury / Gait */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-xs font-bold text-slate-800">2. 怪我・歩行状態</span>
            <div className="flex flex-wrap gap-2.5">
              {injuryGaitOptions.map((opt) => {
                const isChecked = injuryGait.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleCategory(opt, injuryGait, setInjuryGait)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category 3: Elimination */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="block text-xs font-bold text-slate-800">3. 排泄状況</span>
            <div className="flex flex-wrap gap-2.5">
              {eliminationOptions.map((opt) => {
                const isChecked = elimination.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleCategory(opt, elimination, setElimination)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category 4: Other / Problem behavior */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="block text-xs sm:text-sm font-black text-slate-800">4. その他問題行動・フリー記録欄</label>
            <textarea
              placeholder="具体状況を手入力してください（例: 居眠りが多い、ご自身で排便を拭いた、ペーパー少し湿り、陰部びらんしみるなど）"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-emerald-500 focus:outline-none text-slate-800 font-bold leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </div>

        {/* Vitals and Nutrition section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
          
          {/* Vitals inputs */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
              <Heart className="h-4 w-4 text-rose-500" />
              <h3 className="text-xs sm:text-sm font-black text-slate-800">⑤ バイタル測定記録</h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-600 font-bold mb-1">体温 (KT) [℃]</label>
                <input
                  type="text"
                  placeholder="例: 36.8"
                  value={kt}
                  onChange={(e) => setKt(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none font-mono font-black text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">脈拍 (PR) [回/分]</label>
                <input
                  type="number"
                  placeholder="例: 72"
                  value={pr}
                  onChange={(e) => setPr(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none font-mono font-black text-slate-900 text-sm"
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">血圧・高 (BP Sys)</label>
                  <input
                    type="number"
                    placeholder="例: 120"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none font-mono font-black text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">血圧・低 (BP Dia)</label>
                  <input
                    type="number"
                    placeholder="例: 74"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none font-mono font-black text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meals inputs */}
          <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-1.5 border-b pb-1">
              <Coffee className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-800">⑥ 食事＆水分量</h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">主食量 [割]</label>
                <input
                  type="text"
                  placeholder="例: 10, 8, 3"
                  value={staple}
                  onChange={(e) => setStaple(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">副食量 [割]</label>
                <input
                  type="text"
                  placeholder="例: 10, 8, 3"
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">ラコール等</label>
                <select
                  value={lacol}
                  onChange={(e) => setLacol(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white focus:border-emerald-500 focus:outline-none font-bold text-slate-800"
                >
                  <option value="">なし</option>
                  <option value="1P">1P</option>
                  <option value="1/2P">1/2P</option>
                  <option value="2P">2P</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">水分量 [ml]</label>
                <input
                  type="text"
                  placeholder="例: 150, 300"
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Yamamoto-sensei instructions */}
        {!isInline && (
          <div className="border-t border-slate-100 pt-4 space-y-1.5">
            <div className="flex items-center space-x-1 text-xs font-bold text-slate-900">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>⑦ 山本先生指示欄の記載・変更</span>
            </div>
            <textarea
              placeholder="先生の特別指示があればここに入力してください。この内容は本日のこの利用者の下に、確認ボタン付き of 濃いブルーの特別指示ボードとして表示されます。"
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none text-slate-800 font-medium"
            />
          </div>
        )}

      </form>

      {/* Form Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3.5 shrink-0">
        <div className="flex items-center space-x-2">
          {isInline ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('入力内容をクリアして初期状態に戻しますか？')) {
                  setSelectedResId('');
                  setReporter('');
                  setOtherText('');
                  setPoorHealth([]);
                  setInjuryGait([]);
                  setElimination([]);
                  setStaple('');
                  setSide('');
                  setLacol('');
                  setWater('');
                  setKt('');
                  setBpSys('');
                  setBpDia('');
                  setPr('');
                  setSavedMessage('');
                }
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              入力をクリア
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              キャンセル
            </button>
          )}

          {/* Delete Button */}
          {onDeleteReport && selectedResId && date && reports.some(r => r.residentId === selectedResId && r.date === date) && (
            <button
              type="button"
              onClick={() => {
                const existing = reports.find(r => r.residentId === selectedResId && r.date === date);
                if (existing) {
                  onDeleteReport(existing.id);
                  if (!isInline && onClose) {
                    onClose();
                  } else {
                    setSelectedResId('');
                    setReporter('');
                    setOtherText('');
                    setPoorHealth([]);
                    setInjuryGait([]);
                    setElimination([]);
                    setStaple('');
                    setSide('');
                    setLacol('');
                    setWater('');
                    setKt('');
                    setBpSys('');
                    setBpDia('');
                    setPr('');
                    setSavedMessage('記録を完全に削除しました。');
                  }
                }
              }}
              className="flex items-center space-x-1 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 px-3.5 py-2 text-xs font-black transition-colors cursor-pointer"
              title="この利用者のこの日のすべての記録を完全に削除します"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>この日の全記録を削除</span>
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-md transition-colors cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>この内容で記録保存</span>
        </button>
      </div>

    </div>
  );

  if (isInline) {
    return (
      <div id="inline-report-form" className="w-full">
        {mainLayout}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      {mainLayout}
    </div>
  );
}

