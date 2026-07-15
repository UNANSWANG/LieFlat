/**游戏配置 */
export const configData = {
    /**人物移动速度 */
    moveSpeed: 300,
    /**游戏开始后人物移动速度 */
    moveSpeedGame: 200,
    /**敌人移动速度 */
    enemyMoveSpeed: 400,
    /**瓦片大小 */
    tileSize: 64,
    /**人物皮肤数量 */
    roleSkinCount: 6,
    /**生产金币频率（秒） */
    produceCoinFreq: 1,
    /**生产电能频率（秒） */
    producePowerFreq: 1,
    /**炮台的攻击间隔 */
    cannonAttackFreq: 1,
    /**子弹速度 */
    bulletSpeed: 1000,
    /**修复时间 */
    repairTime: 10,
    /**修复冷却时间 */
    repairCoolDown: 20,
    /**门基础修复速度（每秒修复百分比） */
    doorRepairSpeed: 2,
    /**门使用修复增加的修复速度（每秒修复百分比） */
    doorRepairSpeedAdd: 3,
    /**房间有随机道具概率 */
    roomPropsProbability: 0.8,
    /**随机道具的生成数量区间 */
    randomPropsNum: [3, 4],
    /**房门血条显示时间（秒） */
    doorHpShowTime: 5,
}

/**敌人通用配置 */
export const enemyCommonConfig = {
    /**敌人开始时间（秒） */
    enemyStartTime: 25,
    /**敌人血量回复速度（每秒回复百分比） */
    enemyHpRepairSpeed: 10,
    /**敌人逃走生命值比例 */
    enemyEscapeHpPercent: 0.3,
    /**敌人使用震慑时的门生命百分比（小于） */
    doorEscapeHpPercent: 0.2,
    /**敌人使用震慑时的自身生命百分比(大于) */
    selfEscapeHpPercent: 0.3,
    /**震慑范围（格数） */
    fearRange: 4,
    /**震慑时间（秒） */
    fearTime: 3,
    /**狂怒技能攻速倍率 */
    rageAttackSpeed: 2,
    /**狂怒技能持续时间 */
    rageTime: 3,
    /**狂怒技能使用间隔 */
    rageUseInterval: 30,
    /**敌人攻击时血量检测阈值百分比（检测逃离） */
    enemyHpAttackPercent: 0.3,
    /**房门被攻击血量检测阈值百分比 */
    doorHpAttackPercent: 0.2,
    /**破门后自身血量阈值百分比 */
    goalHpThresholdPercent: 0.2,
    /**房门攻击时间检测阈值 */
    doorAttackTimeThreshold: 20,
    /**房门被攻击的检测时间（伤害） */
    doorAttackTimeDamage: 10,
    /**房门被攻击的秒伤阈值百分比 */
    doorAttackTimeDamagePercent: 0.05,
    /**回到出生点的等待时间（秒） */
    returnStartTime: 10,
    /**敌人攻击间隔倍率区间 */
    enemyAttackInterval: [0.5, 0.8],
}

/**人机通用配置 */
export const robotCommonConfig = {
    /**发电机建造前提（时间线等级） */
    generatorBuildLevel: 5,
    /**发电机上限（个数） */
    generatorMax: 4,
    /**发电机建造间隔（秒） */
    generatorBuildInterval: [15, 25],
    /**升级发电机前提条件（床等级，实际8级的时候level=7因为从0开始） */
    generatorBuildBedLevel: 8,
    /**升级发电机间隔（秒） */
    generatorUpgradeInterval: [30, 60],
    /**发电机最高等级 */
    generatorMaxLevel: 5,
    /**矿脉的建造前提（发电机最高等级，实际3级的时候level=2因为从0开始） */
    veinBuildLevel: 3,
    /**矿脉的建造间隔（秒） */
    veinBuildInterval: [30, 60],
    /**矿脉的最大上限（个数） */
    veinMax: 2,
    /**矿脉各等级建造权重 */
    veinBuildWeight: [0.95, 0.03, 0.02, 0.01],

    /**被怪物攻击时检测的时间阈值（从倒计时结束后开始计时，区分前期和后期） */
    enemyAttackTimeThreshold: 40,
    /**前期升级门的次数上限 */
    enemyUpgradeDoorMax: 2,
    /**前期被攻击时升级门的时间间隔（秒） */
    enemyAttackTimeUpgrade: 20,
    /**门掉血速率阈值(单次伤害百分比) */
    doorHpAttackPercent: 0.05,
    /** 炮台建造的距离（格数） */
    cannonBuildDistance: 4,
    /**炮台建造的时间阈值（用以区分炮台的前半段时间） */
    cannonBuildTimeThreshold: [10, 100],
    /**前半段炮台的最高等级 */
    cannonBuildLevel: 3,
    /**前半段炮台的升级冷却时间（秒） */
    cannonBuildUpgradeCoolDown: 5,
    /**炮台后半段建造的时间阈值（用以区分炮台的后半段时间） */
    cannonBuildTimeThresholdLater: 120,
    /**后半段炮台的最高等级 */
    cannonBuildLevelLater: 5,
    /**后半段炮台的升级冷却时间（秒） */
    cannonBuildUpgradeCoolDownLater: 10,
    /**后期门掉血速度过快时，生成道具的的时间 */
    propsBuildTimedLater: 20,
    /**建造机床的前提时间（秒） */
    machineBuildTimeThreshold: 180,
    /**建造寒冰的前提时间（秒） */
    iceBuildTimeThreshold: 240,
    /**检测队友被攻击范围（格数） */
    checkTeamRange: 10,
    /**队友被攻击时可升级的最大等级炮台 */
    maxUpgradeCannonLevel: 2,
}


/**游戏事件 */
export enum GameEvent {
    /**游戏暂停 */
    gamePause = "gamePause",
    /**游戏继续 */
    gameResume = "gameResume",
    /**刷新红点 */
    refreshRed = "refreshRed",
    /**加载表格 */
    loadTable = "loadTable",
    /**检测登录页加载回调 */
    checkLoginLoad = "checkLoginLoad",
    /**全部表格加载完成回调 */
    tableLoadComplete = "tableLoadComplete",
    /**加载预制体 */
    loading = "loading",
    /**刷新游戏关卡 */
    refreshGameLevel = "refreshGameLevel",
    /**复活游戏 */
    resurrectionGame = "resurrectionGame",
    /**刷新道具 */
    refreshProps = "refreshProps",
    /**关闭奖励界面 */
    closeRewardPage = "closeRewardPage",
    /**侧边栏回访 */
    revisitSidebar = "revisitSidebar",
    /**刷新游戏摄像机视角 */
    refreshGameCamera = "refreshGameCamera",
    /**刷新游戏内货币（场内） */
    refreshGameMonetary = "refreshGameMonetary",
    /**刷新玩家坐标事件 */
    refreshPlayerPos = "refreshPlayerPos",
    /**生成建筑道具 */
    createProps = "createProps",
    /**升级建筑道具 */
    upgradeProps = "upgradeProps",
    /**通用配置表加载完成 */
    commonTableFinish = "commonTableFinish",
}

/**存储的键值 */
export enum SaveKey {
    /**关卡数据 */
    level = "level",
    /**音效开关 */
    effect = "effect",
    /**音乐开关 */
    music = "music",
    /**振动开关 */
    vibrat = "vibrat",
    /**道具存储 */
    props = "props",
    /**今日是否领取过侧边栏奖励 */
    isGetRevisit = "isGetRevisit",
    /**用户头像 */
    avatarUrl = "avatarUrl",
}

/**道具索引 */
export enum PropsName {

}
