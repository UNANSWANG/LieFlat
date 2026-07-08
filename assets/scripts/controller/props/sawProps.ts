import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('sawProps')
export class sawProps extends gamePropsBase {
    /**触发的生命阈值 */
    sawThreshold: number = 0.1;
    /**检测范围（格数） */
    sawRange: number = 10;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.sawThreshold = commonConfig.getValueNumber("sawThreshold") / 100;
        this.sawRange = commonConfig.getValueNumber("sawRange");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

