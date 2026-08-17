import React, { useState } from 'react';
import { Resident } from '../types';
import { X, Plus, Upload, Trash2, ArrowUpDown, Info, FileSpreadsheet, Edit2, Check } from 'lucide-react';

interface MasterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  onUpdateResidents: (updated: Resident[]) => void;
}

export default function MasterListModal({
  isOpen,
  onClose,
  residents,
  onUpdateResidents,
}: MasterListModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import'>('list');
  
  // For manual adding
  const [newRoom, setNewRoom] = useState('');
  const [newName, setNewName] = useState('');
  const [newKana, setNewKana] = useState('');
  const [newCare, setNewCare] = useState('要介護1');
  const [newMemo, setNewMemo] = useState('');

  // For copy-paste import
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('overwrite'); // default to overwrite for clinical rosters

  // Sorting
  const [sortBy, setSortBy] = useState<'room' | 'kana'>('room');

  // For inline editing
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState('');
  const [editName, setEditName] = useState('');
  const [editKana, setEditKana] = useState('');
  const [editCare, setEditCare] = useState('');
  const [editMemo, setEditMemo] = useState('');

  if (!isOpen) return null;

  // Handle start editing
  const handleStartEdit = (res: Resident) => {
    setEditingResId(res.id);
    setEditRoom(res.roomNumber);
    setEditName(res.name);
    setEditKana(res.kana || '');
    setEditCare(res.careLevel || '要介護2');
    setEditMemo(res.memo || '');
  };

  // Handle save editing
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updated = residents.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          roomNumber: editRoom.trim() || '---',
          name: editName.trim(),
          kana: editKana.trim() || editName.trim(),
          careLevel: editCare,
          memo: editMemo.trim(),
        };
      }
      return r;
    });
    onUpdateResidents(updated);
    setEditingResId(null);
  };

  // Handle manual resident add
  const handleAddResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Generate custom ID
    const newId = `res-manual-${newRoom.trim() || 'no-room'}-${newName.trim()}`;
    const newRes: Resident = {
      id: newId,
      name: newName.trim(),
      kana: newKana.trim() || newName.trim(), // fallback to name
      roomNumber: newRoom.trim() || '---',
      careLevel: newCare,
      memo: newMemo.trim(),
    };

    onUpdateResidents([...residents, newRes]);
    
    // Reset form
    setNewRoom('');
    setNewName('');
    setNewKana('');
    setNewCare('要介護1');
    setNewMemo('');
    setActiveTab('list');
  };

  // Delete a resident
  const handleDeleteResident = (id: string, name: string) => {
    if (window.confirm(`「${name}」様を名簿から削除しますか？\n（この操作は取り消せません）`)) {
      onUpdateResidents(residents.filter((r) => r.id !== id));
    }
  };

  // CSV/TSV excel import logic
  const handleImportExcel = () => {
    if (!importText.trim()) {
      setImportError('テキストが入力されていません。');
      return;
    }

    try {
      // Split by lines
      const lines = importText.split('\n');
      const newImported: Resident[] = [];
      let parsedCount = 0;

      lines.forEach((line, index) => {
        // Skip header or empty line
        if (!line.trim()) return;
        
        // Try tab-delimited first (standard Excel copy-paste), then comma, then space
        let parts = line.split('\t');
        if (parts.length < 2) {
          parts = line.split(',');
        }
        if (parts.length < 2) {
          parts = line.split(/\s+/);
        }

        if (parts.length >= 2) {
          // Expect format: RoomNumber, Name, Kana, CareLevel, Memo
          // But accommodate dirty data
          let room = parts[0].trim();
          let name = parts[1].trim();
          
          // Let's filter out headers like "部屋番号" or "氏名" or "部屋"
          if (
            name === '氏名' || 
            name === 'お名前' || 
            name === '利用者名' || 
            room === '部屋番号' || 
            room === '部屋'
          ) {
            return; // skip header line
          }

          let kana = parts[2]?.trim() || name;
          let care = parts[3]?.trim() || '要介護2';
          let memo = parts[4]?.trim() || '';

          newImported.push({
            id: `res-imported-${parsedCount}`,
            name,
            kana,
            roomNumber: room,
            careLevel: care,
            memo,
          });
          parsedCount++;
        }
      });

      if (newImported.length === 0) {
        throw new Error('有効なデータ行が見つかりませんでした。部屋番号と利用者名が正しく並んでいるか確認してください。');
      }

      if (importMode === 'overwrite') {
        onUpdateResidents(newImported);
      } else {
        onUpdateResidents([...residents, ...newImported]);
      }

      setImportSuccessCount(newImported.length);
      setImportError(null);
      setImportText('');
      setTimeout(() => {
        setImportSuccessCount(null);
        setActiveTab('list');
      }, 2000);

    } catch (err: any) {
      setImportError(err.message || 'インポートに失敗しました。フォーマットをご確認ください。');
    }
  };

  // Sort residents
  const sortedResidents = [...residents].sort((a, b) => {
    if (sortBy === 'room') {
      // Numerical sort if possible
      const roomA = parseInt(a.roomNumber) || 9999;
      const roomB = parseInt(b.roomNumber) || 9999;
      if (roomA !== roomB) return roomA - roomB;
      return a.roomNumber.localeCompare(b.roomNumber);
    } else {
      // Japanese phonetic sort (Kana)
      return a.kana.localeCompare(b.kana, 'ja');
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-amber-200 animate-pulse" />
            <h2 className="text-lg font-black tracking-tight">利用者マスター名簿設定</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            登録利用者一覧 ({residents.length}名)
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'add'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            個別新規登録
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Excelリスト貼り付け（インポート）
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* TAB: LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg text-xs text-slate-600">
                <span className="font-medium">ア～ン五十音順・部屋番号順にソートして確認できます。</span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">並び順:</span>
                  <button
                    onClick={() => setSortBy('room')}
                    className={`rounded px-2 py-1 font-semibold transition-colors ${
                      sortBy === 'room' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    部屋番号
                  </button>
                  <button
                    onClick={() => setSortBy('kana')}
                    className={`rounded px-2 py-1 font-semibold transition-colors ${
                      sortBy === 'kana' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    あいうえお順
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {sortedResidents.map((res) => {
                  const isEditing = editingResId === res.id;
                  return (
                    <div key={res.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 hover:bg-slate-50 transition-colors gap-3">
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                          {/* Room Number */}
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editRoom}
                              onChange={(e) => setEditRoom(e.target.value)}
                              placeholder="部屋"
                              className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span className="text-[10px] text-slate-400">号室</span>
                          </div>
                          {/* Name */}
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="氏名"
                            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-bold"
                          />
                          {/* Kana */}
                          <input
                            type="text"
                            value={editKana}
                            onChange={(e) => setEditKana(e.target.value)}
                            placeholder="ふりがな"
                            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 font-mono text-slate-600"
                          />
                          {/* Care level */}
                          <select
                            value={editCare}
                            onChange={(e) => setEditCare(e.target.value)}
                            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                          >
                            <option value="自立">自立</option>
                            <option value="要支援1">要支援1</option>
                            <option value="要支援2">要支援2</option>
                            <option value="要介護1">要介護1</option>
                            <option value="要介護2">要介護2</option>
                            <option value="要介護3">要介護3</option>
                            <option value="要介護4">要介護4</option>
                            <option value="要介護5">要介護5</option>
                          </select>
                          {/* Memo */}
                          <input
                            type="text"
                            value={editMemo}
                            onChange={(e) => setEditMemo(e.target.value)}
                            placeholder="注意・共有事項メモ"
                            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-600"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center space-x-4 flex-1">
                          <span className="inline-block w-14 rounded-md bg-slate-100 px-2 py-1 text-center font-mono text-xs font-bold text-slate-700">
                            {res.roomNumber}号室
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{res.name} 様</div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-wider">{res.kana}</div>
                          </div>
                          {res.careLevel && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                              {res.careLevel}
                            </span>
                          )}
                          {res.memo && (
                            <span className="max-w-[200px] truncate text-xs text-slate-500 bg-amber-50 px-2 py-1 rounded border border-amber-100" title={res.memo}>
                              {res.memo}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1.5 self-end md:self-auto">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(res.id)}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 text-xs font-bold transition-colors flex items-center space-x-1 px-2 cursor-pointer shadow-sm"
                              title="保存"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>保存</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingResId(null)}
                              className="rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 p-1.5 text-xs font-bold transition-colors px-2 cursor-pointer"
                              title="キャンセル"
                            >
                              キャンセル
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(res)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                              title="編集"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteResident(res.id, res.name)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                              title="削除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {sortedResidents.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    登録されている利用者がいません。「新規追加」か「インポート」から登録してください。
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MANUAL ADD */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddResident} className="space-y-4 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4">新規の利用者（入居者）を個別登録する</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">部屋番号 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 101"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">利用者氏名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 西川 茂"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ふりがな（全角カタカナ - 五十音並び替え用）</label>
                <input
                  type="text"
                  placeholder="例: ニシカワシゲル"
                  value={newKana}
                  onChange={(e) => setNewKana(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">介護度</label>
                <select
                  value={newCare}
                  onChange={(e) => setNewCare(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="自立">自立</option>
                  <option value="要支援1">要支援1</option>
                  <option value="要支援2">要支援2</option>
                  <option value="要介護1">要介護1</option>
                  <option value="要介護2">要介護2</option>
                  <option value="要介護3">要介護3</option>
                  <option value="要介護4">要介護4</option>
                  <option value="要介護5">要介護5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">注意・共有事項メモ</label>
                <textarea
                  placeholder="例: 水分多めの摂取推奨。歩行時ふらつき注意。"
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>登録を追加する</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: EXCEL COPY PASTE IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs text-slate-700 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-800">
                  <Info className="h-4 w-4" />
                  <span>DropboxやExcel等のセルをそのままコピペできます！</span>
                </div>
                <p>
                  Excelやスプレッドシートの表から<strong>「部屋番号」「氏名」「ふりがな」「介護度」「メモ」</strong>等の複数行をドラッグしてコピーし、下のテキストエリアにそのままペースト（Ctrl+V）して「インポート」を押してください。
                </p>
                <p className="font-mono text-[10px] bg-white p-2 rounded border border-emerald-100">
                  例（タブ区切りやカンマ区切りの列データ）：<br />
                  101	西川 茂	ニシカワシゲル	要介護3	便秘傾向あり<br />
                  102	久田 銀次	ヒサダギンジ	要介護2	水分量注意<br />
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-700">インポート処理方法を選択してください：</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('overwrite')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg font-black border transition-all cursor-pointer ${
                      importMode === 'overwrite'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🚨 既存名簿を全て削除して上書き（推奨）
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg font-black border transition-all cursor-pointer ${
                      importMode === 'append'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ➕ 既存の名簿の後ろに追加する
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ペーストエリア</label>
                <textarea
                  rows={6}
                  placeholder="ここにExcel等からコピーした行を貼り付けます..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-emerald-500 focus:outline-none bg-slate-50"
                />
              </div>

              {importError && (
                <div className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {importError}
                </div>
              )}

              {importSuccessCount !== null && (
                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  🎉 正常に {importSuccessCount} 名の利用者を名簿に追加登録しました！
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleImportExcel}
                  className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>データをインポートする</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex justify-between items-center text-xs text-slate-500">
          <span>※名簿はブラウザのローカルストレージに自動保存されます。</span>
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
