import { _decorator, Component, director, Label, Node, sp, Sprite } from 'cc';
import { ccResTools } from '../extention/resTools';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { jsonMgr } from '../manager/jsonManager';
import { gm, PlatType } from '../manager/gm';
import { configData, enemyCommonConfig, GameEvent, robotCommonConfig, SaveKey } from '../manager/configData';
import { pData } from '../manager/playerData';
import { audioMgr } from '../manager/audioManager';
import { commonConfig } from '../json/jsonCommon';
const { ccclass, property } = _decorator;

interface BackgroundLoopData {
    node: Node;
    startX: number;
    loopWidth: number;
}

@ccclass('UILoading')
export class UILoading extends Component {
    @property(Sprite)
    progress: Sprite = null;

    @property(Label)
    percentLab: Label = null;

    @property(Node)
    zombie: Node = null;

    @property(sp.Skeleton)
    fengAnim: sp.Skeleton = null;

    @property(Node)
    city: Node = null;

    @property(Node)
    sky: Node = null;

    /**城市背景向右移动速度（像素/秒） */
    cityMoveSpeed = 200;

    /**天空背景向右移动速度（像素/秒） */
    skyMoveSpeed = 80;

    /**表格加载完成 */
    tableComplete = false;
    /**界面加载完成 */
    uiComplete = false;

    /**当前进度条百分比 */
    currentProgressPercent = 0;
    /**sdk登录完成 */
    sdkLoginComplete = false;
    /**假进度条到达95%的时间（秒） */
    fakeProgressTime = 3;
    /**假进度条从95%到达99%的时间（秒） */
    fakeProgressTime2 = 2;
    /**假进度条从99%到达100%的时间（秒） */
    fakeProgressTime3 = 10;
    /**假进度条已运行时间 */
    private fakeProgressElapsedTime = 0;
    /**风动画的时间间隔（秒） */
    private fengAnimInterval = 3;
    /**风动画已经运行的时间 */
    fengAnimTime = 0;
    /**城市背景循环数据 */
    private cityLoopData: BackgroundLoopData = null;
    /**天空背景循环数据 */
    private skyLoopData: BackgroundLoopData = null;
    /**是否已经准备跳转场景 */
    private isSceneLoading = false;

    start() {
        this.zombie = this.zombie || this.node.getChildByName("zombie");
        this.cityLoopData = this.initBackgroundLoop(this.city);
        this.skyLoopData = this.initBackgroundLoop(this.sky);
        this.refreshProgress();
        this.initData();
    }

    /**初始化拼接背景循环参数 */
    private initBackgroundLoop(node: Node): BackgroundLoopData {
        let bg1 = node?.getChildByName("bg1");
        let bg2 = node?.getChildByName("bg2");
        if (!node || !bg1 || !bg2) {
            return null;
        }

        return {
            node: node,
            startX: node.position.x,
            loopWidth: Math.abs(bg1.position.x - bg2.position.x),
        };
    }

    /**拼接背景向右无缝循环移动 */
    private updateBackgroundLoop(loopData: BackgroundLoopData, moveSpeed: number, deltaTime: number) {
        if (!loopData || loopData.loopWidth <= 0 || moveSpeed <= 0) {
            return;
        }

        let nodePos = loopData.node.position;
        let moveOffset = (nodePos.x - loopData.startX + moveSpeed * deltaTime) % loopData.loopWidth;
        loopData.node.setPosition(loopData.startX + moveOffset, nodePos.y, nodePos.z);
    }

    protected update(deltaTime: number): void {
        this.fengAnimTime += deltaTime;

        if (this.fengAnimTime >= this.fengAnimInterval) {
            this.fengAnimTime = 0;
            this.fengAnim.setAnimation(0, "feng2", false);
        }

        this.updateBackgroundLoop(this.cityLoopData, this.cityMoveSpeed, deltaTime);
        this.updateBackgroundLoop(this.skyLoopData, this.skyMoveSpeed, deltaTime);

        if (this.currentProgressPercent >= 1) {
            return;
        }

        this.fakeProgressElapsedTime += deltaTime;
        let firstProgressTime = Math.max(this.fakeProgressTime, 0);
        let secondProgressTime = Math.max(this.fakeProgressTime2, 0);
        let thirdProgressTime = Math.max(this.fakeProgressTime3, 0);
        if (firstProgressTime > 0 && this.fakeProgressElapsedTime < firstProgressTime) {
            this.currentProgressPercent = this.fakeProgressElapsedTime / firstProgressTime * 0.95;
        } else if (secondProgressTime > 0 && this.fakeProgressElapsedTime < firstProgressTime + secondProgressTime) {
            let secondElapsedTime = this.fakeProgressElapsedTime - firstProgressTime;
            this.currentProgressPercent = 0.95 + secondElapsedTime / secondProgressTime * 0.04;
        } else {
            let thirdElapsedTime = this.fakeProgressElapsedTime - firstProgressTime - secondProgressTime;
            if (thirdProgressTime <= 0) {
                this.currentProgressPercent = 1;
            } else {
                this.currentProgressPercent = 0.99 + Math.min(thirdElapsedTime / thirdProgressTime, 1) * 0.01;
            }
        }
        this.refreshProgress();
    }

