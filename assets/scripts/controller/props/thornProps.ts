import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('thornProps')
export class thornProps extends gamePropsBase {
    /**每秒百分比生命伤害 */
    thornDamage: number = 0.01;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.thornDamage = commonConfig.getValueNumber("thornDamage") / 100;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /** 获取指定房间内荆棘造成的每秒生命百分比伤害 */
    static getRoomDamagePercent(gameComp: any, roomIdx: number) {
        let thornComp = thornProps.getRoomThornComp(gameComp, roomIdx);
        if (!thornComp) {
            return 0;
        }

        return thornComp.thornDamage;
    }

    /** 获取指定房间内正在生效的荆棘 */
    private static getRoomThornComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.thorn && propComp.isPropsActive) {
                return propComp as thornProps;
            }
        }

        return null;
    }

}

