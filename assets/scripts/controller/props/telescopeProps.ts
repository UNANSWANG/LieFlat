import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('telescopeProps')
export class telescopeProps extends gamePropsBase {
    /**提高防御塔的百分比攻击范围 */
    telescopeRange: number = 0.3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.telescopeRange = commonConfig.getValueNumber("telescopeRange") / 100;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /** 获取指定房间内望远镜带来的攻击距离倍率 */
    static getRoomRangeMultiplier(gameComp: any, roomIdx: number) {
        let telescopeComp = telescopeProps.getRoomTelescopeComp(gameComp, roomIdx);
        if (!telescopeComp) {
            return 1;
        }

        return 1 + telescopeComp.telescopeRange;
    }

    /** 获取指定房间内正在生效的望远镜 */
    private static getRoomTelescopeComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.telescope && propComp.isPropsActive) {
                return propComp as telescopeProps;
            }
        }

        return null;
    }

}

