import { _decorator, math, Vec2, Vec3 } from 'cc';
import { levelConfig } from '../json/jsonLevel';
import { ccStorageTools } from '../extention/storageTools';
import { configData, GameEvent, gmConfig, PropsName, SaveKey } from './configData';
import { gm, PlatType } from './gm';
import { httpMgr } from '../sdk/network/httpManager';
import { urlConfig } from '../sdk/network/netConfig';
import { propsConfig } from '../json/jsonProps';
import { enemyMgr } from './enemyManager';
const { ccclass, property } = _decorator;

//用户游戏内数据
@ccclass('playerData')
export class playerData {
    /**当前已通关关卡数 */
    level = 0;
    /**道具集合 */
    propsNums = {};
    /**当前地图的大小 */
    mapSize: math.Size = math.Size.ZERO;
    /**地图半宽高 */
    mapHalfSize: Vec2 = Vec2.ZERO;
    /**游戏币（场内） */
    gameCoin = 0;
    /**玩家电能（场内） */
    gamePower = 0;
    /**感染币（场外） */
    money = 0;
    /**本局可使用广告升级门的次数 */
    adUpgradeDoorCount = 1;
    /**当前关卡所看广告数 */
    adNum = 0;
    /**当前皮肤id */
    skinId = 0;
    /**已解锁角色皮肤 */
    unlockedRoleSkin: { [key: string]: boolean } = {};
    /**是否为引导关 */
    isGuide = false;
    /**当前关卡允许的人机难度类型 */
    AIdifficultyTypes: number[] = [];
    /**角色默认皮肤id，角色皮肤表加载后赋值 */
    private defaultSkinId: number = null;
    /**是否已经收到登录接口下发的游戏数据 */
    private isGameDataLoaded = false;
    /**游戏数据上报状态，避免连续修改产生乱序覆盖 */
    private isReportingGame = false;
    /**是否存在尚未上报的游戏数据修改 */
    private isGameReportDirty = false;
    /**是否已安排微任务上报，用于合并同一轮同步操作产生的多次修改 */
    private isGameReportScheduled = false;

    levelInit() {
        pData.adNum = 0;
        this.gameCoin = 0;
        this.gamePower = 0;
        this.adUpgradeDoorCount = 1;
        this.isGuide = ccStorageTools.getNumberData(SaveKey.guide) != 1 || gmConfig.forceGuide;
        let levelTableIndex = this.getEnemyLevelTableIndex();
        enemyMgr.enemyAllData = levelConfig.getBossAllData(levelTableIndex);
        this.AIdifficultyTypes = levelConfig.getAIDifficultyTypes(levelTableIndex);

        console.warn("--------------->当前关卡敌人全等级数据\n", enemyMgr.enemyAllData);
        this.SDKReportLevelStart();
    }

    /**获取当前关卡使用的敌人关卡表索引 */
    getEnemyLevelTableIndex(): number {
        return levelConfig.getLevelIndex(this.level)[0];
    }

    /**SDK关卡开始上报 */
    SDKReportLevelStart() {
        if (gm.hgSdk) {
            gm.hgSdk.track('LEVEL_ENTER', {
                enter_level_id: 0,	    //进入的关卡进度（ 0 ~ 1 之间的数值），需保留两位小数
                level_id: (pData.level + 1),    	//关卡ID，数值
            });
        }
    }

    /**SDK关卡中途退出上报 */
    SDKReportLevelExit() {
        if (gm.hgSdk) {
            gm.hgSdk.track('LEVEL_EXIT', {
                ad_cnt: pData.adNum,
                enter_level_id: 0,	    //进入的关卡进度（ 0 ~ 1 之间的数值），需保留两位小数
                level_id: (pData.level + 1),    	//关卡ID，数值
            });
        }
    }

    /**SDK关卡失败上报 */
    SDKReportLevelFail() {
        if (gm.hgSdk) {
            gm.hgSdk.track('LEVEL_LOSE', {
                ad_cnt: pData.adNum,
                enter_level_id: 0,	    //进入的关卡进度（ 0 ~ 1 之间的数值），需保留两位小数
                level_id: (pData.level + 1),    	//关卡ID，数值
            });
        }
    }

    /**SDK关卡完成上报 */
    SDKReportLevelComplete() {
        if (gm.hgSdk) {
            gm.hgSdk.track('LEVEL_PASS', {
                ad_cnt: pData.adNum,
                enter_level_id: 0,	    //进入的关卡进度（ 0 ~ 1 之间的数值），需保留两位小数
                level_id: (pData.level + 1),    	//关卡ID，数值
            });
        }
    }

