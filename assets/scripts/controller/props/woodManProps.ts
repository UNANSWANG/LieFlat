import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass, property } = _decorator;

@ccclass('woodManProps')
export class woodManProps extends gamePropsBase {
    /**控制时长 */
    static woodManControlDuration: number = 3;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        woodManProps.woodManControlDuration = commonConfig.getValueNumber("woodManControlDuration");
    }

    /**指定房间内木头人是否触发控制 */
    static checkControlEnemy(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0 || woodManProps.woodManControlDuration <= 0) {
            return false;
        }

        let woodManComp = woodManProps.getRoomWoodManComp(gameComp, roomIdx);
        if (!woodManComp) {
            return false;
        }

        woodManComp.playDisappearAnim();
        return true;
    }

    /**获取指定房间内的木头人道具 */
    private static getRoomWoodManComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.woodMan && propComp.isPropsActive) {
                return propComp as woodManProps;
            }
        }

        return null;
    }

    /**获取木头人控制时长 */
    static getControlDuration() {
        return woodManProps.woodManControlDuration;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }
}
