import { _decorator, Component, tween, Tween, UITransform, Vec3 } from 'cc';
import { ccTools } from '../extention/generalTools';
import { poolMgr } from '../manager/poolManager';
import type { enemyBaseController } from './enemy/enemyBaseController';
const { ccclass } = _decorator;

@ccclass('sawController')
export class sawController extends Component {
    /**斩杀目标 */
    private target: enemyBaseController = null;
    /**生成在敌人头顶的偏移 */
    private startOffsetY: number = 220;
    /**下落目标相对敌人的偏移 */
    private landedOffsetY: number = 25;
    /**空中悬停时长 */
    private hoverDuration: number = 1;
    /**下落时长 */
    private dropDuration: number = 0.25;
    /**临时世界坐标 */
    private tempWorldPos: Vec3 = new Vec3();
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();

    /**初始化铡刀 */
    init(target: enemyBaseController, imgPath: string) {
        this.target = target;

        let img = poolMgr.getGameNodeSprite(this.node);
        if (img) {
            ccTools.loadImg(img, imgPath);
        }

        if (!this.refreshTargetLocalPosition(0)) {
            this.recycle();
            return;
        }

        this.target.sawControl(this.hoverDuration + this.dropDuration);
        this.node.setPosition(this.tempLocalPos.x, this.tempLocalPos.y + this.startOffsetY, this.tempLocalPos.z);
        this.playHoverAnim();
    }

    protected update(dt: number): void {
        if (!this.isTargetValid()) {
            this.recycle();
        }
    }

    /**播放空中悬停动画 */
    private playHoverAnim() {
        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .delay(this.hoverDuration)
            .call(() => {
                this.playDropAnim();
            })
            .start();
    }

    /**播放下落动画 */
    private playDropAnim() {
        if (!this.refreshTargetLocalPosition(this.landedOffsetY)) {
            this.recycle();
            return;
        }

        let targetPos = this.tempLocalPos.clone();

        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(this.dropDuration, { position: targetPos }, { easing: "quadIn" })
            .call(() => {
                this.killTarget();
            })
            .start();
    }

    /**刷新目标本地坐标 */
    private refreshTargetLocalPosition(offsetY: number) {
        if (!this.isTargetValid()) {
            return false;
        }

        this.target.node.getWorldPosition(this.tempWorldPos);
        this.tempWorldPos.y += offsetY;

        let parentTransform = this.node.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.tempWorldPos, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.tempWorldPos);
        }

        return true;
    }

    /**目标是否有效 */
    private isTargetValid() {
        return !!this.target && !!this.target.node && this.target.node.isValid && this.target.hp > 0;
    }

    /**斩杀目标 */
    private killTarget() {
        if (this.isTargetValid()) {
            this.target.executeBySaw();
        }

        this.recycle();
    }

    /**回收铡刀 */
    private recycle() {
        Tween.stopAllByTarget(this.node);
        this.target = null;
        this.enabled = false;
        poolMgr.putGameSpriteNode(this.node);
    }
}
