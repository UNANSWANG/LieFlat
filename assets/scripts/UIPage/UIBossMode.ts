import { _decorator, Component, Node, Animation, Label } from 'cc';
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
    startBtn: Node;

    @property(Node)
    storeBtn: Node;

    @property(Label)
    debrisNumLab: Label;

    @property(Label)
    debrisTargetLab: Label;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.debrisNumLab.string = pData.debris.toString();
        this.debrisTargetLab.string = "/" + configData.enemyModeDebrisNum.toString();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.startBtn.addComponent(zoomButton).onClick = this.clickStartBtn.bind(this);
        this.storeBtn.addComponent(zoomButton).onClick = this.clickStoreBtn.bind(this);
    }

    ///
    ///点击事件
    ///

    /**点击开始按钮 */
    clickStartBtn() {
        if (pData.debris < configData.enemyModeDebrisNum) {
            uiMgr.showTips(`碎片不足${pData.debris}/${configData.enemyModeDebrisNum}`);
            return;
        }

        this.onClose();
        uiMgr.openPage(UIPath.UIMatch, { mode: 1 });
    }

    /**点击商店按钮 */
    clickStoreBtn() {
        uiMgr.openPage(UIPath.UISkinStore, { type: 1 });
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIBossMode);
    }
}


