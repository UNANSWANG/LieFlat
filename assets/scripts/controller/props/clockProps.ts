import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
const { ccclass, property } = _decorator;

@ccclass('clockProps')
export class clockProps extends gamePropsBase {
    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}


