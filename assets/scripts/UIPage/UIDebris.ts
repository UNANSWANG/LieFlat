import { _decorator, Component, Node, Animation, Label } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { configData, SaveKey } from '../manager/configData';
import { ccStorageTools } from '../extention/storageTools';
import { gm } from '../manager/gm';
import { videoMgr } from '../manager/videoManager';
import { commonConfig } from '../json/jsonCommon';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

@ccclass('UIDebris')
export class UIDebris extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    adBtn: Node;

    @property(Node)
    exchangeBtn: Node;

    @property(Label)
    numLab: Label;

    moneyToDebrisNum: number = 0;

    protected onLoad(): void {
        this.bindBtn();
        this.moneyToDebrisNum = commonConfig.getValueNumber("moneyToDebrisNum");
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.numLab.string = 'x' + this.moneyToDebrisNum;
        this.SDKAdReport();
        this.refreshRewardBtn();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
        this.exchangeBtn.addComponent(zoomButton).onClick = this.clickExchangeBtn.bind(this);
    }

    /**刷新兑换和广告按钮 */
    private refreshRewardBtn() {

    }

    /**领取碎片奖励 */
    private getDebrisReward(num) {
        pData.fixDebris(num);
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(68);
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    /**点击兑换按钮 */
    clickExchangeBtn() {
        if(pData.money < this.moneyToDebrisNum){
            uiMgr.showTips("感染币不足");
            return;
        }

        pData.fixMoney(-this.moneyToDebrisNum);
        this.getDebrisReward(1);
    }

    /**点击广告按钮 */
    clickAdBtn() {
        videoMgr.watchVideo(68, () => {
            this.getDebrisReward(commonConfig.getValueNumber("adDebrisNum"));
        }, () => {
           uiMgr.showTips("视频播放失败");
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIDebris);
    }
}

