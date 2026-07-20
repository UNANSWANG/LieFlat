import { _decorator, Component, UITransform, Vec3 } from 'cc';
import { ccTools } from '../extention/generalTools';
import { configData } from '../manager/configData';
import type { enemyBaseController } from './enemy/enemyBaseController';
import { poolMgr } from '../manager/poolManager';
const { ccclass, property } = _decorator;

@ccclass('netController')
export class netController extends Component {
    /**追踪目标 */
    private target: enemyBaseController = null;
    /**控制时长 */
    private duration: number = 0;
    /**命中距离 */
    private hitDistance: number = 20;
    /**临时世界坐标 */
    private tempWorldPos: Vec3 = new Vec3();
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();
    /**是否已经命中 */
    private hasHit: boolean = false;

    /**初始化渔网 */
    init(target: enemyBaseController, duration: number, imgPath: string) {
        this.target = target;
        this.duration = duration;
        this.hasHit = false;

        let img = poolMgr.getGameNodeSprite(this.node);
        if (img) {
            ccTools.loadImg(img, imgPath);
        }

        this.refreshDirection();
    }

    protected update(dt: number): void {
        if (this.hasHit) {
            this.refreshHitPosition();
            return;
        }

        if (!this.isTargetValid()) {
            this.recycle();
            return;
        }

        let distance = this.refreshDirection();
        if (distance <= this.hitDistance) {
            this.hitTarget();
            return;
        }

        let moveDistance = configData.bulletSpeed * dt;
        if (distance <= moveDistance) {
            this.hitTarget();
            return;
        }

        let curPos = this.node.position;
        this.node.setPosition(
            curPos.x + (this.tempLocalPos.x - curPos.x) / distance * moveDistance,
            curPos.y + (this.tempLocalPos.y - curPos.y) / distance * moveDistance,
            curPos.z
        );
    }

    /**刷新渔网朝向，返回与目标的距离 */
    private refreshDirection() {
        if (!this.isTargetValid()) {
            return 0;
        }

        this.target.node.getWorldPosition(this.tempWorldPos);
        let parentTransform = this.node.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.tempWorldPos, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.tempWorldPos);
        }

        let curPos = this.node.position;
        let offsetX = this.tempLocalPos.x - curPos.x;
        let offsetY = this.tempLocalPos.y - curPos.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        if (distance <= 0) {
            return distance;
        }

        let angle = Math.atan2(offsetY, offsetX) * 180 / Math.PI;
        this.node.angle = angle + 90;
        return distance;
    }

    /**目标是否有效 */
    private isTargetValid() {
        return !!this.target && !!this.target.node && this.target.node.isValid && this.target.hp > 0;
    }

    /**命中目标 */
    private hitTarget() {
        if (!this.isTargetValid()) {
            this.recycle();
            return;
        }

        this.hasHit = true;
        this.node.angle = 0;
        this.refreshHitPosition();
        this.target.netControl(this.duration);
        this.scheduleOnce(this.finishControl, this.duration);
    }

    /**刷新命中后渔网停留位置 */
    private refreshHitPosition() {
        if (!this.isTargetValid()) {
            this.recycle();
            return;
        }

        this.target.node.getWorldPosition(this.tempWorldPos);
        let parentTransform = this.node.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.tempWorldPos, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.tempWorldPos);
        }

        // let height = this.node.getComponent(UITransform)?.height || 0;
        // this.tempLocalPos.y += height / 2;
        this.node.setPosition(this.tempLocalPos);
    }

    /**控制结束 */
    private finishControl() {
        this.recycle();
    }

    /**移除渔网 */
    private recycle() {
        this.unschedule(this.finishControl);
        this.target = null;
        this.duration = 0;
        this.hasHit = false;
        this.enabled = false;
        poolMgr.putGameSpriteNode(this.node);
    }
}
