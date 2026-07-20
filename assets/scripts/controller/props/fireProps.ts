import { _decorator, Node, sp } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
const { ccclass } = _decorator;
@ccclass('fireProps')
export class fireProps extends gamePropsBase {
    /**每秒伤害百分比 */
    fireDamage: number = 0.01;
    /**火焰spine节点 */
    private fireNode: Node = null;

    /**初始化道具的图片 */
    initPropsImg() {
        this.createFireNode();
    }

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.fireDamage = commonConfig.getValueNumber("fireDamage") / 100;
    }

    /**创建火焰spine节点 */
    private createFireNode() {
        this.clearFireNode();
        if (!uiMgr.gameItemPrefab || !this.img1?.node) {
            return;
        }

        this.fireNode = poolMgr.getGameNode(uiMgr.gameItemPrefab);
        this.fireNode.name = "fireSpine";
        this.img1.node.addChild(this.fireNode);
        this.fireNode.setPosition(0, -10);

        let skeleton = poolMgr.getGameNodeSkeleton(this.fireNode);
        if (skeleton) {
            this.playFireAnim(skeleton);
        }
    }

    /**播放火焰animation循环动画 */
    private async playFireAnim(skeleton: sp.Skeleton) {
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.fire);
        if (!isLoaded || !skeleton || !skeleton.isValid) {
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**清理火焰spine节点 */
    private clearFireNode() {
        if (this.fireNode && this.fireNode.isValid) {
            poolMgr.putGameNode(this.fireNode);
        }

        this.fireNode = null;
    }
    
    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        this.clearFireNode();
        super.endProps();
    }

    /** 获取指定房间内火焰锻造台造成的每秒生命百分比伤害 */
    static getRoomDamagePercent(gameComp: any, roomIdx: number) {
        let fireComp = fireProps.getRoomFireComp(gameComp, roomIdx);
        if (!fireComp) {
            return 0;
        }

        return fireComp.fireDamage;
    }

    /** 获取指定房间内正在生效的火焰锻造台 */
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
