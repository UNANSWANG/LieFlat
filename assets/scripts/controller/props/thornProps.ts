import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('thornProps')
export class thornProps extends gamePropsBase {
    /**每秒百分比生命伤害 */
    thornDamage: number = 0.01;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.thornDamage = commonConfig.getValueNumber("thornDamage") / 100;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

