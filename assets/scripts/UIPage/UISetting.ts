import { _decorator, Component, Node, Animation, Toggle, UITransform, Vec3, Widget, Label } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { audioMgr } from '../manager/audioManager';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
import { pData } from '../manager/playerData';
import { userMgr } from '../manager/userManager';
const { ccclass, property } = _decorator;

@ccclass('UISetting')
export class UISetting extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    feedbackBtn: Node;

    @property(Node)
    homeBtn: Node;

    @property(Node)
    bg: Node;

    @property(Node)
    toggleList: Node;

    @property(Node)
    restartBtn: Node;

    @property(Label)
    uidLab: Label;

    @property(Toggle)
    musicToggle: Toggle;

    @property(Toggle)
    effctToggle: Toggle;

    @property(Toggle)
    vibratToggle: Toggle;

    /**模式：0：普通模式 1：关卡模式（重新开始和返回主页） */
    mode = 0;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open(data) {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData(data);
    }

    initData(data) {
        if (data && data.mode) {
            this.mode = data.mode;
        } else {
            this.mode = 0;
        }

        this.uidLab.string = `uid:${userMgr.params.uid}`

        this.refreshState();
        this.refreshUI();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.feedbackBtn.addComponent(zoomButton).onClick = this.clickFeedbackBtn.bind(this);
        this.homeBtn.addComponent(zoomButton).onClick = this.clickHomeBtn.bind(this);
        this.restartBtn.addComponent(zoomButton).onClick = this.clickRestartBtn.bind(this);
    }

    addListener() {
        this.musicToggle.node.on(Toggle.EventType.TOGGLE, this.clickMusicBtn, this);
        this.effctToggle.node.on(Toggle.EventType.TOGGLE, this.clickEffctBtn, this);
        this.vibratToggle.node.on(Toggle.EventType.TOGGLE, this.clickVibratBtn, this);
    }

    removeListener() {
        this.musicToggle.node.off(Toggle.EventType.TOGGLE, this.clickMusicBtn, this);
        this.effctToggle.node.off(Toggle.EventType.TOGGLE, this.clickEffctBtn, this);
        this.vibratToggle.node.off(Toggle.EventType.TOGGLE, this.clickVibratBtn, this);
    }

    /**刷新界面 */
    refreshUI() {
        let bgTrans = this.bg.getComponent(UITransform);
        if (this.mode == 1) {
            bgTrans.height = 1228;
            this.bg.position = new Vec3(0, 95, 0);
            this.restartBtn.active = true;
            this.homeBtn.active = true;
            this.toggleList.position = new Vec3(0, -312, 0);
        } else {
            bgTrans.height = 1025;
            this.bg.position = new Vec3(0, 100, 0);
            this.restartBtn.active = false;
            this.homeBtn.active = false;
            this.toggleList.position = new Vec3(0, -402, 0);
        }

        this.bg.getChildByName("topNode").getComponent(Widget).updateAlignment();
    }

    /**刷新按钮状态 */
    refreshState() {
        this.removeListener();
        this.musicToggle.isChecked = audioMgr.isMusic;
        this.effctToggle.isChecked = audioMgr.isEffect;
        this.vibratToggle.isChecked = audioMgr.isVibrat;
        this.addListener();
    }

    ///
    ///点击事件
    ///

    /**点击音乐开关 */
    clickMusicBtn() {
        audioMgr.switchMusic(!audioMgr.isMusic);
    }

    /**点击音效开关 */
    clickEffctBtn() {
        audioMgr.switchEffect(!audioMgr.isEffect);
    }

    /**点击振动开关 */
    clickVibratBtn() {
        audioMgr.switchVibrat(!audioMgr.isVibrat);
    }

    /**点击反馈 */
    clickFeedbackBtn() {
        uiMgr.showTips("正在反馈...");
    }

    /**点击主页 */
    clickHomeBtn() {
        this.onClose();
        //上报失败
        pData.reportLevel(false);
        uiMgr.closeGame();
    }

    /**点击重新开始 */
    clickRestartBtn() {
        this.onClose();
        gm.Event.emit(GameEvent.refreshGameLevel);
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UISetting);
        if (this.mode == 1) {
            gm.gameResume();
        }
    }
}


