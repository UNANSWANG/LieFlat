import { _decorator, Component, Node, Animation, Toggle, UITransform, Vec3, Widget, Label, Slider } from 'cc';
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
    homeBtn: Node;

    @property(Node)
    bg: Node;

    @property(Node)
    toggleList: Node;

    @property(Node)
    restartBtn: Node;

    @property(Label)
    uidLab: Label;

    @property(Slider)
    musicSlider: Slider;
    
    @property(Slider)
    effctSlider: Slider;

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
        this.homeBtn.addComponent(zoomButton).onClick = this.clickHomeBtn.bind(this);
        this.restartBtn.addComponent(zoomButton).onClick = this.clickRestartBtn.bind(this);
    }

    addListener() {
        this.vibratToggle.node.on(Toggle.EventType.TOGGLE, this.clickVibratBtn, this);
    }

    removeListener() {
        this.vibratToggle.node.off(Toggle.EventType.TOGGLE, this.clickVibratBtn, this);
    }

    /**刷新界面 */
    refreshUI() {
        let bgTrans = this.bg.getComponent(UITransform);
        if (this.mode == 1) {
            bgTrans.height = 886;
            this.restartBtn.active = true;
            this.homeBtn.active = true;
        } else {
            bgTrans.height = 635;
            this.restartBtn.active = false;
            this.homeBtn.active = false;
        }

        this.bg.getChildByName("topNode").getComponent(Widget).updateAlignment();
    }

    /**刷新按钮状态 */
    refreshState() {
        this.removeListener();
        this.vibratToggle.isChecked = audioMgr.isVibrat;
        this.addListener();
    }

    ///
    ///点击事件
    ///

    /**点击振动开关 */
    clickVibratBtn() {
        audioMgr.switchVibrat(!audioMgr.isVibrat);
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


