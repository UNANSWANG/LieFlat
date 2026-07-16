import { _decorator, Component, Node, Animation } from 'cc';
import { UIBase } from './UIBase';
import { audioPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
import { audioMgr } from '../manager/audioManager';
import { zoomButton } from '../extention/zoomButton';
const { ccclass, property } = _decorator;

@ccclass('UISuccess')
export class UISuccess extends UIBase {
    @property(Node)
    homeBtn: Node;

    @property(Node)
    nextBtn: Node;

    @property(Node)
    shareBtn: Node;

    @property(Node)
    goodBtn: Node;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        gm.gamePause();
        audioMgr.playEffect(audioPath.success);
        this.initData();
    }

    initData() {
        pData.SDKReportLevelComplete();
        pData.addLevel();
    }

    bindBtn() {
        this.homeBtn.addComponent(zoomButton).onClick = this.clickHomeBtn.bind(this);
        this.goodBtn.addComponent(zoomButton).onClick = this.clickGoodBtn.bind(this);
        this.shareBtn.addComponent(zoomButton).onClick = this.clickShareBtn.bind(this);
        this.nextBtn.addComponent(zoomButton).onClick = this.clickNextBtn.bind(this);
    }

    /**点击点赞 */
    clickGoodBtn() {
        uiMgr.showTips("点赞");
    }

    /**点击分享 */
    clickShareBtn() {
        gm.API.shareAppMessage();
    }

    /**点击下一关游戏 */
    clickNextBtn() {
        this.onClose();
        gm.Event.emit(GameEvent.refreshGameLevel);
    }

    /**点击返回首页 */
    clickHomeBtn() {
        this.onClose();
        uiMgr.closeGame();
    }

    onClose() {
        gm.gameResume();
        uiMgr.closePage(UIPath.UISuccess);
    }
}


