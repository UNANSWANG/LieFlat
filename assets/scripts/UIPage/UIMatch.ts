import { _decorator, Component, Node, Animation, Label } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
const { ccclass, property } = _decorator;


@ccclass('UIMatch')
export class UIMatch extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    readyBtn: Node;

    @property(Label)
    timeLab: Label;

    @property(Node)
    enemyItem: Node;

    @property(Node)
    roleLayout: Node;

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
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIMatch);
    }
}


