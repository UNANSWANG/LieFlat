import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('coverProps')
export class coverProps extends gamePropsBase {
    /**血量阈值 */
    coverThreshold: number = 0.3;
    /**技能持续时长 */
    coverDuration: number = 3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.coverThreshold = commonConfig.getValueNumber("coverThreshold") / 100;
        this.coverDuration = commonConfig.getValueNumber("coverDuration");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}


