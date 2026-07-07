import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('handProps')
export class handProps extends gamePropsBase {
    /**触发阈值 */
    handTriggerThreshold: number = 0.3;
    /**技能持续时间 */
    handSkillDuration: number = 3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.handTriggerThreshold = commonConfig.getValueNumber("handTriggerThreshold");
        this.handSkillDuration = commonConfig.getValueNumber("handSkillDuration");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

