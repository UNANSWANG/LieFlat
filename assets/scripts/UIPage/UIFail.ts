import { _decorator, Component, Node, Animation, Label } from 'cc';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { UIBase } from './UIBase';
import { gm } from '../manager/gm';
import { GameEvent} from '../manager/configData';
import { zoomButton } from '../extention/zoomButton';
import { ccTools } from '../extention/generalTools';
import { videoMgr } from '../manager/videoManager';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

export enum FailType {
    /**时间到 */
    TimeOut = 0,
    /**生命值为0 */
    LifeZero = 1,
}
@ccclass('UIFail')
export class UIFail extends UIBase {
    @property(Node)
    homeBtn: Node;

    @property(Node)
    closeBtn: Node;

    @property(Node)
    restartBtn: Node;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open(data?: any) {
        let anim = this.getComponent(Animation);
        anim.play();
        gm.gamePause();
        this.initData(data);
    }

    initData(data?: any) {

    }

    bindBtn() {
        this.homeBtn.addComponent(zoomButton).onClick = this.clickHomeBtn.bind(this);
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.restartBtn.addComponent(zoomButton).onClick = this.clickRestartBtn.bind(this);
    }


    /**点击重新开始 */
    clickRestartBtn() {
        this.onClose();
        gm.Event.emit(GameEvent.refreshGameLevel);
    }
    
    /**点击关闭(返回桌面) */
    clickCloseBtn() {
        this.onClose();
        //上报失败
        pData.reportLevel(false);
        uiMgr.closeGame();
    }

    /**点击返回首页 */
    clickHomeBtn() {
        this.onClose();
        //上报失败
        pData.reportLevel(false);
        uiMgr.closeGame();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIFail);
        gm.gameResume();
    }
}
