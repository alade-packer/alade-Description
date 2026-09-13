/* ==========================================
   阿拉德战记 · 游戏引擎（第二阶段修复版）
   ————————————————————————————————————————
   修复：
   · 死亡螺旋（回城 30% HP，扣 20% 金币）
   · 副本独立掉落池
   · BOSS 概率 10% → 4%
   · 银光落刃眩晕实现
   · 背包可卖 / 丢
   · 读档数值兜底
   · 怪物图 SVG 占位
   · 首次触摸唤醒 AudioContext
   ========================================== */

/* ---------- 全局状态 ---------- */
var S = {
    lv: 1,
    baseHp: 100, baseMp: 50, baseAtk: 8, baseDef: 0,
    hp: 100, mp: 50,
    exp: 0, nextExp: 30,
    gold: 0,
    bag: [],
    equipped: {
        "武器": null, "上衣": null, "下装": null,
        "鞋子": null, "腰带": null, "项链": null
    },
    inBattle: false,
    monster: null,
    dungeon: "洛兰",
    /* ★ 眩晕状态：记录被眩晕的怪物剩余回合 */
    monsterStunTurns: 0
};

/* ---------- 工具函数 ---------- */
function $(id) { return document.getElementById(id); }

/* ---------- 怪物立绘映射表 ---------- */
var MONSTER_IMG = {
    "哥布林":               "img/goblin.jpg",
    "暗黑哥布林":           "img/dark_goblin.jpg",
    "牛头兵":               "img/bull.jpg",
    "洛兰之王":             "img/luolan_boss.jpg",
    "暗黑雷鸣废墟·守卫":    "img/lei_guard.jpg",
    "暗黑雷鸣废墟·狂战士":  "img/lei_berserker.jpg",
    "暗黑雷鸣废墟·领主":    "img/lei_boss.jpg",
    "龙人":                 "img/dragon.jpg",
    "龙人·精锐":            "img/dragon_elite.jpg",
    "天空之城·守卫":        "img/sky_guard.jpg",
    "光之城主·赛格哈特":    "img/seg.jpg",
    "暗黑城·僵尸":          "img/zombie.jpg",
    "暗黑城·盗尸者":        "img/ghoul.jpg",
    "暗黑城·骷髅兵":        "img/skeleton.jpg",
    "暗黑城·无头骑士":      "img/death_knight.jpg",
    "使徒·狄瑞吉":          "img/direjie.jpg"
};

/* ---------- SVG 占位图（没有怪物图时的兜底） ---------- */
var PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">' +
    '<rect width="800" height="400" fill="#0a0d14"/>' +
    '<text x="400" y="200" font-size="48" fill="#3a3a4a" text-anchor="middle" font-family="sans-serif">?</text>' +
    '<text x="400" y="250" font-size="18" fill="#3a3a4a" text-anchor="middle" font-family="sans-serif">尚未收录立绘</text>' +
    '</svg>'
);

/* ---------- 获取怪物立绘（缺图回退到 SVG 占位） ---------- */
function getMonsterImg(name) {
    return MONSTER_IMG[name] || PLACEHOLDER_SVG;
}

/* ---------- 切换顶部场景图 ---------- */
function setScene(imgSrc, tagText) {
    var img = $('scene-img');
    var tag = $('scene-tag');
    if (img) img.src = imgSrc;
    if (tag) tag.textContent = tagText;
}

/* ---------- 计算属性 ---------- */
function curStats() {
    var atk = S.baseAtk, def = S.baseDef, maxHp = S.baseHp, maxMp = S.baseMp;
    for (var slot in S.equipped) {
        var item = S.equipped[slot];
        if (!item) continue;
        if (item.atk) atk += item.atk;
        if (item.def) def += item.def;
        if (item.hp) maxHp += item.hp;
        if (item.mp) maxMp += item.mp;
    }
    return { atk: atk, def: def, maxHp: maxHp, maxMp: maxMp };
}

