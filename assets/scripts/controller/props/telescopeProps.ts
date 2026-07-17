import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
import { configData } from '../../manager/configData';
const { ccclass } = _decorator;

@ccclass('telescopeProps')
export class telescopeProps extends gamePropsBase {
    /**提高防御塔的百分比攻击范围 */
    telescopeRange: number = 0.3;
    /**当前是否显示底图 */
    private isShowBaseImg: boolean = true;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.telescopeRange = commonConfig.getValueNumber("telescopeRange") / 100;
    }

    /**初始化道具图片 */
    initPropsImg() {
        super.initPropsImg();
        ccTools.loadImg(this.img2, imgPath.gamePprops + this.propsType + "_" + this.level + "_1");
        this.showBaseImg();
    }

    /**道具开始生效 */
    startProps() {
        super.startProps();
        this.startSwitchImg();
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.showBaseImg();
    }

    /**开始循环切换图1和图2显隐 */
    private startSwitchImg() {
        this.unschedule(this.switchImg);
        this.schedule(this.switchImg, configData.propsImgSwitchSpeed);
    }

    /**切换图1和图2显隐 */
    private switchImg() {
        this.isShowBaseImg = !this.isShowBaseImg;
        this.img1.node.active = this.isShowBaseImg;
        this.img2.node.active = !this.isShowBaseImg;
    }

    /**显示底图 */
    private showBaseImg() {
        this.isShowBaseImg = true;
        this.img1.node.active = true;
        this.img2.node.active = false;
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
