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
const { ccclass, property } = _decorator;

@ccclass('UIResurrection')
export class UIResurrection extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    shareBtn: Node;

    @property(Node)
    adBtn: Node;

    @property(sp.Skeleton)
    bossAnim: sp.Skeleton;

    private killerSkinId = 0;
    private survivalTime = 0;
    private isWaitingResurrection = false;
    private shareBtnAnimation: loopAnimation = null;
    private adBtnAnimation: loopAnimation = null;

    protected onLoad(): void {
        this.initBtnAnimation();
        this.bindBtn();
    }

    onUI_Open(data?: any) {
        gm.gamePause();
        let anim = this.getComponent(Animation);
        anim?.play();
        this.initData(data);
        this.shareBtnAnimation.playAni();
        this.adBtnAnimation.playAni();
    }

    initData(data?: any) {
        this.killerSkinId = Number.isInteger(data?.skinId) && data.skinId >= 0 ? data.skinId : 0;
        this.survivalTime = Math.max(0, Number(data?.survivalTime) || 0);
        this.isWaitingResurrection = false;
        this.refreshResurrectionBtn();
        this.refreshBossAnim(Number.isInteger(data?.enemySkinId) && data.enemySkinId >= 0 ? data.enemySkinId : pData.enemySkinId);
        this.SDKAdReport();
    }

    private async refreshBossAnim(skinId: number) {
        if (!this.bossAnim) {
            return;
        }

        this.bossAnim.skeletonData = null;
        let isLoaded = await ccTools.loadSpine(this.bossAnim, spinePath.boss + skinId);
        if (isLoaded) {
            this.bossAnim.timeScale = 0.5;
            this.bossAnim.setAnimation(0, "idle", true);
        }
    }

    /**每日首次使用分享复活，之后显示广告复活 */
    private refreshResurrectionBtn() {
        let hasSharedToday = ccStorageTools.getLimitTimeData(SaveKey.isGetResurrectionShare) == 1;
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

    /**复活 */
    resurrect() {
        if (pData.matchMode != 1) {
            return;
        }

        gm.Event.emit(GameEvent.resurrectionGame);
        this.onClose();
        gm.gameResume();
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(1);
    }

    ///
    ///点击事件
    ///
    /**点击分享按钮 */
    clickShareBtn() {
        if (this.isWaitingResurrection || ccStorageTools.getLimitTimeData(SaveKey.isGetResurrectionShare) == 1) {
            this.refreshResurrectionBtn();
            return;
        }
        if (!gm.API) {
            uiMgr.showTips("当前平台暂不支持分享");
            return;
        }

        this.isWaitingResurrection = true;
        gm.API.shareAppMessage(() => {
            this.isWaitingResurrection = false;
            if (ccStorageTools.getLimitTimeData(SaveKey.isGetResurrectionShare) == 1) {
                this.refreshResurrectionBtn();
                return;
            }

            ccStorageTools.setLimitTimeData(SaveKey.isGetResurrectionShare, 1);
            this.resurrect();
        });
    }

    /**点击广告按钮 */
    clickAdBtn() {
        if (this.isWaitingResurrection || ccStorageTools.getLimitTimeData(SaveKey.isGetResurrectionShare) != 1) {
            this.refreshResurrectionBtn();
            return;
        }

        this.isWaitingResurrection = true;
        videoMgr.watchVideo(1, () => {
            this.isWaitingResurrection = false;
            this.resurrect();
        }, () => {
            this.isWaitingResurrection = false;
        });
    }

    /**点击关闭 */
    clickCloseBtn() {
        gm.Event.emit(GameEvent.giveUpResurrection);
        this.onClose();
        uiMgr.openPage(UIPath.UIFail, {
            skinId: this.killerSkinId,
            survivalTime: this.survivalTime,
        });
    }

    onClose() {
        this.shareBtnAnimation?.unscheduleAllCallbacks();
        this.shareBtnAnimation?.stopAni();
        this.adBtnAnimation?.unscheduleAllCallbacks();
        this.adBtnAnimation?.stopAni();
        uiMgr.closePage(UIPath.UIResurrection);
    }
}

