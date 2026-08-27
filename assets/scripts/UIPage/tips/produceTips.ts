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
            poolMgr.putProduceTipsNode(this.node);
        }, this);
    }

    /**放回对象池前停止动画，避免复用后收到上一轮完成事件 */
    onPoolPut() {
        this.animation?.stop();
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

        let numLab = this.animNode.getChildByName('numLab').getComponent(Label);
        numLab.fontSize = 20;
        numLab.string = `+${num}`;
    }

    /**初始化敌人经验飘字，只显示经验文本，不显示资源图标 */
    initExpNum(num: number) {
        this.animation.play();
        this.powerImg.active = false;
        this.coinImg.active = false;
        let numLab = this.animNode.getChildByName('numLab').getComponent(Label);
        numLab.fontSize = 15;
        numLab.string = `exp+${num}`;
    }
}
