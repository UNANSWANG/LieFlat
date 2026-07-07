import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('woodManProps')
export class woodManProps extends gamePropsBase {
    /**释放技能时控制敌人的概率 */
    woodManControlPercent: number = 0.3;
    /**控制时长 */
    woodManControlDuration: number = 3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.woodManControlPercent = commonConfig.getValueNumber("woodManControlPercent") / 100;
        this.woodManControlDuration = commonConfig.getValueNumber("woodManControlDuration");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}
