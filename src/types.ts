export interface ShiftRecord {
  reporter: string;
  // Selected detailed categories
  categories: {
    poorHealth: string[]; // '発熱' | '食事がとれない' | '嘔吐' | '腹痛' | '頭痛' | 'その他'
    injuryGait: string[]; // '転倒' | '転落' | '歩行困難'
    elimination: string[]; // '排便大量' | '排尿大量' | '便が出ない' | '排泄失敗'
  };
  otherSymptomText: string; // ④その他問題行動 or フリースペース
  meals: {
    staple: string; // 主食○割
    side: string;   // 副食○割
    lacol: string;  // ラコール等○Pまたは1/2P
    water: string;  // 水分量○○ml程度
  };
  vitals: {
    kt: string;     // 体温 (KT) e.g., "36.8"
    bpSys: string;  // 血圧（高）
    bpDia: string;  // 血圧（低）
    pr: string;     // 脈拍 (PR)
  };
}

export interface CareReport {
  id: string; // residentId_YYYY-MM-DD
  residentId: string;
  date: string; // YYYY-MM-DD
  morning: ShiftRecord | null;
  noon: ShiftRecord | null;
  night: ShiftRecord | null;
  yamamotoInstructions: {
    text: string;
    confirmed: boolean;
  };
  confirmedByDirector: boolean; // 施設長確認
}

export interface Resident {
  id: string;
  name: string;
  kana: string; // For alphabetical sorting
  roomNumber: string;
  careLevel?: string; // Care level (e.g. 要介護2)
  memo?: string;
}
