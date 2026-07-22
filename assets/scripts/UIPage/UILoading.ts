import { _decorator, Component, director, Label, Node, Sprite } from 'cc';
import { ccResTools } from '../extention/resTools';
import { gamePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { jsonMgr } from '../manager/jsonManager';
import { gm, PlatType } from '../manager/gm';
import { configData, enemyCommonConfig, GameEvent, robotCommonConfig, SaveKey } from '../manager/configData';
import { pData } from '../manager/playerData';
import { audioMgr } from '../manager/audioManager';
import { commonConfig } from '../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('UILoading')
export class UILoading extends Component {
    @property(Sprite)
    progress: Sprite = null;

    @property(Label)
    percentLab: Label = null;

    /**表格加载完成 */
    tableComplete = false;
    /**界面加载完成 */
    uiComplete = false;

    /**总进度 */
    totalProgressMap = {};
    /**当前进度 */
    currentProgressMap = {};
    /**当前进度条百分比 */
    currentProgressPercent = 0;
    /**sdk登录完成 */
    sdkLoginComplete = false;

    start() {
        this.initData();
    }

    protected onEnable(): void {
        gm.Event.on(GameEvent.loading, this.loadingComplete, this);
        gm.Event.on(GameEvent.checkLoginLoad, this.checkLoadComplete, this);
        gm.Event.on(GameEvent.commonTableFinish, this.commonTableFinish, this);
    }

    protected onDisable(): void {
        gm.Event.off(GameEvent.loading, this.loadingComplete, this);
        gm.Event.off(GameEvent.checkLoginLoad, this.checkLoadComplete, this);
        gm.Event.off(GameEvent.commonTableFinish, this.commonTableFinish, this);
    }

    async initData() {
        gm.Event.on(GameEvent.tableLoadComplete, this.tableLoadComplete, this);
        this.initStorageData();
        this.initSDK();

        await this.preLoadBundle();

        audioMgr.playBackgroundMusic();
        this.loadTable();

        this.preLoadPage();
    }

    /**预加载bundle */
    async preLoadBundle() {
        return new Promise<void>(async (resolve, reject) => {
            let resBundle = await ccResTools.loadBundle("res");
            uiMgr.resBundle = resBundle;
            resolve();
        });
    }
    loadItems = [UIPath.UIMain, gamePath.UIGame, UIPath.UISetting, UIPath.UISkinStore, UIPath.UIBuild, UIPath.UIProps];

    /**预加载界面 */
    async preLoadPage() {
        return new Promise<void>(async (resolve, reject) => {
            this.totalProgressMap = {};
            this.currentProgressMap = {};
            this.currentProgressPercent = 0;

            this.refreshProgress();

            let prefabLoad = uiMgr.preLoadPrefab();

            let pageLoad = Promise.all(this.loadItems.map(async ($path) => {
                try {
                    await uiMgr.preLoadPage($path);
                } catch (error) {
                    console.error(`加载 ${$path} 失败:`, error);
                }
            }));

            await Promise.all([prefabLoad, pageLoad]);

            this.currentProgressPercent = 1;
            this.refreshProgress();
            this.uiComplete = true;
            this.checkLoadComplete();
            resolve();
        });
    }

    /**预制体加载回调 */
    loadingComplete(data) {
        let finish = data[0];
        let total = data[1];
        let path = data[2];
        // console.log("finish:", finish, "total:", total, "path:", path);

        this.totalProgressMap[path] = total;
        this.currentProgressMap[path] = finish;

        let totalProgress = 0;
        let currentProgress = 0;

        for (let key in this.totalProgressMap) {
            totalProgress += this.totalProgressMap[key];
        }
        for (let key in this.currentProgressMap) {
            currentProgress += this.currentProgressMap[key];
        }

        let tempPercent = currentProgress / totalProgress;

        //防止进度条回退（且保证进度条加载完不丢失）
        if (tempPercent != 1 && tempPercent < this.currentProgressPercent) {
            return;
        }

        this.currentProgressPercent = tempPercent;
        this.refreshProgress();

        this.checkLoadComplete();
    }

    /**刷新进度条 */
    refreshProgress() {
        this.progress.fillRange = this.currentProgressPercent;
        this.percentLab.string = `加载中 ${(this.currentProgressPercent * 100).toFixed(1)}%`;
    }

    /**加载表格 */
    loadTable() {
        jsonMgr.load();
    }

    /**表格加载完成 */
    tableLoadComplete() {
        this.tableComplete = true;
        this.checkLoadComplete();
    }

    /**加载完成判断 */
    checkLoadComplete() {
        if (this.tableComplete && this.uiComplete && gm.isLogin && this.sdkLoginComplete) {
            director.loadScene("main");
        }
    }

    /**通用配置表加载完成 */
    commonTableFinish() {
        //通用
        configData.moveSpeed = commonConfig.getValueNumber("moveSpeed");
        configData.moveSpeedGame = commonConfig.getValueNumber("moveSpeedGame");
        configData.bulletSpeed = commonConfig.getValueNumber("bulletSpeed");
        configData.repairTime = commonConfig.getValueNumber("repairTime");
        configData.repairCoolDown = commonConfig.getValueNumber("repairCoolDown");
        configData.doorRepairSpeed = commonConfig.getValueNumber("doorRepairSpeed");
        configData.doorRepairSpeedAdd = commonConfig.getValueNumber("doorRepairSpeedAdd");
        configData.roomPropsProbability = commonConfig.getValueNumber("roomPropsProbability") / 100;
        configData.randomPropsNum = JSON.parse(commonConfig.getValue("randomPropsNum"));
        configData.doorHpShowTime = commonConfig.getValueNumber("doorHpShowTime");
        configData.roleMatchTime = JSON.parse(commonConfig.getValue("roleMatchTime"));
        //敌人
        enemyCommonConfig.enemyMoveSpeed = commonConfig.getValueNumber("enemyMoveSpeed");
        enemyCommonConfig.enemyHpRepairSpeed = commonConfig.getValueNumber("enemyHpRepairSpeed");
        enemyCommonConfig.enemyStartTime = commonConfig.getValueNumber("enemyStartTime");
        enemyCommonConfig.enemyEscapeHpPercent = commonConfig.getValueNumber("enemyEscapeHpPercent") / 100;
        enemyCommonConfig.doorEscapeHpPercent = commonConfig.getValueNumber("doorEscapeHpPercent") / 100;
        enemyCommonConfig.selfEscapeHpPercent = commonConfig.getValueNumber("selfEscapeHpPercent") / 100;
        enemyCommonConfig.fearRange = commonConfig.getValueNumber("fearRange");
        enemyCommonConfig.fearTime = commonConfig.getValueNumber("fearTime");
        enemyCommonConfig.rageAttackSpeed = commonConfig.getValueNumber("rageAttackSpeed");
        enemyCommonConfig.rageTime = commonConfig.getValueNumber("rageTime");
        enemyCommonConfig.rageUseInterval = commonConfig.getValueNumber("rageUseInterval");
        enemyCommonConfig.doorAttackTimeThreshold = commonConfig.getValueNumber("doorAttackTimeThreshold");
        enemyCommonConfig.doorAttackTimeDamage = commonConfig.getValueNumber("doorAttackTimeDamage");
        enemyCommonConfig.enemyHpAttackPercent = commonConfig.getValueNumber("enemyHpAttackPercent") / 100;
        enemyCommonConfig.doorHpAttackPercent = commonConfig.getValueNumber("doorHpAttackPercent") / 100;
        enemyCommonConfig.goalHpThresholdPercent = commonConfig.getValueNumber("goalHpThresholdPercent") / 100;
        enemyCommonConfig.doorAttackTimeDamagePercent = commonConfig.getValueNumber("doorAttackTimeDamagePercent") / 100;
        enemyCommonConfig.returnStartTime = commonConfig.getValueNumber("returnStartTime");
        enemyCommonConfig.enemyAttackInterval = JSON.parse(commonConfig.getValue("enemyAttackInterval"));
        //人机
        robotCommonConfig.generatorBuildBedLevel = commonConfig.getValueNumber("generatorBuildBedLevel");
        robotCommonConfig.generatorBuildLevel = commonConfig.getValueNumber("generatorBuildLevel");
        robotCommonConfig.generatorMax = commonConfig.getValueNumber("generatorMax");
        robotCommonConfig.generatorBuildInterval = JSON.parse(commonConfig.getValue("generatorBuildInterval"));
        robotCommonConfig.generatorUpgradeInterval = JSON.parse(commonConfig.getValue("generatorUpgradeInterval"));
        robotCommonConfig.generatorMaxLevel = commonConfig.getValueNumber("generatorMaxLevel");
        robotCommonConfig.veinBuildLevel = commonConfig.getValueNumber("veinBuildLevel");
        robotCommonConfig.veinBuildInterval = JSON.parse(commonConfig.getValue("veinBuildInterval"));
        robotCommonConfig.veinMax = commonConfig.getValueNumber("veinMax");
        robotCommonConfig.veinBuildWeight = JSON.parse(commonConfig.getValue("veinBuildWeight"));

        robotCommonConfig.enemyAttackTimeThreshold = commonConfig.getValueNumber("enemyAttackTimeThreshold");
        robotCommonConfig.enemyUpgradeDoorMax = commonConfig.getValueNumber("enemyUpgradeDoorMax");
        robotCommonConfig.enemyAttackTimeUpgrade = commonConfig.getValueNumber("enemyAttackTimeUpgrade");
        robotCommonConfig.doorHpAttackPercent = commonConfig.getValueNumber("doorHpAttackPercent") / 100;
        robotCommonConfig.cannonBuildDistance = commonConfig.getValueNumber("cannonBuildDistance");
        robotCommonConfig.cannonBuildTimeThreshold = JSON.parse(commonConfig.getValue("cannonBuildTimeThreshold"));
        robotCommonConfig.cannonBuildLevel = commonConfig.getValueNumber("cannonBuildLevel");
        robotCommonConfig.cannonBuildUpgradeCoolDown = commonConfig.getValueNumber("cannonBuildUpgradeCoolDown");
        robotCommonConfig.cannonBuildTimeThresholdLater = commonConfig.getValueNumber("cannonBuildTimeThresholdLater");
        robotCommonConfig.cannonBuildLevelLater = commonConfig.getValueNumber("cannonBuildLevelLater");
        robotCommonConfig.cannonBuildUpgradeCoolDownLater = commonConfig.getValueNumber("cannonBuildUpgradeCoolDownLater");
        robotCommonConfig.propsBuildTimedLater = commonConfig.getValueNumber("propsBuildTimedLater");
        robotCommonConfig.machineBuildTimeThreshold = commonConfig.getValueNumber("machineBuildTimeThreshold");
        robotCommonConfig.iceBuildTimeThreshold = commonConfig.getValueNumber("iceBuildTimeThreshold");
        robotCommonConfig.checkTeamRange = commonConfig.getValueNumber("checkTeamRange");
        robotCommonConfig.maxUpgradeCannonLevel = commonConfig.getValueNumber("maxUpgradeCannonLevel");

        console.log("------------>公共配置表数据同步完毕");
    }

    initSDK() {
        this.sdkLoginComplete = false;
        if (gm.API.PLAT && gm.API.PLAT.HgSdk) {
            console.warn("初始化HgSdk");
            gm.hgSdk = new gm.API.PLAT.HgSdk();
            gm.hgSdk.init((res) => {
                const gameId = res.game_id
                const status = res.status
                this.sdkLoginComplete = true;

                if (status === 0) {
                    // 调用登录
                    gm.hgSdk.login((res) => {
                        // console.warn("登录成功，uid:", res.uid, "token:", res.token);
                    })
                }
            })
        } else {
            this.sdkLoginComplete = true;
            console.warn("没有HgSdk对象");
        }
    }

    /**初始化存储数据 */
    initStorageData() {
        pData.initData();
    }

}
