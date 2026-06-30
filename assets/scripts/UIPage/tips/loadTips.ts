import { _decorator, Component, Node } from 'cc';
import { UIBase } from '../UIBase';
import { loopAnimation } from '../../controller/loopAnimation';
const { ccclass, property } = _decorator;

@ccclass('loadTips')
export class loadTips extends UIBase {
    loopComp: loopAnimation = null;

    protected onLoad(): void {
        this.loopComp = this.node.getChildByName("loadNode").getComponent(loopAnimation);
    }

    onUI_Open(data?: any): void {
        this.loopComp.playAni();
    }

    onUI_Close(): void {
        if(this.loopComp){
            this.loopComp.stopAni();
        }
    }
}


