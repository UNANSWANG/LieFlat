import { _decorator, Component, Node, Animation } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { videoMgr } from '../manager/videoManager';
import { pData } from '../manager/playerData';
import { configData } from '../manager/configData';
const { ccclass, property } = _decorator;


@ccclass('UIBossMode')
export class UIBossMode extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    adBtn: Node;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.SDKAdReport();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(68);
    }


    ///
    ///点击事件
    ///

    /**点击开始按钮 */
    clickStartBtn() {
        if(pData.debris < configData.enemyModeDebrisNum){
            uiMgr.showTips(`碎片不足${pData.debris}/${configData.enemyModeDebrisNum}`);
            return;
        }

        this.onClose();
        uiMgr.openPage(UIPath.UIMatch);
    }

    /**点击广告 */
    clickAdBtn() {
        videoMgr.watchVideo(68, () => {
            uiMgr.showTips("已催促程序猿加快进度")
        },()=>{
            uiMgr.showTips("进度加速失败")
        });
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIBossMode);
    }
}


