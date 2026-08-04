/**游戏配置 */
export const configData = {
    /**人物移动速度 */
    moveSpeed: 300,
    /**游戏开始后人物移动速度 */
    moveSpeedGame: 200,
    /**瓦片大小 */
    tileSize: 64,
    /**人物皮肤数量 */
    roleSkinCount: 7,
    /**怪物皮肤数量 */
    enemySkinCount: 5,
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
    /**道具图片切换速度（秒） */
    propsImgSwitchSpeed: 0.5,
    /**人物消失时间（秒） */
    roleDisappearTime: 0.5,
    /**人机匹配显示时间区间（秒） */
    roleMatchTime: [0.5, 1.2],
    /**人机难度类型数量 */
    robotDifficultyTypeCount: 4,
    /**人机开始时间区间（秒） */
    robotStartTime: [2, 6],
}

/**敌人通用配置 */
export const enemyCommonConfig = {
    /**敌人移动速度 */
    enemyMoveSpeed: 400,
    /**敌人开始时间（秒） */
    enemyStartTime: 25,
    /**敌人血量回复速度（每秒回复百分比） */
    enemyHpRepairSpeed: 10,
    /**敌人逃走生命值比例 */
    enemyEscapeHpPercent: 0.3,
    /**敌人使用震慑时的门生命百分比（小于） */
    doorEscapeHpPercent: 0.2,
    /**敌人使用震慑时的自身生命百分比（大于） */
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
    enemyAttackInterval: [1.25, 1.75],
}

/**人机通用配置 */
export const robotCommonConfig = {
    /**发电机建造前提（时间线等级） */
    generatorBuildLevel: 5,
    /**发电机上限（个数） */
    generatorMax: 4,
    /**发电机建造间隔（秒） */
    generatorBuildInterval: [15, 25],
    /**升级发电机前提条件（床等级，实际8级时level=7，因为从0开始） */
    generatorBuildBedLevel: 8,
    /**升级发电机间隔（秒） */
    generatorUpgradeInterval: [30, 60],
    /**发电机最高等级 */
    generatorMaxLevel: 5,
    /**被怪物攻击时检测的时间阈值（从倒计时结束后开始计时，区分前期和后期） */
    enemyAttackTimeThreshold: 40,
    /**前期升级门的次数上限 */
    enemyUpgradeDoorMax: 2,
    /**前期被攻击时升级门的时间间隔（秒） */
    enemyAttackTimeUpgrade: 20,
    /**门掉血速率阈值，单次伤害百分比 */
    doorHpAttackPercent: 0.05,
    /**敌人攻击时道具建造间隔（秒） */
    enemyAttackPropsInterval: 30,
    /**敌人攻击时，建造权重 */
    enemyAttackPropsWeight: [0, 2, 2, 0, 6],
    /**敌人不攻击时道具建造间隔（秒） */
    enemyNotAttackPropsInterval: 30,
    /**敌人不攻击时，建造权重 */
    enemyNotAttackPropsWeight: [20, 10, 5, 20, 45],
}

/**gm配置 */
export const gmConfig = {
    /**是否只攻击自身 */
    onlyAttackSelf: false,
    /**是否免广告 */
    isFreeAd: false,
    /**boss是否无敌 */
    isBossInvincible: false,
    /**强制引导 */
    forceGuide: false,
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
    /**侧边栏回调 */
    revisitSidebar = "revisitSidebar",
    /**刷新游戏摄像机视角 */
    refreshGameCamera = "refreshGameCamera",
    /**刷新游戏内货币（场内） */
    refreshGameMonetary = "refreshGameMonetary",
    /**刷新游戏外货币（场外） */
    refreshPlayerMonetary = "refreshPlayerMonetary",
    /**刷新玩家坐标事件 */
    refreshPlayerPos = "refreshPlayerPos",
    /**生成建筑道具 */
    createProps = "createProps",
    /**升级建筑道具 */
    upgradeProps = "upgradeProps",
    /**通用配置表加载完成 */
    commonTableFinish = "commonTableFinish",
    /**游戏内增加货币 */
    addGameMonetary = "addGameMonetary",
    /**全皮肤 */
    fullSkin = "fullSkin",
    /**强制开始游戏 */
    forceStart = "forceStart",
    /**刷新角色皮肤 */
    refreshRoleSkin = "refreshRoleSkin",
}

/**存储的键值 */
export enum SaveKey {
    /**关卡数据 */
    level = "level",
    /**引导 */
    guide = "guide",
    /**游戏外货币（场外） */
    money = "money",
    /**音效开关 */
    effect = "effect",
    /**音效音量 */
    effectVolume = "effectVolume",
    /**音乐开关 */
    music = "music",
    /**音乐音量 */
    musicVolume = "musicVolume",
    /**振动开关 */
    vibrat = "vibrat",
    /**道具存储 */
    props = "props",
    /**今日是否领取过侧边栏奖励 */
    isGetRevisit = "isGetRevisit",
    /**用户头像 */
    avatarUrl = "avatarUrl",
    /**今日是否弹出过温馨提示 */
    isShowWarm = "isShowWarm",
    /**通关次数 */
    passCount = "passCount",
    /**已解锁角色皮肤 */
    unlockedRoleSkin = "unlockedRoleSkin",
    /**当前穿戴皮肤 */
    skinId = "skinId",
    /**敌人是否只攻击自身（gm配置） */
    onlyAttackSelf = "onlyAttackSelf",
    /**是否免广告（gm配置） */
    isFreeAd = "isFreeAd",
}

/**道具索引 */
export enum PropsName {

}
