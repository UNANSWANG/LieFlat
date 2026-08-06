import { _decorator, Color, Component, Node, Prefab, Sprite, tween, Tween, UIOpacity, Vec2, Vec3 } from 'cc';
import { bedProps } from './props/bedProps';
import { gamePropsBase } from './props/gamePropsBase';
import { doorProps } from './props/doorProps';
import { UIGame } from '../UIPage/UIGame';
import { cannonProps } from './props/cannonProps';
import { generatorProps } from './props/generatorProps';
import { veinProps } from './props/veinProps';
import { playerMgr } from '../manager/playerManager';
import { GameEvent } from '../manager/configData';
import { gm } from '../manager/gm';
import { loopAnimation } from './loopAnimation';
import { poolMgr } from '../manager/poolManager';
import { iceProps } from './props/iceProps';
import { machineProps } from './props/machineProps';
import { alarmProps } from './props/alarmProps';
import { printerProps } from './props/printerProps';
import { netProps } from './props/netProps';
import { sawProps } from './props/sawProps';
import { telescopeProps } from './props/telescopeProps';
import { bearingProps } from './props/bearingProps';
import { boxProps } from './props/boxProps';
import { coverProps } from './props/coverProps';
import { thornProps } from './props/thornProps';
import { cageProps } from './props/cageProps';
import { fireProps } from './props/fireProps';
const { ccclass, property } = _decorator;

/**瓦片类型 */
export enum tilePropsType {
    /**无 */
    none = "",
    /**床 */
    bed = "bed",
    /**门 */
    door = "door",
    /**炮台 */
    cannon = "cannon",
    /**发电机 */
    generator = "generator",
    /**矿脉 */
    vein = "vein",
    /**修复台 */
    machine = "machine",
    /**潘多拉魔盒 */
    box = "box",
    /**铁笼 */
    cage = "cage",
    /**金钟罩 */
    cover = "cover",
    /**印钞机 */
    printer = "printer",
    /**千年寒冰 */
    ice = "ice",
    /**蛛网 */
    net = "net",
    /**荆棘 */
    thorn = "thorn",
    /**铡刀 */
    saw = "saw",
    /**火焰锻造台 */
    fire = "fire",
    /**望远镜 */
    telescope = "telescope",
    /**轴承 */
    bearing = "bearing",
    /**警示铃 */
    alarm = "alarm",
}
@ccclass('tileItemController')
export class tileItemController extends Component {
    @property(Prefab)
    propsItemPre: Prefab = null;

    ///
    ///节点
    ///
    /**道具父节点 */
    propsNode: Node = null;
    /**可选择背景 */
    boxBg: Node = null;
    /**可选择框 */
    outLine: Node = null;
    /**升级节点 */
    upgradeNode: Node = null;

    ///
    ///属性
    ///
    /**坐标系 */
    pos: Vec2 = null;
    /**所在房间索引 */
    roomIdx: number = 0;
    /**道具类型 */
    tileType: tilePropsType = tilePropsType.none;
    /**游戏脚本 */
    gameComp: UIGame = null;
    /**道具节点 */
    propsItem: Node = null;
    /**当前道具脚本 */
    private propsCompCache: gamePropsBase = null;
    /**是否已置灰 */
    isGrayTile: boolean = false;
    /**是否为地图随机生成的可拾取道具 */
    isRandomPickProps: boolean = false;
    /**预定拾取该随机道具的人机id */
    randomPickPropsRobotId: number = 0;
    /**常规颜色 */
    normalColor: Color = new Color("#FFFFFF");
    /**可升级颜色 */
    upgradeColor: Color = new Color("#00c032");
    /**遮罩节点 */
    mask: Node = null;

    protected onLoad(): void {
        this.propsNode = this.node.getChildByName("propsNode");
        this.boxBg = this.node.getChildByName("boxBg");
        this.outLine = this.node.getChildByName("outLine");
        this.upgradeNode = this.node.getChildByName("upgradeNode");
        this.mask = this.node.getChildByName("mask");

        this.hideSelectBox();
        this.upgradeNode.active = false;
        this.mask.active = false;
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        this.removeListener();
        gm.Event.on(GameEvent.refreshGameMonetary, this.checkUpgrade, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.refreshGameMonetary, this.checkUpgrade, this);
    }

