import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
const { ccclass, property } = _decorator;

@ccclass('iceProps')
export class iceProps extends gamePropsBase {
    /**房间内存在千年寒冰时，感染者攻击动画播放速度倍率 */
    static readonly enemyAttackTimeScale: number = 0.8;

    /**获取指定房间内千年寒冰提供的感染者攻击速度倍率 */
    static getEnemyAttackTimeScale(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0) {
            return 1;
        }

        let iceCount = gameComp.getRoomPropsCountByType(roomIdx, "ice");
        return iceCount > 0 ? iceProps.enemyAttackTimeScale : 1;
    }

    /**道具开始生效 */
    startProps() {

    }

}

