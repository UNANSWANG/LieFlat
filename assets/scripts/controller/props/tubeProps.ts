import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;
@ccclass('tubeProps')
export class tubeProps extends gamePropsBase {
    /**提高防御塔的百分比攻击速度 */
    bearingSpeed: number = 0.5;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.bearingSpeed = commonConfig.getValueNumber("bearingSpeed") / 100;
    }
    
    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /** 获取指定房间内轴承带来的攻击速度倍率 */
    static getRoomAttackSpeedMultiplier(gameComp: any, roomIdx: number) {
        let tubeComp = tubeProps.getRoomTubeComp(gameComp, roomIdx);
        if (!tubeComp) {
            return 1;
        }

        return 1 + tubeComp.bearingSpeed;
    }

    /** 获取指定房间内正在生效的轴承 */
    private static getRoomTubeComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.bearing && propComp.isPropsActive) {
                return propComp as tubeProps;
            }
        }

        return null;
    }

}
