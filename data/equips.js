/* ==========================================
   阿拉德战记 · 装备库（data/equips.js）
   ————————————————————————————————————————
   装备数据格式：
   slot: 部位（武器/上衣/下装/鞋子/腰带/项链）
   type: 武器/防具 | rarity: common(灰)/rare(蓝)/epic(紫)
   atk: 加攻击 | hp: 加生命 | def: 加防御
   ========================================== */

const EQUIPS = [
    /* ---------- 普通装备（common） ---------- */
    { name: "生锈的短剑",       slot: "武器", type: "武器", atk: 3,   rarity: "common" },
    { name: "哥布林的腰带",     slot: "腰带", type: "防具", hp: 10,   rarity: "common" },
    { name: "破旧的皮甲",       slot: "上衣", type: "防具", hp: 8,  def: 1, rarity: "common" },
    { name: "木制的护肩",       slot: "项链", type: "防具", hp: 6,  def: 1, rarity: "common" },
    { name: "粗铁短靴",         slot: "鞋子", type: "防具", hp: 5,  def: 1, rarity: "common" },
    { name: "破旧的皮裤",       slot: "下装", type: "防具", hp: 7,  def: 1, rarity: "common" },

    /* ---------- 稀有装备（rare） ---------- */
    { name: "暗黑皮甲",         slot: "上衣", type: "防具", hp: 20, def: 2, rarity: "rare" },
    { name: "洛兰的护肩",       slot: "项链", type: "防具", hp: 15, def: 3, rarity: "rare" },
    { name: "雷鸣战靴",         slot: "鞋子", type: "防具", hp: 12, def: 2, rarity: "rare" },
    { name: "精铁长剑",         slot: "武器", type: "武器", atk: 8,  rarity: "rare" },
    { name: "龙人的鳞片护甲",   slot: "上衣", type: "防具", hp: 28, def: 4, rarity: "rare" },
    { name: "天空之城的羽靴",   slot: "鞋子", type: "防具", hp: 18, def: 3, rarity: "rare" },
    { name: "暗黑城的长弓",     slot: "武器", type: "武器", atk: 12, rarity: "rare" },
    { name: "暗黑城护腿",       slot: "下装", type: "防具", hp: 22, def: 3, rarity: "rare" },

    /* ---------- 史诗装备（epic） ---------- */
    { name: "紫月太刀",         slot: "武器", type: "武器", atk: 10, rarity: "epic" },
    { name: "牛头王的巨斧",     slot: "武器", type: "武器", atk: 15, hp: -10, rarity: "epic" },
    { name: "洛兰王的战甲",     slot: "上衣", type: "防具", hp: 40, def: 5, rarity: "epic" },
    { name: "暗黑血之刃",       slot: "武器", type: "武器", atk: 22, hp: -15, rarity: "epic" },
    { name: "赛格哈特的光剑",   slot: "武器", type: "武器", atk: 25, rarity: "epic" },
    { name: "无头骑士的铠甲",   slot: "上衣", type: "防具", hp: 60, def: 8, rarity: "epic" },
    { name: "使徒之泪",         slot: "项链", type: "防具", hp: 50, def: 6, rarity: "epic" },
    { name: "狄瑞吉的瘟疫之刃", slot: "武器", type: "武器", atk: 30, hp: -20, rarity: "epic" }
];