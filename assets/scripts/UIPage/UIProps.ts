import { _decorator, instantiate, Label, Node, Prefab, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { UIBase } from './UIBase';
import { audioPath, imgPath, spinePath, UIPath } from '../manager/pathConfig';
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
import { videoMgr } from '../manager/videoManager';
import { doorProps } from '../controller/props/doorProps';
import { poolMgr } from '../manager/poolManager';
import { bedProps } from '../controller/props/bedProps';
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
    /**升级按钮上的点击手指 */
    private guideUpgradeClickNode: Node = null;

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
        gm.Event.on(GameEvent.refreshGameCamera, this.refreshGuideUpgradeClickScale, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.refreshGameMonetary, this.refreshPropsBtnState, this);
        gm.Event.off(GameEvent.refreshGameCamera, this.refreshGuideUpgradeClickScale, this);
    }

    onUI_Open(data) {
        this.initData(data);
    }

    onUI_Close() {
        this.clearGuideUpgradeClickNode();
        let propsType = this.propsComp?.tileItemComp?.tileType;
        if (propsType == tilePropsType.door || propsType == tilePropsType.bed) {
            let guidePropsComp = this.propsComp as doorProps | bedProps;
            guidePropsComp.gameComp?.onGuideUpgradeUIClosed(guidePropsComp);
        }
    }

    initData(data) {
        if (data) {
            this.targetPos.set(data.pos);
            this.tilePos.set(data.tilePos);
            this.propsComp = data.propsComp;
            this.isGrayProps = !!data.isGrayProps;
        }
        if (!this.isPropsAvailable()) {
            this.onClose();
            return;
        }

        let propsType = this.propsComp?.tileItemComp?.tileType;
        if (propsType == tilePropsType.door || propsType == tilePropsType.bed) {
            let guidePropsComp = this.propsComp as doorProps | bedProps;
            guidePropsComp.gameComp?.onGuideUpgradeUIOpened(guidePropsComp);
        }
        this.checkPropsStatus();

        this.refreshTitle();
        this.refreshPage();
        this.SDKAdReport();
        this.refreshGuideUpgradeClickNode();
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

        this.titleLab.fontSize = 60;
        this.titleLab.lineHeight = 60;
        this.titleLab.string = "升级";
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
                    buyBtn.addComponent(zoomButton).onClick = this.clickAdRecoverDoorHp.bind(this);
                }
            }
        }

        this.propsLayout.children[0].active = !this.isGrayProps;
        this.propsLayout.children[1].active = this.hasRemoveProps;
        //是门就显示（血量回复卡不限次数）
        this.propsLayout.children[2].active = !this.isGrayProps && this.propsComp.propsType == tilePropsType.door;

        let propsLength = 0;

        let level = this.propsComp.level + 1;
        if (level > this.propsComp.maxLevel) {
            level = this.propsComp.maxLevel;
        }

        let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
        let nextPropsData = this.getUpgradePropsData(propsData, propsConfig.getPropsData(this.propsComp.propsType)[level]);
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
            let maxNode = propsItem.getChildByName("max");
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
            let isMaxPropsItem = i == 0 && this.isMaxLevel;

            numNode.active = false;
            buyBtn.active = !isMaxPropsItem;
            maxNode.active = isMaxPropsItem;
            let powerNum = 0;
            let coinNum = 0;
            limitLab.string = "";

            if (i == 0 && !isMaxPropsItem && nextPropsData.preConditions) {
                desLab.fontSize = 25;
                desLab.lineHeight = 30;
            } else if (i == 2) {
                desLab.fontSize = 30;
                desLab.lineHeight = 35;
            } else {
                desLab.fontSize = 36;
                desLab.lineHeight = 40;
            }

            buyLayout.active = i != 2;
            if (i == 0) {
                let displayPropsData = isMaxPropsItem ? propsData : nextPropsData;
                powerNum = displayPropsData.power;
                coinNum = displayPropsData.coin;

                desLab.string = displayPropsData.desc;

                if (!isMaxPropsItem && displayPropsData.preConditions) {
                    let conditionData = JSON.parse(displayPropsData.preConditions);
                    for (let condition of conditionData) {
                        let nameStr = propsConfig.getPropsData(condition[0])[Number(condition[1]) - 1].name;
                        desLab.string += "\n前置:" + nameStr;
                    }
                }
                coinNumLab.string = coinNum + "";
                powerNumLab.string = powerNum + "";
                nameLab.string = displayPropsData.name;
                ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + displayPropsData.propsType + "_" + displayPropsData.level);
                if (!isMaxPropsItem) {
                    this.refreshBuyBtnState(buyBtn, displayPropsData);
                }
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
                //广告回复房门血量
                grayBg.active = false;
                normalBg.active = false;
                adBg.active = true;

                //满级时无下一级数据，回退使用当前级数据
                let cardPropsData = nextPropsData || propsData;
                desLab.string = cardPropsData.desc + "\n提示：震慑感染者!!!";

                nameLab.string = "血量回复卡";
                ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + cardPropsData.propsType + "_" + cardPropsData.level);
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


        let addOffset = 180;

        let height = 131 + addOffset * propsLength + (6 * (propsLength - 1));

        let bgTrans = this.bg.getComponent(UITransform);
        bgTrans.setContentSize(bgTrans.width, height);

        let posY = this.targetPos.y + (height / 2 + configData.tileSize + 15) * (this.targetPos.y < 0 ? 1 : -1);

        this.bg.setPosition(new Vec3(this.bg.position.x, posY, 0));
    }

    /**
     * 获取升级用的道具数据（价格已处理）。
     * 矿脉特殊处理：升级价格 = 下一级价格 - 当前等级价格的一半，其他建筑直接用下一级价格。
     */
    private getUpgradePropsData(propsData: any, nextPropsData: any) {
        if (!nextPropsData || this.propsComp?.propsType != tilePropsType.vein) {
            return nextPropsData;
        }

        //拷贝一份，避免修改到配置表数据
        let upgradePropsData = Object.assign({}, nextPropsData);
        upgradePropsData.coin = Math.max(0, Math.ceil((Number(nextPropsData.coin) || 0) - (Number(propsData?.coin) || 0) / 2));
        upgradePropsData.power = Math.max(0, Math.ceil((Number(nextPropsData.power) || 0) - (Number(propsData?.power) || 0) / 2));
        return upgradePropsData;
    }

    /**刷新按钮状态 */
    refreshPropsBtnState() {
        if (!this.isPropsAvailable()) {
            this.onClose();
            return;
        }

        this.refreshGuideUpgradeClickNode();
        if (this.isMaxLevel) {
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

        let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
        let nextPropsData = this.getUpgradePropsData(propsData, propsConfig.getPropsData(this.propsComp.propsType)[level]);
        this.refreshBuyBtnState(upgradeItem.getChildByName("buyBtn"), nextPropsData);
    }

    /**刷新门或床升级按钮上的首次升级点击手指 */
    private refreshGuideUpgradeClickNode() {
        if (!pData.isGuide) {
            this.clearGuideUpgradeClickNode();
            return;
        }

        let guidePropsComp = this.getGuideUpgradePropsComp();
        if (!guidePropsComp) {
            this.clearGuideUpgradeClickNode();
            return;
        }

        if (this.guideUpgradeClickNode?.isValid) {
            return;
        }

        let upgradeItem = this.propsLayout.children[0];
        let buyBtn = upgradeItem?.active ? upgradeItem.getChildByName("buyBtn") : null;
        if (!buyBtn || !uiMgr.gameSpineItemPrefab) {
            return;
        }

        this.createGuideUpgradeClickNode(buyBtn, guidePropsComp);
    }

    /**在UI_2D层的升级按钮上创建点击手指 */
    private async createGuideUpgradeClickNode(buyBtn: Node, propsComp: doorProps | bedProps) {
        let clickNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.guideUpgradeClickNode = clickNode;
        clickNode.name = "guideUpgradeClick";
        clickNode.layer = buyBtn.layer;
        buyBtn.addChild(clickNode);
        clickNode.setPosition(60, 0, 0);
        this.refreshGuideUpgradeClickScale();

        let skeleton = poolMgr.getGameNodeSkeleton(clickNode);
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.click);
        if (!isLoaded || clickNode != this.guideUpgradeClickNode || !this.isGuideUpgradePropsComp(propsComp)) {
            if (clickNode == this.guideUpgradeClickNode) {
                this.clearGuideUpgradeClickNode();
            }
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**获取当前界面需要引导升级的门或床 */
    private getGuideUpgradePropsComp(): doorProps | bedProps {
        if (!this.isPropsAvailable()) {
            return null;
        }

        if (this.propsComp?.propsType == tilePropsType.door) {
            let doorComp = this.propsComp as doorProps;
            return doorComp.gameComp?.shouldShowGuideDoorUpgrade(doorComp) ? doorComp : null;
        }

        if (this.propsComp?.propsType == tilePropsType.bed) {
            let bedComp = this.propsComp as bedProps;
            return bedComp.gameComp?.shouldShowGuideBedUpgrade(bedComp) ? bedComp : null;
        }

        return null;
    }

    /**当前道具是否仍处于升级引导状态 */
    private isGuideUpgradePropsComp(propsComp: doorProps | bedProps) {
        if (!pData.isGuide) {
            return false;
        }

        return this.getGuideUpgradePropsComp() == propsComp;
    }

    /**按游戏摄像机与UI摄像机的视角比例缩放UI手指 */
    private refreshGuideUpgradeClickScale() {
        if (!this.guideUpgradeClickNode?.isValid) {
            return;
        }

        let scale = this.propsComp?.gameComp?.gameToUIViewScale || 1;
        this.guideUpgradeClickNode.setScale(scale, scale, 1);
    }

    /**清理升级按钮上的点击手指 */
    private clearGuideUpgradeClickNode() {
        if (this.guideUpgradeClickNode?.isValid) {
            poolMgr.putGameSpineNode(this.guideUpgradeClickNode);
        }

        this.guideUpgradeClickNode = null;
    }

    /**当前界面的道具是否仍然存在且未被替换 */
    private isPropsAvailable() {
        let tileItemComp = this.propsComp?.tileItemComp;
        return !!this.propsComp && this.propsComp.isValid
            && !!tileItemComp && tileItemComp.propsComp == this.propsComp;
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
        let canBuy = this.propsComp?.checkCanUpgrade(propsData) || false;
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
        if (this.isMaxLevel || !this.isPropsAvailable()) {
            return;
        }

        let level = this.propsComp.level + 1;
        if (level > this.propsComp.maxLevel) {
            level = this.propsComp.maxLevel;
        }

        let propsData = propsConfig.getPropsData(this.propsComp.propsType)[this.propsComp.level];
        let nextPropsData = this.getUpgradePropsData(propsData, propsConfig.getPropsData(this.propsComp.propsType)[level]);

        let unmetPreCondition = this.propsComp.getUnmetUpgradePreCondition(nextPropsData);
        if (unmetPreCondition) {
            uiMgr.showTips(`需要${unmetPreCondition.name || "前置建筑"}`);
            return;
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

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(68);
    }

    ///
    ///点击广告回复房门血量
    ///

    /**拆除道具 */
    clickRemoveProps() {
        if (!this.isPropsAvailable()) {
            this.onClose();
            return;
        }

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
        this.propsComp.removeProps(audioPath.buildSell);
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

    /**广告回复房门血量（不限次数） */
    clickAdRecoverDoorHp() {
        if (!this.isPropsAvailable()) {
            this.onClose();
            return;
        }

        let doorComp = this.propsComp as doorProps;
        if (doorComp.propsType != tilePropsType.door) {
            return;
        }

        if (doorComp.isHpFull) {
            uiMgr.showTips("房门血量已满");
            return;
        }

        videoMgr.watchVideo(68, () => {
            if (!this.isPropsAvailable()) {
                this.onClose();
                return;
            }

            (this.propsComp as doorProps).recoverHpAd();
            this.onClose();
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIProps);
    }
}


