import { CareReport, ShiftRecord } from '../types';

// Helper to create empty or pre-filled shifts
const createShift = (
  reporter: string,
  categories: { poorHealth?: string[]; injuryGait?: string[]; elimination?: string[] },
  otherSymptomText: string,
  meals: { staple: string; side: string; lacol: string; water: string },
  vitals: { kt: string; bpSys: string; bpDia: string; pr: string }
): ShiftRecord => ({
  reporter,
  categories: {
    poorHealth: categories.poorHealth || [],
    injuryGait: categories.injuryGait || [],
    elimination: categories.elimination || [],
  },
  otherSymptomText,
  meals,
  vitals,
});

export const initialReports: CareReport[] = [
  // --- 2026-07-05 REPORTS (Transcribed from handwritten sheets) ---

  // 1. 石山 喜美佐子 様 (res-01) - 2026-07-05
  {
    id: 'res-01_2026-07-05',
    residentId: 'res-01',
    date: '2026-07-05',
    morning: createShift(
      '吉田',
      { elimination: ['排泄失敗'] },
      '小便付着あり。着替え介助実施。',
      { staple: '10', side: '10', lacol: '', water: '120' },
      { kt: '37.2', bpSys: '124', bpDia: '76', pr: '78' }
    ),
    noon: createShift(
      '吉田',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '120' },
      { kt: '36.9', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      { poorHealth: ['その他'] },
      '居眠りが多いように感じられます。傾眠傾向。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.7', bpSys: '118', bpDia: '70', pr: '74' }
    ),
    yamamotoInstructions: {
      text: '日中の傾眠傾向に留意。排尿間隔を意識して声かけ。熱が37.5℃を超える場合は水分摂取を促し報告すること。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 2. 大西 一美 様 (res-02) - 2026-07-05
  {
    id: 'res-02_2026-07-05',
    residentId: 'res-02',
    date: '2026-07-05',
    morning: createShift(
      '吉田',
      {},
      '',
      { staple: '6', side: '3', lacol: '1', water: '150' },
      { kt: '36.2', bpSys: '130', bpDia: '82', pr: '80' }
    ),
    noon: createShift(
      '長島',
      {},
      '尿150cc確認。',
      { staple: '10', side: '10', lacol: '1', water: '150' },
      { kt: '36.5', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '夕食時、尿100ccほど確認。',
      { staple: '7', side: '4', lacol: '1', water: '100' },
      { kt: '36.4', bpSys: '122', bpDia: '78', pr: '76' }
    ),
    yamamotoInstructions: {
      text: 'ラコール注入後の体位維持を30分行うこと。嘔吐・逆流に注意。',
      confirmed: false,
    },
    confirmedByDirector: false,
  },

  // 3. 小木 祥子 様 (res-03) - 2026-07-05
  {
    id: 'res-03_2026-07-05',
    residentId: 'res-03',
    date: '2026-07-05',
    morning: createShift(
      '高井',
      {},
      '',
      { staple: '10', side: '10', lacol: '1', water: '150' },
      { kt: '36.6', bpSys: '110', bpDia: '68', pr: '72' }
    ),
    noon: createShift(
      '高井',
      {},
      '',
      { staple: '10', side: '10', lacol: '1', water: '150' },
      { kt: '36.8', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      { poorHealth: ['その他'] },
      '夕方に少し微熱あり、水分補給を実施。様子見。',
      { staple: '10', side: '10', lacol: '1', water: '150' },
      { kt: '37.1', bpSys: '114', bpDia: '70', pr: '75' }
    ),
    yamamotoInstructions: {
      text: '体温が37.5℃を超える場合は、クーリングと水分補給。ドクター指示待ち不要、38.0℃以上で屯用解熱剤。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 4. 児島 一栄 様 (res-04) - 2026-07-05
  {
    id: 'res-04_2026-07-05',
    residentId: 'res-04',
    date: '2026-07-05',
    morning: createShift(
      '高井',
      {},
      'ご自身で排便あったとのこと。調子良。',
      { staple: '10', side: '10', lacol: '', water: '200' },
      { kt: '36.4', bpSys: '135', bpDia: '80', pr: '70' }
    ),
    noon: createShift(
      '高井',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.3', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.5', bpSys: '128', bpDia: '76', pr: '72' }
    ),
    yamamotoInstructions: {
      text: '',
      confirmed: false,
    },
    confirmedByDirector: false,
  },

  // 5. 久田 銀次 様 (res-05) - 2026-07-05
  {
    id: 'res-05_2026-07-05',
    residentId: 'res-05',
    date: '2026-07-05',
    morning: createShift(
      '吉田',
      {},
      '尿量1600cc、順調。',
      { staple: '10', side: '10', lacol: '', water: '300' },
      { kt: '36.9', bpSys: '120', bpDia: '74', pr: '68' }
    ),
    noon: createShift(
      '吉田',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '200' },
      { kt: '36.6', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '夕食後、尿量600cc。トータル2200ccで良好。',
      { staple: '10', side: '10', lacol: '', water: '250' },
      { kt: '36.7', bpSys: '118', bpDia: '72', pr: '66' }
    ),
    yamamotoInstructions: {
      text: '尿流出量・排尿量の維持が肝要。水分補給は多めに継続。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 6. 松田 悦子 様 (res-09) - 2026-07-05
  {
    id: 'res-09_2026-07-05',
    residentId: 'res-09',
    date: '2026-07-05',
    morning: createShift(
      '長島',
      { elimination: ['排泄失敗'] },
      'ご自身で排便を拭かれたようで、ペーパーが少し湿っていた。ゲルタシン軟膏塗布。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.8', bpSys: '126', bpDia: '78', pr: '72' }
    ),
    noon: createShift(
      '長島',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.6', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '陰部清拭実施、おむつ交換。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.7', bpSys: '120', bpDia: '74', pr: '70' }
    ),
    yamamotoInstructions: {
      text: '排泄時の皮膚びらんに留意。ゲルタシンは毎朝夕に塗布のこと。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 7. 松田 留子 様 (res-10) - 2026-07-05
  {
    id: 'res-10_2026-07-05',
    residentId: 'res-10',
    date: '2026-07-05',
    morning: createShift(
      '長島',
      { poorHealth: ['その他'] },
      'ゲンタシン塗布。陰部びらんが一部しみると仰る。注意深く清拭。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.5', bpSys: '116', bpDia: '72', pr: '76' }
    ),
    noon: createShift(
      '長島',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '120' },
      { kt: '36.4', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '夜清拭時、びらんの一部がまだ少し赤みあり。しみる感覚は和らいだとのこと。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.6', bpSys: '112', bpDia: '70', pr: '74' }
    ),
    yamamotoInstructions: {
      text: '陰部びらんへのゲンタシン塗布継続。痛みが強い場合はワセリン保護も検討。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 8. 横江 八重子 様 (res-12) - 2026-07-05
  {
    id: 'res-12_2026-07-05',
    residentId: 'res-12',
    date: '2026-07-05',
    morning: createShift(
      '吉田',
      { poorHealth: ['食子がとれない'], injuryGait: ['歩行困難'] },
      'ラコール1P注入。お茶50cc、みたらし30g食べこぼしあり。1P 150cc（おかゆ7割、自力と一部介助）。',
      { staple: '7', side: '3', lacol: '1', water: '50' },
      { kt: '36.8', bpSys: '138', bpDia: '84', pr: '82' }
    ),
    noon: createShift(
      '吉田',
      {},
      'おかゆ5割。ゆっくり召し上がられる。',
      { staple: '5', side: '3', lacol: '', water: '80' },
      { kt: '36.6', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      { poorHealth: ['その他'] },
      '夕食おかゆ4割、ラコール1P。水分100ccほど。少し発熱気味 37.1℃。',
      { staple: '4', side: '2', lacol: '1', water: '100' },
      { kt: '37.1', bpSys: '132', bpDia: '80', pr: '86' }
    ),
    yamamotoInstructions: {
      text: '食事・ラコールの食べこぼし、誤嚥に注意。夜間の微熱は水分を補給して様子観察。',
      confirmed: false,
    },
    confirmedByDirector: false,
  },

  // 9. 西川 茂 様 (res-08) - 2026-07-05
  {
    id: 'res-08_2026-07-05',
    residentId: 'res-08',
    date: '2026-07-05',
    morning: createShift(
      '高井',
      { elimination: ['便が出ない'] },
      '便（-）、B型下剤(+)投与。食事8割。',
      { staple: '8', side: '8', lacol: '', water: '150' },
      { kt: '36.3', bpSys: '124', bpDia: '78', pr: '70' }
    ),
    noon: createShift(
      '高井',
      {},
      '便（-）。食事10割。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.4', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '便（-）。食事10割。',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.6', bpSys: '120', bpDia: '76', pr: '72' }
    ),
    yamamotoInstructions: {
      text: '丸3日排便がない場合はレシカルボン坐薬を使用のこと。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 10. 中野 ひで子 様 (res-07) - 2026-07-05
  {
    id: 'res-07_2026-07-05',
    residentId: 'res-07',
    date: '2026-07-05',
    morning: createShift(
      '吉田',
      {},
      '尿汚れなし確認。',
      { staple: '10', side: '10', lacol: '', water: '200' },
      { kt: '36.4', bpSys: '122', bpDia: '78', pr: '74' }
    ),
    noon: createShift(
      '吉田',
      {},
      '食事10/9割。',
      { staple: '10', side: '9', lacol: '', water: '150' },
      { kt: '36.5', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.5', bpSys: '118', bpDia: '76', pr: '72' }
    ),
    yamamotoInstructions: {
      text: '',
      confirmed: false,
    },
    confirmedByDirector: false,
  },

  // 11. 村田 律子 様 (res-11) - 2026-07-05
  {
    id: 'res-11_2026-07-05',
    residentId: 'res-11',
    date: '2026-07-05',
    morning: createShift(
      '長島',
      { poorHealth: ['その他'] },
      'ラコール1P投与。少し微熱 37.1℃。',
      { staple: '10', side: '8', lacol: '1', water: '150' },
      { kt: '37.1', bpSys: '116', bpDia: '72', pr: '78' }
    ),
    noon: createShift(
      '長島',
      {},
      'ラコール1P投与。',
      { staple: '10', side: '8', lacol: '1', water: '150' },
      { kt: '36.8', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      'ラコール1P投与。熱下がり36.8℃。',
      { staple: '10', side: '7', lacol: '1', water: '150' },
      { kt: '36.8', bpSys: '120', bpDia: '75', pr: '74' }
    ),
    yamamotoInstructions: {
      text: '主食は完食維持。ラコール注入は規定ペースを守り、胃もたれに配慮。',
      confirmed: true,
    },
    confirmedByDirector: true,
  },

  // 12. 宍戸 洋子 様 (res-06) - 2026-07-05
  {
    id: 'res-06_2026-07-05',
    residentId: 'res-06',
    date: '2026-07-05',
    morning: createShift(
      '長島',
      {},
      '特変なし。安定。',
      { staple: '10', side: '10', lacol: '', water: '200' },
      { kt: '36.8', bpSys: '128', bpDia: '80', pr: '72' }
    ),
    noon: createShift(
      '長島',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.6', bpSys: '', bpDia: '', pr: '' }
    ),
    night: createShift(
      '長島',
      {},
      '',
      { staple: '10', side: '10', lacol: '', water: '150' },
      { kt: '36.7', bpSys: '122', bpDia: '76', pr: '70' }
    ),
    yamamotoInstructions: {
      text: '',
      confirmed: false,
    },
    confirmedByDirector: false,
  },


  // --- HISTORICAL REPORTS FOR TREND GRAPHS (res-01, res-03, res-12) ---
  // Let's create beautiful 5-day historical trend data for "横江 八重子" (res-12) and "小木 祥子" (res-03) and "石山 奇美佐子" (res-01)
  // For other days: 2026-07-01 to 2026-07-04

  // res-12 (横江 八重子) - Historical (Declining trend in eating, increasing body temp)
  {
    id: 'res-12_2026-07-04',
    residentId: 'res-12',
    date: '2026-07-04',
    morning: createShift('吉田', {}, '', { staple: '8', side: '5', lacol: '1', water: '100' }, { kt: '36.6', bpSys: '135', bpDia: '82', pr: '78' }),
    noon: createShift('吉田', {}, '', { staple: '7', side: '4', lacol: '', water: '100' }, { kt: '36.5', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '6', side: '4', lacol: '1', water: '120' }, { kt: '36.9', bpSys: '130', bpDia: '80', pr: '82' }),
    yamamotoInstructions: { text: '少し食欲減退。様子観察。', confirmed: true },
    confirmedByDirector: true,
  },
  {
    id: 'res-12_2026-07-03',
    residentId: 'res-12',
    date: '2026-07-03',
    morning: createShift('吉田', {}, '', { staple: '10', side: '8', lacol: '1', water: '150' }, { kt: '36.5', bpSys: '130', bpDia: '80', pr: '76' }),
    noon: createShift('吉田', {}, '', { staple: '8', side: '6', lacol: '', water: '100' }, { kt: '36.4', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '8', side: '6', lacol: '1', water: '150' }, { kt: '36.7', bpSys: '128', bpDia: '78', pr: '74' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },
  {
    id: 'res-12_2026-07-02',
    residentId: 'res-12',
    date: '2026-07-02',
    morning: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '1', water: '200' }, { kt: '36.4', bpSys: '128', bpDia: '78', pr: '72' }),
    noon: createShift('吉田', {}, '', { staple: '10', side: '9', lacol: '', water: '150' }, { kt: '36.3', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '9', side: '8', lacol: '1', water: '180' }, { kt: '36.5', bpSys: '124', bpDia: '75', pr: '72' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },
  {
    id: 'res-12_2026-07-01',
    residentId: 'res-12',
    date: '2026-07-01',
    morning: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '1', water: '250' }, { kt: '36.3', bpSys: '125', bpDia: '75', pr: '70' }),
    noon: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '', water: '150' }, { kt: '36.2', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '10', side: '10', lacol: '1', water: '200' }, { kt: '36.4', bpSys: '122', bpDia: '74', pr: '68' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },

  // res-03 (小木 祥子) - Historical (Vitals fluctuate a bit)
  {
    id: 'res-03_2026-07-04',
    residentId: 'res-03',
    date: '2026-07-04',
    morning: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.5', bpSys: '112', bpDia: '70', pr: '70' }),
    noon: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.6', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.8', bpSys: '114', bpDia: '72', pr: '74' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },
  {
    id: 'res-03_2026-07-03',
    residentId: 'res-03',
    date: '2026-07-03',
    morning: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.7', bpSys: '115', bpDia: '72', pr: '72' }),
    noon: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.8', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', { poorHealth: ['発熱'] }, '夕方37.6℃発熱あり。氷枕実施。', { staple: '10', side: '10', lacol: '1', water: '200' }, { kt: '37.6', bpSys: '118', bpDia: '74', pr: '80' }),
    yamamotoInstructions: { text: '夕方の発熱時クーリング指示。', confirmed: true },
    confirmedByDirector: true,
  },
  {
    id: 'res-03_2026-07-02',
    residentId: 'res-03',
    date: '2026-07-02',
    morning: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.4', bpSys: '108', bpDia: '66', pr: '68' }),
    noon: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.5', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.6', bpSys: '110', bpDia: '68', pr: '70' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },
  {
    id: 'res-03_2026-07-01',
    residentId: 'res-03',
    date: '2026-07-01',
    morning: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '200' }, { kt: '36.3', bpSys: '110', bpDia: '68', pr: '70' }),
    noon: createShift('高井', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.5', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '', { staple: '10', side: '10', lacol: '1', water: '150' }, { kt: '36.5', bpSys: '112', bpDia: '70', pr: '72' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },

  // res-01 (石山 奇美佐子) - Historical
  {
    id: 'res-01_2026-07-04',
    residentId: 'res-01',
    date: '2026-07-04',
    morning: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '', water: '150' }, { kt: '36.9', bpSys: '122', bpDia: '76', pr: '74' }),
    noon: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '', water: '150' }, { kt: '36.8', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '尿失禁なし、穏やかに就寝。', { staple: '10', side: '10', lacol: '', water: '120' }, { kt: '36.6', bpSys: '116', bpDia: '72', pr: '70' }),
    yamamotoInstructions: { text: '', confirmed: false },
    confirmedByDirector: true,
  },
  {
    id: 'res-01_2026-07-03',
    residentId: 'res-01',
    date: '2026-07-03',
    morning: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '', water: '150' }, { kt: '37.0', bpSys: '124', bpDia: '78', pr: '76' }),
    noon: createShift('吉田', {}, '', { staple: '10', side: '10', lacol: '', water: '100' }, { kt: '36.7', bpSys: '', bpDia: '', pr: '' }),
    night: createShift('長島', {}, '少し眠そうにされている。', { staple: '10', side: '10', lacol: '', water: '150' }, { kt: '36.5', bpSys: '118', bpDia: '74', pr: '72' }),
    yamamotoInstructions: { text: '傾眠時はバイタル測定。', confirmed: true },
    confirmedByDirector: true,
  }
];