/* ---------- 更新状态栏 ---------- */
function updateUI() {
    var st = curStats();
    if (S.hp > st.maxHp) S.hp = st.maxHp;
    if (S.mp > st.maxMp) S.mp = st.maxMp;

    $('lv').textContent = 'Lv.' + S.lv;
    $('hp-fill').style.width = Math.max(0, S.hp / st.maxHp * 100) + '%';
    $('hp-text').textContent = Math.max(0, S.hp) + '/' + st.maxHp;
    $('mp-fill').style.width = Math.max(0, S.mp / st.maxMp * 100) + '%';
    $('mp-text').textContent = Math.max(0, S.mp) + '/' + st.maxMp;
    $('gold').textContent = S.gold;

    var bagHtml = '';
    for (var i = 0; i < S.bag.length; i++) {
        var item = S.bag[i];
        bagHtml += '<div class="bag-item ' + item.rarity + '">' +
            '<span onclick="equipItem(' + i + ')" style="cursor:pointer">' + item.name + '</span>' +
            ' <span onclick="sellItem(' + i + ')" style="color:#d4af37;cursor:pointer;margin-left:4px" title="出售">💰</span>' +
            ' <span onclick="dropItem(' + i + ')" style="color:#8a8580;cursor:pointer" title="丢弃">🗑</span>' +
            '</div>';
    }
    $('bag').innerHTML = bagHtml || '<span style="color:#555;font-size:11px">（空）</span>';
}

/* ---------- 通用画面显示 ---------- */
function show(text, choices) {
    $('screen').innerHTML = text;
    $('actions').innerHTML = '';
    for (var i = 0; i < choices.length; i++) {
        var c = choices[i];
        var b = document.createElement('button');
        b.className = 'btn';
        b.textContent = c.t;
        b.onclick = function (fn) {
            return function () {
                /* ★ 首次点击唤醒音频 */
                if (typeof BGM !== 'undefined' && BGM.unlock) BGM.unlock();
                fn();
            };
        }(c.a);
        if (c.disabled) {
            b.classList.add('disabled');
            b.disabled = true;
        }
        $('actions').appendChild(b);
    }
}

/* ==========================================
   城镇
   ========================================== */
function town() {
    setScene('img/town.jpg', '城镇 · 铁匠铺');

    var st = curStats();
    var text = '【城镇】\n\n你回到了城镇。铁匠铺的火光还在燃烧。\n先休息一下，再选择下一个要挑战的区域。\n\n当前等级：Lv.' + S.lv + '\nHP：' + S.hp + ' / ' + st.maxHp + '\nMP：' + S.mp + ' / ' + st.maxMp;

    var choices = [];
    var keys = Object.keys(DUNGEONS);
    for (var i = 0; i < keys.length; i++) {
        (function (key) {
            choices.push({
                t: '▶ ' + key + ' —— ' + DUNGEONS[key].desc,
                a: function () { S.dungeon = key; enterDungeon(); }
            });
        })(keys[i]);
    }

    choices.push({ t: '▶ 查看角色属性', a: showStats });
    choices.push({ t: '▶ 查看装备栏', a: showEquipment });
    choices.push({ t: '▶ ⚙ 设置', a: showSettings });
    choices.push({ t: '▶ 恢复 HP / MP（30 金币）', a: rest, disabled: S.gold < 30 });

    show(text, choices);
}

/* ---------- 开局 ---------- */
function startGame() {
    if (typeof BGM !== 'undefined' && !BGM.isPlaying) BGM.start();
    town();
}

/* ==========================================
   查看属性
   ========================================== */
function showStats() {
    var st = curStats();
    show(
        '【角色属性】\n\n' +
        '等级：' + S.lv + '\n' +
        '经验：' + S.exp + ' / ' + S.nextExp + '\n' +
        'HP：' + S.hp + ' / ' + st.maxHp + '\n' +
        'MP：' + S.mp + ' / ' + st.maxMp + '\n' +
        '攻击：' + st.atk + '\n' +
        '防御：' + st.def + '\n' +
        '金币：' + S.gold + '\n' +
        '当前区域：' + S.dungeon,
        [{ t: '◀ 返回城镇', a: town }]
    );
}

/* ==========================================
   查看装备栏
   ========================================== */
