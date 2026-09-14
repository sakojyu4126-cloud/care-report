import React, { useState, useRef } from 'react';
import { CareReport, Resident } from '../types';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText
} from 'lucide-react';

export interface BackupData {
  version: string;
  app: 'care_reports';
  exportedAt: string;
  residents: Resident[];
  reports: CareReport[];
}

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  reports: CareReport[];
  onRestoreData: (restoredResidents: Resident[], restoredReports: CareReport[], syncToCloud: boolean) => Promise<void>;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  residents,
  reports,
  onRestoreData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ residents: Resident[]; reports: CareReport[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setErrorMessage('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Validate structure
        let importedResidents: Resident[] = [];
        let importedReports: CareReport[] = [];

        if (Array.isArray(json)) {
          // Direct reports array
          importedReports = json;
          importedResidents = residents;
        } else if (json && (json.reports || json.residents)) {
          importedReports = Array.isArray(json.reports) ? json.reports : [];
          importedResidents = Array.isArray(json.residents) ? json.residents : residents;
        } else {
          throw new Error('バックアップファイルの形式が正しくありません。');
        }

        if (importedReports.length === 0 && importedResidents.length === 0) {
          throw new Error('有効なデータが見つかりませんでした。');
        }

        setParsedData({
          residents: importedResidents,
          reports: importedReports,
        });
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'ファイルの読み込みに失敗しました。');
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('ファイルの読み込み中にエラーが発生しました。');
      setParsedData(null);
    };
    reader.readAsText(file);
  };

  // Drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Execute restore
  const handleExecuteRestore = async () => {
    if (!parsedData) return;

    setIsRestoring(true);
    setErrorMessage('');

    try {
      // Intelligently merge residents
      const residentMap = new Map<string, Resident>();
      residents.forEach((r) => residentMap.set(r.id, r));
      parsedData.residents.forEach((r) => residentMap.set(r.id, r));
      const finalResidents = Array.from(residentMap.values());

      // Intelligently merge reports
      const reportMap = new Map<string, CareReport>();
      reports.forEach((r) => reportMap.set(r.id, r));
      parsedData.reports.forEach((r) => {
        const existing = reportMap.get(r.id);
        if (!existing) {
          reportMap.set(r.id, r);
        } else {
          reportMap.set(r.id, {
            ...existing,
            ...r,
            morning: r.morning || existing.morning,
            noon: r.noon || existing.noon,
            night: r.night || existing.night,
            yamamotoInstructions: r.yamamotoInstructions?.text ? r.yamamotoInstructions : existing.yamamotoInstructions,
          });
        }
      });
      const finalReports = Array.from(reportMap.values());

      await onRestoreData(finalResidents, finalReports, true);
      handleClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('データの復元中にエラーが発生しました。');
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedData(null);
    setErrorMessage('');
    setIsRestoring(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">データ復元</h2>
              <p className="text-xs text-emerald-100 font-medium">
                保存したバックアップファイルを読み込みます
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          {!parsedData ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                バックアップファイル（.json）を選択
              </p>
              <p className="text-xs text-slate-500">
                またはここにファイルをドラッグ＆ドロップ
              </p>
              <button
                type="button"
                className="mt-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-lg shadow-3xs transition-colors cursor-pointer"
              >
                ファイルを選ぶ
              </button>
            </div>
          ) : (
            /* File Preview Ready */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-800 font-bold mb-0.5">
                    読み込み完了
                  </p>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {selectedFile?.name || 'バックアップデータ'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    利用者名簿: <span className="font-black text-slate-900">{parsedData.residents.length} 名</span> / 介護記録: <span className="font-black text-slate-900">{parsedData.reports.length} 件</span>
                  </p>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setSelectedFile(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
                >
                  別のファイルを選び直す
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-red-700 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isRestoring}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            キャンセル
          </button>

          {parsedData && (
            <button
              type="button"
              onClick={handleExecuteRestore}
              disabled={isRestoring}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>{isRestoring ? '復元中...' : '復元を実行する'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
