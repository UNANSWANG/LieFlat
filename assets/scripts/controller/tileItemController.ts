import { _decorator, Color, Component, Node, Prefab, Sprite, tween, Tween, UIOpacity, Vec2, Vec3 } from 'cc';
import { bedProps } from './props/bedProps';
import { gamePropsBase } from './props/gamePropsBase';
import { doorProps } from './props/doorProps';
import { UIGame } from '../UIPage/UIGame';
import { cannonProps } from './props/cannonProps';
import { generatorProps } from './props/generatorProps';
import { veinProps } from './props/veinProps';
import { ccTools } from '../extention/generalTools';
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
    /**渔网 */
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

        let propsItem = poolMgr.getPropsNode(this.propsItemPre);
        let propComp: gamePropsBase = null;
        if (this.tileType == tilePropsType.bed) {
            propComp = propsItem.addComponent(bedProps);
        } else if (this.tileType == tilePropsType.door) {
            propComp = propsItem.addComponent(doorProps);
        } else if (this.tileType == tilePropsType.cannon) {
            propComp = propsItem.addComponent(cannonProps);
        } else if (this.tileType == tilePropsType.generator) {
            propComp = propsItem.addComponent(generatorProps);
        } else if (this.tileType == tilePropsType.vein) {
            propComp = propsItem.addComponent(veinProps);
        } else if (this.tileType == tilePropsType.machine) {
            propComp = propsItem.addComponent(machineProps);
        } else if (this.tileType == tilePropsType.ice) {
            propComp = propsItem.addComponent(iceProps);
        } else if (this.tileType == tilePropsType.printer) {
            propComp = propsItem.addComponent(printerProps);
        } else if (this.tileType == tilePropsType.net) {
            propComp = propsItem.addComponent(netProps);
        } else if (this.tileType == tilePropsType.saw) {
            propComp = propsItem.addComponent(sawProps);
        } else if (this.tileType == tilePropsType.fire) {
            propComp = propsItem.addComponent(fireProps);
        } else if (this.tileType == tilePropsType.telescope) {
            propComp = propsItem.addComponent(telescopeProps);
        } else if (this.tileType == tilePropsType.bearing) {
            propComp = propsItem.addComponent(bearingProps);
        } else if (this.tileType == tilePropsType.alarm) {
            propComp = propsItem.addComponent(alarmProps);
        } else if (this.tileType == tilePropsType.box) {
            propComp = propsItem.addComponent(boxProps);
        } else if (this.tileType == tilePropsType.cage) {
            propComp = propsItem.addComponent(cageProps);
        } else if (this.tileType == tilePropsType.cover) {
            propComp = propsItem.addComponent(coverProps);
        } else if (this.tileType == tilePropsType.thorn) {
            propComp = propsItem.addComponent(thornProps);
        }

        this.propsNode.addChild(propsItem);
        this.propsItem = propsItem;
        this.propsCompCache = propComp;
        propComp.enabled = true;
        propComp.init(this, level, isSpecialSellProps, isAutoStartProps);

        this.checkUpgrade();
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
        propComp?.endProps();
        propComp?.clearData();
        if (propComp) {
            propComp.enabled = false;
            propComp.destroy();
        }
        poolMgr.putPropsNode(this.propsItem);
        this.propsItem = null;
        this.propsCompCache = null;
        this.tileType = tilePropsType.none;
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
            let nextLevel = this.propsComp.level + 1;
            //非满级才需要显示可升级
            if (nextLevel < this.propsComp.propsDatas.length) {
                canBuy = ccTools.checkCanBuy(this.propsComp.propsDatas[nextLevel]);
            }
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
            .set({ opacity: 0 })
            .to(2.5, { opacity: 200 })
            .to(2.5, { opacity: 0 })
            .union()
            .repeatForever()
            .start();

        tween(outLineUiop)
            .set({ opacity: 0 })
            .to(2.5, { opacity: 255 })
            .to(2.5, { opacity: 0 })
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