function showEquipment() {
    var text = '【装备栏】\n\n';
    for (var slot in S.equipped) {
        var item = S.equipped[slot];
        if (item) {
            text += slot + '：' + item.name;
            if (item.atk) text += '（攻击 +' + item.atk + '）';
            if (item.def) text += '（防御 +' + item.def + '）';
            if (item.hp) text += '（生命 ' + (item.hp > 0 ? '+' : '') + item.hp + '）';
            text += '\n';
        } else {
            text += slot + '：（空）\n';
        }
    }
    var st = curStats();
    text += '\n————————————\n总攻击：' + st.atk + '\n总防御：' + st.def + '\n最大 HP：' + st.maxHp + '\n最大 MP：' + st.maxMp;
    show(text, [{ t: '◀ 返回城镇', a: town }]);
}

/* ==========================================
   设置
   ========================================== */
function showSettings() {
    var vol = (typeof SETTINGS !== 'undefined') ? SETTINGS.volume : 50;
    var theme = (typeof SETTINGS !== 'undefined') ? SETTINGS.theme : 'dark';
    var currentTrack = (typeof BGM !== 'undefined' && BGM.currentMusicId) ? BGM.currentMusicId : '（合成音效）';

    var text = '【设置】\n\n' +
        '当前音量：' + vol + '%\n' +
        '当前主题：' + (theme === 'dark' ? '暗黑' : '光明') + '\n' +
        '当前 BGM：' + currentTrack;

    var choices = [
        { t: '🔉 音量 -10%', a: function () { SETTINGS.setVolume(SETTINGS.volume - 10); showSettings(); } },
        { t: '🔊 音量 +10%', a: function () { SETTINGS.setVolume(SETTINGS.volume + 10); showSettings(); } },
        { t: '🎨 切换主题', a: function () { SETTINGS.setTheme(SETTINGS.theme === 'dark' ? 'light' : 'dark'); showSettings(); } },
        { t: '🎵 切换 BGM', a: showMusicPanel },
        { t: '💾 存档 / 读档', a: showSavePanel },
        { t: '◀ 返回城镇', a: town }
    ];
    show(text, choices);
}

/* ---------- BGM 曲库面板 ---------- */
function showMusicPanel() {
    var text = '【BGM 曲库】\n\n请选择一首曲子：\n';
    var choices = [];

    if (typeof MUSIC_LIST !== 'undefined') {
        for (var i = 0; i < MUSIC_LIST.length; i++) {
            (function (track) {
                var isPlaying = (BGM.currentMusicId === track.id) ? '  【正在播放】' : '';
                choices.push({
                    t: '🎵 ' + track.name + isPlaying,
                    a: function () {
                        BGM.playFile(track.id);
                        if (typeof SETTINGS !== 'undefined') BGM.setVolume(SETTINGS.volume);
                        showMusicPanel();
                    }
                });
            })(MUSIC_LIST[i]);
        }
    }

    choices.push({ t: '🎹 用合成音效（默认）', a: function () {
        BGM.startSynth();
        if (typeof SETTINGS !== 'undefined') BGM.setVolume(SETTINGS.volume);
        showMusicPanel();
    }});
    choices.push({ t: '◀ 返回设置', a: showSettings });

    show(text, choices);
}

/* ==========================================
   存档管理
   ========================================== */
function showSavePanel() {
    var saves = (typeof listSaves === 'function') ? listSaves() : [];
    var text = '【存档管理】\n\n';
    text += '存档位：' + saves.length + ' / 5\n\n';

    if (saves.length === 0) {
        text += '（暂无存档）\n';
    } else {
        for (var i = 0; i < saves.length; i++) {
            var s = saves[i];
            text += '📁 ' + s.id + ' ｜ Lv.' + s.lv + ' ｜ ' + s.dungeon + '\n';
        }
    }
    text += '\n请选择操作：';

    var choices = [
        { t: '💾 保存到新档', a: doSave },
        { t: '📂 读取存档', a: doLoad },
        { t: '🗑 删除存档', a: doDelete },
        { t: '◀ 返回设置', a: showSettings }
    ];
    show(text, choices);
}

function doSave() {
    var all = loadAllSaves();
    if (Object.keys(all).length >= 5) {
        alert('存档位已满（最多 5 个），请先删除旧档。');
        showSavePanel();
        return;
    }
    var id = prompt('请输入存档号（字母 + 数字，2-20 位）：');
    if (!id) { showSavePanel(); return; }
    if (!isValidSaveId(id)) { alert('格式不对！只能字母和数字，2-20 位。'); showSavePanel(); return; }

    var result = saveGame(id, S);
    alert(result.msg);
    showSavePanel();
}

