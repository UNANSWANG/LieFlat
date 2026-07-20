import { _decorator, Node, sp } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { JsonPropsData, propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
const { ccclass } = _decorator;

@ccclass('boxProps')
export class boxProps extends gamePropsBase {
    /**魔盒spine节点 */
    private boxNode: Node = null;
    /**魔盒spine组件 */
    private boxSkeleton: sp.Skeleton = null;
    /**是否正在播放魔盒动画 */
    private isPlayingBoxAnim: boolean = false;

    /**初始化道具的图片 */
    initPropsImg() {
        this.createBoxNode();
    }

    /**道具开始生效 */
    startProps() {
        this.playBoxAttackAnim();
    }

    /**道具结束生效 */
    endProps() {
        this.clearBoxNode();
        super.endProps();
        this.isPlayingBoxAnim = false;
    }

    protected onDisable(): void {
        super.onDisable();
        this.clearBoxNode();
        this.isPlayingBoxAnim = false;
    }

    /**创建魔盒spine节点 */
    private createBoxNode() {
        this.clearBoxNode();
        if (!uiMgr.gameItemPrefab || !this.img1?.node) {
            return;
        }

        this.boxNode = poolMgr.getGameNode(uiMgr.gameItemPrefab);
        this.boxNode.name = "boxSpine";
        this.img1.node.addChild(this.boxNode);
        this.boxNode.setPosition(0, -10, 0);
        this.boxSkeleton = poolMgr.getGameNodeSkeleton(this.boxNode);
    }

    /**播放魔盒attack动画 */
    private async playBoxAttackAnim() {
        if (this.isPlayingBoxAnim || !this.boxSkeleton || !this.boxNode || !this.boxNode.isValid) {
            return;
        }

        this.isPlayingBoxAnim = true;
        let skeleton = this.boxSkeleton;
        let node = this.boxNode;
        skeleton.premultipliedAlpha = false;
        skeleton.timeScale = 2;
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.box);
        if (!isLoaded || !skeleton || !skeleton.isValid || this.boxSkeleton != skeleton || this.boxNode != node) {
            if (this.boxSkeleton == skeleton && this.boxNode == node) {
                this.isPlayingBoxAnim = false;
            }
            return;
        }

        skeleton.premultipliedAlpha = false;
        skeleton.timeScale = 2;
        skeleton.setCompleteListener((trackEntry: any) => {
            let animName = trackEntry?.animation?.name;
            if (animName != "attack" || !this.isPlayingBoxAnim) {
                return;
            }

            this.isPlayingBoxAnim = false;
            this.playDisappearAnim();
        });
        skeleton.setAnimation(0, "attack", false);
    }

    /**清理魔盒spine节点 */
    private clearBoxNode() {
        if (this.boxSkeleton && this.boxSkeleton.isValid) {
            this.boxSkeleton.setCompleteListener(null);
        }

        if (this.boxNode && this.boxNode.isValid) {
            poolMgr.putGameNode(this.boxNode);
        }

        this.boxNode = null;
        this.boxSkeleton = null;
    }

    /**消失时随机生成道具替代魔盒 */
    onDisappear() {
        let tileItemComp = this.tileItemComp;
        let propsData = this.getRandomBuildablePropsData();
        if (!tileItemComp || !propsData) {
            return;
        }

        setTimeout(() => {
            tileItemComp.addProps(propsData.propsType as tilePropsType, this.getCreateLevelByPropsData(propsData));
        }, 0);
    }

    /**随机道具表等级从1开始，道具组件等级从0开始 */
    private getCreateLevelByPropsData(propsData: JsonPropsData) {
        return Math.max(0, (Number(propsData?.level) || 1) - 1);
    }

    /**获取未达到房间生成上限的随机道具 */
    private getRandomBuildablePropsData() {
        let randomPropsData = propsConfig.getRandomPropsData();
        let result: JsonPropsData[] = [];

        for (let i = 0; i < randomPropsData.length; i++) {
            let propsData = randomPropsData[i];
            if (this.isBuildNumLimit(propsData)) {
                continue;
            }

            result.push(propsData);
        }

        if (result.length == 0) {
            return null;
        }

        let randomIdx = Math.floor(Math.random() * result.length);
        return result[randomIdx];
    }

    /**是否达到当前房间建造数量上限 */
    private isBuildNumLimit(propsData: JsonPropsData) {
        if (!propsData?.builNumMax || propsData.builNumMax <= 0) {
            return false;
        }

        let buildCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, propsData.propsType) || 0;
        return buildCount >= propsData.builNumMax;
    }

}
