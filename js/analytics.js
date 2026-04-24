// ========== 增强统计控制器 ==========
const StatsController = {
    // 统计数据
    data: {
        // 本地统计
        totalVisits: 0,
        totalRolls: 0,
        totalShares: 0,
        uniqueVisitors: new Set(),
        diceRolls: {},
        results: {},
        shareTypes: {
            wechat: 0,
            moments: 0,
            link: 0,
            image: 0
        },

        // 时间统计
        dailyVisits: {},
        dailyRolls: {},
        dailyShares: {},

        // 用户行为
        avgSessionTime: 0,
        bounceRate: 0,

        // 设备统计
        devices: {
            mobile: 0,
            desktop: 0,
            tablet: 0
        },

        // 地域统计（简单模拟）
        regions: {},

        // 最后更新时间
        lastUpdate: null
    },

    // 初始化
    init() {
        this.loadData();
        this.recordVisit();
        this.detectDevice();
        this.startSessionTimer();
    },

    // 加载数据
    loadData() {
        const saved = localStorage.getItem('enhancedStats');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 恢复 Set 类型
            if (parsed.uniqueVisitors) {
                parsed.uniqueVisitors = new Set(parsed.uniqueVisitors);
            }
            this.data = { ...this.data, ...parsed };
        }
    },

    // 保存数据
    saveData() {
        const toSave = { ...this.data };
        // 将 Set 转换为数组
        if (toSave.uniqueVisitors instanceof Set) {
            toSave.uniqueVisitors = Array.from(toSave.uniqueVisitors);
        }
        localStorage.setItem('enhancedStats', JSON.stringify(toSave));
        this.data.lastUpdate = new Date().toISOString();
    },

    // 记录访问
    recordVisit() {
        const today = new Date().toISOString().split('T')[0];
        const visitorId = this.getOrCreateVisitorId();

        this.data.totalVisits++;
        this.data.uniqueVisitors.add(visitorId);

        // 每日统计
        if (!this.data.dailyVisits[today]) {
            this.data.dailyVisits[today] = 0;
        }
        this.data.dailyVisits[today]++;

        this.saveData();
    },

    // 记录摇骰子
    recordRoll(diceName, result) {
        const today = new Date().toISOString().split('T')[0];
        this.data.totalRolls++;

        // 按骰子统计
        if (!this.data.diceRolls[diceName]) {
            this.data.diceRolls[diceName] = 0;
        }
        this.data.diceRolls[diceName]++;

        // 按结果统计
        if (!this.data.results[result]) {
            this.data.results[result] = 0;
        }
        this.data.results[result]++;

        // 每日统计
        if (!this.data.dailyRolls[today]) {
            this.data.dailyRolls[today] = 0;
        }
        this.data.dailyRolls[today]++;

        this.saveData();
    },

    // 记录分享（增强版）
    recordShare(shareType = 'link') {
        const today = new Date().toISOString().split('T')[0];
        this.data.totalShares++;

        // 按分享类型统计
        if (this.data.shareTypes[shareType] !== undefined) {
            this.data.shareTypes[shareType]++;
        }

        // 每日统计
        if (!this.data.dailyShares[today]) {
            this.data.dailyShares[today] = 0;
        }
        this.data.dailyShares[today]++;

        this.saveData();
    },

    // 检测设备类型
    detectDevice() {
        const userAgent = navigator.userAgent;
        if (/mobile/i.test(userAgent)) {
            this.data.devices.mobile++;
        } else if (/tablet/i.test(userAgent)) {
            this.data.devices.tablet++;
        } else {
            this.data.devices.desktop++;
        }
        this.saveData();
    },

    // 会话计时
    startSessionTimer() {
        let sessionStart = Date.now();
        window.addEventListener('beforeunload', () => {
            const sessionDuration = (Date.now() - sessionStart) / 1000 / 60; // 分钟
            this.updateAvgSessionTime(sessionDuration);
        });
    },

    // 更新平均会话时长
    updateAvgSessionTime(duration) {
        // 简单计算平均时长
        if (this.data.avgSessionTime === 0) {
            this.data.avgSessionTime = duration;
        } else {
            this.data.avgSessionTime = (this.data.avgSessionTime + duration) / 2;
        }
        this.saveData();
    },

    // 获取或创建访客ID
    getOrCreateVisitorId() {
        let visitorId = localStorage.getItem('visitorId');
        if (!visitorId) {
            visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitorId', visitorId);
        }
        return visitorId;
    },

    // 获取完整统计数据
    getStats() {
        return {
            ...this.data,
            uniqueVisitorsCount: this.data.uniqueVisitors instanceof Set
                ? this.data.uniqueVisitors.size
                : this.data.uniqueVisitors.length
        };
    },

    // 获取概览数据
    getOverview() {
        const stats = this.getStats();
        return {
            totalVisits: stats.totalVisits,
            uniqueVisitors: stats.uniqueVisitorsCount,
            totalRolls: stats.totalRolls,
            totalShares: stats.totalShares,
            shareRate: stats.totalRolls > 0
                ? ((stats.totalShares / stats.totalRolls) * 100).toFixed(1)
                : 0,
            avgSessionTime: stats.avgSessionTime.toFixed(1)
        };
    },

    // 获取分享数据
    getShareStats() {
        return this.data.shareTypes;
    },

    // 获取设备数据
    getDeviceStats() {
        return this.data.devices;
    },

    // 获取趋势数据（近7天）
    getTrends() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                label: `${date.getMonth() + 1}/${date.getDate()}`,
                visits: this.data.dailyVisits[dateStr] || 0,
                rolls: this.data.dailyRolls[dateStr] || 0,
                shares: this.data.dailyShares[dateStr] || 0
            });
        }
        return days;
    },

    // 导出数据（JSON格式）
    exportData() {
        const stats = this.getStats();
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `emotion-dice-stats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    },

    // 重置数据
    reset() {
        if (confirm('确定要重置所有统计数据吗？此操作不可恢复！')) {
            localStorage.removeItem('enhancedStats');
            localStorage.removeItem('visitorId');
            location.reload();
        }
    }
};

// 导出到全局
window.StatsController = StatsController;
