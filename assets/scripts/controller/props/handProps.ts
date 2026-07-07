import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('handProps')
export class handProps extends gamePropsBase {
    /**获取金币倍率 */
    handCoinMultiplier: number = 1;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.handCoinMultiplier = commonConfig.getValueNumber("handCoinMultiplier");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

