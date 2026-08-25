import { _decorator, Component, Node, Animation, Label, sp } from 'cc';
import { UIBase } from './UIBase';
import { spinePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { videoMgr } from '../manager/videoManager';
import { pData } from '../manager/playerData';
import { configData, GameEvent } from '../manager/configData';
import { ccTools } from '../extention/generalTools';
import { gm } from '../manager/gm';
const { ccclass, property } = _decorator;


@ccclass('UIBossMode')
export class UIBossMode extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    startBtn: Node;

    @property(Node)
    storeBtn: Node;

    @property(sp.Skeleton)
    bossSKinSp: sp.Skeleton;

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
        this.addListener();
        this.initData();
    }

    onUI_Close() {
        this.removeListener();
    }

    initData() {
        this.debrisNumLab.string = pData.debris.toString();
        this.debrisTargetLab.string = "/" + configData.enemyModeDebrisNum.toString();
        this.refreshSkin();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.startBtn.addComponent(zoomButton).onClick = this.clickStartBtn.bind(this);
        this.storeBtn.addComponent(zoomButton).onClick = this.clickStoreBtn.bind(this);
    }

    /**添加监听 */
    addListener() {
        gm.Event.on(GameEvent.refreshBossSkin, this.refreshSkin, this);
    }

    /**删除监听 */
    removeListener() {
        gm.Event.off(GameEvent.refreshBossSkin, this.refreshSkin, this);
    }

    /**刷新皮肤 */
    private async refreshSkin() {
        let isLoaded = await ccTools.loadSpine(this.bossSKinSp, spinePath.boss + pData.enemySkinId);
        if (!isLoaded || !this.bossSKinSp.node.activeInHierarchy) {
            return;
        }
        this.bossSKinSp.setAnimation(0, "idle", true);
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


