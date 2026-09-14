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

export type ShiftType = 'morning' | 'noon' | 'night';

export interface YamamotoInstructionSlot {
  text: string;
  confirmed: boolean;
}

export interface YamamotoInstructions {
  text?: string;
  confirmed?: boolean;
  morning?: YamamotoInstructionSlot;
  noon?: YamamotoInstructionSlot;
  night?: YamamotoInstructionSlot;
}

export interface CareReport {
  id: string; // residentId_YYYY-MM-DD
  residentId: string;
  date: string; // YYYY-MM-DD
  morning: ShiftRecord | null;
  noon: ShiftRecord | null;
  night: ShiftRecord | null;
  yamamotoInstructions?: YamamotoInstructions;
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

/**
 * Checks if a shift has actual recorded observation data (vitals, meals, symptoms, or notes).
 * Returns false if shift is null/undefined or if all fields are empty/cleared.
 */
export function hasShiftData(shift: ShiftRecord | null | undefined): boolean {
  if (!shift) return false;

  const hasVitals = !!(
    (shift.vitals?.kt && shift.vitals.kt.trim() !== '') ||
    (shift.vitals?.bpSys && shift.vitals.bpSys.trim() !== '') ||
    (shift.vitals?.bpDia && shift.vitals.bpDia.trim() !== '') ||
    (shift.vitals?.pr && shift.vitals.pr.trim() !== '')
  );
  if (hasVitals) return true;

  const hasMeals = !!(
    (shift.meals?.staple && shift.meals.staple.trim() !== '') ||
    (shift.meals?.side && shift.meals.side.trim() !== '') ||
    (shift.meals?.lacol && shift.meals.lacol.trim() !== '') ||
    (shift.meals?.water && shift.meals.water.trim() !== '')
  );
  if (hasMeals) return true;

  const hasCategories = !!(
    (shift.categories?.poorHealth && shift.categories.poorHealth.length > 0) ||
    (shift.categories?.injuryGait && shift.categories.injuryGait.length > 0) ||
    (shift.categories?.elimination && shift.categories.elimination.length > 0)
  );
  if (hasCategories) return true;

  const hasOtherText = !!(shift.otherSymptomText && shift.otherSymptomText.trim() !== '');
  if (hasOtherText) return true;

  return false;
}

/**
 * Get the Yamamoto instruction slot for a specific shift ('morning' | 'noon' | 'night').
 */
export function getShiftYamamotoInstruction(
  report: CareReport | null | undefined,
  shift: ShiftType
): YamamotoInstructionSlot {
  if (!report || !report.yamamotoInstructions) {
    return { text: '', confirmed: false };
  }
  const inst = report.yamamotoInstructions;
  const shiftSlot = inst[shift];
  if (shiftSlot && typeof shiftSlot === 'object') {
    return {
      text: shiftSlot.text || '',
      confirmed: !!shiftSlot.confirmed,
    };
  }
  return { text: '', confirmed: false };
}

/**
 * Checks if a CareReport has any Yamamoto instruction in morning, noon, night, or overall.
 */
export function hasAnyYamamotoInstruction(report: CareReport | null | undefined): boolean {
  if (!report || !report.yamamotoInstructions) return false;
  const inst = report.yamamotoInstructions;
  if (inst.text && inst.text.trim().length > 0) return true;
  if (inst.morning?.text && inst.morning.text.trim().length > 0) return true;
  if (inst.noon?.text && inst.noon.text.trim().length > 0) return true;
  if (inst.night?.text && inst.night.text.trim().length > 0) return true;
  return false;
}

/**
 * Checks if a CareReport contains at least one recorded shift or doctor instructions.
 */
export function hasReportData(report: CareReport | null | undefined): boolean {
  if (!report) return false;
  if (hasShiftData(report.morning)) return true;
  if (hasShiftData(report.noon)) return true;
  if (hasShiftData(report.night)) return true;
  if (hasAnyYamamotoInstruction(report)) return true;
  return false;
}
