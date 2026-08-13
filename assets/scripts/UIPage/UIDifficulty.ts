import { _decorator, Component, Node, Animation } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
const { ccclass, property } = _decorator;
@ccclass('UIDifficulty')
export class UIDifficulty extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    startBtn: Node;

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
        this.startBtn.addComponent(zoomButton).onClick = this.clickStartBtn.bind(this);
    }

    ///
    ///点击事件
    ///

    /**点击开始游戏 */
    clickStartBtn() {
        uiMgr.closePage(UIPath.UIDifficulty);
        uiMgr.openPage(UIPath.UIMatch);
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
        //难度页由关闭按钮退出时回到主页并恢复主页状态；开始游戏时不会调用这里。
        uiMgr.openPage(UIPath.UIMain);
    }

    onClose() {
        uiMgr.closePage(UIPath.UIDifficulty);
    }
}


