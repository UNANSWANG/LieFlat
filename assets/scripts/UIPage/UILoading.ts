import { _decorator, Component, director, Label, Node, Sprite } from 'cc';
import { ccResTools } from '../extention/resTools';
import { gamePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { jsonMgr } from '../manager/jsonManager';
import { gm, PlatType } from '../manager/gm';
import { configData, enemyCommonConfig, GameEvent, SaveKey } from '../manager/configData';
import { ccStorageTools } from '../extention/storageTools';
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
    loadItems = [UIPath.UIMain, gamePath.UIGame, UIPath.UISetting, UIPath.UIBuild, UIPath.UIProps];

    /**预加载界面 */
    async preLoadPage() {
        return new Promise<void>(async (resolve, reject) => {
            this.totalProgressMap = {};
            this.currentProgressMap = {};
            this.currentProgressPercent = 0;

            this.refreshProgress();

            uiMgr.preLoadPrefab();

            this.loadItems.map(async ($path) => {
                try {
                    uiMgr.preLoadPage($path);
                } catch (error) {
                    console.error(`加载 ${$path} 失败:`, error);
                }
            });

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

        if (tempPercent == 1) {
            this.uiComplete = true;
        }

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
        if (this.tableComplete && this.uiComplete && gm.isLogin) {
            director.loadScene("main");
        }
    }

    /**通用配置表加载完成 */
    commonTableFinish() {
        configData.moveSpeed = Number(commonConfig.getValue("moveSpeed"));
        configData.moveSpeedGame = Number(commonConfig.getValue("moveSpeedGame"));
        configData.enemyMoveSpeed = Number(commonConfig.getValue("enemyMoveSpeed"));
        configData.bulletSpeed = Number(commonConfig.getValue("bulletSpeed"));
        configData.repairTime = Number(commonConfig.getValue("repairTime"));
        configData.repairCoolDown = Number(commonConfig.getValue("repairCoolDown"));
        configData.doorRepairSpeed = Number(commonConfig.getValue("doorRepairSpeed"));
        configData.doorRepairSpeedAdd = Number(commonConfig.getValue("doorRepairSpeedAdd"));
        enemyCommonConfig.enemyHpRepairSpeed = Number(commonConfig.getValue("enemyHpRepairSpeed"));
        enemyCommonConfig.enemyStartTime = Number(commonConfig.getValue("enemyStartTime"));
        enemyCommonConfig.enemyEscapeHpPercent = Number(commonConfig.getValue("enemyEscapeHpPercent")) / 100;
        enemyCommonConfig.doorEscapeHpPercent = Number(commonConfig.getValue("doorEscapeHpPercent")) / 100;
        enemyCommonConfig.selfEscapeHpPercent = Number(commonConfig.getValue("selfEscapeHpPercent")) / 100;
        enemyCommonConfig.fearRange = Number(commonConfig.getValue("fearRange"));
        enemyCommonConfig.fearTime = Number(commonConfig.getValue("fearTime"));
        enemyCommonConfig.rageAttackSpeed = Number(commonConfig.getValue("rageAttackSpeed"));
        enemyCommonConfig.rageTime = Number(commonConfig.getValue("rageTime"));
        enemyCommonConfig.rageUseInterval = Number(commonConfig.getValue("rageUseInterval"));
        enemyCommonConfig.doorAttackTimeThreshold = Number(commonConfig.getValue("doorAttackTimeThreshold"));
        enemyCommonConfig.doorAttackTimeDamage = Number(commonConfig.getValue("doorAttackTimeDamage"));
        enemyCommonConfig.enemyHpAttackPercent = Number(commonConfig.getValue("enemyHpAttackPercent")) / 100;
        enemyCommonConfig.doorHpAttackPercent = Number(commonConfig.getValue("doorHpAttackPercent")) / 100;
        enemyCommonConfig.goalHpThresholdPercent = Number(commonConfig.getValue("goalHpThresholdPercent")) / 100;   
        enemyCommonConfig.doorAttackTimeDamagePercent = Number(commonConfig.getValue("doorAttackTimeDamagePercent")) / 100;
        enemyCommonConfig.returnStartTime = Number(commonConfig.getValue("returnStartTime"));
        console.log("------------>公共配置表数据同步完毕");
    }

    /**初始化存储数据 */
    initStorageData() {
        pData.initPropsNum();

        pData.level = ccStorageTools.getNumberData(SaveKey.level) || 0;

        //TODO 测试用，后续注释掉
        if (gm.platType == PlatType.h5) {
            // pData.level = 3;
        }
    }

}
