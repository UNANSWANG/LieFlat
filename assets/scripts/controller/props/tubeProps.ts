import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;
@ccclass('tubeProps')
export class tubeProps extends gamePropsBase {
    /**提高防御塔的百分比攻击速度 */
    tubeSpeed: number = 0.5;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.tubeSpeed = commonConfig.getValueNumber("tubeSpeed") / 100;
    }
    
    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

