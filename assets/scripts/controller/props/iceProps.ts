import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('iceProps')
export class iceProps extends gamePropsBase {
    /**房间内存在千年寒冰时，感染者攻击动画播放速度倍率 */
    static iceAttackTimeScale: number = 0.8;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        iceProps.iceAttackTimeScale = commonConfig.getValueNumber("iceAttackTimeScale");
    }

    /**获取指定房间内千年寒冰提供的感染者攻击速度倍率 */
    static getEnemyAttackTimeScale(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0) {
            return 1;
        }

        let iceCount = gameComp.getRoomPropsCountByType(roomIdx, tilePropsType.ice);
        return iceCount > 0 ? iceProps.iceAttackTimeScale : 1;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}
