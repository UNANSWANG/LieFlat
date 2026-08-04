import { _decorator, Component, Node, Animation, Label } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { configData } from '../manager/configData';
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
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIMoney);
    }
}


