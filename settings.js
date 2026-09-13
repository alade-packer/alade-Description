/* ==========================================
   阿拉德战记 · 设置模块（settings.js）
   ————————————————————————————————————————
   功能：
   1. 控制背景音乐音量（0-100）
   2. 切换界面主题（暗黑/光明）
   3. 用 localStorage 保存设置，下次打开自动生效
   ========================================== */

const SETTINGS = {
    volume: 50,          // 默认音量 50%
    theme: "dark",       // 默认暗黑主题

    // 初始化：从 localStorage 读取设置
    init() {
        const saved = localStorage.getItem("alade_settings");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.volume = data.volume ?? 50;
                this.theme = data.theme ?? "dark";
            } catch (e) {}
        }
        this.applyTheme();
        this.applyVolume();
    },

    // 保存设置到 localStorage
    save() {
        localStorage.setItem("alade_settings", JSON.stringify({
            volume: this.volume,
            theme: this.theme
        }));
    },

    // 调整音量（0-100）
    setVolume(val) {
        this.volume = Math.max(0, Math.min(100, val));
        this.applyVolume();
        this.save();
    },

    // 把音量应用到 BGM 总输出上
    applyVolume() {
        if (BGM && BGM.masterGain) {
            // 把 0-100 转换成 0-1 的增益值
            BGM.masterGain.gain.value = this.volume / 100;
        }
    },

    // 切换主题
    setTheme(theme) {
        this.theme = theme;
        this.applyTheme();
        this.save();
    },

    // 把主题应用到 body 上（CSS 会读取这个 class）
    applyTheme() {
        document.body.classList.remove("theme-dark", "theme-light");
        document.body.classList.add("theme-" + this.theme);
    }
};