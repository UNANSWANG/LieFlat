import { _decorator, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { uiMgr } from '../../manager/UIManager';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
import { doorProps } from './doorProps';
import { poolMgr } from '../../manager/poolManager';
const { ccclass } = _decorator;

@ccclass('thornProps')
export class thornProps extends gamePropsBase {
    /**每秒百分比生命伤害 */
    thornDamage: number = 0.01;
    /**房门上的藤条效果节点 */
    private doorEffectNode: Node = null;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.thornDamage = commonConfig.getValueNumber("thornDamage") / 100;
    }

    /**道具开始生效 */
    startProps() {
        this.refreshDoorEffect();
    }

    /**道具结束生效 */
    endProps() {
        this.clearDoorEffect();
        super.endProps();
    }

    /**刷新房门上的藤条效果 */
    refreshDoorEffect() {
        if (!this.isPropsActive || !uiMgr.gameSpriteItemPrefab) {
            this.clearDoorEffect();
            return;
        }

        let doorComp = this.getRoomDoorComp();
        if (!doorComp?.effectNode) {
            this.clearDoorEffect();
            return;
        }

        if (this.doorEffectNode && this.doorEffectNode.isValid && this.doorEffectNode.parent == doorComp.effectNode) {
            return;
        }

        this.clearDoorEffect();
        this.doorEffectNode = poolMgr.getGameSpriteNode(uiMgr.gameSpriteItemPrefab);
        this.doorEffectNode.name = "thornDoorEffect";
        doorComp.effectNode.addChild(this.doorEffectNode);

        let img = poolMgr.getGameNodeSprite(this.doorEffectNode);
        if (img) {
            ccTools.loadImg(img, imgPath.gamePprops + this.propsType);
        }
    }

    /**清理房门上的藤条效果 */
    private clearDoorEffect() {
        if (this.doorEffectNode && this.doorEffectNode.isValid) {
            poolMgr.putGameSpriteNode(this.doorEffectNode);
        }

        this.doorEffectNode = null;
    }

    /**获取当前房间房门 */
    private getRoomDoorComp() {
        let roomData = this.gameComp?.roomMap?.[this.roomIdx];
        let doorPos = roomData?.doorPos;
        if (!doorPos) {
            return null;
        }

        return this.gameComp?.tileMap?.[doorPos.x]?.[doorPos.y]?.item?.propsComp as doorProps;
    }

    /**刷新指定房间的藤条房门效果 */
    static refreshRoomDoorEffect(gameComp: any, roomIdx: number) {
        let thornComp = thornProps.getRoomThornComp(gameComp, roomIdx);
        thornComp?.refreshDoorEffect();
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
