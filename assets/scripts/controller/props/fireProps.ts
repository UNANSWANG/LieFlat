import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;
@ccclass('fireProps')
export class fireProps extends gamePropsBase {
    /**每秒伤害百分比 */
    fireDamage: number = 0.01;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.fireDamage = commonConfig.getValueNumber("fireDamage") / 100;
    }
    
    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

