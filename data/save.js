/* ==========================================
   阿拉德战记 · 存档系统（data/save.js）
   ————————————————————————————————————————
   规则：
   · 存档号 = 字母 + 数字，玩家手动输入
   · 最多 5 个存档位
   · 数据保存在浏览器 localStorage 里
   ========================================== */

var SAVE_KEY = 'alade_saves';
var MAX_SAVES = 5;

/* ---------- 读取所有存档 ---------- */
function loadAllSaves() {
    try {
        var raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

/* ---------- 写入所有存档 ---------- */
function saveAllSaves(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

/* ---------- 校验存档号 ---------- */
function isValidSaveId(id) {
    /* 只允许字母和数字，长度 2-20 位 */
    if (!id) return false;
    return /^[A-Za-z0-9]{2,20}$/.test(id);
}

/* ---------- 保存某个存档 ---------- */
function saveGame(id, gameState) {
    var all = loadAllSaves();
    var existing = Object.keys(all);

    /* 如果这是新档，且已满 5 个，拒绝 */
    if (!all[id] && existing.length >= MAX_SAVES) {
        return { ok: false, msg: '存档位已满（最多 ' + MAX_SAVES + ' 个），请先删除一个旧档。' };
    }

    all[id] = {
        lv: gameState.lv,
        baseHp: gameState.baseHp,
        baseMp: gameState.baseMp,
        baseAtk: gameState.baseAtk,
        baseDef: gameState.baseDef,
        hp: gameState.hp,
        mp: gameState.mp,
        exp: gameState.exp,
        nextExp: gameState.nextExp,
        gold: gameState.gold,
        bag: gameState.bag,
        equipped: gameState.equipped,
        dungeon: gameState.dungeon,
        savedAt: new Date().toLocaleString('zh-CN')
    };
    saveAllSaves(all);
    return { ok: true, msg: '已保存存档【' + id + '】' };
}

/* ---------- 读取某个存档 ---------- */
function loadGame(id) {
    var all = loadAllSaves();
    if (!all[id]) {
        return { ok: false, msg: '没有找到存档【' + id + '】' };
    }
    return { ok: true, data: all[id] };
}

/* ---------- 删除某个存档 ---------- */
function deleteSave(id) {
    var all = loadAllSaves();
    if (!all[id]) {
        return { ok: false, msg: '没有找到存档【' + id + '】' };
    }
    delete all[id];
    saveAllSaves(all);
    return { ok: true, msg: '已删除存档【' + id + '】' };
}

/* ---------- 获取存档列表（给界面展示） ---------- */
function listSaves() {
    var all = loadAllSaves();
    var list = [];
    for (var id in all) {
        list.push({
            id: id,
            lv: all[id].lv,
            dungeon: all[id].dungeon,
            savedAt: all[id].savedAt
        });
    }
    return list;
}