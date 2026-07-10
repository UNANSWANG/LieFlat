import { _decorator, Component, Sprite, tween, Tween, UITransform, Vec3 } from 'cc';
import { ccTools } from '../extention/generalTools';
import type { enemyBaseController } from './enemy/enemyBaseController';
const { ccclass } = _decorator;

@ccclass('cageController')
export class cageController extends Component {
    /**控制目标 */
    private target: enemyBaseController = null;
    /**铁笼停留时长 */
    private duration: number = 0;
    /**是否已经落到目标位置 */
    private hasLanded: boolean = false;
    /**生成在敌人头顶的偏移 */
    private startOffsetY: number = 200;
    /**临时世界坐标 */
    private tempWorldPos: Vec3 = new Vec3();
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();

    /**初始化铁笼 */
    init(target: enemyBaseController, duration: number, imgPath: string) {
        this.target = target;
        this.duration = duration;
        this.hasLanded = false;

        let img = this.node.getComponent(Sprite);
        if (img) {
            ccTools.loadImg(img, imgPath);
        }

        if (!this.refreshTargetLocalPosition(0)) {
            this.recycle();
            return;
        }

        this.node.setPosition(this.tempLocalPos.x, this.tempLocalPos.y + this.startOffsetY, this.tempLocalPos.z);
        this.playDropAnim();
        this.scheduleOnce(this.finishControl, this.duration);
    }

    protected update(dt: number): void {
        if (!this.isTargetValid()) {
            this.recycle();
            return;
        }

        if (this.hasLanded && this.refreshTargetLocalPosition(0)) {
            this.node.setPosition(this.tempLocalPos);
        }
    }

    /**播放向下落到敌人位置的动画 */
    private playDropAnim() {
        if (!this.refreshTargetLocalPosition(0)) {
            this.recycle();
            return;
        }

        let targetPos = this.tempLocalPos.clone();
        targetPos.y = this.tempLocalPos.y + 130;

        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(0.25, { position: targetPos }, { easing: "quadIn" })
            .call(() => {
                this.hasLanded = true;
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

    /**控制结束 */
    private finishControl() {
        this.recycle();
    }

    /**移除铁笼 */
    private recycle() {
        Tween.stopAllByTarget(this.node);
        this.unschedule(this.finishControl);
        this.target = null;
        this.duration = 0;
        this.hasLanded = false;
        this.node.destroy();
    }
}
