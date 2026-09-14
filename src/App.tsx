import { useState, useEffect, useMemo, useRef } from 'react';
import { Resident, CareReport } from './types';
import { initialResidents } from './data/initialResidents';
import { initialReports } from './data/mockReports';
import ReportCard from './components/ReportCard';
import ReportFormModal from './components/ReportFormModal';
import TrendChartsModal from './components/TrendChartsModal';
import MasterListModal from './components/MasterListModal';
import { 
  Calendar, 
  Search, 
  CheckSquare, 
  Plus, 
  TrendingUp, 
  Settings, 
  SlidersHorizontal, 
  AlertCircle,
  Clock,
  CheckCircle2,
  ListFilter,
  Eye,
  EyeOff,
  Sparkles,
  List,
  LayoutGrid,
  Trash2,
  Edit3
} from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

const getTodayDateString = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function App() {
  // --- 1. LOCAL STORAGE & FIRESTORE STATE INITIALIZATION ---
  const [residents, setResidents] = useState<Resident[]>(() => {
    try {
      const saved = localStorage.getItem('care_residents_list');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse residents from localStorage:", e);
    }
    return initialResidents;
  });

  const [reports, setReports] = useState<CareReport[]>(() => {
    try {
      const saved = localStorage.getItem('care_reports_list');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse reports from localStorage:", e);
    }
    return initialReports;
  });

  // Real-time synchronization with Firestore
  useEffect(() => {
    // One-time initialization if database is completely empty
    const initializeDb = async () => {
      try {
        const resSnapshot = await getDocs(collection(db, 'residents'));
        const alreadySeeded = localStorage.getItem('care_residents_seeded_v2') === 'true';

        if (!resSnapshot.empty) {
          localStorage.setItem('care_residents_seeded_v2', 'true');
          return;
        }

        if (resSnapshot.empty && !alreadySeeded) {
          console.log("Firestore residents collection is empty. Checking local storage...");
          const savedResidents = localStorage.getItem('care_residents_list');
          if (savedResidents) {
            try {
              const parsed = JSON.parse(savedResidents) as Resident[];
              if (parsed.length > 0) {
                console.log("Seeding Firestore with corrected local residents list...");
                for (const res of parsed) {
                  await setDoc(doc(db, 'residents', res.id), res);
                }
                localStorage.setItem('care_residents_seeded_v2', 'true');
                return;
              }
            } catch (e) {
              console.error("Error parsing saved residents for seeding:", e);
            }
          }
          // If no local storage corrections, seed the original list
          console.log("No local residents found. Seeding default initial residents...");
          for (const res of initialResidents) {
            await setDoc(doc(db, 'residents', res.id), res);
          }
          localStorage.setItem('care_residents_seeded_v2', 'true');
        }
      } catch (err) {
        console.error("Error checking/seeding residents in Firestore:", err);
      }
    };

    const initializeReportsDb = async () => {
      try {
        const repSnapshot = await getDocs(collection(db, 'reports'));
        const alreadySeeded = localStorage.getItem('care_reports_seeded_v2') === 'true';

        if (!repSnapshot.empty) {
          localStorage.setItem('care_reports_seeded_v2', 'true');
          return;
        }

        if (repSnapshot.empty && !alreadySeeded) {
          console.log("Firestore reports collection is empty. Checking local storage...");
          const savedReports = localStorage.getItem('care_reports_list');
          if (savedReports) {
            try {
              const parsed = JSON.parse(savedReports) as CareReport[];
              if (parsed.length > 0) {
                console.log("Seeding Firestore with corrected local reports list...");
                for (const rep of parsed) {
                  await setDoc(doc(db, 'reports', rep.id), rep);
                }
                localStorage.setItem('care_reports_seeded_v2', 'true');
                return;
              }
            } catch (e) {
              console.error("Error parsing saved reports for seeding:", e);
            }
          }
          // If no local storage corrections, seed the original reports
          console.log("No local reports found. Seeding default initial reports...");
          for (const rep of initialReports) {
            await setDoc(doc(db, 'reports', rep.id), rep);
          }
          localStorage.setItem('care_reports_seeded_v2', 'true');
        }
      } catch (err) {
        console.error("Error checking/seeding reports in Firestore:", err);
      }
    };

    initializeDb();
    initializeReportsDb();
  }, []);

  // Real-time subscriptions (strictly listening and updating React state)
  useEffect(() => {
    // 1. Subscribe to residents
    const unsubscribeResidents = onSnapshot(collection(db, 'residents'), (snapshot) => {
      const list: Resident[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Resident);
      });
      setResidents(list);
    }, (error) => {
      console.error("Residents collection subscribe error:", error);
    });

    // 2. Subscribe to reports
    const unsubscribeReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const list: CareReport[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as CareReport);
      });
      setReports(list);
    }, (error) => {
      console.error("Reports collection subscribe error:", error);
    });

    return () => {
      unsubscribeResidents();
      unsubscribeReports();
    };
  }, []);

  // Sync to localStorage as local cache fallback - ONLY if not empty to prevent race condition wipes!
  useEffect(() => {
    if (residents && residents.length > 0) {
      localStorage.setItem('care_residents_list', JSON.stringify(residents));
    }
  }, [residents]);

  useEffect(() => {
    if (reports && reports.length > 0) {
      localStorage.setItem('care_reports_list', JSON.stringify(reports));
    }
  }, [reports]);

  // --- 2. DISPLAY FILTER STATES ---
  // Default to today's date so the app always opens to the current date and time
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Compute Japanese day of week for the currently selected date
  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      if (!isNaN(dateObj.getTime())) {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[dateObj.getDay()];
      }
    }
    return '';
  }, [selectedDate]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchRangeDays, setSearchRangeDays] = useState<number>(5);
  const [appMode, setAppMode] = useState<'view_instruct' | 'helper'>('view_instruct');
  const [viewSubTab, setViewSubTab] = useState<'cards' | 'names_list'>('cards');
  const [highlightedResId, setHighlightedResId] = useState<string | null>(null);
  
  // --- 3. MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  
  // States for form modal initialization
  const [activeResId, setActiveResId] = useState<string>('');
  const [activeShift, setActiveShift] = useState<'morning' | 'noon' | 'night'>('morning');
  const [formDate, setFormDate] = useState<string>('');
  const [editingReport, setEditingReport] = useState<CareReport | null>(null);

  // States for helper inline form initialization
  const [helperFormResId, setHelperFormResId] = useState<string>('');
  const [helperFormShift, setHelperFormShift] = useState<'morning' | 'noon' | 'night'>('morning');

  const handleSelectInlineTarget = (resId: string, shift: 'morning' | 'noon' | 'night') => {
    setHelperFormResId(resId);
    setHelperFormShift(shift);
    const element = document.getElementById('inline-report-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleJumpToResidentCard = (resId: string) => {
    setViewSubTab('cards');
    setHighlightedResId(resId);
    setTimeout(() => {
      const element = document.getElementById(`resident-card-${resId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
    setTimeout(() => {
      setHighlightedResId(null);
    }, 3000);
  };

  // --- 4. DYNAMIC COMPUTATIONS ---
  // Helper to extract index from imported resident ID formats (e.g. res-imported-timestamp-index)
  const getIndexFromId = (id: string): string | null => {
    const match = id.match(/res-imported-(?:\d+-)?(\d+)/);
    return match ? match[1] : null;
  };

  // Get current reports map for the selected date for O(1) card lookups
  const reportsByResIdMap = useMemo(() => {
    const map: Record<string, CareReport> = {};
    reports.forEach((rep) => {
      if (rep.date === selectedDate) {
        // Direct ID mapping
        map[rep.residentId] = rep;
        
        // Index-based mapping for imported rosters
        const repIndex = getIndexFromId(rep.residentId);
        if (repIndex !== null) {
          map[`idx_${repIndex}`] = rep;
        }

        // Name + Room based mapping
        const associated = residents.find(r => r.id === rep.residentId);
        if (associated) {
          map[`${associated.roomNumber}_${associated.name}`] = rep;
        }
      }
    });
    return map;
  }, [reports, selectedDate, residents]);

  // Helper to look up report for a resident (handling ID shifts seamlessly)
  const getReportForRes = (res: Resident) => {
    // 1. Try raw ID match first
    if (reportsByResIdMap[res.id]) {
      return reportsByResIdMap[res.id];
    }
    
    // 2. Try matching by index for imported lists
    const currentIndex = getIndexFromId(res.id);
    if (currentIndex !== null && reportsByResIdMap[`idx_${currentIndex}`]) {
      return reportsByResIdMap[`idx_${currentIndex}`];
    }
    
    // 3. Try matching manual additions by Name + Room
    const key = `${res.roomNumber}_${res.name}`;
    if (reportsByResIdMap[key]) {
      return reportsByResIdMap[key];
    }
    
    return null;
  };

  // Helper for multi-day date lookups in search history mode
  const getReportForResidentAndDate = (res: Resident, dateStr: string) => {
    // 1. Match by ID
    let rep = reports.find((r) => r.residentId === res.id && r.date === dateStr);
    if (rep) return rep;
    
    // 2. Match by index for imported IDs
    const currentIndex = getIndexFromId(res.id);
    if (currentIndex !== null) {
      rep = reports.find((r) => {
        if (r.date !== dateStr) return false;
        const repIndex = getIndexFromId(r.residentId);
        return repIndex === currentIndex;
      });
      if (rep) return rep;
    }
    
    // 3. Match by Room & Name
    rep = reports.find((r) => {
      if (r.date !== dateStr) return false;
      const associated = residents.find(x => x.id === r.residentId);
      if (associated) {
        return associated.name === res.name && associated.roomNumber === res.roomNumber;
      }
      return false;
    });
    return rep || null;
  };

  // Residents with active Yamamoto instructions
  const residentsWithInstructions = useMemo(() => {
    return residents
      .map((res) => {
        const report = getReportForRes(res);
        const instText = report?.yamamotoInstructions?.text;
        if (instText && instText.trim().length > 0) {
          return {
            res,
            instText,
            status: {
              morning: !!report.morning,
              noon: !!report.noon,
              night: !!report.night,
            },
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [residents, reportsByResIdMap]);

  // Find matching residents based on query (by name, kana, or room)
  const filteredResidents = useMemo(() => {
    return residents.filter((res) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        res.name.toLowerCase().includes(q) ||
        res.kana.toLowerCase().includes(q) ||
        res.roomNumber.includes(q)
      );
    });
  }, [residents, searchQuery]);

  // Filter list of residents to display: default to showing ONLY residents who have recorded inputs/reports for that day
  const finalDisplayResidents = useMemo(() => {
    return filteredResidents.filter((res) => {
      const report = getReportForRes(res);
      if (!report) return false;
      const hasMorning = !!report.morning;
      const hasNoon = !!report.noon;
      const hasNight = !!report.night;
      const hasInst = !!(report.yamamotoInstructions?.text && report.yamamotoInstructions.text.trim().length > 0);
      return hasMorning || hasNoon || hasNight || hasInst;
    });
  }, [filteredResidents, reportsByResIdMap]);

  // Sort list of residents for helper view: those with instructions for today appear at the very top!
  const helperDisplayResidents = useMemo(() => {
    return [...filteredResidents].sort((a, b) => {
      const repA = getReportForRes(a);
      const repB = getReportForRes(b);
      const hasInstA = repA?.yamamotoInstructions?.text && repA.yamamotoInstructions.text.trim().length > 0 ? 1 : 0;
      const hasInstB = repB?.yamamotoInstructions?.text && repB.yamamotoInstructions.text.trim().length > 0 ? 1 : 0;
      if (hasInstA !== hasInstB) {
        return hasInstB - hasInstA;
      }
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });
  }, [filteredResidents, reportsByResIdMap]);

  // Generate date list for the search history view (descending)
  const recentDates = useMemo(() => {
    const datesList: string[] = [];
    const base = new Date(selectedDate);
    if (isNaN(base.getTime())) return [];
    
    for (let i = 0; i < searchRangeDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      datesList.push(`${yyyy}-${mm}-${dd}`);
    }
    return datesList;
  }, [selectedDate, searchRangeDays]);

  const formatDateJapanese = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m - 1, d);
        if (!isNaN(dateObj.getTime())) {
          const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
          return `${m}月${d}日 (${dayOfWeek})`;
        }
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const mm = d.getMonth() + 1;
      const dd = d.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
      return `${mm}月${dd}日 (${dayOfWeek})`;
    } catch {
      return dateStr;
    }
  };

  const renderCompactBadges = (shift: any) => {
    const badges: string[] = [];
    if (shift.categories.poorHealth.length > 0) {
      badges.push(...shift.categories.poorHealth.map((c: string) => `体調: ${c}`));
    }
    if (shift.categories.injuryGait.length > 0) {
      badges.push(...shift.categories.injuryGait.map((c: string) => `怪我歩行: ${c}`));
    }
    if (shift.categories.elimination.length > 0) {
      badges.push(...shift.categories.elimination.map((c: string) => `排泄: ${c}`));
    }

    if (badges.length === 0 && !shift.otherSymptomText) return null;

    return (
      <div className="space-y-1 mt-1.5">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {badges.map((b, idx) => (
              <span key={idx} className="inline-block text-[9px] px-1 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 font-extrabold">
                {b}
              </span>
            ))}
          </div>
        )}
        {shift.otherSymptomText && (
          <p className="text-[10px] text-slate-500 bg-white/70 p-1 rounded border border-slate-100/80 line-clamp-2" title={shift.otherSymptomText}>
            <span className="font-bold text-slate-700">【他】</span>{shift.otherSymptomText}
          </p>
        )}
      </div>
    );
  };

  const renderCompactShiftBox = (
    title: '朝' | '昼' | '夜',
    shiftData: any,
    shiftKey: 'morning' | 'noon' | 'night',
    dateStr: string,
    resId: string
  ) => {
    const bgClass = shiftKey === 'morning' ? 'bg-amber-50/40' : shiftKey === 'noon' ? 'bg-sky-50/40' : 'bg-indigo-50/40';
    const borderClass = shiftKey === 'morning' ? 'border-amber-100' : shiftKey === 'noon' ? 'border-sky-100' : 'border-indigo-100';
    const textTheme = shiftKey === 'morning' ? 'text-amber-800' : shiftKey === 'noon' ? 'text-sky-800' : 'text-indigo-800';

    if (!shiftData) {
      return (
        <div 
          onClick={() => handleOpenShiftForm(resId, shiftKey, dateStr)}
          className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer h-full min-h-[90px] group"
        >
          <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
            {title}の記録なし
          </span>
          <span className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs group-hover:bg-slate-100">
            <span>+</span> <span>新規作成</span>
          </span>
        </div>
      );
    }

    const temp = shiftData.vitals.kt;
    const isHighTemp = temp && parseFloat(temp) >= 37.5;

    return (
      <div className={`flex flex-col p-3 rounded-lg border ${bgClass} ${borderClass} h-full justify-between relative`}>
        <div>
          <div className="flex items-center justify-between border-b border-slate-200/50 pb-1 mb-1.5">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white border ${borderClass} ${textTheme}`}>
              {title}
            </span>
            <span className="text-[10px] text-slate-500 font-bold" title="記録者">
              担当: {shiftData.reporter || '未詳'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 mb-2 bg-white/75 p-1.5 rounded border border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 text-[9px] block">体温:</span>
              {temp ? (
                <span className={`font-black ${isHighTemp ? 'text-rose-600 font-black animate-pulse' : 'text-slate-700'}`}>
                  {temp}℃
                </span>
              ) : '--.-℃'}
            </div>
            <div>
              <span className="text-slate-400 text-[9px] block">血圧:</span>
              {shiftData.vitals.bpSys || shiftData.vitals.bpDia ? (
                <span className="font-bold text-slate-700">
                  {shiftData.vitals.bpSys || '-'}/{shiftData.vitals.bpDia || '-'}
                </span>
              ) : '---/--'}
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 text-[9px] block">脈拍:</span>
              <span className="font-bold text-slate-700">{shiftData.vitals.pr ? `${shiftData.vitals.pr} 回/分` : '---'}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 space-y-0.5 mb-1.5 bg-white/40 p-1.5 rounded border border-slate-100/50">
            <div className="flex justify-between">
              <span className="text-slate-400 text-[10px]">食事(主/副):</span>
              <span className="font-bold text-slate-700">{shiftData.meals.staple || '0'} / {shiftData.meals.side || '0'} 割</span>
            </div>
            {(shiftData.meals.lacol || shiftData.meals.water) && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">ラコール等栄養剤/水分:</span>
                <span className="font-semibold text-slate-700">
                  {shiftData.meals.lacol ? `${shiftData.meals.lacol}P` : '-'}/{shiftData.meals.water ? `${shiftData.meals.water}ml` : '-'}
                </span>
              </div>
            )}
          </div>

          {renderCompactBadges(shiftData)}
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-200/40 flex justify-end">
          <button
            onClick={() => handleOpenShiftForm(resId, shiftKey, dateStr)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center space-x-1 bg-white px-2 py-1 rounded border border-slate-200 shadow-3xs hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors"
          >
            <span>編集する</span>
          </button>
        </div>
      </div>
    );
  };

  // --- 5. ACTION HANDLERS ---
  
  // Save or update report
  const handleSaveReport = async (updatedRep: CareReport) => {
    try {
      await setDoc(doc(db, 'reports', updatedRep.id), updatedRep);
    } catch (error) {
      console.error("Error saving report to Firestore:", error);
    }
    if (appMode === 'helper') {
      setHelperFormResId('');
    }
  };

  // Save or update Yamamoto instructions directly from card
  const handleSaveYamamotoInstructions = async (resId: string, text: string, date?: string, reportIdProp?: string | null) => {
    const targetDate = date || selectedDate;
    let reportId = reportIdProp;
    let existing: CareReport | null = null;
    
    if (reportId) {
      existing = reports.find((r) => r.id === reportId) || null;
    } else {
      const res = residents.find(r => r.id === resId);
      if (res) {
        existing = getReportForResidentAndDate(res, targetDate);
        if (existing) {
          reportId = existing.id;
        }
      }
    }
    
    if (!reportId) {
      reportId = `${resId}_${targetDate}`;
    }

    try {
      if (existing) {
        await setDoc(doc(db, 'reports', reportId), {
          ...existing,
          yamamotoInstructions: {
            ...existing.yamamotoInstructions,
            text,
          }
        });
      } else {
        await setDoc(doc(db, 'reports', reportId), {
          id: reportId,
          residentId: resId,
          date: targetDate,
          morning: null,
          noon: null,
          night: null,
          yamamotoInstructions: { text, confirmed: false },
          confirmedByDirector: false,
        });
      }
    } catch (error) {
      console.error("Error saving instructions to Firestore:", error);
    }
  };

  // Toggle Yamamoto-sensei's instructions sign-off on a single card
  const handleToggleYamamotoConfirm = async (resId: string, date?: string, reportIdProp?: string | null) => {
    const targetDate = date || selectedDate;
    let reportId = reportIdProp;
    let existing: CareReport | null = null;
    
    if (reportId) {
      existing = reports.find((r) => r.id === reportId) || null;
    } else {
      const res = residents.find(r => r.id === resId);
      if (res) {
        existing = getReportForResidentAndDate(res, targetDate);
        if (existing) {
          reportId = existing.id;
        }
      }
    }
    
    if (!reportId) {
      reportId = `${resId}_${targetDate}`;
    }

    try {
      if (existing) {
        await setDoc(doc(db, 'reports', reportId), {
          ...existing,
          yamamotoInstructions: {
            ...existing.yamamotoInstructions,
            confirmed: !existing.yamamotoInstructions.confirmed,
          }
        });
      } else {
        // Create a new empty report with confirmation
        await setDoc(doc(db, 'reports', reportId), {
          id: reportId,
          residentId: resId,
          date: targetDate,
          morning: null,
          noon: null,
          night: null,
          yamamotoInstructions: { text: '', confirmed: true },
          confirmedByDirector: false,
        });
      }
    } catch (error) {
      console.error("Error toggling confirmation in Firestore:", error);
    }
  };

  // Delete report completely from Firestore
  const handleDeleteReport = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const res = residents.find((r) => r.id === report.residentId);
    const resName = res ? `${res.roomNumber ? `${res.roomNumber}号室: ` : ''}${res.name}` : '利用者';

    if (!window.confirm(`【削除確認】\n${resName} 様の ${formatDateJapanese(report.date)} のすべての介護記録（朝・昼・夜のデータおよび指示コメント）を完全に削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      console.error("Error deleting report from Firestore:", error);
    }
  };

  // Save or update residents list to Firestore
  const handleUpdateResidents = async (updated: Resident[]) => {
    try {
      // Determine deleted residents
      const oldIds = residents.map((r) => r.id);
      const newIds = updated.map((r) => r.id);
      const deletedIds = oldIds.filter((id) => !newIds.includes(id));

      // Delete removed ones from Firestore
      for (const id of deletedIds) {
        await deleteDoc(doc(db, 'residents', id));
      }

      // Set/update the new list in Firestore
      for (const res of updated) {
        await setDoc(doc(db, 'residents', res.id), res);
      }
    } catch (error) {
      console.error("Error updating residents in Firestore:", error);
    }
  };

  // Trigger modal form for a shift
  const handleOpenShiftForm = (resId: string, shift: 'morning' | 'noon' | 'night', date?: string) => {
    const targetDate = date || selectedDate;
    setActiveResId(resId);
    setActiveShift(shift);
    setFormDate(targetDate);
    
    const reportId = `${resId}_${targetDate}`;
    const existing = reports.find((r) => r.id === reportId) || null;
    setEditingReport(existing);
    
    setIsFormOpen(true);
  };

  // Quick helper to jump dates safely avoiding timezone jumps
  const handleMoveDate = (days: number) => {
    try {
      const baseStr = selectedDate || getTodayDateString();
      const parts = baseStr.split('-');
      let current: Date;
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        current = new Date(y, m, d);
      } else {
        current = new Date();
      }
      if (isNaN(current.getTime())) {
        current = new Date();
      }
      current.setDate(current.getDate() + days);
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } catch (e) {
      console.error("Error moving date:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-100 pb-12">
      
      {/* ==================== UPPER BLOCK: FIRST ROW HEADER ==================== */}
      <header className="bg-emerald-600 text-white shadow-md border-b border-emerald-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Title Area */}
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white select-none">
              利用者様ケアレポート
            </h1>
          </div>

          {/* Date Selector and Navigation (Single Calendar Icon at right, Larger Font, Fully Clickable) */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-white px-4 sm:px-5 py-2.5 rounded-xl border-2 border-emerald-500 shadow-md">
            <button 
              onClick={() => handleMoveDate(-1)}
              className="text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-lg text-xl sm:text-2xl font-black transition-colors cursor-pointer select-none"
              title="前日へ"
            >
              ◀
            </button>

            {/* Date Display and Native Calendar Trigger Area */}
            <div className="relative flex items-center space-x-1.5 cursor-pointer group py-0.5 px-1.5 rounded-lg hover:bg-emerald-50/70 transition-colors">
              <span className="font-mono font-black text-lg sm:text-xl md:text-2xl text-slate-900 tracking-wide select-none">
                {selectedDate ? selectedDate.replace(/-/g, '/') : ''}
              </span>
              {selectedDayOfWeek && (
                <span className={`text-base sm:text-lg md:text-xl font-black select-none ${
                  selectedDayOfWeek === '日' ? 'text-red-600' :
                  selectedDayOfWeek === '土' ? 'text-blue-600' : 'text-slate-900'
                }`}>
                  （{selectedDayOfWeek}）
                </span>
              )}
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 shrink-0 select-none group-hover:scale-105 transition-transform ml-1" />

              {/* Invisible native date input spanning the entire clickable region */}
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                title="カレンダーを開いて日付を変更"
              />
            </div>

            <button 
              onClick={() => handleMoveDate(1)}
              className="text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-lg text-xl sm:text-2xl font-black transition-colors cursor-pointer select-none"
              title="翌日へ"
            >
              ▶
            </button>
          </div>

          {/* Search Bar - Name filter with high visibility white background */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-600" />
            <input
              type="text"
              placeholder="利用者名・部屋番号で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-xs font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all shadow-sm"
            />
          </div>

        </div>
      </header>

      {/* ==================== LOWER BLOCK: SECOND ROW CONTROL BAR ==================== */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-xs sticky top-[73px] lg:top-[69px] z-30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col space-y-3">
          
          {/* App Mode Switcher (Vibrant Tabbed Controller) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full grid grid-cols-2 text-center text-sm font-bold">
            <button
              onClick={() => setAppMode('view_instruct')}
              className={`py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                appMode === 'view_instruct'
                  ? 'bg-blue-800 text-white shadow-md hover:bg-blue-900'
                  : 'text-slate-600 hover:text-blue-800 hover:bg-blue-50/50'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>確認・指示（山本先生）</span>
            </button>
            <button
              onClick={() => setAppMode('helper')}
              className={`py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                appMode === 'helper'
                  ? 'bg-pink-600 text-white shadow-md hover:bg-pink-700'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50/50'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>介護職員入力</span>
            </button>
          </div>

          {/* Sub Control bar - conditionally rendered based on selected mode */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
            {appMode === 'view_instruct' ? (
              <>
                {/* View & Instruct controls */}
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      if (residents.length > 0) {
                        setActiveResId(residents[0].id);
                      }
                      setIsTrendOpen(true);
                    }}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    <span>推移グラフを表示</span>
                  </button>

                  <button
                    onClick={() => setIsMasterOpen(true)}
                    className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    title="利用者名簿マスター設定"
                  >
                    <Settings className="h-4 w-4" />
                    <span>名簿インポート・登録</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>

        </div>
      </div>

      {/* ==================== CORE DASHBOARD CARDS GRID ==================== */}
      <main className="max-w-7xl mx-auto px-4 mt-6 flex-1 w-full">
        
        {appMode === 'view_instruct' ? (
          // --- VIEW & INSTRUCT MODE ---
          searchQuery.trim() !== '' ? (
            // --- SEARCH HISTORY MODE (DATE-INDEPENDENT MULTI-DAY VIEW) ---
            <div className="space-y-6">
              {/* Search History Mode Toolbar */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-600 rounded-lg text-white">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-900">状況推移 検索・一覧モード</h3>
                    <p className="text-xs text-emerald-700 font-bold">
                      「{searchQuery}」に一致する利用者様（{filteredResidents.length}名）の複数日履歴を一覧表示中
                    </p>
                  </div>
                </div>
                
                {/* Search Period Selector */}
                <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-3xs self-start sm:self-auto">
                  <span className="text-xs text-slate-500 font-extrabold px-2.5">表示期間:</span>
                  {[
                    { label: '直近5日間', value: 5 },
                    { label: '直近10日間', value: 10 },
                    { label: '直近14日間', value: 14 },
                    { label: '直近1か月', value: 30 },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setSearchRangeDays(item.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        searchRangeDays === item.value
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching Residents List */}
              {filteredResidents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
                  <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">「{searchQuery}」に一致する利用者は見つかりませんでした</p>
                  <p className="text-xs text-slate-400 mt-1">名前、ふりがな、または部屋番号で再度お試しください。</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredResidents.map((res) => {
                    // Find all unique dates in the reports collection where this resident has any records, sorted descending
                    const uniqueDatesWithReports = reports
                      .filter((rep) => {
                        if (rep.residentId === res.id) return true;
                        const currentIndex = getIndexFromId(res.id);
                        if (currentIndex !== null) {
                          const repIndex = getIndexFromId(rep.residentId);
                          if (repIndex === currentIndex) return true;
                        }
                        const associated = residents.find(r => r.id === rep.residentId);
                        if (associated && associated.name === res.name && associated.roomNumber === res.roomNumber) {
                          return true;
                        }
                        return false;
                      })
                      .filter((rep) => {
                        return (
                          !!rep.morning ||
                          !!rep.noon ||
                          !!rep.night ||
                          !!(rep.yamamotoInstructions?.text && rep.yamamotoInstructions.text.trim().length > 0)
                        );
                      })
                      .map((rep) => rep.date)
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .sort((a, b) => b.localeCompare(a));

                    return (
                      <div key={res.id} className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all hover:shadow-lg">
                        {/* Resident Header */}
                        <div className="bg-slate-900 text-white px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="bg-indigo-600 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                              {res.roomNumber}号室
                            </span>
                            <h2 className="text-lg font-black">{res.name} 様</h2>
                            <span className="text-xs text-slate-300 font-bold">（{res.kana}）</span>
                            {res.careLevel && (
                              <span className="bg-slate-800 text-slate-300 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-700">
                                {res.careLevel}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Buttons removed as requested: 'バイタル推移' and '新規記録を追加' */}
                          </div>
                        </div>

                        {/* Resident Timeline Body */}
                        <div className="p-5 space-y-6 bg-slate-50">
                          {uniqueDatesWithReports.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-500">登録済みのケアレポートはありません</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">上の「介護職員入力」画面から、本日の状況を新しく入力・登録できます。</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {uniqueDatesWithReports.map((dStr) => {
                                const rep = getReportForResidentAndDate(res, dStr);
                                return (
                                  <ReportCard
                                    key={dStr}
                                    resident={res}
                                    report={rep}
                                    dateLabel={formatDateJapanese(dStr)}
                                    onEditShift={(shift) => handleOpenShiftForm(res.id, shift, dStr)}
                                    onToggleYamamotoConfirm={(repId) => handleToggleYamamotoConfirm(res.id, dStr, repId)}
                                    onSaveYamamotoInstructions={(text, repId) => handleSaveYamamotoInstructions(res.id, text, dStr, repId)}
                                    onDeleteReport={handleDeleteReport}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Sub-view Switcher: 詳細カード表示 vs 報告者リスト（氏名一覧） */}
              <div className="bg-slate-200/80 p-1 rounded-xl border border-slate-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-3xs">
                <div className="flex space-x-1.5 flex-1">
                  <button
                    onClick={() => setViewSubTab('cards')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      viewSubTab === 'cards'
                        ? 'bg-white text-emerald-800 shadow-sm border border-emerald-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4 text-emerald-600" />
                    <span>📄 詳細カード表示</span>
                  </button>

                  <button
                    onClick={() => setViewSubTab('names_list')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      viewSubTab === 'names_list'
                        ? 'bg-white text-blue-900 shadow-sm border border-blue-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <List className="h-4 w-4 text-blue-600" />
                    <span>📋 本日の報告一覧</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      viewSubTab === 'names_list' ? 'bg-blue-100 text-blue-800' : 'bg-slate-300 text-slate-700'
                    }`}>
                      {finalDisplayResidents.length}名
                    </span>
                  </button>
                </div>
              </div>

              {/* View 1: 本日の報告一覧（氏名一覧） - Quick Lookup List Tab */}
              {viewSubTab === 'names_list' ? (
                finalDisplayResidents.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center">
                    <ListFilter className="h-10 w-10 text-slate-300 mb-3" />
                    <h3 className="text-sm font-bold text-slate-700 mb-1">本日記録のある利用者がいません</h3>
                    <p className="text-xs text-slate-400 mb-4 max-w-md">
                      本日（{formatDateJapanese(selectedDate)}）のケアレポートはまだ登録されていません。上の「介護職員入力」タブから、本日の状況を記録してください。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs sm:text-sm text-blue-950 font-black">
                      <div className="flex items-center space-x-2">
                        <List className="h-4 w-4 text-blue-600" />
                        <span>本日の報告一覧: {finalDisplayResidents.length}名</span>
                      </div>
                      <span className="text-xs text-blue-700 font-bold hidden sm:inline">
                        ※名前をタップすると詳細画面へスクロールします
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {finalDisplayResidents.map((res) => {
                        const rep = getReportForRes(res);
                        if (!rep) return null;

                        const hasMorning = !!rep.morning;
                        const hasNoon = !!rep.noon;
                        const hasNight = !!rep.night;

                        // Gather alerts
                        const alerts: string[] = [];
                        if (rep.morning?.categories?.poorHealth) alerts.push(...rep.morning.categories.poorHealth);
                        if (rep.noon?.categories?.poorHealth) alerts.push(...rep.noon.categories.poorHealth);
                        if (rep.night?.categories?.poorHealth) alerts.push(...rep.night.categories.poorHealth);

                        const hasHighKt = [rep.morning?.vitals?.kt, rep.noon?.vitals?.kt, rep.night?.vitals?.kt].some(
                          kt => kt && parseFloat(kt) >= 37.5
                        );

                        const instText = rep.yamamotoInstructions?.text;
                        const isInstConfirmed = rep.yamamotoInstructions?.confirmed;

                        return (
                          <div
                            key={res.id}
                            className={`bg-white rounded-xl border-2 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                              highlightedResId === res.id ? 'border-emerald-500 ring-4 ring-emerald-200' : 'border-slate-200 hover:border-emerald-400'
                            }`}
                          >
                            {/* Clickable Area to jump to details */}
                            <div 
                              onClick={() => handleJumpToResidentCard(res.id)}
                              className="flex-1 cursor-pointer select-none"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
                                <span className="bg-emerald-800 text-white font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg shadow-3xs">
                                  {res.roomNumber}号室
                                </span>
                                <span className="text-base sm:text-lg font-black text-slate-900 hover:text-emerald-700 transition-colors">
                                  {res.name} 様
                                </span>
                                <span className="text-xs text-slate-400 font-bold">
                                  （{res.kana}）
                                </span>
                                {res.careLevel && (
                                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black px-2 py-0.5 rounded-md">
                                    {res.careLevel}
                                  </span>
                                )}
                              </div>

                              {/* Shifts and Alert Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                                <div className="flex items-center space-x-1">
                                  <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                                    hasMorning ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}>
                                    朝 {hasMorning ? (rep.morning?.reporter ? `(${rep.morning.reporter})` : '済') : '未'}
                                  </span>
                                  <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                                    hasNoon ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}>
                                    昼 {hasNoon ? (rep.noon?.reporter ? `(${rep.noon.reporter})` : '済') : '未'}
                                  </span>
                                  <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                                    hasNight ? 'bg-violet-100 text-violet-800 border-violet-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}>
                                    夜 {hasNight ? (rep.night?.reporter ? `(${rep.night.reporter})` : '済') : '未'}
                                  </span>
                                </div>

                                {alerts.length > 0 && (
                                  <span className="bg-red-50 text-red-700 border border-red-300 text-xs font-black px-2 py-0.5 rounded shadow-3xs">
                                    体調不良: {alerts[0]}{alerts.length > 1 ? ` 他${alerts.length - 1}件` : ''}
                                  </span>
                                )}
                                {hasHighKt && (
                                  <span className="bg-rose-100 text-rose-700 border border-rose-300 text-xs font-black px-2 py-0.5 rounded shadow-3xs animate-pulse">
                                    発熱あり
                                  </span>
                                )}
                                {instText && (
                                  <span className={`text-xs font-black px-2 py-0.5 rounded border ${
                                    isInstConfirmed 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                      : 'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}>
                                    指示: {isInstConfirmed ? '確認済' : '未確認'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right Actions: 編集 & 削除 Buttons */}
                            <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                              <button
                                onClick={() => handleOpenShiftForm(res.id, hasMorning ? 'morning' : hasNoon ? 'noon' : hasNight ? 'night' : 'morning')}
                                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-3.5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer shadow-3xs"
                                title="この利用者の記録を編集"
                              >
                                <Edit3 className="h-4 w-4 text-blue-600" />
                                <span>編集</span>
                              </button>

                              <button
                                onClick={() => handleDeleteReport(rep.id)}
                                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3.5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer shadow-3xs hover:shadow-xs"
                                title="この日のすべての記録を完全に削除"
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                                <span>削除</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                /* View 2: 詳細カード表示 (Standard Detailed Cards) */
                finalDisplayResidents.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center">
                    <ListFilter className="h-10 w-10 text-slate-300 mb-3" />
                    <h3 className="text-sm font-bold text-slate-700 mb-1">本日記録のある利用者がいません</h3>
                    <p className="text-xs text-slate-400 mb-4 max-w-md">
                      本日（{formatDateJapanese(selectedDate)}）のケアレポートはまだ登録されていません。上の「介護職員入力」タブから、本日の状況を記録してください。
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {finalDisplayResidents.map((res) => {
                      const report = getReportForRes(res);
                      return (
                        <ReportCard
                          key={res.id}
                          resident={res}
                          report={report}
                          onEditShift={(shift) => handleOpenShiftForm(res.id, shift)}
                          onToggleYamamotoConfirm={(repId) => handleToggleYamamotoConfirm(res.id, undefined, repId)}
                          onSaveYamamotoInstructions={(text, repId) => handleSaveYamamotoInstructions(res.id, text, undefined, repId)}
                          onDeleteReport={handleDeleteReport}
                        />
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )
        ) : (
          // --- HELPER RECORDING MODE (optimized for streamlined inline entry) ---
          <div className="space-y-6">
            <ReportFormModal
              isOpen={true}
              isInline={true}
              residents={residents}
              reports={reports}
              onSaveReport={handleSaveReport}
              initialResidentId={helperFormResId}
              initialDate={selectedDate}
              initialShift={helperFormShift}
              onClose={() => {}}
              onDeleteReport={handleDeleteReport}
            />
          </div>
        )}

      </main>

      {/* ==================== SUBMODALS IMPLEMENTATIONS ==================== */}

      {/* Modal 1: Report Input Form */}
      <ReportFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReport(null);
        }}
        residents={residents}
        reports={reports}
        onSaveReport={handleSaveReport}
        initialResidentId={activeResId}
        initialDate={formDate || selectedDate}
        initialShift={activeShift}
        editReport={editingReport}
        onDeleteReport={handleDeleteReport}
      />

      {/* Modal 2: Trend Charts */}
      <TrendChartsModal
        isOpen={isTrendOpen}
        onClose={() => setIsTrendOpen(false)}
        reports={reports}
        residents={residents}
        initialResidentId={activeResId || residents[0]?.id}
      />

      {/* Modal 3: Master List Settings */}
      <MasterListModal
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
        residents={residents}
        onUpdateResidents={handleUpdateResidents}
      />

    </div>
  );
}
