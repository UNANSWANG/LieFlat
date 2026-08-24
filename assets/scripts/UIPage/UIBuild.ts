import { tilePropsType } from "../controller/tileItemController";
import { ccTools } from "../extention/generalTools";
import { zoomButton } from "../extention/zoomButton";
import { propsConfig } from "../json/jsonProps";
import { configData, GameEvent } from "../manager/configData";
import { gm } from "../manager/gm";
import { imgPath, spinePath, UIPath } from "../manager/pathConfig";
import { pData } from "../manager/playerData";
import { playerMgr } from "../manager/playerManager";
import { poolMgr } from "../manager/poolManager";
import { uiMgr } from "../manager/UIManager";
import { videoMgr } from "../manager/videoManager";
import { UIBase } from "./UIBase";
import type { UIGame } from "./UIGame";
const { ccclass, property } = _decorator;
import { _decorator, instantiate, Label, Node, Prefab, Sprite, UITransform, Vec2, Vec3 } from 'cc';

@ccclass('UIBuild')
export class UIBuild extends UIBase {
    @property(Node)
    bg: Node = null;

    @property(Node)
    btnLayout: Node = null;

    @property(Node)
    propsLayout: Node = null;

    @property(Prefab)
    propsItemPre: Prefab = null;


    /**当前页签 */
    currentIdx: number = 0;
    /**分类道具数组 基础，赚钱，高科技，黑科技，工坊 */
    propsTypeArr: any[][] = null;
    /**当前瓦片位置 */
    tilePos: Vec2 = new Vec2();
    /**当前目标位置 */
    targetPos: Vec3 = new Vec3();
    /**当前页面道具数据 */
    currentPropsDataArr: any[] = [];
    /**当前房间数据 */
    roomData: any = null;
    /**当前首次建造引导指定的建筑类型 */
    private guideBuildPropsType: tilePropsType = tilePropsType.none;
    /**游戏界面组件，用于同步引导状态与摄像机比例 */
    private gameComp: UIGame = null;
    /**引导建筑购买按钮上的点击手指 */
    private guideBuildBuyClickNode: Node = null;

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
        gm.Event.on(GameEvent.refreshGameCamera, this.refreshGuideBuildBuyClickScale, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.refreshGameMonetary, this.refreshPropsBtnState, this);
        gm.Event.off(GameEvent.refreshGameCamera, this.refreshGuideBuildBuyClickScale, this);
    }

    onUI_Open(data) {
        this.initData(data);
    }

    onUI_Close() {
        this.clearGuideBuildBuyClickNode();
        if (this.guideBuildPropsType != tilePropsType.none) {
            this.gameComp?.onGuideBuildUIClosed(this.guideBuildPropsType);
        }
        this.guideBuildPropsType = tilePropsType.none;
        this.gameComp = null;
    }

    initData(data) {
        this.guideBuildPropsType = data?.guideBuildPropsType || tilePropsType.none;
        this.gameComp = data?.gameComp || null;
        if (this.guideBuildPropsType != tilePropsType.none && !this.gameComp?.shouldShowGuideBuild(this.guideBuildPropsType)) {
            this.guideBuildPropsType = tilePropsType.none;
        }
        if (data) {
            this.targetPos.set(data.pos);
            this.tilePos.set(data.tilePos);
            this.roomData = data.roomData;
        }
        if (!this.propsTypeArr || this.propsTypeArr.length == 0) {
            this.initPropsData();
        }
        if (this.guideBuildPropsType != tilePropsType.none) {
            this.gameComp?.onGuideBuildUIOpened(this.guideBuildPropsType);
            this.currentIdx = this.getGuideBuildTabIdx();
        }

        this.SDKAdReport();
        this.refreshPage();
    }

    bindBtn() {
        this.btnLayout.children.forEach((item, idx) => {
            item.addComponent(zoomButton).onClick = this.clickTabBtn.bind(this, idx);
        });
    }

    /**初始化道具数据 */
    initPropsData() {
        let propsData = propsConfig.getAllTable();
        this.propsTypeArr = [[], [], [], [], []];

        Object.values(propsData).forEach((item) => {
            let propsItem = item[0];
            let type = propsItem.propsType;
            let buildType = propsItem.buildType;

            if (buildType > 0 && buildType <= this.propsTypeArr.length && this.propsTypeArr[buildType - 1].indexOf(type) < 0) {
                if (type == "vein") {
                    let pointerData = propsConfig.getPropsData(type);
                    for (let i = 0; i < pointerData.length; i++) {
                        this.propsTypeArr[buildType - 1].push({ type: type, level: i });
                    }
                } else {
                    this.propsTypeArr[buildType - 1].push({ type: type, level: 0 });
                }
            }
        });
    }

    /**刷新页面 */
    refreshPage() {
        this.currentPropsDataArr = [];
        //刷新按钮
        for (let i = 0; i < this.btnLayout.children.length; i++) {
            this.btnLayout.children[i].getChildByName("select").active = i == this.currentIdx;
        }
        let currentPropsTypeArr = this.propsTypeArr?.[this.currentIdx] || [];
        let propsLength = currentPropsTypeArr.length;
        //将已有道具项隐藏起来
        for (let i = 0; i < this.propsLayout.children.length; i++) {
            this.propsLayout.children[i].active = false;
        }

        for (let i = 0; i < propsLength; i++) {
            let propsItem = this.propsLayout.children[i];
            if (!propsItem) {
                propsItem = instantiate(this.propsItemPre);
                this.propsLayout.addChild(propsItem);
            }

            propsItem.active = true;

            let propsTypeData = propsConfig.getPropsData(currentPropsTypeArr[i].type);
            let propsData = null;
            let level = currentPropsTypeArr[i].level;

            propsData = propsTypeData[level];

            this.currentPropsDataArr.push(propsData);

            let propsImg = propsItem.getChildByName("propsImg").getComponent(Sprite);
            let desLab = propsItem.getChildByName("desLab").getComponent(Label);
            let nameLab = propsItem.getChildByName("nameLab").getComponent(Label);
            let numNode = propsItem.getChildByName("numNode");
            let numLab = numNode.getChildByName("numLab").getComponent(Label);
            let buyBtn = propsItem.getChildByName("buyBtn");
            let adBtn = propsItem.getChildByName("adBtn");
            let buyLayout = buyBtn.getChildByName("layout");
            let coinLayout = buyLayout.getChildByName("coinNumLayout");
            let powerLayout = buyLayout.getChildByName("powerNumLayout");
            let limitLab = buyBtn.getChildByName("limitLab").getComponent(Label);
            let coinNumLab = coinLayout.getChildByName("numLab").getComponent(Label);
            let powerNumLab = powerLayout.getChildByName("numLab").getComponent(Label);

            let buildPrice = this.getBuildPrice(propsData);
            let powerNum = buildPrice.power;
            let coinNum = buildPrice.coin;
            let isStoreProps = this.isStoreProps(propsData);
            let propsNum = this.getStorePropsNum(propsData);
            let propsNumText = propsNum < 100 ? propsNum + "" : "99+";

            numNode.active = isStoreProps && propsNum > 0;
            numLab.string = propsNumText;
            buyBtn.active = !isStoreProps || propsNum > 0;
            adBtn.active = isStoreProps && propsNum <= 0;

            if (propsData.builNumMax && propsData.builNumMax > 0) {
                let buildCount = this.getPropsBuildLimitCount(propsData);
                limitLab.string = `可建造 ${buildCount}/${propsData.builNumMax}`;
            } else {
                limitLab.string = "";
            }

            this.refreshBuyBtnState(buyBtn, propsData);

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

            desLab.fontSize = 36;
            desLab.lineHeight = 40;

            desLab.string = propsData.desc;
            coinNumLab.string = coinNum + "";
            powerNumLab.string = powerNum + "";
            nameLab.string = propsData.name;
            ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + currentPropsTypeArr[i].type + "_" + propsData.level);

            let btnComp = buyBtn.getComponent(zoomButton) || buyBtn.addComponent(zoomButton);
            let adBtnComp = adBtn.getComponent(zoomButton) || adBtn.addComponent(zoomButton);
            btnComp.onClick = this.clickBuyBtn.bind(this, i);
            adBtnComp.onClick = this.clickAdBtn.bind(this, i);
        }

        let addOffset = 180;

        let height = 210 + addOffset * propsLength + (6 * (propsLength - 1));

        let bgTrans = this.bg.getComponent(UITransform);
        bgTrans.setContentSize(bgTrans.width, height);

        let posY = this.targetPos.y + (height / 2 + configData.tileSize + 15) * (this.targetPos.y < 0 ? 1 : -1);

        this.bg.setPosition(new Vec3(this.bg.position.x, posY, 0));
        this.refreshGuideBuildBuyClickNode();
    }

    /**获取当前引导建筑所在页签 */
    private getGuideBuildTabIdx() {
        for (let i = 0; i < this.propsTypeArr.length; i++) {
            if (this.propsTypeArr[i].some((item) => item.type == this.guideBuildPropsType)) {
                return i;
            }
        }

        return 0;
    }

    /**刷新引导建筑购买按钮上的点击手指 */
    private refreshGuideBuildBuyClickNode() {
        this.clearGuideBuildBuyClickNode();
        if (this.guideBuildPropsType == tilePropsType.none
            || !this.gameComp?.shouldShowGuideBuild(this.guideBuildPropsType) || !uiMgr.gameSpineItemPrefab) {
            return;
        }

        let guidePropsIdx = this.currentPropsDataArr.findIndex((item) => item?.propsType == this.guideBuildPropsType);
        let propsItem = this.propsLayout.children[guidePropsIdx];
        let buyBtn = guidePropsIdx >= 0 && propsItem?.active ? propsItem.getChildByName("buyBtn") : null;
        if (!buyBtn?.active) {
            return;
        }

        this.createGuideBuildBuyClickNode(buyBtn);
    }

    /**在UI_2D层的引导建筑购买按钮上创建点击手指 */
    private async createGuideBuildBuyClickNode(buyBtn: Node) {
        let clickNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.guideBuildBuyClickNode = clickNode;
        clickNode.name = "guideBuildBuyClick";
        clickNode.layer = buyBtn.layer;
        buyBtn.addChild(clickNode);
        clickNode.setPosition(60, 0, 0);
        this.refreshGuideBuildBuyClickScale();

        let skeleton = poolMgr.getGameNodeSkeleton(clickNode);
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.click);
        if (!isLoaded || clickNode != this.guideBuildBuyClickNode || this.guideBuildPropsType == tilePropsType.none
            || !this.gameComp?.shouldShowGuideBuild(this.guideBuildPropsType)) {
            if (clickNode == this.guideBuildBuyClickNode) {
                this.clearGuideBuildBuyClickNode();
            }
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**按游戏摄像机与UI摄像机的视角比例缩放UI手指 */
    private refreshGuideBuildBuyClickScale() {
        if (!this.guideBuildBuyClickNode?.isValid) {
            return;
        }

        let scale = this.gameComp?.gameToUIViewScale || 1;
        this.guideBuildBuyClickNode.setScale(scale, scale, 1);
    }

    /**清理引导建筑购买按钮上的点击手指 */
    private clearGuideBuildBuyClickNode() {
        if (this.guideBuildBuyClickNode?.isValid) {
            poolMgr.putGameSpineNode(this.guideBuildBuyClickNode);
        }

        this.guideBuildBuyClickNode = null;
    }

    /**显示建造引导期间的限制提示 */
    private showGuideBuildLimitTips() {
        uiMgr.showTips("请先完成新手引导");
    }

    /**刷新按钮状态 */
    refreshPropsBtnState() {
        for (let i = 0; i < this.currentPropsDataArr.length; i++) {
            let propsItem = this.propsLayout.children[i];
            if (!propsItem || !propsItem.active) {
                continue;
            }

            this.refreshBuyBtnState(propsItem.getChildByName("buyBtn"), this.currentPropsDataArr[i]);
        }
    }

    /**刷新购买按钮状态 */
    private refreshBuyBtnState(buyBtn: Node, propsData: any) {
        if (!buyBtn || !propsData) {
            return;
        }

        let buyBg = buyBtn.getChildByName("bg");
        let grayBg = buyBg.getChildByName("gray");
        let normalBg = buyBg.getChildByName("normal");
        let canBuy = ccTools.checkCanBuy(this.getBuildPrice(propsData)) && !this.isBuildNumLimit(propsData) && this.hasStorePropsNum(propsData);
        grayBg.active = !canBuy;
        normalBg.active = canBuy;
    }

    /**获取建造价格 */
    private getBuildPrice(propsData: any) {
        let buildPrice = {
            coin: Number(propsData?.coin) || 0,
            power: Number(propsData?.power) || 0,
        };
        if (propsData?.propsType != tilePropsType.box || !propsData.priceArray) {
            return buildPrice;
        }

        let priceArray = [];
        try {
            priceArray = JSON.parse(propsData.priceArray);
        } catch (error) {
            console.error("魔盒建造价格配置解析失败", propsData.priceArray, error);
            return buildPrice;
        }

        if (!Array.isArray(priceArray) || priceArray.length == 0) {
            return buildPrice;
        }

        let buildCount = this.getPropsBuildLimitCount(propsData);
        let currentPrice = priceArray[Math.min(buildCount, priceArray.length - 1)];
        if (!Array.isArray(currentPrice)) {
            return buildPrice;
        }

        buildPrice.coin = 0;
        buildPrice.power = 0;
        currentPrice.forEach((priceItem) => {
            if (!Array.isArray(priceItem) || priceItem.length < 2) {
                return;
            }

            if (priceItem[0] == "coin") {
                buildPrice.coin = Number(priceItem[1]) || 0;
            } else if (priceItem[0] == "power") {
                buildPrice.power = Number(priceItem[1]) || 0;
            }
        });
        return buildPrice;
    }

    /**是否为商城数量限制道具 */
    private isStoreProps(propsData: any) {
        return propsData?.hasOwnProperty("storeType") && propsData.storeType > 0;
    }

    /**获取商城数量限制道具的数量 */
    private getStorePropsNum(propsData: any) {
        if (!this.isStoreProps(propsData)) {
            return 0;
        }

        return pData.getLevelPropsNum(propsData.propsType, propsData.level);
    }

    /**是否拥有商城数量限制道具 */
    private hasStorePropsNum(propsData: any) {
        return !this.isStoreProps(propsData) || this.getStorePropsNum(propsData) > 0;
    }

    /**获取当前房间内指定类型道具数量 */
    private getRoomPropsBuildCount(propsData: any) {
        if (!this.roomData || !propsData) {
            return 0;
        }

        return this.roomData.propsCountMap?.[propsData.propsType] || 0;
    }

    /**获取用于建造上限判断的数量 */
    private getPropsBuildLimitCount(propsData: any) {
        if (!propsData) {
            return 0;
        }

        if (propsData.propsType == tilePropsType.box) {
            return playerMgr.playerComp?.getGamePropsBuildCountByType(propsData.propsType) || 0;
        }

        return this.getRoomPropsBuildCount(propsData);
    }

    /**是否达到当前房间建造数量上限 */
    private isBuildNumLimit(propsData: any) {
        if (!propsData?.builNumMax || propsData.builNumMax <= 0) {
            return false;
        }

        return this.getPropsBuildLimitCount(propsData) >= propsData.builNumMax;
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(68);
        videoMgr.SDKAdShow(65);
    }

    ///
    ///点击事件
    ///

    /**点击页签按钮 */
    clickTabBtn(idx: number) {
        if (idx == this.currentIdx) {
            return;
        }

        if (this.guideBuildPropsType != tilePropsType.none) {
            this.showGuideBuildLimitTips();
            return;
        }

        if (!this.propsTypeArr?.[idx] || this.propsTypeArr[idx].length == 0) {
            uiMgr.showTips("暂无道具");
            return;;
        }
        this.currentIdx = idx;
        this.refreshPage();
    }

    /**点击购买按钮 */
    clickBuyBtn(idx: number) {
        let curData = this.currentPropsDataArr[idx];
        if (this.guideBuildPropsType != tilePropsType.none && curData?.propsType != this.guideBuildPropsType) {
            this.showGuideBuildLimitTips();
            return;
        }

        let buildPrice = this.getBuildPrice(curData);
        if (this.isBuildNumLimit(curData)) {
            uiMgr.showTips("建造数量已达上限");
        } else if (!this.hasStorePropsNum(curData)) {
            uiMgr.showTips("道具数量不足");
        } else if (buildPrice.coin > 0 && buildPrice.coin > pData.gameCoin) {
            uiMgr.showTips("金币不足");
        } else if (buildPrice.power > 0 && buildPrice.power > pData.gamePower) {
            uiMgr.showTips("电能不足");
        } else {
            if (this.guideBuildPropsType != tilePropsType.none && curData.propsType == this.guideBuildPropsType) {
                this.gameComp?.completeGuideBuild(this.guideBuildPropsType);
            }
            this.onClose();
            //扣除金币
            if (buildPrice.coin > 0) {
                pData.fixGameCoin(-buildPrice.coin);
            }
            //扣除电能
            if (buildPrice.power > 0) {
                pData.fixGamePower(-buildPrice.power);
            }
            if (this.isStoreProps(curData)) {
                pData.fixLevelPropsNum(curData.propsType, curData.level, -1);
            }
            gm.Event.emit(GameEvent.createProps, this.tilePos, curData.propsType as tilePropsType, curData.level);
        }
    }

    /**点击广告按钮 */
    clickAdBtn(idx: number) {
        if (this.guideBuildPropsType != tilePropsType.none) {
            this.showGuideBuildLimitTips();
            return;
        }

        let curData = this.currentPropsDataArr[idx];
        if (!this.isStoreProps(curData) || this.getStorePropsNum(curData) > 0) {
            return;
        }

        let videoId = 68;
        if(curData.propsType == tilePropsType.box){
            videoId = 65;
        }

        videoMgr.watchVideo(videoId, () => {
            pData.fixLevelPropsNum(curData.propsType, curData.level);
            uiMgr.showTips(`获取${curData.name}*1`);
            this.refreshPage();
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIBuild);
    }
}
