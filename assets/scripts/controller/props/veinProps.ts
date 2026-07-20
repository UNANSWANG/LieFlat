import { _decorator, Node, sp } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { configData } from '../../manager/configData';
import { pData } from '../../manager/playerData';
import { playerMgr } from '../../manager/playerManager';
import { produceType } from '../../UIPage/tips/produceTips';
import { gm } from '../../manager/gm';
import { roleState } from '../roleController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
const { ccclass, property } = _decorator;

@ccclass('veinProps')
export class veinProps extends gamePropsBase {
    /**矿脉spine节点 */
    private veinNode: Node = null;
    /**当前矿脉spine路径 */
    private veinSpinePath: string = "";

    /**初始化道具的图片 */
    initPropsImg() {
        super.initPropsImg();
        this.refreshVeinAnim();
    }

    /**道具开始生效 */
    startProps() {
        this.startProduceCoin();
    }

    /**道具结束生效 */
    endProps() {
        this.clearVeinNode();
        super.endProps();
        this.stopProduceCoin();
    }

    protected onDisable(): void {
        super.onDisable();
        this.clearVeinNode();
    }

    /**开始生产金币 */
    startProduceCoin() {
        this.stopProduceCoin();
        this.schedule(this.produceCoin, configData.produceCoinFreq);
    }

    /**停止生产金币 */
    stopProduceCoin() {
        this.unschedule(this.produceCoin);
    }

    get addNum() {
        if (this.level >= this.maxLevel || this.level < 0) {
            return 0;
        }
        return this.propsDatas[this.level].produceCoin;
    }

    /**生产金币 */
    produceCoin() {
        if (gm.isGamePause) {
            return;
        }

        this.playScaleDownAnim();
        this.produceItem(produceType.coin, this.addNum);

        //是当前游戏玩家的矿脉则增加游戏金币
        if (this.roomIdx == playerMgr.playerComp.roomIdx && playerMgr.playerComp.state == roleState.bed) {
            pData.fixGameCoin(this.addNum);
        }
    }

    /**刷新矿脉动画 */
    private refreshVeinAnim() {
        let path = this.getVeinSpinePath();
        if (!path) {
            this.clearVeinNode();
            return;
        }

        if (this.veinNode && this.veinNode.isValid && this.veinNode.parent && this.veinSpinePath == path) {
            return;
        }

        if (this.veinNode && this.veinNode.isValid && this.veinNode.parent) {
            this.veinSpinePath = path;
            let skeleton = poolMgr.getGameNodeSkeleton(this.veinNode);
            if (skeleton) {
                this.playVeinAnim(skeleton, this.veinNode, path);
            }
            return;
        }

        this.clearVeinNode();
        if (!uiMgr.gameSpineItemPrefab || !this.img2?.node) {
            return;
        }

        this.veinSpinePath = path;
        this.veinNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.veinNode.name = "veinSpine";
        this.img2.node.addChild(this.veinNode);

        let skeleton = poolMgr.getGameNodeSkeleton(this.veinNode);
        if (skeleton) {
            this.playVeinAnim(skeleton, this.veinNode, path);
        }
    }

    /**获取当前等级矿脉动画路径 */
    private getVeinSpinePath() {
        if (this.level == 1) {
            return spinePath.silverVein;
        }

        if (this.level >= 2) {
            return spinePath.goldVein;
        }

        return "";
    }

    /**播放矿脉animation循环动画 */
    private async playVeinAnim(skeleton: sp.Skeleton, node: Node, path: string) {
        let isLoaded = await ccTools.loadSpine(skeleton, path);
        if (!isLoaded || !skeleton || !skeleton.isValid || this.veinNode != node || this.veinSpinePath != path) {
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**清理矿脉spine节点 */
    private clearVeinNode() {
        if (this.veinNode && this.veinNode.isValid) {
            poolMgr.putGameSpineNode(this.veinNode);
        }

        this.veinNode = null;
        this.veinSpinePath = "";
    }
}
