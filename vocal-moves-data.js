/**
 * @typedef {Object} VocalMove
 * @property {string} id
 * @property {'breath'|'timbre'|'emotion'|'articulation'|'pitch'|'phrase'} category
 * @property {string} name
 * @property {string=} shortName
 * @property {string} description
 * @property {string} whyItMatters
 * @property {string} practiceGoal
 * @property {string[]} practiceTips
 * @property {{ songTitle: string, startTime: number, endTime: number, note?: string }[]=} examples
 */

const VOCAL_MOVE_CATEGORY_LABELS = {
  breath: '气息',
  timbre: '音色',
  emotion: '情绪',
  articulation: '咬字',
  pitch: '音高',
  phrase: '乐句',
};

/** @type {VocalMove[]} */
const VOCAL_MOVES = [
  {
    id: 'A1',
    category: 'phrase',
    name: 'A1 句尾轻收',
    shortName: '句尾轻收',
    description: '把句尾像羽毛一样放下来，不用硬切断。',
    whyItMatters: '很多“好听感”来自收尾。句尾轻了，整句会显得更松、更像在讲故事。',
    practiceGoal: '连续 3 次把句尾收轻，音量变小但气息不断。',
    practiceTips: ['先用“嗯”收尾，再换成歌词。', '最后一个字只留 60% 音量。', '收尾时不要憋住喉咙。'],
    examples: [{ songTitle: '任意慢歌副歌尾句', startTime: 42, endTime: 47, note: '听尾音怎么落地' }],
  },
  {
    id: 'A2',
    category: 'articulation',
    name: 'A2 起音不要冲',
    shortName: '起音不要冲',
    description: '第一个音先轻轻进来，不用一开口就撞出去。',
    whyItMatters: '起音太冲会让整句变紧。柔一点进入，后面更容易稳定。',
    practiceGoal: '用很小的入口唱第一秒，保持音高清楚。',
    practiceTips: ['先吸一口安静的气。', '开口前想“靠近”，不要想“冲出去”。', '录 5 秒就够，专看第一个音。'],
    examples: [{ songTitle: '任意主歌第一句', startTime: 8, endTime: 12 }],
  },
  {
    id: 'A3',
    category: 'breath',
    name: 'A3 出气量减半',
    shortName: '出气量减半',
    description: '用一半气唱同一句，听声音有没有更贴近。',
    whyItMatters: '气太多会让声音散掉。少一点气，声音更容易集中。',
    practiceGoal: '同一句唱两遍，第二遍只用一半气量。',
    practiceTips: ['先轻声说歌词，再唱。', '想象气流变细，不是变憋。', '如果声音消失，就只加一点点气。'],
    examples: [{ songTitle: '长句练习', startTime: 20, endTime: 26, note: '适合慢速长句' }],
  },
  {
    id: 'B1',
    category: 'timbre',
    name: 'B1 音色变轻',
    shortName: '音色变轻',
    description: '让声音少一点重量，多一点透明的空气感。',
    whyItMatters: '轻音色能降低心理压力，也更适合日常开嗓。',
    practiceGoal: '找到一个比平时轻 30% 的版本。',
    practiceTips: ['不要变小到没音高。', '脸部表情放软。', '用“mi”或“wu”试 3 次。'],
    examples: [{ songTitle: '轻声主歌', startTime: 15, endTime: 19 }],
  },
  {
    id: 'B2',
    category: 'pitch',
    name: 'B2 高音不喊',
    shortName: '高音不喊',
    description: '高音先保持轻薄，不通过加大音量冲上去。',
    whyItMatters: '高音一喊就容易紧。先学会轻轻到达，再慢慢加情绪。',
    practiceGoal: '高音处音量不突然变大，音色仍然轻。',
    practiceTips: ['把高音前一个字唱轻一点。', '先用假声边缘找到位置。', '只练高音前后 2 秒。'],
    examples: [{ songTitle: '副歌高点前后', startTime: 58, endTime: 63, note: '只截高点附近' }],
  },
  {
    id: 'B3',
    category: 'timbre',
    name: 'B3 保持透明感',
    shortName: '保持透明感',
    description: '声音像薄玻璃一样清楚，但不变硬。',
    whyItMatters: '透明感会让声音更干净，也方便后续做情绪变化。',
    practiceGoal: '唱 10 秒，保持清楚但不压喉。',
    practiceTips: ['音量保持中小。', '嘴型别过度撑开。', '听有没有“亮但刺”的感觉，刺就退一点。'],
    examples: [{ songTitle: '清亮尾句', startTime: 32, endTime: 38 }],
  },
  {
    id: 'C1',
    category: 'phrase',
    name: 'C1 句尾变弱',
    shortName: '句尾变弱',
    description: '同一句最后 1 秒慢慢变弱，而不是突然停。',
    whyItMatters: '渐弱会让乐句更有呼吸感，听起来更像完整表达。',
    practiceGoal: '句尾做出可听见的 1 秒渐弱。',
    practiceTips: ['先数“3、2、1”慢慢变小。', '不要让音准跟着掉太多。', '只练最后一个长音。'],
    examples: [{ songTitle: '任何长尾音', startTime: 45, endTime: 50 }],
  },
  {
    id: 'C2',
    category: 'emotion',
    name: 'C2 像在耳边说话',
    shortName: '耳边说话感',
    description: '把一句歌词唱得像轻轻靠近说出来。',
    whyItMatters: '亲近感不靠大音量，而靠距离感和咬字细节。',
    practiceGoal: '唱一句像只给一个人听。',
    practiceTips: ['先低声说一遍。', '保留一点气声边缘。', '每个字不要咬满。'],
    examples: [{ songTitle: '主歌低声句', startTime: 10, endTime: 16 }],
  },
  {
    id: 'C3',
    category: 'emotion',
    name: 'C3 脆弱感',
    shortName: '脆弱感',
    description: '允许声音有一点点轻和不满格，不急着证明自己。',
    whyItMatters: '脆弱感会让情绪更真实，也能帮助用户降低开口压力。',
    practiceGoal: '唱一句“不用满分”的版本，并保存一次喜欢的瞬间。',
    practiceTips: ['音量降到平时 70%。', '不要修饰太多颤音。', '听有没有像说真话。'],
    examples: [{ songTitle: '情绪弱起句', startTime: 24, endTime: 30 }],
  },
  {
    id: 'D1',
    category: 'articulation',
    name: 'D1 咬字柔化',
    shortName: '咬字柔化',
    description: '把硬边的字唱软一点，不让辅音抢走旋律。',
    whyItMatters: '咬字太硬会让歌变像朗读。柔化后旋律更连。',
    practiceGoal: '同一句里减少 3 个明显硬边。',
    practiceTips: ['先圈出最硬的字。', '辅音轻一点，元音多留一点。', '不要为了柔化而含糊整句。'],
    examples: [{ songTitle: '字多的主歌', startTime: 18, endTime: 24 }],
  },
  {
    id: 'D2',
    category: 'articulation',
    name: 'D2 元音拉长',
    shortName: '元音拉长',
    description: '把好听的部分放在元音上，让旋律有地方停留。',
    whyItMatters: '元音承载音高和音色，拉长后声音会更像在唱。',
    practiceGoal: '选一个字，把元音多留半秒。',
    practiceTips: ['先找这个字真正的元音。', '辅音短一点，元音长一点。', '拉长时保持口型稳定。'],
    examples: [{ songTitle: '副歌关键词', startTime: 50, endTime: 55 }],
  },
  {
    id: 'D3',
    category: 'articulation',
    name: 'D3 辅音不要太重',
    shortName: '辅音变轻',
    description: '辅音只负责开门，不负责把整句推倒。',
    whyItMatters: '辅音太重会打断气息和旋律。轻一点，句子会更顺。',
    practiceGoal: '把一句里最重的辅音减到一半。',
    practiceTips: ['先慢速念歌词。', '爆破音只做小入口。', '录两遍对比哪遍更连。'],
    examples: [{ songTitle: '辅音密集句', startTime: 12, endTime: 18 }],
  },
];

globalThis.VOCAL_MOVES = VOCAL_MOVES;
globalThis.VOCAL_MOVE_CATEGORY_LABELS = VOCAL_MOVE_CATEGORY_LABELS;
