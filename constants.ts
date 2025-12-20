import { EnvelopeData, TreeCoordinate } from './types';

// ==========================================
// 🎨 COLOR PALETTE (Extracted from Reference)
// ==========================================
// Use these in App.tsx for consistent theming
export const COLORS = {
  sunsetOrange: '#FFAD66', // Top of sky
  deepPineGreen: '#2C5F68', // Trees
  scarfRed: '#D94C23',      // Character scarf (Accent)
  snowShadow: '#B8C8D9',    // Snow shadows
  nightBlue: '#1a262e',     // Solid background for Tree Assembly
  cream: '#FFF8E7',         // Envelope body
  wood: '#5C4033'           // Envelope borders
};

// ==========================================
// 🖼️ BACKGROUND IMAGES
// ==========================================

// 1. 封面图 (Cover Image)
export const COVER_BG_IMAGE = "https://youke2.picui.cn/s1/2025/12/20/6946745ba2aa8.jpg"; 

// 2. 游戏主背景图 (Game Background)
export const GAME_BG_IMAGE = "https://free.picui.cn/free/2025/12/20/69457a278fb51.png";

// 3. 年度回顾插图 (Appears before assembly) - 请替换为你的年度总结图片
export const YEAR_REVIEW_IMAGE = "https://youke2.picui.cn/s1/2025/12/20/69468a4ee2a0f.png"; 


// ==========================================
// 💌 12 MEMORY LETTERS
// ==========================================

export const ENVELOPES: EnvelopeData[] = [
  { 
    id: 1, 
    title: "Jan", 
    message: "你第一次告诉我：觉得认识我是很幸运的事。 那时候你肯定没想到，我是一块这么粘人的橡皮糖吧？😛", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/694577888e227.png", 
    scale: 0.9 
  },
  { 
    id: 2, 
    title: "Feb", 
    message: "承认吧，在 LD这一块我也是个小天才。 虽然……显然你有点 overuse这个技能了。😒", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/6945778b6080a.png", 
    scale: 1.1 
  },
  { 
    id: 3, 
    title: "Mar", 
    message: "我这位深得神灵喜欢的天使，又让你赚大发了🙏。（提醒你对我好点😊）", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/6945778ad4e9b.png", 
    scale: 0.8 
  },
  { 
    id: 4, 
    title: "Apr", 
    message: "到底是什么神金恋爱脑千里送爱（P）， 到底你悄悄搞了什么隐藏皮肤，千里吸人？\nPs. 你说要帮我谈离婚协议，真是我在世界上第一次感到被男人“撑腰”（吓死你😱）", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/6945778bb2a23.png", 
    scale: 1.2 
  },
  { 
    id: 5, 
    title: "May", 
    message: "我敢保证，世界上没有第二对“奔四高知都市精英”能这么甜腻了。秦始皇给我端茶送水，武则天向你撒娇卖萌，两大顶级剧本合并！", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/6945778bb7393.png", 
    scale: 1.0 
  },
  { 
    id: 6, 
    title: "Jun", 
    message: "我宣布，现在开始6月是我的幸运月！因为6月的你，看起来最爱我😭", 
    imageUrl: "https://free.picui.cn/free/2025/12/20/69457b416a7a2.png", 
    scale: 0.85 
  },
  { 
    id: 7, 
    title: "Jul", 
    message: "而 7 月呢…… 大概以后就是我的恶魔月吧。", 
    imageUrl: "https://free.picui.cn/free/2025/12/20/69457b420dd44.png", 
    scale: 1.15 
  },
  { 
    id: 8, 
    title: "Aug", 
    message: "如果按衰老速度计算，这个月我们起码“多”在一起了两年。 全是那些破碎的夜晚熬出来的。 Love hurts, literally. 💔", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/694578ea85d9d.png", 
    scale: 0.95 
  },
  { 
    id: 9, 
    title: "Sep", 
    message: "你知道吗？我的 杏仁核在这个月格外伟大。 经过 1 个月的浴血奋战，他终于干翻了 前额叶。 他把我安排得明明白白：跪着回去找你。🏳️", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/694676bb4e0b3.png", 
    scale: 1.1 
  },
  { 
    id: 10, 
    title: "Oct", 
    message: "但是呢，杏仁核这家伙真的没什么当老大的天赋。 让他统治我……准会出事，不是吗？", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/694676bb3fb59.png", 
    scale: 0.9 
  },
  { 
    id: 11, 
    title: "Nov", 
    message: "不管了，让他俩打架吧。 你也陪我一起看他们厮杀吧。 理智也好，疯魔也好，他们都是我的一部分。 请不要偏爱任何一方，拜托了。🙏", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/694578eaa03f0.png", 
    scale: 1.2 
  },
  { 
    id: 12, 
    title: "Dec", 
    message: "老天一定是公平的。放开你的我，高低会越来越美丽和闪耀✨ 而那个包容爱护我的你，也会哦～", 
    imageUrl: "https://youke2.picui.cn/s1/2025/12/20/694578e931bc6.png", 
    scale: 1.0 
  },
];

// Scatter Coordinates for the "Collecting" Phase
// Note: We are now using random generation in App.tsx, but keeping this type structure valid.
export const SCATTER_COORDINATES: TreeCoordinate[] = [];

// Coordinates for the Christmas Tree shape (ADJUSTED FOR STAR & SIZE)
// Shifted down (Starting Y: 25 instead of 20) and compacted slightly (10 gap instead of 12)
export const TREE_COORDINATES: TreeCoordinate[] = [
  // 1. TOP TIP
  { id: 1, x: 50, y: 25 }, 
  
  // 2. SECOND ROW (2 items)
  { id: 2, x: 42, y: 35 }, { id: 3, x: 58, y: 35 }, 
  
  // 3. THIRD ROW (3 items)
  { id: 4, x: 34, y: 45 }, { id: 5, x: 50, y: 45 }, { id: 6, x: 66, y: 45 }, 

  // 4. FOURTH ROW (4 items - Widest part)
  { id: 7, x: 26, y: 55 }, { id: 8, x: 42, y: 55 }, { id: 9, x: 58, y: 55 }, { id: 10, x: 74, y: 55 }, 
  
  // 5. BASE / TRUNK AREA (2 items)
  { id: 11, x: 44, y: 65 }, { id: 12, x: 56, y: 65 } 
];