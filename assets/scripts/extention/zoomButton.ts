import { _decorator, Button, Component, Node } from 'cc';
import { audioMgr } from '../manager/audioManager';
import { audioPath } from '../manager/pathConfig';
const { ccclass, property } = _decorator;

@ccclass('zoomButton')
export class zoomButton extends Button {
    //函数回调
    onClick: Function = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.clickBtn, this);
        this.transition = Button.Transition.SCALE;
        this.zoomScale = 0.9;
    }

    clickBtn() {
        //点击音效
        audioMgr.playEffect(audioPath.click);
        this.onClick && this.onClick();
    }
}


