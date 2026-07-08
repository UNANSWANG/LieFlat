import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
const { ccclass } = _decorator;
@ccclass('fireProps')
export class fireProps extends gamePropsBase {
    /**每秒伤害百分比 */
    fireDamage: number = 0.01;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.fireDamage = commonConfig.getValueNumber("fireDamage") / 100;
    }
    
    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /** 获取指定房间内火攻术造成的每秒生命百分比伤害 */
    static getRoomDamagePercent(gameComp: any, roomIdx: number) {
        let fireComp = fireProps.getRoomFireComp(gameComp, roomIdx);
        if (!fireComp) {
            return 0;
        }

        return fireComp.fireDamage;
    }

    /** 获取指定房间内正在生效的火攻术 */
    private static getRoomFireComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.fire && propComp.isPropsActive) {
                return propComp as fireProps;
            }
        }

        return null;
    }

}

