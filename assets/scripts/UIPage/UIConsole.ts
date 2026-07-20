import { _decorator, Component, Node, Animation, Toggle } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;


@ccclass('UIConsole')
export class UIConsole extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    addGameMonetaryBtn: Node;

    @property(Node)
    addGameMonetaryBtn2: Node;

    @property(Node)
    fullSkinBtn: Node;

    @property(Node)
    addPlayerMonetaryBtn: Node;

    @property(Node)
    forceStartBtn: Node;

    @property(Toggle)
    onlyAttackSelfToggle: Toggle;

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
        this.addPlayerMonetaryBtn.addComponent(zoomButton).onClick = this.clickAddPlayerMonetaryBtn.bind(this);
        this.addGameMonetaryBtn2.addComponent(zoomButton).onClick = this.clickAddGameMonetary2Btn.bind(this);
        this.forceStartBtn.addComponent(zoomButton).onClick = this.clickForceStartBtn.bind(this);
    }

    ///
    ///点击事件
    ///
    /**点击增加货币 */
    clickAddGameMonetaryBtn() {
        gm.Event.emit(GameEvent.addGameMonetary, 100);
    }

    /**点击增加货币2 */
    clickAddGameMonetary2Btn() {
        gm.Event.emit(GameEvent.addGameMonetary);
    }

    /**点击全皮肤 */
    clickFullSkinBtn() {
        gm.Event.emit(GameEvent.fullSkin);
    }

    /**点击增加玩家货币 */
    clickAddPlayerMonetaryBtn() {
        pData.fixMoney(100000);
    }

    /**点击强制开始 */
    clickForceStartBtn() {
        gm.Event.emit(GameEvent.forceStart);
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIConsole);
    }
}


