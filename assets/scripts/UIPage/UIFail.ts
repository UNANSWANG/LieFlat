import { _decorator, Component, Node, Animation, Label, Sprite } from 'cc';
import { imgPath, UIPath } from '../manager/pathConfig';
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

    @property(Sprite)
    roleImg: Sprite;

    @property(Label)
    timeLab: Label;

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
        this.initData(data);
        this.adBtnAnimation.playAni();
    }

    /**初始化广告按钮循环放缩动画 */
    private initAdBtnAnimation() {
        this.adBtnAnimation = this.adBtn.getComponent(loopAnimation) || this.adBtn.addComponent(loopAnimation);
        this.adBtnAnimation.startPlay = false;
        this.adBtnAnimation.animType = loop_anim.scaling;
        this.adBtnAnimation.scaleOffset = 0.08;
    }

    initData(data?) {
        let enemySkinId = Number.isInteger(data?.enemySkinId) && data.enemySkinId >= 0 ? data.enemySkinId : 0;
        ccTools.loadImg(this.roleImg, imgPath.enemyBodyFull + enemySkinId);

        //TODO 临时写数量
        this.moneyNum = 30;
        this.boxNum = 12;
        let survivalTime = Math.max(0, Number(data?.survivalTime) || 0);
        this.timeLab.string = `存活时间：${Math.floor(survivalTime)}s`;
        this.isRewardClaimed = false;
        this.refreshRewardNum();
        this.refreshBoxNum();

        pData.SDKReportLevelComplete();
        pData.addLevel();
    }

    bindBtn() {
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
        this.commonBtn.addComponent(zoomButton).onClick = this.clickCommonBtn.bind(this);
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
        videoMgr.watchVideo(68, () => {
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
