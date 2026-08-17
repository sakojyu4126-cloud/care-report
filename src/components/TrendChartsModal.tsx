import { useState, useMemo, useEffect } from 'react';
import { CareReport, Resident } from '../types';
import { X, TrendingUp, Calendar, Heart, Coffee, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';

interface TrendChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: CareReport[];
  residents: Resident[];
  initialResidentId?: string;
}

export default function TrendChartsModal({
  isOpen,
  onClose,
  reports,
  residents,
  initialResidentId,
}: TrendChartsModalProps) {
  const [selectedResId, setSelectedResId] = useState<string>(initialResidentId || residents[0]?.id || '');
  const [rangeDays, setRangeDays] = useState<number>(7); // default 7 days of records

  useEffect(() => {
    if (isOpen) {
      setSelectedResId(initialResidentId || residents[0]?.id || '');
    }
  }, [isOpen, initialResidentId, residents]);

  // Helper to extract index from imported resident ID formats
  const getIndexFromId = (id: string): string | null => {
    const match = id.match(/res-imported-(?:\d+-)?(\d+)/);
    return match ? match[1] : null;
  };

  // Parse and assemble trend data
  const trendData = useMemo(() => {
    if (!selectedResId) return [];

    const currentRes = residents.find(r => r.id === selectedResId);
    if (!currentRes) return [];

    // 1. Filter reports for this resident with robust fallback matching
    const resReports = reports.filter((rep) => {
      // Direct ID match
      if (rep.residentId === currentRes.id) return true;

      // Index-based match for imported IDs
      const repIndex = getIndexFromId(rep.residentId);
      const resIndex = getIndexFromId(currentRes.id);
      if (repIndex !== null && resIndex !== null && repIndex === resIndex) return true;

      // Name & Room match
      const associated = residents.find(r => r.id === rep.residentId);
      if (associated) {
        return associated.name === currentRes.name && associated.roomNumber === currentRes.roomNumber;
      }
      return false;
    });

    // 2. Sort by date ascending
    const sortedReports = [...resReports].sort((a, b) => a.date.localeCompare(b.date));

    // 3. Take last N reports
    const slicedReports = sortedReports.slice(-rangeDays);

    // 4. Generate shift-level sequential data points
    const points: any[] = [];

    slicedReports.forEach((rep) => {
      // Human friendly short date e.g. "7/5" or "07/05"
      const dateStr = rep.date.substring(5).replace('-', '/');

      // Helper to extract numeric values safely
      const toNum = (val: string) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      };

      // Morning
      if (rep.morning) {
        points.push({
          label: `${dateStr} 朝`,
          date: rep.date,
          shift: '朝',
          kt: toNum(rep.morning.vitals.kt),
          bpSys: toNum(rep.morning.vitals.bpSys),
          bpDia: toNum(rep.morning.vitals.bpDia),
          pr: toNum(rep.morning.vitals.pr),
          staple: toNum(rep.morning.meals.staple),
          side: toNum(rep.morning.meals.side),
          water: toNum(rep.morning.meals.water),
        });
      }

      // Noon
      if (rep.noon) {
        points.push({
          label: `${dateStr} 昼`,
          date: rep.date,
          shift: '昼',
          kt: toNum(rep.noon.vitals.kt),
          bpSys: toNum(rep.noon.vitals.bpSys),
          bpDia: toNum(rep.noon.vitals.bpDia),
          pr: toNum(rep.noon.vitals.pr),
          staple: toNum(rep.noon.meals.staple),
          side: toNum(rep.noon.meals.side),
          water: toNum(rep.noon.meals.water),
        });
      }

      // Night
      if (rep.night) {
        points.push({
          label: `${dateStr} 夜`,
          date: rep.date,
          shift: '夜',
          kt: toNum(rep.night.vitals.kt),
          bpSys: toNum(rep.night.vitals.bpSys),
          bpDia: toNum(rep.night.vitals.bpDia),
          pr: toNum(rep.night.vitals.pr),
          staple: toNum(rep.night.meals.staple),
          side: toNum(rep.night.meals.side),
          water: toNum(rep.night.meals.water),
        });
      }
    });

    return points;
  }, [reports, selectedResId, rangeDays]);

  // Check for abnormal stats
  const anomalies = useMemo(() => {
    const list: string[] = [];
    if (trendData.length === 0) return list;

    const highTemps = trendData.filter((p) => p.kt && p.kt >= 37.5);
    if (highTemps.length > 0) {
      list.push(`直近で37.5℃以上の発熱が ${highTemps.length} 回記録されています。`);
    }

    const lowMeals = trendData.filter(
      (p) => (p.staple !== null && p.staple <= 4) || (p.side !== null && p.side <= 4)
    );
    if (lowMeals.length > 0) {
      list.push(`食事量（主食または副食）が4割以下の記録が ${lowMeals.length} 回あります。`);
    }

    return list;
  }, [trendData]);

  if (!isOpen) return null;

  const currentResident = residents.find((r) => r.id === selectedResId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-amber-200 animate-pulse" />
            <h2 className="text-lg font-black tracking-tight">バイタル＆食事水分 経時推移グラフ</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-700">対象利用者:</label>
            <select
              value={selectedResId}
              onChange={(e) => setSelectedResId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber ? `${r.roomNumber}号室: ` : ''}{r.name} 様
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-600">表示期間:</span>
            <button
              onClick={() => setRangeDays(5)}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                rangeDays === 5 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              5日間
            </button>
            <button
              onClick={() => setRangeDays(10)}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                rangeDays === 10 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              10日間
            </button>
            <button
              onClick={() => setRangeDays(20)}
              className={`rounded px-3 py-1 font-semibold transition-colors ${
                rangeDays === 20 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              20日間
            </button>
          </div>
        </div>

        {/* Chart Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {currentResident && (
            <div className="rounded-lg bg-slate-100 p-3 flex items-center justify-between text-xs text-slate-700 border border-slate-200">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-900 text-sm">【{currentResident.roomNumber}号室】 {currentResident.name} 様</span>
                {currentResident.careLevel && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold">
                    {currentResident.careLevel}
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                総データシフト点: {trendData.length} 件
              </div>
            </div>
          )}

          {/* Warnings if any anomalies found */}
          {anomalies.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-red-800 text-xs">
                <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                <span>見守り・注意アラート</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 pl-1 space-y-0.5">
                {anomalies.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {trendData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              選択された期間内に十分な記録データ（バイタル・食事等）が見つかりません。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              
              {/* Chart 1: Temperature & Pulse */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center space-x-2 border-b pb-2 mb-4">
                  <Heart className="h-4 w-4 text-red-500" />
                  <h3 className="text-xs font-bold text-slate-800">体温 (KT) ＆ 脈拍 (PR) 推移</h3>
                </div>
                
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <YAxis yAxisId="left" domain={[35.0, 39.5]} stroke="#ef4444" label={{ value: '体温 ℃', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px', fill: '#ef4444' } }} />
                      <YAxis yAxisId="right" orientation="right" domain={[50, 110]} stroke="#3b82f6" label={{ value: '脈拍/分', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '10px', fill: '#3b82f6' } }} />
                      <Tooltip />
                      <Legend style={{ fontSize: '11px' }} />
                      <ReferenceLine yAxisId="left" y={37.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '37.5℃ 発熱境界', position: 'insideTopLeft', fill: '#ef4444', fontSize: '10px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="kt"
                        name="体温 (℃)"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        activeDot={{ r: 8 }}
                        connectNulls
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="pr"
                        name="脈拍 (PR)"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Blood Pressure */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center space-x-2 border-b pb-2 mb-4">
                  <Heart className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-slate-800">血圧推移 (収縮期 / 拡張期)</h3>
                </div>
                
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <YAxis domain={[50, 180]} stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip />
                      <Legend style={{ fontSize: '11px' }} />
                      <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '140 高血圧境界', fill: '#f59e0b', fontSize: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="bpSys"
                        name="血圧（高/収縮期）"
                        stroke="#dc2626"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="bpDia"
                        name="血圧（低/拡張期）"
                        stroke="#059669"
                        strokeWidth={2}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Meals (主食・副食) & Hydration */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center space-x-2 border-b pb-2 mb-4">
                  <Coffee className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-800">食事摂取割合 (主食・副食) ＆ 水分摂取量</h3>
                </div>
                
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <YAxis yAxisId="left" domain={[0, 10]} stroke="#d97706" label={{ value: '食事（割）', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px', fill: '#d97706' } }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 500]} stroke="#06b6d4" label={{ value: '水分 (ml)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '10px', fill: '#06b6d4' } }} />
                      <Tooltip />
                      <Legend style={{ fontSize: '11px' }} />
                      <Bar yAxisId="left" dataKey="staple" name="主食 (割)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="side" name="副食 (割)" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="water" name="水分 (ml)" stroke="#06b6d4" strokeWidth={2.5} connectNulls />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 transition-colors text-xs"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}
