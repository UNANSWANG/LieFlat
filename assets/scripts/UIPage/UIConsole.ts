import { _decorator, Component, Node, Animation } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
const { ccclass, property } = _decorator;


@ccclass('UIConsole')
export class UIConsole extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    addGameMonetaryBtn: Node;

    @property(Node)
    fullSkinBtn: Node;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {

    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.addGameMonetaryBtn.addComponent(zoomButton).onClick = this.clickAddGameMonetaryBtn.bind(this);
        this.fullSkinBtn.addComponent(zoomButton).onClick = this.clickFullSkinBtn.bind(this);
    }

    ///
    ///点击事件
    ///
    /**点击增加货币 */
    clickAddGameMonetaryBtn() {
        gm.Event.emit(GameEvent.addGameMonetary);
    }

    /**点击全皮肤 */
    clickFullSkinBtn() {
        gm.Event.emit(GameEvent.fullSkin);
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIConsole);
    }
}


