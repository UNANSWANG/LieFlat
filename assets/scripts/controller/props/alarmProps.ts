import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import type { enemyBaseController } from '../enemy/enemyBaseController';
const { ccclass } = _decorator;

@ccclass('alarmProps')
export class alarmProps extends gamePropsBase {
    /**触发生命阈值 */
    alarmThresholdHealth: number = 0.5;
    /**是否已经触发 */
    private hasTriggered: boolean = false;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.alarmThresholdHealth = commonConfig.getValueNumber("alarmThresholdHealth") / 100;
    }
    
    /**道具开始生效 */
    startProps() {
        this.hasTriggered = false;
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.hasTriggered = false;
    }

    /**尝试触发指定房间内的警示铃 */
    static tryTriggerRoomAlarm(gameComp: any, roomIdx: number, target: enemyBaseController) {
        let alarmComp = alarmProps.getRoomAlarmComp(gameComp, roomIdx);
        if (!alarmComp || alarmComp.hasTriggered || !target || !target.node || !target.node.isValid || target.hpPercent >= alarmComp.alarmThresholdHealth) {
            return false;
        }

        alarmComp.hasTriggered = true;
        alarmComp.playDisappearAnim();
        target.forceChooseTargetExcludeRoom(roomIdx);
        return true;
    }

    /**获取指定房间内正在生效的警示铃 */
    private static getRoomAlarmComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.alarm && propComp.isPropsActive) {
                return propComp as alarmProps;
            }
        }

        return null;
    }

}


