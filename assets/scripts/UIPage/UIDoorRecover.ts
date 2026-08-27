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
        gm.API.shareAppMessage(() => {
            
        });
    }

    /**点击广告按钮 */
    clickAdBtn() {
        videoMgr.watchVideo(68, () => {
            
        }, () => {
            
        });
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }
    
    onClose() {
        this.shareBtnAnimation?.unscheduleAllCallbacks();
        this.shareBtnAnimation?.stopAni();
        this.adBtnAnimation?.unscheduleAllCallbacks();
        this.adBtnAnimation?.stopAni();
        gm.gameResume();
        uiMgr.closePage(UIPath.UIResurrection);
    }
}


