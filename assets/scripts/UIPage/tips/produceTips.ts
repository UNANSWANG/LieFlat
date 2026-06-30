import { _decorator, Component, Animation, Label, Sprite, Node } from 'cc';
import { poolMgr } from '../../manager/poolManager';
const { ccclass, property } = _decorator;

export enum produceType{
    /**金币 */
    coin = 0,
    /**电能 */
    power = 1,
}

@ccclass('produceTips')
export class produceTips extends Component {
    animNode: Node = null;
    animation: Animation = null;
    powerImg: Node = null;
    coinImg: Node = null;

    onLoad() {
        this.animNode = this.node.getChildByName('animNode');
        this.animation = this.animNode.getComponent(Animation);
        this.powerImg = this.animNode.getChildByName('power');
        this.coinImg = this.animNode.getChildByName('coin');

        this.animation.on(Animation.EventType.FINISHED, () => {
            this.node.removeFromParent();

            poolMgr.produceTipsPool.put(this.node);
            this.node.active = false;
        }, this);
    }

    initNum(type: produceType, num: number) {
        this.animation.play();

        if(type == produceType.coin){
            this.powerImg.active = false;
            this.coinImg.active = true;
        }else if(type == produceType.power){
            this.powerImg.active = true;
            this.coinImg.active = false;
        }

        this.animNode.getChildByName('numLab').getComponent(Label).string = `+${num}`;
    }
}