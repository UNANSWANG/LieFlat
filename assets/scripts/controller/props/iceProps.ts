import { _decorator, Node, sp } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
const { ccclass, property } = _decorator;

@ccclass('iceProps')
export class iceProps extends gamePropsBase {
    /**房间内存在千年寒冰时，感染者攻击动画播放速度倍率 */
    static iceAttackTimeScale: number = 0.8;
    /**雪花spine节点 */
    private snowNode: Node = null;

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

    }

    /**道具结束生效 */
    endProps() {
        this.clearSnowNode();
        super.endProps();
    }

    protected onDisable(): void {
        super.onDisable();
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

}
