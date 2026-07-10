import { _decorator, Component, instantiate, Node, Sprite, Tween, tween, UIOpacity, Vec3 } from 'cc';
import { tileItemController, tilePropsType } from '../tileItemController';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
import { produceTips, produceType } from '../../UIPage/tips/produceTips';
import { poolMgr } from '../../manager/poolManager';
import { uiMgr } from '../../manager/UIManager';
import { roleController, roleState } from '../roleController';
import { playerMgr } from '../../manager/playerManager';
import { UIGame } from '../../UIPage/UIGame';
import { propsConfig } from '../../json/jsonProps';
const { ccclass, property } = _decorator;

@ccclass('gamePropsBase')
export class gamePropsBase extends Component {
    /**道具等级 */
    level: number = 0;
    /**最大等级（不同道具不同最大等级） */
    maxLevel: number = 10;
    /**最大血量 */
    maxHp: number = 0;
    /**当前血量 */
    hp: number = 1;
    /**最近受到的伤害记录 */
    private damageRecords: { time: number, damage: number }[] = [];
    /**瓦片脚本 */
    tileItemComp: tileItemController = null;
    /**道具是否正在生效 */
    private propsActive: boolean = false;
    /**是否为开局随机生成的房间道具 */
    isInitialRandomProps: boolean = false;


    /**游戏脚本 */
    get gameComp() {
        return this.tileItemComp.gameComp;
    }
    /**道具类型 */
    get propsType() {
        return this.tileItemComp.tileType;
    }
    /**所在房间索引 */
    get roomIdx() {
        return this.tileItemComp.roomIdx;
    }
    /**坐标系 */
    get pos() {
        return this.tileItemComp.pos;
    }
    /**道具效果是否生效中 */
    get isPropsActive() {
        return this.propsActive && this.isRoomEffectActive;
    }

    /**房间道具是否满足生效条件 */
    get isRoomEffectActive() {
        if (this.propsType == tilePropsType.bed || this.propsType == tilePropsType.door) {
            return true;
        }

        return this.gameComp?.hasSleepingRoleInRoom(this.roomIdx) ?? true;
    }

    ///
    ///节点
    ///
    /**缩放节点 */
    scaleNode: Node = null;
    /**图片1 */
    img1: Sprite = null;
    /**图片2 */
    img2: Sprite = null;
    /**图片3 */
    img3: Sprite = null;
    /**血量节点 */
    hpNode: Node = null;
    /**血量图片 */
    hpBar: Sprite = null;
    /**透明组件 */
    uiOpacity: UIOpacity = null;

    protected onLoad(): void {
        this.scaleNode = this.node.getChildByName("scaleNode");
        this.img1 = this.scaleNode.getChildByName("img1").getComponent(Sprite);
        this.img2 = this.scaleNode.getChildByName("img2").getComponent(Sprite);
        this.img3 = this.scaleNode.getChildByName("img3").getComponent(Sprite);
        this.hpNode = this.scaleNode.getChildByName("hpBg");
        this.hpBar = this.hpNode.getChildByName("hpBar").getComponent(Sprite);
        this.uiOpacity = this.scaleNode.getComponent(UIOpacity);
    }

    protected onDisable(): void {
        this.unscheduleAllCallbacks();
    }

    clearData() {
        this.img1.spriteFrame = null;
        this.img2.spriteFrame = null;
        this.img3.spriteFrame = null;

        this.hpNode.active = false;

        this.img1.node.position = new Vec3(0, 0, 0);
        this.img2.node.position = new Vec3(0, 0, 0);
        this.img3.node.position = new Vec3(0, 0, 0);

        this.level = 0;
        this.hp = 1;
        this.uiOpacity.opacity = 255;
        this.damageRecords = [];
        this.tileItemComp = null;
        this.propsActive = false;
        this.isInitialRandomProps = false;
    }

    /**是否最大等级 */
    get isMaxLevel() {
        return this.level >= this.maxLevel - 1;
    }

    /**当前道具全部数据 */
    get propsDatas() {
        return propsConfig.getPropsData(this.propsType);
    }

    /**初始化最大等级 */
    initMaxLevel() {
        this.maxLevel = this.propsDatas.length;
    }

    /**初始化血量 */
    initMaxHp() {
        this.maxHp = 1;
        this.hp = this.maxHp;
    }

    /**血条百分比 */
    get hpPercent() {
        return this.hp / this.maxHp;
    }