function doLoad() {
    var id = prompt('请输入要读取的存档号：');
    if (!id) { showSavePanel(); return; }

    var result = loadGame(id);
    if (!result.ok) { alert(result.msg); showSavePanel(); return; }

    var d = result.data;

    /* ★ 兜底：所有数值字段都给默认值 */
    S.lv       = (typeof d.lv === 'number') ? d.lv : 1;
    S.baseHp   = (typeof d.baseHp === 'number') ? d.baseHp : 100;
    S.baseMp   = (typeof d.baseMp === 'number') ? d.baseMp : 50;
    S.baseAtk  = (typeof d.baseAtk === 'number') ? d.baseAtk : 8;
    S.baseDef  = (typeof d.baseDef === 'number') ? d.baseDef : 0;
    S.hp       = (typeof d.hp === 'number') ? d.hp : S.baseHp;
    S.mp       = (typeof d.mp === 'number') ? d.mp : S.baseMp;
    S.exp      = (typeof d.exp === 'number') ? d.exp : 0;
    S.nextExp  = (typeof d.nextExp === 'number') ? d.nextExp : 30;
    S.gold     = (typeof d.gold === 'number') ? d.gold : 0;
    S.bag      = Array.isArray(d.bag) ? d.bag : [];
    S.equipped = d.equipped || {
        "武器": null, "上衣": null, "下装": null,
        "鞋子": null, "腰带": null, "项链": null
    };
    S.dungeon  = d.dungeon || '洛兰';

    updateUI();
    alert('已读取存档【' + id + '】\n等级：Lv.' + S.lv);
    town();
}

function doDelete() {
    var id = prompt('请输入要删除的存档号：');
    if (!id) { showSavePanel(); return; }
    if (!confirm('确定删除存档【' + id + '】吗？')) { showSavePanel(); return; }
    var result = deleteSave(id);
    alert(result.msg);
    showSavePanel();
}

/* ==========================================
   休息
   ========================================== */
function rest() {
    if (S.gold < 30) return;
    S.gold -= 30;
    var st = curStats();
    S.hp = st.maxHp;
    S.mp = st.maxMp;
    updateUI();
    show('你在营地里休息了一会。\n\nHP / MP 已全部恢复。', [{ t: '◀ 返回城镇', a: town }]);
}

/* ==========================================
   进入地下城
   ========================================== */
function enterDungeon() {
    var dungeonData = DUNGEONS[S.dungeon];
    /* ★ BOSS 概率从 10% 降到 4% */
    var isBoss = Math.random() < 0.04;
    var mKey = isBoss
        ? dungeonData.boss
        : dungeonData.monsters[Math.floor(Math.random() * dungeonData.monsters.length)];

    setScene(getMonsterImg(mKey), '战斗 · ' + mKey);

    var base = MONSTERS[mKey];
    S.monster = {
        name: mKey,
        hp: base.hp, maxHp: base.hp,
        atk: base.atk,
        exp: base.exp, gold: base.gold,
        dropRate: base.dropRate,
        isBoss: isBoss
    };
    S.monsterStunTurns = 0;   /* ★ 重置眩晕回合 */
    S.inBattle = true;
    renderBattle(isBoss ? '💀 【BOSS 出现！】' : '⚔️ 遭遇了敌人！');
}

/* ==========================================
   战斗画面
   ========================================== */
