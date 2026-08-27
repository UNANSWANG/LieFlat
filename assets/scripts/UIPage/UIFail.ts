import { _decorator, Component, Node, Animation, Label, sp, tween, Tween, Vec3 } from 'cc';
import { audioPath, spinePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { UIBase } from './UIBase';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
import { zoomButton } from '../extention/zoomButton';
import { ccTools } from '../extention/generalTools';
import { videoMgr } from '../manager/videoManager';
import { pData } from '../manager/playerData';
import { tilePropsType } from '../controller/tileItemController';
import { loop_anim, loopAnimation } from '../controller/loopAnimation';
import { audioMgr } from '../manager/audioManager';
const { ccclass, property } = _decorator;

export enum FailType {
    /**时间到 */
    TimeOut = 0,
    /**生命值为0 */
    LifeZero = 1,
}
@ccclass('UIFail')
export class UIFail extends UIBase {
    @property(Node)
    adBtn: Node;

    @property(Node)
    commonBtn: Node;

    @property(Node)
    moneyRewardNode: Node;

    @property(Node)
    boxRewardNode: Node;

    @property(Node)
    boxNode: Node;

    @property(sp.Skeleton)
    roleSk: sp.Skeleton;

    @property(Label)
    timeLab: Label;

    @property(Node)
    title: Node;

    @property(Node)
    titleLogo: Node;

    /**是否为敌人模式结算 */
    private isEnemyMode = false;

    /**奖励污染币数量 */
    moneyNum = 0;
    /**奖励魔盒数量 */
    boxNum = 0;
    /**本次胜利奖励是否已领取或正在领取 */
    private isRewardClaimed = false;
    /**广告按钮循环动画 */
    private adBtnAnimation: loopAnimation = null;

    protected onLoad(): void {
        this.initAdBtnAnimation();
        this.bindBtn();
    }

    onUI_Open(data?: any) {
        gm.gamePause();
        audioMgr.playEffect(audioPath.fail);
        this.playOpenAnim();
        this.initData(data);
        this.adBtnAnimation.playAni();
    }

    /**播放标题开屏缩放动画 */
    private playOpenAnim() {
        let titleNodes = [this.title, this.titleLogo];
        for (let i = 0; i < titleNodes.length; i++) {
            let titleNode = titleNodes[i];
            if (!titleNode || !titleNode.isValid) {
                continue;
            }

            Tween.stopAllByTarget(titleNode);
            titleNode.setScale(new Vec3(2, 2, 1));
            tween(titleNode)
                .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
                .start();
        }
    }

    /**初始化广告按钮循环放缩动画 */
    private initAdBtnAnimation() {
        this.adBtnAnimation = this.adBtn.getComponent(loopAnimation) || this.adBtn.addComponent(loopAnimation);
        this.adBtnAnimation.startPlay = false;
        this.adBtnAnimation.animType = loop_anim.scaling;
        this.adBtnAnimation.scaleOffset = 0.08;
    }

    initData(data?) {
        this.isEnemyMode = pData.matchMode == 1;
        let skinId = Number.isInteger(data?.skinId) && data.skinId >= 0 ? data.skinId : 0;
        this.refreshTitleImage();
        if (this.isEnemyMode) {
            this.refreshRoleSpine(skinId);
        } else {
            let enemySkinId = Number.isInteger(data?.enemySkinId) && data.enemySkinId >= 0 ? data.enemySkinId : 0;
            this.refreshEnemySpine(enemySkinId);
        }

        let survivalTime = Math.max(0, Number(data?.survivalTime) || 0);
        this.initRewardNum(survivalTime);
        this.timeLab.string = `存活时间：${Math.floor(survivalTime)}s`;
        this.isRewardClaimed = false;
        this.refreshRewardNum();
        this.refreshBoxNum();

        this.boxRewardNode.active = this.boxNum > 0;

        pData.SDKReportLevelFail();
        this.SDKAdReport();
        pData.reportLevel(false);
    }

    /**根据存活时间初始化失败基础奖励 */
    private initRewardNum(survivalTime: number) {
        this.moneyNum = 2 + (2 + pData.difficultyIndex) * Math.max(1, Math.ceil(survivalTime / 300));
        this.boxNum = 0;
    }

    /**加载失败界面敌人并循环播放待机动画 */
    private async refreshEnemySpine(enemySkinId: number) {
        if (!this.roleSk) {
            return;
        }

        this.roleSk.skeletonData = null;
        let isLoaded = await ccTools.loadSpine(this.roleSk, spinePath.boss + enemySkinId);
        if (!isLoaded) {
            return;
        }

        this.roleSk.timeScale = 0.5;
        this.roleSk.setAnimation(0, "idle", true);
    }

    /**加载敌人模式失败时击败玩家敌人的角色动画 */
    private async refreshRoleSpine(skinId: number) {
        if (!this.roleSk) {
            return;
        }

        this.roleSk.skeletonData = null;
        let isLoaded = await ccTools.loadSpine(this.roleSk, spinePath.role + skinId);
        if (!isLoaded) {
            return;
        }

        this.roleSk.timeScale = 1;
        this.roleSk.setAnimation(0, "idle", true);
    }

    /**常规模式显示 img1，敌人模式显示 img2 */
    private refreshTitleImage() {
        let img1 = this.title?.getChildByName("img1");
        let img2 = this.title?.getChildByName("img2");
        if (img1) {
            img1.active = !this.isEnemyMode;
        }
        if (img2) {
            img2.active = this.isEnemyMode;
        }
    }

    bindBtn() {
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
        this.commonBtn.addComponent(zoomButton).onClick = this.clickCommonBtn.bind(this);
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(10);
    }

    ///
    ///点击事件
    ///

    /**点击广告按钮 */
    clickAdBtn() {
        if (this.isRewardClaimed) {
            return;
        }

        this.isRewardClaimed = true;
        videoMgr.watchVideo(10, () => {
            this.getReward(3);
        }, () => {
            this.isRewardClaimed = false;
        });
    }

    /**点击普通按钮 */
    clickCommonBtn() {
        if (this.isRewardClaimed) {
            return;
        }

        this.isRewardClaimed = true;
        this.getReward(1);
    }

    /**刷新基础奖励数量 */
    private refreshRewardNum() {
        let moneyLab = this.moneyRewardNode?.getChildByName("numLab")?.getComponent(Label);
        let boxLab = this.boxRewardNode?.getChildByName("numLab")?.getComponent(Label);
        if (moneyLab) {
            moneyLab.string = `X ${this.moneyNum}`;
        }
        if (boxLab) {
            boxLab.string = `X ${this.boxNum}`;
        }
    }

    /**刷新当前魔盒数量 */
    private refreshBoxNum() {
        let boxLab = this.boxNode?.getChildByName("numLab")?.getComponent(Label);
        if (boxLab) {
            boxLab.string = pData.getLevelPropsNum(tilePropsType.box, 0).toString();
        }
    }

    /**领取胜利奖励 */
    private getReward(multiplier: number) {
        let rewardMoney = this.moneyNum * multiplier;
        let rewardBox = this.boxNum * multiplier;
        let moneyImg = this.moneyRewardNode?.getChildByName("img") || this.moneyRewardNode;
        let boxImg = this.boxRewardNode?.getChildByName("img") || this.boxRewardNode;
        let boxTarget = this.boxNode?.getChildByName("img") || this.boxNode;

        uiMgr.playMoneyAnim(moneyImg, rewardMoney, () => {
            this.scheduleOnce(() => {
                uiMgr.closeGame();
                this.onClose();
            }, 1);
        });
        uiMgr.playRewardAnim(boxImg, boxTarget, rewardBox, () => {
            pData.fixLevelPropsNum(tilePropsType.box, 0, rewardBox);
            this.refreshBoxNum();
        });
    }

    onClose() {
        this.adBtnAnimation.unscheduleAllCallbacks();
        this.adBtnAnimation.stopAni();
        uiMgr.closePage(UIPath.UIFail);
        gm.gameResume();
    }
}
