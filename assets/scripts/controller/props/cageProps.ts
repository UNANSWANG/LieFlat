import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('cageProps')
export class cageProps extends gamePropsBase {
    /**控制时长 */
    static cageControlDuration: number = 3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        cageProps.cageControlDuration = commonConfig.getValueNumber("cageControlDuration");
    }

    /**指定房间内铁笼是否触发控制 */
    static checkControlEnemy(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0 || cageProps.cageControlDuration <= 0) {
            return false;
        }

        let cageComp = cageProps.getRoomCageComp(gameComp, roomIdx);
        if (!cageComp) {
            return false;
        }

        cageComp.playDisappearAnim();
        return true;
    }

    /**获取指定房间内的铁笼道具 */
    private static getRoomCageComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.cage && propComp.isPropsActive) {
                return propComp as cageProps;
            }
        }

        return null;
    }

    /**获取铁笼控制时长 */
    static getControlDuration() {
        return cageProps.cageControlDuration;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }
}
