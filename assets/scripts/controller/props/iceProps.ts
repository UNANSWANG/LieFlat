import { _decorator, Node, sp } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
import { doorProps } from './doorProps';
const { ccclass, property } = _decorator;

@ccclass('iceProps')
export class iceProps extends gamePropsBase {
    /**房间内存在千年寒冰时，感染者攻击动画播放速度倍率 */
    static iceAttackTimeScale: number = 0.8;
    /**雪花spine节点 */
    private snowNode: Node = null;
    /**房门上的寒冰spine节点 */
    private doorIceNode: Node = null;

    /**初始化道具图片 */
    initPropsImg() {
        super.initPropsImg();
        this.createSnowNode();
    }

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        iceProps.iceAttackTimeScale = commonConfig.getValueNumber("iceAttackTimeScale");
    }

    /**获取指定房间内千年寒冰提供的感染者攻击速度倍率 */
    static getEnemyAttackTimeScale(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0) {
            return 1;
        }

        let iceCount = gameComp.getRoomPropsCountByType(roomIdx, tilePropsType.ice);
        return iceCount > 0 ? iceProps.iceAttackTimeScale : 1;
    }

    /**道具开始生效 */
    startProps() {
        this.refreshDoorIceEffect();
    }

    /**道具结束生效 */
    endProps() {
        this.clearDoorIceEffect();
        this.clearSnowNode();
        super.endProps();
    }

    protected onDisable(): void {
        super.onDisable();
        this.clearDoorIceEffect();
        this.clearSnowNode();
    }

    /**创建雪花spine节点 */
    private createSnowNode() {
        this.clearSnowNode();
        if (!uiMgr.gameSpineItemPrefab || !this.img2?.node) {
            return;
        }

        this.snowNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.snowNode.name = "snowSpine";
        this.img2.node.addChild(this.snowNode);

        let skeleton = poolMgr.getGameNodeSkeleton(this.snowNode);
        if (skeleton) {
            this.playSnowAnim(skeleton);
        }
    }

    /**播放雪花animation循环动画 */
    private async playSnowAnim(skeleton: sp.Skeleton) {
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.snow);
        if (!isLoaded || !skeleton || !skeleton.isValid) {
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**清理雪花spine节点 */
    private clearSnowNode() {
        if (this.snowNode && this.snowNode.isValid) {
            poolMgr.putGameSpineNode(this.snowNode);
        }

        this.snowNode = null;
    }

    /**刷新房门上的寒冰效果 */
    refreshDoorIceEffect() {
        if (!this.isPropsActive || !uiMgr.gameSpineItemPrefab) {
            this.clearDoorIceEffect();
            return;
        }

        let doorComp = this.getRoomDoorComp();
        if (!doorComp?.effectNode) {
            this.clearDoorIceEffect();
            return;
        }

        if (this.doorIceNode && this.doorIceNode.isValid && this.doorIceNode.parent == doorComp.effectNode) {
            return;
        }

        this.clearDoorIceEffect();
        this.doorIceNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.doorIceNode.name = "iceDoorEffect";
        doorComp.effectNode.addChild(this.doorIceNode);

        let skeleton = poolMgr.getGameNodeSkeleton(this.doorIceNode);
        if (skeleton) {
            this.playSnowAnim(skeleton);
        }
    }

    /**清理房门上的寒冰效果 */
    private clearDoorIceEffect() {
        if (this.doorIceNode && this.doorIceNode.isValid) {
            poolMgr.putGameSpineNode(this.doorIceNode);
        }

        this.doorIceNode = null;
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

    /**刷新指定房间的寒冰房门效果 */
    static refreshRoomDoorIceEffect(gameComp: any, roomIdx: number) {
        let iceComp = iceProps.getRoomIceComp(gameComp, roomIdx);
        iceComp?.refreshDoorIceEffect();
    }

    /**获取指定房间内正在生效的千年寒冰 */
    private static getRoomIceComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.ice && propComp.isPropsActive) {
                return propComp as iceProps;
            }
        }

        return null;
    }

}