    clearData() {
        this.pos = null;
        /**所在房间索引 */
        this.roomIdx = 0;
        /**道具类型 */
        this.tileType = tilePropsType.none;
        /**游戏脚本 */
        this.gameComp = null;
        /**道具节点 */
        this.propsItem = null;
        this.propsCompCache = null;
        this.isGrayTile = false;
        this.isRandomPickProps = false;
        this.randomPickPropsRobotId = 0;
        this.hideSelectBox();
        this.upgradeNode.getComponent(loopAnimation).stopAni();
        this.upgradeNode.active = false;
        this.mask.active = false;
    }

    /**获取道具脚本 */
    get propsComp(): gamePropsBase {
        if (!this.propsItem || !this.propsItem.isValid || !this.propsCompCache || !this.propsCompCache.isValid) {
            return null;
        }
        return this.propsCompCache;
    }

    /**添加道具 */
    addProps(type: tilePropsType, level: number = 0, isSpecialSellProps: boolean = false, isAutoStartProps: boolean = true) {
        this.isGrayTile = false;
        this.mask.active = false;
        this.tileType = type;
        this.createProps(Math.max(0, Math.floor(Number(level) || 0)), isSpecialSellProps, isAutoStartProps);
    }

    /**绑定游戏节点 */
    bindGameComp(gameComp: UIGame) {
        this.gameComp = gameComp;
    }

    /**创建道具 */
    createProps(level: number = 0, isSpecialSellProps: boolean = false, isAutoStartProps: boolean = true) {
        if (this.tileType == tilePropsType.none) {
            return;
        }

        let componentType = this.getPropsComponentType(this.tileType);
        if (!componentType) {
            return;
        }
        // 每种道具使用独立对象池，复用时直接取已有脚本，避免重复addComponent/destroy
        let propsItem = poolMgr.getPropsNode(this.propsItemPre, this.tileType, componentType);
        let propComp = propsItem.getComponent(componentType) as gamePropsBase;

        this.propsNode.addChild(propsItem);
        this.propsItem = propsItem;
        this.propsCompCache = propComp;
        propComp.enabled = true;
        propComp.init(this, level, isSpecialSellProps, isAutoStartProps);

        this.checkUpgrade();
        this.gameComp?.refreshRoomPropsUpgradeState(this.roomIdx);
    }

    /**获取道具类型对应的运行脚本，用于分类对象池复用 */
    private getPropsComponentType(type: tilePropsType): any {
        switch (type) {
            case tilePropsType.bed: return bedProps;
            case tilePropsType.door: return doorProps;
            case tilePropsType.cannon: return cannonProps;
            case tilePropsType.generator: return generatorProps;
            case tilePropsType.vein: return veinProps;
            case tilePropsType.machine: return machineProps;
            case tilePropsType.ice: return iceProps;
            case tilePropsType.printer: return printerProps;
            case tilePropsType.net: return netProps;
            case tilePropsType.saw: return sawProps;
            case tilePropsType.fire: return fireProps;
            case tilePropsType.telescope: return telescopeProps;
            case tilePropsType.bearing: return bearingProps;
            case tilePropsType.alarm: return alarmProps;
            case tilePropsType.box: return boxProps;
            case tilePropsType.cage: return cageProps;
            case tilePropsType.cover: return coverProps;
            case tilePropsType.thorn: return thornProps;
            default: return null;
        }
    }

    /**设置门的初始位置 */
    setDoorPos(offsetDir: number, dir: number) {
        if (!this.propsItem || this.tileType != tilePropsType.door) {
            return;
        }

        let doorComp = this.propsComp as doorProps;
        doorComp.initDoor(offsetDir, dir);
    }

    /**操作道具 */
    operateProps() {
        if (!this.propsItem || this.tileType == tilePropsType.none) {
            return;
        }

        let propComp = this.propsComp;

        let flag = propComp.operateProps();

        if (this.tileType == tilePropsType.door) {
            //门需要操作地图
            this.gameComp.fixTileMapBlock(this.pos, flag ? 1 : 0);
        }
    }

