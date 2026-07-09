import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('handProps')
export class handProps extends gamePropsBase {
    /**获取金币倍率 */
    printerCoinMultiplier: number = 1;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.printerCoinMultiplier = commonConfig.getValueNumber("printerCoinMultiplier");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /** 获取指定房间内印钞机的金币倍率 */
    static getRoomCoinMultiplier(gameComp: any, roomIdx: number) {
        let handComp = handProps.getRoomHandComp(gameComp, roomIdx);
        if (!handComp) {
            return 0;
        }

        return handComp.printerCoinMultiplier;
    }

    /** 获取指定房间内正在生效的印钞机 */
    private static getRoomHandComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.printer && propComp.isPropsActive) {
                return propComp as handProps;
            }
        }

        return null;
    }

}
