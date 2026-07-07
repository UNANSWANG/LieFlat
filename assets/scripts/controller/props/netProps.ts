import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('netProps')
export class netProps extends gamePropsBase {
    /**网住敌人的时间 */
    netDuration: number = 2;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.netDuration = commonConfig.getValueNumber("netDuration");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }
}