    /**上报关卡给后端 */
    reportLevel(isPass) {
        let progress = 0;
        //已经通关进度就是100%
        if (isPass) {
            progress = 100;
        } else {
            progress = 0;
        }

        let levelReprotData = {
            is_pass: isPass ? 1 : 0,
            level: this.level + 1,
            level_progress: progress,
        }

        //TODO 测试
        // console.warn("上报关卡给后端", levelReprotData);
        httpMgr.post(urlConfig.levelReport, levelReprotData);
    }

    /**增加用户关卡数 */
    addLevel() {
        //上报关卡完成
        this.reportLevel(true);
        this.level++;
        ccStorageTools.setData(SaveKey.level, this.level);

        //上传微信好友榜
        if (gm.platType === PlatType.wx) {
            const kvDataList = [];
            kvDataList.push({
                key: `level`,
                value: `${this.level}`
            });
            gm.API.setUserCloudStorage(kvDataList);
        }

    }

    /**修改局内金币 */
    fixGameCoin(coin: number) {
        this.gameCoin += coin;
        gm.Event.emit(GameEvent.refreshGameMonetary);
    }

    /**修改局内电能 */
    fixGamePower(power: number) {
        this.gamePower += power;
        gm.Event.emit(GameEvent.refreshGameMonetary);
    }

    /**设置道具数量 */
    setPropsNum(propsName: PropsName, num: number) {
        if (num < 0) {
            num = 0;
        }
        this.propsNums[propsName] = num;
        this.reportGame();
        gm.Event.emit(GameEvent.refreshProps);
    }

    /**获取道具数量 */
    getPropsNum(propsName: PropsName) {
        return this.propsNums[propsName] || 0;
    }

    /**修改道具数量 */
    fixPropsNum(propsName: PropsName, num = 1, isRefresh = true) {
        let tempNum = this.propsNums[propsName] || 0;
        tempNum += num;
        if (tempNum < 0) {
            tempNum = 0;
        }
        this.propsNums[propsName] = tempNum;
        this.reportGame();
        if (isRefresh) {
            gm.Event.emit(GameEvent.refreshProps);
        }
    }

    /**获取带等级道具的存储键 */
    private getLevelPropsNumKey(propsType: string, level: number) {
        return propsType + "_" + level;
    }

    /**设置带等级道具数量 */
    setLevelPropsNum(propsType: string, level: number, num: number) {
        if (num < 0) {
            num = 0;
        }
        let propsKey = this.getLevelPropsNumKey(propsType, level);
        this.propsNums[propsKey] = num;
        this.reportGame();
        gm.Event.emit(GameEvent.refreshProps);
    }

    /**获取带等级道具数量 */
    getLevelPropsNum(propsType: string, level: number) {
        let propsKey = this.getLevelPropsNumKey(propsType, level);
        return this.propsNums[propsKey] || 0;
    }

    /**修改带等级道具数量 */
    fixLevelPropsNum(propsType: string, level: number, num = 1, isRefresh = true) {
        let propsKey = this.getLevelPropsNumKey(propsType, level);
        let tempNum = this.propsNums[propsKey] || 0;
        tempNum += num;
        if (tempNum < 0) {
            tempNum = 0;
        }
        this.propsNums[propsKey] = tempNum;
        this.reportGame();
        if (isRefresh) {
            gm.Event.emit(GameEvent.refreshProps);
        }
    }

    /**修改感染币（场外） */
    fixMoney(money: number) {
        this.money += money;
        if (this.money < 0) {
            this.money = 0;
        }
        this.reportGame();
        gm.Event.emit(GameEvent.refreshPlayerMonetary);
    }

    /**初始化当前穿戴皮肤 */
    initSkinData(defaultSkinId: number) {
        this.defaultSkinId = defaultSkinId;
        if (!this.isGameDataLoaded) {
            return;
        }

        this.completeSkinData();
    }

    /**设置当前穿戴皮肤 */
    setSkinId(skinId: number) {
        let isChanged = this.skinId != skinId;
        this.skinId = skinId;
        if (isChanged) {
            this.reportGame();
            gm.Event.emit(GameEvent.refreshRoleSkin);
        }
    }

    /**判断角色皮肤是否已解锁 */
    isSkinUnlocked(skinId: number) {
        return !!this.unlockedRoleSkin[skinId + ""];
    }

    /**设置角色皮肤解锁状态 */
    setSkinUnlocked(skinId: number, unlocked = true) {
        let key = skinId + "";
        if (!!this.unlockedRoleSkin[key] == unlocked) {
            return;
        }

        this.unlockedRoleSkin[key] = unlocked;
        this.reportGame();
    }