    protected onEnable(): void {
        gm.Event.on(GameEvent.checkLoginLoad, this.checkLoadComplete, this);
        gm.Event.on(GameEvent.commonTableFinish, this.commonTableFinish, this);
    }

    protected onDisable(): void {
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
    loadItems = [UIPath.UIMain, UIPath.UISetting, UIPath.UISkinStore, UIPath.UIStore, UIPath.UIMatch, UIPath.UIWarm, UIPath.UIAnnouncement,UIPath.UIMoney];

    /**预加载界面 */
    async preLoadPage() {
        return new Promise<void>(async (resolve, reject) => {
            let prefabLoad = uiMgr.preLoadCommonPrefab();

            let pageLoad = Promise.all(this.loadItems.map(async ($path) => {
                try {
                    await uiMgr.preLoadPage($path);
                } catch (error) {
                    console.error(`加载 ${$path} 失败:`, error);
                }
            }));

            await Promise.all([prefabLoad, pageLoad]);

            this.uiComplete = true;
            this.checkLoadComplete();
            resolve();
        });
    }

    /**刷新进度条 */
    refreshProgress() {
        let progressPercent = Math.min(Math.max(this.currentProgressPercent, 0), 1);
        this.progress.fillRange = progressPercent;
        this.percentLab.string = `${(progressPercent * 100).toFixed(0)}%`;

        if (this.zombie) {
            let zombiePos = this.zombie.position;
            this.zombie.setPosition(-466 + 932 * progressPercent, zombiePos.y, zombiePos.z);
        }
    }

    /**加载表格 */
    loadTable() {
        jsonMgr.load();
    }

    /**表格加载完成 */
    tableLoadComplete() {
        pData.initPropsNum();
        this.tableComplete = true;
        this.checkLoadComplete();
    }

    /**加载完成判断 */
    checkLoadComplete() {
        if (this.isSceneLoading || !this.tableComplete || !this.uiComplete || !gm.isLogin || !this.sdkLoginComplete) {
            return;
        }

        this.isSceneLoading = true;
        this.currentProgressPercent = 1;
        this.refreshProgress();
        this.scheduleOnce(() => director.loadScene("main"), 0);
    }

    /**获取通用配置中的百分比区间，兼容旧的单值配置 */
    private getCommonPercentRange(key: string): [number, number] {
        let configValue = commonConfig.getValue(key);
        if (typeof configValue == "string") {
            configValue = JSON.parse(configValue);
        }

        if (Array.isArray(configValue)) {
            return [Number(configValue[0]) / 100, Number(configValue[1]) / 100];
        }

        let percentValue = Number(configValue) / 100;
        return [percentValue, percentValue];
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
        configData.robotStartTime = JSON.parse(commonConfig.getValue("robotStartTime"));
        configData.addMoneyNum = commonConfig.getValueNumber("addMoneyNum");
        configData.bossModeLevel = commonConfig.getValueNumber("bossModeLevel");
        configData.doorVibrateHpThreshold = commonConfig.getValueNumber("doorVibrateHpThreshold") / 100;
        configData.guideDifficultyMultiplier = commonConfig.getValueNumber("guideDifficultyMultiplier");

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
        enemyCommonConfig.cannonAttackTimeThreshold = commonConfig.getValueNumber("cannonAttackTimeThreshold");
        enemyCommonConfig.doorAttackTimeThreshold = JSON.parse(commonConfig.getValue("doorAttackTimeThreshold"));
        enemyCommonConfig.doorAttackTimeDamage = commonConfig.getValueNumber("doorAttackTimeDamage");
        enemyCommonConfig.enemyHpAttackPercent = commonConfig.getValueNumber("enemyHpAttackPercent") / 100;
        enemyCommonConfig.doorHpAttackPercent = this.getCommonPercentRange("doorHpAttackPercent");
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
        robotCommonConfig.enemyAttackTimeThreshold = commonConfig.getValueNumber("enemyAttackTimeThreshold");
        robotCommonConfig.enemyUpgradeDoorMax = commonConfig.getValueNumber("enemyUpgradeDoorMax");
        robotCommonConfig.enemyAttackTimeUpgrade = commonConfig.getValueNumber("enemyAttackTimeUpgrade");
        robotCommonConfig.doorHpAttackPercent = commonConfig.getValueNumber("robotDoorHpAttackPercent") / 100;
        robotCommonConfig.enemyAttackPropsInterval = commonConfig.getValueNumber("enemyAttackPropsInterval");
        robotCommonConfig.enemyAttackPropsWeight = JSON.parse(commonConfig.getValue("enemyAttackPropsWeight"));
        robotCommonConfig.enemyNotAttackPropsInterval = commonConfig.getValueNumber("enemyNotAttackPropsInterval");
        robotCommonConfig.enemyNotAttackPropsWeight = JSON.parse(commonConfig.getValue("enemyNotAttackPropsWeight"));

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
                this.checkLoadComplete();

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
