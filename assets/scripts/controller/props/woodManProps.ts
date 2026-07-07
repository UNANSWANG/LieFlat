import { _decorator, Component, Node, tween, Tween } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('woodManProps')
export class woodManProps extends gamePropsBase {
    /**释放技能时控制敌人的概率 */
    static woodManControlPercent: number = 0.3;
    /**控制时长 */
    static woodManControlDuration: number = 3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        woodManProps.woodManControlPercent = 1//commonConfig.getValueNumber("woodManControlPercent") / 100;
        woodManProps.woodManControlDuration = commonConfig.getValueNumber("woodManControlDuration");
    }

    /**指定房间内木头人是否触发控制 */
    static checkControlEnemy(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0 || woodManProps.woodManControlPercent <= 0 || woodManProps.woodManControlDuration <= 0) {
            return false;
        }

        let woodManCount = gameComp.getRoomPropsCountByType(roomIdx, tilePropsType.woodMan);
        if (woodManCount <= 0) {
            return false;
        }

        return Math.random() < woodManProps.woodManControlPercent;
    }

    /**获取木头人控制时长 */
    static getControlDuration() {
        return woodManProps.woodManControlDuration;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }
}
