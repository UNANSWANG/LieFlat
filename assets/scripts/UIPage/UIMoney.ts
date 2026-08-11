import { _decorator, Component, Node, Animation, Label } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { configData, SaveKey } from '../manager/configData';
import { ccStorageTools } from '../extention/storageTools';
import { gm } from '../manager/gm';
import { videoMgr } from '../manager/videoManager';
const { ccclass, property } = _decorator;

@ccclass('UIMoney')
export class UIMoney extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    adBtn: Node;

    @property(Node)
    shareBtn: Node;

    @property(Label)
    numLab: Label;

    /**是否正在观看广告 */
    private isWatchingAd: boolean = false;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.numLab.string = 'x' + configData.addMoneyNum.toString();
        this.SDKAdReport();
        this.refreshRewardBtn();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
        this.shareBtn.addComponent(zoomButton).onClick = this.clickShareBtn.bind(this);
    }

    /**刷新分享和广告按钮 */
    private refreshRewardBtn() {
        let hasGetShareReward = this.hasGetShareRewardToday();
        this.shareBtn.active = !hasGetShareReward;
        this.adBtn.active = hasGetShareReward;
    }

    /**今日是否已经通过分享领取感染币 */
    private hasGetShareRewardToday() {
        return ccStorageTools.getLimitTimeData(SaveKey.isGetMoneyShare) == 1;
    }

    /**领取感染币奖励 */
    private getMoneyReward() {
        uiMgr.playMoneyAnim(this.numLab?.node?.parent, configData.addMoneyNum);
        this.onClose();
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(4);
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    /**点击分享按钮 */
    clickShareBtn() {
        if (this.hasGetShareRewardToday()) {
            this.refreshRewardBtn();
            return;
        }
        if (!gm.API) {
            uiMgr.showTips("当前平台暂不支持分享");
            return;
        }

        gm.API.shareAppMessage(() => {
            if (this.hasGetShareRewardToday()) {
                this.refreshRewardBtn();
                return;
            }

            ccStorageTools.setLimitTimeData(SaveKey.isGetMoneyShare, 1);
            this.getMoneyReward();
            this.refreshRewardBtn();
        });
    }

    /**点击广告按钮 */
    clickAdBtn() {
        if (this.isWatchingAd || !this.hasGetShareRewardToday()) {
            this.refreshRewardBtn();
            return;
        }

        this.isWatchingAd = true;
        videoMgr.watchVideo(4, () => {
            this.isWatchingAd = false;
            this.getMoneyReward();
        }, () => {
            this.isWatchingAd = false;
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIMoney);
    }
}


