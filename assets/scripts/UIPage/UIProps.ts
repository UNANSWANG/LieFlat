import { _decorator, instantiate, Label, Node, Prefab, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { UIBase } from './UIBase';
import { imgPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { propsConfig } from '../json/jsonProps';
import { gamePropsBase } from '../controller/props/gamePropsBase';
import { tilePropsType } from '../controller/tileItemController';
import { zoomButton } from '../extention/zoomButton';
import { configData, GameEvent } from '../manager/configData';
import { ccTools } from '../extention/generalTools';
import { gm } from '../manager/gm';
import { pData } from '../manager/playerData';
import { produceType } from './tips/produceTips';
import { playerMgr } from '../manager/playerManager';
import { videoMgr } from '../manager/videoManager';
import { doorProps } from '../controller/props/doorProps';
const { ccclass, property } = _decorator;

@ccclass('UIProps')
export class UIProps extends UIBase {
    @property(Node)
    bg: Node = null;

    @property(Node)
    propsLayout: Node = null;

    @property(Label)
    titleLab: Label = null;

    @property(Prefab)
    propsItemPre: Prefab = null;

    /**当前瓦片位置 */
    tilePos: Vec2 = new Vec2();
    /**当前目标位置 */
    targetPos: Vec3 = new Vec3();
    /**道具组件 */
    propsComp: gamePropsBase = null;
    /**是否有移除道具 */
    hasRemoveProps: boolean = false;
    /**是否已经满级 */
    isMaxLevel: boolean = false;
    /**是否为敌人置灰后的道具 */
    isGrayProps: boolean = false;

    protected onLoad(): void {
        this.bindBtn();
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        gm.Event.on(GameEvent.refreshGameMonetary, this.refreshPropsBtnState, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.refreshGameMonetary, this.refreshPropsBtnState, this);
    }

    onUI_Open(data) {
        this.initData(data);
    }

    initData(data) {
        if (data) {
            this.targetPos.set(data.pos);
            this.tilePos.set(data.tilePos);
            this.propsComp = data.propsComp;
            this.isGrayProps = !!data.isGrayProps;
        }
        this.checkPropsStatus();

        this.refreshTitle();
        this.refreshPage();
    }

    bindBtn() {

    }

    /**检测道具状态 */
    checkPropsStatus() {
        if (this.isGrayProps) {
            this.hasRemoveProps = true;
            this.isMaxLevel = true;
            return;
        }

        this.hasRemoveProps = true;
        let type: tilePropsType = this.propsComp.propsType;
        if (type == tilePropsType.door || type == tilePropsType.bed) {
            this.hasRemoveProps = false;
        }
        this.isMaxLevel = this.propsComp.isMaxLevel;
    }

    /**刷新标题 */
    refreshTitle() {
        if (this.isGrayProps) {
            this.titleLab.fontSize = 60;
            this.titleLab.lineHeight = 60;
            this.titleLab.string = "摧毁";
            return;
        }

        if (this.isMaxLevel) {
            this.titleLab.fontSize = 20;
            this.titleLab.lineHeight = 30;
            let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
            this.titleLab.string = propsData.desc;
        } else {
            this.titleLab.fontSize = 60;
            this.titleLab.lineHeight = 60;
            this.titleLab.string = "升级";
        }
    }

    /**刷新页面 */
    refreshPage() {
        if (this.propsLayout.children.length == 0) {
            for (let i = 0; i < 3; i++) {
                let propsItem = instantiate(this.propsItemPre);
                this.propsLayout.addChild(propsItem);
                let buyBtn = propsItem.getChildByName("buyBtn");
                if (i == 0) {
                    buyBtn.addComponent(zoomButton).onClick = this.clickUpgradeProps.bind(this);
                } else if (i == 1) {
                    buyBtn.addComponent(zoomButton).onClick = this.clickRemoveProps.bind(this);
                } else if (i == 2) {
                    buyBtn.addComponent(zoomButton).onClick = this.clickAdUpgradeDoorProps.bind(this);
                }
            }
        }

        this.propsLayout.children[0].active = !this.isMaxLevel && !this.isGrayProps;
        this.propsLayout.children[1].active = this.hasRemoveProps;
        //有次数且是门
        this.propsLayout.children[2].active = !this.isGrayProps && pData.adUpgradeDoorCount > 0 && this.propsComp.propsType == tilePropsType.door;

        let propsLength = 0;

        let level = this.propsComp.level + 1;
        if (level > this.propsComp.maxLevel) {
            level = this.propsComp.maxLevel;
        }

        let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
        let nextPropsData = propsConfig.getPropsData(this.propsComp.propsType)[level];
        for (let i = 0; i < 3; i++) {
            let propsItem = this.propsLayout.children[i];
            if (!propsItem.active) {
                continue;
            }
            propsLength++;

            let propsImg = propsItem.getChildByName("propsImg").getComponent(Sprite);
            let desLab = propsItem.getChildByName("desLab").getComponent(Label);
            let nameLab = propsItem.getChildByName("nameLab").getComponent(Label);
            let buyBtn = propsItem.getChildByName("buyBtn");
            let limitLab = buyBtn.getChildByName("limitLab").getComponent(Label);
            let buyBg = buyBtn.getChildByName("bg");
            let grayBg = buyBg.getChildByName("gray");
            let normalBg = buyBg.getChildByName("normal");
            let adBg = buyBg.getChildByName("ad");
            let buyLayout = buyBtn.getChildByName("layout");
            let coinLayout = buyLayout.getChildByName("coinNumLayout");
            let powerLayout = buyLayout.getChildByName("powerNumLayout");
            let coinNumLab = coinLayout.getChildByName("numLab").getComponent(Label);
            let powerNumLab = powerLayout.getChildByName("numLab").getComponent(Label);
            let numNode = propsItem.getChildByName("numNode");

            numNode.active = false;
            let powerNum = 0;
            let coinNum = 0;
            limitLab.string = "";

            if (i == 0 && nextPropsData.preConditions) {
                desLab.fontSize = 25;
                desLab.lineHeight = 30;
            } else {
                desLab.fontSize = 36;
                desLab.lineHeight = 40;
            }

            buyLayout.active = i != 2;
            if (i == 0) {
                powerNum = nextPropsData.power;
                coinNum = nextPropsData.coin;

                desLab.string = nextPropsData.desc;

                if (nextPropsData.preConditions) {
                    let conditionData = JSON.parse(nextPropsData.preConditions);
                    for (let condition of conditionData) {
                        let nameStr = propsConfig.getPropsData(condition[0])[Number(condition[1]) - 1].name;
                        desLab.string += "\n前置:" + nameStr;
                    }
                }
                coinNumLab.string = coinNum + "";
                powerNumLab.string = powerNum + "";
                nameLab.string = nextPropsData.name;
                ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + nextPropsData.propsType + "_" + nextPropsData.level);
                this.refreshBuyBtnState(buyBtn, nextPropsData);
            } else if (i == 1) {
                powerNum = this.getRemoveRewardPower(propsData);
                coinNum = this.getRemoveRewardCoin(propsData);

                grayBg.active = true;
                normalBg.active = false;
                adBg.active = false;
                //第二个默认是拆除
                desLab.string = "回收当前建筑，并返回一定的资源。";
                coinNumLab.string = "+" + coinNum;
                powerNumLab.string = "+" + powerNum;
                nameLab.string = "回收";
                ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + "remove");
            } else if (i == 2) {
                //广告升级门
                grayBg.active = false;
                normalBg.active = false;
                adBg.active = true;

                desLab.string = nextPropsData.desc + "\n提示:只有一次使用机会哦!!!";

                nameLab.string = "房门升级卡";
                ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + nextPropsData.propsType + "_" + nextPropsData.level);
            }

            if (powerNum > 0 && coinNum > 0) {
                //全部支付
                coinLayout.active = true;
                powerLayout.active = true;
                coinLayout.scale = new Vec3(0.6, 0.6, 1);
                powerLayout.scale = new Vec3(0.6, 0.6, 1);
            } else if (powerNum > 0) {
                //电能支付
                coinLayout.active = false;
                powerLayout.active = true;
                coinLayout.scale = new Vec3(1, 1, 1);
                powerLayout.scale = new Vec3(1, 1, 1);
            } else {
                //金币支付
                coinLayout.active = true;
                powerLayout.active = false;
                coinLayout.scale = new Vec3(1, 1, 1);
                powerLayout.scale = new Vec3(1, 1, 1);
            }
        }


        let addOffset = 139;

        let height = 131 + addOffset * propsLength;

        let bgTrans = this.bg.getComponent(UITransform);
        bgTrans.setContentSize(bgTrans.width, height);

        let posY = this.targetPos.y + (height / 2 + configData.tileSize + 15) * (this.targetPos.y < 0 ? 1 : -1);

        this.bg.setPosition(new Vec3(this.bg.position.x, posY, 0));
    }

    /**刷新按钮状态 */
    refreshPropsBtnState() {
        if (this.isMaxLevel || !this.propsComp || !this.propsComp.isValid) {
            return;
        }

        let upgradeItem = this.propsLayout.children[0];
        if (!upgradeItem || !upgradeItem.active) {
            return;
        }

        let level = this.propsComp.level + 1;
        if (level > this.propsComp.maxLevel) {
            level = this.propsComp.maxLevel;
        }

        let nextPropsData = propsConfig.getPropsData(this.propsComp.propsType)[level];
        this.refreshBuyBtnState(upgradeItem.getChildByName("buyBtn"), nextPropsData);
    }

    /**刷新购买按钮状态 */
    private refreshBuyBtnState(buyBtn: Node, propsData: any) {
        if (!buyBtn || !propsData) {
            return;
        }

        let buyBg = buyBtn.getChildByName("bg");
        let grayBg = buyBg.getChildByName("gray");
        let normalBg = buyBg.getChildByName("normal");
        let adBg = buyBg.getChildByName("ad");
        let canBuy = ccTools.checkCanBuy(propsData);
        grayBg.active = !canBuy;
        normalBg.active = canBuy;
        adBg.active = false;
    }

    ///
    ///点击事件
    ///

    /**升级道具 */
    clickUpgradeProps() {
        this.onClose();
        if (this.isMaxLevel || !this.propsComp || !this.propsComp.isValid) {
            return;
        }

        let level = this.propsComp.level + 1;
        if (level > this.propsComp.maxLevel) {
            level = this.propsComp.maxLevel;
        }

        let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
        let nextPropsData = propsConfig.getPropsData(this.propsComp.propsType)[level];

        if (nextPropsData.preConditions) {
            let conditionData = JSON.parse(nextPropsData.preConditions);
            for (let condition of conditionData) {
                let level = Number(condition[1] - 1);
                let conditionPropsData = propsConfig.getPropsData(condition[0])[level];
                let type = conditionPropsData.propsType;
                if (!this.hasRoomPropsByTypeAndLevel(type, level)) {
                    let propsName = conditionPropsData.name || "前置建筑";
                    uiMgr.showTips(`需要${propsName}`);
                    return;
                }
            }
        }

        if (nextPropsData.coin > 0 && nextPropsData.coin > pData.gameCoin) {
            uiMgr.showTips("金币不足");
        }
        else if (nextPropsData.power > 0 && nextPropsData.power > pData.gamePower) {
            uiMgr.showTips("电能不足");
        }
        else {
            this.propsComp.upgradeProps();
            //扣除金币
            if (nextPropsData.coin > 0) {
                pData.fixGameCoin(-nextPropsData.coin);
            }
            //扣除电能
            if (nextPropsData.power > 0) {
                pData.fixGamePower(-nextPropsData.power);
            }
        }
    }

    /**检测玩家房间内是否有指定类型和等级的道具 */
    private hasRoomPropsByTypeAndLevel(propsType: string, level: number) {
        let roomIdx = playerMgr.playerComp?.roomIdx || 0;
        if (roomIdx <= 0) {
            return false;
        }

        let roomData = this.propsComp.gameComp.roomMap[roomIdx];
        let roomArr: Vec2[] = roomData?.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let tileComp = this.propsComp.gameComp.tileMap[tilePos.x]?.[tilePos.y]?.item;
            let propComp = tileComp?.propsComp;
            if (propComp && propComp.propsType == propsType && propComp.level >= level) {
                return true;
            }
        }

        return false;
    }

    ///
    ///点击升级门
    ///

    /**拆除道具 */
    clickRemoveProps() {
        //将当前材料的一半返回

        let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
        let rewardCoin = this.getRemoveRewardCoin(propsData);
        let rewardPower = this.getRemoveRewardPower(propsData);
        //增加金币
        if (rewardCoin > 0) {
            pData.fixGameCoin(rewardCoin);
            this.propsComp.produceItem(produceType.coin, rewardCoin);
        }
        //增加电能
        if (rewardPower > 0) {
            pData.fixGamePower(rewardPower);
            this.propsComp.produceItem(produceType.power, rewardPower);
        }

        //移除道具
        this.propsComp.removeProps();
        this.onClose();
    }

    /**获取拆除金币返还 */
    private getRemoveRewardCoin(propsData: any) {
        if (this.propsComp?.isSpecialSellProps) {
            return 1;
        }

        return (Number(propsData?.coin) || 0) / 2;
    }

    /**获取拆除电能返还 */
    private getRemoveRewardPower(propsData: any) {
        if (this.propsComp?.isSpecialSellProps) {
            return 0;
        }

        return (Number(propsData?.power) || 0) / 2;
    }

    /**广告升级门 */
    clickAdUpgradeDoorProps() {
        if (pData.adUpgradeDoorCount <= 0) {
            uiMgr.showTips("广告升级门次数不足");
            return;
        }

        videoMgr.watchVideo(68, () => {
            pData.adUpgradeDoorCount--;
            (this.propsComp as doorProps).upgradePropsAd();
            this.onClose();
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIProps);
    }
}


