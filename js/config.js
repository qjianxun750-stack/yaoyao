// ========== 骰子配置数据 ==========
const DICE_CONFIG = [
    {
        id: 'status',
        name: '今日状态',
        color: '#FF6B6B',
        faces: [
            { word: '小爷来了', emoji: '😎', desc: '今天有气势，冲！适合主动出击、表达自我' },
            { word: '清醒的NPC', emoji: '🤖', desc: '今天配合，但心里明白。表面营业，内心清醒' },
            { word: '我在哪', emoji: '😵', desc: '今天有点迷，找不到自己。允许自己迷茫一会儿' },
            { word: '电量不足', emoji: '🪫', desc: '今天没能量，别指望我。好好休息也是正事' },
            { word: '继续营业', emoji: '😐', desc: '今天正常运转，没感情。完成该完成的就好' },
            { word: '我爱工作', emoji: '😅', desc: '今天认命了，上吧。自嘲也是一种力量' }
        ]
    },
    {
        id: 'crazy',
        name: '今日发疯',
        color: '#FF006E',
        faces: [
            { word: '想消失一下', emoji: '👻', desc: '不是真的消失，就是想从所有人的视线里消失三天' },
            { word: '想说不', emoji: '🙅', desc: '今天有一百个请求，我想全部拒绝' },
            { word: '想原地爆炸', emoji: '💥', desc: '今天积累的东西太多，需要一个出口' },
            { word: '想哭一场', emoji: '😭', desc: '不是真的很难过，就是需要哭一下' },
            { word: '想跑路', emoji: '🏃', desc: '不是真的跑，就是想消失在一个没人认识我的地方' },
            { word: '想摔东西', emoji: '💢', desc: '不是真的摔，就是需要那个动作' }
        ]
    },
    {
        id: 'wish',
        name: '今日祈愿',
        color: '#8338EC',
        faces: [
            { word: '万一呢', emoji: '🍀', desc: '今天求个好运，信一半。留条退路，也留点期待' },
            { word: '求个心安', emoji: '🙏', desc: '今天不求别的，就求踏实。心安就好' },
            { word: '我委屈我不哭', emoji: '😢', desc: '今天求被看见，求一点点认可' },
            { word: '好话连连', emoji: '✨', desc: '今天只接受好消息，坏的不收' },
            { word: '静待时机', emoji: '⏳', desc: '今天不急，等。时机到了自然成' },
            { word: '算了算了', emoji: '🤷', desc: '今天什么都不求了，随缘' }
        ]
    },
    {
        id: 'metaphysics',
        name: '今日玄学',
        color: '#FFB703',
        faces: [
            { word: '万一呢', emoji: '🎲', desc: '今天信一半，留条退路。玄学也要理性' },
            { word: '半信半得劲', emoji: '😏', desc: '今天不全信，但信了就踏实' },
            { word: '好运批发中', emoji: '🎊', desc: '今天运气来了，接好。准备好迎接好消息' },
            { word: '求个心安而已', emoji: '☯️', desc: '今天不求别的，就求不出事' },
            { word: '静待时机', emoji: '🌙', desc: '今天不急，老天自有安排' },
            { word: '随缘了', emoji: '🍃', desc: '今天不求了，爱咋咋地' }
        ]
    },
    {
        id: 'relationship',
        name: '今日关系',
        color: '#FB5607',
        faces: [
            { word: '自觉的背景板', emoji: '🎭', desc: '今天我在场，但不是主角。当个安静的观众' },
            { word: '沉默式应答', emoji: '😶', desc: '今天有人说话，我在听，但没在听' },
            { word: '隐形出席者', emoji: '👤', desc: '今天人在心不在，全程在线离线' },
            { word: '社交耗材', emoji: '🔋', desc: '今天又被消耗了，什么都没留下' },
            { word: '气氛组成员', emoji: '🎉', desc: '今天撑了全场，散场各回各家' },
            { word: '我委屈我不哭', emoji: '💔', desc: '今天有话没说，咽下去了' }
        ]
    },
    {
        id: 'life',
        name: '今日人生',
        color: '#3A86FF',
        faces: [
            { word: '我在哪', emoji: '🌫️', desc: '今天迷失了，不知道自己在哪里。允许迷路' },
            { word: '回不去了', emoji: '🚪', desc: '今天突然想起从前，但门已经关上了' },
            { word: '将就着吧', emoji: '😌', desc: '今天不追求了，过得去就行' },
            { word: '还没想好', emoji: '🤔', desc: '今天没有答案，但也不急着找' },
            { word: '再等等', emoji: '⏰', desc: '今天不动，等一个说不清楚的什么' },
            { word: '就这样吧', emoji: '🍂', desc: '今天接受了，不挣扎了' }
        ]
    },
    {
        id: 'mom',
        name: '今日妈妈',
        color: '#06FFB4',
        faces: [
            { word: '沉默式应答', emoji: '😑', desc: '今天听见了，但没收到。左耳进右耳出' },
            { word: '我知道了', emoji: '📢', desc: '今天第八百次听这句话，第八百次这样回' },
            { word: '随你吧', emoji: '🤲', desc: '今天不争了，你说什么都行' },
            { word: '嗯', emoji: '😶', desc: '今天只有这一个字，但这个字装了很多东西' },
            { word: '好好好', emoji: '👍', desc: '今天全部答应，一个都不会做' },
            { word: '下次吧', emoji: '⏭️', desc: '今天用这三个字挡住了所有问题' }
        ]
    },
    {
        id: 'partner',
        name: '今日搭子',
        color: '#FF69B4',
        faces: [
            { word: '今天不想说话', emoji: '🤐', desc: '今天需要搭子，但不需要交流，就是陪着' },
            { word: '今天AA', emoji: '💰', desc: '今天是纯粹的搭子关系，干净，没有负担' },
            { word: '今天我请', emoji: '🎁', desc: '今天心情好，或者需要被需要' },
            { word: '今天你说了算', emoji: '👑', desc: '今天不想做决定，全交给你' },
            { word: '今天各玩各的', emoji: '🎮', desc: '今天在一起，但不互相打扰' },
            { word: '今天不散', emoji: '🌟', desc: '今天不想回家，多待一会儿' }
        ]
    },
    // ========== 组合骰子：今日一卦·因态果 ==========
    {
        id: 'today-cause',
        name: '今日一卦',
        type: 'combo', // 标记为组合骰子
        subDice: ['cause', 'attitude', 'result'],
        subNames: ['因', '态', '果'],
        color: '#8B5CF6',
        description: '今日一卦 · 因态果',
        combo: [
            {
                subId: 'cause',
                name: '今日之因',
                faces: [
                    { word: '自找的', emoji: '🙋', desc: '今天的麻烦是自己造的，心知肚明' },
                    { word: '命该如此', emoji: '🌟', desc: '今天的事不怪自己，老天安排的' },
                    { word: '被坑了', emoji: '🕳️', desc: '今天有人挖坑，自己跳进去了' },
                    { word: '没想到', emoji: '😲', desc: '今天出了意外，完全没料到' },
                    { word: '早该如此', emoji: '⏰', desc: '今天发生的，其实早就该发生了' },
                    { word: '说不清', emoji: '🌫️', desc: '今天的原因理不清楚，反正就这样了' }
                ]
            },
            {
                subId: 'attitude',
                name: '今日之态',
                faces: [
                    { word: '小爷来了', emoji: '😎', desc: '今天有气势，冲' },
                    { word: '沉默式应答', emoji: '🤐', desc: '今天配合，但心里有数' },
                    { word: '随缘了', emoji: '🍃', desc: '今天不挣扎，交给命运' },
                    { word: '继续营业', emoji: '😐', desc: '今天正常运转，没有感情' },
                    { word: '我委屈我不哭', emoji: '😢', desc: '今天憋着，但撑着' },
                    { word: '清醒的NPC', emoji: '🤖', desc: '今天看透了，但选择不动' }
                ]
            },
            {
                subId: 'result',
                name: '今日之果',
                faces: [
                    { word: '船到桥头自然直', emoji: '🚢', desc: '今天的事到时候自然解决' },
                    { word: '下个月再说', emoji: '📅', desc: '今天的问题推给未来的自己' },
                    { word: '万一呢', emoji: '🍀', desc: '今天留一线希望，说不定有转机' },
                    { word: '就这样吧', emoji: '🤷', desc: '今天接受结果，不挣扎了' },
                    { word: '算了算了', emoji: '👋', desc: '今天不要结果了，放下' },
                    { word: '挺好的', emoji: '✨', desc: '今天结局不错，或者假装不错' }
                ]
            }
        ]
    },
    // ========== 组合骰子：三爻问心·状态处境心声 ==========
    {
        id: 'three-questions',
        name: '三爻问心',
        type: 'combo', // 标记为组合骰子
        subDice: ['state', 'position', 'heart'],
        subNames: ['此刻状态', '当下处境', '没说出口的话'],
        color: '#059669',
        description: '三爻问心 · 状态处境心声',
        combo: [
            {
                subId: 'state',
                name: '此刻状态',
                faces: [
                    { word: '要炸了', emoji: '💥', desc: '绷到极限，随时引爆' },
                    { word: '电量不足', emoji: '🪫', desc: '没能量，别指望我' },
                    { word: '将就着', emoji: '😌', desc: '不追求了，过得去就行' },
                    { word: '还撑着', emoji: '💪', desc: '没崩，但就差一口气' },
                    { word: '麻了', emoji: '😐', desc: '不痛不痒，感觉不到了' },
                    { word: '挺好的', emoji: '😊', desc: '真的挺好，或者假装挺好' }
                ]
            },
            {
                subId: 'position',
                name: '当下处境',
                faces: [
                    { word: '被依靠', emoji: '🧱', desc: '所有人找我，我找不到人' },
                    { word: '夹在中间', emoji: '🚪', desc: '两边都要顾，哪边都不是自己人' },
                    { word: '跟着走', emoji: '🚶', desc: '不是我选的，就这么走到这里了' },
                    { word: '只干活', emoji: '🔨', desc: '出力没名，但活儿是真的干了' },
                    { word: '就看着', emoji: '👀', desc: '看清楚了，选择不进去' },
                    { word: '我来扛', emoji: '💪', desc: '出了事是我的，成了是大家的' }
                ]
            },
            {
                subId: 'heart',
                name: '没说出口的话',
                faces: [
                    { word: '凭什么', emoji: '🙄', desc: '不服，但没说' },
                    { word: '我委屈我不哭', emoji: '😢', desc: '难受，但咽下去了' },
                    { word: '就不说了', emoji: '🤐', desc: '说了也没用，算了' },
                    { word: '我知道', emoji: '🤫', desc: '心里有数，但装作不知道' },
                    { word: '好累', emoji: '😴', desc: '不是身体累，是那种说不清的累' },
                    { word: '无所谓了', emoji: '🤷', desc: '不是真的无所谓，是太有所谓了' }
                ]
            }
        ]
    }
];

// 从DICE_CONFIG中提取组合骰子，转换为v2格式
const COMBO_CONFIG = DICE_CONFIG
    .filter(dice => dice.type === 'combo')
    .map(dice => ({
        id: dice.id,
        name: dice.name,
        subtitle: dice.subNames.join(''),
        color: dice.color,
        yaos: dice.combo.map(sub => ({
            id: sub.subId,
            name: sub.name.replace('今日之', '').replace('·', ''),
            faces: sub.faces
        }))
    }));

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DICE_CONFIG, COMBO_CONFIG };
}
