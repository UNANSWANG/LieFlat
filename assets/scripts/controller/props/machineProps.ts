import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
const { ccclass, property } = _decorator;

@ccclass('machineProps')
export class machineProps extends gamePropsBase {
    /**每个维修机床为同房间门增加的修复速度（每秒修复百分比） */
    static readonly doorRepairSpeedAdd: number = 2;

    /**获取指定房间内维修机床提供的门修复速度加成 */
    static getDoorRepairSpeedAdd(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0) {
            return 0;
        }

        let machineCount = gameComp.getRoomPropsCountByType(roomIdx, "machine");
        return machineCount * machineProps.doorRepairSpeedAdd;
    }

    /**道具开始生效 */
    startProps() {

    }

}


