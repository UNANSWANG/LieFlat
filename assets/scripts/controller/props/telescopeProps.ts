import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('telescopeProps')
export class telescopeProps extends gamePropsBase {
    /**提高防御塔的百分比攻击范围 */
    telescopeRange: number = 0.3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.telescopeRange = commonConfig.getValueNumber("telescopeRange") / 100;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

