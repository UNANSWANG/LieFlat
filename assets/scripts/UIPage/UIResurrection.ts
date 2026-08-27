import { _decorator, Component, Node, Animation, sp } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { videoMgr } from '../manager/videoManager';
import { ccStorageTools } from '../extention/storageTools';
import { SaveKey } from '../manager/configData';
import { gm } from '../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('UIResurrection')
export class UIResurrection extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    shareBtn: Node;

    @property(Node)
    adBtn: Node;

    @property(sp.Skeleton)
    bossAnim: sp.Skeleton;

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
        this.shareBtn.addComponent(zoomButton).onClick = this.clickShareBtn.bind(this);
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
    }

    /**复活 */
    resurrect() {
        this.onClose();

    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(1);
    }

    ///
    ///点击事件
    ///
    /**点击分享按钮 */
    clickShareBtn() {
       
    }

    /**点击广告按钮 */
    clickAdBtn() {
       
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
        uiMgr.openPage(UIPath.UIFail);
    }

    onClose() {
        uiMgr.closePage(UIPath.UIResurrection);
    }
}