function renderBattle(prefix) {
    var m = S.monster;
    var st = curStats();
    var stunInfo = (S.monsterStunTurns > 0) ? '\n😵 敌人被眩晕（剩余 ' + S.monsterStunTurns + ' 回合）' : '';
    var text = prefix + '\n\n敌人：' + m.name + (m.isBoss ? '【BOSS】' : '') +
        '\n敌人 HP：' + Math.max(0, m.hp) + ' / ' + m.maxHp + stunInfo +
        '\n\n你的 HP：' + Math.max(0, S.hp) + ' / ' + st.maxHp +
        '\n你的 MP：' + Math.max(0, S.mp) + ' / ' + st.maxMp +
        '\n\n—— 选择你的行动 ——';

    var choices = [{ t: '▶ 普通攻击', a: function () { playerAttack(0); } }];
    for (var i = 0; i < SKILLS.length; i++) {
        (function (idx) {
            var skill = SKILLS[idx];
            choices.push({
                t: '▶ ' + skill.name + '（MP ' + skill.cost + '）',
                a: function () { playerAttack(idx + 1); },
                disabled: S.mp < skill.cost
            });
        })(i);
    }
    choices.push({ t: '▶ 逃跑', a: flee });

    show(text, choices);
}

/* ==========================================
   玩家攻击
   ========================================== */
function playerAttack(skillIndex) {
    var st = curStats();
    var dmg = 0, skillName = '普通攻击', log = '';
    var isStunSkill = false;

    if (skillIndex === 0) {
        dmg = st.atk;
    } else {
        var skill = SKILLS[skillIndex - 1];
        if (S.mp < skill.cost) { renderBattle('⚠️ MP 不足！'); return; }
        S.mp -= skill.cost;
        skillName = skill.name;
        dmg = skill.dmg + st.atk;
        /* ★ 银光落刃的眩晕标记 */
        if (skill.stun) isStunSkill = true;
    }

    S.monster.hp -= dmg;
    log += '你使用了【' + skillName + '】，造成 ' + dmg + ' 点伤害。\n';

    /* ★ 眩晕判定：20% 概率 */
    if (isStunSkill && Math.random() < 0.2) {
        S.monsterStunTurns = 1;
        log += '😵 【' + S.monster.name + '】被眩晕，下一回合无法行动！\n';
    }

    if (S.monster.hp <= 0) {
        S.monster.hp = 0;
        updateUI();
        battleWin(log);
        return;
    }

    /* ★ 如果敌人被眩晕，跳过它的回合 */
    if (S.monsterStunTurns > 0) {
        S.monsterStunTurns--;
        log += '【' + S.monster.name + '】被眩晕，无法反击。\n';
    } else {
        var monsterDmg = Math.max(1, S.monster.atk - st.def);
        S.hp -= monsterDmg;
        log += '【' + S.monster.name + '】反击，你受到 ' + monsterDmg + ' 点伤害。\n';
    }

    if (S.hp <= 0) {
        /* ★ 修复死亡螺旋：HP 恢复 30% 最大，金币扣 20% */
        var st3 = curStats();
        S.hp = Math.max(1, Math.floor(st3.maxHp * 0.3));
        var lost = Math.floor(S.gold * 0.2);
        S.gold -= lost;
        S.inBattle = false;
        updateUI();
        show('💀 你被【' + S.monster.name + '】击败了...\n\n你被路过的商人救回了城镇。\n\n治疗费花去了 ' + lost + ' 金币。\n当前 HP：' + S.hp + '（30% 恢复）',
            [{ t: '◀ 返回城镇', a: town }]);
        return;
    }

    updateUI();
    renderBattle(log.trim());
}

/* ==========================================
   逃跑
   ========================================== */
function flee() {
    var st = curStats();
    if (Math.random() < 0.5) {
        S.inBattle = false;
        updateUI();
        show('你成功逃回了城镇。\n\n这次你活了下来。', [{ t: '◀ 返回城镇', a: town }]);
    } else {
        var monsterDmg = Math.max(1, S.monster.atk - st.def);
        S.hp -= monsterDmg;
        if (S.hp <= 0) {
            /* ★ 修复死亡螺旋 */
            var st4 = curStats();
            S.hp = Math.max(1, Math.floor(st4.maxHp * 0.3));
            var lost2 = Math.floor(S.gold * 0.2);
            S.gold -= lost2;
            S.inBattle = false;
            updateUI();
            show('💀 你逃跑失败，被敌人击倒...\n\n你被好心的路人救回了城镇。\n\n治疗费花去了 ' + lost2 + ' 金币。\n当前 HP：' + S.hp,
                [{ t: '◀ 返回城镇', a: town }]);
            return;
        }
        updateUI();
        renderBattle('⚠️ 逃跑失败！你受到 ' + monsterDmg + ' 点伤害。');
    }
}

