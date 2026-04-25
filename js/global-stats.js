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
            comboStats: {}, // 新增：一卦模式统计
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

    // ========== 新增：一卦模式统计 ==========

    // 获取一卦模式使用统计
    async getComboModeStats() {
        try {
            const rolls = await SupabaseClient.select('dice_rolls');

            if (!rolls) return {};

            // 统计每个一卦模式的使用次数
            const comboStats = {};
            rolls.forEach(roll => {
                if (roll.mode_type === 'combo' && roll.combo_name) {
                    if (!comboStats[roll.combo_name]) {
                        comboStats[roll.combo_name] = {
                            id: roll.combo_id,
                            name: roll.combo_name,
                            count: 0,
                            percentage: 0
                        };
                    }
                    comboStats[roll.combo_name].count++;
                }
            });

            // 计算百分比
            const totalComboRolls = Object.values(comboStats).reduce((sum, item) => sum + item.count, 0);
            Object.values(comboStats).forEach(item => {
                item.percentage = totalComboRolls > 0 ? ((item.count / totalComboRolls) * 100).toFixed(1) : 0;
            });

            // 按使用次数排序
            const sorted = Object.values(comboStats).sort((a, b) => b.count - a.count);

            // 转换为对象格式（便于前端使用）
            const result = {};
            sorted.forEach((item, index) => {
                result[item.name] = {
                    ...item,
                    rank: index + 1
                };
            });

            return result;
        } catch (error) {
            console.error('获取一卦模式统计失败:', error);
            return {};
        }
    },

    // 获取单骰 vs 一卦使用对比
    async getModeComparison() {
        try {
            const rolls = await SupabaseClient.select('dice_rolls');

            if (!rolls) return { single: 0, combo: 0 };

            const singleCount = rolls.filter(r => r.mode_type === 'single').length;
            const comboCount = rolls.filter(r => r.mode_type === 'combo').length;
            const total = singleCount + comboCount;

            return {
                single: singleCount,
                combo: comboCount,
                total: total,
                singlePercentage: total > 0 ? ((singleCount / total) * 100).toFixed(1) : 0,
                comboPercentage: total > 0 ? ((comboCount / total) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('获取模式对比失败:', error);
            return { single: 0, combo: 0, total: 0, singlePercentage: 0, comboPercentage: 0 };
        }
    },

    // ========== 新增：时间维度分析 ==========

    // 获取时段分布统计
    async getTimePeriodStats() {
        try {
            const rolls = await SupabaseClient.select('dice_rolls');

            if (!rolls) return {};

            // 按时段统计
            const timeStats = {
                '早晨': { count: 0, hour: '05-09' },
                '上午': { count: 0, hour: '09-12' },
                '中午': { count: 0, hour: '12-14' },
                '下午': { count: 0, hour: '14-18' },
                '晚上': { count: 0, hour: '18-22' },
                '深夜': { count: 0, hour: '22-05' }
            };

            // 按小时统计（用于热力图）
            const hourlyStats = {};
            for (let i = 0; i < 24; i++) {
                hourlyStats[i] = { hour: i, count: 0, label: `${i}:00` };
            }

            rolls.forEach(roll => {
                // 时段统计
                if (roll.time_period && timeStats[roll.time_period]) {
                    timeStats[roll.time_period].count++;
                }

                // 小时统计
                if (roll.hour !== undefined && hourlyStats[roll.hour]) {
                    hourlyStats[roll.hour].count++;
                }
            });

            // 转换为数组格式
            const timeArray = Object.values(timeStats);
            const hourlyArray = Object.values(hourlyStats);

            // 计算百分比
            const totalRolls = rolls.length;
            timeArray.forEach(item => {
                item.percentage = totalRolls > 0 ? ((item.count / totalRolls) * 100).toFixed(1) : 0;
            });

            return {
                timePeriods: timeArray,
                hourly: hourlyArray,
                peakPeriod: timeArray.sort((a, b) => b.count - a.count)[0],
                peakHour: hourlyArray.sort((a, b) => b.count - a.count)[0]
            };
        } catch (error) {
            console.error('获取时段统计失败:', error);
            return { timePeriods: [], hourly: [] };
        }
    },

    // 获取工作日 vs 周末统计
    async getWeekendStats() {
        try {
            const rolls = await SupabaseClient.select('dice_rolls');

            if (!rolls) return { weekday: 0, weekend: 0 };

            const weekday = rolls.filter(r => !r.is_weekend).length;
            const weekend = rolls.filter(r => r.is_weekend).length;
            const total = weekday + weekend;

            return {
                weekday: weekday,
                weekend: weekend,
                total: total,
                weekdayPercentage: total > 0 ? ((weekday / total) * 100).toFixed(1) : 0,
                weekendPercentage: total > 0 ? ((weekend / total) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('获取周末统计失败:', error);
            return { weekday: 0, weekend: 0 };
        }
    },

    // ========== 新增：用户行为路径分析 ==========

    // 获取转化漏斗
    async getConversionFunnel() {
        try {
            const [visitors, rolls, shares] = await Promise.all([
                SupabaseClient.select('visitors'),
                SupabaseClient.select('dice_rolls'),
                SupabaseClient.select('shares')
            ]);

            const uniqueVisitors = visitors ? visitors.length : 0;
            const uniqueRolls = rolls ? new Set(rolls.map(r => r.visitor_id)).size : 0;
            const uniqueShares = shares ? new Set(shares.map(s => s.visitor_id)).size : 0;

            return {
                visitors: uniqueVisitors,
                rolls: uniqueRolls,
                shares: uniqueShares,
                visitToRollRate: uniqueVisitors > 0 ? ((uniqueRolls / uniqueVisitors) * 100).toFixed(1) : 0,
                rollToShareRate: uniqueRolls > 0 ? ((uniqueShares / uniqueRolls) * 100).toFixed(1) : 0,
                visitToShareRate: uniqueVisitors > 0 ? ((uniqueShares / uniqueVisitors) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('获取转化漏斗失败:', error);
            return {
                visitors: 0,
                rolls: 0,
                shares: 0,
                visitToRollRate: 0,
                rollToShareRate: 0,
                visitToShareRate: 0
            };
        }
    },

    // 获取平均会话数据
    async getSessionStats() {
        try {
            const rolls = await SupabaseClient.select('dice_rolls');

            if (!rolls || rolls.length === 0) {
                return {
                    avgRollsPerSession: 0,
                    avgTimeOnPage: 0,
                    avgTimeBetweenRolls: 0
                };
            }

            // 计算平均每会话摇骰子次数
            const totalRollsInSessions = rolls.reduce((sum, roll) => sum + (roll.roll_number_in_session || 1), 0);
            const avgRollsPerSession = totalRollsInSessions / rolls.length;

            // 计算平均页面停留时间
            const totalTimeOnPage = rolls.reduce((sum, roll) => sum + (roll.time_on_page_before_roll || 0), 0);
            const avgTimeOnPage = totalTimeOnPage / rolls.length;

            // 计算平均摇骰子间隔时间
            const timeBetweenRolls = rolls
                .filter(r => r.time_since_last_roll !== null)
                .map(r => r.time_since_last_roll);
            const avgTimeBetweenRolls = timeBetweenRolls.length > 0
                ? timeBetweenRolls.reduce((sum, time) => sum + time, 0) / timeBetweenRolls.length
                : 0;

            return {
                avgRollsPerSession: avgRollsPerSession.toFixed(1),
                avgTimeOnPage: Math.round(avgTimeOnPage),
                avgTimeBetweenRolls: Math.round(avgTimeBetweenRolls)
            };
        } catch (error) {
            console.error('获取会话统计失败:', error);
            return {
                avgRollsPerSession: 0,
                avgTimeOnPage: 0,
                avgTimeBetweenRolls: 0
            };
        }
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
