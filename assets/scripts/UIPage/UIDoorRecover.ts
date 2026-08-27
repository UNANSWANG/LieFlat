import { _decorator, Node, Animation, sp } from 'cc';
import { UIBase } from './UIBase';
import { spinePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { videoMgr } from '../manager/videoManager';
import { ccStorageTools } from '../extention/storageTools';
import { GameEvent, SaveKey } from '../manager/configData';
import { gm } from '../manager/gm';
import { pData } from '../manager/playerData';
import { ccTools } from '../extention/generalTools';
import { loop_anim, loopAnimation } from '../controller/loopAnimation';
import { doorProps } from '../controller/props/doorProps';
const { ccclass, property } = _decorator;

@ccclass('UIDoorRecover')
export class UIDoorRecover extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    shareBtn: Node;

    @property(Node)
    adBtn: Node;

    private shareBtnAnimation: loopAnimation = null;
    private adBtnAnimation: loopAnimation = null;
    /**需要恢复血量的房门 */
    private doorComp: doorProps = null;
    /**正在等待分享或广告回调，避免重复领取 */
    private isWaitingRecover = false;
    /**界面可见时始终保持游戏暂停，避免广告/分享返回时被全局恢复 */
    private isKeepingGamePaused = false;

    protected onLoad(): void {
        this.initBtnAnimation();
        this.bindBtn();
    }

    protected onEnable(): void {
        gm.Event.on(GameEvent.gameResume, this.keepGamePaused, this);
    }

    protected onDisable(): void {
        gm.Event.off(GameEvent.gameResume, this.keepGamePaused, this);
    }

    onUI_Open(data?: any) {
        this.isKeepingGamePaused = true;
        gm.gamePause();
        let anim = this.getComponent(Animation);
        anim?.play();
        this.initData(data);
        this.shareBtnAnimation.playAni();
        this.adBtnAnimation.playAni();
    }

    initData(data?: any) {
        this.doorComp = data?.doorComp as doorProps;
        this.isWaitingRecover = false;
        this.refreshResurrectionBtn();
        this.SDKAdReport();
    }

    /**每日首次使用分享血量回复卡，之后显示广告血量回复卡 */
    private refreshResurrectionBtn() {
        let hasSharedToday = ccStorageTools.getLimitTimeData(SaveKey.isGetDoorRecoverShare) == 1;
        this.shareBtn.active = !hasSharedToday;
        this.adBtn.active = hasSharedToday;
    }

    /**复用成功界面的广告领取按钮循环放缩效果 */
    private initBtnAnimation() {
        this.shareBtnAnimation = this.shareBtn.getComponent(loopAnimation) || this.shareBtn.addComponent(loopAnimation);
        this.adBtnAnimation = this.adBtn.getComponent(loopAnimation) || this.adBtn.addComponent(loopAnimation);
        let btnAnimations = [this.shareBtnAnimation, this.adBtnAnimation];
        for (let i = 0; i < btnAnimations.length; i++) {
            btnAnimations[i].startPlay = false;
            btnAnimations[i].animType = loop_anim.scaling;
            btnAnimations[i].scaleOffset = 0.08;
        }
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.shareBtn.addComponent(zoomButton).onClick = this.clickShareBtn.bind(this);
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(68);
    }

    ///
    ///点击事件
    ///
    /**点击分享按钮 */
    clickShareBtn() {
        if (this.isWaitingRecover || this.hasSharedDoorRecoverToday()) {
            this.refreshResurrectionBtn();
            return;
        }
        if (!gm.API) {
            uiMgr.showTips("当前平台暂不支持分享");
            return;
        }

        this.isWaitingRecover = true;
        gm.API.shareAppMessage(() => {
            this.isWaitingRecover = false;
            if (this.hasSharedDoorRecoverToday()) {
                this.refreshResurrectionBtn();
                return;
            }

            ccStorageTools.setLimitTimeData(SaveKey.isGetDoorRecoverShare, 1);
            this.recoverDoorHp();
        });
    }

    /**点击广告按钮 */
    clickAdBtn() {
        if (this.isWaitingRecover || !this.hasSharedDoorRecoverToday()) {
            this.refreshResurrectionBtn();
            return;
        }

        this.isWaitingRecover = true;
        videoMgr.watchVideo(68, () => {
            this.isWaitingRecover = false;
            this.recoverDoorHp();
        }, () => {
            this.isWaitingRecover = false;
        });
    }

    /**与血量回复卡共用每日首次分享次数，恢复目标房门至满血 */
    private hasSharedDoorRecoverToday() {
        return ccStorageTools.getLimitTimeData(SaveKey.isGetDoorRecoverShare) == 1;
    }

    private recoverDoorHp() {
        if (this.doorComp?.isValid && !this.doorComp.isHpFull) {
            this.doorComp.recoverHpAd();
        }
        this.onClose();
    }

    /**分享或广告返回后若界面尚未关闭，重新暂停游戏 */
    private keepGamePaused() {
        if (this.isKeepingGamePaused) {
            gm.gamePause();
        }
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }
    
    onClose() {
        this.isKeepingGamePaused = false;
        this.shareBtnAnimation?.unscheduleAllCallbacks();
        this.shareBtnAnimation?.stopAni();
        this.adBtnAnimation?.unscheduleAllCallbacks();
        this.adBtnAnimation?.stopAni();
        gm.gameResume();
        uiMgr.closePage(UIPath.UIDoorRecover);
    }
}