/* ==========================================
   战斗胜利
   ========================================== */
function battleWin(log) {
    var m = S.monster;
    S.exp += m.exp;
    S.gold += m.gold;

    var lootText = '';
    if (Math.random() < m.dropRate) {
        var eq = pickLoot(S.dungeon);   /* ★ 按副本掉落 */
        if (eq) {
            S.bag.push(eq);
            lootText = '\n🎁 掉落了【' + eq.name + '】（' + eq.slot + '）！点击背包即可装备。';
        }
    }

    var lvUpText = '';
    if (S.exp >= S.nextExp) {
        S.lv++;
        S.exp -= S.nextExp;
        S.nextExp = Math.floor(S.nextExp * 1.5);
        S.baseHp += 20;
        S.baseMp += 10;
        S.baseAtk += 3;
        var st2 = curStats();
        S.hp = st2.maxHp;
        S.mp = st2.maxMp;
        lvUpText = '\n⭐ 升级了！当前等级 Lv.' + S.lv + '（HP / MP 已回满）';
    }

    S.inBattle = false;
    updateUI();
    show('🏆 击败了【' + m.name + '】！\n\n' + log.trim() + '\n————————————\n获得经验：' + m.exp + '\n获得金币：' + m.gold + lootText + lvUpText,
        [
            { t: '▶ 继续在当前区域探索', a: enterDungeon },
            { t: '▶ 返回城镇', a: town }
        ]);
}

/* ==========================================
   ★ 按副本掉落装备
   ========================================== */
function pickLoot(dungeonName) {
    /* 先找副本的 loot 列表，找不到就默认洛兰 */
    var pool = [];
    if (typeof DUNGEON_LOOT !== 'undefined' && DUNGEON_LOOT[dungeonName]) {
        pool = DUNGEON_LOOT[dungeonName];
    } else if (typeof DUNGEON_LOOT !== 'undefined' && DUNGEON_LOOT['洛兰']) {
        pool = DUNGEON_LOOT['洛兰'];
    }

    if (pool.length === 0) return null;

    /* 从池子里挑一件装备，通过名字在 EQUIPS 里找 */
    var pickName = pool[Math.floor(Math.random() * pool.length)];
    for (var i = 0; i < EQUIPS.length; i++) {
        if (EQUIPS[i].name === pickName) return EQUIPS[i];
    }
    return null;
}

/* ==========================================
   装备物品
   ========================================== */
function equipItem(i) {
    var item = S.bag[i];
    var slot = item.slot;
    if (S.equipped[slot]) S.bag.push(S.equipped[slot]);
    S.bag.splice(i, 1);
    S.equipped[slot] = item;
    updateUI();
    var st = curStats();
    show('装备了【' + item.name + '】（' + slot + '）！\n\n当前攻击：' + st.atk + '\n当前防御：' + st.def + '\n最大 HP：' + st.maxHp + '\n最大 MP：' + st.maxMp,
        [{ t: '◀ 返回城镇', a: town }]);
}

/* ==========================================
   ★ 出售物品
   ========================================== */
function sellItem(i) {
    var item = S.bag[i];
    /* 稀有度决定售价 */
    var price = 10;
    if (item.rarity === 'rare') price = 30;
    if (item.rarity === 'epic') price = 100;

    if (!confirm('确定出售【' + item.name + '】？\n获得 ' + price + ' 金币。')) return;

    S.gold += price;
    S.bag.splice(i, 1);
    updateUI();
    show('出售了【' + item.name + '】！\n\n获得 ' + price + ' 金币。', [{ t: '◀ 返回城镇', a: town }]);
}

/* ==========================================
   ★ 丢弃物品
   ========================================== */
function dropItem(i) {
    var item = S.bag[i];
    if (!confirm('确定丢弃【' + item.name + '】？此操作不可恢复。')) return;
    S.bag.splice(i, 1);
    updateUI();
    show('丢弃了【' + item.name + '】。', [{ t: '◀ 返回城镇', a: town }]);
}

/* ==========================================
   启动
   ========================================== */
if (typeof SETTINGS !== 'undefined') SETTINGS.init();
updateUI();
startGame();