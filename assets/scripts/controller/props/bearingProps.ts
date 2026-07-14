import { _decorator, tween, Tween } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
const { ccclass } = _decorator;
@ccclass('bearingProps')
export class bearingProps extends gamePropsBase {
    /**提高防御塔的百分比攻击速度 */
    bearingSpeed: number = 0.5;
    /**图2旋转一圈时长 */
    private rotateDuration: number = 4;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.bearingSpeed = commonConfig.getValueNumber("bearingSpeed") / 100;
    }

    /**初始化道具图片 */
    initPropsImg() {
        super.initPropsImg();
        ccTools.loadImg(this.img2, imgPath.gamePprops + this.propsType);
    }
    
    /**道具开始生效 */
    startProps() {
        this.playRotateAnim();
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.stopRotateAnim();
    }

    /**播放图2循环旋转动画 */
    private playRotateAnim() {
        if (!this.img2?.node) {
            return;
        }

        Tween.stopAllByTarget(this.img2.node);
        tween(this.img2.node)
            .set({ angle: 0 })
            .to(this.rotateDuration, { angle: -360 })
            .union()
            .repeatForever()
            .start();
    }

    /**停止图2旋转动画并恢复状态 */
    private stopRotateAnim() {
        if (!this.img2?.node) {
            return;
        }

        Tween.stopAllByTarget(this.img2.node);
        this.img2.node.angle = 0;
    }

    /** 获取指定房间内轴承带来的攻击速度倍率 */
    static getRoomAttackSpeedMultiplier(gameComp: any, roomIdx: number) {
        let tubeComp = bearingProps.getRoomTubeComp(gameComp, roomIdx);
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
                return propComp as bearingProps;
            }
        }

        return null;
    }

}