    /**伤害百分比 */
    getDamagePercent(damage: number) {
        return damage / this.maxHp;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**初始化专属数据 */
    initPropsData() {

    }

    /**道具结束生效 */
    endProps() {
        this.propsActive = false;
        this.unscheduleAllCallbacks();
    }

    /**初始化道具 */
    init(tileItemComp: tileItemController, level: number = 0, isInitialRandomProps: boolean = false) {
        this.clearData();
        this.level = level;
        this.uiOpacity.opacity = 255;
        this.tileItemComp = tileItemComp;
        this.isInitialRandomProps = isInitialRandomProps;
        this.initPropsImg();
        this.initMaxLevel();
        this.initMaxHp();
        this.initPropsData();

        this.propsActive = true;
        this.startProps();
    }

    /**初始化道具的图片(可重写，默认固定只有一个图片) */
    initPropsImg() {
        ccTools.loadImg(this.img1, imgPath.gamePprops + this.propsType + "_" + this.level);
    }

    /**操作道具 */
    operateProps(): Boolean {
        return false;
    }

    /**升级道具 */
    upgradeProps() {
        if (this.isMaxLevel) {
            return;
        }
        this.level++;
        this.isInitialRandomProps = false;
        this.initPropsImg();
    }

    /**生产物品 */
    produceItem(type: produceType, num: number) {
        this.gameComp.addProduceAnim(type, num, this.node.worldPosition);
    }

    /**播放缩小动画 */
    playScaleDownAnim(node = this.scaleNode) {
        Tween.stopAllByTarget(node);

        tween(node)
            .set({ scale: new Vec3(1, 1, 1) })
            .to(0.05, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
            .start();
    }

    /**播放放大动画 */
    playScaleUpAnim(node = this.scaleNode) {
        Tween.stopAllByTarget(node);

        tween(node)
            .set({ scale: new Vec3(1, 1, 1) })
            .to(0.05, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
            .start();
    }

    /**获取角色信息通过房间号 */
    getRoleInfoByRoomIdx(roomIdx: number) {
        let playerComp = playerMgr.playerComp;
        if (playerComp && playerComp.node && playerComp.node.isValid && playerComp.roomIdx == roomIdx) {
            return playerComp;
        }

        let robotArr = this.gameComp?.robotArr || [];
        for (let i = 0; i < robotArr.length; i++) {
            let robotComp = robotArr[i];
            if (robotComp && robotComp.node && robotComp.node.isValid && robotComp.roomIdx == roomIdx) {
                return robotComp;
            }
        }
        return null;
    }

    /**移除道具 */
    removeProps() {
        this.tileItemComp.removeProps();
        //直接销毁节点
        this.node.destroy();
        this.tileItemComp.checkUpgrade();
    }

    /**受到伤害 */
    takeDamage(damage: number) {
        this.recordDamage(damage);
        this.hp -= damage;
        this.playScaleUpAnim();
        this.hpBar.fillRange = this.hp / this.maxHp;
        this.hpNode.active = true;
        if (this.hp <= 0) {
            this.hp = 0;

            if (this.propsType == tilePropsType.bed) {
                let roleInfo: roleController = this.getRoleInfoByRoomIdx(this.roomIdx);
                if (roleInfo) {
                    roleInfo.state = roleState.dead;
                }
            }
            this.removeProps();
            return true;
        }

        return false;
    }

    /**记录受到的伤害 */
    private recordDamage(damage: number) {
        if (damage <= 0) {
            return;
        }

        this.damageRecords.push({ time: Date.now() / 1000, damage: damage });
        this.clearExpiredDamageRecords(2);
    }

    /**获取最近一段时间内受到的伤害 */
    getRecentDamage(time: number = 1) {
        this.clearExpiredDamageRecords(time);
        let result = 0;
        for (let i = 0; i < this.damageRecords.length; i++) {
            result += this.damageRecords[i].damage;
        }

        return result;
    }

    /**道具消失回调（移除道具之前） */
    onDisappear() {

    }

    /**消失动画 */
    playDisappearAnim() {
        this.uiOpacity.opacity = 255;
        Tween.stopAllByTarget(this.uiOpacity);
        tween(this.uiOpacity)
            .to(0.2, { opacity: 0 })
            .call(() => {
                //移除回调
                this.onDisappear();
                //移除自身
                this.tileItemComp.removeProps();
            })
            .start();
    }

    /**清理过期伤害记录 */
    private clearExpiredDamageRecords(time: number) {
        let minTime = Date.now() / 1000 - time;
        this.damageRecords = this.damageRecords.filter(record => record.time >= minTime);
    }
}


