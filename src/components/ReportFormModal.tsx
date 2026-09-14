import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CareReport, Resident, ShiftRecord, hasShiftData } from '../types';
import { X, Save, Clock, Heart, Coffee, FileText, User, Trash2, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

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

const getTodayDateString = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
  const [date, setDate] = useState<string>(() => initialDate || getTodayDateString());
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
  const [validationError, setValidationError] = useState<string>('');

  // Selected resident helper object
  const selectedResidentObj = useMemo(() => {
    return residents.find((r) => r.id === selectedResId) || null;
  }, [residents, selectedResId]);

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
    if (sData && hasShiftData(sData)) {
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

  // Clear current shift data and set to not-input (未入力) state
  const handleClearCurrentShift = () => {
    const recordDate = date || initialDate || getTodayDateString();
    const existing = reports.find((r) => r.residentId === selectedResId && r.date === recordDate);
    const shiftName = shift === 'morning' ? '朝' : shift === 'noon' ? '昼' : '夜';

    // Clear form inputs
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
    setValidationError('');

    if (existing) {
      const newMorning = shift === 'morning' ? null : (hasShiftData(existing.morning) ? existing.morning : null);
      const newNoon = shift === 'noon' ? null : (hasShiftData(existing.noon) ? existing.noon : null);
      const newNight = shift === 'night' ? null : (hasShiftData(existing.night) ? existing.night : null);
      const instText = existing.yamamotoInstructions?.text;

      const hasRemaining = 
        hasShiftData(newMorning) ||
        hasShiftData(newNoon) ||
        hasShiftData(newNight) ||
        !!(instText && instText.trim().length > 0);

      if (!hasRemaining && onDeleteReport) {
        onDeleteReport(existing.id);
      } else {
        const updated: CareReport = {
          ...existing,
          morning: newMorning,
          noon: newNoon,
          night: newNight,
        };
        onSaveReport(updated);
      }

      if (isInline) {
        setSavedMessage(`【${shiftName}の記録】をクリアし、「未入力」状態に戻しました。`);
      } else if (onClose) {
        onClose();
      }
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
        setDate(initialDate || getTodayDateString());
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
  // Check recorded shifts for selected resident and date
  const currentResidentReport = useMemo(() => {
    const recordDate = date || initialDate || getTodayDateString();
    return reports.find((r) => r.residentId === selectedResId && r.date === recordDate);
  }, [reports, selectedResId, date, initialDate]);

  const morningRecorded = hasShiftData(currentResidentReport?.morning);
  const noonRecorded = hasShiftData(currentResidentReport?.noon);
  const nightRecorded = hasShiftData(currentResidentReport?.night);
  const currentShiftHasData = hasShiftData(currentResidentReport?.[shift]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) {
      setValidationError('① 対象の利用者（入居者）様を一覧から選択してください。');
      const elem = document.getElementById('resident-select-control');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elem.focus();
      }
      return;
    }
    setValidationError('');

    const recordDate = date || initialDate || getTodayDateString();

    // 1. Check if we already have a report for this resident + date
    const existingIndex = reports.findIndex((r) => r.residentId === selectedResId && r.date === recordDate);
    
    // Check if the current shift input has any actual recorded data
    const rawShiftRecord: ShiftRecord = {
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

    const isShiftRecorded = hasShiftData(rawShiftRecord);
    const shiftRecord: ShiftRecord | null = isShiftRecorded ? rawShiftRecord : null;

    let updatedReport: CareReport;

    if (existingIndex >= 0) {
      // Clone existing and overwrite shift & instructions
      const existing = reports[existingIndex];
      const inst = isInline
        ? (existing.yamamotoInstructions || { text: '', confirmed: false })
        : {
            text: instructionsText.trim(),
            confirmed: instructionsText.trim() === (existing.yamamotoInstructions?.text || '')
              ? (existing.yamamotoInstructions?.confirmed ?? false)
              : false, // reset confirm if text edited
          };

      const newMorning = shift === 'morning' ? shiftRecord : (hasShiftData(existing.morning) ? existing.morning : null);
      const newNoon = shift === 'noon' ? shiftRecord : (hasShiftData(existing.noon) ? existing.noon : null);
      const newNight = shift === 'night' ? shiftRecord : (hasShiftData(existing.night) ? existing.night : null);

      const hasRemaining = 
        hasShiftData(newMorning) ||
        hasShiftData(newNoon) ||
        hasShiftData(newNight) ||
        !!(inst.text && inst.text.trim().length > 0);

      if (!hasRemaining && onDeleteReport) {
        onDeleteReport(existing.id);
        if (isInline) {
          setSavedMessage(`入力内容がクリアされたため、記録を「未入力」状態に戻しました。`);
          setSelectedResId('');
          setResidentSearch('');
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
        } else if (onClose) {
          onClose();
        }
        return;
      }

      updatedReport = {
        ...existing,
        date: recordDate,
        morning: newMorning,
        noon: newNoon,
        night: newNight,
        yamamotoInstructions: inst,
      };
    } else {
      if (!isShiftRecorded && !instructionsText.trim()) {
        setValidationError('内容が入力されていません。体温・血圧・食事・状況チェック・特記等のいずれかを入力してください。（内容がない場合は未入力となります）');
        return;
      }

      // Create completely new report
      updatedReport = {
        id: `${selectedResId}_${recordDate}`,
        residentId: selectedResId,
        date: recordDate,
        morning: shift === 'morning' ? shiftRecord : null,
        noon: shift === 'noon' ? shiftRecord : null,
        night: shift === 'night' ? shiftRecord : null,
        yamamotoInstructions: {
          text: isInline ? '' : instructionsText.trim(),
          confirmed: false,
        },
        confirmedByDirector: false,
      };
    }

    onSaveReport(updatedReport);
    
    if (isInline) {
      const targetRes = residents.find((r) => r.id === selectedResId);
      const shiftName = shift === 'morning' ? '朝' : shift === 'noon' ? '昼' : '夜';
      const formattedDate = recordDate.replace(/-/g, '/');
      setSavedMessage(`🎉 ${targetRes?.roomNumber ? `${targetRes.roomNumber}号室: ` : ''}${targetRes?.name || ''} 様 の【${formattedDate} ${shiftName}の記録】を正常に保存・登録しました！ 下の「本日の登録済み記録一覧」および「確認・指示（山本先生）」タブにも即座に反映されています。`);
      
      // Auto-clear form state completely for next input
      setSelectedResId('');
      setResidentSearch('');
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
      setTimeout(() => setSavedMessage(''), 9000);
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
        
        {/* Success Alert Banner */}
        {savedMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-xs sm:text-sm font-black text-emerald-900 shadow-md flex items-center space-x-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{savedMessage}</span>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-3.5 text-xs sm:text-sm font-black text-rose-900 flex items-center space-x-2.5 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Key Selection Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {/* ① 対象利用者（入居者）予測変換・オートコンプリート検索選択 */}
          <div className="relative" ref={containerRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                ① 対象利用者（入居者）<span className="text-rose-500">*</span>
              </label>
              {selectedResId && !editReport && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResId('');
                    setResidentSearch('');
                    setValidationError('');
                    setIsDropdownOpen(true);
                  }}
                  className="text-[10px] text-slate-500 hover:text-rose-600 font-bold underline cursor-pointer"
                >
                  選び直す
                </button>
              )}
            </div>

            {/* Predictive Autocomplete Search Input */}
            <div className="relative">
              <input
                id="resident-search-input"
                type="text"
                disabled={!!editReport}
                placeholder="名前（例: 中島）や居室番号で検索..."
                value={residentSearch}
                onChange={(e) => {
                  setResidentSearch(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedResId) {
                    setSelectedResId('');
                  }
                }}
                onFocus={() => {
                  if (!editReport) setIsDropdownOpen(true);
                }}
                className={`w-full rounded-lg border-2 px-3 py-2 text-xs sm:text-sm font-bold bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  !selectedResId
                    ? 'border-amber-400 bg-amber-50/40 text-slate-900 placeholder:text-amber-700/60 font-bold'
                    : 'border-emerald-500 bg-emerald-50/20 text-slate-900'
                } disabled:bg-slate-100 disabled:text-slate-500`}
                autoComplete="off"
              />

              {residentSearch && !editReport && (
                <button
                  type="button"
                  onClick={() => {
                    setResidentSearch('');
                    setSelectedResId('');
                    setIsDropdownOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer"
                  title="クリア"
                >
                  ×
                </button>
              )}
            </div>

            {/* Predictive Floating Dropdown List */}
            {isDropdownOpen && !editReport && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                {filteredDropdownResidents.withInstructions.length === 0 &&
                filteredDropdownResidents.withoutInstructions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    該当する利用者様が見つかりません（「{residentSearch}」）
                  </div>
                ) : (
                  <>
                    {/* Priority: Instructions from Yamamoto Doctor */}
                    {filteredDropdownResidents.withInstructions.length > 0 && (
                      <div className="bg-amber-50/60">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/70 sticky top-0 flex items-center gap-1 border-b border-amber-200">
                          <span>⚠️</span>
                          <span>山本先生の報告指示・要請あり（優先）</span>
                        </div>
                        {filteredDropdownResidents.withInstructions.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedResId(r.id);
                              setResidentSearch(
                                `${r.roomNumber ? `${r.roomNumber}号室: ` : ''}${r.name}`
                              );
                              setIsDropdownOpen(false);
                              setValidationError('');
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-amber-100 transition-colors flex items-center justify-between text-xs sm:text-sm ${
                              selectedResId === r.id ? 'bg-emerald-50 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="bg-amber-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                                {r.roomNumber ? `${r.roomNumber}号室` : '居室'}
                              </span>
                              <span className="font-bold text-slate-900">
                                {r.name} 様
                              </span>
                              {r.kana && (
                                <span className="text-[11px] text-slate-400">
                                  ({r.kana})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                              要報告
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Standard Residents List */}
                    {filteredDropdownResidents.withoutInstructions.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 sticky top-0 flex items-center justify-between border-b border-slate-200">
                          <span>
                            {residentSearch
                              ? `検索結果 (${filteredDropdownResidents.withoutInstructions.length}名)`
                              : `登録利用者一覧 (${filteredDropdownResidents.withoutInstructions.length}名)`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            クリックして選択
                          </span>
                        </div>
                        {filteredDropdownResidents.withoutInstructions.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedResId(r.id);
                              setResidentSearch(
                                `${r.roomNumber ? `${r.roomNumber}号室: ` : ''}${r.name}`
                              );
                              setIsDropdownOpen(false);
                              setValidationError('');
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-emerald-50 hover:text-emerald-950 transition-colors flex items-center justify-between text-xs sm:text-sm ${
                              selectedResId === r.id ? 'bg-emerald-100/70 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="bg-slate-700 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                                {r.roomNumber ? `${r.roomNumber}号室` : '居室'}
                              </span>
                              <span className="font-bold text-slate-900">
                                {r.name} 様
                              </span>
                              {r.kana && (
                                <span className="text-[11px] text-slate-400">
                                  ({r.kana})
                                </span>
                              )}
                            </div>
                            {r.careLevel && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {r.careLevel}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Selection Status Badge Card */}
            {selectedResidentObj && (
              <div className="mt-2 bg-emerald-50 border border-emerald-300 rounded-lg p-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="bg-emerald-700 text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded">
                    {selectedResidentObj.roomNumber ? `${selectedResidentObj.roomNumber}号室` : '居室'}
                  </span>
                  <span className="font-black text-emerald-950">
                    {selectedResidentObj.name} 様
                  </span>
                  {selectedResidentObj.careLevel && (
                    <span className="bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold px-1 rounded">
                      {selectedResidentObj.careLevel}
                    </span>
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
                className={`flex-1 text-center py-1 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                  shift === 'morning' ? 'bg-amber-100 text-amber-800 shadow-xs border border-amber-300' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>朝</span>
                {morningRecorded ? (
                  <span className="text-[10px] bg-amber-200/90 text-amber-900 px-1 rounded font-black">済</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">未</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShift('noon')}
                className={`flex-1 text-center py-1 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                  shift === 'noon' ? 'bg-orange-100 text-orange-800 shadow-xs border border-orange-300' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>昼</span>
                {noonRecorded ? (
                  <span className="text-[10px] bg-orange-200/90 text-orange-900 px-1 rounded font-black">済</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">未</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShift('night')}
                className={`flex-1 text-center py-1 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                  shift === 'night' ? 'bg-sky-100 text-sky-800 shadow-xs border border-sky-300' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>夜</span>
                {nightRecorded ? (
                  <span className="text-[10px] bg-sky-200/90 text-sky-900 px-1 rounded font-black">済</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">未</span>
                )}
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
                <label className="block text-slate-600 font-bold mb-1">ラコール等栄養剤</label>
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
                setSelectedResId('');
                setResidentSearch('');
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
                setValidationError('');
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

          {/* Shift Clear/Reset Button */}
          {selectedResId && currentShiftHasData && (
            <button
              type="button"
              onClick={handleClearCurrentShift}
              className="flex items-center space-x-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shadow-3xs"
              title={`この利用者の【${shift === 'morning' ? '朝' : shift === 'noon' ? '昼' : '夜'}】の記録のみを未入力に戻します`}
            >
              <Trash2 className="h-3.5 w-3.5 text-amber-600" />
              <span>{shift === 'morning' ? '朝' : shift === 'noon' ? '昼' : '夜'}の記録を未入力に戻す</span>
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

