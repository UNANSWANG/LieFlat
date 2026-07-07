import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('sawProps')
export class sawProps extends gamePropsBase {
    /**触发的生命阈值 */
    sawThreshold: number = 0.3;
    /**造成的百分比伤害 */
    sawDamage: number = 0.1;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.sawThreshold = commonConfig.getValueNumber("sawThreshold") / 100;
        this.sawDamage = commonConfig.getValueNumber("sawDamage") / 100;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

