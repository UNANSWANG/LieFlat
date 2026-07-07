import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('machineProps')
export class machineProps extends gamePropsBase {
    /**每个维修机床为同房间门增加的修复速度（每秒修复百分比） */
    static machineRepairSpeedAdd: number = 2;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        machineProps.machineRepairSpeedAdd = commonConfig.getValueNumber("machineRepairSpeedAdd");
    }

    /**获取指定房间内维修机床提供的门修复速度加成 */
    static getDoorRepairSpeedAdd(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0) {
            return 0;
        }

        let machineCount = gameComp.getRoomPropsCountByType(roomIdx, "machine");
        return machineCount * machineProps.machineRepairSpeedAdd;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

}

