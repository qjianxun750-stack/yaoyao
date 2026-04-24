// ========== 全局统计控制器（Umami + Supabase）==========
const GlobalStatsController = {
    // 统计数据
    data: {
        // Umami数据（通过iframe获取）
        umamiStats: {
            visits: 0,
            unique: 0,
            pageviews: 0,
            bounces: 0,
            totaltime: 0
        },

        // Supabase数据
        supabaseStats: {
            totalRolls: 0,
            totalShares: 0,
            uniqueVisitors: 0,
            diceStats: {},
            shareStats: {},
            topResults: [],
            dailyTrends: []
        }
    },

    // 初始化
    init() {
        this.recordVisit();
        this.loadLocalStats();
    },

    // 记录访问
    async recordVisit() {
        try {
            const visitorId = this.getOrCreateVisitorId();

            // 记录到Supabase（异步，不阻塞）
            if (typeof SupabaseClient !== 'undefined' && SupabaseClient.insert) {
                SupabaseClient.insert('visitors', {
                    visitor_id: visitorId,
                    device_type: this.detectDevice()
                }).catch(err => {
                    console.warn('Supabase记录访问失败:', err);
                });
            }

            // 同时记录到本地统计（保持兼容）
            if (typeof StatsController === 'object' && StatsController.recordVisit) {
                try {
                    StatsController.recordVisit();
                } catch (e) {
                    console.warn('本地统计记录失败:', e);
                }
            }
        } catch (error) {
            console.error('记录访问失败:', error);
        }
    },

    // 记录摇骰子
    async recordRoll(diceName, diceId, result) {
        try {
            const visitorId = this.getOrCreateVisitorId();

            // 记录到Supabase（异步，不阻塞）
            if (typeof SupabaseClient !== 'undefined' && SupabaseClient.insert) {
                SupabaseClient.insert('dice_rolls', {
                    visitor_id: visitorId,
                    dice_name: diceName,
                    dice_id: diceId,
                    result_word: result.word,
                    result_emoji: result.emoji,
                    result_desc: result.desc
                }).catch(err => {
                    console.warn('Supabase记录摇骰子失败:', err);
                });
            }

            // 同时记录到本地统计
            if (typeof StatsController === 'object' && StatsController.recordRoll) {
                try {
                    StatsController.recordRoll(diceName, result.word);
                } catch (e) {
                    console.warn('本地统计记录失败:', e);
                }
            }
        } catch (error) {
            console.error('记录摇骰子失败:', error);
        }
    },

    // 记录分享
    async recordShare(shareType = 'link', diceName = null, resultWord = null) {
        try {
            const visitorId = this.getOrCreateVisitorId();

            // 记录到Supabase（异步，不阻塞）
            if (typeof SupabaseClient !== 'undefined' && SupabaseClient.insert) {
                SupabaseClient.insert('shares', {
                    visitor_id: visitorId,
                    share_type: shareType,
                    dice_name: diceName,
                    result_word: resultWord
                }).catch(err => {
                    console.warn('Supabase记录分享失败:', err);
                });
            }

            // 同时记录到本地统计
            if (typeof StatsController === 'object' && StatsController.recordShare) {
                try {
                    StatsController.recordShare();
                } catch (e) {
                    console.warn('本地统计记录失败:', e);
                }
            }
        } catch (error) {
            console.error('记录分享失败:', error);
        }
    },

    // 获取完整统计数据
    async getStats() {
        try {
            // 从Supabase获取数据
            const supabaseStats = await SupabaseClient.getStats();
            const diceStats = await SupabaseClient.getDiceStats();
            const shareStats = await SupabaseClient.getShareStats();
            const topResults = await SupabaseClient.getTopResults(10);
            const dailyTrends = await SupabaseClient.getDailyTrends();

            return {
                // 本地统计（兼容）
                totalRolls: supabaseStats.totalRolls,
                totalShares: supabaseStats.totalShares,
                uniqueVisitors: supabaseStats.uniqueVisitors,

                // 详细统计
                diceRolls: diceStats,
                results: this.convertTopResultsToObject(topResults),
                shareTypes: shareStats,
                dailyTrends: dailyTrends,

                // Umami统计（需要手动查看）
                umamiUrl: 'https://cloud.umami.is/share/34118be7-d644-4577-a83d-3d8d001c2618'
            };
        } catch (error) {
            console.error('获取统计失败:', error);
            // 降级到本地统计
            if (typeof StatsController === 'object' && StatsController.getStats) {
                return StatsController.getStats();
            }
            return {};
        }
    },

    // 转换热门结果格式
    convertTopResultsToObject(topResults) {
        const obj = {};
        topResults.forEach(result => {
            obj[result.word] = result.count;
        });
        return obj;
    },

    // 获取热门骰子
    async getTopDice(limit = 8) {
        try {
            const diceStats = await SupabaseClient.getDiceStats();
            return Object.entries(diceStats)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('获取热门骰子失败:', error);
            return [];
        }
    },

    // 获取热门结果
    async getTopResults(limit = 10) {
        try {
            return await SupabaseClient.getTopResults(limit);
        } catch (error) {
            console.error('获取热门结果失败:', error);
            return [];
        }
    },

    // 获取每日趋势
    async getTrends() {
        try {
            return await SupabaseClient.getDailyTrends();
        } catch (error) {
            console.error('获取每日趋势失败:', error);
            return [];
        }
    },

    // 获取概览数据
    async getOverview() {
        try {
            const stats = await this.getStats();
            const shareRate = stats.totalRolls > 0
                ? ((stats.totalShares / stats.totalRolls) * 100).toFixed(1)
                : 0;

            return {
                totalVisits: stats.uniqueVisitors, // 使用独立访客数
                uniqueVisitors: stats.uniqueVisitors,
                totalRolls: stats.totalRolls,
                totalShares: stats.totalShares,
                shareRate: shareRate,
                avgSessionTime: 0 // Umami会提供这个数据
            };
        } catch (error) {
            console.error('获取概览失败:', error);
            return {
                totalVisits: 0,
                uniqueVisitors: 0,
                totalRolls: 0,
                totalShares: 0,
                shareRate: 0,
                avgSessionTime: 0
            };
        }
    },

    // 获取分享统计
    async getShareStats() {
        try {
            return await SupabaseClient.getShareStats();
        } catch (error) {
            console.error('获取分享统计失败:', error);
            return {
                wechat: 0,
                qq: 0,
                weibo: 0,
                link: 0,
                image: 0
            };
        }
    },

    // 获取设备统计
    getDeviceStats() {
        // 从本地统计获取
        if (typeof StatsController === 'object' && StatsController.data) {
            return StatsController.data.devices;
        }
        return {
            mobile: 0,
            desktop: 0,
            tablet: 0
        };
    },

    // 加载本地统计（兼容）
    loadLocalStats() {
        if (typeof StatsController === 'object' && StatsController.loadData) {
            StatsController.loadData();
        }
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

    // 检测设备类型
    detectDevice() {
        const userAgent = navigator.userAgent;
        if (/mobile/i.test(userAgent)) {
            return 'mobile';
        } else if (/tablet/i.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
};

// 导出到全局
window.GlobalStatsController = GlobalStatsController;
