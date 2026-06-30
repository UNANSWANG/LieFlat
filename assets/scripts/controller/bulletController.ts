import { _decorator, Component, Sprite, UITransform, Vec3 } from 'cc';
import { ccTools } from '../extention/generalTools';
import { configData } from '../manager/configData';
import { imgPath } from '../manager/pathConfig';
import { poolMgr } from '../manager/poolManager';
import { enemyBaseController } from './enemy/enemyBaseController';
const { ccclass, property } = _decorator;

@ccclass('bulletController')
export class bulletController extends Component {
    /**追踪目标 */
    private target: enemyBaseController = null;
    /**伤害 */
    private damage: number = 0;
    /**命中距离 */
    private hitDistance: number = 20;
    /**临时世界坐标 */
    private tempWorldPos: Vec3 = new Vec3();
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();
    /**子弹图片 */
    private img: Sprite = null;
    /**等级 */
    private level: number = -1;

    protected onLoad(): void {
        this.img = this.node.getComponent(Sprite);
    }

    /**初始化子弹 */
    init(target: enemyBaseController, damage: number, level: number) {
        this.target = target;
        this.damage = damage;
        this.refreshBulletImg(level);
    }

    /**刷新子弹图片 */
    private refreshBulletImg(level: number) {
        if (!this.img) {
            this.img = this.node.getComponent(Sprite);
        }

        if (!this.img) {
            return;
        }
        //如果等级没有变化，直接返回
        if(this.level == level){
            return;
        }

        this.level = level;
        ccTools.loadImg(this.img, imgPath.bulletSkin + level);
    }

    protected update(dt: number): void {
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

        let curPos = this.node.position;
        let offsetX = this.tempLocalPos.x - curPos.x;
        let offsetY = this.tempLocalPos.y - curPos.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        if (distance <= this.hitDistance) {
            this.hitTarget();
            return;
        }

        let angle = Math.atan2(offsetY, offsetX) * 180 / Math.PI;
        this.node.angle = angle - 90;

        let moveDistance = configData.bulletSpeed * dt;
        if (distance <= moveDistance) {
            this.hitTarget();
            return;
        }

        this.node.setPosition(
            curPos.x + offsetX / distance * moveDistance,
            curPos.y + offsetY / distance * moveDistance,
            curPos.z
        );
    }

    /**目标是否有效 */
    private isTargetValid() {
        return !!this.target && !!this.target.node && this.target.node.isValid && this.target.hp > 0;
    }

    /**命中目标 */
    private hitTarget() {
        if (this.isTargetValid()) {
            this.target.takeDamage(this.damage);
        }
        this.recycle();
    }

    /**回收子弹 */
    private recycle() {
        this.target = null;
        this.damage = 0;
        this.node.active = false;
        this.node.removeFromParent();
        poolMgr.bulletPool.put(this.node);
    }
}