    /**升级道具 */
    upgradeProps() {
        if (!this.propsItem || this.tileType == tilePropsType.none) {
            return;
        }

        let propComp = this.propsComp;
        propComp.upgradeProps();
    }

    /**移除道具 */
    removeProps() {
        if (!this.propsItem) {
            return;
        }
        let propComp = this.propsComp;
        // 清理并禁用脚本后整节点回池，不再销毁组件
        propComp?.endProps();
        propComp?.clearData();
        if (propComp) {
            propComp.enabled = false;
        }
        poolMgr.putPropsNode(this.propsItem, this.tileType);
        this.propsItem = null;
        this.propsCompCache = null;
        this.tileType = tilePropsType.none;
        this.isRandomPickProps = false;
        this.randomPickPropsRobotId = 0;
    }

    /**将现有道具节点转移到角色身上，不创建新节点 */
    takePropsItem(targetParent: Node) {
        if (!this.propsItem || !targetParent || !targetParent.isValid) {
            return null;
        }

        let propsItem = this.propsItem;

        this.propsItem = null;
        this.propsCompCache = null;
        this.tileType = tilePropsType.none;
        this.isRandomPickProps = false;
        this.randomPickPropsRobotId = 0;
        propsItem.setParent(targetParent);

        return propsItem;
    }

    /**回收到对象池 */
    recycleToPool() {
        this.removeProps();
        this.clearData();
        poolMgr.putTileItem(this.node);
    }

    /**刷新是否可升级 */
    checkUpgrade() {
        if (!playerMgr.playerComp || this.roomIdx != playerMgr.playerComp.roomIdx) {
            return;
        }

        let canBuy = false;
        if (this.propsComp && this.propsComp.isValid) {
            canBuy = this.propsComp.checkCanUpgrade();
        }

        this.outLine.getComponent(Sprite).color = canBuy ? this.upgradeColor : this.normalColor;
        this.boxBg.getComponent(Sprite).color = canBuy ? this.upgradeColor : this.normalColor;
        if (canBuy) {
            if (!this.upgradeNode.active) {
                this.upgradeNode.active = true;
                this.upgradeNode.getComponent(loopAnimation).playAni();
            }
        } else {
            if (this.upgradeNode.active) {
                this.upgradeNode.getComponent(loopAnimation).stopAni();
                this.upgradeNode.active = false;
            }
        }
    }

    /**显示可选择框 */
    showSelectBox() {
        this.boxBg.active = true;
        this.outLine.active = true;
        this.playSelectBoxAnim();
    }

    /**隐藏可选择框 */
    hideSelectBox() {
        this.boxBg.active = false;
        this.outLine.active = false;
        this.stopSelectBoxAnim();
    }

    /**播放可选框动画 */
    playSelectBoxAnim() {
        let boxUiop = this.boxBg.getComponent(UIOpacity);
        let outLineUiop = this.outLine.getComponent(UIOpacity);

        Tween.stopAllByTarget(boxUiop);
        Tween.stopAllByTarget(outLineUiop);

        tween(boxUiop)
            .set({ opacity: 10 })
            .to(2, { opacity: 50 })
            .to(2, { opacity: 10 })
            .union()
            .repeatForever()
            .start();

        tween(outLineUiop)
            .set({ opacity: 20 })
            .to(2, { opacity: 100 })
            .to(2, { opacity: 20 })
            .union()
            .repeatForever()
            .start();
    }

    /**停止可选框动画 */
    stopSelectBoxAnim() {
        Tween.stopAllByTarget(this.boxBg.getComponent(UIOpacity));
        Tween.stopAllByTarget(this.outLine.getComponent(UIOpacity));
    }

    /**瓦片格置灰 */
    grayTile() {
        this.isGrayTile = true;
        this.mask.active = true;
        this.outLine.active = false;
        this.upgradeNode.active = false;
        this.boxBg.active = false;
        let maskUiop = this.mask.getComponent(UIOpacity);
        Tween.stopAllByTarget(maskUiop);
        maskUiop.opacity = 0;

        if (this.propsComp) {
            this.propsComp.endProps();
        }

        tween(maskUiop)
            .to(0.5, { opacity: 255 })
            .start();
    }
}


