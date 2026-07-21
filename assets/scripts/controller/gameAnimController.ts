import { _decorator, Component, Node, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('gameAnimController')
export class gameAnimController extends Component {
    callBack: () => void = null;
    anim : Animation = null;

    start() {
        this.anim = this.getComponent(Animation);
        this.anim.play();

        this.anim.on(Animation.EventType.FINISHED, () => {
            if(this.callBack){
                this.callBack();
            }
            this.node.removeFromParent();
            this.node.destroy();
        }, this);
    }

    clearData(){
        this.callBack = null;
        this.anim.defaultClip = null;
        this.anim.clips = [];
    }

    startAnim(callBack?: () => void){   
        this.callBack = callBack;
        this.anim.play();
    }
}


