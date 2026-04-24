// ========== Supabase配置 ==========
const SUPABASE_CONFIG = {
    url: 'https://xwbhgojqgyaopqlhuqqd.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Ymhnb2pxZ3lhb3BxbGh1cXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTM3NTUsImV4cCI6MjA5MjQ2OTc1NX0.vOFf9Td2Id-fUC12SCOxMNwtaSScM9crDDCDLe7d8sU'
};

// ========== Supabase客户端（简化版）==========
const SupabaseClient = {
    // 基础请求方法
    async request(table, options = {}) {
        const { method = 'GET', data = null, filters = null } = options;

        let url = `${SUPABASE_CONFIG.url}/rest/v1/${table}`;

        // 添加查询参数
        if (filters) {
            const params = new URLSearchParams();
            if (filters.select) params.append('select', filters.select);
            if (filters.order) params.append('order', filters.order);
            url += '?' + params.toString();
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'apikey': SUPABASE_CONFIG.key,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Supabase请求失败:', error);
            return null;
        }
    },

    // 插入数据
    async insert(table, data) {
        return await this.request(table, {
            method: 'POST',
            data: data
        });
    },

    // 查询数据
    async select(table, filters = {}) {
        return await this.request(table, {
            method: 'GET',
            filters: filters
        });
    },

    // 获取统计数据
    async getStats() {
        try {
            // 获取总记录数
            const [rolls, shares, visitors] = await Promise.all([
                this.select('dice_rolls', { select: 'id' }),
                this.select('shares', { select: 'id' }),
                this.select('visitors', { select: 'id' })
            ]);

            return {
                totalRolls: rolls ? rolls.length : 0,
                totalShares: shares ? shares.length : 0,
                uniqueVisitors: visitors ? visitors.length : 0
            };
        } catch (error) {
            console.error('获取统计失败:', error);
            return {
                totalRolls: 0,
                totalShares: 0,
                uniqueVisitors: 0
            };
        }
    },

    // 获取骰子统计
    async getDiceStats() {
        try {
            const rolls = await this.select('dice_rolls');

            if (!rolls) return {};

            // 按骰子名称统计
            const diceStats = {};
            rolls.forEach(roll => {
                if (!diceStats[roll.dice_name]) {
                    diceStats[roll.dice_name] = 0;
                }
                diceStats[roll.dice_name]++;
            });

            return diceStats;
        } catch (error) {
            console.error('获取骰子统计失败:', error);
            return {};
        }
    },

    // 获取分享统计
    async getShareStats() {
        try {
            const shares = await this.select('shares');

            if (!shares) return {};

            // 按分享类型统计
            const shareStats = {
                wechat: 0,
                qq: 0,
                weibo: 0,
                link: 0,
                image: 0
            };

            shares.forEach(share => {
                if (shareStats[share.share_type] !== undefined) {
                    shareStats[share.share_type]++;
                }
            });

            return shareStats;
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

    // 获取热门结果
    async getTopResults(limit = 10) {
        try {
            const rolls = await this.select('dice_rolls', {
                select: '*',
                order: 'count.desc'
            });

            if (!rolls) return [];

            // 统计每个结果的出现次数
            const resultCounts = {};
            rolls.forEach(roll => {
                if (!resultCounts[roll.result_word]) {
                    resultCounts[roll.result_word] = {
                        word: roll.result_word,
                        emoji: roll.result_emoji,
                        count: 0
                    };
                }
                resultCounts[roll.result_word].count++;
            });

            // 转换为数组并排序
            const results = Object.values(resultCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);

            return results;
        } catch (error) {
            console.error('获取热门结果失败:', error);
            return [];
        }
    },

    // 获取每日趋势
    async getDailyTrends() {
        try {
            const [rolls, shares] = await Promise.all([
                this.select('dice_rolls'),
                this.select('shares')
            ]);

            // 获取最近7天
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                days.push({
                    date: dateStr,
                    label: `${date.getMonth() + 1}/${date.getDate()}`,
                    visits: 0, // 这个需要从visitors表统计
                    rolls: 0,
                    shares: 0
                });
            }

            // 统计每天的摇骰子次数
            if (rolls) {
                rolls.forEach(roll => {
                    const day = days.find(d => d.date === roll.created_at.split('T')[0]);
                    if (day) day.rolls++;
                });
            }

            // 统计每天的分享次数
            if (shares) {
                shares.forEach(share => {
                    const day = days.find(d => d.date === share.created_at.split('T')[0]);
                    if (day) day.shares++;
                });
            }

            return days;
        } catch (error) {
            console.error('获取每日趋势失败:', error);
            return [];
        }
    }
};

// 导出到全局
window.SupabaseClient = SupabaseClient;