    /**设置全皮肤拥有 */
    getAllSkin() {
        for (let i = 0; i < configData.roleSkinCount; i++) {
            this.unlockedRoleSkin[i + ""] = true;
        }

        this.reportGame();
    }

    /**使用登录接口下发的云端游戏数据 */
    initGameData(gold: any, ext: any) {
        let gameExt = ext && typeof ext == "object" && !Array.isArray(ext) ? ext : {};

        this.money = Math.max(0, Number(gold) || 0);
        this.propsNums = gameExt.propsNums && typeof gameExt.propsNums == "object"
            ? Object.assign({}, gameExt.propsNums)
            : {};
        this.unlockedRoleSkin = gameExt.unlockedRoleSkin && typeof gameExt.unlockedRoleSkin == "object"
            ? Object.assign({}, gameExt.unlockedRoleSkin)
            : {};
        this.skinId = Number.isInteger(+gameExt.skinId) && +gameExt.skinId >= 0
            ? +gameExt.skinId
            : this.defaultSkinId;
        this.isGameDataLoaded = true;

        this.initPropsNum();
        this.completeSkinData();
    }

    /**没有云端道具数据时，按商城配置初始化每种道具数量 */
    initPropsNum() {
        if (!this.isGameDataLoaded || propsConfig.storePropsData.length <= 0 || Object.keys(this.propsNums).length > 0) {
            return;
        }

        for (let i = 0; i < propsConfig.storePropsData.length; i++) {
            let propsList = propsConfig.storePropsData[i] || [];
            for (let j = 0; j < propsList.length; j++) {
                let propsData = propsList[j];
                let propsKey = this.getLevelPropsNumKey(propsData.propsType, propsData.level);
                this.propsNums[propsKey] = Math.max(0, Number(propsData.storeInitNum) || 0);
            }
        }
        this.reportGame();
    }

    /**补全新用户的默认皮肤数据 */
    private completeSkinData() {
        if (this.defaultSkinId == null) {
            return;
        }

        let isChanged = false;
        if (!Number.isInteger(this.skinId) || this.skinId < 0) {
            this.skinId = this.defaultSkinId;
            isChanged = true;
        }
        if (!this.isSkinUnlocked(this.defaultSkinId)) {
            this.unlockedRoleSkin[this.defaultSkinId + ""] = true;
            isChanged = true;
        }

        if (isChanged) {
            this.reportGame();
        }
    }

    /**上报感染币、皮肤和道具数据 */
    reportGame() {
        if (!gm.isLogin) {
            return;
        }

        this.isGameReportDirty = true;
        if (!this.isGameDataLoaded || !Number.isInteger(this.skinId)) {
            return;
        }
        if (this.isReportingGame || this.isGameReportScheduled) {
            return;
        }

        // 合并购买皮肤等同步流程中的多次数据修改，统一上报最终状态。
        this.isGameReportScheduled = true;
        Promise.resolve().then(() => {
            this.isGameReportScheduled = false;
            this.flushGameReport();
        });
    }

    /**串行上报，避免旧请求后返回并覆盖新数据 */
    private async flushGameReport() {
        if (this.isReportingGame || !this.isGameReportDirty || !gm.isLogin) {
            return;
        }

        this.isGameReportDirty = false;
        this.isReportingGame = true;
        try {
            await httpMgr.post(urlConfig.reportGame, {
                gold: this.money,
                ext: {
                    skinId: this.skinId,
                    unlockedRoleSkin: Object.assign({}, this.unlockedRoleSkin),
                    propsNums: Object.assign({}, this.propsNums),
                },
            });
        } finally {
            this.isReportingGame = false;
            if (this.isGameReportDirty) {
                this.flushGameReport();
            }
        }
    }

    /**初始化存储数据 */
    initData() {
        gmConfig.onlyAttackSelf = ccStorageTools.getNumberData(SaveKey.onlyAttackSelf) == 1;
        gmConfig.isFreeAd = ccStorageTools.getNumberData(SaveKey.isFreeAd) == 1;
    }
}

export let pData = new playerData();

interface jsonLevelData {
    /**关卡宽度 */
    width: number;
    /**关卡高度 */
    height: number;
    /**小箭头数据 */
    arrowData: any[];
    /**大箭头数据 */
    bigArrowData: any[];
    /**道具数据 */
    propsData: any[];
    /**边缘道具数据 */
    externalPropsData: any[];
}
